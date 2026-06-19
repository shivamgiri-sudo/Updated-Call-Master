// backend/src/services/MetricsService.ts
import { RowDataPacket } from 'mysql2/promise';
import { pools } from '../config/database';
import { ProcessScope, BranchScope } from '../models/types';

interface DateFilter {
  from: string;  // YYYY-MM-DD
  to: string;    // YYYY-MM-DD
}

interface ScopeFilter {
  clientId: number;
  processCodes: ProcessScope;
  branchCodes: BranchScope;
  processCode?: string;
  branchCode?: string;
}

// Build WHERE clause fragments from scope + date
function buildScopeWhere(scope: ScopeFilter, alias = 's'): { where: string; params: any[] } {
  const conditions: string[] = [`${alias}.client_id = ?`];
  const params: any[] = [scope.clientId];

  // Explicit filter overrides role scope
  if (scope.processCode) {
    conditions.push(`${alias}.process_code = ?`);
    params.push(scope.processCode);
  } else if (scope.processCodes && scope.processCodes.length > 0) {
    conditions.push(`${alias}.process_code IN (${scope.processCodes.map(() => '?').join(',')})`);
    params.push(...scope.processCodes);
  }

  if (scope.branchCode) {
    conditions.push(`${alias}.branch_code = ?`);
    params.push(scope.branchCode);
  } else if (scope.branchCodes && scope.branchCodes.length > 0) {
    conditions.push(`${alias}.branch_code IN (${scope.branchCodes.map(() => '?').join(',')})`);
    params.push(...scope.branchCodes);
  }

  return { where: conditions.join(' AND '), params };
}

export class MetricsService {

  async getExecutiveSummary(scope: ScopeFilter, dates: DateFilter) {
    const { where, params } = buildScopeWhere(scope);

    const [rows] = await pools.app.query<RowDataPacket[]>(
      `SELECT
        SUM(total_calls)       AS totalCalls,
        SUM(inbound_calls)     AS inboundCalls,
        SUM(outbound_calls)    AS outboundCalls,
        SUM(connected_calls)   AS connectedCalls,
        SUM(conversion_count)  AS totalConversions,
        SUM(rejection_count)   AS totalRejections,
        SUM(total_revenue)     AS totalRevenue,
        AVG(avg_qa_score)      AS avgQaScore,
        AVG(avg_conversion_rate) AS avgConversionRate,
        SUM(critical_errors_count) AS criticalErrors
      FROM cm_executive_summary
      WHERE ${where}
        AND snapshot_date BETWEEN ? AND ?`,
      [...params, dates.from, dates.to]
    );

    const row = rows[0] || {};

    // Fetch previous period for trends
    const periodDays = this.daysBetween(dates.from, dates.to);
    const prevFrom = this.subtractDays(dates.from, periodDays);
    const prevTo = this.subtractDays(dates.to, periodDays);

    const [prevRows] = await pools.app.query<RowDataPacket[]>(
      `SELECT
        SUM(total_calls)       AS totalCalls,
        SUM(total_revenue)     AS totalRevenue,
        AVG(avg_conversion_rate) AS avgConversionRate,
        AVG(avg_qa_score)      AS avgQaScore
      FROM cm_executive_summary
      WHERE ${where}
        AND snapshot_date BETWEEN ? AND ?`,
      [...params, prevFrom, prevTo]
    );

    const prev = prevRows[0] || {};

    return {
      kpis: {
        totalCalls: Number(row.totalCalls || 0),
        totalRevenue: Number(row.totalRevenue || 0),
        avgConversion: Number(row.avgConversionRate || 0),
        avgQuality: Number(row.avgQaScore || 0),
        criticalInsights: Number(row.criticalErrors || 0),
        activeRisks: this.calcActiveRisks(row),
      },
      trends: {
        calls: this.calcTrend(row.totalCalls, prev.totalCalls),
        revenue: this.calcTrend(row.totalRevenue, prev.totalRevenue),
        conversion: this.calcTrend(row.avgConversionRate, prev.avgConversionRate),
        quality: this.calcTrend(row.avgQaScore, prev.avgQaScore),
      },
    };
  }

  async getProcessScorecard(scope: ScopeFilter, dates: DateFilter) {
    const { where, params } = buildScopeWhere(scope);

    const [rows] = await pools.app.query<RowDataPacket[]>(
      `SELECT
        process_code       AS processCode,
        branch_code        AS branchCode,
        SUM(total_calls)   AS calls,
        SUM(connected_calls) AS connected,
        AVG(avg_conversion_rate) AS conversion,
        SUM(rejection_count) * 100.0 / NULLIF(SUM(total_calls),0) AS rejection,
        AVG(avg_qa_score)  AS quality,
        SUM(total_revenue) AS revenue,
        SUM(critical_errors_count) AS criticalErrors
      FROM cm_executive_summary
      WHERE ${where}
        AND snapshot_date BETWEEN ? AND ?
      GROUP BY process_code, branch_code
      ORDER BY process_code, branch_code`,
      [...params, dates.from, dates.to]
    );

    return rows.map(r => ({
      processCode: r.processCode,
      branchCode: r.branchCode,
      calls: Number(r.calls || 0),
      connected: Number(r.connected || 0),
      conversion: Number(r.conversion || 0),
      rejection: Number(r.rejection || 0),
      quality: Number(r.quality || 0),
      revenue: Number(r.revenue || 0),
      risk: this.calcRiskLevel(r),
    }));
  }

  async getRevenueForecast(scope: ScopeFilter, dates: DateFilter) {
    const summary = await this.getExecutiveSummary(scope, dates);
    const days = this.daysBetween(dates.from, dates.to) || 1;
    const avgCallsPerDay = summary.kpis.totalCalls / days;
    const convRate = summary.kpis.avgConversion / 100;
    const totalConversions = summary.kpis.totalRevenue > 0
      ? summary.kpis.totalRevenue
      : 0;
    const avgTicket = totalConversions > 0 && summary.kpis.avgConversion > 0
      ? summary.kpis.totalRevenue / (summary.kpis.totalCalls * convRate || 1)
      : 4600;

    const workingDaysPerMonth = 22;
    const monthlyForecast = avgCallsPerDay * workingDaysPerMonth * convRate * avgTicket;

    return {
      current: {
        revenue: summary.kpis.totalRevenue,
        avgTicket: Math.round(avgTicket),
        conversionRate: summary.kpis.avgConversion,
      },
      forecast: {
        monthly: Math.round(monthlyForecast),
        quarterly: Math.round(monthlyForecast * 3),
        confidence: convRate > 0.1 ? 'high' : convRate > 0.05 ? 'medium' : 'low',
      },
      assumptions: {
        avgTicketSize: Math.round(avgTicket),
        conversionRate: summary.kpis.avgConversion,
        avgCallsPerDay: Math.round(avgCallsPerDay),
        workingDays: workingDaysPerMonth,
      },
    };
  }

  private calcTrend(current: any, previous: any) {
    const curr = Number(current || 0);
    const prev = Number(previous || 0);
    if (prev === 0) return { value: 0, direction: 'up' as const };
    const change = ((curr - prev) / prev) * 100;
    return {
      value: Math.abs(Math.round(change * 10) / 10),
      direction: change >= 0 ? 'up' as const : 'down' as const,
    };
  }

  private calcRiskLevel(row: any): 'low' | 'medium' | 'high' | 'critical' {
    const quality = Number(row.quality || 0);
    const conversion = Number(row.conversion || 0);
    if (quality < 60 || conversion < 5) return 'critical';
    if (quality < 70 || conversion < 10) return 'high';
    if (quality < 85 || conversion < 15) return 'medium';
    return 'low';
  }

  private calcActiveRisks(row: any): number {
    return Number(row.criticalErrors || 0);
  }

  private daysBetween(from: string, to: string): number {
    const d1 = new Date(from);
    const d2 = new Date(to);
    return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86400000));
  }

  private subtractDays(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  }
}

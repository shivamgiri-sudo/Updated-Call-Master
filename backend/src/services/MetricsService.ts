// backend/src/services/MetricsService.ts
import { RowDataPacket } from 'mysql2/promise';
import { pools } from '../config/database';

interface DateFilter {
  from: string; // YYYY-MM-DD
  to: string;
}

interface ScopeFilter {
  clientId: number;
  processCodes: string[] | null;
  branchCodes: string[] | null;
  processCode?: string;
  branchCode?: string;
}

function buildWhere(scope: ScopeFilter, dateAlias = 'call_date', processAlias = 'process_name', branchAlias = 'branch_short_name'): { where: string; params: any[] } {
  const conds: string[] = [`${dateAlias} BETWEEN ? AND ?`];
  const params: any[] = [];

  // date params added by caller — listed first
  if (scope.processCode) {
    conds.push(`${processAlias} = ?`);
    params.push(scope.processCode);
  } else if (scope.processCodes && scope.processCodes.length > 0) {
    conds.push(`${processAlias} IN (${scope.processCodes.map(() => '?').join(',')})`);
    params.push(...scope.processCodes);
  }

  if (scope.branchCode) {
    conds.push(`${branchAlias} = ?`);
    params.push(scope.branchCode);
  } else if (scope.branchCodes && scope.branchCodes.length > 0) {
    conds.push(`${branchAlias} IN (${scope.branchCodes.map(() => '?').join(',')})`);
    params.push(...scope.branchCodes);
  }

  return { where: conds.join(' AND '), params };
}

export class MetricsService {

  async getExecutiveSummary(scope: ScopeFilter, dates: DateFilter) {
    const { where, params } = buildWhere(scope);

    const [rows] = await pools.app.query<RowDataPacket[]>(
      `SELECT
        COUNT(*)                          AS totalCalls,
        SUM(is_critical_call)             AS criticalCalls,
        ROUND(AVG(quality_score), 2)      AS avgQuality,
        COUNT(DISTINCT process_name)      AS processCount,
        COUNT(DISTINCT branch_short_name) AS branchCount
       FROM v_call_master_unified_kpi
       WHERE ${where}`,
      [dates.from, dates.to, ...params]
    );

    // Previous period
    const days = this.daysBetween(dates.from, dates.to);
    const prevFrom = this.subtractDays(dates.from, days);
    const prevTo   = this.subtractDays(dates.to, days);

    const [prevRows] = await pools.app.query<RowDataPacket[]>(
      `SELECT
        COUNT(*)                     AS totalCalls,
        ROUND(AVG(quality_score), 2) AS avgQuality
       FROM v_call_master_unified_kpi
       WHERE ${where}`,
      [prevFrom, prevTo, ...params]
    );

    const row  = rows[0]  || {};
    const prev = prevRows[0] || {};

    return {
      kpis: {
        totalCalls:       Number(row.totalCalls      || 0),
        criticalCalls:    Number(row.criticalCalls   || 0),
        avgQuality:       Number(row.avgQuality      || 0),
        processCount:     Number(row.processCount    || 0),
        branchCount:      Number(row.branchCount     || 0),
      },
      trends: {
        calls:   this.calcTrend(row.totalCalls,  prev.totalCalls),
        quality: this.calcTrend(row.avgQuality,  prev.avgQuality),
      },
    };
  }

  async getProcessScorecard(scope: ScopeFilter, dates: DateFilter) {
    const { where, params } = buildWhere(scope);

    const [rows] = await pools.app.query<RowDataPacket[]>(
      `SELECT
        pm.process_code                          AS processCode,
        v.process_name                           AS processName,
        v.branch_short_name                      AS branchCode,
        COUNT(*)                                 AS calls,
        SUM(v.is_critical_call)                  AS criticalCalls,
        ROUND(AVG(v.quality_score), 2)           AS quality,
        COUNT(DISTINCT v.agent_employee_code)     AS agentCount,
        MIN(v.call_date)                         AS firstCallDate,
        MAX(v.call_date)                         AS lastCallDate
       FROM v_call_master_unified_kpi v
       LEFT JOIN ci_process_master pm
         ON TRIM(LOWER(v.process_name)) = TRIM(LOWER(pm.process_name))
       WHERE ${where}
       GROUP BY pm.process_code, v.process_name, v.branch_short_name
       ORDER BY calls DESC`,
      [dates.from, dates.to, ...params]
    );

    return rows.map(r => ({
      processCode:  r.processCode  || r.processName,
      processName:  r.processName,
      branchCode:   r.branchCode,
      calls:        Number(r.calls        || 0),
      criticalCalls:Number(r.criticalCalls|| 0),
      quality:      Number(r.quality      || 0),
      agentCount:   Number(r.agentCount   || 0),
      risk:         this.calcRiskLevel(r),
    }));
  }

  async getDailyTrend(scope: ScopeFilter, dates: DateFilter) {
    const { where, params } = buildWhere(scope);

    const [rows] = await pools.app.query<RowDataPacket[]>(
      `SELECT
        call_date                        AS date,
        COUNT(*)                         AS calls,
        SUM(is_critical_call)            AS criticalCalls,
        ROUND(AVG(quality_score), 2)     AS avgQuality
       FROM v_call_master_unified_kpi
       WHERE ${where}
       GROUP BY call_date
       ORDER BY call_date ASC`,
      [dates.from, dates.to, ...params]
    );

    return rows.map(r => ({
      date:         r.date,
      calls:        Number(r.calls        || 0),
      criticalCalls:Number(r.criticalCalls|| 0),
      avgQuality:   Number(r.avgQuality   || 0),
    }));
  }

  private calcTrend(current: any, previous: any) {
    const curr = Number(current  || 0);
    const prev = Number(previous || 0);
    if (prev === 0) return { value: 0, direction: 'up' as const };
    const change = ((curr - prev) / prev) * 100;
    return {
      value:     Math.abs(Math.round(change * 10) / 10),
      direction: change >= 0 ? 'up' as const : 'down' as const,
    };
  }

  private calcRiskLevel(row: any): 'low' | 'medium' | 'high' | 'critical' {
    const quality  = Number(row.quality  || 0);
    const critical = Number(row.criticalCalls || 0);
    const total    = Number(row.calls    || 1);
    const critPct  = (critical / total) * 100;
    if (quality > 0 && quality < 40) return 'critical';
    if (critPct > 60) return 'critical';
    if (quality > 0 && quality < 55) return 'high';
    if (critPct > 40) return 'high';
    if (quality > 0 && quality < 70) return 'medium';
    if (critPct > 20) return 'medium';
    return 'low';
  }

  private daysBetween(from: string, to: string): number {
    return Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000));
  }

  private subtractDays(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  }
}

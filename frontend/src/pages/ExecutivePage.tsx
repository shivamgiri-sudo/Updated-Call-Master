// frontend/src/pages/ExecutivePage.tsx
import React from "react";
import { usePageData } from "../hooks/usePageData";
import { apiGet } from "../services/api";
import KpiCard from "../components/ui/KpiCard";
import DataTable, { Column } from "../components/ui/DataTable";
import BarChart from "../components/ui/BarChart";
import LoadingGrid from "../components/ui/LoadingGrid";
import Badge from "../components/ui/Badge";
import SectionTitle from "../components/ui/SectionTitle";

interface ExecutiveData {
  kpis: {
    totalCalls: number;
    totalRevenue: number;
    avgConversion: number;
    avgQuality: number;
    criticalInsights: number;
    activeRisks: number;
  };
  processScorecards: Array<{
    process: string;
    branch: string;
    calls: number;
    conversion: number;
    rejection: number;
    quality: number;
    revenue: number;
    risk: string;
  }>;
  insightCards: Array<{
    id: string;
    severity: string;
    title: string;
    process: string;
    impact: string;
    evidence: string;
    recommendation: string;
    owner: string;
    due: string;
  }>;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(Number(value || 0));
}

function formatMoney(value: number): string {
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value || 0))}`;
}

export default function ExecutivePage() {
  const { data, loading, error } = usePageData<ExecutiveData>(
    'executive-dashboard',
    () => apiGet('/api/executive/dashboard').then((res: any) => res.data)
  );

  if (error) {
    return <div className="card" style={{ padding: '24px', color: '#ef4444' }}>Error: {error}</div>;
  }

  if (loading || !data) {
    return (
      <>
        <LoadingGrid count={6} cols={6} />
        <div className="card" style={{ height: '300px', background: 'rgba(148,163,184,0.05)' }} />
      </>
    );
  }

  const revenueData = data.processScorecards
    .filter(r => r.revenue > 0)
    .map(r => ({ label: r.process, value: r.revenue }));

  const tableColumns: Column<any>[] = [
    { key: 'process', header: 'Process' },
    { key: 'branch', header: 'Branch' },
    { key: 'calls', header: 'Calls' },
    { key: 'conversion', header: 'Conversion' },
    { key: 'rejection', header: 'Rejection' },
    { key: 'quality', header: 'Quality' },
    { key: 'revenue', header: 'Revenue' },
    { key: 'risk', header: 'Risk' },
  ];

  const tableRows = data.processScorecards.map(r => ({
    process: r.process,
    branch: r.branch,
    calls: formatNumber(r.calls),
    conversion: `${r.conversion}%`,
    rejection: `${r.rejection}%`,
    quality: `${r.quality}%`,
    revenue: formatMoney(r.revenue),
    risk: r.risk,
  }));

  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">Call Master Enterprise IQ</span>
          <h1>Enterprise command center for revenue, quality, rejection and live assist.</h1>
          <p>Premium SaaS cockpit for CEO reviews, operations, quality governance and coaching execution.</p>
        </div>
        <div className="hero-panel">
          <div>Enterprise readiness</div>
          <strong>88%</strong>
          <span>Core pages now covered</span>
        </div>
      </section>

      <section className="kpi-grid">
        <KpiCard label="Total calls" value={formatNumber(data.kpis.totalCalls)} />
        <KpiCard label="Revenue" value={formatMoney(data.kpis.totalRevenue)} variant="gold" />
        <KpiCard label="Avg conversion" value={`${data.kpis.avgConversion}%`} />
        <KpiCard label="Avg quality" value={`${data.kpis.avgQuality}%`} />
        <KpiCard label="Critical insights" value={data.kpis.criticalInsights} variant="danger" />
        <KpiCard label="Active risks" value={data.kpis.activeRisks} />
      </section>

      <section className="grid two">
        <div className="card chart-card">
          <SectionTitle title="Revenue by process" subtitle={`${revenueData.length} processes`} />
          <BarChart items={revenueData} suffix="₹" />
        </div>
        <div className="card">
          <SectionTitle title="Process control tower" subtitle="CEO-ready comparison" />
          <DataTable columns={tableColumns} rows={tableRows} rowKey="process" />
        </div>
      </section>

      <section className="insight-grid">
        {data.insightCards.map((insight) => (
          <div className="insight-card" key={insight.id}>
            <div className="insight-head">
              <Badge variant={insight.severity.toLowerCase() as any}>{insight.severity}</Badge>
              <span>{insight.id} • {insight.process}</span>
            </div>
            <h3>{insight.title}</h3>
            <div className="impact">{insight.impact}</div>
            <p><b>Evidence:</b> {insight.evidence}</p>
            <p><b>Recommendation:</b> {insight.recommendation}</p>
            <div className="owner-row">
              <span>Owner: {insight.owner}</span>
              <span>Due: {insight.due}</span>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

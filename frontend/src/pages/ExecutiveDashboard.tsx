// frontend/src/pages/ExecutiveDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { executiveApi, ExecutiveSummary, ProcessRow, DailyPoint } from '../services/apiV1';
import KpiCard from '../components/ui/KpiCard';
import RiskBadge from '../components/ui/RiskBadge';
import '../styles/glass.css';

function num(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function pct(n: number): string {
  return n > 0 ? `${n.toFixed(1)}%` : '—';
}

// Minimal inline sparkline using SVG
function Sparkline({ data, color = '#4299e1' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const w = 120, h = 36;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block', marginTop: 8 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ExecutiveDashboard() {
  const { user, logout } = useAuth();
  const [summary,   setSummary]   = useState<ExecutiveSummary | null>(null);
  const [processes, setProcesses] = useState<ProcessRow[]>([]);
  const [trend,     setTrend]     = useState<DailyPoint[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  useEffect(() => {
    Promise.all([
      executiveApi.summary(),
      executiveApi.scorecard(),
      executiveApi.dailyTrend(),
    ])
      .then(([s, sc, tr]) => {
        setSummary(s.data.data);
        setProcesses(sc.data.data.processes);
        setTrend(tr.data.data.trend);
      })
      .catch((e) => setError(e?.response?.data?.error?.message || 'Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={S.center}>
      <div style={S.spinner} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ color: 'rgba(232,238,246,0.45)', fontSize: 14, marginTop: 16 }}>Loading dashboard…</p>
    </div>
  );

  if (error) return (
    <div style={S.center}>
      <p style={{ color: 'var(--color-danger)', fontSize: 14 }}>{error}</p>
    </div>
  );

  const sparkCalls   = trend.map(d => d.calls);
  const sparkQuality = trend.map(d => d.avgQuality).filter(v => v > 0);

  const critPct = summary && summary.kpis.totalCalls > 0
    ? (summary.kpis.criticalCalls / summary.kpis.totalCalls * 100)
    : 0;

  return (
    <div style={S.root}>
      <div style={S.bgGlow} />

      {/* Header */}
      <header style={S.header}>
        <div>
          <h1 style={S.headerTitle}>Executive Dashboard</h1>
          <p style={S.headerSub}>
            {summary?.dateRange?.from} → {summary?.dateRange?.to}
            &nbsp;·&nbsp; {summary?.kpis.processCount} processes &nbsp;·&nbsp; {summary?.kpis.branchCount} branches
          </p>
        </div>
        <div style={S.headerRight}>
          <span style={S.roleBadge}>{user?.role}</span>
          <span style={S.userName}>{user?.fullName}</span>
          <button style={S.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </header>

      {/* KPI Cards */}
      <section style={S.kpiGrid}>
        <KpiCard
          title="Total Calls"
          value={num(summary?.kpis.totalCalls ?? 0)}
          subtitle="Last 30 days"
          trend={summary?.trends.calls}
          trendPositiveIsUp
          accentColor="#4299e1"
          icon="📞"
        />
        <KpiCard
          title="Critical Calls"
          value={num(summary?.kpis.criticalCalls ?? 0)}
          subtitle={`${critPct.toFixed(1)}% of total`}
          trendPositiveIsUp={false}
          accentColor="#fc8181"
          icon="⚠️"
        />
        <KpiCard
          title="Avg Quality Score"
          value={pct(summary?.kpis.avgQuality ?? 0)}
          trend={summary?.trends.quality}
          trendPositiveIsUp
          accentColor="#48bb78"
          icon="⭐"
        />
        <KpiCard
          title="Active Processes"
          value={summary?.kpis.processCount ?? 0}
          subtitle={`${summary?.kpis.branchCount ?? 0} branches`}
          accentColor="#805ad5"
          icon="🏢"
        />
      </section>

      {/* Daily Call Trend Sparklines */}
      {trend.length > 1 && (
        <section style={S.section}>
          <h2 style={S.sectionTitle}>Call Volume Trend</h2>
          <div style={S.sparkRow}>
            <div style={S.sparkCard}>
              <div style={S.sparkLabel}>Total Calls / Day</div>
              <div style={S.sparkValue}>{num(Math.max(...sparkCalls))} peak</div>
              <Sparkline data={sparkCalls} color="#4299e1" />
            </div>
            {sparkQuality.length > 1 && (
              <div style={S.sparkCard}>
                <div style={S.sparkLabel}>Avg Quality / Day</div>
                <div style={S.sparkValue}>{Math.max(...sparkQuality).toFixed(1)}% peak</div>
                <Sparkline data={trend.map(d => d.avgQuality || 0)} color="#48bb78" />
              </div>
            )}
            <div style={S.sparkCard}>
              <div style={S.sparkLabel}>Critical Calls / Day</div>
              <div style={S.sparkValue}>{num(Math.max(...trend.map(d => d.criticalCalls)))} peak</div>
              <Sparkline data={trend.map(d => d.criticalCalls)} color="#fc8181" />
            </div>
          </div>
        </section>
      )}

      {/* Process Scorecard */}
      <section style={S.section}>
        <h2 style={S.sectionTitle}>Process Scorecard</h2>
        {processes.length === 0 ? (
          <div style={S.emptyState}>No data for selected date range</div>
        ) : (
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {['Process', 'Branch', 'Total Calls', 'Critical', 'Crit %', 'Avg Quality', 'Agents', 'Risk'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processes.map((p, i) => {
                  const cPct = p.calls > 0 ? (p.criticalCalls / p.calls * 100) : 0;
                  return (
                    <tr key={i} style={i % 2 === 0 ? S.trEven : S.trOdd}>
                      <td style={S.td}><strong style={{ color: '#63b3ed' }}>{p.processName}</strong></td>
                      <td style={S.td}>{p.branchCode || '—'}</td>
                      <td style={S.tdR}>{p.calls.toLocaleString()}</td>
                      <td style={S.tdR}>{p.criticalCalls.toLocaleString()}</td>
                      <td style={{ ...S.tdR, color: cPct > 50 ? '#fc8181' : cPct > 25 ? '#ed8936' : '#48bb78' }}>
                        {cPct.toFixed(1)}%
                      </td>
                      <td style={S.tdR}>{pct(p.quality)}</td>
                      <td style={S.tdR}>{p.agentCount}</td>
                      <td style={S.td}><RiskBadge level={p.risk} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  root: { minHeight: '100dvh', background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'var(--font-sans)', position: 'relative', overflowX: 'hidden' },
  bgGlow: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(66,153,225,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 },
  center: { minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' },
  spinner: { width: 36, height: 36, border: '3px solid rgba(255,255,255,0.10)', borderTopColor: '#4299e1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

  header: { position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 32px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(10,15,30,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' },
  headerTitle: { margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px', background: 'linear-gradient(135deg,#63b3ed,#9f7aea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  headerSub: { margin: '3px 0 0', fontSize: 12, color: 'rgba(232,238,246,0.40)' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  roleBadge: { background: 'rgba(66,153,225,0.15)', color: '#63b3ed', border: '1px solid rgba(66,153,225,0.30)', borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em' },
  userName: { fontSize: 13, color: 'rgba(232,238,246,0.55)' },
  logoutBtn: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, color: 'rgba(232,238,246,0.55)', fontSize: 12, padding: '5px 12px', cursor: 'pointer' },

  kpiGrid: { position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, padding: '28px 32px' },

  section: { position: 'relative', zIndex: 1, padding: '0 32px 32px' },
  sectionTitle: { margin: '0 0 14px', fontSize: 11, fontWeight: 700, color: 'rgba(232,238,246,0.40)', letterSpacing: '0.09em', textTransform: 'uppercase' },

  sparkRow: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  sparkCard: { flex: '1 1 200px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 18px' },
  sparkLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(232,238,246,0.40)', marginBottom: 4 },
  sparkValue: { fontSize: 18, fontWeight: 700, color: '#e8eef6' },

  tableWrap: { overflowX: 'auto', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'rgba(232,238,246,0.40)', letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap' },
  td:  { padding: '11px 16px', color: 'var(--color-text)', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  tdR: { padding: '11px 16px', color: 'var(--color-text)', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  trEven: { background: 'transparent' },
  trOdd:  { background: 'rgba(255,255,255,0.02)' },
  emptyState: { padding: 40, textAlign: 'center', color: 'rgba(232,238,246,0.35)', fontSize: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' },
};

// frontend/src/pages/ExecutiveDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { executiveApi, ExecutiveSummary, ProcessRow, RevenueForecast } from '../services/apiV1';
import KpiCard from '../components/ui/KpiCard';
import RiskBadge from '../components/ui/RiskBadge';
import '../styles/glass.css';

function fmt(n: number): string {
  if (n >= 1_000_000) return `₹${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function pct(n: number): string {
  return `${n.toFixed(1)}%`;
}

export default function ExecutiveDashboard() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [processes, setProcesses] = useState<ProcessRow[]>([]);
  const [forecast, setForecast] = useState<RevenueForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      executiveApi.summary(),
      executiveApi.scorecard(),
      user?.role === 'CEO' || user?.role === 'PROCESS_HEAD' ? executiveApi.forecast() : Promise.resolve(null),
    ])
      .then(([s, sc, fc]) => {
        setSummary(s.data.data);
        setProcesses(sc.data.data.processes);
        if (fc) setForecast(fc.data.data);
      })
      .catch((e) => setError(e?.response?.data?.error?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner} />
        <style>{spinKeyframe}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.center}>
        <p style={{ color: 'var(--color-danger)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      {/* Background glows */}
      <div style={styles.bgGlow} />

      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.headerTitle} className="gradient-text">Executive Dashboard</h1>
          <p style={styles.headerSub}>
            {summary?.dateRange?.from} → {summary?.dateRange?.to}
          </p>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userBadge}>{user?.role}</span>
          <span style={styles.userName}>{user?.fullName}</span>
          <button style={styles.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </header>

      {/* KPI Grid */}
      <section style={styles.kpiGrid}>
        <KpiCard
          title="Total Calls"
          value={summary?.kpis.totalCalls.toLocaleString() ?? '—'}
          trend={summary?.trends.calls}
          trendPositiveIsUp
          accentColor="#4299e1"
          icon="📞"
        />
        <KpiCard
          title="Revenue"
          value={fmt(summary?.kpis.totalRevenue ?? 0)}
          trend={summary?.trends.revenue}
          trendPositiveIsUp
          accentColor="#38b2ac"
          icon="₹"
        />
        <KpiCard
          title="Avg Conversion"
          value={pct(summary?.kpis.avgConversion ?? 0)}
          trend={summary?.trends.conversion}
          trendPositiveIsUp
          accentColor="#805ad5"
          icon="🎯"
        />
        <KpiCard
          title="Avg Quality"
          value={pct(summary?.kpis.avgQuality ?? 0)}
          trend={summary?.trends.quality}
          trendPositiveIsUp
          accentColor="#d69e2e"
          icon="⭐"
        />
        <KpiCard
          title="Critical Insights"
          value={summary?.kpis.criticalInsights ?? 0}
          trendPositiveIsUp={false}
          accentColor="#fc8181"
          icon="⚠️"
        />
        <KpiCard
          title="Active Risks"
          value={summary?.kpis.activeRisks ?? 0}
          trendPositiveIsUp={false}
          accentColor="#e53e3e"
          icon="🚨"
        />
      </section>

      {/* Process Scorecard */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Process Scorecard</h2>
        {processes.length === 0 ? (
          <div style={styles.emptyState}>
            No data available for the selected date range
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['Process', 'Branch', 'Calls', 'Connected', 'Conversion', 'Rejection', 'Quality', 'Revenue', 'Risk'].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processes.map((p, i) => (
                  <tr key={i} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                    <td style={styles.td}><strong>{p.processCode}</strong></td>
                    <td style={styles.td}>{p.branchCode}</td>
                    <td style={styles.tdNum}>{p.calls.toLocaleString()}</td>
                    <td style={styles.tdNum}>{p.connected.toLocaleString()}</td>
                    <td style={styles.tdNum}>{pct(p.conversion)}</td>
                    <td style={styles.tdNum}>{pct(p.rejection)}</td>
                    <td style={styles.tdNum}>{pct(p.quality)}</td>
                    <td style={styles.tdNum}>{fmt(p.revenue)}</td>
                    <td style={styles.td}><RiskBadge level={p.risk} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Revenue Forecast (CEO/PROCESS_HEAD only) */}
      {forecast && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Revenue Forecast</h2>
          <div style={styles.forecastGrid}>
            <div className="glass-card glass-card-sm" style={styles.forecastCard}>
              <div style={styles.forecastLabel}>Monthly Forecast</div>
              <div style={styles.forecastValue}>{fmt(forecast.forecast.monthly)}</div>
              <div style={styles.forecastConf}>Confidence: {forecast.forecast.confidence}</div>
            </div>
            <div className="glass-card glass-card-sm" style={styles.forecastCard}>
              <div style={styles.forecastLabel}>Quarterly Forecast</div>
              <div style={styles.forecastValue}>{fmt(forecast.forecast.quarterly)}</div>
            </div>
            <div className="glass-card glass-card-sm" style={styles.forecastCard}>
              <div style={styles.forecastLabel}>Avg Ticket Size</div>
              <div style={styles.forecastValue}>{fmt(forecast.assumptions.avgTicketSize)}</div>
              <div style={styles.forecastConf}>{forecast.assumptions.avgCallsPerDay} calls/day</div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

const spinKeyframe = `@keyframes spin { to { transform: rotate(360deg); } }`;

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100dvh',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-sans)',
    position: 'relative',
    overflowX: 'hidden',
  },
  bgGlow: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(66,153,225,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  center: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg)',
    flexDirection: 'column',
    gap: 16,
  },
  spinner: {
    width: 36, height: 36,
    border: '3px solid rgba(255,255,255,0.10)',
    borderTopColor: '#4299e1',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  header: {
    position: 'relative', zIndex: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 32px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    background: 'rgba(10,15,30,0.6)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  headerTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: '-0.3px',
    background: 'linear-gradient(135deg,#63b3ed,#9f7aea)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  headerSub: {
    margin: '3px 0 0',
    fontSize: 12,
    color: 'var(--color-text-dim)',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  userBadge: {
    background: 'rgba(66,153,225,0.15)',
    color: '#63b3ed',
    border: '1px solid rgba(66,153,225,0.30)',
    borderRadius: 999,
    padding: '2px 10px',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.05em',
  },
  userName: {
    fontSize: 13,
    color: 'var(--color-text-muted)',
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 8,
    color: 'var(--color-text-muted)',
    fontSize: 12,
    padding: '5px 12px',
    cursor: 'pointer',
    transition: 'background 150ms ease',
  },
  kpiGrid: {
    position: 'relative', zIndex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    padding: '28px 32px',
  },
  section: {
    position: 'relative', zIndex: 1,
    padding: '0 32px 32px',
  },
  sectionTitle: {
    margin: '0 0 16px',
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  tableWrapper: {
    overflowX: 'auto',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
  },
  th: {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(232,238,246,0.45)',
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '10px 14px',
    color: 'var(--color-text)',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  tdNum: {
    padding: '10px 14px',
    color: 'var(--color-text)',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  },
  trEven: { background: 'transparent' },
  trOdd:  { background: 'rgba(255,255,255,0.02)' },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    color: 'var(--color-text-dim)',
    fontSize: 14,
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.07)',
  },
  forecastGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16,
  },
  forecastCard: {
    textAlign: 'center',
  },
  forecastLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: 'rgba(232,238,246,0.45)',
    marginBottom: 8,
  },
  forecastValue: {
    fontSize: 26,
    fontWeight: 700,
    color: '#63b3ed',
    letterSpacing: '-0.5px',
  },
  forecastConf: {
    marginTop: 4,
    fontSize: 11,
    color: 'rgba(232,238,246,0.40)',
  },
};

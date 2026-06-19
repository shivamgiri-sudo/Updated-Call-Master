// frontend/src/pages/ExecutiveDashboard.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { executiveApi, ExecutiveSummary, ProcessRow, DailyPoint } from '../services/apiV1';
import '../styles/glass.css';

/* ── helpers ── */
function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}
function fmtPct(n: number) { return n > 0 ? n.toFixed(1) + '%' : '—'; }

/* ── SVG icons ── */
const Icon = {
  phone:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.59 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l1.08-.88a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  alert:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  star:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  layers:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  chevDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  up:       <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  down:     <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
  refresh:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  logout:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  filter:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>,
};

/* ── Sparkline ── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <div style={{ height: 28 }} />;
  const w = 80, h = 28;
  const max = Math.max(...data) || 1;
  const min = Math.min(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / rng) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', opacity: 0.8 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── KPI Card ── */
interface KpiProps { label: string; value: string; sub?: string; trend?: { value: number; direction: 'up'|'down' }; trendGoodUp?: boolean; accent: string; icon: React.ReactNode; sparkData?: number[] }
function KpiCard({ label, value, sub, trend, trendGoodUp = true, accent, icon, sparkData }: KpiProps) {
  const good = trend ? (trendGoodUp ? trend.direction === 'up' : trend.direction === 'down') : null;
  const trendColor = good === null ? 'var(--text-muted)' : good ? 'var(--status-success)' : 'var(--status-danger)';
  return (
    <div style={{ ...S.kpiCard, '--ac': accent } as React.CSSProperties}>
      <div style={S.kpiTop}>
        <span style={S.kpiLabel}>{label}</span>
        <span style={{ ...S.kpiIcon, color: accent }}>{icon}</span>
      </div>
      <div style={S.kpiValue}>{value}</div>
      <div style={S.kpiBottom}>
        {trend && (
          <span style={{ ...S.kpiTrend, color: trendColor }}>
            {trend.direction === 'up' ? Icon.up : Icon.down}
            <span style={{ marginLeft: 3 }}>{trend.value}%</span>
          </span>
        )}
        {sub && <span style={S.kpiSub}>{sub}</span>}
        {sparkData && <Sparkline data={sparkData} color={accent} />}
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: accent, opacity: 0.5, borderRadius: '0 0 var(--r-lg) var(--r-lg)' }} />
    </div>
  );
}

/* ── Select ── */
function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={S.select}
        aria-label={placeholder}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <span style={S.selectChevron}>{Icon.chevDown}</span>
    </div>
  );
}

/* ── Risk badge ── */
const RISK_COLORS: Record<string, [string, string]> = {
  low:      ['var(--status-success-bg)', 'var(--status-success)'],
  medium:   ['var(--status-warning-bg)', 'var(--status-warning)'],
  high:     ['var(--status-danger-bg)',  'var(--status-danger)'],
  critical: ['rgba(239,68,68,0.20)',     '#ff3b3b'],
};
function RiskBadge({ level }: { level: string }) {
  const [bg, text] = RISK_COLORS[level] ?? RISK_COLORS.medium;
  return <span className="badge" style={{ background: bg, color: text }}>{level}</span>;
}

/* ══════════════════════════════════ PAGE ══════════════════════════════════ */
export default function ExecutiveDashboard() {
  const { user, logout } = useAuth();

  const [summary,   setSummary]   = useState<ExecutiveSummary | null>(null);
  const [processes, setProcesses] = useState<ProcessRow[]>([]);
  const [trend,     setTrend]     = useState<DailyPoint[]>([]);
  const [procList,  setProcList]  = useState<string[]>([]);
  const [branchList,setBranchList]= useState<string[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  const [filterProcess, setFilterProcess] = useState('');
  const [filterBranch,  setFilterBranch]  = useState('');
  const [filterFrom,    setFilterFrom]    = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [filterTo, setFilterTo] = useState(() => new Date().toISOString().split('T')[0]);

  const load = useCallback(() => {
    setLoading(true); setError('');
    const params = {
      from: filterFrom, to: filterTo,
      ...(filterProcess && { processCode: filterProcess }),
      ...(filterBranch  && { branchCode:  filterBranch  }),
    };
    Promise.all([
      executiveApi.summary(params),
      executiveApi.scorecard(params),
      executiveApi.dailyTrend(params),
      executiveApi.filters(),
    ])
      .then(([s, sc, tr, fl]) => {
        setSummary(s.data.data);
        setProcesses(sc.data.data.processes);
        setTrend(tr.data.data.trend);
        setProcList(fl.data.data.processes);
        setBranchList(fl.data.data.branches);
      })
      .catch(e => setError(e?.response?.data?.error?.message || 'Failed to load data'))
      .finally(() => setLoading(false));
  }, [filterFrom, filterTo, filterProcess, filterBranch]);

  useEffect(() => { load(); }, [load]);

  const critPct = summary && summary.kpis.totalCalls > 0
    ? (summary.kpis.criticalCalls / summary.kpis.totalCalls * 100) : 0;

  if (error) return (
    <div style={S.center}>
      <div style={{ color: 'var(--status-danger)', textAlign: 'center' }}>
        <p style={{ marginBottom: 12 }}>{error}</p>
        <button style={S.reloadBtn} onClick={load}>{Icon.refresh} Retry</button>
      </div>
    </div>
  );

  return (
    <div style={S.shell}>
      {/* ── SIDEBAR ── */}
      <aside style={S.sidebar}>
        <div style={S.sideTop}>
          <div style={S.sideLogoRow}>
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden>
              <rect width="32" height="32" rx="8" fill="#3b82f6" opacity=".18"/>
              <path d="M8 22L16 10L24 22" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11 18L21 18" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={S.sideLogoText}>Call Master</span>
          </div>
          <nav style={S.nav}>
            {[
              { icon: Icon.layers, label: 'Executive Overview', active: true },
              { icon: Icon.phone,  label: 'Call Analytics',     active: false },
              { icon: Icon.star,   label: 'Quality Scores',     active: false },
              { icon: Icon.alert,  label: 'Critical Insights',  active: false },
            ].map(item => (
              <div key={item.label} style={item.active ? { ...S.navItem, ...S.navItemActive } : S.navItem}>
                <span style={S.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </nav>
        </div>
        <div style={S.sideBottom}>
          <div style={S.userRow}>
            <div style={S.avatar}>{user?.fullName?.charAt(0) ?? 'U'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={S.userName} title={user?.fullName}>{user?.fullName}</div>
              <div style={S.userRole}>{user?.role}</div>
            </div>
          </div>
          <button style={S.logoutBtn} onClick={logout} aria-label="Sign out">
            {Icon.logout} Sign out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={S.main}>
        {/* Header */}
        <header style={S.header}>
          <div>
            <h1 style={S.pageTitle}>Executive Overview</h1>
            <p style={S.pageSubtitle}>
              {summary?.kpis.processCount ?? '—'} processes · {summary?.kpis.branchCount ?? '—'} branches
              &nbsp;·&nbsp; {filterFrom} → {filterTo}
            </p>
          </div>
          <button style={S.refreshBtn} onClick={load} disabled={loading} aria-label="Refresh data">
            <span style={loading ? S.spinning : undefined}>{Icon.refresh}</span>
            Refresh
          </button>
        </header>

        {/* Filters */}
        <div style={S.filterBar}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            {Icon.filter} Filters
          </span>
          <Select value={filterProcess} onChange={setFilterProcess} options={procList} placeholder="All Processes" />
          <Select value={filterBranch}  onChange={setFilterBranch}  options={branchList} placeholder="All Branches" />
          <div style={S.dateGroup}>
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} style={S.dateInput} aria-label="From date" />
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>to</span>
            <input type="date" value={filterTo}   onChange={e => setFilterTo(e.target.value)}   style={S.dateInput} aria-label="To date" />
          </div>
          {(filterProcess || filterBranch) && (
            <button style={S.clearBtn} onClick={() => { setFilterProcess(''); setFilterBranch(''); }}>
              Clear filters
            </button>
          )}
        </div>

        {/* Skeleton / content */}
        {loading ? (
          <div style={S.skeletonGrid}>
            {[...Array(4)].map((_, i) => <div key={i} style={S.skeleton} />)}
          </div>
        ) : (
          <>
            {/* KPI Row */}
            <div style={S.kpiGrid}>
              <KpiCard
                label="Total Calls" value={fmtNum(summary?.kpis.totalCalls ?? 0)}
                trend={summary?.trends.calls} trendGoodUp
                accent="var(--accent-blue)" icon={Icon.phone}
                sparkData={trend.map(d => d.calls)}
              />
              <KpiCard
                label="Critical Calls" value={fmtNum(summary?.kpis.criticalCalls ?? 0)}
                sub={`${fmtPct(critPct)} of total`}
                trendGoodUp={false}
                accent="var(--status-danger)" icon={Icon.alert}
                sparkData={trend.map(d => d.criticalCalls)}
              />
              <KpiCard
                label="Avg Quality Score" value={fmtPct(summary?.kpis.avgQuality ?? 0)}
                trend={summary?.trends.quality} trendGoodUp
                accent="var(--accent-teal)" icon={Icon.star}
                sparkData={trend.map(d => d.avgQuality)}
              />
              <KpiCard
                label="Active Processes" value={String(summary?.kpis.processCount ?? 0)}
                sub={`${summary?.kpis.branchCount ?? 0} branches`}
                accent="var(--accent-purple)" icon={Icon.layers}
              />
            </div>

            {/* Process Scorecard table */}
            <section style={S.section}>
              <div style={S.sectionHead}>
                <h2 style={S.sectionTitle}>Process Scorecard</h2>
                <span style={S.sectionCount}>{processes.length} processes</span>
              </div>
              {processes.length === 0 ? (
                <div style={S.empty}>
                  <p>No data for the selected filters and date range.</p>
                  <p style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>Try adjusting the date range or removing filters.</p>
                </div>
              ) : (
                <div style={S.tableWrap}>
                  <table style={S.table} role="table">
                    <thead>
                      <tr>
                        {['Process', 'Branch', 'Total Calls', 'Critical', 'Crit %', 'Avg Quality', 'Agents', 'Risk'].map(h => (
                          <th key={h} style={S.th} scope="col">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {processes.map((p, i) => {
                        const cPct = p.calls > 0 ? (p.criticalCalls / p.calls * 100) : 0;
                        const qColor = p.quality > 70 ? 'var(--status-success)' : p.quality > 50 ? 'var(--status-warning)' : p.quality > 0 ? 'var(--status-danger)' : 'var(--text-muted)';
                        const cColor = cPct > 60 ? 'var(--status-danger)' : cPct > 30 ? 'var(--status-warning)' : 'var(--status-success)';
                        return (
                          <tr key={i} style={S.tr}>
                            <td style={S.td}>
                              <span style={S.processName}>{p.processName}</span>
                              {p.processCode && p.processCode !== p.processName && (
                                <span style={S.processCode}>{p.processCode}</span>
                              )}
                            </td>
                            <td style={S.td}>
                              <span className="badge badge-blue">{p.branchCode || '—'}</span>
                            </td>
                            <td style={{ ...S.tdNum }}>{p.calls.toLocaleString()}</td>
                            <td style={{ ...S.tdNum, color: 'var(--status-danger)' }}>{p.criticalCalls.toLocaleString()}</td>
                            <td style={{ ...S.tdNum, color: cColor }}>{fmtPct(cPct)}</td>
                            <td style={{ ...S.tdNum, color: qColor, fontFamily: 'var(--font-mono)' }}>{fmtPct(p.quality)}</td>
                            <td style={S.tdNum}>{p.agentCount}</td>
                            <td style={S.td}><RiskBadge level={p.risk} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Daily trend mini-table */}
            {trend.length > 0 && (
              <section style={S.section}>
                <div style={S.sectionHead}>
                  <h2 style={S.sectionTitle}>Daily Trend</h2>
                  <span style={S.sectionCount}>Last {trend.length} days</span>
                </div>
                <div style={S.tableWrap}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        {['Date', 'Total Calls', 'Critical', 'Crit %', 'Avg Quality'].map(h => (
                          <th key={h} style={S.th} scope="col">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...trend].reverse().slice(0, 14).map((d, i) => {
                        const cPct = d.calls > 0 ? (d.criticalCalls / d.calls * 100) : 0;
                        return (
                          <tr key={i} style={S.tr}>
                            <td style={{ ...S.td, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{d.date}</td>
                            <td style={S.tdNum}>{d.calls.toLocaleString()}</td>
                            <td style={{ ...S.tdNum, color: 'var(--status-danger)' }}>{d.criticalCalls.toLocaleString()}</td>
                            <td style={{ ...S.tdNum, color: cPct > 50 ? 'var(--status-danger)' : 'var(--text-secondary)' }}>{fmtPct(cPct)}</td>
                            <td style={{ ...S.tdNum, fontFamily: 'var(--font-mono)', color: d.avgQuality > 70 ? 'var(--status-success)' : d.avgQuality > 0 ? 'var(--status-warning)' : 'var(--text-muted)' }}>
                              {fmtPct(d.avgQuality)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%,100%{opacity:.6} 50%{opacity:1} }
        select:focus { outline: 2px solid var(--accent-blue); outline-offset: 1px; }
        tr:hover td, tr:hover th { background: var(--bg-hover) !important; }
      `}</style>
    </div>
  );
}

/* ── STYLES ── */
const S: Record<string, React.CSSProperties> = {
  shell: {
    display: 'flex', minHeight: '100dvh',
    background: 'var(--bg-base)', fontFamily: 'var(--font-sans)',
  },
  center: { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' },

  /* sidebar */
  sidebar: {
    width: 220, flexShrink: 0,
    background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)',
    display: 'flex', flexDirection: 'column',
    position: 'sticky', top: 0, height: '100dvh', overflowY: 'auto',
  },
  sideTop: { flex: 1, padding: '20px 0 16px' },
  sideLogoRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px 20px', borderBottom: '1px solid var(--border-subtle)' },
  sideLogoText: { fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' },
  nav: { padding: '12px 10px' },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--r-md)', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)', transition: 'background var(--t-fast)', fontWeight: 500 },
  navItemActive: { background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)' },
  navIcon: { display: 'flex', alignItems: 'center', opacity: 0.8 },
  sideBottom: { padding: '12px 14px 16px', borderTop: '1px solid var(--border-subtle)' },
  userRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: { width: 30, height: 30, borderRadius: '50%', background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  userName: { fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userRole: { fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '7px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-md)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', transition: 'background var(--t-fast)', fontFamily: 'var(--font-sans)' },

  /* main */
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px 0', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 },
  pageTitle: { fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px' },
  pageSubtitle: { fontSize: 11, color: 'var(--text-muted)', marginTop: 3 },
  refreshBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--r-md)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'background var(--t-fast)' },
  spinning: { display: 'inline-flex', animation: 'spin 0.7s linear infinite' },
  reloadBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: 'var(--accent-blue-dim)', border: '1px solid var(--accent-blue)', borderRadius: 'var(--r-md)', color: 'var(--accent-blue)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)' },

  /* filter bar */
  filterBar: {
    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    padding: '12px 28px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)',
  },
  select: {
    appearance: 'none', WebkitAppearance: 'none',
    background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
    borderRadius: 'var(--r-md)', color: 'var(--text-primary)', fontSize: 12,
    padding: '6px 30px 6px 10px', cursor: 'pointer', fontFamily: 'var(--font-sans)',
    minWidth: 140,
  },
  selectChevron: { position: 'absolute', right: 8, pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex' },
  dateGroup: { display: 'flex', alignItems: 'center', gap: 6 },
  dateInput: {
    background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
    borderRadius: 'var(--r-md)', color: 'var(--text-primary)', fontSize: 11,
    padding: '5px 8px', fontFamily: 'var(--font-mono)', cursor: 'pointer',
  },
  clearBtn: { padding: '5px 12px', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 'var(--r-md)', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-sans)' },

  /* KPI */
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, padding: '20px 28px' },
  kpiCard: { position: 'relative', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-lg)', padding: '16px 18px 14px', overflow: 'hidden', transition: 'border-color var(--t-fast)', cursor: 'default' },
  kpiTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  kpiLabel: { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' },
  kpiIcon: { display: 'flex', opacity: 0.9 },
  kpiValue: { fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1, fontFamily: 'var(--font-mono)', marginBottom: 8 },
  kpiBottom: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minHeight: 28 },
  kpiTrend: { display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600 },
  kpiSub: { fontSize: 11, color: 'var(--text-muted)' },

  /* skeleton */
  skeletonGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, padding: '20px 28px' },
  skeleton: { height: 110, background: 'var(--bg-surface)', borderRadius: 'var(--r-lg)', animation: 'shimmer 1.5s ease infinite' },

  /* sections */
  section: { padding: '0 28px 24px' },
  sectionHead: { display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' },
  sectionCount: { fontSize: 11, color: 'var(--text-muted)' },

  /* table */
  tableWrap: { overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-lg)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid var(--border-subtle)', transition: 'background var(--t-fast)' },
  td: { padding: '10px 14px', color: 'var(--text-primary)', verticalAlign: 'middle' },
  tdNum: { padding: '10px 14px', textAlign: 'right', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', verticalAlign: 'middle' },

  processName: { fontWeight: 600, display: 'block' },
  processCode: { fontSize: 10, color: 'var(--text-muted)', display: 'block', marginTop: 1, fontFamily: 'var(--font-mono)' },

  empty: { padding: '36px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, background: 'var(--bg-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border-subtle)' },
};

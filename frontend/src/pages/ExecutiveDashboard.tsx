// frontend/src/pages/ExecutiveDashboard.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { executiveApi, ExecutiveSummary, ProcessRow, DailyPoint } from '../services/apiV1';
import '../styles/glass.css';

/* ── Helpers ── */
const fmtNum = (n: number) => n >= 1_000_000 ? (n/1_000_000).toFixed(1)+'M' : n >= 1_000 ? (n/1_000).toFixed(1)+'K' : n.toLocaleString();
const fmtPct = (n: number) => n > 0 ? n.toFixed(1)+'%' : '—';

/* ── SVG Icons ── */
const Icons = {
  phone:    (c='currentColor') => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.69 12 19.79 19.79 0 011.61 3.4 2 2 0 013.59 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.91 9.91a16 16 0 006.08 6.08l1.08-.88a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  alert:    (c='currentColor') => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  star:     (c='currentColor') => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  grid:     (c='currentColor') => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  chart:    (c='currentColor') => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  settings: (c='currentColor') => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M5.34 5.34L3.93 6.75M20 12h-2M6 12H4M17.66 17.66l1.41 1.41M6.75 17.25l-1.41 1.41M12 20v2M12 4V2"/></svg>,
  logout:   (c='currentColor') => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  search:   (c='currentColor') => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  refresh:  (c='currentColor') => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
  chevD:    (c='currentColor') => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  trendUp:  (c='currentColor') => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  trendDn:  (c='currentColor') => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>,
};

/* ── Sparkline ── */
function Sparkline({ data, color, fill }: { data: number[]; color: string; fill?: string }) {
  if (data.length < 2) return <div style={{ height: 32 }} />;
  const W = 90, H = 32;
  const max = Math.max(...data) || 1, min = Math.min(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => [(i/(data.length-1))*W, H - ((v-min)/rng)*(H-5) - 3]);
  const d = pts.map((p, i) => `${i===0?'M':'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${d} L${pts[pts.length-1][0]},${H} L0,${H} Z`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {fill && <path d={area} fill={fill} opacity="0.15" />}
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Donut chart ── */
function DonutChart({ segments }: { segments: { value: number; color: string; label: string }[] }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const R = 36, r = 22, cx = 44, cy = 44;
  let angle = -90;
  const slices = segments.map(seg => {
    const pct = seg.value / total;
    const a1 = (angle * Math.PI) / 180;
    angle += pct * 360;
    const a2 = (angle * Math.PI) / 180;
    const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
    const x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2);
    const xi1 = cx + r * Math.cos(a1), yi1 = cy + r * Math.sin(a1);
    const xi2 = cx + r * Math.cos(a2), yi2 = cy + r * Math.sin(a2);
    const lg = pct > 0.5 ? 1 : 0;
    return { ...seg, pct, d: `M${x1},${y1} A${R},${R} 0 ${lg} 1 ${x2},${y2} L${xi2},${yi2} A${r},${r} 0 ${lg} 0 ${xi1},${yi1} Z` };
  });
  return (
    <svg width={88} height={88} viewBox="0 0 88 88">
      {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} />)}
      <circle cx={cx} cy={cy} r={r-2} fill="#fff" />
    </svg>
  );
}

/* ── Select ── */
function Sel({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={S.sel}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <span style={{ position: 'absolute', right: 8, pointerEvents: 'none', color: '#9CA3AF', display: 'flex' }}>{Icons.chevD()}</span>
    </div>
  );
}

/* ── Risk badge ── */
const RISK: Record<string, [string, string]> = {
  low:      ['var(--green-light)',  '#059669'],
  medium:   ['var(--amber-light)',  '#B45309'],
  high:     ['var(--red-light)',    '#DC2626'],
  critical: ['#FEE2E2',            '#B91C1C'],
};
function RiskBadge({ level }: { level: string }) {
  const [bg, fg] = RISK[level] ?? RISK.medium;
  return <span className="badge" style={{ background: bg, color: fg }}>{level}</span>;
}

/* ══════════════════════════════ PAGE ══════════════════════════════ */
export default function ExecutiveDashboard() {
  const { user, logout } = useAuth();
  const [summary,    setSummary]    = useState<ExecutiveSummary | null>(null);
  const [processes,  setProcesses]  = useState<ProcessRow[]>([]);
  const [trend,      setTrend]      = useState<DailyPoint[]>([]);
  const [procList,   setProcList]   = useState<string[]>([]);
  const [branchList, setBranchList] = useState<string[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [filterProc, setFilterProc] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [dateFrom,   setDateFrom]   = useState(() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().split('T')[0]; });
  const [dateTo,     setDateTo]     = useState(() => new Date().toISOString().split('T')[0]);
  const [activeNav,  setActiveNav]  = useState('Dashboard');

  const load = useCallback(() => {
    setLoading(true); setError('');
    const params = { from: dateFrom, to: dateTo, ...(filterProc && { processCode: filterProc }), ...(filterBranch && { branchCode: filterBranch }) };
    Promise.all([executiveApi.summary(params), executiveApi.scorecard(params), executiveApi.dailyTrend(params), executiveApi.filters()])
      .then(([s, sc, tr, fl]) => {
        setSummary(s.data.data); setProcesses(sc.data.data.processes);
        setTrend(tr.data.data.trend); setProcList(fl.data.data.processes); setBranchList(fl.data.data.branches);
      })
      .catch(e => setError(e?.response?.data?.error?.message || 'Failed to load data'))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo, filterProc, filterBranch]);

  useEffect(() => { load(); }, [load]);

  const critPct   = summary && summary.kpis.totalCalls > 0 ? summary.kpis.criticalCalls / summary.kpis.totalCalls * 100 : 0;
  const safePct   = summary ? 100 - critPct : 0;
  const navItems  = [
    { label: 'Dashboard', icon: Icons.grid },
    { label: 'Call Analytics', icon: Icons.phone },
    { label: 'Quality Scores', icon: Icons.star },
    { label: 'Critical Insights', icon: Icons.alert },
    { label: 'Reports', icon: Icons.chart },
    { label: 'Settings', icon: Icons.settings },
  ];

  return (
    <div style={S.shell}>
      {/* ── SIDEBAR ── */}
      <aside style={S.sidebar}>
        {/* Logo */}
        <div style={S.sideHeader}>
          <div style={S.logoWrap}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.69 12 19.79 19.79 0 011.61 3.4 2 2 0 013.59 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.91 9.91a16 16 0 006.08 6.08l1.08-.88a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
            </svg>
          </div>
          <span style={S.logoLabel}>Call Master</span>
        </div>

        {/* Nav */}
        <nav style={{ padding: '8px 0', flex: 1 }}>
          <p style={S.navGroup}>Main Menu</p>
          {navItems.map(item => {
            const active = item.label === activeNav;
            return (
              <button key={item.label} style={active ? { ...S.navItem, ...S.navActive } : S.navItem}
                onClick={() => setActiveNav(item.label)}>
                <span style={{ display: 'flex', color: active ? '#7C5CFC' : '#9CA3AF' }}>{item.icon()}</span>
                <span>{item.label}</span>
                {active && <div style={S.navPill} />}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div style={S.sideFooter}>
          <div style={S.avatar}>{user?.fullName?.charAt(0) ?? 'U'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.uName}>{user?.fullName}</div>
            <div style={S.uRole}>{user?.role}</div>
          </div>
          <button onClick={logout} style={S.logoutBtn} title="Sign out">{Icons.logout('#9CA3AF')}</button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={S.main}>
        {/* Topbar */}
        <header style={S.topbar}>
          <div>
            <h1 style={S.greeting}>Hello, {user?.fullName?.split(' ')[0] ?? 'there'},</h1>
            <p style={S.greetSub}>{dateFrom} → {dateTo} · {summary?.kpis.processCount ?? '…'} processes · {summary?.kpis.branchCount ?? '…'} branches</p>
          </div>
          <div style={S.topRight}>
            <button style={S.editBtn} onClick={load} disabled={loading}>
              {loading ? <span style={S.spin} /> : Icons.refresh('#fff')}
              &nbsp; {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </header>

        {/* Filter bar */}
        <div style={S.filterBar}>
          <Sel value={filterProc}   onChange={setFilterProc}   options={procList}   placeholder="All Processes" />
          <Sel value={filterBranch} onChange={setFilterBranch} options={branchList} placeholder="All Branches" />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={S.dateIn} aria-label="From" />
          <span style={{ color: '#9CA3AF', fontSize: 11 }}>to</span>
          <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   style={S.dateIn} aria-label="To" />
          {(filterProc || filterBranch) && (
            <button style={S.clearBtn} onClick={() => { setFilterProc(''); setFilterBranch(''); }}>✕ Clear</button>
          )}
        </div>

        {error && <div style={S.errorBanner}>{Icons.alert('#EF4444')} {error}</div>}

        {/* ── Content ── */}
        <div style={S.content}>
          {loading ? (
            <div style={S.skelGrid}>
              {[...Array(4)].map((_,i) => <div key={i} style={S.skel} />)}
            </div>
          ) : (
            <>
              {/* Row 1: Overview card + KPI cards */}
              <div style={S.row1}>
                {/* Quarterly-style overview card */}
                <div style={S.overviewCard}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Quarterly Overview</p>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1D23', marginBottom: 6 }}>Call Performance</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 20 }}>
                    <DonutChart segments={[
                      { value: safePct,  color: '#7C5CFC', label: 'Normal' },
                      { value: critPct,  color: '#EF4444', label: 'Critical' },
                      { value: summary?.kpis.avgQuality ?? 0, color: '#3DD5C8', label: 'Quality' },
                    ]} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {[
                        { label: 'Total Calls',    value: fmtNum(summary?.kpis.totalCalls ?? 0), color: '#7C5CFC', dot: '#7C5CFC' },
                        { label: 'Critical Calls', value: fmtNum(summary?.kpis.criticalCalls ?? 0), color: '#EF4444', dot: '#EF4444' },
                        { label: 'Avg Quality',    value: fmtPct(summary?.kpis.avgQuality ?? 0), color: '#3DD5C8', dot: '#3DD5C8' },
                      ].map(item => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.dot, flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: '#6B7280' }}>{item.label}</span>
                          <span style={{ marginLeft: 'auto', fontSize: 15, fontWeight: 700, color: item.color, paddingLeft: 16 }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* KPI cards */}
                <div style={S.kpiGrid}>
                  {[
                    { label: 'Total Calls',      value: fmtNum(summary?.kpis.totalCalls ?? 0),      trend: summary?.trends.calls,   trendUp: true,  accent: '#7C5CFC', bg: 'rgba(124,92,252,0.06)', icon: Icons.phone,  spark: trend.map(d => d.calls) },
                    { label: 'Critical Calls',   value: fmtNum(summary?.kpis.criticalCalls ?? 0),   trend: undefined,               trendUp: false, accent: '#EF4444', bg: 'rgba(239,68,68,0.06)',  icon: Icons.alert,  spark: trend.map(d => d.criticalCalls) },
                    { label: 'Avg Quality',      value: fmtPct(summary?.kpis.avgQuality ?? 0),      trend: summary?.trends.quality, trendUp: true,  accent: '#10B981', bg: 'rgba(16,185,129,0.06)', icon: Icons.star,   spark: trend.map(d => d.avgQuality) },
                    { label: 'Active Processes', value: String(summary?.kpis.processCount ?? 0),    trend: undefined,               trendUp: true,  accent: '#3DD5C8', bg: 'rgba(61,213,200,0.06)', icon: Icons.chart,  spark: [] },
                  ].map(kpi => (
                    <div key={kpi.label} style={S.kpiCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div style={{ ...S.kpiIconWrap, background: kpi.bg }}>
                          <span style={{ display: 'flex', color: kpi.accent }}>{kpi.icon()}</span>
                        </div>
                        {kpi.trend && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600,
                            color: kpi.trendUp ? (kpi.trend.direction === 'up' ? '#10B981' : '#EF4444') : (kpi.trend.direction === 'down' ? '#10B981' : '#EF4444') }}>
                            {kpi.trend.direction === 'up' ? Icons.trendUp() : Icons.trendDn()}
                            {kpi.trend.value}%
                          </span>
                        )}
                      </div>
                      <div style={S.kpiVal}>{kpi.value}</div>
                      <div style={S.kpiLbl}>{kpi.label}</div>
                      {kpi.spark.length > 1 && (
                        <div style={{ marginTop: 10 }}>
                          <Sparkline data={kpi.spark} color={kpi.accent} fill={kpi.accent} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 2: Process Scorecard */}
              <div style={S.card}>
                <div style={S.cardHead}>
                  <div>
                    <h3 style={S.cardTitle}>Process Scorecard</h3>
                    <p style={S.cardSub}>{processes.length} processes in view</p>
                  </div>
                </div>
                {processes.length === 0 ? (
                  <div style={S.empty}>No data for selected filters and date range</div>
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
                          const cp = p.calls > 0 ? p.criticalCalls / p.calls * 100 : 0;
                          const qc = p.quality > 70 ? '#059669' : p.quality > 50 ? '#B45309' : p.quality > 0 ? '#DC2626' : '#9CA3AF';
                          const cc = cp > 60 ? '#DC2626' : cp > 30 ? '#B45309' : '#059669';
                          return (
                            <tr key={i} style={S.tr}>
                              <td style={S.td}>
                                <span style={{ fontWeight: 600, display: 'block' }}>{p.processName}</span>
                                {p.processCode !== p.processName && <span style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'var(--font-mono)' }}>{p.processCode}</span>}
                              </td>
                              <td style={S.td}><span className="badge badge-purple">{p.branchCode || '—'}</span></td>
                              <td style={S.tdR}>{p.calls.toLocaleString()}</td>
                              <td style={{ ...S.tdR, color: '#EF4444' }}>{p.criticalCalls.toLocaleString()}</td>
                              <td style={{ ...S.tdR, color: cc, fontWeight: 600 }}>{fmtPct(cp)}</td>
                              <td style={{ ...S.tdR, color: qc, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmtPct(p.quality)}</td>
                              <td style={S.tdR}>{p.agentCount}</td>
                              <td style={S.td}><RiskBadge level={p.risk} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Row 3: Daily Trend */}
              {trend.length > 1 && (
                <div style={S.card}>
                  <div style={S.cardHead}>
                    <div>
                      <h3 style={S.cardTitle}>Daily Trend</h3>
                      <p style={S.cardSub}>Last {Math.min(trend.length, 14)} days</p>
                    </div>
                  </div>
                  <div style={S.tableWrap}>
                    <table style={S.table}>
                      <thead>
                        <tr>
                          {['Date', 'Total Calls', 'Critical Calls', 'Crit %', 'Avg Quality'].map(h => (
                            <th key={h} style={S.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...trend].reverse().slice(0,14).map((d, i) => {
                          const cp = d.calls > 0 ? d.criticalCalls / d.calls * 100 : 0;
                          return (
                            <tr key={i} style={S.tr}>
                              <td style={{ ...S.td, fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280' }}>{d.date}</td>
                              <td style={S.tdR}>{d.calls.toLocaleString()}</td>
                              <td style={{ ...S.tdR, color: '#EF4444' }}>{d.criticalCalls.toLocaleString()}</td>
                              <td style={{ ...S.tdR, color: cp > 50 ? '#DC2626' : '#6B7280' }}>{fmtPct(cp)}</td>
                              <td style={{ ...S.tdR, color: d.avgQuality > 70 ? '#059669' : d.avgQuality > 0 ? '#B45309' : '#9CA3AF', fontFamily: 'var(--font-mono)' }}>
                                {fmtPct(d.avgQuality)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:1} }
        select:focus { outline: 2px solid #7C5CFC; outline-offset: 1px; }
        tr:hover td { background: #F9FAFB !important; }
        button:hover:not(:disabled) { opacity: 0.9; }
      `}</style>
    </div>
  );
}

/* ── STYLES ── */
const S: Record<string, React.CSSProperties> = {
  shell:  { display: 'flex', minHeight: '100dvh', background: '#F0F2F8', fontFamily: 'var(--font)' },

  /* sidebar */
  sidebar: { width: 240, flexShrink: 0, background: '#fff', borderRight: '1px solid #E8EAF0', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100dvh' },
  sideHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '24px 20px 20px', borderBottom: '1px solid #F3F4F6' },
  logoWrap: { width: 36, height: 36, borderRadius: 10, background: '#7C5CFC', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(124,92,252,0.3)', flexShrink: 0 },
  logoLabel: { fontSize: 15, fontWeight: 700, color: '#1A1D23', letterSpacing: '-0.2px' },
  navGroup: { fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '16px 20px 8px' },
  navItem: { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '11px 20px', background: 'none', border: 'none', borderRadius: 0, fontSize: 13, fontWeight: 500, color: '#6B7280', cursor: 'pointer', textAlign: 'left', position: 'relative', transition: 'background 0.12s, color 0.12s', fontFamily: 'var(--font)' },
  navActive: { background: 'rgba(124,92,252,0.07)', color: '#7C5CFC', fontWeight: 600 },
  navPill: { position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, background: '#7C5CFC', borderRadius: '0 3px 3px 0' },
  sideFooter: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px 16px', borderTop: '1px solid #F3F4F6' },
  avatar: { width: 30, height: 30, borderRadius: '50%', background: 'rgba(124,92,252,0.12)', color: '#7C5CFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  uName: { fontSize: 12, fontWeight: 600, color: '#1A1D23', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  uRole: { fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' },
  logoutBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4, marginLeft: 'auto' },

  /* main */
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' },
  topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px 16px', background: '#fff', borderBottom: '1px solid #E8EAF0' },
  greeting: { fontSize: 24, fontWeight: 700, color: '#1A1D23', letterSpacing: '-0.5px' },
  greetSub: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  topRight: { display: 'flex', alignItems: 'center', gap: 10 },
  editBtn: { display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#7C5CFC', border: 'none', borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', boxShadow: '0 4px 14px rgba(124,92,252,0.30)', transition: 'opacity 0.12s' },
  spin: { display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },

  filterBar: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 28px 14px', background: '#fff', borderBottom: '1px solid #E8EAF0' },
  sel: { appearance: 'none', WebkitAppearance: 'none', background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 10, color: '#374151', fontSize: 13, padding: '8px 32px 8px 12px', cursor: 'pointer', fontFamily: 'var(--font)', minWidth: 160 },
  dateIn: { background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 10, color: '#374151', fontSize: 12, padding: '7px 12px', fontFamily: 'var(--font)', cursor: 'pointer' },
  clearBtn: { padding: '7px 14px', background: 'none', border: '1.5px solid #E5E7EB', borderRadius: 10, color: '#9CA3AF', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)' },

  errorBanner: { display: 'flex', alignItems: 'center', gap: 8, margin: '12px 28px 0', padding: '10px 14px', background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#EF4444', fontSize: 12 },

  content: { flex: 1, padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' },

  /* skeleton */
  skelGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 },
  skel: { height: 100, background: '#fff', borderRadius: 14, border: '1px solid #E8EAF0', animation: 'pulse 1.4s ease infinite' },

  /* row 1 */
  row1: { display: 'grid', gridTemplateColumns: '320px 1fr', gap: 18, alignItems: 'stretch' },
  overviewCard: { background: '#fff', borderRadius: 16, padding: '22px 24px', border: '1px solid #E8EAF0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 },
  kpiCard: { background: '#fff', border: '1px solid #E8EAF0', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'box-shadow 0.15s, transform 0.15s', minHeight: 130 },
  kpiIconWrap: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  kpiVal: { fontSize: 28, fontWeight: 800, color: '#1A1D23', letterSpacing: '-0.5px', lineHeight: 1.1, marginBottom: 4 },
  kpiLbl: { fontSize: 13, color: '#6B7280', fontWeight: 500 },

  /* cards */
  card: { background: '#fff', border: '1px solid #E8EAF0', borderRadius: 16, padding: '20px 0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0 24px 16px', borderBottom: '1px solid #F3F4F6' },
  cardLabel: { fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: 700, color: '#1A1D23' },
  cardSub: { fontSize: 12, color: '#9CA3AF', marginTop: 3 },

  /* table */
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { padding: '12px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #F9FAFB', transition: 'background 0.1s' },
  td: { padding: '13px 18px', color: '#374151', verticalAlign: 'middle', fontSize: 13 },
  tdR: { padding: '13px 18px', textAlign: 'right', color: '#374151', fontVariantNumeric: 'tabular-nums', verticalAlign: 'middle', fontSize: 13 },

  empty: { padding: '40px 24px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 },
};

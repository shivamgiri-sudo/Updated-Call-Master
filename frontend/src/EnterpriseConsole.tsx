import React, { useEffect, useMemo, useState } from "react";
import { API_BASE, apiGet } from "./services/api";
import "./funnel-polish.css";

type ApiResponse<T> = { success: boolean; data: T; source?: string; warning?: string };
type PageKey = "Executive IQ" | "Sales Funnel" | "Rejection Funnel" | "Live Assist" | "AI Studio" | "Best Call Library" | "SaaS Control" | "Critical Insights" | "Enterprise Readiness";

const pages: PageKey[] = ["Executive IQ", "Sales Funnel", "Rejection Funnel", "Live Assist", "AI Studio", "Best Call Library", "SaaS Control", "Critical Insights", "Enterprise Readiness"];
const processes = ["FINNABLE", "INSURANCE-UPSELL", "RETENTION", "SUPPORT-INBOUND"];

const executiveFallback = {
  kpis: { totalCalls: 38436, totalRevenue: 14476000, avgConversion: 18.66, avgQuality: 86.48, criticalInsights: 2, activeRisks: 5, liveAssistCoverage: 73.4, coachableLeakage: 84.6 },
  processScorecards: [
    { process: "FINNABLE", branch: "Noida", calls: 12840, conversion: 18.57, rejection: 38.8, quality: 84.7, revenue: 4432000, risk: "HIGH" },
    { process: "INSURANCE-UPSELL", branch: "Ahmedabad", calls: 8420, conversion: 21.3, rejection: 32.1, quality: 88.2, revenue: 6120000, risk: "MEDIUM" },
    { process: "RETENTION", branch: "Noida", calls: 6988, conversion: 16.1, rejection: 41.6, quality: 81.4, revenue: 3924000, risk: "CRITICAL" },
    { process: "SUPPORT-INBOUND", branch: "Ahmedabad", calls: 10188, conversion: 0, rejection: 0, quality: 91.6, revenue: 0, risk: "LOW" }
  ],
  insightCards: [
    { id: "INS-001", severity: "CRITICAL", title: "Sales leakage after need discovery", process: "FINNABLE", impact: "INR 31.9L estimated missed revenue", evidence: "1,596 calls dropped between Need Identified and Offer Explained.", recommendation: "Run micro-coaching on need-to-offer bridge.", owner: "Training + TL", due: "Today" },
    { id: "INS-002", severity: "HIGH", title: "Price objection spike", process: "FINNABLE", impact: "+24.5% vs baseline", evidence: "Price appears before value in rejected calls.", recommendation: "Enforce value-before-price script.", owner: "QA + Ops", due: "24 hours" }
  ],
  conversionTrend: []
};

const salesFallback = {
  source: "demo_fallback",
  kpis: { connectedCalls: 12840, salesDone: 2384, verifiedSales: 2216, conversionPercent: 18.57, verifiedConversionPercent: 17.26, estimatedRevenue: 4432000, missedRevenue: 13112000, highestLeakageStage: "Need identified to Offer explained", coachableLeakagePercent: 84.6 },
  stages: [
    { key: "connected", label: "Connected calls", count: 12840, previousConversion: 100, totalConversion: 100, leakage: 0, leakageReason: "Base connected universe", coachableImpact: "LOW" },
    { key: "opening_attempted", label: "Opening attempted", count: 12190, previousConversion: 94.94, totalConversion: 94.94, leakage: 650, leakageReason: "Agent skipped structured opening", coachableImpact: "HIGH" },
    { key: "offer_explained", label: "Offer explained", count: 8122, previousConversion: 66.63, totalConversion: 63.25, leakage: 4068, leakageReason: "Offer not explained clearly", coachableImpact: "HIGH" },
    { key: "objection_handled", label: "Objection handled", count: 4238, previousConversion: 52.18, totalConversion: 33.01, leakage: 3884, leakageReason: "Rebuttal not aligned to objection", coachableImpact: "CRITICAL" },
    { key: "sale_done", label: "Sale done", count: 2384, previousConversion: 56.25, totalConversion: 18.57, leakage: 1854, leakageReason: "Last-mile hesitation", coachableImpact: "MEDIUM" }
  ],
  trends: [],
  leakageReasons: [
    { reason: "Weak need discovery", calls: 1596, missedRevenue: 3192000, coachable: 92, severity: "CRITICAL" },
    { reason: "Generic objection rebuttal", calls: 1478, missedRevenue: 2956000, coachable: 88, severity: "CRITICAL" },
    { reason: "Offer explained without urgency", calls: 1128, missedRevenue: 2256000, coachable: 77, severity: "HIGH" }
  ],
  agentImpact: [
    { agent: "Aarav Singh", team: "Noida", calls: 428, conversion: 24.8, rejection: 31.4, leakageStage: "Need identified", quality: 91.2, action: "Use as best-call library sample" },
    { agent: "Rohan Verma", team: "Noida", calls: 512, conversion: 13.9, rejection: 48.6, leakageStage: "Objection handled", quality: 72.5, action: "Critical objection-handling coaching" }
  ]
};

const rejectionFallback = {
  source: "demo_fallback",
  kpis: { connectedCalls: 12840, finalLost: 4982, rejectionPercent: 38.8, coachableRejectionPercent: 76.4, highestRejectionReason: "Price too high after offer explanation", recoveryCandidates: 1318, estimatedRecoverableRevenue: 2636000 },
  stages: [
    { key: "connected", label: "Connected calls", count: 12840, previousConversion: 100, totalConversion: 100, leakage: 0, leakageReason: "Base connected universe", coachableImpact: "LOW" },
    { key: "opening_rejected", label: "Opening rejected", count: 1856, previousConversion: 14.45, totalConversion: 14.45, leakage: 1856, leakageReason: "Customer refused early", coachableImpact: "MEDIUM" },
    { key: "offer_rejected", label: "Offer rejected", count: 1642, previousConversion: 88.47, totalConversion: 12.79, leakage: 214, leakageReason: "Offer permission failed", coachableImpact: "HIGH" },
    { key: "objection_recorded", label: "Objection recorded", count: 2324, previousConversion: 141.53, totalConversion: 18.1, leakage: 0, leakageReason: "Customer objection captured", coachableImpact: "HIGH" },
    { key: "final_lost", label: "Final lost", count: 4982, previousConversion: 214.37, totalConversion: 38.8, leakage: 3658, leakageReason: "Unrecovered rejection", coachableImpact: "CRITICAL" }
  ],
  trends: [],
  rejectionReasons: [
    { reason: "Not interested", calls: 1420, trend: 18.2, coachable: 54, action: "Improve permission-based opening" },
    { reason: "Price too high", calls: 1164, trend: 24.5, coachable: 82, action: "Value-before-price coaching" },
    { reason: "Already using competitor", calls: 726, trend: 11.4, coachable: 76, action: "Competitor differentiation playbook" }
  ],
  agentImpact: salesFallback.agentImpact
};

const liveFallback = { session: { sessionId: "LIVE-FIN-001", agent: "Aarav Singh", team: "Noida", duration: "02:42", liveScore: 72, predictedOutcome: "Recoverable sale", nextBestAction: "Bridge benefit to price and reconfirm consent." }, transcript: [], events: [], checklist: [] };
const aiFallback = { prompts: [], governance: [], framework: [] };
const libraryFallback = { bestCalls: [], playlists: [] };
const saasFallback = { tenant: { tenantName: "Mas CallNet Enterprise Demo", plan: "Enterprise AI Command Center", activeUsers: 1240, monthlyCalls: 842600, aiAuditsThisMonth: 218400, liveAssistSessions: 62420, dataRetentionDays: 365 }, features: [], readiness: [], freshness: [], security: [] };

const funnelRoleReviews = [
  { role: "CEO", focus: "Revenue impact", insight: "Prioritize the largest leakage stage and validate missed revenue assumptions.", action: "Approve one recovery sprint per funnel." },
  { role: "Ops", focus: "Execution", insight: "Stage leakage must be converted into TL-level action queues.", action: "Review bottom agents daily." },
  { role: "QA", focus: "Evidence", insight: "Leakage reason must be tied to transcript evidence and parameter failure.", action: "Audit top 20 leakage calls." },
  { role: "Trainer", focus: "Coaching", insight: "Convert recurring stage misses into micro-learning playlists.", action: "Build targeted role-play packs." },
  { role: "TL", focus: "Agent behavior", insight: "Agents need stage-specific improvement tasks, not generic feedback.", action: "Coach by stage and verify next-day calls." },
  { role: "Tester", focus: "Quality gate", insight: "Verify MySQL source, fallback source, empty states and filters.", action: "Run API failure and date-filter test cases." }
];

const salesMailTemplates = [
  { name: "Sales leakage alert", subject: "Critical Sales Funnel Leakage Detected", audience: "Ops, QA, Trainer, TL", layout: "Stage, count, leakage, revenue impact, owner, deadline" },
  { name: "Sales recovery summary", subject: "Daily Sales Recovery Action Summary", audience: "CEO, T&Q, Ops", layout: "Top leakage, agent impact, coaching actions, expected uplift" }
];

const rejectionMailTemplates = [
  { name: "Rejection spike alert", subject: "Customer Rejection Spike Detected", audience: "Ops, QA, Trainer, TL", layout: "Reason, volume, rebuttal attempt, recoverable cases" },
  { name: "Recovery candidate digest", subject: "Daily Rejection Recovery Candidate List", audience: "TL, Trainer", layout: "Agent, reason, call count, rebuttal gap, next action" }
];

function formatNumber(value: number) { return new Intl.NumberFormat("en-IN").format(Number(value || 0)); }
function formatMoney(value: number) { return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value || 0))}`; }
function Badge({ value }: { value: string }) { return <span className={`badge ${String(value).toLowerCase().replace(/\s+/g, "-")}`}>{value}</span>; }
function KpiCard({ label, value, sub, tone = "" }: { label: string; value: React.ReactNode; sub?: string; tone?: string }) { return <div className={`kpi-card ${tone}`}><div className="kpi-label">{label}</div><div className="kpi-value">{value}</div>{sub && <div className="kpi-sub">{sub}</div>}</div>; }
function SectionTitle({ title, sub }: { title: string; sub: string }) { return <div className="section-title"><h3>{title}</h3><span>{sub}</span></div>; }
function renderCell(value: any) { if (Array.isArray(value)) return <div className="tag-row">{value.map((x) => <span key={x}>{x}</span>)}</div>; if (["HIGH", "CRITICAL", "LOW", "MEDIUM", "PASS", "GAP", "PARTIAL", "ACTIVE", "PENDING", "HEALTHY", "DELAYED", "DEMO", "VALID", "PILOT", "CONTROLLED", "WATCH", "READY", "mysql_readonly", "demo_fallback"].includes(String(value))) return <Badge value={String(value)} />; return String(value); }
function DataTable({ columns, rows }: { columns: string[]; rows: any[] }) { return <div className="table-wrap"><table><thead><tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr></thead><tbody>{(rows || []).map((row, i) => <tr key={i}>{columns.map((c) => <td key={c}>{renderCell(row[c] ?? row[c.toLowerCase()] ?? "-")}</td>)}</tr>)}</tbody></table></div>; }
function BarChart({ rows, labelKey, valueKey, title, suffix = "" }: { rows: any[]; labelKey: string; valueKey: string; title: string; suffix?: string }) { const max = Math.max(...(rows || []).map((r) => Number(r[valueKey] || 0)), 1); return <div className="card chart-card"><SectionTitle title={title} sub={`${(rows || []).length} data points`} /><div className="bar-chart">{(rows || []).map((row) => { const value = Number(row[valueKey] || 0); return <div className="bar-row" key={row[labelKey]}><div className="bar-label">{row[labelKey]}</div><div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max((value / max) * 100, 4)}%` }} /></div><div className="bar-value">{suffix === "₹" ? formatMoney(value) : `${value}${suffix}`}</div></div>; })}</div></div>; }
function Funnel({ title, stages, mode }: { title: string; stages: any[]; mode: "sales" | "rejection" }) { const max = Math.max(...(stages || []).map((s) => Number(s.count || 0)), 1); return <div className="card funnel-card"><SectionTitle title={title} sub="Every transition includes count, conversion, leakage and reason" /><div className="funnel">{(stages || []).map((stage, index) => <div className={`funnel-stage ${mode}`} key={stage.key} style={{ width: `${Math.max((Number(stage.count || 0) / max) * 100, 22)}%` }}><div className="stage-top"><strong>{index + 1}. {stage.label}</strong><Badge value={stage.coachableImpact} /></div><div className="stage-count">{formatNumber(stage.count)}</div><div className="stage-grid"><span>Prev conv: <b>{stage.previousConversion}%</b></span><span>Total conv: <b>{stage.totalConversion}%</b></span><span>Leakage: <b>{formatNumber(stage.leakage)}</b></span></div><p>{stage.leakageReason}</p></div>)}</div></div>; }
function SourceBanner({ source, warning, module }: { source?: string; warning?: string; module: string }) { const live = source === "mysql_readonly"; return <div className={`source-banner ${live ? "mysql" : "demo"}`}><div><strong>{module} data source: {live ? "Live read-only MySQL" : "Premium demo fallback"}</strong><p>{live ? "This page is reading from approved source tables using read-only aggregation." : warning || "Fallback mode is active until DB credentials, mapping or production data are available."}</p></div><Badge value={live ? "mysql_readonly" : "demo_fallback"} /></div>; }
function PageCyclePanel({ page, mailTemplates }: { page: string; mailTemplates: any[] }) { return <section className="grid two"><div className="card"><SectionTitle title={`${page} role review`} sub="developer, designer, tester, product and business lens" /><div className="role-review-grid">{funnelRoleReviews.map((r) => <div className="role-review-card" key={`${page}-${r.role}`}><Badge value={r.role} /><h4>{r.focus}</h4><p>{r.insight}</p><p><b>Action:</b> {r.action}</p></div>)}</div></div><div className="card"><SectionTitle title={`${page} communication templates`} sub="connected email improvements" /><div className="role-review-grid">{mailTemplates.map((m) => <div className="mail-preview" key={m.name}><h4>{m.name}</h4><p><b>Subject:</b> {m.subject}</p><p><b>Audience:</b> {m.audience}</p><p><b>Layout:</b> {m.layout}</p></div>)}</div></div></section>; }

function ExecutivePage({ executive }: { executive: any }) { return <><section className="hero"><div><span className="eyebrow">Call Master Enterprise IQ</span><h1>AI command center for revenue, quality, rejection and live agent performance.</h1><p>Built for CEO reviews, operation war rooms, training governance and enterprise SaaS adoption.</p></div><div className="hero-panel"><div>Enterprise readiness</div><strong>86%</strong><span>Demo-ready with production backlog visible</span></div></section><section className="kpi-grid"><KpiCard label="Total calls" value={formatNumber(executive.kpis.totalCalls)} sub="Across active processes" /><KpiCard label="Revenue influenced" value={formatMoney(executive.kpis.totalRevenue)} sub="Pipeline estimate" tone="gold" /><KpiCard label="Avg conversion" value={`${executive.kpis.avgConversion}%`} sub="Sales processes" /><KpiCard label="Avg quality" value={`${executive.kpis.avgQuality}%`} sub="Audit health" /><KpiCard label="Coachable leakage" value={`${executive.kpis.coachableLeakage}%`} sub="Recoverable behaviors" tone="danger" /><KpiCard label="Live assist coverage" value={`${executive.kpis.liveAssistCoverage}%`} sub="Calls with real-time guidance" /></section><section className="grid two"><BarChart title="Revenue by process" rows={executive.processScorecards.filter((r: any) => r.revenue > 0)} labelKey="process" valueKey="revenue" suffix="₹" /><BarChart title="Conversion by process" rows={executive.processScorecards.filter((r: any) => r.conversion > 0)} labelKey="process" valueKey="conversion" suffix="%" /></section><div className="card"><SectionTitle title="Process control tower" sub="CEO-ready comparison" /><DataTable columns={["process", "branch", "calls", "conversion", "rejection", "quality", "revenue", "risk"]} rows={executive.processScorecards.map((r: any) => ({ ...r, calls: formatNumber(r.calls), conversion: `${r.conversion}%`, rejection: `${r.rejection}%`, quality: `${r.quality}%`, revenue: formatMoney(r.revenue) }))} /></div></>; }
function SalesPage({ sales }: { sales: any }) { return <><SourceBanner module="Sales Funnel" source={sales.source} warning={sales.warning} /><section className="kpi-grid"><KpiCard label="Connected" value={formatNumber(sales.kpis.connectedCalls)} sub="Funnel base" /><KpiCard label="Sale done" value={formatNumber(sales.kpis.salesDone)} sub={`${sales.kpis.conversionPercent}% conversion`} /><KpiCard label="Verified sale" value={formatNumber(sales.kpis.verifiedSales)} sub={`${sales.kpis.verifiedConversionPercent}% verified`} /><KpiCard label="Revenue" value={formatMoney(sales.kpis.estimatedRevenue)} sub="Realized" tone="gold" /><KpiCard label="Missed revenue" value={formatMoney(sales.kpis.missedRevenue)} sub="Leakage opportunity" tone="danger" /><KpiCard label="Top leakage" value={sales.kpis.highestLeakageStage} sub="Priority transition" /></section><Funnel title="Customer sales transition funnel" stages={sales.stages} mode="sales" /><section className="grid two"><div className="card"><SectionTitle title="Top leakage reasons" sub="Ranked by business impact" /><DataTable columns={["reason", "calls", "missedRevenue", "coachable", "severity"]} rows={(sales.leakageReasons || []).map((r: any) => ({ ...r, missedRevenue: formatMoney(r.missedRevenue), coachable: `${r.coachable}%` }))} /></div><div className="card"><SectionTitle title="Agent transition impact" sub="from live aggregation or fallback" /><DataTable columns={["agent", "team", "calls", "conversion", "rejection", "leakageStage", "action"]} rows={(sales.agentImpact || []).map((r: any) => ({ ...r, conversion: `${r.conversion}%`, rejection: `${r.rejection}%` }))} /></div></section><PageCyclePanel page="Sales Funnel" mailTemplates={salesMailTemplates} /></>; }
function RejectionPage({ rejection }: { rejection: any }) { return <><SourceBanner module="Rejection Funnel" source={rejection.source} warning={rejection.warning} /><section className="kpi-grid"><KpiCard label="Connected" value={formatNumber(rejection.kpis.connectedCalls)} sub="Rejection universe" /><KpiCard label="Final lost" value={formatNumber(rejection.kpis.finalLost)} sub={`${rejection.kpis.rejectionPercent}% rejection`} tone="danger" /><KpiCard label="Coachable rejection" value={`${rejection.kpis.coachableRejectionPercent}%`} sub="Recoverable" /><KpiCard label="Recovery candidates" value={formatNumber(rejection.kpis.recoveryCandidates)} sub="Callback opportunity" tone="gold" /><KpiCard label="Recoverable revenue" value={formatMoney(rejection.kpis.estimatedRecoverableRevenue)} sub="Estimated opportunity" /><KpiCard label="Top reason" value={rejection.kpis.highestRejectionReason} sub="Priority action" /></section><Funnel title="Customer rejection transition funnel" stages={rejection.stages} mode="rejection" /><section className="grid two"><div className="card"><SectionTitle title="Rejection reason intelligence" sub="coachability and recovery action" /><DataTable columns={["reason", "calls", "trend", "coachable", "action"]} rows={(rejection.rejectionReasons || []).map((r: any) => ({ ...r, trend: `${r.trend}%`, coachable: `${r.coachable}%` }))} /></div><div className="card"><SectionTitle title="Agent rejection impact" sub="agent-level recovery view" /><DataTable columns={["agent", "team", "calls", "conversion", "rejection", "leakageStage", "action"]} rows={(rejection.agentImpact || []).map((r: any) => ({ ...r, conversion: `${r.conversion}%`, rejection: `${r.rejection}%` }))} /></div></section><PageCyclePanel page="Rejection Funnel" mailTemplates={rejectionMailTemplates} /></>; }
function LiveAssistPage({ live }: { live: any }) { return <section className="live-hero card"><div><span className="eyebrow">Live session</span><h2>{live.session.sessionId}</h2><p>{live.session.agent} • {live.session.team} • {live.session.duration}</p></div><div className="live-score"><span>Live score</span><strong>{live.session.liveScore}</strong><small>{live.session.predictedOutcome}</small></div><div className="next-action"><span>Next best action</span><b>{live.session.nextBestAction}</b></div></section>; }
function InsightsPage({ insights }: { insights: any[] }) { return <div className="insight-grid">{(insights || []).map((insight) => <div className="insight-card" key={insight.id}><div className="insight-head"><Badge value={insight.severity} /><span>{insight.id} • {insight.process}</span></div><h3>{insight.title}</h3><div className="impact">{insight.impact}</div><p><b>Evidence:</b> {insight.evidence}</p><p><b>AI recommendation:</b> {insight.recommendation}</p><div className="owner-row"><span>Owner: {insight.owner}</span><span>Due: {insight.due}</span></div></div>)}</div>; }
function AIStudioPage({ ai }: { ai: any }) { return <><section className="grid two"><div className="card"><SectionTitle title="AI governance cockpit" sub="model, prompt, cost and variance" /><div className="module-grid">{(ai.governance || []).map((g: any) => <div className="module-tile" key={g.metric}><Badge value={g.status} /><h3>{g.value}</h3><p>{g.metric}</p><small>{g.note}</small></div>)}</div></div><div className="card"><SectionTitle title="Audit framework builder" sub="parameter control plane" /><DataTable columns={["category", "parameter", "weight", "fatal", "liveAssist", "evidenceRequired"]} rows={ai.framework || []} /></div></section><div className="card"><SectionTitle title="Prompt Studio" sub="enterprise AI prompt lifecycle" /><DataTable columns={["promptId", "name", "process", "status", "model", "schemaStatus", "avgConfidence", "tokenCostToday", "humanOverrideRate", "lastCalibrated"]} rows={(ai.prompts || []).map((p: any) => ({ ...p, avgConfidence: `${p.avgConfidence}%`, tokenCostToday: `₹${p.tokenCostToday}`, humanOverrideRate: `${p.humanOverrideRate}%` }))} /></div></>; }
function BestCallLibraryPage({ library }: { library: any }) { return <><section className="library-grid">{(library.bestCalls || []).map((call: any) => <div className="call-card" key={call.callId}><div className="call-card-head"><Badge value={call.conversion} /><span>{call.duration}</span></div><h3>{call.callId}</h3><p>{call.snippet}</p><div className="call-meta"><span>{call.agent}</span><span>{call.quality}% quality</span></div><div className="tag-row">{(call.tags || []).map((t: string) => <span key={t}>{t}</span>)}</div><b>{call.coachingUse}</b></div>)}</section><div className="card"><SectionTitle title="Coaching playlists" sub="convert best calls into academy content" /><DataTable columns={["name", "calls", "owner", "completionRate", "targetAudience"]} rows={(library.playlists || []).map((p: any) => ({ ...p, completionRate: `${p.completionRate}%` }))} /></div></>; }
function SaaSControlPage({ saas }: { saas: any }) { return <><section className="kpi-grid"><KpiCard label="Tenant" value={saas.tenant.tenantName} sub={saas.tenant.plan} /><KpiCard label="Active users" value={formatNumber(saas.tenant.activeUsers)} sub="Provisioned users" /><KpiCard label="Monthly calls" value={formatNumber(saas.tenant.monthlyCalls)} sub="Tenant volume" /><KpiCard label="AI audits" value={formatNumber(saas.tenant.aiAuditsThisMonth)} sub="This month" /><KpiCard label="Live sessions" value={formatNumber(saas.tenant.liveAssistSessions)} sub="This month" /><KpiCard label="Retention" value={`${saas.tenant.dataRetentionDays} days`} sub="Tenant policy" /></section><section className="grid two"><div className="card"><SectionTitle title="Feature control" sub="SaaS module flags" /><DataTable columns={["label", "enabled", "maturity", "owner"]} rows={saas.features || []} /></div><div className="card"><SectionTitle title="Security posture" sub="enterprise controls" /><DataTable columns={["control", "status", "maturity"]} rows={saas.security || []} /></div></section></>; }
function ReadinessPage({ saas }: { saas: any }) { return <section className="grid two"><div className="card"><SectionTitle title="Enterprise readiness checks" sub="demo to production scoring" /><DataTable columns={["area", "status", "score", "evidence"]} rows={saas.readiness || []} /></div><div className="card"><SectionTitle title="Data freshness center" sub="source health and latency" /><DataTable columns={["source", "status", "lastSync", "latency", "recordsToday"]} rows={(saas.freshness || []).map((f: any) => ({ ...f, recordsToday: formatNumber(f.recordsToday) }))} /></div></section>; }

export default function EnterpriseConsole() {
  const [page, setPage] = useState<PageKey>("Executive IQ");
  const [selectedProcess, setSelectedProcess] = useState("FINNABLE");
  const [role, setRole] = useState("CEO");
  const [source, setSource] = useState("Premium demo fallback loaded");
  const [executive, setExecutive] = useState<any>(executiveFallback);
  const [sales, setSales] = useState<any>(salesFallback);
  const [rejection, setRejection] = useState<any>(rejectionFallback);
  const [live, setLive] = useState<any>(liveFallback);
  const [ai, setAi] = useState<any>(aiFallback);
  const [library, setLibrary] = useState<any>(libraryFallback);
  const [saas, setSaas] = useState<any>(saasFallback);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [exec, salesRes, rejectRes, liveRes, prompts, governance, framework, bestCalls, playlists, tenant, features, readiness, freshness, security] = await Promise.all([
          apiGet<ApiResponse<any>>("/api/executive/dashboard"),
          apiGet<ApiResponse<any>>(`/api/funnels/${encodeURIComponent(selectedProcess)}/sales-transition`),
          apiGet<ApiResponse<any>>(`/api/funnels/${encodeURIComponent(selectedProcess)}/rejection-transition`),
          apiGet<ApiResponse<any>>("/api/live/demo"),
          apiGet<ApiResponse<any[]>>("/api/ai-studio/prompts"),
          apiGet<ApiResponse<any[]>>("/api/ai-studio/governance"),
          apiGet<ApiResponse<any[]>>("/api/ai-studio/framework"),
          apiGet<ApiResponse<any[]>>("/api/library/best-calls"),
          apiGet<ApiResponse<any[]>>("/api/library/playlists"),
          apiGet<ApiResponse<any>>("/api/saas/tenant-summary"),
          apiGet<ApiResponse<any[]>>("/api/saas/feature-flags"),
          apiGet<ApiResponse<any[]>>("/api/saas/readiness"),
          apiGet<ApiResponse<any[]>>("/api/saas/data-freshness"),
          apiGet<ApiResponse<any[]>>("/api/saas/security-posture")
        ]);
        if (cancelled) return;
        setExecutive(exec.data);
        setSales({ ...salesRes.data, source: salesRes.source, warning: salesRes.warning });
        setRejection({ ...rejectRes.data, source: rejectRes.source, warning: rejectRes.warning });
        setLive(liveRes.data);
        setAi({ prompts: prompts.data, governance: governance.data, framework: framework.data });
        setLibrary({ bestCalls: bestCalls.data, playlists: playlists.data });
        setSaas({ tenant: tenant.data, features: features.data, readiness: readiness.data, freshness: freshness.data, security: security.data });
        setSource(`Live API connected: ${API_BASE}`);
      } catch (err: any) {
        if (!cancelled) setSource(`Premium fallback active. API/auth/DB pending: ${err.message?.slice(0, 90) || "unknown"}`);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedProcess]);

  const content = useMemo(() => {
    if (page === "Sales Funnel") return <SalesPage sales={sales} />;
    if (page === "Rejection Funnel") return <RejectionPage rejection={rejection} />;
    if (page === "Live Assist") return <LiveAssistPage live={live} />;
    if (page === "AI Studio") return <AIStudioPage ai={ai} />;
    if (page === "Best Call Library") return <BestCallLibraryPage library={library} />;
    if (page === "SaaS Control") return <SaaSControlPage saas={saas} />;
    if (page === "Critical Insights") return <InsightsPage insights={executive.insightCards} />;
    if (page === "Enterprise Readiness") return <ReadinessPage saas={saas} />;
    return <ExecutivePage executive={executive} />;
  }, [page, executive, sales, rejection, live, ai, library, saas]);

  return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark">CM</div><div><h1>Call Master</h1><p>Enterprise IQ</p></div></div><div className="nav-section"><span>Enterprise modules</span>{pages.map((p) => <button key={p} className={page === p ? "active" : ""} onClick={() => setPage(p)}>{p}</button>)}</div><div className="sidebar-card"><b>World-class SaaS build</b><p>Executive intelligence, live assist, AI governance, best-call academy, tenant control and production readiness in one premium console.</p></div></aside><main className="main"><header className="topbar"><div><h2>{page}</h2><p>{source}</p></div><div className="filters"><select value={selectedProcess} onChange={(e) => setSelectedProcess(e.target.value)}>{processes.map((p) => <option key={p}>{p}</option>)}</select><select value={role} onChange={(e) => setRole(e.target.value)}><option>CEO</option><option>T&Q Head</option><option>Ops Manager</option><option>QA Auditor</option><option>Trainer</option><option>TL</option><option>Client</option></select><button onClick={() => window.print()}>Export view</button></div></header>{content}</main></div>;
}

import React, { useEffect, useMemo, useState } from "react";
import { API_BASE, apiGet } from "./services/api";
import "./funnel-polish.css";

type ApiResponse<T> = { success: boolean; data: T; source?: string; warning?: string };
type PageKey = "Executive IQ" | "Sales Funnel" | "Rejection Funnel" | "Live Assist" | "AI Studio" | "Best Call Library" | "SaaS Control" | "Critical Insights" | "Enterprise Readiness" | "Email Template Center" | "Coaching Calendar" | "Client Portal";

const pages: PageKey[] = ["Executive IQ", "Sales Funnel", "Rejection Funnel", "Live Assist", "AI Studio", "Best Call Library", "SaaS Control", "Critical Insights", "Enterprise Readiness", "Email Template Center", "Coaching Calendar", "Client Portal"];
const processes = ["FINNABLE", "INSURANCE-UPSELL", "RETENTION", "SUPPORT-INBOUND"];

const executiveFallback = {
  kpis: { totalCalls: 38436, totalRevenue: 14476000, avgConversion: 18.66, avgQuality: 86.48, criticalInsights: 2, activeRisks: 5, liveAssistCoverage: 73.4, coachableLeakage: 84.6 },
  processScorecards: [
    { process: "FINNABLE", branch: "Noida", calls: 12840, conversion: 18.57, rejection: 38.8, quality: 84.7, revenue: 4432000, risk: "HIGH" },
    { process: "INSURANCE-UPSELL", branch: "Ahmedabad", calls: 8420, conversion: 21.3, rejection: 32.1, quality: 88.2, revenue: 6120000, risk: "MEDIUM" },
    { process: "RETENTION", branch: "Noida", calls: 6988, conversion: 16.1, rejection: 41.6, quality: 81.4, revenue: 3924000, risk: "CRITICAL" }
  ],
  insightCards: [
    { id: "INS-001", severity: "CRITICAL", title: "Sales leakage after need discovery", process: "FINNABLE", impact: "INR 31.9L missed revenue", evidence: "Need-to-offer drop visible in funnel", recommendation: "Run recovery sprint", owner: "Training + TL", due: "Today" },
    { id: "INS-002", severity: "HIGH", title: "Price objection spike", process: "FINNABLE", impact: "+24.5% vs baseline", evidence: "Price before value", recommendation: "Enforce value-before-price", owner: "QA + Ops", due: "24 hours" }
  ]
};

const salesFallback = {
  source: "demo_fallback",
  kpis: { connectedCalls: 12840, salesDone: 2384, verifiedSales: 2216, conversionPercent: 18.57, verifiedConversionPercent: 17.26, estimatedRevenue: 4432000, missedRevenue: 13112000, highestLeakageStage: "Need identified to Offer explained", coachableLeakagePercent: 84.6 },
  stages: [
    { key: "connected", label: "Connected calls", count: 12840, previousConversion: 100, totalConversion: 100, leakage: 0, leakageReason: "Base connected universe", coachableImpact: "LOW" },
    { key: "opening_attempted", label: "Opening attempted", count: 12190, previousConversion: 94.94, totalConversion: 94.94, leakage: 650, leakageReason: "Structured opening skipped", coachableImpact: "HIGH" },
    { key: "offer_explained", label: "Offer explained", count: 8122, previousConversion: 66.63, totalConversion: 63.25, leakage: 4068, leakageReason: "Offer not explained clearly", coachableImpact: "HIGH" },
    { key: "objection_handled", label: "Objection handled", count: 4238, previousConversion: 52.18, totalConversion: 33.01, leakage: 3884, leakageReason: "Rebuttal not aligned", coachableImpact: "CRITICAL" },
    { key: "sale_done", label: "Sale done", count: 2384, previousConversion: 56.25, totalConversion: 18.57, leakage: 1854, leakageReason: "Last-mile hesitation", coachableImpact: "MEDIUM" }
  ],
  leakageReasons: [
    { reason: "Weak need discovery", calls: 1596, missedRevenue: 3192000, coachable: 92, severity: "CRITICAL" },
    { reason: "Generic objection rebuttal", calls: 1478, missedRevenue: 2956000, coachable: 88, severity: "CRITICAL" },
    { reason: "Offer without urgency", calls: 1128, missedRevenue: 2256000, coachable: 77, severity: "HIGH" }
  ],
  agentImpact: [
    { agent: "Aarav Singh", team: "Noida", calls: 428, conversion: 24.8, rejection: 31.4, leakageStage: "Need identified", action: "Use as best-call sample" },
    { agent: "Rohan Verma", team: "Noida", calls: 512, conversion: 13.9, rejection: 48.6, leakageStage: "Objection handled", action: "Critical coaching" }
  ]
};

const rejectionFallback = {
  source: "demo_fallback",
  kpis: { connectedCalls: 12840, finalLost: 4982, rejectionPercent: 38.8, coachableRejectionPercent: 76.4, highestRejectionReason: "Price too high", recoveryCandidates: 1318, estimatedRecoverableRevenue: 2636000 },
  stages: [
    { key: "connected", label: "Connected calls", count: 12840, previousConversion: 100, totalConversion: 100, leakage: 0, leakageReason: "Base connected universe", coachableImpact: "LOW" },
    { key: "opening_rejected", label: "Opening rejected", count: 1856, previousConversion: 14.45, totalConversion: 14.45, leakage: 1856, leakageReason: "Early refusal", coachableImpact: "MEDIUM" },
    { key: "offer_rejected", label: "Offer rejected", count: 1642, previousConversion: 88.47, totalConversion: 12.79, leakage: 214, leakageReason: "Offer permission failed", coachableImpact: "HIGH" },
    { key: "objection_recorded", label: "Objection recorded", count: 2324, previousConversion: 141.53, totalConversion: 18.1, leakage: 0, leakageReason: "Objection captured", coachableImpact: "HIGH" },
    { key: "final_lost", label: "Final lost", count: 4982, previousConversion: 214.37, totalConversion: 38.8, leakage: 3658, leakageReason: "Unrecovered rejection", coachableImpact: "CRITICAL" }
  ],
  rejectionReasons: [
    { reason: "Not interested", calls: 1420, trend: 18.2, coachable: 54, action: "Improve permission opening" },
    { reason: "Price too high", calls: 1164, trend: 24.5, coachable: 82, action: "Value-before-price coaching" },
    { reason: "Competitor", calls: 726, trend: 11.4, coachable: 76, action: "Differentiation playbook" }
  ],
  agentImpact: salesFallback.agentImpact
};

const liveFallback = {
  source: "partial_production_contract",
  session: { sessionId: "LIVE-FIN-20260616-001", processCode: "FINNABLE", agent: "Aarav Singh", team: "Noida", callStatus: "LIVE", duration: "02:42", customerMood: "Interested but price-sensitive", liveScore: 72, predictedOutcome: "Recoverable sale", nextBestAction: "Complete benefit-to-price bridge, then reconfirm consent." },
  transcript: [
    { speaker: "Agent", ts: "00:03", text: "Good morning, this is Aarav calling regarding your premium upgrade option." },
    { speaker: "Customer", ts: "00:18", text: "Okay, but I do not want anything expensive." },
    { speaker: "Customer", ts: "01:23", text: "That sounds useful. How soon can it activate?" }
  ],
  events: [
    { ts: "00:41", severity: "HIGH", title: "Price before value", message: "Coach live: explain benefit before discount.", confidence: 91 },
    { ts: "01:44", severity: "HIGH", title: "Buying signal", message: "Customer asked activation time; move to reconfirmation.", confidence: 87 }
  ],
  checklist: [
    { item: "Greeting", status: "PASS", score: 10, evidence: "Opening completed." },
    { item: "Benefit explanation", status: "FAIL", score: 3, evidence: "Offer before benefit." }
  ],
  pipeline: [
    { stage: "Audio intake", status: "PARTIAL", targetLatency: "0-3 sec", currentMode: "Needs telephony stream" },
    { stage: "Speech-to-text chunking", status: "DESIGNED", targetLatency: "3-8 sec", currentMode: "Use cm_live_transcript_chunk" },
    { stage: "PII masking", status: "REQUIRED", targetLatency: "Before AI", currentMode: "Must enforce" },
    { stage: "Rule engine", status: "READY", targetLatency: "Under 5 sec", currentMode: "Can run on chunks" },
    { stage: "Next best action", status: "DESIGNED", targetLatency: "10-30 sec", currentMode: "Use cm_live_assist_event" }
  ],
  readiness: [
    { check: "Live UI demo", status: "PASS", detail: "Session and events exist." },
    { check: "Telephony stream", status: "GAP", detail: "Production integration pending." },
    { check: "WebSocket/SSE gateway", status: "GAP", detail: "Needed for browser updates." }
  ]
};

const aiFallback = {
  prompts: [
    { promptId: "PROMPT-SALES-001", name: "Outbound Sales Audit", process: "FINNABLE", status: "ACTIVE", model: "LLM Router", schemaStatus: "VALID", avgConfidence: "91.4%", tokenCostToday: "INR 1840", humanOverrideRate: "4.8%", lastCalibrated: "2026-06-15" }
  ],
  governance: [{ metric: "Avg AI confidence", value: "90.5%", status: "HEALTHY", note: "Above threshold." }],
  framework: [{ category: "Sales", parameter: "Benefit personalization", weight: 15, fatal: false, liveAssist: true, evidenceRequired: true }]
};
const libraryFallback = { bestCalls: [{ callId: "CALL-FIN-88421", conversion: "Sale done", duration: "04:12", snippet: "Agent linked benefit to price objection.", agent: "Aarav Singh", quality: 96.4, tags: ["price objection"], coachingUse: "Value-before-price example" }], playlists: [{ name: "Price objection mastery", calls: 22, owner: "Quality", completionRate: "64%", targetAudience: "Bottom quartile" }] };
const saasFallback = { tenant: { tenantName: "Mas CallNet Enterprise Demo", plan: "Enterprise AI Command Center", activeUsers: 1240, monthlyCalls: 842600, aiAuditsThisMonth: 218400, liveAssistSessions: 62420, dataRetentionDays: 365 }, features: [{ label: "Executive IQ", enabled: true, maturity: "GA", owner: "Product" }], readiness: [{ area: "Frontend premium demo", status: "PASS", score: 96, evidence: "Pages available." }], freshness: [{ source: "External call details", status: "HEALTHY", lastSync: "Recent", latency: "6m", recordsToday: 12840 }], security: [{ control: "Role-based access", status: "ACTIVE", maturity: "Middleware" }] };

const templateFallback = {
  templates: [
    { code: "EXEC_DAILY_SUMMARY", page: "Executive IQ", audience: "CEO, T&Q, Ops", status: "DRAFT", subject: "Daily Call Master Executive IQ Summary" },
    { code: "SALES_LEAKAGE_ALERT", page: "Sales Funnel", audience: "Ops, QA, Trainer, TL", status: "DRAFT", subject: "Critical Sales Funnel Leakage Detected" },
    { code: "REJECTION_SPIKE_ALERT", page: "Rejection Funnel", audience: "Ops, QA, Trainer, TL", status: "DRAFT", subject: "Customer Rejection Spike Detected" },
    { code: "LIVE_ASSIST_RISK_ALERT", page: "Live Assist", audience: "Supervisor, QA, TL", status: "DRAFT", subject: "Live Call Risk Alert" },
    { code: "COACHING_ASSIGNMENT", page: "Coaching Calendar", audience: "Agent, TL, Trainer", status: "DRAFT", subject: "Coaching Assigned - Action Required" }
  ],
  readiness: [
    { check: "Template master", status: "PROPOSED", detail: "cm_email_template_master proposed." },
    { check: "Versioning", status: "PROPOSED", detail: "cm_email_template_version proposed." },
    { check: "Event log", status: "PROPOSED", detail: "cm_email_event_log proposed." }
  ]
};

const calendarFallback = {
  today: [
    { time: "10:00", title: "Sales leakage coaching", agent: "Rohan Verma", owner: "Trainer", status: "SCHEDULED", trigger: "Objection handled leakage" },
    { time: "12:30", title: "Rejection recovery role-play", agent: "Kabir Sharma", owner: "TL", status: "SCHEDULED", trigger: "Price objection spike" },
    { time: "16:00", title: "QA calibration", agent: "QA Team", owner: "QA Lead", status: "SCHEDULED", trigger: "Variance review" }
  ],
  overdue: [
    { title: "Opening trust script recertification", agent: "Bottom quartile group", owner: "Trainer", due: "Yesterday", status: "MISSED" }
  ],
  readiness: [
    { check: "Calendar event table", status: "PROPOSED", detail: "cm_coaching_calendar_event proposed." },
    { check: "Assignment link", status: "PARTIAL", detail: "coaching_assignment exists; link needs enforcement." }
  ]
};

function formatNumber(value: number) { return new Intl.NumberFormat("en-IN").format(Number(value || 0)); }
function formatMoney(value: number) { return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value || 0))}`; }
function Badge({ value }: { value: string }) { return <span className={`badge ${String(value).toLowerCase().replace(/\s+/g, "-")}`}>{value}</span>; }
function KpiCard({ label, value, sub, tone = "" }: { label: string; value: React.ReactNode; sub?: string; tone?: string }) { return <div className={`kpi-card ${tone}`}><div className="kpi-label">{label}</div><div className="kpi-value">{value}</div>{sub && <div className="kpi-sub">{sub}</div>}</div>; }
function SectionTitle({ title, sub }: { title: string; sub: string }) { return <div className="section-title"><h3>{title}</h3><span>{sub}</span></div>; }
function renderCell(value: any) { if (Array.isArray(value)) return <div className="tag-row">{value.map((x) => <span key={x}>{x}</span>)}</div>; if (["HIGH","CRITICAL","LOW","MEDIUM","PASS","GAP","PARTIAL","ACTIVE","PENDING","HEALTHY","DELAYED","DEMO","VALID","PILOT","CONTROLLED","WATCH","READY","DRAFT","PROPOSED","SCHEDULED","MISSED","REQUIRED","DESIGNED","mysql_readonly","demo_fallback"].includes(String(value))) return <Badge value={String(value)} />; return String(value); }
function DataTable({ columns, rows }: { columns: string[]; rows: any[] }) { return <div className="table-wrap"><table><thead><tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr></thead><tbody>{(rows || []).map((row, i) => <tr key={i}>{columns.map((c) => <td key={c}>{renderCell(row[c] ?? row[c.toLowerCase()] ?? "-")}</td>)}</tr>)}</tbody></table></div>; }
function BarChart({ rows, labelKey, valueKey, title, suffix = "" }: { rows: any[]; labelKey: string; valueKey: string; title: string; suffix?: string }) { const max = Math.max(...(rows || []).map((r) => Number(r[valueKey] || 0)), 1); return <div className="card chart-card"><SectionTitle title={title} sub={`${(rows || []).length} data points`} /><div className="bar-chart">{(rows || []).map((row) => { const value = Number(row[valueKey] || 0); return <div className="bar-row" key={row[labelKey]}><div className="bar-label">{row[labelKey]}</div><div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max((value / max) * 100, 4)}%` }} /></div><div className="bar-value">{suffix === "₹" ? formatMoney(value) : `${value}${suffix}`}</div></div>; })}</div></div>; }
function Funnel({ title, stages, mode }: { title: string; stages: any[]; mode: "sales" | "rejection" }) { const max = Math.max(...(stages || []).map((s) => Number(s.count || 0)), 1); return <div className="card funnel-card"><SectionTitle title={title} sub="Every transition includes count, conversion, leakage and reason" /><div className="funnel">{(stages || []).map((stage, index) => <div className={`funnel-stage ${mode}`} key={stage.key} style={{ width: `${Math.max((Number(stage.count || 0) / max) * 100, 22)}%` }}><div className="stage-top"><strong>{index + 1}. {stage.label}</strong><Badge value={stage.coachableImpact} /></div><div className="stage-count">{formatNumber(stage.count)}</div><div className="stage-grid"><span>Prev conv: <b>{stage.previousConversion}%</b></span><span>Total conv: <b>{stage.totalConversion}%</b></span><span>Leakage: <b>{formatNumber(stage.leakage)}</b></span></div><p>{stage.leakageReason}</p></div>)}</div></div>; }

function SourceBanner({ source, module }: { source?: string; module: string }) { const live = source === "mysql_readonly" || source === "partial_production_contract"; return <div className={`source-banner ${live ? "mysql" : "demo"}`}><div><strong>{module} source: {live ? source : "Premium demo fallback"}</strong><p>{live ? "Production contract or approved read-only data path is active." : "Fallback mode remains visible until production tables and credentials are available."}</p></div><Badge value={live ? String(source) : "demo_fallback"} /></div>; }

function ExecutivePage({ executive }: { executive: any }) { return <><section className="hero"><div><span className="eyebrow">Call Master Enterprise IQ</span><h1>Enterprise command center for revenue, quality, rejection and live assist.</h1><p>Premium SaaS cockpit for CEO reviews, operations, quality governance and coaching execution.</p></div><div className="hero-panel"><div>Enterprise readiness</div><strong>88%</strong><span>Core pages now covered</span></div></section><section className="kpi-grid"><KpiCard label="Total calls" value={formatNumber(executive.kpis.totalCalls)} /><KpiCard label="Revenue" value={formatMoney(executive.kpis.totalRevenue)} tone="gold" /><KpiCard label="Avg conversion" value={`${executive.kpis.avgConversion}%`} /><KpiCard label="Avg quality" value={`${executive.kpis.avgQuality}%`} /><KpiCard label="Coachable leakage" value={`${executive.kpis.coachableLeakage}%`} tone="danger" /><KpiCard label="Live coverage" value={`${executive.kpis.liveAssistCoverage}%`} /></section><section className="grid two"><BarChart title="Revenue by process" rows={executive.processScorecards.filter((r: any) => r.revenue > 0)} labelKey="process" valueKey="revenue" suffix="₹" /><div className="card"><SectionTitle title="Process control tower" sub="CEO-ready comparison" /><DataTable columns={["process","branch","calls","conversion","rejection","quality","revenue","risk"]} rows={executive.processScorecards.map((r: any) => ({ ...r, calls: formatNumber(r.calls), conversion: `${r.conversion}%`, rejection: `${r.rejection}%`, quality: `${r.quality}%`, revenue: formatMoney(r.revenue) }))} /></div></section><InsightsPage insights={executive.insightCards} /></>; }
function SalesPage({ sales }: { sales: any }) { return <><SourceBanner module="Sales Funnel" source={sales.source} /><section className="kpi-grid"><KpiCard label="Connected" value={formatNumber(sales.kpis.connectedCalls)} /><KpiCard label="Sale done" value={formatNumber(sales.kpis.salesDone)} sub={`${sales.kpis.conversionPercent}% conversion`} /><KpiCard label="Verified sale" value={formatNumber(sales.kpis.verifiedSales)} /><KpiCard label="Revenue" value={formatMoney(sales.kpis.estimatedRevenue)} tone="gold" /><KpiCard label="Missed revenue" value={formatMoney(sales.kpis.missedRevenue)} tone="danger" /><KpiCard label="Top leakage" value={sales.kpis.highestLeakageStage} /></section><Funnel title="Customer sales transition funnel" stages={sales.stages} mode="sales" /><section className="grid two"><div className="card"><SectionTitle title="Top leakage reasons" sub="ranked by impact" /><DataTable columns={["reason","calls","missedRevenue","coachable","severity"]} rows={(sales.leakageReasons || []).map((r: any) => ({ ...r, missedRevenue: formatMoney(r.missedRevenue), coachable: `${r.coachable}%` }))} /></div><div className="card"><SectionTitle title="Agent transition impact" sub="coach by stage" /><DataTable columns={["agent","team","calls","conversion","rejection","leakageStage","action"]} rows={(sales.agentImpact || []).map((r: any) => ({ ...r, conversion: `${r.conversion}%`, rejection: `${r.rejection}%` }))} /></div></section></>; }
function RejectionPage({ rejection }: { rejection: any }) { return <><SourceBanner module="Rejection Funnel" source={rejection.source} /><section className="kpi-grid"><KpiCard label="Connected" value={formatNumber(rejection.kpis.connectedCalls)} /><KpiCard label="Final lost" value={formatNumber(rejection.kpis.finalLost)} sub={`${rejection.kpis.rejectionPercent}% rejection`} tone="danger" /><KpiCard label="Coachable" value={`${rejection.kpis.coachableRejectionPercent}%`} /><KpiCard label="Recovery candidates" value={formatNumber(rejection.kpis.recoveryCandidates)} tone="gold" /><KpiCard label="Recoverable revenue" value={formatMoney(rejection.kpis.estimatedRecoverableRevenue)} /><KpiCard label="Top reason" value={rejection.kpis.highestRejectionReason} /></section><Funnel title="Customer rejection transition funnel" stages={rejection.stages} mode="rejection" /><section className="grid two"><div className="card"><SectionTitle title="Rejection reason intelligence" sub="coachability and action" /><DataTable columns={["reason","calls","trend","coachable","action"]} rows={(rejection.rejectionReasons || []).map((r: any) => ({ ...r, trend: `${r.trend}%`, coachable: `${r.coachable}%` }))} /></div><div className="card"><SectionTitle title="Agent rejection impact" sub="recovery priority" /><DataTable columns={["agent","team","calls","conversion","rejection","leakageStage","action"]} rows={(rejection.agentImpact || []).map((r: any) => ({ ...r, conversion: `${r.conversion}%`, rejection: `${r.rejection}%` }))} /></div></section></>; }
function LiveAssistPage({ live }: { live: any }) { return <><SourceBanner module="Live Assist" source={live.source} /><section className="live-hero card"><div><span className="eyebrow">Live session</span><h2>{live.session.sessionId}</h2><p>{live.session.agent} • {live.session.team} • {live.session.duration}</p></div><div className="live-score"><span>Live score</span><strong>{live.session.liveScore}</strong><small>{live.session.predictedOutcome}</small></div><div className="next-action"><span>Next best action</span><b>{live.session.nextBestAction}</b></div></section><section className="grid three-live"><div className="card"><SectionTitle title="Live transcript" sub="chunk feed" /><div className="transcript">{(live.transcript || []).map((line: any) => <div className="talk" key={`${line.ts}-${line.text}`}><span>{line.ts} • {line.speaker}</span><p>{line.text}</p></div>)}</div></div><div className="card"><SectionTitle title="Event stream" sub="real-time guidance" />{(live.events || []).map((e: any) => <div className="event" key={`${e.ts}-${e.title}`}><Badge value={e.severity} /><h4>{e.title}</h4><p>{e.message}</p><span>{e.confidence}% confidence</span></div>)}</div><div className="card"><SectionTitle title="Checklist" sub="parameter score" />{(live.checklist || []).map((c: any) => <div className="check-item" key={c.item}><div><b>{c.item}</b><Badge value={c.status} /></div><p>{c.evidence}</p></div>)}</div></section><section className="grid two"><div className="card"><SectionTitle title="Production pipeline" sub="partial-production design" /><DataTable columns={["stage","status","targetLatency","currentMode"]} rows={live.pipeline || []} /></div><div className="card"><SectionTitle title="Readiness gaps" sub="before live go-live" /><DataTable columns={["check","status","detail"]} rows={live.readiness || []} /></div></section></>; }
function InsightsPage({ insights }: { insights: any[] }) { return <div className="insight-grid">{(insights || []).map((insight) => <div className="insight-card" key={insight.id}><div className="insight-head"><Badge value={insight.severity} /><span>{insight.id} • {insight.process}</span></div><h3>{insight.title}</h3><div className="impact">{insight.impact}</div><p><b>Evidence:</b> {insight.evidence}</p><p><b>Recommendation:</b> {insight.recommendation}</p><div className="owner-row"><span>Owner: {insight.owner}</span><span>Due: {insight.due}</span></div></div>)}</div>; }
function AIStudioPage({ ai }: { ai: any }) { return <><section className="grid two"><div className="card"><SectionTitle title="AI governance cockpit" sub="model, prompt, cost and variance" /><DataTable columns={["metric","value","status","note"]} rows={ai.governance || []} /></div><div className="card"><SectionTitle title="Audit framework builder" sub="parameter control plane" /><DataTable columns={["category","parameter","weight","fatal","liveAssist","evidenceRequired"]} rows={ai.framework || []} /></div></section><div className="card"><SectionTitle title="Prompt Studio" sub="enterprise prompt lifecycle" /><DataTable columns={["promptId","name","process","status","model","schemaStatus","avgConfidence","tokenCostToday","humanOverrideRate","lastCalibrated"]} rows={ai.prompts || []} /></div></>; }
function BestCallLibraryPage({ library }: { library: any }) { return <><section className="library-grid">{(library.bestCalls || []).map((call: any) => <div className="call-card" key={call.callId}><div className="call-card-head"><Badge value={call.conversion} /><span>{call.duration}</span></div><h3>{call.callId}</h3><p>{call.snippet}</p><div className="call-meta"><span>{call.agent}</span><span>{call.quality}% quality</span></div><div className="tag-row">{(call.tags || []).map((t: string) => <span key={t}>{t}</span>)}</div><b>{call.coachingUse}</b></div>)}</section><div className="card"><SectionTitle title="Coaching playlists" sub="best-call academy" /><DataTable columns={["name","calls","owner","completionRate","targetAudience"]} rows={library.playlists || []} /></div></>; }
function SaaSControlPage({ saas }: { saas: any }) { return <><section className="kpi-grid"><KpiCard label="Tenant" value={saas.tenant.tenantName} sub={saas.tenant.plan} /><KpiCard label="Active users" value={formatNumber(saas.tenant.activeUsers)} /><KpiCard label="Monthly calls" value={formatNumber(saas.tenant.monthlyCalls)} /><KpiCard label="AI audits" value={formatNumber(saas.tenant.aiAuditsThisMonth)} /><KpiCard label="Live sessions" value={formatNumber(saas.tenant.liveAssistSessions)} /><KpiCard label="Retention" value={`${saas.tenant.dataRetentionDays} days`} /></section><section className="grid two"><div className="card"><SectionTitle title="Feature control" sub="tenant module flags" /><DataTable columns={["label","enabled","maturity","owner"]} rows={saas.features || []} /></div><div className="card"><SectionTitle title="Security posture" sub="enterprise controls" /><DataTable columns={["control","status","maturity"]} rows={saas.security || []} /></div></section></>; }
function ReadinessPage({ saas }: { saas: any }) { return <section className="grid two"><div className="card"><SectionTitle title="Enterprise readiness" sub="demo to production" /><DataTable columns={["area","status","score","evidence"]} rows={saas.readiness || []} /></div><div className="card"><SectionTitle title="Data freshness" sub="source health" /><DataTable columns={["source","status","lastSync","latency","recordsToday"]} rows={saas.freshness || []} /></div></section>; }
function EmailTemplateCenterPage({ center }: { center: any }) { return <><SourceBanner module="Email Template Center" source="demo_fallback" /><section className="kpi-grid"><KpiCard label="Templates" value={center.templates.length} /><KpiCard label="Drafts" value={center.templates.filter((t: any) => t.status === "DRAFT").length} /><KpiCard label="Linked pages" value="5" /><KpiCard label="Approval status" value="Draft" /><KpiCard label="Data model" value="Proposed" tone="gold" /><KpiCard label="Send integration" value="Pending" tone="danger" /></section><section className="grid two"><div className="card"><SectionTitle title="Template catalog" sub="page-connected communications" /><DataTable columns={["code","page","audience","status","subject"]} rows={center.templates} /></div><div className="card"><SectionTitle title="Template readiness" sub="app-owned model" /><DataTable columns={["check","status","detail"]} rows={center.readiness} /></div></section></>; }
function CoachingCalendarPage({ calendar }: { calendar: any }) { return <><SourceBanner module="Coaching Calendar" source="demo_fallback" /><section className="kpi-grid"><KpiCard label="Today" value={calendar.today.length} /><KpiCard label="Overdue" value={calendar.overdue.length} tone="danger" /><KpiCard label="Triggers" value="6" /><KpiCard label="Calendar table" value="Proposed" tone="gold" /><KpiCard label="Reminder log" value="Pending" /><KpiCard label="Closure loop" value="Partial" /></section><section className="grid two"><div className="card"><SectionTitle title="Today's coaching agenda" sub="schedule-style workflow" /><DataTable columns={["time","title","agent","owner","status","trigger"]} rows={calendar.today} /></div><div className="card"><SectionTitle title="Overdue coaching" sub="missed discipline queue" /><DataTable columns={["title","agent","owner","due","status"]} rows={calendar.overdue} /></div></section><div className="card"><SectionTitle title="Calendar readiness" sub="app-owned model" /><DataTable columns={["check","status","detail"]} rows={calendar.readiness} /></div></>; }
function ClientPortalPage() { return <><SourceBanner module="Client Portal" source="demo_fallback" /><section className="kpi-grid"><KpiCard label="Client views" value="Planned" /><KpiCard label="Process scope" value="Partial" /><KpiCard label="External sharing" value="Pending" tone="danger" /><KpiCard label="Export pack" value="Pending" /><KpiCard label="Access control" value="Required" /><KpiCard label="Watermarking" value="Backlog" /></section><div className="card"><SectionTitle title="Client Portal roadmap" sub="external SaaS sharing" /><DataTable columns={["module","status","nextStep"]} rows={[{ module: "Client dashboard", status: "PARTIAL", nextStep: "Use ci_client_process_mapping" }, { module: "Export pack", status: "PENDING", nextStep: "Add approved report templates" }, { module: "Client permissions", status: "PENDING", nextStep: "Add client role and sharing tables" }]} /></div></>; }

export default function EnterpriseConsoleV2() {
  const [page, setPage] = useState<PageKey>("Executive IQ");
  const [selectedProcess, setSelectedProcess] = useState("FINNABLE");
  const [role, setRole] = useState("CEO");
  const [source, setSource] = useState("Premium fallback ready");
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
        setExecutive(exec.data || executiveFallback);
        setSales({ ...(salesRes.data || salesFallback), source: salesRes.source, warning: salesRes.warning });
        setRejection({ ...(rejectRes.data || rejectionFallback), source: rejectRes.source, warning: rejectRes.warning });
        setLive(liveRes.data || liveFallback);
        setAi({ prompts: prompts.data || aiFallback.prompts, governance: governance.data || aiFallback.governance, framework: framework.data || aiFallback.framework });
        setLibrary({ bestCalls: bestCalls.data || libraryFallback.bestCalls, playlists: playlists.data || libraryFallback.playlists });
        setSaas({ tenant: tenant.data || saasFallback.tenant, features: features.data || [], readiness: readiness.data || [], freshness: freshness.data || [], security: security.data || [] });
        setSource(`Live API connected: ${API_BASE}`);
      } catch (err: any) {
        if (!cancelled) setSource(`Fallback active: ${err.message?.slice(0, 90) || "API unavailable"}`);
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
    if (page === "Email Template Center") return <EmailTemplateCenterPage center={templateFallback} />;
    if (page === "Coaching Calendar") return <CoachingCalendarPage calendar={calendarFallback} />;
    if (page === "Client Portal") return <ClientPortalPage />;
    return <ExecutivePage executive={executive} />;
  }, [page, executive, sales, rejection, live, ai, library, saas]);

  return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark">CM</div><div><h1>Call Master</h1><p>Enterprise IQ</p></div></div><div className="nav-section"><span>Enterprise modules</span>{pages.map((p) => <button key={p} className={page === p ? "active" : ""} onClick={() => setPage(p)}>{p}</button>)}</div><div className="sidebar-card"><b>World-class SaaS build</b><p>Executive intelligence, funnels, live assist, email templates, coaching calendar, SaaS control and client portal in one console.</p></div></aside><main className="main"><header className="topbar"><div><h2>{page}</h2><p>{source}</p></div><div className="filters"><select value={selectedProcess} onChange={(e) => setSelectedProcess(e.target.value)}>{processes.map((p) => <option key={p}>{p}</option>)}</select><select value={role} onChange={(e) => setRole(e.target.value)}><option>CEO</option><option>T&Q Head</option><option>Ops Manager</option><option>QA Auditor</option><option>Trainer</option><option>TL</option><option>Client</option></select><button onClick={() => window.print()}>Export view</button></div></header>{content}</main></div>;
}

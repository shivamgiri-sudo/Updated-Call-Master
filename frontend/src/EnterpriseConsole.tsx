import React, { useEffect, useMemo, useState } from "react";
import { API_BASE, apiGet } from "./services/api";

type ApiResponse<T> = { success: boolean; data: T };
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
    { id: "INS-001", severity: "CRITICAL", title: "Sales leakage after need discovery", process: "FINNABLE", impact: "₹31.9L estimated missed revenue", evidence: "1,596 calls dropped between Need Identified and Offer Explained. 92% leakage is coachable.", recommendation: "Run micro-coaching on need-to-offer bridge and add live prompt when pitch starts without need linkage.", owner: "Training + TL", due: "Today" },
    { id: "INS-002", severity: "HIGH", title: "Price objection spike", process: "FINNABLE", impact: "+24.5% vs 7-day baseline", evidence: "Price objection appears before value explanation in 37% sampled rejected calls.", recommendation: "Enforce value-before-price script and trigger live warning when price is mentioned too early.", owner: "QA + Ops", due: "24 hours" },
    { id: "INS-003", severity: "CRITICAL", title: "Weak rebuttal recovery", process: "RETENTION", impact: "2,410 failed rebuttal moments", evidence: "Agents acknowledge objection but do not ask a follow-up question before rebuttal.", recommendation: "Deploy acknowledge, probe, benefit map and close rebuttal framework.", owner: "Trainer", due: "48 hours" },
    { id: "INS-004", severity: "MEDIUM", title: "Best performer pattern detected", process: "INSURANCE-UPSELL", impact: "+6.7 pp conversion uplift", evidence: "Top agents explain urgency within 90 seconds and personalize benefit using customer context.", recommendation: "Move top 10 calls to Best Call Library and use snippets in huddles.", owner: "Quality Lead", due: "This week" }
  ],
  conversionTrend: [
    { day: "Mon", conversion: 17.46, rejection: 36.2, quality: 83.1 },
    { day: "Tue", conversion: 18.0, rejection: 37.7, quality: 83.8 },
    { day: "Wed", conversion: 16.65, rejection: 39.9, quality: 82.4 },
    { day: "Thu", conversion: 19.37, rejection: 34.2, quality: 85.1 },
    { day: "Fri", conversion: 20.1, rejection: 36.0, quality: 86.3 },
    { day: "Sat", conversion: 19.3, rejection: 33.1, quality: 85.8 },
    { day: "Sun", conversion: 19.74, rejection: 31.9, quality: 86.9 }
  ]
};

const salesFallback = {
  kpis: { connectedCalls: 12840, salesDone: 2384, verifiedSales: 2216, conversionPercent: 18.57, verifiedConversionPercent: 17.26, estimatedRevenue: 4432000, missedRevenue: 13112000, highestLeakageStage: "Need identified → Offer explained", coachableLeakagePercent: 84.6 },
  stages: [
    { key: "connected", label: "Connected calls", count: 12840, previousConversion: 100, totalConversion: 100, leakage: 0, leakageReason: "Base connected universe", coachableImpact: "LOW" },
    { key: "opening_attempted", label: "Opening attempted", count: 12190, previousConversion: 94.94, totalConversion: 94.94, leakage: 650, leakageReason: "Agent skipped structured opening", coachableImpact: "HIGH" },
    { key: "opening_accepted", label: "Opening accepted", count: 10984, previousConversion: 90.11, totalConversion: 85.55, leakage: 1206, leakageReason: "Low trust opening / rushed greeting", coachableImpact: "HIGH" },
    { key: "need_identified", label: "Need identified", count: 9388, previousConversion: 85.47, totalConversion: 73.12, leakage: 1596, leakageReason: "Weak probing before pitch", coachableImpact: "CRITICAL" },
    { key: "offer_explained", label: "Offer explained", count: 8122, previousConversion: 86.51, totalConversion: 63.25, leakage: 1266, leakageReason: "Feature-led pitch without customer linkage", coachableImpact: "HIGH" },
    { key: "benefit_delivered", label: "Benefit delivered", count: 6844, previousConversion: 84.27, totalConversion: 53.3, leakage: 1278, leakageReason: "Benefit not personalized", coachableImpact: "CRITICAL" },
    { key: "price_urgency", label: "Price & urgency explained", count: 5716, previousConversion: 83.52, totalConversion: 44.52, leakage: 1128, leakageReason: "Discount/urgency not framed clearly", coachableImpact: "HIGH" },
    { key: "objection_handled", label: "Objection handled", count: 4238, previousConversion: 74.14, totalConversion: 33.01, leakage: 1478, leakageReason: "Rebuttal not aligned to objection", coachableImpact: "CRITICAL" },
    { key: "buying_signal", label: "Buying signal", count: 3194, previousConversion: 75.37, totalConversion: 24.88, leakage: 1044, leakageReason: "Agent missed closing signal", coachableImpact: "CRITICAL" },
    { key: "consent", label: "Consent / reconfirmation", count: 2762, previousConversion: 86.47, totalConversion: 21.51, leakage: 432, leakageReason: "Incomplete reconfirmation", coachableImpact: "MEDIUM" },
    { key: "sale_done", label: "Sale done", count: 2384, previousConversion: 86.31, totalConversion: 18.57, leakage: 378, leakageReason: "Last-mile hesitation", coachableImpact: "MEDIUM" },
    { key: "verified_sale", label: "Verified sale", count: 2216, previousConversion: 92.95, totalConversion: 17.26, leakage: 168, leakageReason: "Verification / fulfilment leakage", coachableImpact: "LOW" }
  ],
  leakageReasons: [
    { reason: "Weak need discovery", calls: 1596, missedRevenue: 3192000, coachable: 92, severity: "CRITICAL" },
    { reason: "Generic objection rebuttal", calls: 1478, missedRevenue: 2956000, coachable: 88, severity: "CRITICAL" },
    { reason: "Benefit not personalized", calls: 1278, missedRevenue: 2556000, coachable: 91, severity: "CRITICAL" },
    { reason: "Offer explained without urgency", calls: 1128, missedRevenue: 2256000, coachable: 77, severity: "HIGH" }
  ]
};

const rejectionFallback = {
  kpis: { connectedCalls: 12840, finalLost: 4982, rejectionPercent: 38.8, coachableRejectionPercent: 76.4, highestRejectionReason: "Price too high after offer explanation", recoveryCandidates: 1318, estimatedRecoverableRevenue: 2636000 },
  stages: [
    { key: "connected", label: "Connected calls", count: 12840, previousConversion: 100, totalConversion: 100, leakage: 0, leakageReason: "Base connected universe", coachableImpact: "LOW" },
    { key: "opening_rejected", label: "Opening rejected", count: 1856, previousConversion: 14.45, totalConversion: 14.45, leakage: 1856, leakageReason: "Customer disconnected or refused early", coachableImpact: "MEDIUM" },
    { key: "offer_rejected_before", label: "Offer rejected before explanation", count: 1642, previousConversion: 88.47, totalConversion: 12.79, leakage: 214, leakageReason: "Agent failed to earn permission", coachableImpact: "HIGH" },
    { key: "offer_rejected_after", label: "Offer rejected after listening", count: 2968, previousConversion: 180.75, totalConversion: 23.12, leakage: 1326, leakageReason: "Value proposition unclear", coachableImpact: "CRITICAL" },
    { key: "price_objection", label: "Price / discount objection", count: 2324, previousConversion: 78.3, totalConversion: 18.1, leakage: 644, leakageReason: "Price framed before value", coachableImpact: "CRITICAL" },
    { key: "product_mismatch", label: "Product not suitable", count: 1188, previousConversion: 51.12, totalConversion: 9.25, leakage: 1136, leakageReason: "Need discovery incomplete", coachableImpact: "HIGH" },
    { key: "competitor", label: "Competitor preference", count: 726, previousConversion: 61.11, totalConversion: 5.65, leakage: 462, leakageReason: "No differentiation rebuttal", coachableImpact: "HIGH" },
    { key: "rebuttal_failed", label: "Rebuttal failed", count: 2410, previousConversion: 396.38, totalConversion: 18.77, leakage: 1802, leakageReason: "Generic rebuttal or no second attempt", coachableImpact: "CRITICAL" },
    { key: "followup_required", label: "Follow-up required", count: 1318, previousConversion: 54.69, totalConversion: 10.26, leakage: 1092, leakageReason: "Callback commitment but no closure", coachableImpact: "MEDIUM" },
    { key: "final_lost", label: "Final lost", count: 4982, previousConversion: 377.99, totalConversion: 38.8, leakage: 3664, leakageReason: "Unrecovered rejection", coachableImpact: "CRITICAL" }
  ],
  rejectionReasons: [
    { reason: "Not interested", calls: 1420, trend: 18.2, coachable: 54, action: "Improve permission-based opening" },
    { reason: "Price too high", calls: 1164, trend: 24.5, coachable: 82, action: "Value-before-price coaching" },
    { reason: "Already using competitor", calls: 726, trend: 11.4, coachable: 76, action: "Competitor differentiation playbook" },
    { reason: "Trust concern", calls: 608, trend: 9.6, coachable: 79, action: "Trust-marker insertion" }
  ]
};

const liveFallback = {
  session: { sessionId: "LIVE-FIN-20260616-001", processCode: "FINNABLE", agent: "Aarav Singh", team: "Noida - Sales A", callStatus: "LIVE", duration: "02:42", customerMood: "Interested but price-sensitive", liveScore: 72, predictedOutcome: "Recoverable sale", nextBestAction: "Complete benefit-to-price bridge, then reconfirm consent and activation timeline." },
  transcript: [
    { speaker: "Agent", ts: "00:03", text: "Good morning, this is Aarav calling regarding your premium upgrade option." },
    { speaker: "Customer", ts: "00:18", text: "Okay, but I do not want anything expensive." },
    { speaker: "Agent", ts: "00:31", text: "This plan is available with a special discount today." },
    { speaker: "Customer", ts: "00:45", text: "What is the actual benefit for me?" },
    { speaker: "Agent", ts: "01:02", text: "You will get higher coverage and priority service, which reduces your out-of-pocket risk." }
  ],
  events: [
    { ts: "00:08", severity: "PASS", title: "Opening completed", message: "Agent introduced self and brand clearly.", confidence: 94 },
    { ts: "00:41", severity: "HIGH", title: "Price mentioned before value", message: "Coach live: explain benefit before discount.", confidence: 91 },
    { ts: "01:12", severity: "CRITICAL", title: "Objection: too expensive", message: "Suggested rebuttal: acknowledge price, map benefit, then explain limited-period discount.", confidence: 93 },
    { ts: "01:44", severity: "HIGH", title: "Buying signal detected", message: "Customer asked about activation time. Recommend moving to reconfirmation.", confidence: 87 }
  ],
  checklist: [
    { item: "Greeting & brand introduction", status: "PASS", score: 10, evidence: "Good morning, this is Aarav calling from..." },
    { item: "Need discovery", status: "PARTIAL", score: 6, evidence: "Agent asked one probing question but did not validate need." },
    { item: "Benefit explanation", status: "FAIL", score: 3, evidence: "Offer explained before customer benefit mapping." },
    { item: "Compliance disclosure", status: "PENDING", score: 0, evidence: "Required disclosure not heard yet." }
  ]
};

const aiFallback = {
  prompts: [
    { promptId: "PROMPT-SALES-001", name: "Outbound Sales Audit v3.2", process: "FINNABLE", status: "ACTIVE", model: "Enterprise LLM Router", schemaStatus: "VALID", avgConfidence: 91.4, tokenCostToday: 1840, humanOverrideRate: 4.8, lastCalibrated: "2026-06-15" },
    { promptId: "PROMPT-REJECTION-002", name: "Customer Rejection Classifier v2.1", process: "FINNABLE", status: "ACTIVE", model: "Enterprise LLM Router", schemaStatus: "VALID", avgConfidence: 89.7, tokenCostToday: 980, humanOverrideRate: 6.2, lastCalibrated: "2026-06-14" },
    { promptId: "PROMPT-LIVE-003", name: "Live Assist Next Best Action v1.0", process: "All Sales", status: "PILOT", model: "Low-latency LLM", schemaStatus: "VALID", avgConfidence: 86.1, tokenCostToday: 620, humanOverrideRate: 8.6, lastCalibrated: "2026-06-13" }
  ],
  governance: [
    { metric: "Prompt versions active", value: 4, status: "CONTROLLED", note: "All active prompts have schema validation." },
    { metric: "Avg AI confidence", value: "90.5%", status: "HEALTHY", note: "Above enterprise threshold of 85%." },
    { metric: "Human override rate", value: "5.4%", status: "WATCH", note: "Review rejection classifier overrides weekly." },
    { metric: "Calibration variance", value: "2.8%", status: "HEALTHY", note: "Below 3% target variance." }
  ],
  framework: [
    { category: "Opening", parameter: "Brand introduction", weight: 10, fatal: false, liveAssist: true, evidenceRequired: true },
    { category: "Discovery", parameter: "Need identification", weight: 15, fatal: false, liveAssist: true, evidenceRequired: true },
    { category: "Sales", parameter: "Benefit personalization", weight: 15, fatal: false, liveAssist: true, evidenceRequired: true },
    { category: "Compliance", parameter: "Mandatory disclosure", weight: 20, fatal: true, liveAssist: true, evidenceRequired: true }
  ]
};

const libraryFallback = {
  bestCalls: [
    { callId: "CALL-FIN-88421", process: "FINNABLE", agent: "Aarav Singh", stage: "Price & urgency explained", conversion: "Sale done", quality: 96.4, snippet: "Customer raised price concern; agent linked benefit to customer risk and explained discount after value.", coachingUse: "Value-before-price example", duration: "04:12", tags: ["price objection", "benefit mapping", "closing"] },
    { callId: "CALL-INS-11882", process: "INSURANCE-UPSELL", agent: "Meera Khan", stage: "Buying signal captured", conversion: "Verified sale", quality: 97.8, snippet: "Agent identified activation-time question as buying signal and moved to consent cleanly.", coachingUse: "Buying signal recognition", duration: "05:06", tags: ["buying signal", "consent"] },
    { callId: "CALL-RET-55620", process: "RETENTION", agent: "Priya Nair", stage: "Rebuttal recovery", conversion: "Saved customer", quality: 94.2, snippet: "Agent acknowledged cancellation intent, probed reason, and matched retention benefit to pain point.", coachingUse: "Acknowledge-probe-rebuttal framework", duration: "06:33", tags: ["retention", "rebuttal"] }
  ],
  playlists: [
    { name: "Winning openings", calls: 18, owner: "Training", completionRate: 76, targetAudience: "New agents" },
    { name: "Price objection mastery", calls: 22, owner: "Quality", completionRate: 64, targetAudience: "Bottom quartile" },
    { name: "Compliance-perfect closes", calls: 12, owner: "QA", completionRate: 82, targetAudience: "All sales" }
  ]
};

const saasFallback = {
  tenant: { tenantId: "MCN-ENTERPRISE", tenantName: "Mas CallNet Enterprise Demo", plan: "Enterprise AI Command Center", region: "India", activeProcesses: 18, activeUsers: 1240, monthlyCalls: 842600, aiAuditsThisMonth: 218400, liveAssistSessions: 62420, storageUsedGb: 842, dataRetentionDays: 365, status: "READY_FOR_EXECUTIVE_DEMO" },
  features: [
    { key: "executive_iq", label: "Executive IQ", enabled: true, maturity: "GA", owner: "Product" },
    { key: "live_assist", label: "Live assist", enabled: true, maturity: "Demo", owner: "AI Platform" },
    { key: "prompt_studio", label: "AI prompt studio", enabled: true, maturity: "Design-ready", owner: "AI Governance" },
    { key: "sso", label: "SSO / MFA", enabled: false, maturity: "Backlog", owner: "Security" }
  ],
  readiness: [
    { area: "Frontend premium demo", status: "PASS", score: 96, evidence: "Executive IQ, funnels, live assist and gaps pages available with fallback data." },
    { area: "API route coverage", status: "PASS", score: 88, evidence: "Executive, funnel and live demo endpoints are mounted." },
    { area: "Real-time architecture", status: "GAP", score: 42, evidence: "Production WebSocket/SSE streaming is still pending." },
    { area: "SaaS tenancy", status: "GAP", score: 48, evidence: "Full tenant isolation still needs schema enforcement." }
  ],
  freshness: [
    { source: "Call master canonical", status: "HEALTHY", lastSync: "2026-06-16 09:05", latency: "4m", recordsToday: 12840 },
    { source: "External call details", status: "HEALTHY", lastSync: "2026-06-16 09:03", latency: "6m", recordsToday: 12840 },
    { source: "AI audit results", status: "DELAYED", lastSync: "2026-06-16 08:41", latency: "28m", recordsToday: 9210 },
    { source: "Live assist stream", status: "DEMO", lastSync: "N/A", latency: "Demo mode", recordsToday: 3 }
  ],
  security: [
    { control: "Role-based access", status: "ACTIVE", maturity: "Implemented in API middleware" },
    { control: "SSO / MFA", status: "PENDING", maturity: "Enterprise requirement" },
    { control: "PII masking before AI", status: "PARTIAL", maturity: "Must be enforced before production AI" },
    { control: "Rate limiting", status: "PENDING", maturity: "Required before public deployment" }
  ]
};

function formatNumber(value: number) { return new Intl.NumberFormat("en-IN").format(value); }
function formatMoney(value: number) { return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)}`; }
function Badge({ value }: { value: string }) { return <span className={`badge ${String(value).toLowerCase().replace(/\s+/g, "-")}`}>{value}</span>; }
function KpiCard({ label, value, sub, tone = "" }: { label: string; value: React.ReactNode; sub?: string; tone?: string }) { return <div className={`kpi-card ${tone}`}><div className="kpi-label">{label}</div><div className="kpi-value">{value}</div>{sub && <div className="kpi-sub">{sub}</div>}</div>; }
function SectionTitle({ title, sub }: { title: string; sub: string }) { return <div className="section-title"><h3>{title}</h3><span>{sub}</span></div>; }

function DataTable({ columns, rows }: { columns: string[]; rows: any[] }) {
  return <div className="table-wrap"><table><thead><tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{columns.map((c) => <td key={c}>{renderCell(row[c] ?? row[c.toLowerCase()] ?? "-")}</td>)}</tr>)}</tbody></table></div>;
}
function renderCell(value: any) {
  if (Array.isArray(value)) return <div className="tag-row">{value.map((x) => <span key={x}>{x}</span>)}</div>;
  if (typeof value === "boolean") return <Badge value={value ? "Enabled" : "Disabled"} />;
  if (["HIGH", "CRITICAL", "LOW", "MEDIUM", "PASS", "GAP", "PARTIAL", "ACTIVE", "PENDING", "HEALTHY", "DELAYED", "DEMO", "VALID", "PILOT", "CONTROLLED", "WATCH"].includes(String(value))) return <Badge value={String(value)} />;
  return String(value);
}

function BarChart({ rows, labelKey, valueKey, title, suffix = "" }: { rows: any[]; labelKey: string; valueKey: string; title: string; suffix?: string }) {
  const max = Math.max(...rows.map((r) => Number(r[valueKey] || 0)), 1);
  return <div className="card chart-card"><SectionTitle title={title} sub={`${rows.length} data points`} /><div className="bar-chart">{rows.map((row) => { const value = Number(row[valueKey] || 0); return <div className="bar-row" key={row[labelKey]}><div className="bar-label">{row[labelKey]}</div><div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max((value / max) * 100, 4)}%` }} /></div><div className="bar-value">{suffix === "₹" ? formatMoney(value) : `${value}${suffix}`}</div></div>; })}</div></div>;
}

function Funnel({ title, stages, mode }: { title: string; stages: any[]; mode: "sales" | "rejection" }) {
  const max = Math.max(...stages.map((s) => s.count), 1);
  return <div className="card funnel-card"><SectionTitle title={title} sub="Every transition includes count, conversion, leakage and reason" /><div className="funnel">{stages.map((stage, index) => <div className={`funnel-stage ${mode}`} key={stage.key} style={{ width: `${Math.max((stage.count / max) * 100, 22)}%` }}><div className="stage-top"><strong>{index + 1}. {stage.label}</strong><Badge value={stage.coachableImpact} /></div><div className="stage-count">{formatNumber(stage.count)}</div><div className="stage-grid"><span>Prev conv: <b>{stage.previousConversion}%</b></span><span>Total conv: <b>{stage.totalConversion}%</b></span><span>Leakage: <b>{formatNumber(stage.leakage)}</b></span></div><p>{stage.leakageReason}</p></div>)}</div></div>;
}

function ExecutivePage({ executive }: { executive: any }) {
  return <><section className="hero"><div><span className="eyebrow">Call Master Enterprise IQ</span><h1>AI command center for revenue, quality, rejection and live agent performance.</h1><p>Built for CEO reviews, operation war rooms, training governance and enterprise SaaS adoption.</p></div><div className="hero-panel"><div>Enterprise readiness</div><strong>86%</strong><span>Demo-ready with production backlog visible</span></div></section><section className="kpi-grid"><KpiCard label="Total calls" value={formatNumber(executive.kpis.totalCalls)} sub="Across active processes" /><KpiCard label="Revenue influenced" value={formatMoney(executive.kpis.totalRevenue)} sub="Demo pipeline estimate" tone="gold" /><KpiCard label="Avg conversion" value={`${executive.kpis.avgConversion}%`} sub="Sales processes" /><KpiCard label="Avg quality" value={`${executive.kpis.avgQuality}%`} sub="Audit health" /><KpiCard label="Coachable leakage" value={`${executive.kpis.coachableLeakage}%`} sub="Recoverable behaviors" tone="danger" /><KpiCard label="Live assist coverage" value={`${executive.kpis.liveAssistCoverage}%`} sub="Calls with real-time guidance" /></section><section className="grid two"><BarChart title="Revenue by process" rows={executive.processScorecards.filter((r: any) => r.revenue > 0)} labelKey="process" valueKey="revenue" suffix="₹" /><BarChart title="Conversion by process" rows={executive.processScorecards.filter((r: any) => r.conversion > 0)} labelKey="process" valueKey="conversion" suffix="%" /></section><div className="card"><SectionTitle title="Process control tower" sub="CEO-ready comparison" /><DataTable columns={["process", "branch", "calls", "conversion", "rejection", "quality", "revenue", "risk"]} rows={executive.processScorecards.map((r: any) => ({ ...r, calls: formatNumber(r.calls), conversion: `${r.conversion}%`, rejection: `${r.rejection}%`, quality: `${r.quality}%`, revenue: formatMoney(r.revenue) }))} /></div></>;
}
function SalesPage({ sales }: { sales: any }) { return <><section className="kpi-grid"><KpiCard label="Connected" value={formatNumber(sales.kpis.connectedCalls)} sub="Funnel base" /><KpiCard label="Sale done" value={formatNumber(sales.kpis.salesDone)} sub={`${sales.kpis.conversionPercent}% conversion`} /><KpiCard label="Verified sale" value={formatNumber(sales.kpis.verifiedSales)} sub={`${sales.kpis.verifiedConversionPercent}% verified`} /><KpiCard label="Revenue" value={formatMoney(sales.kpis.estimatedRevenue)} sub="Realized" tone="gold" /><KpiCard label="Missed revenue" value={formatMoney(sales.kpis.missedRevenue)} sub="Leakage opportunity" tone="danger" /><KpiCard label="Top leakage" value={sales.kpis.highestLeakageStage} sub="Priority transition" /></section><Funnel title="Customer sales transition funnel" stages={sales.stages} mode="sales" /><div className="card"><SectionTitle title="Top leakage reasons" sub="Ranked by business impact" /><DataTable columns={["reason", "calls", "missedRevenue", "coachable", "severity"]} rows={sales.leakageReasons.map((r: any) => ({ ...r, missedRevenue: formatMoney(r.missedRevenue), coachable: `${r.coachable}%` }))} /></div></>; }
function RejectionPage({ rejection }: { rejection: any }) { return <><section className="kpi-grid"><KpiCard label="Connected" value={formatNumber(rejection.kpis.connectedCalls)} sub="Rejection universe" /><KpiCard label="Final lost" value={formatNumber(rejection.kpis.finalLost)} sub={`${rejection.kpis.rejectionPercent}% rejection`} tone="danger" /><KpiCard label="Coachable rejection" value={`${rejection.kpis.coachableRejectionPercent}%`} sub="Recoverable" /><KpiCard label="Recovery candidates" value={formatNumber(rejection.kpis.recoveryCandidates)} sub="Callback opportunity" tone="gold" /><KpiCard label="Recoverable revenue" value={formatMoney(rejection.kpis.estimatedRecoverableRevenue)} sub="Estimated opportunity" /><KpiCard label="Top reason" value={rejection.kpis.highestRejectionReason} sub="Priority action" /></section><Funnel title="Customer rejection transition funnel" stages={rejection.stages} mode="rejection" /><div className="card"><SectionTitle title="Rejection reason intelligence" sub="Coachability and recovery action" /><DataTable columns={["reason", "calls", "trend", "coachable", "action"]} rows={rejection.rejectionReasons.map((r: any) => ({ ...r, trend: `${r.trend}%`, coachable: `${r.coachable}%` }))} /></div></>; }
function LiveAssistPage({ live }: { live: any }) { return <><section className="live-hero card"><div><span className="eyebrow">Live session</span><h2>{live.session.sessionId}</h2><p>{live.session.agent} • {live.session.team} • {live.session.duration}</p></div><div className="live-score"><span>Live score</span><strong>{live.session.liveScore}</strong><small>{live.session.predictedOutcome}</small></div><div className="next-action"><span>Next best action</span><b>{live.session.nextBestAction}</b></div></section><section className="grid three-live"><div className="card"><SectionTitle title="Live transcript" sub="chunked feed" /><div className="transcript">{live.transcript.map((line: any) => <div key={`${line.ts}-${line.text}`} className={`talk ${String(line.speaker).toLowerCase()}`}><span>{line.ts} • {line.speaker}</span><p>{line.text}</p></div>)}</div></div><div className="card"><SectionTitle title="Real-time events" sub="alert stream" /><div className="event-list">{live.events.map((event: any) => <div key={`${event.ts}-${event.title}`} className="event"><div><Badge value={event.severity} /> <b>{event.ts}</b></div><h4>{event.title}</h4><p>{event.message}</p><span>{event.confidence}% confidence</span></div>)}</div></div><div className="card"><SectionTitle title="Live audit checklist" sub="parameter score" /><div className="checklist">{live.checklist.map((item: any) => <div key={item.item} className="check-item"><div><b>{item.item}</b><Badge value={item.status} /></div><div className="mini-meter"><span style={{ width: `${item.score * 10}%` }} /></div><p>{item.evidence}</p></div>)}</div></div></section></>; }
function InsightsPage({ insights }: { insights: any[] }) { return <div className="insight-grid">{insights.map((insight) => <div className="insight-card" key={insight.id}><div className="insight-head"><Badge value={insight.severity} /><span>{insight.id} • {insight.process}</span></div><h3>{insight.title}</h3><div className="impact">{insight.impact}</div><p><b>Evidence:</b> {insight.evidence}</p><p><b>AI recommendation:</b> {insight.recommendation}</p><div className="owner-row"><span>Owner: {insight.owner}</span><span>Due: {insight.due}</span></div></div>)}</div>; }
function AIStudioPage({ ai }: { ai: any }) { return <><section className="grid two"><div className="card"><SectionTitle title="AI governance cockpit" sub="model, prompt, cost and variance" /><div className="module-grid">{ai.governance.map((g: any) => <div className="module-tile" key={g.metric}><Badge value={g.status} /><h3>{g.value}</h3><p>{g.metric}</p><small>{g.note}</small></div>)}</div></div><div className="card"><SectionTitle title="Audit framework builder" sub="parameter control plane" /><DataTable columns={["category", "parameter", "weight", "fatal", "liveAssist", "evidenceRequired"]} rows={ai.framework} /></div></section><div className="card"><SectionTitle title="Prompt Studio" sub="enterprise AI prompt lifecycle" /><DataTable columns={["promptId", "name", "process", "status", "model", "schemaStatus", "avgConfidence", "tokenCostToday", "humanOverrideRate", "lastCalibrated"]} rows={ai.prompts.map((p: any) => ({ ...p, avgConfidence: `${p.avgConfidence}%`, tokenCostToday: `₹${p.tokenCostToday}`, humanOverrideRate: `${p.humanOverrideRate}%` }))} /></div></>; }
function BestCallLibraryPage({ library }: { library: any }) { return <><section className="library-grid">{library.bestCalls.map((call: any) => <div className="call-card" key={call.callId}><div className="call-card-head"><Badge value={call.conversion} /><span>{call.duration}</span></div><h3>{call.callId}</h3><p>{call.snippet}</p><div className="call-meta"><span>{call.agent}</span><span>{call.quality}% quality</span></div><div className="tag-row">{call.tags.map((t: string) => <span key={t}>{t}</span>)}</div><b>{call.coachingUse}</b></div>)}</section><div className="card"><SectionTitle title="Coaching playlists" sub="convert best calls into academy content" /><DataTable columns={["name", "calls", "owner", "completionRate", "targetAudience"]} rows={library.playlists.map((p: any) => ({ ...p, completionRate: `${p.completionRate}%` }))} /></div></>; }
function SaaSControlPage({ saas }: { saas: any }) { return <><section className="kpi-grid"><KpiCard label="Tenant" value={saas.tenant.tenantName} sub={saas.tenant.plan} /><KpiCard label="Active users" value={formatNumber(saas.tenant.activeUsers)} sub="Provisioned users" /><KpiCard label="Monthly calls" value={formatNumber(saas.tenant.monthlyCalls)} sub="Tenant volume" /><KpiCard label="AI audits" value={formatNumber(saas.tenant.aiAuditsThisMonth)} sub="This month" /><KpiCard label="Live sessions" value={formatNumber(saas.tenant.liveAssistSessions)} sub="This month" /><KpiCard label="Retention" value={`${saas.tenant.dataRetentionDays} days`} sub="Tenant policy" /></section><section className="grid two"><div className="card"><SectionTitle title="Feature control" sub="SaaS module flags" /><DataTable columns={["label", "enabled", "maturity", "owner"]} rows={saas.features} /></div><div className="card"><SectionTitle title="Security posture" sub="enterprise controls" /><DataTable columns={["control", "status", "maturity"]} rows={saas.security} /></div></section></>; }
function ReadinessPage({ saas }: { saas: any }) { return <section className="grid two"><div className="card"><SectionTitle title="Enterprise readiness checks" sub="demo to production scoring" /><DataTable columns={["area", "status", "score", "evidence"]} rows={saas.readiness} /></div><div className="card"><SectionTitle title="Data freshness center" sub="source health and latency" /><DataTable columns={["source", "status", "lastSync", "latency", "recordsToday"]} rows={saas.freshness.map((f: any) => ({ ...f, recordsToday: formatNumber(f.recordsToday) }))} /></div></section>; }

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
        setExecutive(exec.data); setSales(salesRes.data); setRejection(rejectRes.data); setLive(liveRes.data);
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

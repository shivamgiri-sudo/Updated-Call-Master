import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { API_BASE, apiGet } from "./services/api";
import "./styles.css";

type ApiResponse<T> = { success: boolean; data: T };

type Stage = {
  key: string;
  label: string;
  count: number;
  previousConversion: number;
  totalConversion: number;
  leakage: number;
  leakageReason: string;
  coachableImpact: string;
};

const executiveFallback = {
  kpis: {
    totalCalls: 38436,
    totalRevenue: 14476000,
    avgConversion: 18.66,
    avgQuality: 86.48,
    criticalInsights: 2,
    activeRisks: 5,
    liveAssistCoverage: 73.4,
    coachableLeakage: 84.6
  },
  processScorecards: [
    { process: "FINNABLE", branch: "Noida", calls: 12840, conversion: 18.57, rejection: 38.8, quality: 84.7, revenue: 4432000, risk: "HIGH" },
    { process: "INSURANCE-UPSELL", branch: "Ahmedabad", calls: 8420, conversion: 21.3, rejection: 32.1, quality: 88.2, revenue: 6120000, risk: "MEDIUM" },
    { process: "RETENTION", branch: "Noida", calls: 6988, conversion: 16.1, rejection: 41.6, quality: 81.4, revenue: 3924000, risk: "CRITICAL" },
    { process: "SUPPORT-INBOUND", branch: "Ahmedabad", calls: 10188, conversion: 0, rejection: 0, quality: 91.6, revenue: 0, risk: "LOW" }
  ],
  insightCards: [
    { id: "INS-001", severity: "CRITICAL", title: "Sales leakage after need discovery", process: "FINNABLE", impact: "₹31.9L estimated missed revenue", evidence: "1,596 calls dropped between Need Identified and Offer Explained. 92% leakage is coachable.", recommendation: "Run micro-coaching on need-to-offer bridge and add live prompt when pitch starts without need linkage.", owner: "Training + TL", due: "Today" },
    { id: "INS-002", severity: "HIGH", title: "Price objection spike", process: "FINNABLE", impact: "+24.5% vs 7-day baseline", evidence: "Price objection appears before value explanation in 37% sampled rejected calls.", recommendation: "Enforce value-before-price script and trigger live warning when price is mentioned too early.", owner: "QA + Ops", due: "24 hours" },
    { id: "INS-003", severity: "CRITICAL", title: "Weak rebuttal recovery", process: "RETENTION", impact: "2,410 failed rebuttal moments", evidence: "Agents acknowledge objection but do not ask a follow-up question before rebuttal.", recommendation: "Deploy acknowledge → probe → benefit map → close rebuttal framework.", owner: "Trainer", due: "48 hours" },
    { id: "INS-004", severity: "MEDIUM", title: "Best performer pattern detected", process: "INSURANCE-UPSELL", impact: "+6.7 pp conversion uplift", evidence: "Top agents explain urgency within 90 seconds and personalize benefit using customer context.", recommendation: "Move top 10 calls to Best Call Library and use snippets in huddles.", owner: "Quality Lead", due: "This week" },
    { id: "INS-005", severity: "HIGH", title: "Quality is high but sales is low", process: "FINNABLE", impact: "Quality 84.7% but conversion 18.57%", evidence: "Agents are polite and compliant but not persuasive during offer and urgency stages.", recommendation: "Split score into compliance quality and revenue quality to coach persuasion gaps.", owner: "CEO/T&Q", due: "Next review" }
  ],
  conversionTrend: [
    { day: "Mon", conversion: 17.46, rejection: 36.2, quality: 83.1 },
    { day: "Tue", conversion: 18.0, rejection: 37.7, quality: 83.8 },
    { day: "Wed", conversion: 16.65, rejection: 39.9, quality: 82.4 },
    { day: "Thu", conversion: 19.37, rejection: 34.2, quality: 85.1 },
    { day: "Fri", conversion: 20.1, rejection: 36.0, quality: 86.3 },
    { day: "Sat", conversion: 19.3, rejection: 33.1, quality: 85.8 },
    { day: "Sun", conversion: 19.74, rejection: 31.9, quality: 86.9 }
  ],
  actionQueue: [
    { action: "Launch objection-handling huddle", severity: "CRITICAL", owner: "Trainer", impactedAgents: 12, expectedImpact: "+2.4 pp conversion" },
    { action: "Create live alert for price-before-value", severity: "HIGH", owner: "QA Tech", impactedAgents: 34, expectedImpact: "Reduce price rejection by 18%" },
    { action: "Publish best-call snippets", severity: "MEDIUM", owner: "Quality Lead", impactedAgents: 78, expectedImpact: "Standardize winning pitch" },
    { action: "Recalibrate sales audit framework", severity: "HIGH", owner: "T&Q Head", impactedAgents: 100, expectedImpact: "Separate compliance vs revenue quality" }
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
  trends: executiveFallback.conversionTrend.map((r: any) => ({ ...r, connected: 1800 + Math.round(r.quality * 4), sales: Math.round((1800 + r.quality * 4) * r.conversion / 100), rejection: Math.round((1800 + r.quality * 4) * r.rejection / 100) })),
  leakageReasons: [
    { reason: "Weak need discovery", calls: 1596, missedRevenue: 3192000, coachable: 92, severity: "CRITICAL" },
    { reason: "Generic objection rebuttal", calls: 1478, missedRevenue: 2956000, coachable: 88, severity: "CRITICAL" },
    { reason: "Benefit not personalized", calls: 1278, missedRevenue: 2556000, coachable: 91, severity: "CRITICAL" },
    { reason: "Offer explained without urgency", calls: 1128, missedRevenue: 2256000, coachable: 77, severity: "HIGH" },
    { reason: "Missed buying signal", calls: 1044, missedRevenue: 2088000, coachable: 84, severity: "CRITICAL" },
    { reason: "Incomplete reconfirmation", calls: 432, missedRevenue: 864000, coachable: 64, severity: "MEDIUM" }
  ],
  agentImpact: [
    { agent: "Aarav Singh", team: "Noida - Sales A", calls: 428, conversion: 24.8, rejection: 31.4, leakageStage: "Need identified", quality: 91.2, action: "Use as best-call library sample" },
    { agent: "Meera Khan", team: "Ahmedabad - Sales B", calls: 386, conversion: 22.4, rejection: 35.8, leakageStage: "Price & urgency", quality: 88.7, action: "Promote winning urgency pitch" },
    { agent: "Rohan Verma", team: "Noida - Sales C", calls: 512, conversion: 13.9, rejection: 48.6, leakageStage: "Objection handled", quality: 72.5, action: "Critical objection-handling coaching" },
    { agent: "Priya Nair", team: "Noida - Sales A", calls: 304, conversion: 20.6, rejection: 37.1, leakageStage: "Benefit delivered", quality: 84.4, action: "Refine benefit personalization" },
    { agent: "Kabir Sharma", team: "Ahmedabad - Sales C", calls: 456, conversion: 12.1, rejection: 51.2, leakageStage: "Opening accepted", quality: 68.8, action: "Opening trust script recertification" }
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
    { key: "trust_concern", label: "Trust / brand concern", count: 608, previousConversion: 83.75, totalConversion: 4.74, leakage: 118, leakageReason: "Trust marker missed", coachableImpact: "HIGH" },
    { key: "rebuttal_failed", label: "Rebuttal failed", count: 2410, previousConversion: 396.38, totalConversion: 18.77, leakage: 1802, leakageReason: "Generic rebuttal or no second attempt", coachableImpact: "CRITICAL" },
    { key: "followup_required", label: "Follow-up required", count: 1318, previousConversion: 54.69, totalConversion: 10.26, leakage: 1092, leakageReason: "Callback commitment but no closure", coachableImpact: "MEDIUM" },
    { key: "final_lost", label: "Final lost", count: 4982, previousConversion: 377.99, totalConversion: 38.8, leakage: 3664, leakageReason: "Unrecovered rejection", coachableImpact: "CRITICAL" }
  ],
  trends: salesFallback.trends,
  rejectionReasons: [
    { reason: "Not interested", calls: 1420, trend: 18.2, coachable: 54, action: "Improve permission-based opening" },
    { reason: "Price too high", calls: 1164, trend: 24.5, coachable: 82, action: "Value-before-price coaching" },
    { reason: "Already using competitor", calls: 726, trend: 11.4, coachable: 76, action: "Competitor differentiation playbook" },
    { reason: "Call me later", calls: 650, trend: -4.2, coachable: 63, action: "Callback commitment script" },
    { reason: "Trust concern", calls: 608, trend: 9.6, coachable: 79, action: "Trust-marker insertion" },
    { reason: "Product mismatch", calls: 1188, trend: 16.8, coachable: 68, action: "Improve need diagnosis" }
  ],
  agentImpact: salesFallback.agentImpact
};

const liveFallback = {
  session: { sessionId: "LIVE-FIN-20260616-001", processCode: "FINNABLE", agent: "Aarav Singh", team: "Noida - Sales A", callStatus: "LIVE", duration: "02:42", customerMood: "Interested but price-sensitive", liveScore: 72, predictedOutcome: "Recoverable sale", nextBestAction: "Complete benefit-to-price bridge, then reconfirm consent and activation timeline." },
  transcript: [
    { speaker: "Agent", ts: "00:03", text: "Good morning, this is Aarav calling regarding your premium upgrade option." },
    { speaker: "Customer", ts: "00:18", text: "Okay, but I do not want anything expensive." },
    { speaker: "Agent", ts: "00:31", text: "This plan is available with a special discount today." },
    { speaker: "Customer", ts: "00:45", text: "What is the actual benefit for me?" },
    { speaker: "Agent", ts: "01:02", text: "You will get higher coverage and priority service, which reduces your out-of-pocket risk." },
    { speaker: "Customer", ts: "01:23", text: "That sounds useful. How soon can it activate?" },
    { speaker: "Agent", ts: "01:48", text: "It can be activated after your confirmation. I will also explain the terms before closing." }
  ],
  events: [
    { ts: "00:08", type: "OPENING", severity: "PASS", title: "Opening completed", message: "Agent introduced self and brand clearly.", confidence: 94 },
    { ts: "00:24", type: "INTENT", severity: "INFO", title: "Customer intent detected", message: "Customer is willing to listen but needs price clarity.", confidence: 88 },
    { ts: "00:41", type: "RISK", severity: "HIGH", title: "Price mentioned before value", message: "Coach live: explain benefit before discount.", confidence: 91 },
    { ts: "01:12", type: "OBJECTION", severity: "CRITICAL", title: "Objection: too expensive", message: "Suggested rebuttal: acknowledge price, map benefit, then explain limited-period discount.", confidence: 93 },
    { ts: "01:44", type: "BUYING_SIGNAL", severity: "HIGH", title: "Buying signal detected", message: "Customer asked about activation time. Recommend moving to reconfirmation.", confidence: 87 },
    { ts: "02:05", type: "COMPLIANCE", severity: "MEDIUM", title: "Disclosure pending", message: "Mandatory consent disclosure not completed yet.", confidence: 86 },
    { ts: "02:31", type: "CLOSING", severity: "PASS", title: "Close attempted", message: "Agent asked for consent and next step confirmation.", confidence: 92 }
  ],
  checklist: [
    { item: "Greeting & brand introduction", status: "PASS", score: 10, evidence: "Good morning, this is Aarav calling from..." },
    { item: "Need discovery", status: "PARTIAL", score: 6, evidence: "Agent asked one probing question but did not validate need." },
    { item: "Benefit explanation", status: "FAIL", score: 3, evidence: "Offer explained before customer benefit mapping." },
    { item: "Objection handling", status: "PARTIAL", score: 6, evidence: "Acknowledged objection but skipped follow-up probing." },
    { item: "Compliance disclosure", status: "PENDING", score: 0, evidence: "Required disclosure not heard yet." },
    { item: "Closing / reconfirmation", status: "PASS", score: 9, evidence: "Agent confirmed interest and next step." }
  ],
  recommendations: ["Ask one follow-up question before giving the final discount.", "Use customer concern to personalize benefit: cost protection, faster service, peace of mind.", "Complete mandatory disclosure before final confirmation.", "Move to close because customer asked activation timeline."]
};

const gapFallback = [
  { area: "Real-time architecture", gap: "No WebSocket/SSE live call stream currently proven", priority: "P0", fix: "Add live session gateway, chunked transcript events and next-best-action stream" },
  { area: "Enterprise tenancy", gap: "Process access exists, but full tenant/client isolation is not yet SaaS-grade", priority: "P0", fix: "Introduce tenant_id, client_id scoping, row-level policy checks and audit logs" },
  { area: "AI governance", gap: "Prompt/version/model confidence tracking needs stronger workflow", priority: "P0", fix: "Track prompt version, model, token cost, schema status, reviewer override and variance" },
  { area: "Analytics depth", gap: "Current funnel is snapshot-based, not transition/revenue leakage based", priority: "P0", fix: "Add sales/rejection transition facts, Sankey-ready stage tables and loss attribution" },
  { area: "Production readiness", gap: "Needs rate limiting, monitoring, error tracking, load testing and runbooks", priority: "P1", fix: "Add observability stack, UAT pack and deployment checklist enforcement" },
  { area: "Demo polish", gap: "Single large frontend file and basic CSS limit premium SaaS experience", priority: "P1", fix: "Introduce premium design system, reusable visual components and executive command center" }
];

const pages = ["Executive IQ", "Sales Funnel", "Rejection Funnel", "Live Assist", "Critical Insights", "Enterprise Gaps"];
const processes = ["FINNABLE", "INSURANCE-UPSELL", "RETENTION", "SUPPORT-INBOUND"];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatMoney(value: number) {
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)}`;
}

function Badge({ value }: { value: string }) {
  return <span className={`badge ${String(value).toLowerCase()}`}>{value}</span>;
}

function KpiCard({ label, value, sub, tone = "" }: { label: string; value: any; sub?: string; tone?: string }) {
  return (
    <div className={`kpi-card ${tone}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function BarChart({ title, rows, labelKey, valueKey, suffix = "" }: { title: string; rows: any[]; labelKey: string; valueKey: string; suffix?: string }) {
  const max = Math.max(...rows.map((r) => Number(r[valueKey] || 0)), 1);
  return (
    <div className="card chart-card">
      <div className="section-title"><h3>{title}</h3><span>{rows.length} data points</span></div>
      <div className="bar-chart">
        {rows.map((row) => {
          const value = Number(row[valueKey] || 0);
          return (
            <div className="bar-row" key={row[labelKey]}>
              <div className="bar-label">{row[labelKey]}</div>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max((value / max) * 100, 4)}%` }} /></div>
              <div className="bar-value">{suffix === "₹" ? formatMoney(value) : `${value}${suffix}`}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LineChart({ title, rows }: { title: string; rows: any[] }) {
  const width = 720;
  const height = 220;
  const points = rows.map((row, idx) => {
    const x = 32 + (idx * (width - 64)) / Math.max(rows.length - 1, 1);
    const y = height - 32 - (Number(row.conversion) / 25) * (height - 64);
    return { x, y, row };
  });
  return (
    <div className="card chart-card">
      <div className="section-title"><h3>{title}</h3><span>Conversion, rejection and quality trend</span></div>
      <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img">
        <polyline points={points.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p) => <circle key={p.row.day} cx={p.x} cy={p.y} r="5" />)}
        {points.map((p) => <text key={`${p.row.day}-label`} x={p.x} y={height - 8} textAnchor="middle">{p.row.day}</text>)}
        {points.map((p) => <text key={`${p.row.day}-value`} x={p.x} y={p.y - 12} textAnchor="middle">{p.row.conversion}%</text>)}
      </svg>
      <div className="chart-legend"><span>● Conversion %</span><span>Rejection tracked in table view</span><span>Quality compared in scorecards</span></div>
    </div>
  );
}

function Funnel({ title, stages, mode }: { title: string; stages: Stage[]; mode: "sales" | "rejection" }) {
  const max = Math.max(...stages.map((s) => s.count), 1);
  return (
    <div className="card funnel-card">
      <div className="section-title"><h3>{title}</h3><span>Every transition has count, conversion, leakage and reason</span></div>
      <div className="funnel">
        {stages.map((stage, index) => (
          <div className={`funnel-stage ${mode}`} key={stage.key} style={{ width: `${Math.max((stage.count / max) * 100, 22)}%` }}>
            <div className="stage-top">
              <strong>{index + 1}. {stage.label}</strong>
              <Badge value={stage.coachableImpact} />
            </div>
            <div className="stage-count">{formatNumber(stage.count)}</div>
            <div className="stage-grid">
              <span>Prev conv: <b>{stage.previousConversion}%</b></span>
              <span>Total conv: <b>{stage.totalConversion}%</b></span>
              <span>Leakage: <b>{formatNumber(stage.leakage)}</b></span>
            </div>
            <p>{stage.leakageReason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightList({ insights }: { insights: any[] }) {
  return (
    <div className="insight-grid">
      {insights.map((insight) => (
        <div className="insight-card" key={insight.id}>
          <div className="insight-head"><Badge value={insight.severity} /><span>{insight.id} • {insight.process}</span></div>
          <h3>{insight.title}</h3>
          <div className="impact">{insight.impact}</div>
          <p><b>Evidence:</b> {insight.evidence}</p>
          <p><b>AI recommendation:</b> {insight.recommendation}</p>
          <div className="owner-row"><span>Owner: {insight.owner}</span><span>Due: {insight.due}</span></div>
        </div>
      ))}
    </div>
  );
}

function ScorecardTable({ rows }: { rows: any[] }) {
  return (
    <div className="card">
      <div className="section-title"><h3>Process control tower</h3><span>CEO-ready comparison</span></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Process</th><th>Branch</th><th>Calls</th><th>Conversion</th><th>Rejection</th><th>Quality</th><th>Revenue</th><th>Risk</th></tr></thead>
          <tbody>
            {rows.map((row) => <tr key={row.process}><td>{row.process}</td><td>{row.branch}</td><td>{formatNumber(row.calls)}</td><td>{row.conversion}%</td><td>{row.rejection}%</td><td>{row.quality}%</td><td>{formatMoney(row.revenue)}</td><td><Badge value={row.risk} /></td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeakageTable({ title, rows }: { title: string; rows: any[] }) {
  return (
    <div className="card">
      <div className="section-title"><h3>{title}</h3><span>Ranked by business impact</span></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Reason</th><th>Calls</th><th>Missed / trend</th><th>Coachable</th><th>Action</th></tr></thead>
          <tbody>
            {rows.map((row) => <tr key={row.reason}><td>{row.reason}</td><td>{formatNumber(row.calls)}</td><td>{row.missedRevenue ? formatMoney(row.missedRevenue) : `${row.trend}%`}</td><td>{row.coachable}%</td><td>{row.action || <Badge value={row.severity} />}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AgentTable({ rows }: { rows: any[] }) {
  return (
    <div className="card">
      <div className="section-title"><h3>Agent transition impact</h3><span>Best and riskiest behaviors</span></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Agent</th><th>Team</th><th>Calls</th><th>Conv.</th><th>Rej.</th><th>Quality</th><th>Leakage stage</th><th>Action</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.agent}><td>{row.agent}</td><td>{row.team}</td><td>{row.calls}</td><td>{row.conversion}%</td><td>{row.rejection}%</td><td>{row.quality}%</td><td>{row.leakageStage}</td><td>{row.action}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function ExecutivePage({ executive }: { executive: any }) {
  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">Call Master Enterprise IQ</span>
          <h1>Revenue, quality, rejection and live assist in one executive command center.</h1>
          <p>Demo-ready premium portal with every funnel data point visible: count, conversion, leakage, reason, coaching action and revenue impact.</p>
        </div>
        <div className="hero-panel">
          <div>AI confidence</div><strong>92%</strong><span>5 critical insights generated</span>
        </div>
      </section>
      <section className="kpi-grid">
        <KpiCard label="Total calls" value={formatNumber(executive.kpis.totalCalls)} sub="Across active processes" />
        <KpiCard label="Revenue influenced" value={formatMoney(executive.kpis.totalRevenue)} sub="Demo pipeline estimate" tone="gold" />
        <KpiCard label="Avg conversion" value={`${executive.kpis.avgConversion}%`} sub="Sales processes" />
        <KpiCard label="Avg quality" value={`${executive.kpis.avgQuality}%`} sub="Audit health" />
        <KpiCard label="Coachable leakage" value={`${executive.kpis.coachableLeakage}%`} sub="Recoverable behaviors" tone="danger" />
        <KpiCard label="Live assist coverage" value={`${executive.kpis.liveAssistCoverage}%`} sub="Calls with real-time guidance" />
      </section>
      <section className="grid two">
        <LineChart title="7-day conversion trend" rows={executive.conversionTrend} />
        <BarChart title="Revenue by process" rows={executive.processScorecards.filter((r: any) => r.revenue > 0)} labelKey="process" valueKey="revenue" suffix="₹" />
      </section>
      <ScorecardTable rows={executive.processScorecards} />
    </>
  );
}

function SalesPage({ sales }: { sales: any }) {
  return (
    <>
      <section className="kpi-grid">
        <KpiCard label="Connected calls" value={formatNumber(sales.kpis.connectedCalls)} sub="Funnel base" />
        <KpiCard label="Sale done" value={formatNumber(sales.kpis.salesDone)} sub={`${sales.kpis.conversionPercent}% conversion`} />
        <KpiCard label="Verified sale" value={formatNumber(sales.kpis.verifiedSales)} sub={`${sales.kpis.verifiedConversionPercent}% verified`} />
        <KpiCard label="Revenue" value={formatMoney(sales.kpis.estimatedRevenue)} sub="Estimated realized" tone="gold" />
        <KpiCard label="Missed revenue" value={formatMoney(sales.kpis.missedRevenue)} sub="Leakage opportunity" tone="danger" />
        <KpiCard label="Highest leakage" value={sales.kpis.highestLeakageStage} sub="Critical transition" />
      </section>
      <Funnel title="Customer sales transition funnel" stages={sales.stages} mode="sales" />
      <section className="grid two"><LeakageTable title="Top sales leakage reasons" rows={sales.leakageReasons} /><BarChart title="Sales by day" rows={sales.trends} labelKey="day" valueKey="sales" /></section>
      <AgentTable rows={sales.agentImpact} />
    </>
  );
}

function RejectionPage({ rejection }: { rejection: any }) {
  return (
    <>
      <section className="kpi-grid">
        <KpiCard label="Connected calls" value={formatNumber(rejection.kpis.connectedCalls)} sub="Rejection universe" />
        <KpiCard label="Final lost" value={formatNumber(rejection.kpis.finalLost)} sub={`${rejection.kpis.rejectionPercent}% rejection`} tone="danger" />
        <KpiCard label="Coachable rejection" value={`${rejection.kpis.coachableRejectionPercent}%`} sub="Recoverable through training" />
        <KpiCard label="Recovery candidates" value={formatNumber(rejection.kpis.recoveryCandidates)} sub="Callback / save opportunity" tone="gold" />
        <KpiCard label="Recoverable revenue" value={formatMoney(rejection.kpis.estimatedRecoverableRevenue)} sub="Estimated opportunity" />
        <KpiCard label="Top reason" value={rejection.kpis.highestRejectionReason} sub="Priority action" />
      </section>
      <Funnel title="Customer rejection transition funnel" stages={rejection.stages} mode="rejection" />
      <section className="grid two"><LeakageTable title="Top rejection reasons" rows={rejection.rejectionReasons} /><BarChart title="Rejections by day" rows={rejection.trends} labelKey="day" valueKey="rejection" /></section>
      <AgentTable rows={rejection.agentImpact} />
    </>
  );
}

function LiveAssistPage({ live }: { live: any }) {
  return (
    <>
      <section className="live-hero card">
        <div><span className="eyebrow">Live session</span><h2>{live.session.sessionId}</h2><p>{live.session.agent} • {live.session.team} • {live.session.duration}</p></div>
        <div className="live-score"><span>Live score</span><strong>{live.session.liveScore}</strong><small>{live.session.predictedOutcome}</small></div>
        <div className="next-action"><span>Next best action</span><b>{live.session.nextBestAction}</b></div>
      </section>
      <section className="grid three-live">
        <div className="card"><div className="section-title"><h3>Live transcript</h3><span>chunked feed</span></div><div className="transcript">{live.transcript.map((line: any) => <div key={`${line.ts}-${line.text}`} className={`talk ${line.speaker.toLowerCase()}`}><span>{line.ts} • {line.speaker}</span><p>{line.text}</p></div>)}</div></div>
        <div className="card"><div className="section-title"><h3>Real-time events</h3><span>alert stream</span></div><div className="event-list">{live.events.map((event: any) => <div key={`${event.ts}-${event.title}`} className="event"><div><Badge value={event.severity} /> <b>{event.ts}</b></div><h4>{event.title}</h4><p>{event.message}</p><span>{event.confidence}% confidence</span></div>)}</div></div>
        <div className="card"><div className="section-title"><h3>Live audit checklist</h3><span>parameter score</span></div><div className="checklist">{live.checklist.map((item: any) => <div key={item.item} className="check-item"><div><b>{item.item}</b><Badge value={item.status} /></div><div className="mini-meter"><span style={{ width: `${item.score * 10}%` }} /></div><p>{item.evidence}</p></div>)}</div></div>
      </section>
      <div className="card"><div className="section-title"><h3>AI live coaching recommendations</h3><span>agent assist prompt bank</span></div><div className="recommendations">{live.recommendations.map((r: string) => <div key={r}>⚡ {r}</div>)}</div></div>
    </>
  );
}

function GapsPage({ gaps }: { gaps: any[] }) {
  return (
    <div className="card">
      <div className="section-title"><h3>What is still missing to become world-class enterprise SaaS</h3><span>prioritized build backlog</span></div>
      <div className="gap-grid">
        {gaps.map((gap) => <div className="gap-card" key={gap.area}><div><Badge value={gap.priority} /><h3>{gap.area}</h3></div><p><b>Gap:</b> {gap.gap}</p><p><b>Fix:</b> {gap.fix}</p></div>)}
      </div>
    </div>
  );
}

function App() {
  const [page, setPage] = useState("Executive IQ");
  const [selectedProcess, setSelectedProcess] = useState("FINNABLE");
  const [role, setRole] = useState("CEO");
  const [source, setSource] = useState("Demo fallback loaded");
  const [executive, setExecutive] = useState<any>(executiveFallback);
  const [sales, setSales] = useState<any>(salesFallback);
  const [rejection, setRejection] = useState<any>(rejectionFallback);
  const [live, setLive] = useState<any>(liveFallback);
  const [gaps, setGaps] = useState<any[]>(gapFallback);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [exec, salesRes, rejectRes, liveRes, gapsRes] = await Promise.all([
          apiGet<ApiResponse<any>>("/api/executive/dashboard"),
          apiGet<ApiResponse<any>>(`/api/funnels/${encodeURIComponent(selectedProcess)}/sales-transition`),
          apiGet<ApiResponse<any>>(`/api/funnels/${encodeURIComponent(selectedProcess)}/rejection-transition`),
          apiGet<ApiResponse<any>>("/api/live/demo"),
          apiGet<ApiResponse<any[]>>("/api/executive/gaps")
        ]);
        if (cancelled) return;
        setExecutive(exec.data);
        setSales(salesRes.data);
        setRejection(rejectRes.data);
        setLive(liveRes.data);
        setGaps(gapsRes.data);
        setSource(`Live API connected: ${API_BASE}`);
      } catch (err: any) {
        if (!cancelled) setSource(`Premium demo fallback active. API not reachable or auth/DB pending: ${err.message?.slice(0, 80) || "unknown"}`);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedProcess]);

  const content = useMemo(() => {
    if (page === "Sales Funnel") return <SalesPage sales={sales} />;
    if (page === "Rejection Funnel") return <RejectionPage rejection={rejection} />;
    if (page === "Live Assist") return <LiveAssistPage live={live} />;
    if (page === "Critical Insights") return <InsightList insights={executive.insightCards} />;
    if (page === "Enterprise Gaps") return <GapsPage gaps={gaps} />;
    return <ExecutivePage executive={executive} />;
  }, [page, executive, sales, rejection, live, gaps]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">CM</div><div><h1>Call Master</h1><p>Enterprise IQ</p></div></div>
        <div className="nav-section"><span>Command center</span>{pages.map((p) => <button key={p} className={page === p ? "active" : ""} onClick={() => setPage(p)}>{p}</button>)}</div>
        <div className="sidebar-card"><b>Demo quality</b><p>Premium SaaS look with executive KPIs, funnels, insights, live assist and enterprise gap backlog.</p></div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div><h2>{page}</h2><p>{source}</p></div>
          <div className="filters"><select value={selectedProcess} onChange={(e) => setSelectedProcess(e.target.value)}>{processes.map((p) => <option key={p}>{p}</option>)}</select><select value={role} onChange={(e) => setRole(e.target.value)}><option>CEO</option><option>T&Q Head</option><option>Ops Manager</option><option>QA Auditor</option><option>Trainer</option><option>TL</option></select><button onClick={() => window.print()}>Export view</button></div>
        </header>
        {content}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);

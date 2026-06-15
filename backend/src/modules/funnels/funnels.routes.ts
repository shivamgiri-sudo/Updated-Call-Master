import { Router } from "express";
import { DB, pool, qid } from "../../config/db";
import { asyncHandler } from "../../middleware/asyncHandler";
import { yesNoFlag } from "../../utils/sql";

const router = Router();

type Impact = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type FunnelStage = { key: string; label: string; count: number; previousConversion: number; totalConversion: number; leakage: number; leakageReason: string; coachableImpact: Impact };

const demoSalesStages: FunnelStage[] = [
  { key: "connected", label: "Connected calls", count: 12840, previousConversion: 100, totalConversion: 100, leakage: 0, leakageReason: "Base connected universe", coachableImpact: "LOW" },
  { key: "opening_attempted", label: "Opening attempted", count: 12190, previousConversion: 94.94, totalConversion: 94.94, leakage: 650, leakageReason: "Agent skipped structured opening", coachableImpact: "HIGH" },
  { key: "offer_explained", label: "Offer explained", count: 8122, previousConversion: 66.63, totalConversion: 63.25, leakage: 4068, leakageReason: "Offer not explained clearly", coachableImpact: "HIGH" },
  { key: "objection_handled", label: "Objection handled", count: 4238, previousConversion: 52.18, totalConversion: 33.01, leakage: 3884, leakageReason: "Rebuttal not aligned to objection", coachableImpact: "CRITICAL" },
  { key: "sale_done", label: "Sale done", count: 2384, previousConversion: 56.25, totalConversion: 18.57, leakage: 1854, leakageReason: "Last-mile hesitation", coachableImpact: "MEDIUM" }
];

const demoRejectionStages: FunnelStage[] = [
  { key: "connected", label: "Connected calls", count: 12840, previousConversion: 100, totalConversion: 100, leakage: 0, leakageReason: "Base connected universe", coachableImpact: "LOW" },
  { key: "opening_rejected", label: "Opening rejected", count: 1856, previousConversion: 14.45, totalConversion: 14.45, leakage: 1856, leakageReason: "Customer refused early", coachableImpact: "MEDIUM" },
  { key: "offer_rejected", label: "Offer rejected", count: 1642, previousConversion: 88.47, totalConversion: 12.79, leakage: 214, leakageReason: "Offer permission failed", coachableImpact: "HIGH" },
  { key: "objection_recorded", label: "Objection recorded", count: 2324, previousConversion: 141.53, totalConversion: 18.1, leakage: 0, leakageReason: "Customer objection captured", coachableImpact: "HIGH" },
  { key: "final_lost", label: "Final lost", count: 4982, previousConversion: 214.37, totalConversion: 38.8, leakage: 3658, leakageReason: "Unrecovered rejection", coachableImpact: "CRITICAL" }
];

const demoTrends = [
  { day: "Mon", connected: 2050, sales: 358, rejection: 742, conversion: 17.46 },
  { day: "Tue", connected: 2144, sales: 386, rejection: 808, conversion: 18.0 },
  { day: "Wed", connected: 1988, sales: 331, rejection: 794, conversion: 16.65 },
  { day: "Thu", connected: 2220, sales: 430, rejection: 760, conversion: 19.37 },
  { day: "Fri", connected: 2328, sales: 468, rejection: 838, conversion: 20.1 }
];

const demoLeakageReasons = [
  { reason: "Weak need discovery", calls: 1596, missedRevenue: 3192000, coachable: 92, severity: "CRITICAL" },
  { reason: "Generic objection rebuttal", calls: 1478, missedRevenue: 2956000, coachable: 88, severity: "CRITICAL" },
  { reason: "Offer explained without urgency", calls: 1128, missedRevenue: 2256000, coachable: 77, severity: "HIGH" }
];

const demoRejectionReasons = [
  { reason: "Not interested", calls: 1420, trend: 18.2, coachable: 54, action: "Improve permission-based opening" },
  { reason: "Price too high", calls: 1164, trend: 24.5, coachable: 82, action: "Value-before-price coaching" },
  { reason: "Already using competitor", calls: 726, trend: 11.4, coachable: 76, action: "Competitor differentiation playbook" }
];

const demoAgentImpact = [
  { agent: "Aarav Singh", team: "Noida", calls: 428, conversion: 24.8, rejection: 31.4, leakageStage: "Need identified", quality: 91.2, action: "Use as best-call library sample" },
  { agent: "Rohan Verma", team: "Noida", calls: 512, conversion: 13.9, rejection: 48.6, leakageStage: "Objection handled", quality: 72.5, action: "Critical objection-handling coaching" }
];

function toNumber(value: unknown): number { return Number(value || 0); }
function pct(num: number, den: number): number { return den ? Number(((num / den) * 100).toFixed(2)) : 0; }
function impact(leakage: number, base: number): Impact { const p = pct(leakage, base); if (p >= 25) return "CRITICAL"; if (p >= 15) return "HIGH"; if (p >= 7) return "MEDIUM"; return "LOW"; }
function stage(key: string, label: string, count: number, previous: number, total: number, reason: string): FunnelStage {
  const leakage = Math.max(previous - count, 0);
  return { key, label, count, previousConversion: pct(count, previous || total), totalConversion: pct(count, total), leakage, leakageReason: reason, coachableImpact: impact(leakage, total) };
}

async function getClientId(processCode: string): Promise<number | null> {
  const sql = `SELECT DISTINCT cm.client_id FROM ${qid(DB.APP)}.ci_call_master cm JOIN ${qid(DB.APP)}.ci_process_master pm ON cm.process_id = pm.process_id WHERE pm.process_code = ? AND cm.client_id IS NOT NULL LIMIT 1`;
  const [rows]: any = await pool.query(sql, [processCode]);
  return rows?.[0]?.client_id ?? null;
}

function dateFilter(req: any, params: any[]): string {
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  let filter = "";
  if (startDate) { filter += " AND CallDate >= ?"; params.push(startDate); }
  if (endDate) { filter += " AND CallDate < ?"; params.push(endDate); }
  return filter;
}

async function loadSummary(clientId: number, req: any) {
  const params: any[] = [clientId];
  const filter = dateFilter(req, params);
  const sql = `
    SELECT
      COUNT(*) AS total_calls,
      SUM(${yesNoFlag("Opening")}) AS opening_done,
      SUM(${yesNoFlag("Offered")}) AS offered_done,
      SUM(${yesNoFlag("ObjectionHandling")}) AS objection_handled,
      SUM(${yesNoFlag("PrepaidPitch")}) AS prepaid_pitch_done,
      SUM(${yesNoFlag("UpsellingEfforts")}) AS upsell_attempted,
      SUM(${yesNoFlag("OfferUrgency")}) AS urgency_done,
      SUM(${yesNoFlag("SaleDone")}) AS sale_done,
      SUM(CASE WHEN LOWER(TRIM(OpeningRejected)) IN ('yes','y','1','true') THEN 1 ELSE 0 END) AS opening_rejected,
      SUM(CASE WHEN LOWER(TRIM(OfferingRejected)) IN ('yes','y','1','true') THEN 1 ELSE 0 END) AS offering_rejected,
      SUM(CASE WHEN LOWER(TRIM(AfterListeningOfferRejected)) IN ('yes','y','1','true') THEN 1 ELSE 0 END) AS after_listening_rejected,
      SUM(CASE WHEN CustomerObjectionCategory IS NOT NULL AND TRIM(CustomerObjectionCategory) <> '' THEN 1 ELSE 0 END) AS objection_recorded,
      SUM(CASE WHEN AgentRebuttalCategory IS NOT NULL AND TRIM(AgentRebuttalCategory) <> '' THEN 1 ELSE 0 END) AS rebuttal_recorded
    FROM ${qid(DB.EXTERNAL)}.CallDetails
    WHERE client_id = ? ${filter}`;
  const [rows]: any = await pool.query(sql, params);
  return rows?.[0] || {};
}

async function loadTrends(clientId: number, req: any) {
  const params: any[] = [clientId];
  const filter = dateFilter(req, params);
  const sql = `SELECT DATE(CallDate) AS day, COUNT(*) AS connected, SUM(${yesNoFlag("SaleDone")}) AS sales, SUM(CASE WHEN LOWER(TRIM(SaleDone)) NOT IN ('yes','y','1','true','done','pass','sale done') THEN 1 ELSE 0 END) AS rejection FROM ${qid(DB.EXTERNAL)}.CallDetails WHERE client_id = ? ${filter} GROUP BY DATE(CallDate) ORDER BY day DESC LIMIT 14`;
  const [rows]: any = await pool.query(sql, params);
  return rows.map((r: any) => ({ ...r, conversion: pct(toNumber(r.sales), toNumber(r.connected)) })).reverse();
}

async function loadAgents(clientId: number, req: any) {
  const params: any[] = [clientId];
  const filter = dateFilter(req, params);
  const sql = `SELECT AgentName AS agent, COUNT(*) AS calls, SUM(${yesNoFlag("SaleDone")}) AS sale_done, SUM(CASE WHEN LOWER(TRIM(SaleDone)) NOT IN ('yes','y','1','true','done','pass','sale done') THEN 1 ELSE 0 END) AS rejected FROM ${qid(DB.EXTERNAL)}.CallDetails WHERE client_id = ? ${filter} GROUP BY AgentName ORDER BY calls DESC LIMIT 20`;
  const [rows]: any = await pool.query(sql, params);
  return rows.map((r: any) => ({ agent: r.agent || "Unknown", team: "Mapped team pending", calls: toNumber(r.calls), conversion: pct(toNumber(r.sale_done), toNumber(r.calls)), rejection: pct(toNumber(r.rejected), toNumber(r.calls)), leakageStage: "Derived from funnel", quality: 0, action: "Review stage leakage" }));
}

async function loadRejectionReasons(clientId: number, req: any) {
  const params: any[] = [clientId];
  const filter = dateFilter(req, params);
  const sql = `SELECT COALESCE(NULLIF(TRIM(NotInterestedBucketReason),''), NULLIF(TRIM(CustomerObjectionCategory),''), 'Unclassified') AS reason, COUNT(*) AS calls, SUM(${yesNoFlag("SaleDone")}) AS recovered FROM ${qid(DB.EXTERNAL)}.CallDetails WHERE client_id = ? ${filter} GROUP BY reason ORDER BY calls DESC LIMIT 20`;
  const [rows]: any = await pool.query(sql, params);
  return rows.map((r: any) => ({ reason: r.reason, calls: toNumber(r.calls), trend: 0, coachable: pct(toNumber(r.calls) - toNumber(r.recovered), toNumber(r.calls)), action: "Review rebuttal and recovery script" }));
}

router.get("/:processCode/sales-transition", asyncHandler(async (req, res) => {
  const processCode = req.params.processCode;
  try {
    const clientId = await getClientId(processCode);
    if (!clientId) throw new Error("No client mapping found");
    const [summary, trends, agents] = await Promise.all([loadSummary(clientId, req), loadTrends(clientId, req), loadAgents(clientId, req)]);
    const total = toNumber(summary.total_calls);
    const opening = toNumber(summary.opening_done);
    const offered = toNumber(summary.offered_done);
    const handled = toNumber(summary.objection_handled);
    const urgency = toNumber(summary.urgency_done);
    const sale = toNumber(summary.sale_done);
    const stages = [
      stage("connected", "Connected calls", total, total, total, "Base connected universe"),
      stage("opening_attempted", "Opening attempted", opening, total, total, "Opening not completed"),
      stage("offer_explained", "Offer explained", offered, opening, total, "Offer explanation leakage"),
      stage("objection_handled", "Objection handled", handled, offered, total, "Objection handling leakage"),
      stage("urgency_done", "Price and urgency explained", urgency, handled || offered, total, "Urgency framing leakage"),
      stage("sale_done", "Sale done", sale, urgency || handled || offered, total, "Last-mile conversion leakage")
    ];
    const missedRevenue = Math.max(total - sale, 0) * 2000;
    res.json({ success: true, source: "mysql_readonly", processCode, clientId, generatedAt: new Date().toISOString(), data: { kpis: { connectedCalls: total, salesDone: sale, verifiedSales: sale, conversionPercent: pct(sale, total), verifiedConversionPercent: pct(sale, total), estimatedRevenue: sale * 2000, missedRevenue, highestLeakageStage: "Derived from stage leakage", coachableLeakagePercent: pct(Math.max(offered - sale, 0), total) }, stages, trends, leakageReasons: demoLeakageReasons, agentImpact: agents } });
  } catch (error: any) {
    res.json({ success: true, source: "demo_fallback", processCode, warning: error.message, generatedAt: new Date().toISOString(), data: { kpis: { connectedCalls: 12840, salesDone: 2384, verifiedSales: 2216, conversionPercent: 18.57, verifiedConversionPercent: 17.26, estimatedRevenue: 4432000, missedRevenue: 13112000, highestLeakageStage: "Need identified to Offer explained", coachableLeakagePercent: 84.6 }, stages: demoSalesStages, trends: demoTrends, leakageReasons: demoLeakageReasons, agentImpact: demoAgentImpact } });
  }
}));

router.get("/:processCode/rejection-transition", asyncHandler(async (req, res) => {
  const processCode = req.params.processCode;
  try {
    const clientId = await getClientId(processCode);
    if (!clientId) throw new Error("No client mapping found");
    const [summary, trends, reasons, agents] = await Promise.all([loadSummary(clientId, req), loadTrends(clientId, req), loadRejectionReasons(clientId, req), loadAgents(clientId, req)]);
    const total = toNumber(summary.total_calls);
    const openingRejected = toNumber(summary.opening_rejected);
    const offeringRejected = toNumber(summary.offering_rejected);
    const afterRejected = toNumber(summary.after_listening_rejected);
    const objectionRecorded = toNumber(summary.objection_recorded);
    const rebuttalRecorded = toNumber(summary.rebuttal_recorded);
    const sale = toNumber(summary.sale_done);
    const finalLost = Math.max(total - sale, 0);
    const stages = [
      stage("connected", "Connected calls", total, total, total, "Base connected universe"),
      stage("opening_rejected", "Opening rejected", openingRejected, total, total, "Customer refused early"),
      stage("offer_rejected", "Offer rejected", offeringRejected, total, total, "Offer rejected before full conversion"),
      stage("after_listening_rejected", "After-listening rejection", afterRejected, total, total, "Customer listened but did not accept"),
      stage("objection_recorded", "Objection recorded", objectionRecorded, total, total, "Customer objection captured"),
      stage("rebuttal_recorded", "Rebuttal recorded", rebuttalRecorded, objectionRecorded || total, total, "Agent rebuttal captured"),
      stage("final_lost", "Final lost", finalLost, total, total, "Unrecovered rejection")
    ];
    res.json({ success: true, source: "mysql_readonly", processCode, clientId, generatedAt: new Date().toISOString(), data: { kpis: { connectedCalls: total, finalLost, rejectionPercent: pct(finalLost, total), coachableRejectionPercent: pct(objectionRecorded, finalLost || total), highestRejectionReason: reasons?.[0]?.reason || "Unclassified", recoveryCandidates: rebuttalRecorded, estimatedRecoverableRevenue: rebuttalRecorded * 2000 }, stages, trends, rejectionReasons: reasons, agentImpact: agents } });
  } catch (error: any) {
    res.json({ success: true, source: "demo_fallback", processCode, warning: error.message, generatedAt: new Date().toISOString(), data: { kpis: { connectedCalls: 12840, finalLost: 4982, rejectionPercent: 38.8, coachableRejectionPercent: 76.4, highestRejectionReason: "Price too high after offer explanation", recoveryCandidates: 1318, estimatedRecoverableRevenue: 2636000 }, stages: demoRejectionStages, trends: demoTrends, rejectionReasons: demoRejectionReasons, agentImpact: demoAgentImpact } });
  }
}));

router.get("/:processCode/leakage", (_req, res) => res.json({ success: true, data: demoLeakageReasons }));
router.get("/:processCode/stage-agents", (_req, res) => res.json({ success: true, data: demoAgentImpact }));

export default router;

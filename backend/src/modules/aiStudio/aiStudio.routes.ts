import { Router } from "express";
import { DB, pool, qid } from "../../config/db";
import { asyncHandler } from "../../middleware/asyncHandler";

const router = Router();

const promptVersions = [
  {
    promptId: "PROMPT-SALES-001",
    name: "Outbound Sales Audit v3.2",
    process: "FINNABLE",
    status: "ACTIVE",
    model: "Enterprise LLM Router",
    schemaStatus: "VALID",
    avgConfidence: 91.4,
    tokenCostToday: 1840,
    humanOverrideRate: 4.8,
    lastCalibrated: "2026-06-15"
  },
  {
    promptId: "PROMPT-REJECTION-002",
    name: "Customer Rejection Classifier v2.1",
    process: "FINNABLE",
    status: "ACTIVE",
    model: "Enterprise LLM Router",
    schemaStatus: "VALID",
    avgConfidence: 89.7,
    tokenCostToday: 980,
    humanOverrideRate: 6.2,
    lastCalibrated: "2026-06-14"
  },
  {
    promptId: "PROMPT-LIVE-003",
    name: "Live Assist Next Best Action v1.0",
    process: "All Sales",
    status: "PILOT",
    model: "Low-latency LLM",
    schemaStatus: "VALID",
    avgConfidence: 86.1,
    tokenCostToday: 620,
    humanOverrideRate: 8.6,
    lastCalibrated: "2026-06-13"
  },
  {
    promptId: "PROMPT-COMPLIANCE-004",
    name: "Sensitive Word & Compliance Guardrail",
    process: "All Processes",
    status: "ACTIVE",
    model: "Rules + LLM verifier",
    schemaStatus: "VALID",
    avgConfidence: 94.8,
    tokenCostToday: 410,
    humanOverrideRate: 2.1,
    lastCalibrated: "2026-06-15"
  }
];

const frameworkParameters = [
  { category: "Opening", parameter: "Brand introduction", weight: 10, fatal: false, liveAssist: true, evidenceRequired: true },
  { category: "Discovery", parameter: "Need identification", weight: 15, fatal: false, liveAssist: true, evidenceRequired: true },
  { category: "Sales", parameter: "Benefit personalization", weight: 15, fatal: false, liveAssist: true, evidenceRequired: true },
  { category: "Sales", parameter: "Price after value", weight: 12, fatal: false, liveAssist: true, evidenceRequired: true },
  { category: "Objection", parameter: "Acknowledge and probe", weight: 14, fatal: false, liveAssist: true, evidenceRequired: true },
  { category: "Compliance", parameter: "Mandatory disclosure", weight: 20, fatal: true, liveAssist: true, evidenceRequired: true },
  { category: "Closing", parameter: "Consent and reconfirmation", weight: 14, fatal: false, liveAssist: true, evidenceRequired: true }
];

const governanceCards = [
  { metric: "Prompt versions active", value: 4, status: "CONTROLLED", note: "All active prompts have schema validation." },
  { metric: "Avg AI confidence", value: "90.5%", status: "HEALTHY", note: "Above enterprise threshold of 85%." },
  { metric: "Human override rate", value: "5.4%", status: "WATCH", note: "Review rejection classifier overrides weekly." },
  { metric: "Daily token cost", value: "₹3,850", status: "HEALTHY", note: "Within configured budget guardrail." },
  { metric: "Calibration variance", value: "2.8%", status: "HEALTHY", note: "Below 3% target variance." }
];

async function runReadOnly<T>(sql: string, fallback: T, mapRows: (rows: any[]) => T) {
  try {
    const [rows]: any = await pool.query(sql);
    return { source: "mysql_app_owned", data: mapRows(rows || []) };
  } catch (error: any) {
    return { source: "demo_fallback", warning: error.message, data: fallback };
  }
}

router.get("/prompts", asyncHandler(async (_req, res) => {
  const sql = `SELECT * FROM ${qid(DB.APP)}.ci_ai_prompt_version_master ORDER BY 1 DESC LIMIT 50`;
  const result = await runReadOnly(sql, promptVersions, (rows) => rows.length ? rows.map((row) => ({
    promptId: row.prompt_version_id || row.prompt_id || row.id || "PROMPT",
    name: row.prompt_name || row.prompt_code || row.name || "AI prompt",
    process: row.process_code || row.process || "All Processes",
    status: row.active_status === 0 ? "DRAFT" : "ACTIVE",
    model: row.model_name || row.model || "Configured model",
    schemaStatus: row.schema_validation_status || "VALID",
    avgConfidence: Number(row.avg_confidence_percent || row.avgConfidence || 0),
    tokenCostToday: Number(row.token_cost_today || row.tokenCostToday || 0),
    humanOverrideRate: Number(row.human_override_rate || row.humanOverrideRate || 0),
    lastCalibrated: String(row.last_calibrated_at || row.updated_at || row.created_at || "-").slice(0, 10)
  })) : promptVersions);
  res.json({ success: true, generatedAt: new Date().toISOString(), ...result });
}));

router.get("/framework", (_req, res) => {
  res.json({ success: true, source: "demo_fallback", generatedAt: new Date().toISOString(), data: frameworkParameters });
});

router.get("/governance", (_req, res) => {
  res.json({ success: true, source: "demo_fallback", generatedAt: new Date().toISOString(), data: governanceCards });
});

router.get("/readiness", (_req, res) => {
  res.json({
    success: true,
    data: [
      { check: "Prompt database binding", status: "PARTIAL", detail: "Prompt endpoint attempts read-only DB first, then fallback." },
      { check: "Framework database binding", status: "NEXT", detail: "Framework endpoint still uses fallback." },
      { check: "Governance database binding", status: "NEXT", detail: "Governance endpoint still uses fallback." }
    ]
  });
});

export default router;

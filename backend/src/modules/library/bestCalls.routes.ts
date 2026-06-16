import { Router } from "express";
import { DB, pool, qid } from "../../config/db";
import { asyncHandler } from "../../middleware/asyncHandler";

const router = Router();

const bestCalls = [
  { callId: "CALL-FIN-88421", process: "FINNABLE", agent: "Aarav Singh", stage: "Price & urgency explained", conversion: "Sale done", quality: 96.4, snippet: "Customer raised price concern; agent linked benefit to customer risk and explained discount after value.", coachingUse: "Value-before-price example", duration: "04:12", tags: ["price objection", "benefit mapping", "closing"] },
  { callId: "CALL-INS-11882", process: "INSURANCE-UPSELL", agent: "Meera Khan", stage: "Buying signal captured", conversion: "Verified sale", quality: 97.8, snippet: "Agent identified activation-time question as buying signal and moved to consent cleanly.", coachingUse: "Buying signal recognition", duration: "05:06", tags: ["buying signal", "consent", "high conversion"] },
  { callId: "CALL-RET-55620", process: "RETENTION", agent: "Priya Nair", stage: "Rebuttal recovery", conversion: "Saved customer", quality: 94.2, snippet: "Agent acknowledged cancellation intent, probed reason, and matched retention benefit to pain point.", coachingUse: "Acknowledge-probe-rebuttal framework", duration: "06:33", tags: ["retention", "rebuttal", "customer save"] }
];

const playlists = [
  { name: "Winning openings", calls: 18, owner: "Training", completionRate: 76, targetAudience: "New agents" },
  { name: "Price objection mastery", calls: 22, owner: "Quality", completionRate: 64, targetAudience: "Bottom quartile" },
  { name: "Rebuttal recovery", calls: 16, owner: "Ops + Training", completionRate: 58, targetAudience: "Retention teams" },
  { name: "Compliance-perfect closes", calls: 12, owner: "QA", completionRate: 82, targetAudience: "All sales" }
];

async function runReadOnly<T>(sql: string, fallback: T, mapRows: (rows: any[]) => T) {
  try {
    const [rows]: any = await pool.query(sql);
    return { source: "mysql_app_owned", data: mapRows(rows || []) };
  } catch (error: any) {
    return { source: "demo_fallback", warning: error.message, data: fallback };
  }
}

router.get("/best-calls", asyncHandler(async (_req, res) => {
  const sql = `SELECT * FROM ${qid(DB.APP)}.call_best_call_library ORDER BY 1 DESC LIMIT 50`;
  const result = await runReadOnly(sql, bestCalls, (rows) => rows.length ? rows.map((row) => ({
    callId: row.call_id || row.callId || row.id || "CALL",
    process: row.process_code || row.process || "Mapped process pending",
    agent: row.agent_name || row.source_agent_name || row.agent || "Mapped agent pending",
    stage: row.stage || row.funnel_stage || "Best practice",
    conversion: row.conversion || row.call_disposition || "Best call",
    quality: Number(row.quality_percent || row.quality || 0),
    snippet: row.snippet || row.masked_transcript_text || row.description || "Transcript snippet pending.",
    coachingUse: row.coaching_use || row.coachingUse || row.library_title || "Coaching use case",
    duration: row.duration || row.call_duration || "-",
    tags: Array.isArray(row.tags_json) ? row.tags_json : String(row.tags_json || row.tags || "best call").split(",").map((x) => x.trim()).filter(Boolean)
  })) : bestCalls);
  res.json({ success: true, generatedAt: new Date().toISOString(), ...result });
}));

router.get("/playlists", asyncHandler(async (_req, res) => {
  const sql = `SELECT * FROM ${qid(DB.APP)}.coaching_content ORDER BY 1 DESC LIMIT 50`;
  const result = await runReadOnly(sql, playlists, (rows) => rows.length ? rows.map((row) => ({
    name: row.content_title || row.name || "Coaching playlist",
    calls: Number(row.call_count || row.calls || 0),
    owner: row.owner_role || row.owner || "Training",
    completionRate: Number(row.completion_rate || row.completionRate || 0),
    targetAudience: row.target_audience || row.targetAudience || "Assigned learners"
  })) : playlists);
  res.json({ success: true, generatedAt: new Date().toISOString(), ...result });
}));

router.get("/readiness", (_req, res) => {
  res.json({
    success: true,
    data: [
      { check: "Best call DB binding", status: "PARTIAL", detail: "Best calls endpoint attempts DB first, then fallback." },
      { check: "Coaching content binding", status: "PARTIAL", detail: "Playlists endpoint attempts DB first, then fallback." },
      { check: "Assignment flow", status: "NEXT", detail: "Assignment endpoint still pending." }
    ]
  });
});

export default router;

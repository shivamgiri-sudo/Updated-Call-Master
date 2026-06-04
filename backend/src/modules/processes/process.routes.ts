import { Router } from "express";
import { DB, pool, qid } from "../../config/db";
import { asyncHandler } from "../../middleware/asyncHandler";

const router = Router();

router.get("/", asyncHandler(async (_req, res) => {
  const sql = `
    SELECT
      process_id,
      process_code,
      process_name,
      process_type
    FROM ${qid(DB.APP)}.ci_process_master
    ORDER BY process_type, process_name
  `;

  const [rows] = await pool.query(sql);
  res.json({ success: true, data: rows });
}));

router.get("/:processCode/summary", asyncHandler(async (req, res) => {
  const { processCode } = req.params;

  const sql = `
    SELECT
      summary_date,
      process_id,
      process_code,
      process_name,
      process_type,
      total_calls,
      agent_count,
      transcript_available,
      ai_audit_completed,
      manual_audit_completed,
      avg_quality_score,
      fatal_count,
      escalation_count,
      coaching_trigger_count
    FROM ${qid(DB.APP)}.cm_process_daily_summary
    WHERE process_code = ?
    ORDER BY summary_date DESC
    LIMIT 30
  `;

  const [rows] = await pool.query(sql, [processCode]);
  res.json({ success: true, processCode, data: rows });
}));

export default router;

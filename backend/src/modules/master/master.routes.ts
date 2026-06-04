import { Router } from "express";
import { DB, pool, qid } from "../../config/db";
import { asyncHandler } from "../../middleware/asyncHandler";

const router = Router();

router.get("/summary", asyncHandler(async (req, res) => {
  const date = req.query.date as string | undefined;

  const whereSql = date
    ? "WHERE summary_date = ?"
    : `WHERE summary_date = (
        SELECT MAX(summary_date)
        FROM ${qid(DB.APP)}.cm_process_daily_summary
      )`;

  const params = date ? [date] : [];

  const sql = `
    SELECT
      COUNT(DISTINCT process_id) AS total_processes,
      SUM(total_calls) AS total_calls,
      SUM(agent_count) AS total_agents,
      SUM(transcript_available) AS transcript_available,
      SUM(ai_audit_completed) AS ai_audit_completed,
      SUM(manual_audit_completed) AS manual_audit_completed,
      ROUND(AVG(avg_quality_score), 2) AS avg_quality_score,
      SUM(fatal_count) AS fatal_count,
      SUM(escalation_count) AS escalation_count,
      SUM(coaching_trigger_count) AS coaching_trigger_count
    FROM ${qid(DB.APP)}.cm_process_daily_summary
    ${whereSql}
  `;

  const [rows]: any = await pool.query(sql, params);
  res.json({ success: true, data: rows?.[0] || {} });
}));

router.get("/process-performance", asyncHandler(async (req, res) => {
  const date = req.query.date as string | undefined;

  const whereSql = date
    ? "WHERE summary_date = ?"
    : `WHERE summary_date = (
        SELECT MAX(summary_date)
        FROM ${qid(DB.APP)}.cm_process_daily_summary
      )`;

  const params = date ? [date] : [];

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
    ${whereSql}
    ORDER BY total_calls DESC
  `;

  const [rows] = await pool.query(sql, params);
  res.json({ success: true, data: rows });
}));

router.get("/day-wise-audits", asyncHandler(async (_req, res) => {
  const sql = `
    SELECT
      summary_date,
      SUM(total_calls) AS total_calls,
      SUM(agent_count) AS agent_count,
      SUM(transcript_available) AS transcript_available,
      SUM(ai_audit_completed) AS ai_audit_completed,
      SUM(manual_audit_completed) AS manual_audit_completed
    FROM ${qid(DB.APP)}.cm_process_daily_summary
    GROUP BY summary_date
    ORDER BY summary_date DESC
    LIMIT 30
  `;

  const [rows] = await pool.query(sql);
  res.json({ success: true, data: rows });
}));

router.post("/refresh-summary", asyncHandler(async (_req, res) => {
  const sql = `
    REPLACE INTO ${qid(DB.APP)}.cm_process_daily_summary (
      summary_date,
      process_id,
      process_code,
      process_name,
      process_type,
      total_calls,
      agent_count,
      transcript_available,
      ai_audit_completed,
      manual_audit_completed
    )
    SELECT
      cm.call_date AS summary_date,
      cm.process_id,
      pm.process_code,
      pm.process_name,
      pm.process_type,
      COUNT(*) AS total_calls,
      COUNT(DISTINCT cm.source_agent_name) AS agent_count,
      SUM(CASE WHEN cm.transcript_status = 'AVAILABLE' THEN 1 ELSE 0 END) AS transcript_available,
      SUM(CASE WHEN cm.ai_audit_status = 'COMPLETED' THEN 1 ELSE 0 END) AS ai_audit_completed,
      SUM(CASE WHEN cm.manual_audit_status = 'COMPLETED' THEN 1 ELSE 0 END) AS manual_audit_completed
    FROM ${qid(DB.APP)}.ci_call_master cm
    LEFT JOIN ${qid(DB.APP)}.ci_process_master pm
      ON cm.process_id = pm.process_id
    WHERE cm.call_date IS NOT NULL
    GROUP BY
      cm.call_date,
      cm.process_id,
      pm.process_code,
      pm.process_name,
      pm.process_type
  `;

  const [result]: any = await pool.query(sql);
  res.json({
    success: true,
    message: "Summary table refreshed",
    rows_affected: result.affectedRows,
  });
}));

export default router;

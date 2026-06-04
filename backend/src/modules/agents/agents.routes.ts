import { Router } from "express";
import { DB, pool, qid } from "../../config/db";
import { asyncHandler } from "../../middleware/asyncHandler";

const router = Router();

router.get("/summary", asyncHandler(async (req, res) => {
  const processCode = req.query.processCode as string | undefined;

  const params: any[] = [];
  let whereSql = "";

  if (processCode) {
    whereSql = "WHERE pm.process_code = ?";
    params.push(processCode);
  }

  const sql = `
    SELECT
      cm.source_agent_name,
      COUNT(*) AS total_calls,
      COUNT(DISTINCT cm.call_date) AS active_days,
      SUM(CASE WHEN cm.transcript_status = 'AVAILABLE' THEN 1 ELSE 0 END) AS transcript_available,
      SUM(CASE WHEN cm.ai_audit_status = 'COMPLETED' THEN 1 ELSE 0 END) AS ai_audit_completed,
      SUM(CASE WHEN cm.manual_audit_status = 'COMPLETED' THEN 1 ELSE 0 END) AS manual_audit_completed,
      MIN(cm.call_date) AS first_call_date,
      MAX(cm.call_date) AS last_call_date
    FROM ${qid(DB.APP)}.ci_call_master cm
    LEFT JOIN ${qid(DB.APP)}.ci_process_master pm
      ON cm.process_id = pm.process_id
    ${whereSql}
    GROUP BY cm.source_agent_name
    ORDER BY total_calls DESC
    LIMIT 100
  `;

  const [rows] = await pool.query(sql, params);
  res.json({ success: true, data: rows });
}));

router.get("/:agentName/calls", asyncHandler(async (req, res) => {
  const { agentName } = req.params;
  const processCode = req.query.processCode as string | undefined;

  const params: any[] = [agentName];
  let whereSql = "WHERE cm.source_agent_name = ?";

  if (processCode) {
    whereSql += " AND pm.process_code = ?";
    params.push(processCode);
  }

  const sql = `
    SELECT
      cm.call_id,
      cm.source_call_id,
      cm.process_id,
      pm.process_code,
      pm.process_name,
      cm.source_agent_name,
      cm.lead_id,
      cm.call_datetime,
      cm.call_date,
      cm.duration_sec,
      cm.transcript_status,
      cm.ai_audit_status,
      cm.manual_audit_status,
      cm.final_audit_status
    FROM ${qid(DB.APP)}.ci_call_master cm
    LEFT JOIN ${qid(DB.APP)}.ci_process_master pm
      ON cm.process_id = pm.process_id
    ${whereSql}
    ORDER BY cm.call_id DESC
    LIMIT 100
  `;

  const [rows] = await pool.query(sql, params);
  res.json({ success: true, agentName, processCode, data: rows });
}));

export default router;

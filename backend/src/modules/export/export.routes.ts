import { Router } from "express";
import { DB, pool, qid } from "../../config/db";
import { asyncHandler } from "../../middleware/asyncHandler";

const router = Router();

function toCsv(rows: any[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = row[h];
        if (val == null) return "";
        const str = String(val).replace(/"/g, '""');
        return str.includes(",") || str.includes("\n") ? `"${str}"` : str;
      }).join(",")
    ),
  ];
  return csvRows.join("\n");
}

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

  const [rows]: any = await pool.query(sql, params);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=process-performance.csv");
  res.send(toCsv(rows));
}));

router.get("/agents", asyncHandler(async (req, res) => {
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
    LIMIT 200
  `;

  const [rows]: any = await pool.query(sql, params);
  const filename = processCode ? `agents-${processCode}.csv` : "agents-all.csv";
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
  res.send(toCsv(rows));
}));

router.get("/calls", asyncHandler(async (req, res) => {
  const processCode = req.query.processCode as string | undefined;

  const params: any[] = [];
  let whereSql = "";

  if (processCode) {
    whereSql = "WHERE pm.process_code = ?";
    params.push(processCode);
  }

  const sql = `
    SELECT
      cm.call_id,
      cm.source_call_id,
      pm.process_code,
      pm.process_name,
      pm.process_type,
      cm.source_agent_name,
      cm.lead_id,
      cm.call_direction,
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
    LIMIT 500
  `;

  const [rows]: any = await pool.query(sql, params);
  const filename = processCode ? `calls-${processCode}.csv` : "calls-all.csv";
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
  res.send(toCsv(rows));
}));

router.get("/outbound-objections", asyncHandler(async (req, res) => {
  const processCode = req.query.processCode as string;

  if (!processCode) {
    return res.status(400).json({ success: false, message: "processCode required" });
  }

  const clientIdSql = `
    SELECT DISTINCT cm.client_id
    FROM ${qid(DB.APP)}.ci_call_master cm
    JOIN ${qid(DB.APP)}.ci_process_master pm
      ON cm.process_id = pm.process_id
    WHERE pm.process_code = ?
      AND cm.client_id IS NOT NULL
    LIMIT 1
  `;

  const [clientRows]: any = await pool.query(clientIdSql, [processCode]);
  const clientId = clientRows?.[0]?.client_id;

  if (!clientId) {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=objections-${processCode}.csv`);
    return res.send("CustomerObjectionCategory,CustomerObjectionSubCategory,total_calls,sale_done_count,conversion_percent\n");
  }

  const sql = `
    SELECT
      CustomerObjectionCategory,
      CustomerObjectionSubCategory,
      COUNT(*) AS total_calls,
      SUM(CASE WHEN LOWER(TRIM(SaleDone)) = 'yes' THEN 1 ELSE 0 END) AS sale_done_count,
      ROUND(100 * SUM(CASE WHEN LOWER(TRIM(SaleDone)) = 'yes' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) AS conversion_percent
    FROM ${qid(DB.EXTERNAL)}.CallDetails
    WHERE client_id = ?
      AND CustomerObjectionCategory IS NOT NULL
      AND TRIM(CustomerObjectionCategory) <> ''
    GROUP BY CustomerObjectionCategory, CustomerObjectionSubCategory
    ORDER BY total_calls DESC
    LIMIT 100
  `;

  const [rows]: any = await pool.query(sql, [clientId]);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=objections-${processCode}.csv`);
  res.send(toCsv(rows));
}));

export default router;

import { Router } from "express";
import { DB, pool, qid } from "../../config/db";
import { asyncHandler } from "../../middleware/asyncHandler";
import type { AuthRequest } from "../../middleware/auth";

const router = Router();

router.get("/", asyncHandler(async (req: AuthRequest, res) => {
  const processCode = req.query.processCode as string | undefined;
  const status = req.query.status as string | undefined;

  const params: any[] = [];
  const conditions: string[] = [];

  if (processCode) {
    conditions.push("process_code = ?");
    params.push(processCode);
  }

  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }

  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT
      action_id,
      trigger_id,
      call_id,
      process_code,
      employee_code,
      action_type,
      owner_role,
      owner_name,
      priority,
      due_at,
      status,
      remarks,
      created_at,
      closed_at,
      CASE WHEN due_at < NOW() AND status != 'CLOSED' THEN 1 ELSE 0 END as is_overdue
    FROM ${qid(DB.APP)}.cm_governance_action
    ${whereSql}
    ORDER BY
      CASE WHEN status = 'OPEN' THEN 1 WHEN status = 'IN_PROGRESS' THEN 2 ELSE 3 END,
      due_at ASC
    LIMIT 200
  `;

  const [rows] = await pool.query(sql, params);
  res.json({ success: true, data: rows });
}));

router.post("/action", asyncHandler(async (req: AuthRequest, res) => {
  const {
    trigger_id,
    call_id,
    process_code,
    employee_code,
    action_type,
    owner_role,
    owner_name,
    priority,
    due_at,
    remarks,
  } = req.body;

  if (!action_type || !owner_role) {
    return res.status(400).json({
      success: false,
      message: "action_type and owner_role are required",
    });
  }

  const sql = `
    INSERT INTO ${qid(DB.APP)}.cm_governance_action
      (trigger_id, call_id, process_code, employee_code, action_type, owner_role, owner_name, priority, due_at, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result]: any = await pool.query(sql, [
    trigger_id || null,
    call_id || null,
    process_code || null,
    employee_code || null,
    action_type,
    owner_role,
    owner_name || null,
    priority || "MEDIUM",
    due_at || null,
    remarks || null,
  ]);

  res.status(201).json({
    success: true,
    action_id: result.insertId,
    message: "Governance action created",
  });
}));

router.patch("/:actionId/status", asyncHandler(async (req: AuthRequest, res) => {
  const { actionId } = req.params;
  const { status } = req.body;

  if (!["OPEN", "IN_PROGRESS", "CLOSED"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  const closed_at = status === "CLOSED" ? "NOW()" : "NULL";

  const sql = `
    UPDATE ${qid(DB.APP)}.cm_governance_action
    SET status = ?, closed_at = ${closed_at}
    WHERE action_id = ?
  `;

  await pool.query(sql, [status, actionId]);
  res.json({ success: true, message: "Status updated" });
}));

router.get("/stats", asyncHandler(async (req: AuthRequest, res) => {
  const processCode = req.query.processCode as string | undefined;

  const whereClause = processCode ? "WHERE process_code = ?" : "";
  const params = processCode ? [processCode, processCode, processCode, processCode] : [];

  const sql = `
    SELECT
      COUNT(CASE WHEN status = 'OPEN' THEN 1 END) as open_count,
      COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as closed_count,
      COUNT(CASE WHEN due_at < NOW() AND status != 'CLOSED' THEN 1 END) as overdue_count,
      COUNT(*) as total_count
    FROM ${qid(DB.APP)}.cm_governance_action
    ${whereClause}
  `;

  const [rows]: any = await pool.query(sql, params);
  res.json({ success: true, data: rows?.[0] || {} });
}));

export default router;

import { Router } from "express";
import { DB, pool, qid } from "../../config/db";
import { asyncHandler } from "../../middleware/asyncHandler";
import type { AuthRequest } from "../../middleware/auth";

const router = Router();

router.post("/trigger", asyncHandler(async (req: AuthRequest, res) => {
  const { call_id, employee_code, process_code, coaching_topic, priority, remarks } = req.body;

  if (!call_id || !employee_code || !coaching_topic) {
    return res.status(400).json({
      success: false,
      message: "call_id, employee_code, and coaching_topic are required",
    });
  }

  const triggered_by_user_id = req.user?.user_id || null;

  const sql = `
    INSERT INTO ${qid(DB.APP)}.cm_coaching_trigger
      (call_id, employee_code, process_code, coaching_topic, priority, remarks, triggered_by_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const [result]: any = await pool.query(sql, [
    call_id,
    employee_code,
    process_code || null,
    coaching_topic,
    priority || "MEDIUM",
    remarks || null,
    triggered_by_user_id,
  ]);

  const trigger_id = result.insertId;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 2);

  const govSql = `
    INSERT INTO ${qid(DB.APP)}.cm_governance_action
      (trigger_id, call_id, process_code, employee_code, action_type, owner_role, priority, due_at, remarks)
    VALUES (?, ?, ?, ?, 'COACHING_FOLLOWUP', 'TRAINER', ?, ?, ?)
  `;

  await pool.query(govSql, [
    trigger_id,
    call_id,
    process_code || null,
    employee_code,
    priority || "MEDIUM",
    dueDate,
    `Auto-created from coaching trigger: ${coaching_topic}`,
  ]);

  res.status(201).json({
    success: true,
    trigger_id,
    message: "Coaching trigger and governance action created",
  });
}));

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
      trigger_id,
      call_id,
      employee_code,
      process_code,
      coaching_topic,
      priority,
      remarks,
      status,
      triggered_at,
      completed_at
    FROM ${qid(DB.APP)}.cm_coaching_trigger
    ${whereSql}
    ORDER BY triggered_at DESC
    LIMIT 100
  `;

  const [rows] = await pool.query(sql, params);
  res.json({ success: true, data: rows });
}));

router.patch("/:triggerId/status", asyncHandler(async (req: AuthRequest, res) => {
  const { triggerId } = req.params;
  const { status } = req.body;

  if (!["PENDING", "ASSIGNED", "COMPLETED"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  const sql = `
    UPDATE ${qid(DB.APP)}.cm_coaching_trigger
    SET status = ?, completed_at = IF(? = 'COMPLETED', NOW(), NULL)
    WHERE trigger_id = ?
  `;

  await pool.query(sql, [status, status, Number(triggerId)]);
  res.json({ success: true, message: "Status updated" });
}));

export default router;

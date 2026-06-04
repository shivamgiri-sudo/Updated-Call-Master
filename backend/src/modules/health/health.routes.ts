import { Router } from "express";
import { DB, pool, qid } from "../../config/db";
import { asyncHandler } from "../../middleware/asyncHandler";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ success: true, status: "ok" });
});

router.get("/db", asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(`SELECT DATABASE() AS selected_database, NOW() AS server_time`);
  const [appRows] = await pool.query(`SELECT COUNT(*) AS total_processes FROM ${qid(DB.APP)}.ci_process_master`);
  res.json({ success: true, db: rows, app: appRows });
}));

router.get("/readiness", asyncHandler(async (_req, res) => {
  const checks: any = {
    db_connected: false,
    backend_running: true,
    auth_mode: process.env.AUTH_MODE || "dev",
    total_processes: 0,
    total_calls: 0,
    summary_last_refresh: null,
    coaching_triggers: 0,
    governance_actions: 0,
  };

  try {
    await pool.query("SELECT 1");
    checks.db_connected = true;

    const [procRows]: any = await pool.query(`SELECT COUNT(*) as count FROM ${qid(DB.APP)}.ci_process_master`);
    checks.total_processes = procRows?.[0]?.count || 0;

    const [callRows]: any = await pool.query(`SELECT COUNT(*) as count FROM ${qid(DB.APP)}.ci_call_master`);
    checks.total_calls = callRows?.[0]?.count || 0;

    const [summaryRows]: any = await pool.query(`SELECT MAX(updated_at) as last_refresh FROM ${qid(DB.APP)}.cm_process_daily_summary`);
    checks.summary_last_refresh = summaryRows?.[0]?.last_refresh || null;

    const [coachingRows]: any = await pool.query(`SELECT COUNT(*) as count FROM ${qid(DB.APP)}.cm_coaching_trigger`);
    checks.coaching_triggers = coachingRows?.[0]?.count || 0;

    const [govRows]: any = await pool.query(`SELECT COUNT(*) as count FROM ${qid(DB.APP)}.cm_governance_action`);
    checks.governance_actions = govRows?.[0]?.count || 0;
  } catch (err) {
    checks.db_connected = false;
  }

  res.json({ success: true, readiness: checks });
}));

export default router;

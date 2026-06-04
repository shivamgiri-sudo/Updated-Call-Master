import { Router } from "express";
import { DB, pool, qid } from "../../config/db";
import { asyncHandler } from "../../middleware/asyncHandler";

const router = Router();

async function getClientIdFromProcess(processCode: string): Promise<number | null> {
  const sql = `
    SELECT DISTINCT cm.client_id
    FROM ${qid(DB.APP)}.ci_call_master cm
    JOIN ${qid(DB.APP)}.ci_process_master pm
      ON cm.process_id = pm.process_id
    WHERE pm.process_code = ?
      AND cm.client_id IS NOT NULL
    LIMIT 1
  `;

  const [rows]: any = await pool.query(sql, [processCode]);
  return rows?.[0]?.client_id ?? null;
}

router.get("/:processCode/quality", asyncHandler(async (req, res) => {
  const { processCode } = req.params;
  const date = req.query.date as string | undefined;

  const clientId = await getClientIdFromProcess(processCode);

  if (!clientId) {
    return res.json({
      success: true,
      processCode,
      data: {
        audit_count: 0,
        cq_score: 0,
        sensitive_word_count: 0,
        policy_failure_count: 0,
      },
    });
  }

  const params: any[] = [clientId];
  let dateSql = "";

  if (date) {
    dateSql = "AND DATE(CallDate) = ?";
    params.push(date);
  }

  const sql = `
    SELECT
      COUNT(*) AS audit_count,
      ROUND(AVG(quality_percentage), 2) AS cq_score,

      SUM(CASE
        WHEN sensetive_word IS NOT NULL
         AND LOWER(TRIM(sensetive_word)) NOT IN ('', 'no', 'none', 'null', 'n/a')
        THEN 1 ELSE 0
      END) AS sensitive_word_count,

      SUM(CASE
        WHEN LOWER(TRIM(policy_communication_failure)) = 'yes'
        THEN 1 ELSE 0
      END) AS policy_failure_count

    FROM ${qid(DB.AUDIT)}.call_quality_assessment
    WHERE ClientId = ?
    ${dateSql}
  `;

  const [rows]: any = await pool.query(sql, params);
  res.json({ success: true, processCode, clientId, data: rows?.[0] || {} });
}));

export default router;

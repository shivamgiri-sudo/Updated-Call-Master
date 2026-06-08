import { Router } from "express";
import { DB, pool, qid } from "../../config/db";
import { asyncHandler } from "../../middleware/asyncHandler";

const router = Router();

type QueryRows = any[];

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

async function safeQuery<T>(sql: string, params: any[], fallback: T): Promise<T> {
  try {
    const [rows]: any = await pool.query(sql, params);
    return rows as T;
  } catch (err) {
    console.warn("Inbound Looker parity partial query skipped:", err instanceof Error ? err.message : err);
    return fallback;
  }
}

function getDateFilter(date: string | undefined, params: any[]): string {
  if (!date) return "";
  params.push(date);
  return "AND DATE(CallDate) = ?";
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
        fatal_count: 0,
        sensitive_word_count: 0,
        policy_failure_count: 0,
      },
    });
  }

  const params: any[] = [clientId];
  const dateSql = getDateFilter(date, params);

  const sql = `
    SELECT
      COUNT(*) AS audit_count,
      ROUND(AVG(quality_percentage), 2) AS cq_score,
      SUM(CASE WHEN COALESCE(fatal_count, 0) > 0 THEN 1 ELSE 0 END) AS fatal_count,
      SUM(CASE
        WHEN sensetive_word IS NOT NULL
         AND LOWER(TRIM(CAST(sensetive_word AS CHAR))) NOT IN ('', 'no', 'none', 'null', 'n/a', 'na')
        THEN 1 ELSE 0
      END) AS sensitive_word_count,
      SUM(CASE
        WHEN LOWER(TRIM(CAST(policy_communication_failure AS CHAR))) IN ('yes', 'y', 'true', '1')
        THEN 1 ELSE 0
      END) AS policy_failure_count
    FROM ${qid(DB.AUDIT)}.call_quality_assessment
    WHERE ClientId = ?
    ${dateSql}
  `;

  const [rows]: any = await pool.query(sql, params);
  res.json({ success: true, processCode, clientId, data: rows?.[0] || {} });
}));

router.get("/:processCode/looker-parity", asyncHandler(async (req, res) => {
  const { processCode } = req.params;
  const date = req.query.date as string | undefined;
  const clientId = await getClientIdFromProcess(processCode);

  if (!clientId) {
    return res.json({
      success: true,
      processCode,
      clientId: null,
      data: {
        kpis: { audit_count: 0, cq_score: 0, fatal_count: 0, fatal_percent: 0, target_cq: 85, sensitive_word_count: 0, policy_failure_count: 0 },
        score_breakdown: [],
        agent_rank: [],
        raw_audits: [],
      },
    });
  }

  const baseParams: any[] = [clientId];
  const dateSql = getDateFilter(date, baseParams);

  const kpiRows = await safeQuery<QueryRows>(`
    SELECT
      COUNT(*) AS audit_count,
      ROUND(AVG(quality_percentage), 2) AS cq_score,
      SUM(CASE WHEN COALESCE(fatal_count, 0) > 0 THEN 1 ELSE 0 END) AS fatal_count,
      SUM(CASE
        WHEN sensetive_word IS NOT NULL
         AND LOWER(TRIM(CAST(sensetive_word AS CHAR))) NOT IN ('', 'no', 'none', 'null', 'n/a', 'na')
        THEN 1 ELSE 0
      END) AS sensitive_word_count,
      SUM(CASE
        WHEN LOWER(TRIM(CAST(policy_communication_failure AS CHAR))) IN ('yes', 'y', 'true', '1')
        THEN 1 ELSE 0
      END) AS policy_failure_count
    FROM ${qid(DB.AUDIT)}.call_quality_assessment
    WHERE ClientId = ?
    ${dateSql}
  `, baseParams, []);

  const rawKpis = kpiRows?.[0] || {};
  const auditCount = Number(rawKpis.audit_count || 0);
  const fatalCount = Number(rawKpis.fatal_count || 0);
  const kpis = {
    audit_count: auditCount,
    cq_score: Number(rawKpis.cq_score || 0),
    fatal_count: fatalCount,
    fatal_percent: auditCount > 0 ? Number(((fatalCount / auditCount) * 100).toFixed(2)) : 0,
    target_cq: 85,
    sensitive_word_count: Number(rawKpis.sensitive_word_count || 0),
    policy_failure_count: Number(rawKpis.policy_failure_count || 0),
  };

  const scoreRows = await safeQuery<QueryRows>(`
    SELECT
      ROUND(AVG(opening_score), 2) AS opening_score,
      ROUND(AVG(soft_skill_score), 2) AS soft_skill_score,
      ROUND(AVG(hold_procedure_score), 2) AS hold_procedure_score,
      ROUND(AVG(resolution_score), 2) AS resolution_score,
      ROUND(AVG(closing_score), 2) AS closing_score
    FROM ${qid(DB.AUDIT)}.call_quality_assessment
    WHERE ClientId = ?
    ${dateSql}
  `, baseParams, []);

  const score = scoreRows?.[0] || {};
  const score_breakdown = [
    { code: "opening_score", label: "Opening Score", column: "opening_score", score: score.opening_score },
    { code: "soft_skill_score", label: "Soft Skill Score", column: "soft_skill_score", score: score.soft_skill_score },
    { code: "hold_procedure_score", label: "Hold Procedure Score", column: "hold_procedure_score", score: score.hold_procedure_score },
    { code: "resolution_score", label: "Resolution Score", column: "resolution_score", score: score.resolution_score },
    { code: "closing_score", label: "Closing Score", column: "closing_score", score: score.closing_score },
  ].filter((item) => item.score !== null && item.score !== undefined);

  const agentRank = await safeQuery<QueryRows>(`
    SELECT
      AgentName AS agent_name,
      COUNT(*) AS audit_count,
      ROUND(AVG(quality_percentage), 2) AS cq_score,
      SUM(CASE WHEN COALESCE(fatal_count, 0) > 0 THEN 1 ELSE 0 END) AS fatal_count,
      SUM(CASE WHEN LOWER(TRIM(CAST(policy_communication_failure AS CHAR))) IN ('yes', 'y', 'true', '1') THEN 1 ELSE 0 END) AS policy_failure_count,
      SUM(CASE WHEN sensetive_word IS NOT NULL AND LOWER(TRIM(CAST(sensetive_word AS CHAR))) NOT IN ('', 'no', 'none', 'null', 'n/a', 'na') THEN 1 ELSE 0 END) AS sensitive_word_count
    FROM ${qid(DB.AUDIT)}.call_quality_assessment
    WHERE ClientId = ?
    ${dateSql}
    GROUP BY AgentName
    ORDER BY cq_score ASC, fatal_count DESC, policy_failure_count DESC
    LIMIT 25
  `, baseParams, []);

  const rawAudits = await safeQuery<QueryRows>(`
    SELECT
      id,
      CallDate,
      AgentName,
      LeadID,
      quality_percentage,
      fatal_count,
      sensetive_word,
      policy_communication_failure
    FROM ${qid(DB.AUDIT)}.call_quality_assessment
    WHERE ClientId = ?
    ${dateSql}
    ORDER BY CallDate DESC, id DESC
    LIMIT 50
  `, baseParams, []);

  res.json({
    success: true,
    processCode,
    clientId,
    data: {
      kpis,
      score_breakdown,
      agent_rank: agentRank,
      raw_audits: rawAudits,
    },
  });
}));

export default router;

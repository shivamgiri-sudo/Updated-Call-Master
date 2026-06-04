import { Router } from "express";
import { DB, pool, qid } from "../../config/db";
import { asyncHandler } from "../../middleware/asyncHandler";
import { limitSafe } from "../../utils/sql";

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
  const processCode = req.query.processCode as string | undefined;
  const limit = limitSafe(req.query.limit, 50, 200);

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
      cm.source_db,
      cm.source_table,
      cm.client_id,
      cm.process_id,
      pm.process_code,
      pm.process_name,
      pm.process_type,
      cm.source_agent_name,
      cm.lead_id,
      cm.call_direction,
      cm.call_datetime,
      cm.call_date,
      cm.duration_sec,
      cm.mobile_masked,
      cm.transcript_status,
      cm.ai_audit_status,
      cm.manual_audit_status,
      cm.final_audit_status
    FROM ${qid(DB.APP)}.ci_call_master cm
    LEFT JOIN ${qid(DB.APP)}.ci_process_master pm
      ON cm.process_id = pm.process_id
    ${whereSql}
    ORDER BY cm.call_id DESC
    LIMIT ${limit}
  `;

  const [rows] = await pool.query(sql, params);
  res.json({ success: true, data: rows });
}));

router.get("/:callId/audit360", asyncHandler(async (req, res) => {
  const callId = Number(req.params.callId);

  const sql = `
    SELECT
      cm.call_id,
      cm.source_call_id,
      cm.source_db,
      cm.source_table,
      cm.client_id,
      cm.process_id,
      pm.process_code,
      pm.process_name,
      pm.process_type,
      cm.source_agent_name,
      cm.lead_id,
      cm.call_direction,
      cm.call_datetime,
      cm.call_date,
      cm.duration_sec,
      cm.mobile_masked,
      cm.transcript_status,
      cm.ai_audit_status,
      cm.manual_audit_status,
      cm.final_audit_status,

      ct.transcript_id,
      ct.language_code,
      ct.recording_url_ref,
      ct.pii_masking_status,
      LEFT(ct.transcript_text, 5000) AS transcript_preview,

      ai.ai_audit_id,
      ai.processing_status,
      ai.schema_validation_status,
      ai.review_required_flag,
      ai.total_score AS ai_total_score,
      ai.max_score AS ai_max_score,
      ai.quality_percent AS ai_quality_percent,
      ai.quality_band AS ai_quality_band,
      ai.call_disposition,
      ai.risk_level,
      ai.sale_done_flag,
      LEFT(ai.feedback_summary, 1000) AS feedback_summary,
      LEFT(ai.area_for_improvement, 1000) AS area_for_improvement

    FROM ${qid(DB.APP)}.ci_call_master cm
    LEFT JOIN ${qid(DB.APP)}.ci_process_master pm
      ON cm.process_id = pm.process_id
    LEFT JOIN ${qid(DB.APP)}.ci_call_transcript ct
      ON cm.call_id = ct.call_id
     AND ct.is_current = 1
    LEFT JOIN ${qid(DB.APP)}.ci_ai_audit_result ai
      ON cm.call_id = ai.call_id
    WHERE cm.call_id = ?
    LIMIT 1
  `;

  const [rows]: any = await pool.query(sql, [callId]);
  const base = rows?.[0] || null;

  if (!base) {
    return res.json({ success: true, data: null });
  }

  if (base.source_db === "db_external" && base.source_table === "CallDetails" && base.source_call_id) {
    const extSql = `
      SELECT
        Opening,
        Offered,
        ObjectionHandling,
        PrepaidPitch,
        UpsellingEfforts,
        OfferUrgency,
        SaleDone,
        CallDisposition AS ext_call_disposition,
        CustomerObjectionCategory,
        CustomerObjectionSubCategory,
        AgentRebuttalCategory,
        AgentRebuttalSubCategory,
        ProductOffering,
        DiscountType,
        AreaForImprovement AS ext_area_for_improvement
      FROM ${qid(DB.EXTERNAL)}.CallDetails
      WHERE id = ?
      LIMIT 1
    `;

    const [extRows]: any = await pool.query(extSql, [base.source_call_id]);
    const ext = extRows?.[0] || {};

    return res.json({ success: true, data: { ...base, outbound_fields: ext } });
  }

  res.json({ success: true, data: base });
}));

export default router;

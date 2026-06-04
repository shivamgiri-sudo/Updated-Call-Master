import { Router } from "express";
import { DB, pool, qid } from "../../config/db";
import { asyncHandler } from "../../middleware/asyncHandler";
import { limitSafe, yesNoFlag } from "../../utils/sql";

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

router.get("/:processCode/funnel", asyncHandler(async (req, res) => {
  const { processCode } = req.params;
  const date = req.query.date as string | undefined;

  const clientId = await getClientIdFromProcess(processCode);

  if (!clientId) {
    return res.json({ success: true, processCode, data: {} });
  }

  const params: any[] = [clientId];
  let dateSql = "";

  if (date) {
    dateSql = "AND DATE(CallDate) = ?";
    params.push(date);
  }

  const sql = `
    SELECT
      COUNT(*) AS total_calls,
      SUM(${yesNoFlag("SaleDone")}) AS sale_done_count,
      SUM(${yesNoFlag("Opening")}) AS opening_done_count,
      SUM(${yesNoFlag("Offered")}) AS offered_count,
      SUM(${yesNoFlag("ObjectionHandling")}) AS objection_handled_count,
      SUM(${yesNoFlag("PrepaidPitch")}) AS prepaid_pitch_count,
      SUM(${yesNoFlag("UpsellingEfforts")}) AS upselling_count,
      SUM(${yesNoFlag("OfferUrgency")}) AS offer_urgency_count
    FROM ${qid(DB.EXTERNAL)}.CallDetails
    WHERE client_id = ?
    ${dateSql}
  `;

  const [rows]: any = await pool.query(sql, params);
  const data = rows?.[0] || {};

  const total = Number(data.total_calls || 0);
  const sale = Number(data.sale_done_count || 0);
  const offered = Number(data.offered_count || 0);

  res.json({
    success: true,
    processCode,
    clientId,
    data: {
      ...data,
      conversion_percent: total ? Number(((sale / total) * 100).toFixed(2)) : 0,
      offer_conversion_percent: offered ? Number(((sale / offered) * 100).toFixed(2)) : 0,
    },
  });
}));

router.get("/:processCode/recent-calls", asyncHandler(async (req, res) => {
  const { processCode } = req.params;
  const limit = limitSafe(req.query.limit, 50, 200);
  const clientId = await getClientIdFromProcess(processCode);

  if (!clientId) {
    return res.json({ success: true, processCode, data: [] });
  }

  const sql = `
    SELECT
      id,
      client_id,
      CallDate,
      AgentName,
      LeadID,
      MobileNo,
      Opening,
      Offered,
      ObjectionHandling,
      PrepaidPitch,
      UpsellingEfforts,
      OfferUrgency,
      SaleDone,
      CallDisposition,
      CustomerObjectionCategory,
      CustomerObjectionSubCategory,
      AgentRebuttalCategory,
      AgentRebuttalSubCategory,
      ProductOffering,
      DiscountType,
      AreaForImprovement,
      LEFT(TranscribeText, 500) AS transcript_preview
    FROM ${qid(DB.EXTERNAL)}.CallDetails
    WHERE client_id = ?
    ORDER BY CallDate DESC
    LIMIT ${limit}
  `;

  const [rows] = await pool.query(sql, [clientId]);
  res.json({ success: true, processCode, clientId, data: rows });
}));

router.get("/:processCode/objections", asyncHandler(async (req, res) => {
  const { processCode } = req.params;
  const clientId = await getClientIdFromProcess(processCode);

  if (!clientId) {
    return res.json({ success: true, processCode, data: [] });
  }

  const sql = `
    SELECT
      CustomerObjectionCategory,
      CustomerObjectionSubCategory,
      COUNT(*) AS total_calls,
      SUM(${yesNoFlag("SaleDone")}) AS sale_done_count,
      ROUND(100 * SUM(${yesNoFlag("SaleDone")}) / NULLIF(COUNT(*), 0), 2) AS conversion_percent
    FROM ${qid(DB.EXTERNAL)}.CallDetails
    WHERE client_id = ?
      AND CustomerObjectionCategory IS NOT NULL
      AND TRIM(CustomerObjectionCategory) <> ''
    GROUP BY CustomerObjectionCategory, CustomerObjectionSubCategory
    ORDER BY total_calls DESC
    LIMIT 50
  `;

  const [rows] = await pool.query(sql, [clientId]);
  res.json({ success: true, processCode, clientId, data: rows });
}));

export default router;

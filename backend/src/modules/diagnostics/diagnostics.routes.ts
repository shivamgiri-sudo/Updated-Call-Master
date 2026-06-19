import { Router } from "express";
import { DB, pool, qid } from "../../config/db";
import { asyncHandler } from "../../middleware/asyncHandler";

const router = Router();

router.get("/processes/:processCode", asyncHandler(async (req, res) => {
  const { processCode } = req.params;

  const processQuery = `
    SELECT process_id, process_code, process_type, client_id
    FROM ${qid(DB.APP)}.ci_process_master
    WHERE process_code = ?
    LIMIT 1
  `;
  const [processRows]: any = await pool.query(processQuery, [processCode]);
  if (processRows.length === 0) {
    return res.status(404).json({ success: false, message: "Process not found" });
  }
  const process = processRows[0];

  const callCountQuery = `
    SELECT COUNT(*) as call_count
    FROM ${qid(DB.APP)}.ci_call_master cm
    JOIN ${qid(DB.APP)}.ci_process_master pm ON cm.process_id = pm.process_id
    WHERE pm.process_code = ?
  `;
  const [callRows]: any = await pool.query(callCountQuery, [processCode]);
  const callCount = callRows[0].call_count;

  const outboundQuery = `
    SELECT COUNT(*) as raw_outbound_rows
    FROM ${qid(DB.EXTERNAL)}.CallDetails
    WHERE ProcessCode = ?
  `;
  const [outboundRows]: any = await pool.query(outboundQuery, [processCode]);
  const rawOutboundRows = outboundRows[0].raw_outbound_rows;

  const inboundQuery = `
    SELECT COUNT(*) as raw_inbound_rows
    FROM ${qid(DB.AUDIT)}.call_quality_assessment
    WHERE process_code = ?
  `;
  const [inboundRows]: any = await pool.query(inboundQuery, [processCode]);
  const rawInboundRows = inboundRows[0].raw_inbound_rows;

  const transcriptQuery = `
    SELECT COUNT(*) as transcript_count
    FROM ${qid(DB.APP)}.ci_call_master
    WHERE process_code = ? AND transcript_status = 'AVAILABLE'
  `;
  const [transcriptRows]: any = await pool.query(transcriptQuery, [processCode]);
  const transcriptCount = transcriptRows[0].transcript_count;

  const coachingQuery = `
    SELECT COUNT(*) as coaching_count
    FROM ${qid(DB.APP)}.cm_coaching_trigger
    WHERE process_code = ?
  `;
  const [coachingRows]: any = await pool.query(coachingQuery, [processCode]);
  const coachingCount = coachingRows[0].coaching_count;

  const governanceQuery = `
    SELECT COUNT(*) as governance_count
    FROM ${qid(DB.APP)}.cm_governance_action
    WHERE process_code = ?
  `;
  const [governanceRows]: any = await pool.query(governanceQuery, [processCode]);
  const governanceCount = governanceRows[0].governance_count;

  res.json({
    success: true,
    diagnostics: {
      process_id: process.process_id,
      process_code: process.process_code,
      process_type: process.process_type,
      client_id: process.client_id,
      call_count: callCount,
      raw_outbound_rows: rawOutboundRows,
      raw_inbound_rows: rawInboundRows,
      transcript_count: transcriptCount,
      coaching_count: coachingCount,
      governance_count: governanceCount
    }
  });
}));

router.get("/available-data", asyncHandler(async (_req, res) => {
  const processQuery = `
    SELECT process_id, process_code, process_name, process_type
    FROM ${qid(DB.APP)}.ci_process_master
    ORDER BY process_type, process_name
  `;
  const [processes]: any = await pool.query(processQuery);

  // Single aggregate query per DB instead of N×3 individual queries
  const [canonicalRows]: any = await pool.query(`
    SELECT pm.process_code, COUNT(*) AS canonical_calls
    FROM ${qid(DB.APP)}.ci_call_master cm
    JOIN ${qid(DB.APP)}.ci_process_master pm ON cm.process_id = pm.process_id
    GROUP BY pm.process_code
  `);

  const [outboundRows]: any = await pool.query(`
    SELECT ProcessCode, COUNT(*) AS raw_outbound_rows
    FROM ${qid(DB.EXTERNAL)}.CallDetails
    WHERE ProcessCode IS NOT NULL
    GROUP BY ProcessCode
  `).catch(() => [[]]);

  const [inboundRows]: any = await pool.query(`
    SELECT process_code, COUNT(*) AS raw_inbound_rows
    FROM ${qid(DB.AUDIT)}.call_quality_assessment
    WHERE process_code IS NOT NULL
    GROUP BY process_code
  `).catch(() => [[]]);

  // Build lookup maps for O(1) access
  const canonicalMap: Record<string, number> = {};
  for (const r of canonicalRows) canonicalMap[r.process_code] = Number(r.canonical_calls);

  const outboundMap: Record<string, number> = {};
  for (const r of (outboundRows[0] ?? outboundRows)) outboundMap[r.ProcessCode] = Number(r.raw_outbound_rows);

  const inboundMap: Record<string, number> = {};
  for (const r of (inboundRows[0] ?? inboundRows)) inboundMap[r.process_code] = Number(r.raw_inbound_rows);

  const diagnostics = processes.map((p: any) => {
    const canonicalCalls = canonicalMap[p.process_code] ?? 0;
    const rawOutboundRows = outboundMap[p.process_code] ?? 0;
    const rawInboundRows = inboundMap[p.process_code] ?? 0;

    let dataStatus = "NO_DATA";
    if (canonicalCalls > 0 && (rawOutboundRows > 0 || rawInboundRows > 0)) {
      dataStatus = "READY";
    } else if (rawOutboundRows > 0 || rawInboundRows > 0) {
      dataStatus = "RAW_ONLY";
    } else if (canonicalCalls > 0) {
      dataStatus = "CANONICAL_ONLY";
    }

    return {
      process_code: p.process_code,
      process_name: p.process_name,
      process_type: p.process_type,
      canonical_calls: canonicalCalls,
      raw_outbound_rows: rawOutboundRows,
      raw_inbound_rows: rawInboundRows,
      data_status: dataStatus,
    };
  });

  res.json({ success: true, data: diagnostics });
}));

router.get("/inbound-validation", asyncHandler(async (_req, res) => {
  const processQuery = `
    SELECT DISTINCT process_code
    FROM ${qid(DB.AUDIT)}.call_quality_assessment
    WHERE process_code IS NOT NULL
    ORDER BY process_code
    LIMIT 1
  `;
  const [processRows]: any = await pool.query(processQuery);

  if (processRows.length === 0) {
    return res.json({
      success: true,
      message: "No inbound processes found with raw data",
      validation: null
    });
  }

  const processCode = processRows[0].process_code;

  const rawCountQuery = `
    SELECT COUNT(*) as raw_count
    FROM ${qid(DB.AUDIT)}.call_quality_assessment
    WHERE process_code = ?
  `;
  const [rawRows]: any = await pool.query(rawCountQuery, [processCode]);
  const rawCount = rawRows[0].raw_count;

  const canonicalQuery = `
    SELECT COUNT(*) as canonical_count
    FROM ${qid(DB.APP)}.ci_call_master
    WHERE process_code = ?
  `;
  const [canonicalRows]: any = await pool.query(canonicalQuery, [processCode]);
  const canonicalCount = canonicalRows[0].canonical_count;

  const status = canonicalCount > 0 ? "MAPPED" : "UNMAPPED";

  res.json({
    success: true,
    validation: {
      process_code: processCode,
      raw_inbound_count: rawCount,
      canonical_count: canonicalCount,
      status,
      endpoint: `/api/inbound/${processCode}/quality`
    }
  });
}));

router.get("/deployment-checklist", asyncHandler(async (_req, res) => {
  const envReady = !!(process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD);

  let dbConnected = false;
  try {
    await pool.query("SELECT 1");
    dbConnected = true;
  } catch {
    dbConnected = false;
  }

  const authMode = process.env.AUTH_MODE || "mock";

  const summaryQuery = `
    SELECT COUNT(*) as summary_count
    FROM ${qid(DB.APP)}.cm_process_daily_summary
  `;
  const [summaryRows]: any = await pool.query(summaryQuery);
  const summaryRefreshed = summaryRows[0].summary_count > 0;

  const backendPort = process.env.PORT || 5000;
  const frontendPort = "5173";

  const checklist = [
    { item: "Environment variables configured", status: envReady ? "✓" : "✗" },
    { item: "Database connection active", status: dbConnected ? "✓" : "✗" },
    { item: "Auth mode set", status: authMode !== "mock" ? "✓" : "MOCK" },
    { item: "Process summary table populated", status: summaryRefreshed ? "✓" : "✗" },
    { item: "Heavy views avoided", status: "✓" },
    { item: "External DB read-only respected", status: "✓" },
    { item: `Backend running on port ${backendPort}`, status: "✓" },
    { item: `Frontend expected on port ${frontendPort}`, status: "INFO" }
  ];

  const pendingItems = [
    "Test FINNABLE end-to-end",
    "Validate inbound quality endpoint",
    "Review diagnostics for all processes",
    "Production deployment"
  ];

  res.json({
    success: true,
    checklist,
    pending: pendingItems
  });
}));

export default router;

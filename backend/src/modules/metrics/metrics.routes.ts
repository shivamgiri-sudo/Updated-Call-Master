import { Router } from "express";
import { DB, pool, qid } from "../../config/db";
import { asyncHandler } from "../../middleware/asyncHandler";

const router = Router();

// GET /api/metrics/catalog - Get all metrics in catalog
router.get("/catalog", asyncHandler(async (req, res) => {
  const { dashboard_type, status, process_type } = req.query;

  let sql = `
    SELECT
      metric_id,
      dashboard_type,
      page_name,
      widget_name,
      metric_code,
      metric_name,
      process_type,
      source_db,
      source_table,
      source_columns,
      formula_sql,
      filter_fields,
      drilldown_route,
      role_visibility,
      status,
      notes,
      created_at,
      updated_at
    FROM ${qid(DB.APP)}.cm_metric_definition
    WHERE 1=1
  `;

  const params: any[] = [];

  if (dashboard_type) {
    sql += ` AND dashboard_type = ?`;
    params.push(dashboard_type);
  }

  if (status) {
    sql += ` AND status = ?`;
    params.push(status);
  }

  if (process_type) {
    sql += ` AND (process_type = ? OR process_type = 'BOTH')`;
    params.push(process_type);
  }

  sql += ` ORDER BY dashboard_type, page_name, metric_id`;

  const [rows] = await pool.query(sql, params);

  res.json({
    success: true,
    data: rows,
    filters: { dashboard_type, status, process_type }
  });
}));

// GET /api/metrics/catalog/:processType - Get metrics by process type
router.get("/catalog/:processType", asyncHandler(async (req, res) => {
  const { processType } = req.params;

  if (!['INBOUND', 'OUTBOUND'].includes(processType.toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: "Invalid process type. Must be INBOUND or OUTBOUND."
    });
  }

  const sql = `
    SELECT
      metric_id,
      dashboard_type,
      page_name,
      widget_name,
      metric_code,
      metric_name,
      process_type,
      source_db,
      source_table,
      source_columns,
      formula_sql,
      filter_fields,
      drilldown_route,
      role_visibility,
      status,
      notes
    FROM ${qid(DB.APP)}.cm_metric_definition
    WHERE process_type = ? OR process_type = 'BOTH'
    ORDER BY page_name, metric_id
  `;

  const [rows] = await pool.query(sql, [processType.toUpperCase()]);

  res.json({
    success: true,
    processType: processType.toUpperCase(),
    data: rows
  });
}));

// GET /api/metrics/missing - Get metrics needing attention
router.get("/missing", asyncHandler(async (req, res) => {
  const statusSummarySQL = `
    SELECT status, COUNT(*) as count
    FROM ${qid(DB.APP)}.cm_metric_definition
    GROUP BY status
    ORDER BY FIELD(status, 'IMPLEMENTED', 'SOURCE_MAPPED', 'NEEDS_FORMULA', 'SOURCE_MISSING', 'PARTIAL')
  `;

  const [statusSummary] = await pool.query(statusSummarySQL);

  const dashboardBreakdownSQL = `
    SELECT dashboard_type, status, COUNT(*) as count
    FROM ${qid(DB.APP)}.cm_metric_definition
    GROUP BY dashboard_type, status
    ORDER BY dashboard_type, FIELD(status, 'IMPLEMENTED', 'SOURCE_MAPPED', 'NEEDS_FORMULA', 'SOURCE_MISSING', 'PARTIAL')
  `;

  const [dashboardBreakdown] = await pool.query(dashboardBreakdownSQL);

  const needsFormulaSQL = `
    SELECT
      metric_code,
      metric_name,
      dashboard_type,
      page_name,
      widget_name,
      notes
    FROM ${qid(DB.APP)}.cm_metric_definition
    WHERE status = 'NEEDS_FORMULA'
    ORDER BY dashboard_type, metric_code
  `;

  const [needsFormula] = await pool.query(needsFormulaSQL);

  const sourceMissingSQL = `
    SELECT
      metric_code,
      metric_name,
      dashboard_type,
      page_name,
      notes
    FROM ${qid(DB.APP)}.cm_metric_definition
    WHERE status = 'SOURCE_MISSING'
    ORDER BY dashboard_type, metric_code
  `;

  const [sourceMissing] = await pool.query(sourceMissingSQL);

  const sourceMappedSQL = `
    SELECT
      metric_code,
      metric_name,
      dashboard_type,
      page_name,
      source_db,
      source_table,
      source_columns
    FROM ${qid(DB.APP)}.cm_metric_definition
    WHERE status = 'SOURCE_MAPPED'
    ORDER BY dashboard_type, metric_code
  `;

  const [sourceMapped] = await pool.query(sourceMappedSQL);

  // Calculate totals
  const totalMetricsSQL = `SELECT COUNT(*) as total FROM ${qid(DB.APP)}.cm_metric_definition`;
  const [totalRows]: any = await pool.query(totalMetricsSQL);
  const totalMetrics = totalRows[0].total;

  const implementedSQL = `SELECT COUNT(*) as implemented FROM ${qid(DB.APP)}.cm_metric_definition WHERE status = 'IMPLEMENTED'`;
  const [implementedRows]: any = await pool.query(implementedSQL);
  const implementedCount = implementedRows[0].implemented;

  const completionPercent = totalMetrics > 0 ? ((implementedCount / totalMetrics) * 100).toFixed(1) : 0;

  res.json({
    success: true,
    summary: {
      total_metrics: totalMetrics,
      implemented_count: implementedCount,
      completion_percent: completionPercent,
      status_summary: statusSummary,
      dashboard_breakdown: dashboardBreakdown
    },
    needs_formula: needsFormula,
    source_missing: sourceMissing,
    source_mapped: sourceMapped
  });
}));

// GET /api/metrics/stats - Get catalog statistics
router.get("/stats", asyncHandler(async (_req, res) => {
  const totalSQL = `SELECT COUNT(*) as total FROM ${qid(DB.APP)}.cm_metric_definition`;
  const [totalRows]: any = await pool.query(totalSQL);
  const totalMetrics = totalRows[0].total;

  const inboundSQL = `SELECT COUNT(*) as count FROM ${qid(DB.APP)}.cm_metric_definition WHERE dashboard_type = 'INBOUND'`;
  const [inboundRows]: any = await pool.query(inboundSQL);
  const inboundCount = inboundRows[0].count;

  const outboundSQL = `SELECT COUNT(*) as count FROM ${qid(DB.APP)}.cm_metric_definition WHERE dashboard_type = 'OUTBOUND'`;
  const [outboundRows]: any = await pool.query(outboundSQL);
  const outboundCount = outboundRows[0].count;

  const implementedSQL = `SELECT COUNT(*) as count FROM ${qid(DB.APP)}.cm_metric_definition WHERE status = 'IMPLEMENTED'`;
  const [implementedRows]: any = await pool.query(implementedSQL);
  const implementedCount = implementedRows[0].count;

  const needsFormulaSQL = `SELECT COUNT(*) as count FROM ${qid(DB.APP)}.cm_metric_definition WHERE status = 'NEEDS_FORMULA'`;
  const [needsFormulaRows]: any = await pool.query(needsFormulaSQL);
  const needsFormulaCount = needsFormulaRows[0].count;

  const sourceMappedSQL = `SELECT COUNT(*) as count FROM ${qid(DB.APP)}.cm_metric_definition WHERE status = 'SOURCE_MAPPED'`;
  const [sourceMappedRows]: any = await pool.query(sourceMappedSQL);
  const sourceMappedCount = sourceMappedRows[0].count;

  const sourceMissingSQL = `SELECT COUNT(*) as count FROM ${qid(DB.APP)}.cm_metric_definition WHERE status = 'SOURCE_MISSING'`;
  const [sourceMissingRows]: any = await pool.query(sourceMissingSQL);
  const sourceMissingCount = sourceMissingRows[0].count;

  const completionPercent = totalMetrics > 0 ? ((implementedCount / totalMetrics) * 100).toFixed(1) : 0;

  res.json({
    success: true,
    stats: {
      total_metrics: totalMetrics,
      inbound_metrics: inboundCount,
      outbound_metrics: outboundCount,
      implemented: implementedCount,
      needs_formula: needsFormulaCount,
      source_mapped: sourceMappedCount,
      source_missing: sourceMissingCount,
      completion_percent: completionPercent
    }
  });
}));

export default router;

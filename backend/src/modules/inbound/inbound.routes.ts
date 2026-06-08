import { Router } from "express";
import { DB, pool, qid } from "../../config/db";
import { asyncHandler } from "../../middleware/asyncHandler";

const router = Router();

type QueryRows = any[];
type ColumnInfo = { COLUMN_NAME: string; DATA_TYPE: string };
type FieldSpec = {
  key: string;
  label: string;
  required: boolean;
  candidates: string[];
  purpose: string;
};
type FieldMapping = FieldSpec & {
  found_column: string | null;
  data_type: string | null;
  status: "FOUND" | "MISSING_REQUIRED" | "MISSING_OPTIONAL";
};
type MappingResult = {
  fields: FieldMapping[];
  byKey: Record<string, FieldMapping>;
  summary: {
    table_schema: string;
    table_name: string;
    total_required: number;
    mapped_required: number;
    missing_required: number;
    total_optional: number;
    mapped_optional: number;
    missing_optional: number;
    readiness_percent: number;
  };
};

const AUDIT_TABLE = "call_quality_assessment";

const INBOUND_FIELD_SPECS: FieldSpec[] = [
  { key: "client_id", label: "Client ID", required: true, candidates: ["ClientId", "client_id", "clientid", "client"], purpose: "Process-to-client filtering" },
  { key: "call_date", label: "Call Date", required: true, candidates: ["CallDate", "call_date", "created_at", "audit_date", "call_datetime", "Date"], purpose: "Date filter and raw audit sorting" },
  { key: "agent_name", label: "Agent / User Name", required: false, candidates: ["AgentName", "agent_name", "UserName", "user_name", "EmpName", "employee_name", "agent"], purpose: "Agent ranking and drilldown" },
  { key: "lead_id", label: "Lead / Call ID", required: false, candidates: ["LeadID", "lead_id", "lead", "source_call_id", "call_id", "CallId"], purpose: "Raw audit explorer identity" },
  { key: "quality_score", label: "CQ / Quality Score", required: true, candidates: ["quality_percentage", "cq_score", "quality_score", "quality_percent", "qualitypercentage", "score"], purpose: "CQ score KPI and ranking" },
  { key: "fatal_count", label: "Fatal Count / Flag", required: false, candidates: ["fatal_count", "fatal", "fatal_status", "fatal_error", "fatal_flag"], purpose: "Fatal count and fatal percentage" },
  { key: "sensitive_word", label: "Sensitive Word", required: false, candidates: ["sensetive_word", "sensitive_word", "sensitive_words", "sensitive_word_count", "negative_words"], purpose: "Sensitive word KPI" },
  { key: "policy_failure", label: "Policy Communication Failure", required: false, candidates: ["policy_communication_failure", "policy_failure", "policy_failure_count", "policycommunicationfailure"], purpose: "Policy failure KPI" },
  { key: "opening_score", label: "Opening Score", required: false, candidates: ["opening_score", "opening", "call_opening_score"], purpose: "Looker quality score breakdown" },
  { key: "soft_skill_score", label: "Soft Skill Score", required: false, candidates: ["soft_skill_score", "softskill_score", "soft_skills_score", "soft_skill"], purpose: "Looker quality score breakdown" },
  { key: "hold_procedure_score", label: "Hold Procedure Score", required: false, candidates: ["hold_procedure_score", "hold_score", "holdprocedure_score"], purpose: "Looker quality score breakdown" },
  { key: "resolution_score", label: "Resolution Score", required: false, candidates: ["resolution_score", "resolution", "query_resolution_score"], purpose: "Looker quality score breakdown" },
  { key: "closing_score", label: "Closing Score", required: false, candidates: ["closing_score", "closing", "call_closing_score"], purpose: "Looker quality score breakdown" },
];

function normaliseColumnName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function safeColumn(column: string | null | undefined): string | null {
  if (!column || !/^[A-Za-z0-9_]+$/.test(column)) return null;
  return qid(column);
}

function sqlString(column: string): string {
  return `LOWER(TRIM(CAST(${column} AS CHAR)))`;
}

function numeric(column: string): string {
  return `CAST(${column} AS DECIMAL(18,4))`;
}

function found(mapping: MappingResult, key: string): string | null {
  return safeColumn(mapping.byKey[key]?.found_column);
}

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
    console.warn("Inbound dynamic query skipped:", err instanceof Error ? err.message : err);
    return fallback;
  }
}

async function getAuditColumns(): Promise<ColumnInfo[]> {
  const sql = `
    SELECT COLUMN_NAME, DATA_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = ?
    ORDER BY ORDINAL_POSITION
  `;
  const [rows]: any = await pool.query(sql, [DB.AUDIT, AUDIT_TABLE]);
  return rows || [];
}

async function getInboundFieldMapping(): Promise<MappingResult> {
  const columns = await getAuditColumns();
  const lookup = new Map<string, ColumnInfo>();

  for (const col of columns) {
    lookup.set(normaliseColumnName(col.COLUMN_NAME), col);
  }

  const fields: FieldMapping[] = INBOUND_FIELD_SPECS.map((spec) => {
    const match = spec.candidates
      .map((candidate) => lookup.get(normaliseColumnName(candidate)))
      .find(Boolean) as ColumnInfo | undefined;

    const foundColumn = match?.COLUMN_NAME || null;
    const status = foundColumn ? "FOUND" : spec.required ? "MISSING_REQUIRED" : "MISSING_OPTIONAL";

    return {
      ...spec,
      found_column: foundColumn,
      data_type: match?.DATA_TYPE || null,
      status,
    };
  });

  const byKey = fields.reduce<Record<string, FieldMapping>>((acc, item) => {
    acc[item.key] = item;
    return acc;
  }, {});

  const required = fields.filter((f) => f.required);
  const optional = fields.filter((f) => !f.required);
  const mappedRequired = required.filter((f) => f.found_column).length;
  const mappedOptional = optional.filter((f) => f.found_column).length;
  const readinessBase = fields.length || 1;
  const readiness = Math.round((fields.filter((f) => f.found_column).length / readinessBase) * 10000) / 100;

  return {
    fields,
    byKey,
    summary: {
      table_schema: DB.AUDIT,
      table_name: AUDIT_TABLE,
      total_required: required.length,
      mapped_required: mappedRequired,
      missing_required: required.length - mappedRequired,
      total_optional: optional.length,
      mapped_optional: mappedOptional,
      missing_optional: optional.length - mappedOptional,
      readiness_percent: readiness,
    },
  };
}

function buildWhere(mapping: MappingResult, clientId: number, date?: string): { sql: string; params: any[]; dateApplied: boolean } {
  const clientCol = found(mapping, "client_id");
  const dateCol = found(mapping, "call_date");
  const clauses: string[] = [];
  const params: any[] = [];
  let dateApplied = false;

  if (clientCol) {
    clauses.push(`${clientCol} = ?`);
    params.push(clientId);
  } else {
    clauses.push("1 = 0");
  }

  if (date && dateCol) {
    clauses.push(`DATE(${dateCol}) = ?`);
    params.push(date);
    dateApplied = true;
  }

  return { sql: `WHERE ${clauses.join(" AND ")}`, params, dateApplied };
}

function buildKpiSelect(mapping: MappingResult): string {
  const qualityCol = found(mapping, "quality_score");
  const fatalCol = found(mapping, "fatal_count");
  const sensitiveCol = found(mapping, "sensitive_word");
  const policyCol = found(mapping, "policy_failure");

  const cqExpr = qualityCol ? `ROUND(AVG(${numeric(qualityCol)}), 2)` : "0";
  const fatalExpr = fatalCol
    ? `SUM(CASE WHEN COALESCE(${numeric(fatalCol)}, 0) > 0 OR ${sqlString(fatalCol)} IN ('yes','y','true','fatal','fail','failed','1') THEN 1 ELSE 0 END)`
    : "0";
  const sensitiveExpr = sensitiveCol
    ? `SUM(CASE WHEN ${sensitiveCol} IS NOT NULL AND ${sqlString(sensitiveCol)} NOT IN ('','no','none','null','n/a','na','0') THEN 1 ELSE 0 END)`
    : "0";
  const policyExpr = policyCol
    ? `SUM(CASE WHEN COALESCE(${numeric(policyCol)}, 0) > 0 OR ${sqlString(policyCol)} IN ('yes','y','true','fail','failed','1') THEN 1 ELSE 0 END)`
    : "0";

  return `
    COUNT(*) AS audit_count,
    ${cqExpr} AS cq_score,
    ${fatalExpr} AS fatal_count,
    ${sensitiveExpr} AS sensitive_word_count,
    ${policyExpr} AS policy_failure_count
  `;
}

router.get("/:processCode/schema-check", asyncHandler(async (req, res) => {
  const { processCode } = req.params;
  const clientId = await getClientIdFromProcess(processCode);
  const mapping = await getInboundFieldMapping();
  res.json({ success: true, processCode, clientId, data: mapping });
}));

router.get("/:processCode/quality", asyncHandler(async (req, res) => {
  const { processCode } = req.params;
  const date = req.query.date as string | undefined;
  const clientId = await getClientIdFromProcess(processCode);

  if (!clientId) {
    return res.json({ success: true, processCode, data: { audit_count: 0, cq_score: 0, fatal_count: 0, sensitive_word_count: 0, policy_failure_count: 0 } });
  }

  const mapping = await getInboundFieldMapping();
  const where = buildWhere(mapping, clientId, date);
  const sql = `
    SELECT ${buildKpiSelect(mapping)}
    FROM ${qid(DB.AUDIT)}.${qid(AUDIT_TABLE)}
    ${where.sql}
  `;

  const rows = await safeQuery<QueryRows>(sql, where.params, []);
  res.json({ success: true, processCode, clientId, schema: mapping.summary, data: rows?.[0] || {} });
}));

router.get("/:processCode/looker-parity", asyncHandler(async (req, res) => {
  const { processCode } = req.params;
  const date = req.query.date as string | undefined;
  const clientId = await getClientIdFromProcess(processCode);
  const mapping = await getInboundFieldMapping();

  if (!clientId) {
    return res.json({
      success: true,
      processCode,
      clientId: null,
      data: {
        schema: mapping,
        kpis: { audit_count: 0, cq_score: 0, fatal_count: 0, fatal_percent: 0, target_cq: 85, sensitive_word_count: 0, policy_failure_count: 0 },
        score_breakdown: [],
        agent_rank: [],
        raw_audits: [],
      },
    });
  }

  const where = buildWhere(mapping, clientId, date);

  const kpiRows = await safeQuery<QueryRows>(`
    SELECT ${buildKpiSelect(mapping)}
    FROM ${qid(DB.AUDIT)}.${qid(AUDIT_TABLE)}
    ${where.sql}
  `, where.params, []);

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

  const scoreFields = ["opening_score", "soft_skill_score", "hold_procedure_score", "resolution_score", "closing_score"];
  const scoreSelects = scoreFields
    .map((key) => {
      const col = found(mapping, key);
      return col ? `ROUND(AVG(${numeric(col)}), 2) AS ${qid(key)}` : null;
    })
    .filter(Boolean);

  const scoreRows = scoreSelects.length
    ? await safeQuery<QueryRows>(`
        SELECT ${scoreSelects.join(",\n")}
        FROM ${qid(DB.AUDIT)}.${qid(AUDIT_TABLE)}
        ${where.sql}
      `, where.params, [])
    : [];

  const score = scoreRows?.[0] || {};
  const score_breakdown = scoreFields
    .map((key) => {
      const field = mapping.byKey[key];
      return {
        code: key,
        label: field?.label || key,
        column: field?.found_column,
        score: score[key],
      };
    })
    .filter((item) => item.column && item.score !== null && item.score !== undefined);

  const agentCol = found(mapping, "agent_name");
  const agentRank = agentCol
    ? await safeQuery<QueryRows>(`
        SELECT
          ${agentCol} AS agent_name,
          ${buildKpiSelect(mapping)}
        FROM ${qid(DB.AUDIT)}.${qid(AUDIT_TABLE)}
        ${where.sql}
        GROUP BY ${agentCol}
        ORDER BY cq_score ASC, fatal_count DESC, policy_failure_count DESC
        LIMIT 25
      `, where.params, [])
    : [];

  const rawSelects = [
    ["client_id", "client_id"],
    ["call_date", "call_date"],
    ["agent_name", "agent_name"],
    ["lead_id", "lead_id"],
    ["quality_score", "cq_score"],
    ["fatal_count", "fatal_count"],
    ["sensitive_word", "sensitive_word"],
    ["policy_failure", "policy_failure"],
  ]
    .map(([key, alias]) => {
      const col = found(mapping, key);
      return col ? `${col} AS ${qid(alias)}` : null;
    })
    .filter(Boolean);

  const dateCol = found(mapping, "call_date");
  const rawAudits = rawSelects.length
    ? await safeQuery<QueryRows>(`
        SELECT ${rawSelects.join(",\n")}
        FROM ${qid(DB.AUDIT)}.${qid(AUDIT_TABLE)}
        ${where.sql}
        ${dateCol ? `ORDER BY ${dateCol} DESC` : ""}
        LIMIT 50
      `, where.params, [])
    : [];

  res.json({
    success: true,
    processCode,
    clientId,
    data: {
      schema: mapping,
      date_filter_applied: where.dateApplied,
      kpis,
      score_breakdown,
      agent_rank: agentRank,
      raw_audits: rawAudits,
    },
  });
}));

export default router;

import { Router } from "express";
import { DB, pool, qid } from "../../config/db";
import { asyncHandler } from "../../middleware/asyncHandler";

const router = Router();

const tenantSummary = {
  tenantId: "MCN-ENTERPRISE",
  tenantName: "Mas CallNet Enterprise Demo",
  plan: "Enterprise AI Command Center",
  region: "India",
  activeProcesses: 18,
  activeUsers: 1240,
  monthlyCalls: 842600,
  aiAuditsThisMonth: 218400,
  liveAssistSessions: 62420,
  storageUsedGb: 842,
  dataRetentionDays: 365,
  status: "READY_FOR_EXECUTIVE_DEMO"
};

const featureFlags = [
  { key: "executive_iq", label: "Executive IQ", enabled: true, maturity: "GA", owner: "Product" },
  { key: "sales_transition_funnel", label: "Sales transition funnel", enabled: true, maturity: "Demo + API", owner: "Analytics" },
  { key: "rejection_transition_funnel", label: "Rejection transition funnel", enabled: true, maturity: "Demo + API", owner: "Analytics" },
  { key: "live_assist", label: "Live assist", enabled: true, maturity: "Demo", owner: "AI Platform" },
  { key: "prompt_studio", label: "AI prompt studio", enabled: true, maturity: "Design-ready", owner: "AI Governance" },
  { key: "tenant_admin", label: "Tenant administration", enabled: true, maturity: "Design-ready", owner: "SaaS Platform" },
  { key: "client_portal", label: "Client portal", enabled: false, maturity: "Backlog", owner: "Product" },
  { key: "sso", label: "SSO / MFA", enabled: false, maturity: "Backlog", owner: "Security" }
];

const readinessChecks = [
  { area: "Frontend premium demo", status: "PASS", score: 96, evidence: "Executive IQ, funnels, live assist and gaps pages available with fallback data." },
  { area: "API route coverage", status: "PASS", score: 88, evidence: "Executive, funnel and live demo endpoints are mounted." },
  { area: "Database safety", status: "PASS", score: 92, evidence: "New demo endpoints do not perform unsafe writes to read-only source databases." },
  { area: "Real-time architecture", status: "GAP", score: 42, evidence: "Live assist demo exists; production WebSocket/SSE streaming is still pending." },
  { area: "SaaS tenancy", status: "PARTIAL", score: 64, evidence: "Tenant persistence schema exists; runtime binding attempts app-owned tables." },
  { area: "AI governance", status: "PARTIAL", score: 64, evidence: "Governance design exists; prompt/model/version cost tracking still needs production workflows." },
  { area: "Observability", status: "GAP", score: 38, evidence: "Rate limiting, APM, error tracking and queue monitoring are still pending." }
];

const dataFreshness = [
  { source: "Call master canonical", status: "HEALTHY", lastSync: "2026-06-16 09:05", latency: "4m", recordsToday: 12840 },
  { source: "External call details", status: "HEALTHY", lastSync: "2026-06-16 09:03", latency: "6m", recordsToday: 12840 },
  { source: "AI audit results", status: "DELAYED", lastSync: "2026-06-16 08:41", latency: "28m", recordsToday: 9210 },
  { source: "Live assist stream", status: "DEMO", lastSync: "N/A", latency: "Demo mode", recordsToday: 3 },
  { source: "Coaching actions", status: "HEALTHY", lastSync: "2026-06-16 09:01", latency: "8m", recordsToday: 172 }
];

const securityPosture = [
  { control: "Role-based access", status: "ACTIVE", maturity: "Implemented in API middleware" },
  { control: "Process scope filtering", status: "ACTIVE", maturity: "Implemented for scoped process routes" },
  { control: "SSO / MFA", status: "PENDING", maturity: "Enterprise requirement" },
  { control: "PII masking before AI", status: "PARTIAL", maturity: "Must be enforced before production AI" },
  { control: "Audit log for writes", status: "PENDING", maturity: "Required for SaaS compliance" },
  { control: "Rate limiting", status: "PENDING", maturity: "Required before public deployment" },
  { control: "Data retention policy", status: "DESIGNED", maturity: "Tenant-level setting proposed" }
];

async function readOrFallback<T>(sql: string, fallback: T, mapRows: (rows: any[]) => T) {
  try {
    const [rows]: any = await pool.query(sql);
    return { source: "mysql_app_owned", data: mapRows(rows || []) };
  } catch (error: any) {
    return { source: "demo_fallback", warning: error.message, data: fallback };
  }
}

router.get("/tenant-summary", asyncHandler(async (_req, res) => {
  const sql = `SELECT * FROM ${qid(DB.APP)}.cm_tenant_master ORDER BY tenant_id ASC LIMIT 1`;
  const result = await readOrFallback(sql, tenantSummary, (rows) => {
    const row = rows?.[0];
    if (!row) return tenantSummary;
    return {
      tenantId: row.tenant_code || row.tenant_id,
      tenantName: row.tenant_name,
      plan: row.plan_name,
      region: row.region_name || "India",
      activeProcesses: 0,
      activeUsers: 0,
      monthlyCalls: 0,
      aiAuditsThisMonth: 0,
      liveAssistSessions: 0,
      storageUsedGb: 0,
      dataRetentionDays: Number(row.data_retention_days || 365),
      status: row.status || "ACTIVE"
    };
  });
  res.json({ success: true, generatedAt: new Date().toISOString(), ...result });
}));

router.get("/feature-flags", asyncHandler(async (_req, res) => {
  const sql = `SELECT * FROM ${qid(DB.APP)}.cm_tenant_feature_flag ORDER BY feature_key ASC LIMIT 100`;
  const result = await readOrFallback(sql, featureFlags, (rows) => rows.length ? rows.map((row) => ({
    key: row.feature_key,
    label: row.feature_label,
    enabled: Boolean(row.enabled_flag),
    maturity: row.maturity_status || "Configured",
    owner: row.owner_role || "Product"
  })) : featureFlags);
  res.json({ success: true, generatedAt: new Date().toISOString(), ...result });
}));

router.get("/readiness", (_req, res) => {
  res.json({ success: true, generatedAt: new Date().toISOString(), data: readinessChecks });
});

router.get("/data-freshness", (_req, res) => {
  res.json({ success: true, generatedAt: new Date().toISOString(), data: dataFreshness });
});

router.get("/security-posture", (_req, res) => {
  res.json({ success: true, generatedAt: new Date().toISOString(), data: securityPosture });
});

export default router;

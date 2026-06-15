import { Router } from "express";

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
  { area: "SaaS tenancy", status: "GAP", score: 48, evidence: "Role and process scope exists; full tenant isolation still needs schema enforcement." },
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

router.get("/tenant-summary", (_req, res) => {
  res.json({ success: true, generatedAt: new Date().toISOString(), data: tenantSummary });
});

router.get("/feature-flags", (_req, res) => {
  res.json({ success: true, generatedAt: new Date().toISOString(), data: featureFlags });
});

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

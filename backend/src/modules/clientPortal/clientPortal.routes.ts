import { Router } from "express";
import { DB, pool, qid } from "../../config/db";
import { asyncHandler } from "../../middleware/asyncHandler";

const router = Router();

const portalUsers = [
  { client: "Demo Client", email: "client.viewer@example.com", displayName: "Client Viewer", role: "CLIENT_VIEWER", status: "ACTIVE" },
  { client: "Demo Client", email: "client.admin@example.com", displayName: "Client Admin", role: "CLIENT_ADMIN", status: "ACTIVE" }
];

const permissions = [
  { role: "CLIENT_VIEWER", module: "executive_iq", canView: true, canExport: false, canComment: false, canDownloadRaw: false },
  { role: "CLIENT_VIEWER", module: "sales_funnel", canView: true, canExport: false, canComment: false, canDownloadRaw: false },
  { role: "CLIENT_VIEWER", module: "rejection_funnel", canView: true, canExport: false, canComment: false, canDownloadRaw: false },
  { role: "CLIENT_ADMIN", module: "executive_iq", canView: true, canExport: true, canComment: true, canDownloadRaw: false },
  { role: "CLIENT_ADMIN", module: "sales_funnel", canView: true, canExport: true, canComment: true, canDownloadRaw: false },
  { role: "CLIENT_ADMIN", module: "rejection_funnel", canView: true, canExport: true, canComment: true, canDownloadRaw: false }
];

const shareLogs = [
  { module: "executive_iq", sharedTo: "client.viewer@example.com", status: "PENDING", expiresAt: "7 days" },
  { module: "sales_funnel", sharedTo: "client.admin@example.com", status: "ACTIVE", expiresAt: "14 days" }
];

const approvalQueue = [
  { requestId: "SHARE-001", module: "executive_iq", requestedBy: "Ops Manager", sharedTo: "client.viewer@example.com", status: "PENDING_APPROVAL", risk: "LOW" },
  { requestId: "EXPORT-002", module: "sales_funnel", requestedBy: "QA Lead", sharedTo: "client.admin@example.com", status: "PENDING_APPROVAL", risk: "MEDIUM" }
];

const watermarkPolicy = [
  { exportType: "PDF", watermark: "tenant, user email, timestamp, module", enabled: true },
  { exportType: "CSV", watermark: "header metadata and audit log", enabled: true },
  { exportType: "RAW_TRANSCRIPT", watermark: "blocked for client roles", enabled: false }
];

const accessAudit = [
  { event: "VIEW", module: "executive_iq", user: "client.viewer@example.com", status: "ALLOWED", at: "Recent" },
  { event: "EXPORT", module: "sales_funnel", user: "client.admin@example.com", status: "WATERMARKED", at: "Recent" }
];

async function readOrFallback<T>(sql: string, fallback: T, mapRows: (rows: any[]) => T) {
  try {
    const [rows]: any = await pool.query(sql);
    return { source: "mysql_app_owned", data: mapRows(rows || []) };
  } catch (error: any) {
    return { source: "demo_fallback", warning: error.message, data: fallback };
  }
}

router.get("/users", asyncHandler(async (_req, res) => {
  const sql = `SELECT * FROM ${qid(DB.APP)}.cm_client_portal_user ORDER BY created_at DESC LIMIT 100`;
  const result = await readOrFallback(sql, portalUsers, (rows) => rows.length ? rows.map((row) => ({ client: row.client_id, email: row.user_email, displayName: row.display_name || row.user_email, role: row.portal_role_id, status: row.active_flag ? "ACTIVE" : "INACTIVE" })) : portalUsers);
  res.json({ success: true, generatedAt: new Date().toISOString(), ...result });
}));

router.get("/permissions", asyncHandler(async (_req, res) => {
  const sql = `SELECT * FROM ${qid(DB.APP)}.cm_client_portal_permission ORDER BY portal_role_id, module_key LIMIT 200`;
  const result = await readOrFallback(sql, permissions, (rows) => rows.length ? rows.map((row) => ({ role: row.portal_role_id, module: row.module_key, canView: Boolean(row.can_view_flag), canExport: Boolean(row.can_export_flag), canComment: Boolean(row.can_comment_flag), canDownloadRaw: Boolean(row.can_download_raw_flag) })) : permissions);
  res.json({ success: true, generatedAt: new Date().toISOString(), ...result });
}));

router.get("/shares", asyncHandler(async (_req, res) => {
  const sql = `SELECT * FROM ${qid(DB.APP)}.cm_client_portal_share_log ORDER BY created_at DESC LIMIT 100`;
  const result = await readOrFallback(sql, shareLogs, (rows) => rows.length ? rows.map((row) => ({ module: row.module_key, sharedTo: row.shared_to_email, status: row.share_status, expiresAt: row.expires_at || "No expiry" })) : shareLogs);
  res.json({ success: true, generatedAt: new Date().toISOString(), ...result });
}));

router.get("/approval-queue", (_req, res) => {
  res.json({ success: true, source: "demo_fallback", generatedAt: new Date().toISOString(), data: approvalQueue });
});

router.get("/watermark-policy", (_req, res) => {
  res.json({ success: true, source: "demo_fallback", generatedAt: new Date().toISOString(), data: watermarkPolicy });
});

router.get("/access-audit", (_req, res) => {
  res.json({ success: true, source: "demo_fallback", generatedAt: new Date().toISOString(), data: accessAudit });
});

router.get("/sso-mfa-readiness", (_req, res) => {
  res.json({
    success: true,
    data: [
      { check: "SSO provider config", status: "NEXT", detail: "Add provider metadata and callback URL." },
      { check: "MFA enforcement", status: "NEXT", detail: "Require MFA for admin and client portal roles." },
      { check: "Session expiry", status: "READY", detail: "JWT/session policy can enforce short-lived portal sessions." },
      { check: "Raw data protection", status: "BLOCKED", detail: "Raw downloads remain disabled for client roles." }
    ]
  });
});

router.get("/readiness", (_req, res) => {
  res.json({
    success: true,
    data: [
      { check: "Portal user persistence", status: "PARTIAL", detail: "Users endpoint attempts app-owned DB first, then fallback." },
      { check: "Role permission matrix", status: "PARTIAL", detail: "Permissions endpoint attempts app-owned DB first, then fallback." },
      { check: "Share log", status: "PARTIAL", detail: "Share log endpoint attempts app-owned DB first, then fallback." },
      { check: "Share approval workflow", status: "DESIGNED", detail: "Approval queue endpoint added." },
      { check: "Export watermarking", status: "DESIGNED", detail: "Watermark policy endpoint added." },
      { check: "Portal access audit", status: "DESIGNED", detail: "Access audit endpoint added." },
      { check: "Raw data download", status: "BLOCKED", detail: "Raw downloads remain disabled by default for client roles." }
    ]
  });
});

export default router;

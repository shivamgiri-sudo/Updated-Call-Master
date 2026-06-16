import type { NextFunction, Request, Response } from "express";
import { DB, pool, qid } from "../config/db";

type PortalAuditOptions = {
  moduleKey?: string;
  eventType?: string;
  watermarkApplied?: boolean;
};

export function portalAudit(options: PortalAuditOptions = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.on("finish", () => {
      const status = res.statusCode >= 200 && res.statusCode < 400 ? "ALLOWED" : "BLOCKED";
      const sql = `
        INSERT INTO ${qid(DB.APP)}.cm_client_portal_access_audit
          (tenant_id, client_id, portal_user_id, event_type, module_key, access_status, ip_address, user_agent, watermark_applied_flag)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [
        Number(req.headers["x-tenant-id"] || 1),
        Number(req.headers["x-client-id"] || 0),
        Number(req.headers["x-portal-user-id"] || 0) || null,
        options.eventType || req.method,
        options.moduleKey || String(req.path || "client_portal"),
        status,
        req.ip || null,
        req.headers["user-agent"] || null,
        options.watermarkApplied ? 1 : 0
      ];
      pool.query(sql, params).catch(() => undefined);
    });
    next();
  };
}

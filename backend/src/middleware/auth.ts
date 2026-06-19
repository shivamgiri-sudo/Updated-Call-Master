import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { DB, pool, qid } from "../config/db";

export interface AuthUser {
  user_id: number;
  employee_code: string | null;
  full_name: string;
  login_id: string;
  role_code: string;
  branch_short_name: string | null;
}

export interface ProcessScope {
  scope_type: "ALL" | "BRANCH" | "PROCESS" | "SELF";
  branch_short_name?: string;
  process_name?: string;
  process_code?: string;
  employee_code?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  scopes?: ProcessScope[];
}

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const AUTH_MODE = process.env.AUTH_MODE ?? "dev";

// Lightweight in-process auth cache (avoids 2 DB queries per request)
const authCache = new Map<number, { user: AuthUser; scopes: ProcessScope[]; expiresAt: number }>();
const AUTH_CACHE_TTL_MS = 60_000; // 1 minute

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  if (AUTH_MODE === "dev") {
    const devUserId = Number(process.env.DEV_USER_ID) || 1;
    const devRole = process.env.DEV_ROLE || "ADMIN";
    const devEmployeeCode = process.env.DEV_EMPLOYEE_CODE || null;

    req.user = {
      user_id: devUserId,
      employee_code: devEmployeeCode,
      full_name: "Dev User",
      login_id: "dev",
      role_code: devRole,
      branch_short_name: null,
    };

    const [scopeRows]: any = await pool.query(
      `SELECT usm.scope_type, usm.branch_short_name, usm.process_name,
              pm.process_code, usm.employee_code
       FROM ${qid(DB.APP)}.user_scope_mapping usm
       LEFT JOIN ${qid(DB.APP)}.ci_process_master pm
         ON LOWER(TRIM(usm.process_name)) = LOWER(TRIM(pm.process_name))
       WHERE usm.user_id = ? AND usm.active_status = 1`,
      [devUserId]
    );
    req.scopes = scopeRows || [];

    return next();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId: number = decoded.user_id;

    // Cache hit: skip both DB queries
    const cached = authCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      req.user = cached.user;
      req.scopes = cached.scopes;
      return next();
    }

    const [rows]: any = await pool.query(
      `SELECT user_id, employee_code, full_name, login_id, role_code, branch_short_name
       FROM ${qid(DB.APP)}.user_master
       WHERE user_id = ? AND active_status = 1 AND account_locked = 0`,
      [userId]
    );

    if (!rows || rows.length === 0) {
      authCache.delete(userId);
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const user: AuthUser = rows[0];

    const [scopeRows]: any = await pool.query(
      `SELECT usm.scope_type, usm.branch_short_name, usm.process_name,
              pm.process_code, usm.employee_code
       FROM ${qid(DB.APP)}.user_scope_mapping usm
       LEFT JOIN ${qid(DB.APP)}.ci_process_master pm
         ON LOWER(TRIM(usm.process_name)) = LOWER(TRIM(pm.process_name))
       WHERE usm.user_id = ? AND usm.active_status = 1`,
      [userId]
    );
    const scopes: ProcessScope[] = scopeRows || [];

    authCache.set(userId, { user, scopes, expiresAt: Date.now() + AUTH_CACHE_TTL_MS });

    req.user = user;
    req.scopes = scopes;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: "Invalid or expired token" });
  }
}

export function hasProcessAccess(scopes: ProcessScope[], processCode?: string): boolean {
  if (!processCode) return true;
  if (scopes.some((s) => s.scope_type === "ALL")) return true;
  // Compare against resolved process_code (from ci_process_master join)
  // Fall back to process_name for backwards compatibility if join produced no code
  return scopes.some(
    (s) => s.process_code === processCode || (!s.process_code && s.process_name === processCode)
  );
}

export function getAccessibleProcessCodes(scopes: ProcessScope[]): string[] | null {
  if (scopes.some((s) => s.scope_type === "ALL")) return null;
  return scopes
    .filter((s) => s.process_code || s.process_name)
    .map((s) => s.process_code ?? s.process_name!);
}

export function requireProcessAccess(req: AuthRequest, res: Response, next: NextFunction) {
  const processCode = req.query.processCode as string | undefined;

  if (!processCode) {
    return next();
  }

  if (!hasProcessAccess(req.scopes || [], processCode)) {
    return res.status(403).json({ success: false, message: "Access denied to this process" });
  }

  next();
}

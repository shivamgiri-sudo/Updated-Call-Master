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
  employee_code?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  scopes?: ProcessScope[];
}

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const AUTH_MODE = process.env.AUTH_MODE || "dev";

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
      `SELECT scope_type, branch_short_name, process_name, employee_code
       FROM ${qid(DB.APP)}.user_scope_mapping
       WHERE user_id = ? AND active_status = 1`,
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

    const [rows]: any = await pool.query(
      `SELECT user_id, employee_code, full_name, login_id, role_code, branch_short_name
       FROM ${qid(DB.APP)}.user_master
       WHERE user_id = ? AND active_status = 1 AND account_locked = 0`,
      [decoded.user_id]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const user = rows[0];
    req.user = user;

    const [scopeRows]: any = await pool.query(
      `SELECT scope_type, branch_short_name, process_name, employee_code
       FROM ${qid(DB.APP)}.user_scope_mapping
       WHERE user_id = ? AND active_status = 1`,
      [user.user_id]
    );
    req.scopes = scopeRows || [];

    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: "Invalid or expired token" });
  }
}

export function hasProcessAccess(scopes: ProcessScope[], processCode?: string): boolean {
  if (!processCode) return true;
  if (scopes.some((s) => s.scope_type === "ALL")) return true;
  return scopes.some((s) => s.process_name === processCode);
}

export function getAccessibleProcessCodes(scopes: ProcessScope[]): string[] | null {
  if (scopes.some((s) => s.scope_type === "ALL")) return null;
  return scopes.filter((s) => s.process_name).map((s) => s.process_name!);
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

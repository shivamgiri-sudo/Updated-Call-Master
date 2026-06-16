import type { NextFunction, Request, Response } from "express";

export function requireStepUp(req: Request, res: Response, next: NextFunction) {
  const devMode = String(process.env.AUTH_MODE || "").toLowerCase() === "dev";
  if (devMode) return next();

  const ok = String(req.headers["x-step-up-verified"] || "").toLowerCase() === "true";
  if (!ok) {
    return res.status(403).json({
      success: false,
      message: "Additional verification required",
      code: "STEP_UP_REQUIRED"
    });
  }

  return next();
}

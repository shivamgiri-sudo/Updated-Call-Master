// backend/src/middleware/authV1.ts
// New JWT middleware for /api/v1 routes — uses cm_users table
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: User;
}

const authService = new AuthService();
const userRepo = new UserRepository();

// In-memory cache for verified JWT tokens (60s TTL)
const authCache = new Map<string, { user: User; expiresAt: number }>();
const CACHE_TTL = 60_000;

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: 'AUTH_TOKEN_MISSING', message: 'Access token is required' },
    });
    return;
  }

  // Cache hit
  const cached = authCache.get(token);
  if (cached && Date.now() < cached.expiresAt) {
    req.user = cached.user;
    return next();
  }

  // Verify JWT
  const payload = authService.verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({
      success: false,
      error: { code: 'AUTH_TOKEN_INVALID', message: 'Invalid or expired access token' },
    });
    return;
  }

  // Load user from cm_users
  const user = await userRepo.findById(Number(payload.sub));
  if (!user) {
    res.status(401).json({
      success: false,
      error: { code: 'AUTH_USER_NOT_FOUND', message: 'User not found or inactive' },
    });
    return;
  }

  authCache.set(token, { user, expiresAt: Date.now() + CACHE_TTL });
  req.user = user;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: { code: 'AUTH_FORBIDDEN', message: 'Insufficient permissions' },
      });
      return;
    }
    next();
  };
}

// Applies data scope: forces processCode/branchCode query params to user's allowed scope
export function enforceDataScope(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (req.user && req.user.role !== 'CEO') {
    if (req.user.processCodes && req.user.processCodes.length > 0) {
      const requested = req.query.processCode as string | undefined;
      if (!requested || !req.user.processCodes.includes(requested)) {
        req.query.processCode = req.user.processCodes[0];
      }
    }
    if (req.user.branchCodes && req.user.branchCodes.length > 0) {
      const requested = req.query.branchCode as string | undefined;
      if (!requested || !req.user.branchCodes.includes(requested)) {
        req.query.branchCode = req.user.branchCodes[0];
      }
    }
  }
  next();
}

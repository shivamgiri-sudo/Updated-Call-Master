// backend/src/routes/v1/auth.routes.ts
import { Router, Response } from 'express';
import { AuthService } from '../../services/AuthService';
import { validate } from '../../middleware/validation';
import { loginSchema, refreshSchema, logoutSchema } from '../../validators/auth.validators';
import { authenticateToken, AuthRequest } from '../../middleware/authV1';
import { asyncHandler } from '../../utils/asyncHandler';
import { toUserDTO } from '../../models/User';

const router = Router();
const authService = new AuthService();

// POST /api/v1/auth/login
router.post('/login', validate(loginSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  if (!result) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid email or password' },
    });
  }

  res.json({ success: true, data: result });
}));

// POST /api/v1/auth/refresh
router.post('/refresh', validate(refreshSchema), asyncHandler(async (_req: AuthRequest, res: Response) => {
  const { refreshToken } = _req.body;
  const result = await authService.refresh(refreshToken);

  if (!result) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_REFRESH_INVALID', message: 'Invalid or expired refresh token' },
    });
  }

  res.json({ success: true, data: { ...result, expiresIn: 86400 } });
}));

// POST /api/v1/auth/logout
router.post('/logout', validate(logoutSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.logout(req.body.refreshToken);
  res.json({ success: true, message: 'Logged out successfully' });
}));

// GET /api/v1/auth/me
router.get('/me', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_UNAUTHORIZED', message: 'Authentication required' },
    });
  }
  res.json({ success: true, data: toUserDTO(req.user) });
}));

export default router;

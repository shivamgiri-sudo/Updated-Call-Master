// backend/src/routes/v1/executive.routes.ts
import { Router, Response } from 'express';
import { authenticateToken, enforceDataScope, requireRole, AuthRequest } from '../../middleware/authV1';
import { asyncHandler } from '../../utils/asyncHandler';
import { MetricsService } from '../../services/MetricsService';
import { summaryQuerySchema } from '../../validators/executive.validators';

const router = Router();
const metrics = new MetricsService();

function parseDates(req: AuthRequest) {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  return {
    from: (req.query.from as string) || thirtyDaysAgo,
    to: (req.query.to as string) || today,
  };
}

function buildScope(req: AuthRequest) {
  return {
    clientId: req.user!.clientId,
    processCodes: req.user!.processCodes,
    branchCodes: req.user!.branchCodes,
    processCode: req.query.processCode as string | undefined,
    branchCode: req.query.branchCode as string | undefined,
  };
}

// GET /api/v1/executive/summary
router.get(
  '/summary',
  authenticateToken,
  enforceDataScope,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsed = summaryQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: parsed.error.errors },
      });
    }

    const dates = parseDates(req);
    const scope = buildScope(req);
    const data = await metrics.getExecutiveSummary(scope, dates);

    res.json({ success: true, data: { ...data, dateRange: dates } });
  })
);

// GET /api/v1/executive/process-scorecard
router.get(
  '/process-scorecard',
  authenticateToken,
  enforceDataScope,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const dates = parseDates(req);
    const scope = buildScope(req);
    const processes = await metrics.getProcessScorecard(scope, dates);

    res.json({ success: true, data: { processes, dateRange: dates } });
  })
);

// GET /api/v1/executive/revenue-forecast
router.get(
  '/revenue-forecast',
  authenticateToken,
  requireRole('CEO', 'PROCESS_HEAD'),
  enforceDataScope,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const dates = parseDates(req);
    const scope = buildScope(req);
    const forecast = await metrics.getRevenueForecast(scope, dates);

    res.json({ success: true, data: forecast });
  })
);

export default router;

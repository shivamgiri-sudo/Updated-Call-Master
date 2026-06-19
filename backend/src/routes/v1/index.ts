// backend/src/routes/v1/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import executiveRoutes from './executive.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/executive', executiveRoutes);

export default router;

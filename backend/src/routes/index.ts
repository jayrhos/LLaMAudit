import { Router } from 'express';
import analysisRoutes from './analysis';
import settingsRoutes from './settings';
import pdfRoutes from './pdf';
import exportRoutes from './export';

const router = Router();

router.use('/analysis', analysisRoutes);
router.use('/settings', settingsRoutes);
router.use('/pdf', pdfRoutes);
router.use('/export', exportRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;

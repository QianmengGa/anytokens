import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller.js';

const router = Router();

// GET /api/v1/health — 健康检查
router.get('/health', healthCheck);

export default router;

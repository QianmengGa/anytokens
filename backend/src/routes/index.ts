import { Router } from 'express';
import healthRouter from './health.js';
import authRouter from './auth.js';
import keysRouter from './keys.js';

const router = Router();

// 挂载各模块路由
router.use(healthRouter);
router.use('/auth', authRouter);
router.use('/keys', keysRouter);

export default router;


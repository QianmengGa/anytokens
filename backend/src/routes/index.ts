import { Router } from 'express';
import healthRouter from './health.js';
import authRouter from './auth.js';
import keysRouter from './keys.js';
import proxyRouter from './proxy.js';

const router = Router();

// 挂载各模块路由
router.use(healthRouter);
router.use('/auth', authRouter);
router.use('/keys', keysRouter);
router.use(proxyRouter);

export default router;


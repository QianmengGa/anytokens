import { Router } from 'express';
import healthRouter from './health.js';
import authRouter from './auth.js';
import keysRouter from './keys.js';
import proxyRouter from './proxy.js';
import userRouter from './user.js';
import playgroundRouter from './playground.js';
import adminRouter from './admin.js';
import paymentRouter from './payment.js';
import cryptoPaymentRouter from './crypto-payment.js';
import teamRouter from './team.js';
import auditRouter from './audit.js';
import resellerRouter from './reseller.js';
import embeddingsRouter from './embeddings.js';
import imagesRouter from './images.js';
import audioRouter from './audio.js';

const router = Router();

// 挂载各模块路由
router.use(healthRouter);
router.use('/auth', authRouter);
router.use('/keys', keysRouter);
router.use('/user', userRouter);
router.use('/playground', playgroundRouter);
router.use('/admin', adminRouter);
router.use('/payment', paymentRouter);
router.use('/crypto-payment', cryptoPaymentRouter);
router.use('/team', teamRouter);
router.use('/audit', auditRouter);
router.use('/reseller', resellerRouter);
router.use(embeddingsRouter);    // POST /embeddings
router.use(imagesRouter);        // POST /images/generations
router.use(audioRouter);         // POST /audio/speech
router.use(proxyRouter);

export default router;


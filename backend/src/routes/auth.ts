import { Router } from 'express';
import { sendCode, register, login, getMe } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// POST /api/v1/auth/send-code — 发送注册验证码
router.post('/send-code', sendCode);

// POST /api/v1/auth/register — 用户注册
router.post('/register', register);

// POST /api/v1/auth/login — 用户登录
router.post('/login', login);

// GET /api/v1/auth/me — 获取当前用户信息（需认证）
router.get('/me', authenticate, getMe);

export default router;

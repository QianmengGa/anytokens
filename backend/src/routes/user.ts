import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getDashboardStats, updateProfile, sendEmailCode, updateEmail, updatePassword, getSpendingLimits, updateSpendingLimits, getRoutingStrategy, updateRoutingStrategy } from '../controllers/user.controller.js';

const userRouter = Router();

// 所有 user 路由需要认证
userRouter.use(authenticate as any);

// GET /user/dashboard-stats — Dashboard 统计数据
userRouter.get('/dashboard-stats', getDashboardStats as any);

// PATCH /user/profile — 更新个人资料（用户名/电话）
userRouter.patch('/profile', updateProfile as any);

// POST /user/send-email-code — 发送邮箱验证码（修改邮箱用）
userRouter.post('/send-email-code', sendEmailCode as any);

// PATCH /user/email — 修改邮箱
userRouter.patch('/email', updateEmail as any);

// PATCH /user/password — 修改密码
userRouter.patch('/password', updatePassword as any);

// GET /user/spending-limits — 获取消费限额
userRouter.get('/spending-limits', getSpendingLimits as any);

// PATCH /user/spending-limits — 更新消费限额
userRouter.patch('/spending-limits', updateSpendingLimits as any);

// GET /user/routing-strategy — 获取路由策略
userRouter.get('/routing-strategy', getRoutingStrategy as any);

// PATCH /user/routing-strategy — 更新路由策略
userRouter.patch('/routing-strategy', updateRoutingStrategy as any);

export default userRouter;

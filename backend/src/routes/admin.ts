import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import * as adminController from '../controllers/admin.controller.js';

const router = Router();

// 所有管理后台接口需要认证 + 管理员权限
router.use(authenticate, requireAdmin);

// 用户管理
router.get('/users', adminController.getUsers);
router.patch('/users/:id/balance', adminController.adjustBalance);
router.patch('/users/:id/ban', adminController.toggleBan);

// 平台统计
router.get('/stats', adminController.getStats);
router.get('/stats/daily', adminController.getDailyStats);
router.get('/stats/token-ranking', adminController.getTokenRanking);

// 充值记录
router.get('/transactions', adminController.getTransactions);

// 使用记录
router.get('/usage', adminController.getUsageLogs);

// 管理员个人消耗
router.get('/my-usage', adminController.getMyUsage);

// 供应商余额
router.get('/providers/balance', adminController.getProviderBalances);

// 系统设置
router.get('/settings', adminController.getSettings);
router.patch('/settings', adminController.updateSettings);

export default router;

import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../config/database.js';
import { getDashboardStats, updateProfile, sendEmailCode, updateEmail, updatePassword, getSpendingLimits, updateSpendingLimits, getRoutingStrategy, updateRoutingStrategy, getReferralStats } from '../controllers/user.controller.js';
import { success } from '../utils/response.js';
import type { AuthRequest } from '../types/index.js';

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

// GET /user/referral — 获取邀请统计
userRouter.get('/referral', getReferralStats as any);

// GET /user/routing-strategy — 获取路由策略
userRouter.get('/routing-strategy', getRoutingStrategy as any);

// PATCH /user/routing-strategy — 更新路由策略
userRouter.patch('/routing-strategy', updateRoutingStrategy as any);

// ==================== 数据导出 ====================

const MAX_EXPORT = 10000;

function toCsvRow(values: (string | number | null)[]): string {
  return values.map((v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',');
}

function parseDateRange(startDate?: string, endDate?: string, defaultDays = 30) {
  const end = endDate ? new Date(endDate + 'T23:59:59.999Z') : new Date();
  const start = startDate ? new Date(startDate + 'T00:00:00.000Z') : new Date(end.getTime() - defaultDays * 86400000);
  return { start, end };
}

// GET /user/export/usage — 导出用量记录
userRouter.get('/export/usage', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const format = (req.query.format as string) || 'json';
    const { start, end } = parseDateRange(req.query.startDate as string, req.query.endDate as string, 30);

    const logs = await prisma.usageLog.findMany({
      where: { userId, createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: 'desc' },
      take: MAX_EXPORT,
      select: {
        id: true,
        model: true,
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        cost: true,
        latencyMs: true,
        status: true,
        createdAt: true,
      },
    });

    if (format === 'csv') {
      const header = 'Date,Model,Input Tokens,Output Tokens,Total Tokens,Cost (USD),Latency (ms),Status,Request ID';
      const rows = logs.map((l) => toCsvRow([
        l.createdAt.toISOString(),
        l.model,
        l.promptTokens,
        l.completionTokens,
        l.totalTokens,
        Number(l.cost).toFixed(8),
        l.latencyMs,
        l.status,
        l.id,
      ]));
      const csv = [header, ...rows].join('\n');
      const date = new Date().toISOString().slice(0, 10);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="usage-${date}.csv"`);
      res.send(csv);
      return;
    }

    return success(res, logs);
  } catch (err) {
    next(err);
  }
});

// GET /user/export/invoices — 导出充值记录
userRouter.get('/export/invoices', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const format = (req.query.format as string) || 'json';
    const { start, end } = parseDateRange(req.query.startDate as string, req.query.endDate as string, 90);

    const transactions = await prisma.transaction.findMany({
      where: { userId, type: 'TOPUP', createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        paymentMethod: true,
        status: true,
        externalId: true,
        description: true,
        createdAt: true,
      },
    });

    if (format === 'csv') {
      const header = 'Date,Amount (USD),Payment Method,Status,Transaction ID,Description';
      const rows = transactions.map((t) => toCsvRow([
        t.createdAt.toISOString(),
        Number(t.amount).toFixed(2),
        t.paymentMethod,
        t.status,
        t.id,
        t.description,
      ]));
      const csv = [header, ...rows].join('\n');
      const date = new Date().toISOString().slice(0, 10);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="invoices-${date}.csv"`);
      res.send(csv);
      return;
    }

    return success(res, transactions);
  } catch (err) {
    next(err);
  }
});

export default userRouter;

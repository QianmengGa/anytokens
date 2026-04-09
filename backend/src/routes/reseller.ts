import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { resellerService } from '../services/reseller.service.js';
import { success } from '../utils/response.js';
import type { AuthRequest } from '../types/index.js';

const resellerRouter = Router();

// ========== 申请（普通用户） ==========

// POST /reseller/apply — 提交 Reseller 申请
resellerRouter.post('/apply', authenticate as any, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = z.object({
      companyName: z.string().min(1).max(100),
      monthlyUsage: z.string().min(1).max(50),
      description: z.string().min(10).max(1000),
    }).parse(req.body);
    const result = await resellerService.apply(req.user!.id, body);
    return success(res, result, '申请已提交', 201);
  } catch (err) { next(err); }
});

// GET /reseller/application — 查看自己的申请状态
resellerRouter.get('/application', authenticate as any, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await resellerService.getMyApplication(req.user!.id);
    return success(res, result);
  } catch (err) { next(err); }
});

// ========== Reseller 管理（需 RESELLER 角色） ==========

// GET /reseller/stats — Reseller 收入统计
resellerRouter.get('/stats', authenticate as any, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await resellerService.getResellerStats(req.user!.id);
    return success(res, result);
  } catch (err) { next(err); }
});

// POST /reseller/sub-accounts — 创建子账户
resellerRouter.post('/sub-accounts', authenticate as any, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = z.object({
      name: z.string().min(1).max(50),
      email: z.string().email().optional(),
      priceMarkup: z.number().min(1).max(10).optional(),
    }).parse(req.body);
    const result = await resellerService.createSubAccount(req.user!.id, body);
    return success(res, result, '子账户创建成功', 201);
  } catch (err) { next(err); }
});

// GET /reseller/sub-accounts — 列出子账户
resellerRouter.get('/sub-accounts', authenticate as any, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await resellerService.listSubAccounts(req.user!.id);
    return success(res, result);
  } catch (err) { next(err); }
});

// POST /reseller/sub-accounts/:id/topup — 给子账户充值
resellerRouter.post('/sub-accounts/:id/topup', authenticate as any, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { amount } = z.object({ amount: z.number().min(0.01).max(10000) }).parse(req.body);
    const subId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await resellerService.topUpSubAccount(req.user!.id, subId, amount);
    return success(res, result);
  } catch (err) { next(err); }
});

// PATCH /reseller/sub-accounts/:id/markup — 更新加价倍率
resellerRouter.patch('/sub-accounts/:id/markup', authenticate as any, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { priceMarkup } = z.object({ priceMarkup: z.number().min(1).max(10) }).parse(req.body);
    const subId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await resellerService.updateMarkup(req.user!.id, subId, priceMarkup);
    return success(res, result, '加价倍率已更新');
  } catch (err) { next(err); }
});

// ========== 管理员审批 ==========

// GET /reseller/admin/applications — 列出所有申请
resellerRouter.get('/admin/applications', authenticate as any, requireAdmin as any, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;
    const result = await resellerService.listApplications(status);
    return success(res, result);
  } catch (err) { next(err); }
});

// PATCH /reseller/admin/applications/:id — 审批申请
resellerRouter.patch('/admin/applications/:id', authenticate as any, requireAdmin as any, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { approved, reviewNote } = z.object({
      approved: z.boolean(),
      reviewNote: z.string().max(500).optional(),
    }).parse(req.body);
    const appId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await resellerService.reviewApplication(appId, approved, reviewNote);
    return success(res, result, approved ? '已批准' : '已拒绝');
  } catch (err) { next(err); }
});

// GET /reseller/admin/resellers — 列出所有 Reseller
resellerRouter.get('/admin/resellers', authenticate as any, requireAdmin as any, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await resellerService.listResellers();
    return success(res, result);
  } catch (err) { next(err); }
});

export default resellerRouter;

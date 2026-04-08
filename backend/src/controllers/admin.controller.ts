import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { adminService } from '../services/admin.service.js';
import { success } from '../utils/response.js';
import type { AuthRequest } from '../types/index.js';

// ========== 用户管理 ==========

export async function getUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const search = (req.query.search as string) || undefined;
    const sortBy = (req.query.sortBy as string) || undefined;
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

    const result = await adminService.getUsers(page, pageSize, search, sortBy, sortOrder);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

const adjustBalanceSchema = z.object({
  amount: z.number().refine((v) => v !== 0, '金额不能为 0'),
  description: z.string().max(200).optional().default(''),
});

export async function adjustBalance(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { amount, description } = adjustBalanceSchema.parse(req.body);
    const result = await adminService.adjustBalance(req.params.id as string, amount, description);
    return success(res, result, '余额调整成功');
  } catch (err) {
    next(err);
  }
}

const toggleBanSchema = z.object({
  isActive: z.boolean(),
});

export async function toggleBan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { isActive } = toggleBanSchema.parse(req.body);
    const result = await adminService.toggleBan(req.params.id as string, isActive);
    return success(res, result, isActive ? '已解封' : '已封禁');
  } catch (err) {
    next(err);
  }
}

// ========== 平台统计 ==========

export async function getStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await adminService.getStats();
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getDailyStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await adminService.getDailyStats();
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getTokenRanking(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await adminService.getTokenRanking();
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

// ========== 充值记录 ==========

export async function getTransactions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const filters = {
      userId: (req.query.userId as string) || undefined,
      type: (req.query.type as string) || undefined,
      startDate: (req.query.startDate as string) || undefined,
      endDate: (req.query.endDate as string) || undefined,
    };
    const result = await adminService.getTransactions(page, pageSize, filters);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

// ========== 使用记录 ==========

export async function getUsageLogs(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const filters = {
      userId: (req.query.userId as string) || undefined,
      model: (req.query.model as string) || undefined,
      startDate: (req.query.startDate as string) || undefined,
      endDate: (req.query.endDate as string) || undefined,
    };
    const result = await adminService.getUsageLogs(page, pageSize, filters);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

// ========== 供应商余额 ==========

export async function getProviderBalances(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await adminService.getProviderBalances();
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

// ========== 管理员个人消耗 ==========

export async function getMyUsage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const period = (req.query.period as string) || 'today';
    const startDate = (req.query.startDate as string) || undefined;
    const endDate = (req.query.endDate as string) || undefined;
    const result = await adminService.getMyUsage(req.user!.id, period, startDate, endDate);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

// ========== 系统设置 ==========

export async function getSettings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await adminService.getSettings();
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

const updateSettingsSchema = z.object({
  signup_bonus: z.string().optional(),
  max_per_request: z.string().optional(),
  announcement: z.string().optional(),
  maintenance_mode: z.string().optional(),
});

export async function updateSettings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = updateSettingsSchema.parse(req.body);
    const updates: Record<string, string> = {};
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined) updates[key] = value;
    }
    const result = await adminService.updateSettings(updates);
    return success(res, result, '设置已更新');
  } catch (err) {
    next(err);
  }
}

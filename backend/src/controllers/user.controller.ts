import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { userService } from '../services/user.service.js';
import { providerHealth } from '../services/provider-health.js';
import { success } from '../utils/response.js';
import type { AuthRequest } from '../types/index.js';

const profileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  phone: z.string().max(20).optional(),
});

const emailSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  code: z.string().length(6, '验证码为 6 位数字'),
});

const passwordSchema = z.object({
  oldPassword: z.string().min(1, '请输入旧密码'),
  newPassword: z.string().min(8, '新密码至少 8 位').max(100),
});

const sendCodeSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
});

const spendingLimitsSchema = z.object({
  maxPerRequest: z.number().min(0.01).max(10).nullable().optional(),
  maxPerDay: z.number().min(0.01).max(10000).nullable().optional(),
  maxPerMonth: z.number().min(0.01).max(100000).nullable().optional(),
});

// Dashboard 统计
export async function getDashboardStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await userService.getDashboardStats(req.user!.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

// 更新个人资料
export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = profileSchema.parse(req.body);
    const result = await userService.updateProfile(req.user!.id, body);
    return success(res, result, '资料更新成功');
  } catch (err) {
    next(err);
  }
}

// 发送邮箱验证码
export async function sendEmailCode(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = sendCodeSchema.parse(req.body);
    const result = await userService.sendEmailCode(body.email);
    return success(res, result, '验证码已发送');
  } catch (err) {
    next(err);
  }
}

// 修改邮箱
export async function updateEmail(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = emailSchema.parse(req.body);
    const result = await userService.updateEmail(req.user!.id, body.email, body.code);
    return success(res, result, '邮箱修改成功');
  } catch (err) {
    next(err);
  }
}

// 获取消费限额
export async function getSpendingLimits(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await userService.getSpendingLimits(req.user!.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

// 更新消费限额
export async function updateSpendingLimits(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = spendingLimitsSchema.parse(req.body);
    const result = await userService.updateSpendingLimits(req.user!.id, body);
    return success(res, result, '限额设置已保存');
  } catch (err) {
    next(err);
  }
}

// 获取路由策略 + 供应商实时指标
export async function getRoutingStrategy(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await userService.getRoutingStrategy(req.user!.id);
    return success(res, {
      ...result,
      providerMetrics: providerHealth.getAllMetrics(),
    });
  } catch (err) {
    next(err);
  }
}

// 更新路由策略
export async function updateRoutingStrategy(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { strategy } = req.body;
    if (!strategy || !['price', 'speed', 'quality'].includes(strategy)) {
      throw new Error('strategy 必须为 price、speed 或 quality');
    }
    const result = await userService.updateRoutingStrategy(req.user!.id, strategy);
    return success(res, result, '路由策略已更新');
  } catch (err) {
    next(err);
  }
}

// 修改密码
export async function updatePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = passwordSchema.parse(req.body);
    const result = await userService.updatePassword(req.user!.id, body.oldPassword, body.newPassword);
    return success(res, result, '密码修改成功');
  } catch (err) {
    next(err);
  }
}

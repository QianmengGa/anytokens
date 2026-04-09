import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { keysService } from '../services/keys.service.js';
import { prisma } from '../config/database.js';
import { redis } from '../config/redis.js';
import { success } from '../utils/response.js';
import { Errors } from '../utils/errors.js';
import type { AuthRequest } from '../types/index.js';

// 创建 Key 参数校验
const createKeySchema = z.object({
  name: z.string().min(1, '名称不能为空').max(50, '名称最长 50 字符').optional(),
});

// 创建新 API Key
export async function createKey(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = createKeySchema.parse(req.body);
    const result = await keysService.createKey(req.user!.id, body.name || 'Default Key');
    return success(res, result, 'API Key 创建成功', 201);
  } catch (err) {
    next(err);
  }
}

// 列出用户所有 Key
export async function listKeys(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const keys = await keysService.listKeys(req.user!.id);
    return success(res, keys);
  } catch (err) {
    next(err);
  }
}

// 删除 Key
export async function deleteKey(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const result = await keysService.deleteKey(req.user!.id, id);
    return success(res, result, '已删除');
  } catch (err) {
    next(err);
  }
}

// 查看单个 Key 用量
export async function getKeyUsage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const result = await keysService.getKeyUsage(req.user!.id, id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

// 更新 Key 速率限制
const updateRateLimitSchema = z.object({
  rateLimit: z.number().int().min(1).max(10000).nullable().optional(),
  dailyLimit: z.number().int().min(1).max(1000000).nullable().optional(),
  monthlyLimit: z.number().int().min(1).max(10000000).nullable().optional(),
});

export async function updateKeyRateLimit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const keyId = req.params.id as string;
    const userId = req.user!.id;
    const body = updateRateLimitSchema.parse(req.body);

    // 验证 Key 归属
    const key = await prisma.apiKey.findFirst({
      where: { id: keyId, userId, isActive: true },
    });
    if (!key) {
      throw Errors.notFound('API Key 不存在');
    }

    // 更新限制
    const updated = await prisma.apiKey.update({
      where: { id: keyId },
      data: {
        ...(body.rateLimit !== undefined && { rateLimit: body.rateLimit }),
        ...(body.dailyLimit !== undefined && { dailyLimit: body.dailyLimit }),
        ...(body.monthlyLimit !== undefined && { monthlyLimit: body.monthlyLimit }),
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        rateLimit: true,
        dailyLimit: true,
        monthlyLimit: true,
        isActive: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    return success(res, updated, '速率限制已更新');
  } catch (err) {
    next(err);
  }
}

// 查看 Key 当前速率计数器
export async function getKeyRateLimitUsage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const keyId = req.params.id as string;
    const userId = req.user!.id;

    // 验证 Key 归属
    const key = await prisma.apiKey.findFirst({
      where: { id: keyId, userId, isActive: true },
      select: { id: true, rateLimit: true, dailyLimit: true, monthlyLimit: true },
    });
    if (!key) {
      throw Errors.notFound('API Key 不存在');
    }

    // 从 Redis 读取当前计数
    const minuteBucket = Math.floor(Date.now() / 60000);
    const dayBucket = new Date().toISOString().slice(0, 10);
    const monthBucket = new Date().toISOString().slice(0, 7);

    const [minVal, dayVal, monthVal] = await Promise.all([
      redis.get(`ratelimit:min:${keyId}:${minuteBucket}`),
      redis.get(`ratelimit:day:${keyId}:${dayBucket}`),
      redis.get(`ratelimit:month:${keyId}:${monthBucket}`),
    ]);

    return success(res, {
      currentMinute: parseInt(minVal || '0', 10),
      currentDay: parseInt(dayVal || '0', 10),
      currentMonth: parseInt(monthVal || '0', 10),
      limits: {
        rateLimit: key.rateLimit,
        dailyLimit: key.dailyLimit,
        monthlyLimit: key.monthlyLimit,
      },
    });
  } catch (err) {
    next(err);
  }
}

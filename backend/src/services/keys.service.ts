import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { Errors } from '../utils/errors.js';

// API Key 前缀
const KEY_PREFIX = 'sk-any-';
// Key 长度（不含前缀）
const KEY_LENGTH = 48;
// 每个用户最大 Key 数量
const MAX_KEYS_PER_USER = 10;

class KeysService {
  // 生成新 API Key
  async createKey(userId: string, name: string) {
    // 检查用户 Key 数量上限
    const count = await prisma.apiKey.count({
      where: { userId, isActive: true },
    });
    if (count >= MAX_KEYS_PER_USER) {
      throw Errors.badRequest(`最多创建 ${MAX_KEYS_PER_USER} 个 API Key`);
    }

    // 生成随机 Key
    const rawKey = KEY_PREFIX + crypto.randomBytes(KEY_LENGTH).toString('base64url').slice(0, KEY_LENGTH);
    const keyPrefix = rawKey.slice(0, 12);
    const keyHash = await bcrypt.hash(rawKey, 10);

    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        name: name || 'Default Key',
        keyHash,
        keyPrefix,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        isActive: true,
        rateLimit: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    // 返回完整 Key（仅此一次）
    return {
      ...apiKey,
      key: rawKey,
    };
  }

  // 列出用户所有 Key
  async listKeys(userId: string) {
    const keys = await prisma.apiKey.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        rateLimit: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return keys;
  }

  // 删除 Key（软删除）
  async deleteKey(userId: string, keyId: string) {
    const key = await prisma.apiKey.findFirst({
      where: { id: keyId, userId, isActive: true },
    });
    if (!key) {
      throw Errors.notFound('API Key 不存在');
    }

    await prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    return { message: '已删除' };
  }

  // 查看单个 Key 用量统计
  async getKeyUsage(userId: string, keyId: string) {
    // 验证 Key 归属
    const key = await prisma.apiKey.findFirst({
      where: { id: keyId, userId },
    });
    if (!key) {
      throw Errors.notFound('API Key 不存在');
    }

    // 今日用量
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalStats, todayStats, modelGroupBy] = await Promise.all([
      // 总用量
      prisma.usageLog.aggregate({
        where: { apiKeyId: keyId },
        _sum: {
          promptTokens: true,
          completionTokens: true,
          totalTokens: true,
          cost: true,
        },
        _count: true,
      }),
      // 今日用量
      prisma.usageLog.aggregate({
        where: {
          apiKeyId: keyId,
          createdAt: { gte: todayStart },
        },
        _sum: {
          totalTokens: true,
          cost: true,
        },
        _count: true,
      }),
      // 按模型分组统计
      prisma.usageLog.groupBy({
        by: ['model'],
        where: { apiKeyId: keyId },
        _sum: {
          totalTokens: true,
          cost: true,
        },
        _count: true,
        orderBy: { _count: { model: 'desc' } },
      }),
    ]);

    // 转换模型明细
    const modelBreakdown = modelGroupBy.map((row) => ({
      model: row.model,
      calls: row._count,
      tokens: row._sum.totalTokens || 0,
      cost: row._sum.cost?.toString() || '0',
    }));

    return {
      keyId,
      keyName: key.name,
      total: {
        calls: totalStats._count,
        promptTokens: totalStats._sum.promptTokens || 0,
        completionTokens: totalStats._sum.completionTokens || 0,
        totalTokens: totalStats._sum.totalTokens || 0,
        cost: totalStats._sum.cost?.toString() || '0',
      },
      today: {
        calls: todayStats._count,
        totalTokens: todayStats._sum.totalTokens || 0,
        cost: todayStats._sum.cost?.toString() || '0',
      },
      modelBreakdown,
    };
  }

  // 通过原始 Key 验证并返回 Key 信息（供中转路由使用）
  async verifyKey(rawKey: string) {
    // 从前缀快速过滤候选 Key
    const prefix = rawKey.slice(0, 12);
    const candidates = await prisma.apiKey.findMany({
      where: { keyPrefix: prefix, isActive: true },
      include: { user: { select: { id: true, balance: true, isActive: true } } },
    });

    for (const candidate of candidates) {
      const isMatch = await bcrypt.compare(rawKey, candidate.keyHash);
      if (isMatch) {
        // 检查过期
        if (candidate.expiresAt && candidate.expiresAt < new Date()) {
          throw Errors.unauthorized('API Key 已过期');
        }
        // 检查用户状态
        if (!candidate.user.isActive) {
          throw Errors.forbidden('账号已被禁用');
        }
        // 更新最后使用时间
        await prisma.apiKey.update({
          where: { id: candidate.id },
          data: { lastUsedAt: new Date() },
        });
        return candidate;
      }
    }

    throw Errors.unauthorized('无效的 API Key');
  }
}

export const keysService = new KeysService();

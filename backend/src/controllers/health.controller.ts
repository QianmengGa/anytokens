import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { redis } from '../config/redis.js';
import { success, error } from '../utils/response.js';

// 健康检查接口
export async function healthCheck(_req: Request, res: Response) {
  const checks: Record<string, string> = {
    server: 'ok',
    database: 'unknown',
    redis: 'unknown',
  };

  try {
    // 检查数据库连接
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  try {
    // 检查 Redis 连接
    await redis.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
  }

  const isHealthy = Object.values(checks).every((v) => v === 'ok');

  if (isHealthy) {
    return success(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks,
    });
  }

  return error(res, 50001, '部分服务不可用', 503, {
    status: 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  });
}

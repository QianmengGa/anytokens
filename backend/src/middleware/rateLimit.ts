import type { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis.js';
import { Errors } from '../utils/errors.js';

// 基于 Redis 的请求频率限制中间件
export function rateLimit(maxRequests: number = 60, windowSeconds: number = 60) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const key = `rate_limit:${req.ip}`;

    try {
      const current = await redis.incr(key);

      // 第一次请求时设置过期时间
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (current > maxRequests) {
        throw Errors.tooMany(`请求过于频繁，请 ${windowSeconds} 秒后重试`);
      }

      next();
    } catch (err) {
      // 如果是 AppError 直接抛出
      if (err instanceof Error && 'statusCode' in err) {
        throw err;
      }
      // Redis 故障时放行，不影响正常服务
      next();
    }
  };
}

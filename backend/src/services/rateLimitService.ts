import { redis } from '../config/redis.js';

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  limitType?: 'minute' | 'day' | 'month';
}

// 检查单个维度的限流
async function checkDimension(
  redisKey: string,
  ttl: number,
  limit: number,
): Promise<{ exceeded: boolean; retryAfter: number }> {
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, ttl);
  }
  if (count > limit) {
    // 获取剩余 TTL 作为 retryAfter
    const remaining = await redis.ttl(redisKey);
    return { exceeded: true, retryAfter: remaining > 0 ? remaining : ttl };
  }
  return { exceeded: false, retryAfter: 0 };
}

// 检查 API Key 的三个维度限流
export async function checkKeyRateLimit(
  keyId: string,
  rateLimit: number | null,
  dailyLimit: number | null,
  monthlyLimit: number | null,
): Promise<RateLimitResult> {
  // 三个限制都为 null → 不限制
  if (rateLimit === null && dailyLimit === null && monthlyLimit === null) {
    return { allowed: true };
  }

  // 每分钟限流
  if (rateLimit !== null) {
    const minuteBucket = Math.floor(Date.now() / 60000);
    const key = `ratelimit:min:${keyId}:${minuteBucket}`;
    const result = await checkDimension(key, 60, rateLimit);
    if (result.exceeded) {
      return { allowed: false, retryAfter: result.retryAfter, limitType: 'minute' };
    }
  }

  // 每日限流
  if (dailyLimit !== null) {
    const dayBucket = new Date().toISOString().slice(0, 10);
    const key = `ratelimit:day:${keyId}:${dayBucket}`;
    const result = await checkDimension(key, 86400, dailyLimit);
    if (result.exceeded) {
      return { allowed: false, retryAfter: result.retryAfter, limitType: 'day' };
    }
  }

  // 每月限流
  if (monthlyLimit !== null) {
    const monthBucket = new Date().toISOString().slice(0, 7);
    const key = `ratelimit:month:${keyId}:${monthBucket}`;
    const result = await checkDimension(key, 2592000, monthlyLimit);
    if (result.exceeded) {
      return { allowed: false, retryAfter: result.retryAfter, limitType: 'month' };
    }
  }

  return { allowed: true };
}

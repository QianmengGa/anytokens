import Redis from 'ioredis';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

// Redis 客户端单例
const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info('Redis 连接成功');
});

redis.on('error', (err) => {
  logger.error('Redis 连接错误:', err);
});

export { redis };

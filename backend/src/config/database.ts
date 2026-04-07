import { PrismaClient } from '@prisma/client';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

// Prisma 客户端单例
const prisma = new PrismaClient({
  log: config.isDev
    ? [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
      ]
    : [{ emit: 'event', level: 'error' }],
});

// 开发环境记录查询日志
if (config.isDev) {
  prisma.$on('query', (e) => {
    logger.debug(`Prisma Query: ${e.query} (${e.duration}ms)`);
  });
}

prisma.$on('error', (e) => {
  logger.error('Prisma Error:', e);
});

export { prisma };

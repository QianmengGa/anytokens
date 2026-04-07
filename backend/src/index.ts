import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { app } from './app.js';
import { prisma } from './config/database.js';
import { redis } from './config/redis.js';

async function main() {
  try {
    // 连接数据库
    await prisma.$connect();
    logger.info('PostgreSQL 连接成功');

    // 验证 Redis 连接
    await redis.ping();
    logger.info('Redis 连接成功');

    // 启动 HTTP 服务
    const server = app.listen(config.port, () => {
      logger.info(`🚀 服务启动成功: http://localhost:${config.port}`);
      logger.info(`📋 健康检查: http://localhost:${config.port}/api/v1/health`);
      logger.info(`🔧 运行环境: ${config.nodeEnv}`);
    });

    // 优雅关闭
    const shutdown = async (signal: string) => {
      logger.info(`收到 ${signal} 信号，开始优雅关闭...`);
      server.close(async () => {
        await prisma.$disconnect();
        redis.disconnect();
        logger.info('服务已安全关闭');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('服务启动失败:', err);
    process.exit(1);
  }
}

main();

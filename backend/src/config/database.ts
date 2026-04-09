import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

// 使用 Prisma 7.x adapter 模式连接 PostgreSQL
const adapter = new PrismaPg({ connectionString: config.databaseUrl });
const prisma = new PrismaClient({ adapter });

export { prisma };

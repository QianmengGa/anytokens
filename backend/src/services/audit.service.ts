import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

// 操作类型
export type AuditAction =
  | 'LOGIN' | 'REGISTER' | 'OAUTH_LOGIN'
  | 'TOPUP' | 'API_CALL'
  | 'SETTINGS_CHANGE' | 'PASSWORD_CHANGE' | 'EMAIL_CHANGE'
  | 'KEY_CREATE' | 'KEY_DELETE'
  | 'TEAM_CREATE' | 'TEAM_INVITE' | 'TEAM_REMOVE' | 'TEAM_KEY_CREATE'
  | 'ADMIN_ACTION';

interface AuditEntry {
  userId?: string;
  action: AuditAction;
  detail?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  result?: 'success' | 'error';
}

class AuditService {
  // 记录审计日志（异步，不阻塞主流程）
  log(entry: AuditEntry) {
    prisma.auditLog.create({
      data: {
        userId: entry.userId || null,
        action: entry.action,
        detail: entry.detail ? JSON.stringify(entry.detail) : null,
        ip: entry.ip || null,
        userAgent: entry.userAgent || null,
        result: entry.result || 'success',
      },
    }).catch((err) => {
      logger.error('审计日志写入失败:', err);
    });
  }

  // 查询用户审计日志
  async getUserLogs(userId: string, opts: {
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const page = opts.page || 1;
    const pageSize = Math.min(opts.pageSize || 20, 100);
    const where: any = { userId };

    if (opts.action) where.action = opts.action;
    if (opts.startDate || opts.endDate) {
      where.createdAt = {};
      if (opts.startDate) where.createdAt.gte = opts.startDate;
      if (opts.endDate) where.createdAt.lte = opts.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        detail: l.detail ? JSON.parse(l.detail) : null,
        ip: l.ip,
        result: l.result,
        createdAt: l.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 管理员：查询所有用户日志
  async getAllLogs(opts: {
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const page = opts.page || 1;
    const pageSize = Math.min(opts.pageSize || 50, 100);
    const where: any = {};

    if (opts.userId) where.userId = opts.userId;
    if (opts.action) where.action = opts.action;
    if (opts.startDate || opts.endDate) {
      where.createdAt = {};
      if (opts.startDate) where.createdAt.gte = opts.startDate;
      if (opts.endDate) where.createdAt.lte = opts.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        action: l.action,
        detail: l.detail ? JSON.parse(l.detail) : null,
        ip: l.ip,
        result: l.result,
        createdAt: l.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // SLA 统计（过去 30 天）
  async getSlaStats() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalCalls, successCalls, avgLatency, dailyStats] = await Promise.all([
      prisma.usageLog.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.usageLog.count({ where: { createdAt: { gte: thirtyDaysAgo }, status: 'success' } }),
      prisma.usageLog.aggregate({
        where: { createdAt: { gte: thirtyDaysAgo }, status: 'success' },
        _avg: { latencyMs: true },
      }),
      // 按天分组统计
      prisma.$queryRawUnsafe<Array<{ day: string; total: bigint; success: bigint; avg_latency: number }>>(`
        SELECT
          DATE(created_at) as day,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'success') as success,
          COALESCE(AVG(latency_ms) FILTER (WHERE status = 'success'), 0) as avg_latency
        FROM usage_logs
        WHERE created_at >= $1
        GROUP BY DATE(created_at)
        ORDER BY day DESC
        LIMIT 30
      `, thirtyDaysAgo),
    ]);

    const errorRate = totalCalls > 0 ? ((totalCalls - successCalls) / totalCalls * 100) : 0;
    const availability = totalCalls > 0 ? (successCalls / totalCalls * 100) : 100;

    return {
      period: '30d',
      totalCalls,
      successCalls,
      availability: Math.round(availability * 100) / 100,
      avgLatencyMs: Math.round(avgLatency._avg.latencyMs || 0),
      errorRate: Math.round(errorRate * 100) / 100,
      dailyStats: dailyStats.map((d) => ({
        day: d.day,
        total: Number(d.total),
        success: Number(d.success),
        avgLatency: Math.round(d.avg_latency),
      })),
    };
  }

  // 清理 90 天前的日志
  async cleanup() {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const result = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: ninetyDaysAgo } },
    });
    if (result.count > 0) {
      logger.info(`审计日志清理完成: 删除 ${result.count} 条过期记录`);
    }
    return result.count;
  }
}

export const auditService = new AuditService();

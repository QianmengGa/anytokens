import { prisma } from '../config/database.js';
import { config } from '../config/index.js';
import { Errors } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

// 默认系统设置
const DEFAULT_SETTINGS: Record<string, string> = {
  signup_bonus: '0.50',
  max_per_request: '1.00',
  announcement: '',
  maintenance_mode: 'false',
};

class AdminService {
  // ========== 用户管理 ==========

  // 获取用户列表（分页 + 搜索 + 排序）
  async getUsers(
    page: number,
    pageSize: number,
    search?: string,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ) {
    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 排序字段映射
    const orderByMap: Record<string, any> = {
      createdAt: { createdAt: sortOrder || 'desc' },
      balance: { balance: sortOrder || 'desc' },
    };
    const orderBy = orderByMap[sortBy || ''] || { createdAt: 'desc' };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          balance: true,
          isActive: true,
          registerIp: true,
          lastLoginIp: true,
          lastLoginAt: true,
          createdAt: true,
          _count: { select: { usageLogs: true } },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    // 批量获取用户总消费
    const userIds = users.map((u) => u.id);
    const spendingAgg = await prisma.usageLog.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _sum: { cost: true },
    });
    const spendingMap = new Map(spendingAgg.map((s) => [s.userId, Number(s._sum.cost || 0)]));

    return {
      items: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        balance: u.balance.toString(),
        isActive: u.isActive,
        registerIp: u.registerIp,
        lastLoginIp: u.lastLoginIp,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        totalCalls: u._count.usageLogs,
        totalSpending: (spendingMap.get(u.id) || 0).toFixed(6),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 调整用户余额
  async adjustBalance(userId: string, amount: number, description: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw Errors.notFound('用户不存在');

    const balanceBefore = Number(user.balance);
    const balanceAfter = balanceBefore + amount;

    if (balanceAfter < 0) throw Errors.badRequest('调整后余额不能为负数');

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { balance: balanceAfter },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: amount >= 0 ? 'TOPUP' : 'USAGE',
          amount: Math.abs(amount),
          balanceBefore,
          balanceAfter,
          status: 'COMPLETED',
          paymentMethod: 'ADMIN',
          description: description || `管理员手动调整 ${amount >= 0 ? '+' : ''}${amount}`,
        },
      });

      return updated;
    });

    return { id: result.id, email: result.email, balance: result.balance.toString() };
  }

  // 封禁/解封用户
  async toggleBan(userId: string, isActive: boolean) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw Errors.notFound('用户不存在');
    if (user.role === 'ADMIN') throw Errors.forbidden('不能封禁管理员');

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
    return { id: updated.id, email: updated.email, isActive: updated.isActive };
  }

  // ========== 平台统计 ==========

  async getStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      todayNewUsers,
      todayCalls,
      todayTokens,
      todayRevenue,
      monthRevenue,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.usageLog.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.usageLog.aggregate({
        where: { createdAt: { gte: todayStart } },
        _sum: { totalTokens: true },
      }),
      prisma.usageLog.aggregate({
        where: { createdAt: { gte: todayStart } },
        _sum: { cost: true },
      }),
      prisma.usageLog.aggregate({
        where: { createdAt: { gte: monthStart } },
        _sum: { cost: true },
      }),
      prisma.usageLog.aggregate({ _sum: { cost: true } }),
    ]);

    return {
      totalUsers,
      todayNewUsers,
      todayCalls,
      todayTokens: todayTokens._sum.totalTokens || 0,
      todayRevenue: (todayRevenue._sum.cost ?? 0).toString(),
      monthRevenue: (monthRevenue._sum.cost ?? 0).toString(),
      totalRevenue: (totalRevenue._sum.cost ?? 0).toString(),
    };
  }

  // 最近 7 天每日统计（用户增长 + 收入趋势）
  async getDailyStats() {
    const days: { date: string; newUsers: number; revenue: string; calls: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
      const dateStr = dayStart.toISOString().slice(0, 10);

      const [newUsers, revenue, calls] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
        prisma.usageLog.aggregate({
          where: { createdAt: { gte: dayStart, lt: dayEnd } },
          _sum: { cost: true },
        }),
        prisma.usageLog.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
      ]);

      days.push({
        date: dateStr,
        newUsers,
        revenue: (revenue._sum.cost ?? 0).toString(),
        calls,
      });
    }

    return days;
  }

  // 今日 Token 消耗排行榜（Top 10）
  async getTokenRanking() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const ranking = await prisma.usageLog.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: todayStart } },
      _sum: { totalTokens: true, cost: true },
      _count: true,
      orderBy: { _sum: { totalTokens: 'desc' } },
      take: 10,
    });

    // 获取用户信息
    const userIds = ranking.map((r) => r.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return ranking.map((r) => ({
      userId: r.userId,
      email: userMap.get(r.userId)?.email || '',
      name: userMap.get(r.userId)?.name || null,
      totalTokens: r._sum.totalTokens || 0,
      totalCost: (r._sum.cost ?? 0).toString(),
      calls: r._count,
    }));
  }

  // ========== 充值记录 ==========

  async getTransactions(
    page: number,
    pageSize: number,
    filters: { userId?: string; type?: string; startDate?: string; endDate?: string },
  ) {
    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.type) where.type = filters.type;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate + 'T23:59:59.999Z');
    }

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { user: { select: { email: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      items: items.map((t) => ({
        id: t.id,
        userEmail: t.user.email,
        userName: t.user.name,
        type: t.type,
        amount: t.amount.toString(),
        balanceBefore: t.balanceBefore.toString(),
        balanceAfter: t.balanceAfter.toString(),
        status: t.status,
        paymentMethod: t.paymentMethod,
        description: t.description,
        createdAt: t.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // ========== 使用记录（增强版含 clientIp）==========

  async getUsageLogs(
    page: number,
    pageSize: number,
    filters: { userId?: string; model?: string; startDate?: string; endDate?: string },
  ) {
    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.model) where.model = { contains: filters.model, mode: 'insensitive' };
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate + 'T23:59:59.999Z');
    }

    const [logs, total] = await Promise.all([
      prisma.usageLog.findMany({
        where,
        include: { user: { select: { email: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.usageLog.count({ where }),
    ]);

    return {
      items: logs.map((log) => ({
        id: log.id,
        userEmail: log.user.email,
        userName: log.user.name,
        model: log.model,
        promptTokens: log.promptTokens,
        completionTokens: log.completionTokens,
        totalTokens: log.totalTokens,
        cost: log.cost.toString(),
        latencyMs: log.latencyMs,
        status: log.status,
        clientIp: log.clientIp,
        createdAt: log.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // ========== 供应商余额监控 ==========

  async getProviderBalances() {
    const providers = [];

    // 硅基流动 — 使用 balanceMonitor 的实时查询 + 缓存
    if (config.siliconflowApiKey) {
      try {
        // 主动查询一次最新余额
        const { fetchSiliconFlowBalance, getCachedBalance } = await import('./balanceMonitor.js');
        await fetchSiliconFlowBalance();
        const cached = getCachedBalance();
        const balance = cached.balance ?? 0;
        providers.push({
          name: 'SiliconFlow',
          keyPrefix: config.siliconflowApiKey.slice(0, 8) + '****' + config.siliconflowApiKey.slice(-4),
          balance: balance.toFixed(2),
          threshold: cached.threshold,
          lowBalance: cached.status === 'low' || cached.status === 'critical',
          lastChecked: cached.lastCheckedAt || new Date().toISOString(),
          status: cached.status,
        });
      } catch (err) {
        logger.error('查询 SiliconFlow 余额失败:', err);
        providers.push({
          name: 'SiliconFlow',
          keyPrefix: config.siliconflowApiKey.slice(0, 8) + '****' + config.siliconflowApiKey.slice(-4),
          balance: '0',
          threshold: config.siliconflowBalanceAlertThreshold,
          lowBalance: true,
          lastChecked: new Date().toISOString(),
          status: 'error',
        });
      }
    }

    // 预留：OpenAI、DeepSeek、Anthropic、Google Gemini
    const reserved = ['OpenAI', 'DeepSeek', 'Anthropic', 'Google Gemini'];
    for (const name of reserved) {
      providers.push({
        name,
        keyPrefix: '未配置',
        balance: '-',
        lowBalance: false,
        lastChecked: null,
        status: 'unconfigured',
      });
    }

    return providers;
  }

  // ========== 管理员个人消耗统计 ==========

  async getMyUsage(userId: string, period: string, startDate?: string, endDate?: string) {
    const now = new Date();
    let gte: Date;
    let lt: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    switch (period) {
      case 'month':
        gte = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        gte = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (!startDate) throw Errors.badRequest('自定义范围需要 startDate');
        gte = new Date(startDate);
        if (endDate) lt = new Date(endDate + 'T23:59:59.999Z');
        break;
      default: // today
        gte = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
    }

    const grouped = await prisma.usageLog.groupBy({
      by: ['model'],
      where: { userId, createdAt: { gte, lt } },
      _sum: { promptTokens: true, completionTokens: true, totalTokens: true, cost: true },
      _count: true,
      orderBy: { _sum: { cost: 'desc' } },
    });

    // 汇总
    let totalCalls = 0;
    let totalTokens = 0;
    let totalCost = 0;

    const models = grouped.map((g) => {
      const calls = g._count;
      const prompt = g._sum.promptTokens || 0;
      const completion = g._sum.completionTokens || 0;
      const tokens = g._sum.totalTokens || 0;
      const cost = Number(g._sum.cost || 0);
      totalCalls += calls;
      totalTokens += tokens;
      totalCost += cost;
      return {
        model: g.model,
        calls,
        promptTokens: prompt,
        completionTokens: completion,
        totalTokens: tokens,
        cost: cost.toFixed(6),
      };
    });

    return {
      period,
      startDate: gte.toISOString(),
      endDate: lt.toISOString(),
      totalCalls,
      totalTokens,
      totalCost: totalCost.toFixed(6),
      models,
    };
  }

  // ========== 系统设置 ==========

  async getSettings() {
    const settings = await prisma.systemSetting.findMany();
    const result: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }

  async updateSettings(updates: Record<string, string>) {
    const validKeys = Object.keys(DEFAULT_SETTINGS);

    for (const [key, value] of Object.entries(updates)) {
      if (!validKeys.includes(key)) continue;

      // 数值字段验证
      if (key === 'signup_bonus' || key === 'max_per_request') {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) throw Errors.badRequest(`${key} 必须为非负数字`);
      }
      // 维护模式只接受 true/false
      if (key === 'maintenance_mode' && value !== 'true' && value !== 'false') {
        throw Errors.badRequest('maintenance_mode 只接受 true 或 false');
      }

      await prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    return this.getSettings();
  }

  async getSetting(key: string): Promise<string> {
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    return setting?.value ?? DEFAULT_SETTINGS[key] ?? '0';
  }
}

export const adminService = new AdminService();

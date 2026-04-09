import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { Errors } from '../utils/errors.js';

const KEY_PREFIX = 'sk-res-';
const MAX_SUB_ACCOUNTS = 100;

class ResellerService {
  // ========== 申请 ==========

  // 提交 Reseller 申请
  async apply(userId: string, data: { companyName: string; monthlyUsage: string; description: string }) {
    const existing = await prisma.resellerApplication.findUnique({ where: { userId } });
    if (existing) {
      if (existing.status === 'APPROVED') throw Errors.conflict('您已是 Reseller');
      if (existing.status === 'PENDING') throw Errors.conflict('申请正在审核中');
    }

    return prisma.resellerApplication.upsert({
      where: { userId },
      create: { userId, ...data },
      update: { ...data, status: 'PENDING', reviewNote: null, reviewedAt: null },
    });
  }

  // 获取自己的申请状态
  async getMyApplication(userId: string) {
    return prisma.resellerApplication.findUnique({ where: { userId } });
  }

  // 管理员：列出所有申请
  async listApplications(status?: string) {
    const where = status ? { status: status as any } : {};
    const apps = await prisma.resellerApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    // 附带用户信息
    const userIds = apps.map((a) => a.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true, balance: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return apps.map((a) => ({
      ...a,
      user: userMap.get(a.userId) || null,
    }));
  }

  // 管理员：审批申请
  async reviewApplication(applicationId: string, approved: boolean, reviewNote?: string) {
    const app = await prisma.resellerApplication.findUniqueOrThrow({ where: { id: applicationId } });
    if (app.status !== 'PENDING') throw Errors.badRequest('该申请已处理');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.resellerApplication.update({
        where: { id: applicationId },
        data: {
          status: approved ? 'APPROVED' : 'REJECTED',
          reviewNote: reviewNote || null,
          reviewedAt: new Date(),
        },
      });

      // 审批通过 → 升级用户角色为 RESELLER
      if (approved) {
        await tx.user.update({
          where: { id: app.userId },
          data: { role: 'RESELLER' },
        });
      }

      return updated;
    });
  }

  // ========== 子账户管理 ==========

  // 创建子账户
  async createSubAccount(resellerId: string, data: { name: string; email?: string; priceMarkup?: number }) {
    await this.requireReseller(resellerId);

    const count = await prisma.resellerSubAccount.count({ where: { resellerId, isActive: true } });
    if (count >= MAX_SUB_ACCOUNTS) throw Errors.badRequest(`最多 ${MAX_SUB_ACCOUNTS} 个子账户`);

    const sub = await prisma.resellerSubAccount.create({
      data: {
        resellerId,
        name: data.name,
        email: data.email || null,
        priceMarkup: data.priceMarkup || 1.5,
      },
    });

    // 自动创建一个 API Key
    const rawKey = KEY_PREFIX + crypto.randomBytes(48).toString('base64url').slice(0, 48);
    const keyHash = await bcrypt.hash(rawKey, 10);
    await prisma.resellerApiKey.create({
      data: {
        subAccountId: sub.id,
        resellerId,
        keyHash,
        keyPrefix: rawKey.slice(0, 12),
      },
    });

    return { ...sub, key: rawKey };
  }

  // 列出子账户
  async listSubAccounts(resellerId: string) {
    await this.requireReseller(resellerId);

    const subs = await prisma.resellerSubAccount.findMany({
      where: { resellerId, isActive: true },
      include: { _count: { select: { apiKeys: { where: { isActive: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    return subs.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      balance: s.balance.toString(),
      priceMarkup: Number(s.priceMarkup),
      keyCount: s._count.apiKeys,
      createdAt: s.createdAt,
    }));
  }

  // 给子账户充值（从 Reseller 余额划转）
  async topUpSubAccount(resellerId: string, subAccountId: string, amount: number) {
    await this.requireReseller(resellerId);
    if (amount <= 0) throw Errors.badRequest('金额必须大于 0');

    return prisma.$transaction(async (tx) => {
      const reseller = await tx.user.findUniqueOrThrow({ where: { id: resellerId } });
      if (Number(reseller.balance) < amount) throw Errors.forbidden('Reseller 余额不足');

      const sub = await tx.resellerSubAccount.findFirst({
        where: { id: subAccountId, resellerId },
      });
      if (!sub) throw Errors.notFound('子账户不存在');

      // Reseller 扣款
      await tx.user.update({ where: { id: resellerId }, data: { balance: { decrement: amount } } });
      // 子账户加款
      await tx.resellerSubAccount.update({ where: { id: subAccountId }, data: { balance: { increment: amount } } });

      return { message: `已划转 $${amount}` };
    });
  }

  // 更新子账户加价倍率
  async updateMarkup(resellerId: string, subAccountId: string, priceMarkup: number) {
    await this.requireReseller(resellerId);
    if (priceMarkup < 1 || priceMarkup > 10) throw Errors.badRequest('加价倍率范围 1.0 ~ 10.0');

    const sub = await prisma.resellerSubAccount.findFirst({ where: { id: subAccountId, resellerId } });
    if (!sub) throw Errors.notFound('子账户不存在');

    return prisma.resellerSubAccount.update({
      where: { id: subAccountId },
      data: { priceMarkup },
    });
  }

  // Reseller 收入统计
  async getResellerStats(resellerId: string) {
    await this.requireReseller(resellerId);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [subCount, totalBalance, monthUsage] = await Promise.all([
      prisma.resellerSubAccount.count({ where: { resellerId, isActive: true } }),
      prisma.resellerSubAccount.aggregate({
        where: { resellerId, isActive: true },
        _sum: { balance: true },
      }),
      // 本月所有子账户 Key 的使用量（通过 reseller_api_keys 关联）
      prisma.$queryRawUnsafe<Array<{ total_cost: string; total_calls: bigint }>>(`
        SELECT
          COALESCE(SUM(ul.cost), 0) as total_cost,
          COUNT(*) as total_calls
        FROM usage_logs ul
        INNER JOIN reseller_api_keys rak ON ul.api_key_id = rak.id
        WHERE rak.reseller_id = $1
          AND ul.created_at >= $2
          AND ul.status = 'success'
      `, resellerId, monthStart).catch(() => [{ total_cost: '0', total_calls: BigInt(0) }]),
    ]);

    return {
      subAccountCount: subCount,
      totalSubBalance: (totalBalance._sum.balance ?? 0).toString(),
      monthCost: monthUsage[0]?.total_cost || '0',
      monthCalls: Number(monthUsage[0]?.total_calls || 0),
    };
  }

  // 管理员：列出所有 Reseller 及其收入
  async listResellers() {
    const resellers = await prisma.user.findMany({
      where: { role: 'RESELLER' },
      select: { id: true, email: true, name: true, balance: true, createdAt: true },
    });

    const stats = await Promise.all(
      resellers.map(async (r) => {
        const subCount = await prisma.resellerSubAccount.count({ where: { resellerId: r.id, isActive: true } });
        return { ...r, balance: r.balance.toString(), subAccountCount: subCount };
      }),
    );

    return stats;
  }

  // 验证 Reseller 子账户 Key（供 proxy 调用）
  async verifyResellerKey(rawKey: string) {
    const prefix = rawKey.slice(0, 12);
    const candidates = await prisma.resellerApiKey.findMany({
      where: { keyPrefix: prefix, isActive: true },
      include: {
        subAccount: { select: { id: true, resellerId: true, balance: true, priceMarkup: true, isActive: true } },
      },
    });

    for (const candidate of candidates) {
      const isMatch = await bcrypt.compare(rawKey, candidate.keyHash);
      if (isMatch) {
        if (!candidate.subAccount.isActive) throw Errors.forbidden('子账户已禁用');
        await prisma.resellerApiKey.update({ where: { id: candidate.id }, data: { lastUsedAt: new Date() } });
        return candidate;
      }
    }

    return null; // 不是 Reseller Key，交给普通验证
  }

  private async requireReseller(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { role: true } });
    if (user.role !== 'RESELLER' && user.role !== 'ADMIN') {
      throw Errors.forbidden('需要 Reseller 权限');
    }
  }
}

export const resellerService = new ResellerService();

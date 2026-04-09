import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { Errors } from '../utils/errors.js';
import { emailService } from './email.service.js';
import crypto from 'crypto';
import { validatePasswordStrength } from '../utils/password.js';

// 验证码有效期（分钟）
const CODE_EXPIRE_MINUTES = 10;
// 发送间隔（秒）
const CODE_COOLDOWN_SECONDS = 60;

class UserService {
  // Dashboard 统计数据
  async getDashboardStats(userId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [user, apiKeyCount, todayCalls, monthCalls, totalSpent, modelUsage] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { balance: true },
      }),
      prisma.apiKey.count({ where: { userId } }),
      prisma.usageLog.count({ where: { userId, createdAt: { gte: todayStart } } }),
      prisma.usageLog.count({ where: { userId, createdAt: { gte: monthStart } } }),
      prisma.usageLog.aggregate({
        where: { userId },
        _sum: { cost: true },
      }),
      // 按模型分组统计（本月）
      prisma.usageLog.groupBy({
        by: ['model'],
        where: { userId, createdAt: { gte: monthStart }, status: 'success' },
        _sum: { cost: true },
        _count: true,
        orderBy: { _count: { model: 'desc' } },
        take: 10,
      }),
    ]);

    // 按类型归类
    const embeddingModels = ['text-embedding-3-small', 'text-embedding-3-large'];
    const imageModels = ['dall-e-3', 'dall-e-3-hd'];
    const ttsModels = ['tts-1', 'tts-1-hd'];

    let chatCalls = 0, embeddingCalls = 0, imageCalls = 0, ttsCalls = 0;
    for (const row of modelUsage) {
      if (embeddingModels.includes(row.model)) embeddingCalls += row._count;
      else if (imageModels.includes(row.model)) imageCalls += row._count;
      else if (ttsModels.includes(row.model)) ttsCalls += row._count;
      else chatCalls += row._count;
    }

    return {
      balance: user.balance.toString(),
      apiKeyCount,
      todayCalls,
      monthCalls,
      totalSpent: (totalSpent._sum.cost ?? 0).toString(),
      usageByType: { chat: chatCalls, embedding: embeddingCalls, image: imageCalls, tts: ttsCalls },
    };
  }

  // 更新个人资料（用户名/电话）
  async updateProfile(userId: string, data: { name?: string; phone?: string }) {
    if (data.name !== undefined) {
      // 检查用户名唯一性
      const existing = await prisma.user.findFirst({
        where: { name: data.name, id: { not: userId } },
      });
      if (existing) {
        throw Errors.conflict('该用户名已被使用');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
      },
      select: { id: true, name: true, phone: true, email: true },
    });

    return user;
  }

  // 修改邮箱（需验证码）
  async updateEmail(userId: string, newEmail: string, code: string) {
    // 检查新邮箱是否已注册
    const existing = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existing) {
      throw Errors.conflict('该邮箱已被注册');
    }

    // 校验验证码
    const verification = await prisma.emailVerification.findFirst({
      where: {
        email: newEmail,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!verification) {
      throw Errors.badRequest('验证码无效或已过期');
    }

    // 更新邮箱并标记验证码已使用
    const user = await prisma.$transaction(async (tx) => {
      await tx.emailVerification.update({
        where: { id: verification.id },
        data: { used: true },
      });

      return tx.user.update({
        where: { id: userId },
        data: { email: newEmail },
        select: { id: true, email: true },
      });
    });

    return user;
  }

  // 发送邮箱验证码（用于修改邮箱）
  async sendEmailCode(email: string) {
    // 检查冷却
    const recent = await prisma.emailVerification.findFirst({
      where: {
        email,
        createdAt: { gt: new Date(Date.now() - CODE_COOLDOWN_SECONDS * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) {
      throw Errors.tooMany('发送太频繁，请 60 秒后重试');
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + CODE_EXPIRE_MINUTES * 60 * 1000);

    await prisma.emailVerification.create({
      data: { email, code, expiresAt },
    });

    await emailService.sendVerificationCode(email, code);
    return { message: '验证码已发送' };
  }

  // 更新消费限额
  async updateSpendingLimits(userId: string, data: {
    maxPerRequest?: number | null;
    maxPerDay?: number | null;
    maxPerMonth?: number | null;
  }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        maxPerRequest: data.maxPerRequest ?? null,
        maxPerDay: data.maxPerDay ?? null,
        maxPerMonth: data.maxPerMonth ?? null,
      },
      select: {
        id: true,
        maxPerRequest: true,
        maxPerDay: true,
        maxPerMonth: true,
      },
    });

    return {
      ...user,
      maxPerRequest: user.maxPerRequest?.toString() || null,
      maxPerDay: user.maxPerDay?.toString() || null,
      maxPerMonth: user.maxPerMonth?.toString() || null,
    };
  }

  // 获取消费限额（含当日/当月已消费金额）
  async getSpendingLimits(userId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [user, todayAgg, monthAgg] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { maxPerRequest: true, maxPerDay: true, maxPerMonth: true },
      }),
      prisma.usageLog.aggregate({
        where: { userId, createdAt: { gte: todayStart }, status: 'success' },
        _sum: { cost: true },
      }),
      prisma.usageLog.aggregate({
        where: { userId, createdAt: { gte: monthStart }, status: 'success' },
        _sum: { cost: true },
      }),
    ]);

    return {
      maxPerRequest: user.maxPerRequest?.toString() || null,
      maxPerDay: user.maxPerDay?.toString() || null,
      maxPerMonth: user.maxPerMonth?.toString() || null,
      todaySpent: (todayAgg._sum.cost ?? 0).toString(),
      monthSpent: (monthAgg._sum.cost ?? 0).toString(),
    };
  }

  // 获取邀请统计
  async getReferralStats(userId: string) {
    const [user, refereeCount, totalCommission] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { referralCode: true },
      }),
      prisma.user.count({ where: { referredBy: userId } }),
      prisma.commission.aggregate({
        where: { referrerId: userId },
        _sum: { commission: true },
      }),
    ]);

    return {
      referralCode: user.referralCode,
      refereeCount,
      totalCommission: (totalCommission._sum.commission ?? 0).toString(),
    };
  }

  // 获取路由策略
  async getRoutingStrategy(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { routingStrategy: true },
    });
    return { routingStrategy: user.routingStrategy };
  }

  // 更新路由策略
  async updateRoutingStrategy(userId: string, strategy: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { routingStrategy: strategy },
      select: { routingStrategy: true },
    });
    return { routingStrategy: user.routingStrategy };
  }

  // 修改密码
  async updatePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw Errors.notFound('用户不存在');
    }

    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValid) {
      throw Errors.badRequest('旧密码不正确');
    }

    // 检查新密码不能与旧密码相同
    const isSame = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSame) {
      throw Errors.badRequest('新密码不能与当前密码相同');
    }

    // 校验密码强度
    validatePasswordStrength(newPassword);

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: '密码修改成功' };
  }
}

export const userService = new UserService();

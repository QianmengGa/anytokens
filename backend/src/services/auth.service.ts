import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { config } from '../config/index.js';
import { Errors } from '../utils/errors.js';
import { emailService } from './email.service.js';

// 注册赠送金额（美元）
const SIGNUP_BONUS = 0.5;
// 验证码有效期（分钟）
const CODE_EXPIRE_MINUTES = 10;
// 发送间隔（秒）
const CODE_COOLDOWN_SECONDS = 60;

class AuthService {
  // 发送验证码
  async sendCode(email: string) {
    // 检查 60 秒冷却
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

    // 生成 6 位数字验证码
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + CODE_EXPIRE_MINUTES * 60 * 1000);

    // 存入数据库
    await prisma.emailVerification.create({
      data: { email, code, expiresAt },
    });

    // 发送邮件
    await emailService.sendVerificationCode(email, code);

    return { message: '验证码已发送' };
  }

  // 用户注册（带验证码校验）
  async register(email: string, password: string, code: string, name?: string) {
    // 校验验证码
    const verification = await prisma.emailVerification.findFirst({
      where: {
        email,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!verification) {
      throw Errors.badRequest('验证码无效或已过期');
    }

    // 检查邮箱是否已注册
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw Errors.conflict('该邮箱已被注册');
    }

    // 如果提供了用户名，检查唯一性
    const finalName = name || email.split('@')[0];
    const nameCheck = await prisma.user.findMany({ where: { name: finalName }, take: 1 });
    if (nameCheck.length > 0) {
      throw Errors.conflict('该用户名已被使用');
    }

    // 哈希密码
    const passwordHash = await bcrypt.hash(password, 12);

    // 创建用户并赠送初始余额，同时标记验证码已使用
    const user = await prisma.$transaction(async (tx) => {
      // 标记验证码已使用
      await tx.emailVerification.update({
        where: { id: verification.id },
        data: { used: true },
      });

      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: finalName,
          balance: SIGNUP_BONUS,
        },
      });

      // 记录赠送交易
      await tx.transaction.create({
        data: {
          userId: newUser.id,
          type: 'BONUS',
          amount: SIGNUP_BONUS,
          balanceBefore: 0,
          balanceAfter: SIGNUP_BONUS,
          status: 'COMPLETED',
          paymentMethod: 'SYSTEM',
          description: '新用户注册赠送',
        },
      });

      return newUser;
    });

    // 签发 JWT
    const token = this.signToken(user.id, user.email, user.role);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        balance: user.balance.toString(),
      },
    };
  }

  // 用户登录
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw Errors.unauthorized('邮箱或密码错误');
    }

    if (!user.isActive) {
      throw Errors.forbidden('账号已被禁用');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw Errors.unauthorized('邮箱或密码错误');
    }

    const token = this.signToken(user.id, user.email, user.role);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        balance: user.balance.toString(),
      },
    };
  }

  // 根据 ID 获取用户信息
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        balance: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw Errors.notFound('用户不存在');
    }

    return {
      ...user,
      balance: user.balance.toString(),
    };
  }

  // 签发 JWT
  private signToken(userId: string, email: string, role: string): string {
    return jwt.sign(
      { id: userId, email, role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'] },
    );
  }
}

export const authService = new AuthService();

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { config } from '../config/index.js';
import { Errors } from '../utils/errors.js';
import { emailService } from './email.service.js';
import { validatePasswordStrength } from '../utils/password.js';

// 注册赠送金额（美元）
const SIGNUP_BONUS = 0.5;
// 验证码有效期（分钟）
const CODE_EXPIRE_MINUTES = 10;
// 发送间隔（秒）
const CODE_COOLDOWN_SECONDS = 60;
// 密码重置验证码有效期（分钟）
const RESET_CODE_EXPIRE_MINUTES = 10;
// 密码重置发送冷却（秒）
const RESET_COOLDOWN_SECONDS = 60;

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

  // 用户注册（带验证码校验 + 邀请码）
  async register(email: string, password: string, code: string, name?: string, ip?: string, refCode?: string) {
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

    // 校验密码强度
    validatePasswordStrength(password);

    // 哈希密码
    const passwordHash = await bcrypt.hash(password, 12);

    // 验证邀请码（可选）
    let referrerId: string | null = null;
    if (refCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: refCode },
        select: { id: true, isActive: true },
      });
      if (referrer && referrer.isActive) {
        referrerId = referrer.id;
      }
    }

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
          referredBy: referrerId,
          registerIp: ip || null,
          lastLoginIp: ip || null,
          lastLoginAt: new Date(),
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

      // 自动创建默认 API Key
      const rawKey = 'sk-any-' + crypto.randomBytes(48).toString('base64url').slice(0, 48);
      const keyHash = await bcrypt.hash(rawKey, 10);
      await tx.apiKey.create({
        data: {
          userId: newUser.id,
          name: '默认密钥',
          keyHash,
          keyPrefix: rawKey.slice(0, 12),
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

  // OAuth 登录/注册（Google、GitHub、Discord）
  async oauthLogin(email: string, name?: string, provider?: string, ip?: string) {
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // 已有账号 → 直接登录
      if (!user.isActive) {
        throw Errors.forbidden('账号已被禁用');
      }
      const updateData: any = { lastLoginAt: new Date() };
      if (ip) updateData.lastLoginIp = ip;
      if (config.adminEmail && email === config.adminEmail && user.role !== 'ADMIN') {
        updateData.role = 'ADMIN';
      }
      user = await prisma.user.update({ where: { id: user.id }, data: updateData });
    } else {
      // 新用户 → 自动创建账号
      const finalName = name || email.split('@')[0];
      // 随机密码（OAuth 用户不需要密码登录）
      const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);

      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            passwordHash,
            name: finalName,
            balance: SIGNUP_BONUS,
            registerIp: ip || null,
            lastLoginIp: ip || null,
            lastLoginAt: new Date(),
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
            description: `新用户注册赠送 (${provider || 'oauth'})`,
          },
        });

        // 自动创建默认 API Key
        const rawKey = 'sk-any-' + crypto.randomBytes(48).toString('base64url').slice(0, 48);
        const keyHash = await bcrypt.hash(rawKey, 10);
        await tx.apiKey.create({
          data: {
            userId: newUser.id,
            name: '默认密钥',
            keyHash,
            keyPrefix: rawKey.slice(0, 12),
          },
        });

        return newUser;
      });
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

  // 用户登录
  async login(email: string, password: string, ip?: string) {
    let user = await prisma.user.findUnique({ where: { email } });
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

    // 如果是管理员邮箱但角色不是 ADMIN，自动升级
    const updateData: any = { lastLoginAt: new Date() };
    if (ip) updateData.lastLoginIp = ip;
    if (config.adminEmail && email === config.adminEmail && user.role !== 'ADMIN') {
      updateData.role = 'ADMIN';
    }
    user = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

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
        phone: true,
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

  // 忘记密码 — 发送验证码
  async forgotPassword(email: string) {
    // 检查用户是否存在
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // 为防止枚举攻击，不暴露用户是否存在
      return { message: '如果该邮箱已注册，验证码已发送' };
    }

    if (!user.isActive) {
      return { message: '如果该邮箱已注册，验证码已发送' };
    }

    // 检查 60 秒冷却
    const recent = await prisma.passwordReset.findFirst({
      where: {
        email,
        createdAt: { gt: new Date(Date.now() - RESET_COOLDOWN_SECONDS * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) {
      throw Errors.tooMany('发送太频繁，请 60 秒后重试');
    }

    // 生成 6 位数字验证码
    const code = crypto.randomInt(100000, 999999).toString();
    const token = code; // 复用 token 字段存储验证码
    const expiresAt = new Date(Date.now() + RESET_CODE_EXPIRE_MINUTES * 60 * 1000);

    // 存入数据库
    await prisma.passwordReset.create({
      data: { email, token, expiresAt },
    });

    // 发送验证码邮件
    await emailService.sendPasswordResetCode(email, code);

    return { message: '如果该邮箱已注册，验证码已发送' };
  }

  // 重置密码（通过邮箱 + 验证码）
  async resetPassword(email: string, code: string, newPassword: string) {
    // 查找有效的重置记录
    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        email,
        token: code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!resetRecord) {
      throw Errors.badRequest('验证码无效或已过期');
    }

    // 查找用户
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw Errors.notFound('用户不存在');
    }

    // 校验密码强度
    validatePasswordStrength(newPassword);

    // 哈希新密码并更新
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction(async (tx) => {
      // 标记验证码已使用
      await tx.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used: true },
      });

      // 更新用户密码
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
    });

    return { message: '密码已重置，请使用新密码登录' };
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

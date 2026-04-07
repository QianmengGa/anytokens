import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { config } from '../config/index.js';
import { Errors } from '../utils/errors.js';

// 注册赠送金额（美元）
const SIGNUP_BONUS = 0.5;

class AuthService {
  // 用户注册
  async register(email: string, password: string, name?: string) {
    // 检查邮箱是否已注册
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw Errors.conflict('该邮箱已被注册');
    }

    // 哈希密码
    const passwordHash = await bcrypt.hash(password, 12);

    // 创建用户并赠送初始余额
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: name || email.split('@')[0],
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

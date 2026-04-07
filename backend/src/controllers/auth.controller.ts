import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { success } from '../utils/response.js';
import type { AuthRequest } from '../types/index.js';

// 注册参数校验
const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少 6 位').max(100),
  name: z.string().min(1, '名称不能为空').max(50).optional(),
});

// 登录参数校验
const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '密码不能为空'),
});

// 用户注册
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const body = registerSchema.parse(req.body);
    const result = await authService.register(body.email, body.password, body.name);
    return success(res, result, '注册成功', 201);
  } catch (err) {
    next(err);
  }
}

// 用户登录
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body.email, body.password);
    return success(res, result, '登录成功');
  } catch (err) {
    next(err);
  }
}

// 获取当前用户信息
export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await authService.getUserById(req.user!.id);
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

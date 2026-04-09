import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { success } from '../utils/response.js';
import type { AuthRequest } from '../types/index.js';

// 发送验证码参数校验
const sendCodeSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
});

// 注册参数校验
const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(8, '密码至少 8 位').max(100),
  code: z.string().length(6, '验证码为 6 位数字'),
  name: z.string().min(1, '名称不能为空').max(50).optional(),
  refCode: z.string().max(50).optional(),
});

// 登录参数校验
const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '密码不能为空'),
});

// 发送验证码
export async function sendCode(req: Request, res: Response, next: NextFunction) {
  try {
    const body = sendCodeSchema.parse(req.body);
    const result = await authService.sendCode(body.email);
    return success(res, result, '验证码已发送');
  } catch (err) {
    next(err);
  }
}

// 提取客户端 IP
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip || '';
}

// 用户注册
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const body = registerSchema.parse(req.body);
    const ip = getClientIp(req);
    const result = await authService.register(body.email, body.password, body.code, body.name, ip, body.refCode);
    return success(res, result, '注册成功', 201);
  } catch (err) {
    next(err);
  }
}

// OAuth 登录/注册
const oauthLoginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  name: z.string().max(50).optional(),
  provider: z.string().max(20).optional(),
});

export async function oauthLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const body = oauthLoginSchema.parse(req.body);
    const ip = getClientIp(req);
    const result = await authService.oauthLogin(body.email, body.name, body.provider, ip);
    return success(res, result, '登录成功');
  } catch (err) {
    next(err);
  }
}

// 用户登录
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const body = loginSchema.parse(req.body);
    const ip = getClientIp(req);
    const result = await authService.login(body.email, body.password, ip);
    return success(res, result, '登录成功');
  } catch (err) {
    next(err);
  }
}

// 忘记密码参数校验
const forgotPasswordSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
});

// 重置密码参数校验
const resetPasswordSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  code: z.string().length(6, '验证码为 6 位数字'),
  password: z.string().min(8, '密码至少 8 位').max(100),
});

// 忘记密码
export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const body = forgotPasswordSchema.parse(req.body);
    const result = await authService.forgotPassword(body.email);
    return success(res, result, result.message);
  } catch (err) {
    next(err);
  }
}

// 重置密码
export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const body = resetPasswordSchema.parse(req.body);
    const result = await authService.resetPassword(body.email, body.code, body.password);
    return success(res, result, result.message);
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

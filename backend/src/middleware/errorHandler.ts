import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { ZodError } from 'zod';

// 全局错误处理中间件
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  // 自定义业务错误
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      data: null,
    });
  }

  // Zod 参数校验错误
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.map(String).join('.'),
      message: issue.message,
    }));
    return res.status(400).json({
      code: 40001,
      message: '参数校验失败',
      data: details,
    });
  }

  // 未知错误
  logger.error('未处理错误:', err);
  return res.status(500).json({
    code: 50000,
    message: '服务器内部错误',
    data: null,
  });
}

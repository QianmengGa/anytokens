import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

// HTTP 请求日志中间件
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    };

    if (res.statusCode >= 400) {
      logger.warn('请求完成', logData);
    } else {
      logger.info('请求完成', logData);
    }
  });

  next();
}

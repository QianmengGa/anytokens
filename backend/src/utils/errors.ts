// 自定义应用错误类
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: number;
  public readonly isOperational: boolean;

  constructor(statusCode: number, code: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// 常用错误工厂方法
export const Errors = {
  badRequest: (message: string, code = 40000) => new AppError(400, code, message),
  unauthorized: (message = '未授权访问') => new AppError(401, 40100, message),
  forbidden: (message = '无权限') => new AppError(403, 40300, message),
  notFound: (message = '资源不存在') => new AppError(404, 40400, message),
  conflict: (message: string) => new AppError(409, 40900, message),
  tooMany: (message = '请求过于频繁') => new AppError(429, 42900, message),
  internal: (message = '服务器内部错误') => new AppError(500, 50000, message, false),
};

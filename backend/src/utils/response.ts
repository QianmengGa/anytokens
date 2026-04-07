import type { Response } from 'express';

// 统一响应格式：{ code, message, data }

// 成功响应
export function success(res: Response, data: any = null, message: string = 'ok', statusCode: number = 200) {
  return res.status(statusCode).json({
    code: 0,
    message,
    data,
  });
}

// 错误响应
export function error(res: Response, code: number, message: string, statusCode: number = 400, data: any = null) {
  return res.status(statusCode).json({
    code,
    message,
    data,
  });
}

// 分页响应
export function paginated(res: Response, data: any[], total: number, page: number, pageSize: number) {
  return res.status(200).json({
    code: 0,
    message: 'ok',
    data: {
      items: data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

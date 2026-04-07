import type { Request } from 'express';

// 扩展 Express Request，携带用户信息
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// 统一 API 响应格式
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

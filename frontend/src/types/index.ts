// 扩展 NextAuth 类型
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      balance: string;
      accessToken: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    balance: string;
    accessToken: string;
  }
}

// API 响应格式
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 用户信息
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  balance: string;
  createdAt: string;
}

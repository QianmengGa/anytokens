import axios from 'axios';
import { getSession } from 'next-auth/react';

// Axios 实例，统一请求后端 API
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：附加认证令牌
api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.user) {
    const token = (session.user as any).accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 响应拦截器：统一处理错误
api.interceptors.response.use(
  (response) => {
    // 提取 data 字段
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 令牌过期，跳转登录
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export { api };

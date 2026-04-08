import dotenv from 'dotenv';

dotenv.config();

// 集中管理环境变量
export const config = {
  port: parseInt(process.env.BACKEND_PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  // 数据库
  databaseUrl: process.env.DATABASE_URL || 'postgresql://anytokens:anytokens@localhost:5432/anytokens',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // 前端地址（用于拼接重置密码链接等）
  frontendUrl: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Resend 邮件服务
  resendApiKey: process.env.RESEND_API_KEY || '',

  // 硅基流动（SiliconFlow）
  siliconflowApiKey: process.env.SILICONFLOW_API_KEY || '',
  siliconflowBaseUrl: process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1',

  // Stripe 支付
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',

  // NOWPayments 加密货币支付
  nowpaymentsApiKey: process.env.NOWPAYMENTS_API_KEY || '',
  nowpaymentsIpnSecret: process.env.NOWPAYMENTS_IPN_SECRET || '',

  // 管理员邮箱
  adminEmail: process.env.ADMIN_EMAIL || '',
};

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

  // DeepSeek 官方
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',

  // Google Gemini（OpenAI 兼容端点）
  googleApiKey: process.env.GOOGLE_API_KEY || '',
  googleBaseUrl: process.env.GOOGLE_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai',

  // Groq（OpenAI 兼容端点）
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqBaseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',

  // OpenAI（Embeddings / Images / TTS）
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',

  // Stripe 支付
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',

  // NOWPayments 加密货币支付
  nowpaymentsApiKey: process.env.NOWPAYMENTS_API_KEY || '',
  nowpaymentsIpnSecret: process.env.NOWPAYMENTS_IPN_SECRET || '',

  // Azure AI Foundry
  azureApiKey: process.env.AZURE_API_KEY || '',
  azureEndpoint: process.env.AZURE_ENDPOINT || 'https://ai-qianmeng10217558ai454334773804.services.ai.azure.com',

  // 管理员邮箱
  adminEmail: process.env.ADMIN_EMAIL || '',

  // SiliconFlow 余额监控
  siliconflowBalanceAlertThreshold: parseFloat(process.env.SILICONFLOW_BALANCE_ALERT_THRESHOLD || '10'),
  siliconflowBalanceCheckInterval: parseInt(process.env.SILICONFLOW_BALANCE_CHECK_INTERVAL || '3600000', 10),
};

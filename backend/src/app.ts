import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/index.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app = express();

// 安全头
app.use(helmet());

// CORS 跨域
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

// 压缩响应
app.use(compression());

// 解析 JSON 请求体
app.use(express.json({ limit: '10mb' }));

// 请求日志
app.use(requestLogger);

// API 路由挂载（统一 /api/v1 前缀）— 包含 auth, keys 等模块
app.use('/api/v1', routes);

// 404 处理
app.use((_req, res) => {
  res.status(404).json({
    code: 40400,
    message: '接口不存在',
    data: null,
  });
});

// 全局错误处理（必须放在最后）
app.use(errorHandler);

export { app };

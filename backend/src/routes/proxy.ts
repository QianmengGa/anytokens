import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { proxyService } from '../services/proxy.service.js';
import { Errors } from '../utils/errors.js';

const proxyRouter = Router();

// POST /chat/completions — OpenAI 兼容中转接口
proxyRouter.post('/chat/completions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 从 Authorization header 提取 API Key
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw Errors.unauthorized('缺少 API Key，请在 Authorization header 中传入 Bearer sk-any-...');
    }
    const apiKey = authHeader.substring(7);

    // 校验请求体
    const { model, messages } = req.body;
    if (!model || typeof model !== 'string') {
      throw Errors.badRequest('缺少 model 参数');
    }
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw Errors.badRequest('缺少 messages 参数');
    }

    // 提取客户端 IP
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : (req.ip || '');

    // 交给 proxyService 处理（流式响应由 service 直接写入 res）
    await proxyService.handleChatCompletion(apiKey, req.body, res, clientIp);
  } catch (err) {
    // 流式响应已发送 header 后不能再用 errorHandler
    if (res.headersSent) {
      res.end();
      return;
    }
    next(err);
  }
});

export default proxyRouter;

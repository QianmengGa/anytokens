import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { proxyService } from '../services/proxy.service.js';
import { keysService } from '../services/keys.service.js';
import { checkKeyRateLimit } from '../services/rateLimitService.js';
import { triggerWebhook, WEBHOOK_EVENTS } from '../services/webhookService.js';
import { Errors } from '../utils/errors.js';
import type { RoutingStrategy } from '../config/models.js';

const proxyRouter = Router();

// 合法的路由策略值
const VALID_STRATEGIES = new Set(['price', 'speed', 'quality']);

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

    // 解析路由策略（X-Routing-Strategy 请求头）
    const strategyHeader = req.headers['x-routing-strategy'] as string | undefined;
    let strategy: RoutingStrategy | undefined;
    if (strategyHeader && VALID_STRATEGIES.has(strategyHeader)) {
      strategy = strategyHeader as RoutingStrategy;
    }

    // 提取客户端 IP
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : (req.ip || '');

    // 验证 API Key 并获取记录
    const keyRecord = await keysService.verifyKey(apiKey);

    // 速率限制检查（每分钟/每日/每月）
    const rateLimitResult = await checkKeyRateLimit(
      keyRecord.id,
      keyRecord.rateLimit ?? null,
      keyRecord.dailyLimit ?? null,
      keyRecord.monthlyLimit ?? null,
    );
    if (!rateLimitResult.allowed) {
      // Webhook: API Key 达到限速上限
      triggerWebhook(keyRecord.userId, WEBHOOK_EVENTS.KEY_LIMIT_REACHED, {
        keyId: keyRecord.id,
        keyName: keyRecord.name,
        limitType: rateLimitResult.limitType,
      });

      res.setHeader('Retry-After', String(rateLimitResult.retryAfter));
      res.status(429).json({
        error: {
          message: `Rate limit exceeded. Retry after ${rateLimitResult.retryAfter} seconds.`,
          type: 'rate_limit_exceeded',
          limit_type: rateLimitResult.limitType,
        },
      });
      return;
    }

    // 交给 proxyService 处理（传入已验证的 keyRecord，避免重复查询）
    await proxyService.handleChatCompletionWithKey(keyRecord, req.body, res, clientIp, strategy);
  } catch (err) {
    if (res.headersSent) {
      res.end();
      return;
    }
    next(err);
  }
});

export default proxyRouter;

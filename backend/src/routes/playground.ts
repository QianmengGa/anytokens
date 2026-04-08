import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../config/database.js';
import { proxyService } from '../services/proxy.service.js';
import { Errors } from '../utils/errors.js';
import type { AuthRequest } from '../types/index.js';

const playgroundRouter = Router();

// JWT 认证
playgroundRouter.use(authenticate as any);

// POST /playground/completions — Playground 专用中转（使用 JWT 认证）
playgroundRouter.post('/completions', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    // 查找用户第一个活跃的 API Key
    const apiKey = await prisma.apiKey.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, balance: true, isActive: true } } },
    });

    if (!apiKey) {
      throw Errors.badRequest('请先创建 API Key');
    }

    // 校验请求体
    const { model, messages } = req.body;
    if (!model || typeof model !== 'string') {
      throw Errors.badRequest('缺少 model 参数');
    }
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw Errors.badRequest('缺少 messages 参数');
    }

    // 使用指定的 keyId（支持用户切换 Key）
    const keyId = req.body._keyId;
    let selectedKey = apiKey;
    if (keyId) {
      const found = await prisma.apiKey.findFirst({
        where: { id: keyId, userId, isActive: true },
        include: { user: { select: { id: true, balance: true, isActive: true } } },
      });
      if (found) selectedKey = found;
    }

    // 更新最后使用时间
    await prisma.apiKey.update({
      where: { id: selectedKey.id },
      data: { lastUsedAt: new Date() },
    });

    // 直接调用 proxy service（绕过 API Key 验证，直接传入已验证的 key 信息）
    await proxyService.handleChatCompletionWithKey(selectedKey, req.body, res);
  } catch (err) {
    if (res.headersSent) {
      res.end();
      return;
    }
    next(err);
  }
});

export default playgroundRouter;

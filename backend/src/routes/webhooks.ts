import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { success } from '../utils/response.js';
import { Errors } from '../utils/errors.js';
import { WEBHOOK_EVENTS } from '../services/webhookService.js';
import type { AuthRequest } from '../types/index.js';

const webhooksRouter = Router();

// 所有路由需要认证
webhooksRouter.use(authenticate as any);

// 合法事件列表
const VALID_EVENTS = new Set(Object.values(WEBHOOK_EVENTS));

// GET / — 列出当前用户所有 Webhook（不返回 secret）
webhooksRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: { userId: req.user!.id },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, webhooks);
  } catch (err) {
    next(err);
  }
});

// POST / — 创建 Webhook
webhooksRouter.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { url, events, description } = req.body;

    // 验证 url
    if (!url || typeof url !== 'string' || !url.startsWith('https://')) {
      throw Errors.badRequest('url 必须以 https:// 开头');
    }

    // 验证 events
    if (!Array.isArray(events) || events.length === 0) {
      throw Errors.badRequest('events 至少选择一个事件');
    }
    for (const e of events) {
      if (!VALID_EVENTS.has(e)) {
        throw Errors.badRequest(`不支持的事件类型: ${e}`);
      }
    }

    // 生成 secret
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await prisma.webhook.create({
      data: {
        userId: req.user!.id,
        url,
        secret,
        events,
        description: description || null,
      },
    });

    // 创建时返回包含 secret 的完整对象（仅此一次）
    return success(res, webhook, 'Webhook 创建成功', 201);
  } catch (err) {
    next(err);
  }
});

// PUT /:id — 更新 Webhook
webhooksRouter.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    // 验证归属
    const existing = await prisma.webhook.findFirst({ where: { id, userId } });
    if (!existing) {
      throw Errors.notFound('Webhook 不存在');
    }

    const { url, events, description, isActive } = req.body;
    const data: any = {};

    if (url !== undefined) {
      if (typeof url !== 'string' || !url.startsWith('https://')) {
        throw Errors.badRequest('url 必须以 https:// 开头');
      }
      data.url = url;
    }

    if (events !== undefined) {
      if (!Array.isArray(events) || events.length === 0) {
        throw Errors.badRequest('events 至少选择一个事件');
      }
      for (const e of events) {
        if (!VALID_EVENTS.has(e)) {
          throw Errors.badRequest(`不支持的事件类型: ${e}`);
        }
      }
      data.events = events;
    }

    if (description !== undefined) data.description = description;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const updated = await prisma.webhook.update({
      where: { id },
      data,
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return success(res, updated, 'Webhook 已更新');
  } catch (err) {
    next(err);
  }
});

// DELETE /:id — 删除 Webhook
webhooksRouter.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const existing = await prisma.webhook.findFirst({ where: { id, userId } });
    if (!existing) {
      throw Errors.notFound('Webhook 不存在');
    }

    await prisma.webhook.delete({ where: { id } });
    return success(res, null, '已删除');
  } catch (err) {
    next(err);
  }
});

// GET /:id/deliveries — 最近 50 条投递记录
webhooksRouter.get('/:id/deliveries', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    // 验证归属
    const existing = await prisma.webhook.findFirst({ where: { id, userId } });
    if (!existing) {
      throw Errors.notFound('Webhook 不存在');
    }

    const deliveries = await prisma.webhookDelivery.findMany({
      where: { webhookId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return success(res, deliveries);
  } catch (err) {
    next(err);
  }
});

export default webhooksRouter;

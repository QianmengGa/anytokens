import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../config/database.js';
import { success } from '../utils/response.js';
import { Errors } from '../utils/errors.js';
import type { AuthRequest } from '../types/index.js';

const conversationsRouter = Router();

// 所有对话路由需要认证
conversationsRouter.use(authenticate as any);

// GET / — 返回当前用户所有对话列表，按 updatedAt 倒序
conversationsRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true },
        },
      },
    });

    // 格式化：附带最后一条消息预览
    const result = conversations.map((c) => ({
      id: c.id,
      title: c.title,
      model: c.model,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      lastMessage: c.messages[0]?.content?.substring(0, 50) ?? null,
    }));

    return success(res, result);
  } catch (err) {
    next(err);
  }
});

// POST / — 创建新对话
conversationsRouter.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { title, model } = req.body;

    const conversation = await prisma.conversation.create({
      data: {
        userId,
        title: title || 'New Conversation',
        model: model || 'deepseek-v3',
      },
    });

    return success(res, conversation, 'ok', 201);
  } catch (err) {
    next(err);
  }
});

// GET /:id — 返回对话详情 + 所有消息
conversationsRouter.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation || conversation.userId !== userId) {
      return next(Errors.notFound('对话不存在'));
    }

    return success(res, conversation);
  } catch (err) {
    next(err);
  }
});

// PATCH /:id — 更新对话标题或模型
conversationsRouter.patch('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const { title, model } = req.body;

    // 检查对话归属
    const existing = await prisma.conversation.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return next(Errors.notFound('对话不存在'));
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(model !== undefined && { model }),
      },
    });

    return success(res, updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /:id — 删除对话及其所有消息
conversationsRouter.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    // 检查对话归属
    const existing = await prisma.conversation.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return next(Errors.notFound('对话不存在'));
    }

    await prisma.conversation.delete({ where: { id } });

    return success(res, null, '对话已删除');
  } catch (err) {
    next(err);
  }
});

// POST /:id/messages — 向对话添加一条消息
conversationsRouter.post('/:id/messages', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const { role, content, inputTokens, outputTokens, cost } = req.body;

    if (!role || !content) {
      return next(Errors.badRequest('role 和 content 为必填字段'));
    }

    // 检查对话归属
    const existing = await prisma.conversation.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return next(Errors.notFound('对话不存在'));
    }

    // 创建消息并更新对话的 updatedAt
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: id,
          role,
          content,
          inputTokens: inputTokens ?? null,
          outputTokens: outputTokens ?? null,
          cost: cost ?? null,
        },
      }),
      prisma.conversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      }),
    ]);

    return success(res, message, 'ok', 201);
  } catch (err) {
    next(err);
  }
});

export default conversationsRouter;

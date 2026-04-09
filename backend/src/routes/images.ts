import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { IMAGE_MODELS, getProviderConfig } from '../config/models.js';
import { keysService } from '../services/keys.service.js';
import { Errors } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const imagesRouter = Router();

// POST /images/generations — OpenAI 兼容图片生成接口
imagesRouter.post('/images/generations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startTime = Date.now();

    // 验证 API Key
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw Errors.unauthorized('缺少 API Key');
    const keyRecord = await keysService.verifyKey(authHeader.substring(7));
    const userId = keyRecord.userId;
    const teamId = (keyRecord as any).teamId as string | undefined;

    // 解析模型 + 参数
    const { model = 'dall-e-3', prompt, n = 1, size = '1024x1024', quality = 'standard' } = req.body;
    if (!prompt) throw Errors.badRequest('缺少 prompt 参数');

    // HD 用更贵的定价
    const modelKey = quality === 'hd' ? 'dall-e-3-hd' : (model || 'dall-e-3');
    const modelCfg = IMAGE_MODELS[modelKey] || IMAGE_MODELS['dall-e-3'];

    // 余额预检
    const imageCount = Math.min(n, 4);
    const estimatedCost = imageCount * modelCfg.pricePerUnit;
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { balance: true } });
    const balance = teamId
      ? Number((await prisma.team.findUniqueOrThrow({ where: { id: teamId }, select: { balance: true } })).balance)
      : Number(user.balance);
    if (balance < estimatedCost) throw Errors.forbidden('余额不足');

    // 转发到上游
    const providerCfg = getProviderConfig(modelCfg.provider);
    const upstreamRes = await fetch(`${providerCfg.baseUrl}/images/generations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${providerCfg.apiKey}` },
      body: JSON.stringify({ model: modelCfg.upstreamModel, prompt, n: imageCount, size, quality }),
    });

    if (!upstreamRes.ok) {
      const err = await upstreamRes.text().catch(() => '');
      logger.error(`Images 上游错误 ${upstreamRes.status}: ${err}`);
      throw Errors.internal(`图片生成服务异常 (${upstreamRes.status})`);
    }

    const data = await upstreamRes.json() as any;
    const actualCount = data.data?.length || imageCount;
    const cost = actualCount * modelCfg.pricePerUnit;
    const latencyMs = Date.now() - startTime;

    // 计费
    await prisma.$transaction(async (tx) => {
      if (teamId) {
        await tx.team.update({ where: { id: teamId }, data: { balance: { decrement: cost } } });
      } else {
        await tx.user.update({ where: { id: userId }, data: { balance: { decrement: cost } } });
      }
      await tx.usageLog.create({
        data: {
          userId, apiKeyId: keyRecord.id, model: modelKey,
          promptTokens: 0, completionTokens: 0, totalTokens: actualCount, cost, latencyMs,
          status: 'success',
        },
      });
    });

    res.json(data);
  } catch (err) { next(err); }
});

export default imagesRouter;

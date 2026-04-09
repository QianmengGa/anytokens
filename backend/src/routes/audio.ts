import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { TTS_MODELS, getProviderConfig } from '../config/models.js';
import { keysService } from '../services/keys.service.js';
import { Errors } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const audioRouter = Router();

// POST /audio/speech — OpenAI 兼容 TTS 接口
audioRouter.post('/audio/speech', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startTime = Date.now();

    // 验证 API Key
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw Errors.unauthorized('缺少 API Key');
    const keyRecord = await keysService.verifyKey(authHeader.substring(7));
    const userId = keyRecord.userId;
    const teamId = (keyRecord as any).teamId as string | undefined;

    // 解析参数
    const { model = 'tts-1', input, voice = 'alloy' } = req.body;
    if (!input || typeof input !== 'string') throw Errors.badRequest('缺少 input 参数');

    const modelCfg = TTS_MODELS[model];
    if (!modelCfg) {
      throw Errors.badRequest(`不支持的 TTS 模型: ${model}。支持: ${Object.keys(TTS_MODELS).join(', ')}`);
    }

    // 余额预检
    const charCount = input.length;
    const estimatedCost = charCount * modelCfg.pricePerUnit;
    const balance = teamId
      ? Number((await prisma.team.findUniqueOrThrow({ where: { id: teamId }, select: { balance: true } })).balance)
      : Number((await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { balance: true } })).balance);
    if (balance < estimatedCost) throw Errors.forbidden('余额不足');

    // 转发到上游
    const providerCfg = getProviderConfig(modelCfg.provider);
    const upstreamRes = await fetch(`${providerCfg.baseUrl}/audio/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${providerCfg.apiKey}` },
      body: JSON.stringify({ model: modelCfg.upstreamModel, input, voice }),
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
      const err = await upstreamRes.text().catch(() => '');
      logger.error(`TTS 上游错误 ${upstreamRes.status}: ${err}`);
      throw Errors.internal(`TTS 服务异常 (${upstreamRes.status})`);
    }

    const cost = charCount * modelCfg.pricePerUnit;
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
          userId, apiKeyId: keyRecord.id, model,
          promptTokens: charCount, completionTokens: 0, totalTokens: charCount, cost, latencyMs,
          status: 'success',
        },
      });
    });

    // 流式返回音频二进制
    const contentType = upstreamRes.headers.get('content-type') || 'audio/mpeg';
    res.setHeader('Content-Type', contentType);
    const reader = upstreamRes.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    } finally {
      res.end();
    }
  } catch (err) {
    if (res.headersSent) { res.end(); return; }
    next(err);
  }
});

export default audioRouter;

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { EMBEDDING_MODELS, getProviderConfig } from '../config/models.js';
import { keysService } from '../services/keys.service.js';
import { Errors } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const embeddingsRouter = Router();

// POST /embeddings — OpenAI 兼容 Embeddings 接口
embeddingsRouter.post('/embeddings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startTime = Date.now();

    // 验证 API Key
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw Errors.unauthorized('缺少 API Key');
    const keyRecord = await keysService.verifyKey(authHeader.substring(7));
    const userId = keyRecord.userId;
    const isTeamKey = (keyRecord as any).isTeamKey;
    const teamId = (keyRecord as any).teamId as string | undefined;

    // 解析模型
    const { model, input } = req.body;
    const modelCfg = EMBEDDING_MODELS[model];
    if (!modelCfg) {
      throw Errors.badRequest(`不支持的 Embedding 模型: ${model}。支持: ${Object.keys(EMBEDDING_MODELS).join(', ')}`);
    }

    // 转发到上游
    const providerCfg = getProviderConfig(modelCfg.provider);
    const upstreamRes = await fetch(`${providerCfg.baseUrl}/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${providerCfg.apiKey}` },
      body: JSON.stringify({ model: modelCfg.upstreamModel, input }),
    });

    if (!upstreamRes.ok) {
      const err = await upstreamRes.text().catch(() => '');
      logger.error(`Embeddings 上游错误 ${upstreamRes.status}: ${err}`);
      throw Errors.internal(`Embedding 服务异常 (${upstreamRes.status})`);
    }

    const data = await upstreamRes.json() as any;
    const totalTokens = data.usage?.total_tokens || 0;
    const cost = totalTokens * modelCfg.pricePerUnit;
    const latencyMs = Date.now() - startTime;

    // 计费
    if (cost > 0) {
      await prisma.$transaction(async (tx) => {
        if (teamId) {
          await tx.team.update({ where: { id: teamId }, data: { balance: { decrement: cost } } });
        } else {
          await tx.user.update({ where: { id: userId }, data: { balance: { decrement: cost } } });
        }
        await tx.usageLog.create({
          data: {
            userId, apiKeyId: keyRecord.id, model,
            promptTokens: totalTokens, completionTokens: 0, totalTokens, cost, latencyMs,
            status: 'success',
          },
        });
      });
    }

    data.model = model;
    res.json(data);
  } catch (err) { next(err); }
});

export default embeddingsRouter;

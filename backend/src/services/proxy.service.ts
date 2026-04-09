import type { Response } from 'express';
import { prisma } from '../config/database.js';
import {
  resolveModelConfig, calculateCost, getProviderConfig,
  type ProviderOption, type RoutingStrategy, type ModelPricing,
} from '../config/models.js';
import { keysService } from './keys.service.js';
import { providerHealth } from './provider-health.js';
import { Errors } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

// 赠送余额单次调用费用上限（美元）
const BONUS_CALL_LIMIT = 0.10;
// 赠送余额阈值
const BONUS_BALANCE_THRESHOLD = 0.50;

// OpenAI 兼容请求体
interface ChatCompletionRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

class ProxyService {
  // 处理 chat/completions 请求（支持智能路由）
  async handleChatCompletion(
    apiKey: string,
    body: ChatCompletionRequest,
    res: Response,
    clientIp?: string,
    strategyOverride?: RoutingStrategy,
  ) {
    const startTime = Date.now();

    // 1. 验证 API Key
    const keyRecord = await keysService.verifyKey(apiKey);
    const userId = keyRecord.userId;
    const userBalance = Number(keyRecord.user.balance);

    // 2. 解析模型（获取所有供应商选项）
    const modelResult = resolveModelConfig(body.model);
    if (!modelResult) {
      throw Errors.badRequest(`不支持的模型: ${body.model}`);
    }

    // 3. 确定路由策略（请求头优先 > 用户设置 > 默认）
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { routingStrategy: true },
    });
    const strategy: RoutingStrategy = strategyOverride || (user.routingStrategy as RoutingStrategy) || 'price';

    // 4. 按策略排序供应商
    const sortedProviders = providerHealth.sortByStrategy(modelResult.config.providers, strategy);

    // 5. 取第一个供应商做余额/限额检查（价格检查用最便宜的）
    const primaryProvider = sortedProviders[0];
    if (!primaryProvider.free && userBalance <= 0) {
      throw Errors.forbidden('余额不足，请先充值');
    }
    if (!primaryProvider.free && userBalance <= BONUS_BALANCE_THRESHOLD) {
      const maxTok = body.max_tokens || 4096;
      const estimated = calculateCost(primaryProvider, maxTok, maxTok);
      if (estimated.totalCost > BONUS_CALL_LIMIT) {
        throw Errors.forbidden('单次调用超出免费额度限制，请充值后使用高费用模型');
      }
    }
    if (!primaryProvider.free) {
      const maxTok = body.max_tokens || 4096;
      const estimated = calculateCost(primaryProvider, maxTok, maxTok);
      await this.checkSpendingLimits(userId, estimated.totalCost);
    }

    // 6. 依次尝试供应商（故障转移）
    const ctx: RequestContext = {
      userId,
      apiKeyId: keyRecord.id,
      teamId: (keyRecord as any).teamId || undefined,
      model: modelResult.displayName,
      modelConfig: primaryProvider,
      startTime,
      clientIp,
    };

    await this.tryProviders(sortedProviders, body, res, ctx);
  }

  // Playground 专用
  async handleChatCompletionWithKey(
    keyRecord: any,
    body: ChatCompletionRequest,
    res: Response,
    clientIp?: string,
    strategyOverride?: RoutingStrategy,
  ) {
    const startTime = Date.now();
    const userId = keyRecord.userId;
    const userBalance = Number(keyRecord.user.balance);

    const modelResult = resolveModelConfig(body.model);
    if (!modelResult) {
      throw Errors.badRequest(`不支持的模型: ${body.model}`);
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { routingStrategy: true },
    });
    const strategy: RoutingStrategy = strategyOverride || (user.routingStrategy as RoutingStrategy) || 'price';
    const sortedProviders = providerHealth.sortByStrategy(modelResult.config.providers, strategy);
    const primaryProvider = sortedProviders[0];

    if (!primaryProvider.free && userBalance <= 0) {
      throw Errors.forbidden('余额不足，请先充值');
    }
    if (!primaryProvider.free && userBalance <= BONUS_BALANCE_THRESHOLD) {
      const maxTok = body.max_tokens || 4096;
      const estimated = calculateCost(primaryProvider, maxTok, maxTok);
      if (estimated.totalCost > BONUS_CALL_LIMIT) {
        throw Errors.forbidden('单次调用超出免费额度限制，请充值后使用高费用模型');
      }
    }
    if (!primaryProvider.free) {
      const maxTok = body.max_tokens || 4096;
      const estimated = calculateCost(primaryProvider, maxTok, maxTok);
      await this.checkSpendingLimits(userId, estimated.totalCost);
    }

    const ctx: RequestContext = {
      userId,
      apiKeyId: keyRecord.id,
      model: modelResult.displayName,
      modelConfig: primaryProvider,
      startTime,
      clientIp,
    };

    await this.tryProviders(sortedProviders, body, res, ctx);
  }

  // 依次尝试供应商列表（故障自动转移）
  private async tryProviders(
    providers: ProviderOption[],
    body: ChatCompletionRequest,
    res: Response,
    ctx: RequestContext,
  ) {
    let lastError: Error | null = null;

    for (let i = 0; i < providers.length; i++) {
      const option = providers[i];
      const providerCfg = getProviderConfig(option.provider);
      const upstreamUrl = `${providerCfg.baseUrl}/chat/completions`;
      const upstreamBody = {
        model: option.upstreamModel,
        messages: body.messages,
        stream: body.stream ?? false,
        ...(body.temperature !== undefined && { temperature: body.temperature }),
        ...(body.max_tokens !== undefined && { max_tokens: body.max_tokens }),
        ...(body.top_p !== undefined && { top_p: body.top_p }),
        ...(body.frequency_penalty !== undefined && { frequency_penalty: body.frequency_penalty }),
        ...(body.presence_penalty !== undefined && { presence_penalty: body.presence_penalty }),
      };
      const upstreamHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${providerCfg.apiKey}`,
      };

      // 更新 ctx 的 modelConfig 为当前尝试的供应商
      ctx.modelConfig = option;

      try {
        if (body.stream) {
          await this.handleStream(upstreamUrl, upstreamHeaders, upstreamBody, res, ctx);
        } else {
          await this.handleNonStream(upstreamUrl, upstreamHeaders, upstreamBody, res, ctx);
        }
        // 成功，记录指标并返回
        const latency = Date.now() - ctx.startTime;
        providerHealth.recordSuccess(option.provider, latency);
        // 响应头标注实际使用的供应商
        if (!res.headersSent) {
          res.setHeader('X-Provider', option.provider);
        }
        return;
      } catch (err: any) {
        providerHealth.recordFailure(option.provider);
        lastError = err;

        // 如果已发送响应头（流式），无法重试
        if (res.headersSent) throw err;

        // 最后一个供应商也失败，抛出错误
        if (i === providers.length - 1) throw err;

        // 还有备用供应商，记录日志并继续
        logger.warn(`供应商 ${option.provider} 失败，切换到备用: ${err.message}`);
      }
    }

    throw lastError || Errors.internal('所有供应商均不可用');
  }

  // 非流式请求
  private async handleNonStream(
    url: string,
    headers: Record<string, string>,
    body: any,
    res: Response,
    ctx: RequestContext,
  ) {
    let upstreamRes: globalThis.Response;
    try {
      upstreamRes = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
    } catch (err) {
      await this.logUsage(ctx, 0, 0, 'error', '上游服务连接失败');
      throw Errors.internal('上游服务连接失败');
    }

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text().catch(() => '');
      logger.error(`上游返回 ${upstreamRes.status}: ${errText}`);
      await this.logUsage(ctx, 0, 0, 'error', `上游错误 ${upstreamRes.status}`);
      throw Errors.internal(`模型服务异常 (${upstreamRes.status})`);
    }

    const data = await upstreamRes.json() as any;
    const usage = data.usage || {};
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;

    await this.chargeAndLog(ctx, promptTokens, completionTokens);

    data.model = ctx.model;
    res.setHeader('X-Provider', ctx.modelConfig.provider);
    res.json(data);
  }

  // 流式请求（SSE）
  private async handleStream(
    url: string,
    headers: Record<string, string>,
    body: any,
    res: Response,
    ctx: RequestContext,
  ) {
    let upstreamRes: globalThis.Response;
    try {
      upstreamRes = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
    } catch (err) {
      await this.logUsage(ctx, 0, 0, 'error', '上游服务连接失败');
      throw Errors.internal('上游服务连接失败');
    }

    if (!upstreamRes.ok || !upstreamRes.body) {
      const errText = await upstreamRes.text().catch(() => '');
      logger.error(`上游流式返回 ${upstreamRes.status}: ${errText}`);
      await this.logUsage(ctx, 0, 0, 'error', `上游错误 ${upstreamRes.status}`);
      throw Errors.internal(`模型服务异常 (${upstreamRes.status})`);
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('X-Provider', ctx.modelConfig.provider);
    res.flushHeaders();

    let promptTokens = 0;
    let completionTokens = 0;
    const reader = upstreamRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) { res.write('\n'); continue; }
          if (line.startsWith('data: ')) {
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') { res.write('data: [DONE]\n\n'); continue; }
            try {
              const chunk = JSON.parse(payload);
              if (chunk.usage) {
                promptTokens = chunk.usage.prompt_tokens || promptTokens;
                completionTokens = chunk.usage.completion_tokens || completionTokens;
              }
              chunk.model = ctx.model;
              res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            } catch { res.write(line + '\n'); }
          } else {
            res.write(line + '\n');
          }
        }
      }
      if (buffer.trim()) res.write(buffer + '\n');
    } catch (err) {
      logger.error('流式传输中断:', err);
    } finally {
      res.end();
    }

    await this.chargeAndLog(ctx, promptTokens, completionTokens);
  }

  // 计费、扣款、记录日志 + 返佣
  private async chargeAndLog(ctx: RequestContext, promptTokens: number, completionTokens: number) {
    const totalTokens = promptTokens + completionTokens;
    const { totalCost } = calculateCost(ctx.modelConfig, promptTokens, completionTokens);
    const latencyMs = Date.now() - ctx.startTime;

    try {
      await prisma.$transaction(async (tx) => {
        if (totalCost > 0) {
          if (ctx.teamId) {
            // 团队 Key → 从团队余额扣费
            const team = await tx.team.findUniqueOrThrow({ where: { id: ctx.teamId } });
            const balanceBefore = Number(team.balance);
            await tx.team.update({
              where: { id: ctx.teamId },
              data: { balance: { decrement: totalCost } },
            });
            await tx.transaction.create({
              data: {
                userId: ctx.userId,
                type: 'USAGE',
                amount: totalCost,
                balanceBefore,
                balanceAfter: balanceBefore - totalCost,
                status: 'COMPLETED',
                paymentMethod: 'SYSTEM',
                description: `[团队] API 调用: ${ctx.model} (${totalTokens} tokens)`,
              },
            });
          } else {
            // 个人 Key → 从个人余额扣费
            const user = await tx.user.findUniqueOrThrow({ where: { id: ctx.userId } });
            const balanceBefore = Number(user.balance);
            await tx.user.update({
              where: { id: ctx.userId },
              data: { balance: { decrement: totalCost } },
            });
            await tx.transaction.create({
              data: {
                userId: ctx.userId,
                type: 'USAGE',
                amount: totalCost,
                balanceBefore,
                balanceAfter: balanceBefore - totalCost,
                status: 'COMPLETED',
                paymentMethod: 'SYSTEM',
                description: `API 调用: ${ctx.model} (${totalTokens} tokens)`,
              },
            });
          }
        }

        const usageLog = await tx.usageLog.create({
          data: {
            userId: ctx.userId,
            apiKeyId: ctx.apiKeyId,
            model: ctx.model,
            promptTokens,
            completionTokens,
            totalTokens,
            cost: totalCost,
            latencyMs,
            status: 'success',
            clientIp: ctx.clientIp || null,
          },
        });

        // 返佣：被邀请人消费后，邀请人获得 10% 返佣
        if (totalCost > 0) {
          const consumer = await tx.user.findUnique({
            where: { id: ctx.userId },
            select: { referredBy: true },
          });
          if (consumer?.referredBy) {
            const commissionAmount = totalCost * 0.10;
            // 给邀请人加余额
            await tx.user.update({
              where: { id: consumer.referredBy },
              data: { balance: { increment: commissionAmount } },
            });
            // 记录返佣
            await tx.commission.create({
              data: {
                id: crypto.randomUUID(),
                referrerId: consumer.referredBy,
                refereeId: ctx.userId,
                usageLogId: usageLog.id,
                usageCost: totalCost,
                commission: commissionAmount,
              },
            });
          }
        }
      });
    } catch (err) {
      logger.error('计费/日志记录失败:', err);
    }
  }

  // 检查用户消费限额
  private async checkSpendingLimits(userId: string, estimatedCost: number) {
    if (estimatedCost <= 0) return;

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { maxPerRequest: true, maxPerDay: true, maxPerMonth: true },
    });

    const maxReq = user.maxPerRequest ? Number(user.maxPerRequest) : null;
    if (maxReq !== null && estimatedCost > maxReq) {
      throw Errors.forbidden(`单次调用预估费用 $${estimatedCost.toFixed(4)} 超出限额 $${maxReq.toFixed(2)}`);
    }

    const maxDay = user.maxPerDay ? Number(user.maxPerDay) : null;
    if (maxDay !== null) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todaySpent = await prisma.usageLog.aggregate({
        where: { userId, createdAt: { gte: todayStart }, status: 'success' },
        _sum: { cost: true },
      });
      const spent = Number(todaySpent._sum.cost || 0);
      if (spent + estimatedCost > maxDay) {
        throw Errors.forbidden(`今日消费将超出日限额 $${maxDay.toFixed(2)}`);
      }
    }

    const maxMonth = user.maxPerMonth ? Number(user.maxPerMonth) : null;
    if (maxMonth !== null) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthSpent = await prisma.usageLog.aggregate({
        where: { userId, createdAt: { gte: monthStart }, status: 'success' },
        _sum: { cost: true },
      });
      const spent = Number(monthSpent._sum.cost || 0);
      if (spent + estimatedCost > maxMonth) {
        throw Errors.forbidden(`本月消费将超出月限额 $${maxMonth.toFixed(2)}`);
      }
    }
  }

  // 记录失败日志
  private async logUsage(ctx: RequestContext, prompt: number, completion: number, status: string, errorMessage: string) {
    try {
      await prisma.usageLog.create({
        data: {
          userId: ctx.userId,
          apiKeyId: ctx.apiKeyId,
          model: ctx.model,
          promptTokens: prompt,
          completionTokens: completion,
          totalTokens: prompt + completion,
          cost: 0,
          latencyMs: Date.now() - ctx.startTime,
          status,
          errorMessage,
          clientIp: ctx.clientIp || null,
        },
      });
    } catch (err) {
      logger.error('写入错误日志失败:', err);
    }
  }
}

// 请求上下文
interface RequestContext {
  userId: string;
  apiKeyId: string;
  teamId?: string;
  model: string;
  modelConfig: ProviderOption;
  startTime: number;
  clientIp?: string;
}

export const proxyService = new ProxyService();

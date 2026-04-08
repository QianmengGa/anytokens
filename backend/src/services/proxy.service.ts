import type { Response } from 'express';
import { prisma } from '../config/database.js';
import { config } from '../config/index.js';
import { resolveModel, calculateCost } from '../config/models.js';
import { keysService } from './keys.service.js';
import { Errors } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

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
  // 处理 chat/completions 请求
  async handleChatCompletion(apiKey: string, body: ChatCompletionRequest, res: Response) {
    const startTime = Date.now();

    // 1. 验证 API Key
    const keyRecord = await keysService.verifyKey(apiKey);
    const userId = keyRecord.userId;
    const userBalance = Number(keyRecord.user.balance);

    // 2. 解析模型
    const modelConfig = resolveModel(body.model);
    if (!modelConfig) {
      throw Errors.badRequest(`不支持的模型: ${body.model}。支持的模型: deepseek-v3, deepseek-r1, qwen2.5-72b, glm-4-flash, llama-3.1-8b`);
    }

    // 3. 检查余额（免费模型跳过）
    if (!modelConfig.free && userBalance <= 0) {
      throw Errors.forbidden('余额不足，请先充值');
    }

    // 4. 构建上游请求
    const upstreamUrl = `${config.siliconflowBaseUrl}/chat/completions`;
    const upstreamBody = {
      model: modelConfig.upstreamModel,
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
      'Authorization': `Bearer ${config.siliconflowApiKey}`,
    };

    // 5. 转发请求
    if (body.stream) {
      await this.handleStream(upstreamUrl, upstreamHeaders, upstreamBody, res, {
        userId,
        apiKeyId: keyRecord.id,
        model: modelConfig.displayName,
        modelConfig,
        startTime,
      });
    } else {
      await this.handleNonStream(upstreamUrl, upstreamHeaders, upstreamBody, res, {
        userId,
        apiKeyId: keyRecord.id,
        model: modelConfig.displayName,
        modelConfig,
        startTime,
      });
    }
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

    // 提取 token 用量
    const usage = data.usage || {};
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;

    // 计费并扣款
    await this.chargeAndLog(ctx, promptTokens, completionTokens);

    // 返回响应（替换模型名为用户请求的模型名）
    data.model = ctx.model;
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

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // 流式转发并收集 usage
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
        // 保留最后一个可能不完整的行
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) {
            res.write('\n');
            continue;
          }

          if (line.startsWith('data: ')) {
            const payload = line.slice(6).trim();

            if (payload === '[DONE]') {
              res.write('data: [DONE]\n\n');
              continue;
            }

            try {
              const chunk = JSON.parse(payload);

              // 提取流式 usage（部分供应商在最后一个 chunk 返回）
              if (chunk.usage) {
                promptTokens = chunk.usage.prompt_tokens || promptTokens;
                completionTokens = chunk.usage.completion_tokens || completionTokens;
              }

              // 替换模型名
              chunk.model = ctx.model;
              res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            } catch {
              // JSON 解析失败，原样转发
              res.write(line + '\n');
            }
          } else {
            res.write(line + '\n');
          }
        }
      }

      // 处理 buffer 中剩余数据
      if (buffer.trim()) {
        res.write(buffer + '\n');
      }
    } catch (err) {
      logger.error('流式传输中断:', err);
    } finally {
      res.end();
    }

    // 流式结束后计费（如上游没有返回 usage，用估算值）
    await this.chargeAndLog(ctx, promptTokens, completionTokens);
  }

  // 计费、扣款、记录日志
  private async chargeAndLog(ctx: RequestContext, promptTokens: number, completionTokens: number) {
    const totalTokens = promptTokens + completionTokens;
    const { inputCost, outputCost, totalCost } = calculateCost(ctx.modelConfig, promptTokens, completionTokens);
    const latencyMs = Date.now() - ctx.startTime;

    try {
      await prisma.$transaction(async (tx) => {
        // 扣减余额（免费模型费用为 0，也记录���志）
        if (totalCost > 0) {
          const user = await tx.user.findUniqueOrThrow({ where: { id: ctx.userId } });
          const balanceBefore = Number(user.balance);
          const balanceAfter = balanceBefore - totalCost;

          await tx.user.update({
            where: { id: ctx.userId },
            data: { balance: { decrement: totalCost } },
          });

          // 记录交易
          await tx.transaction.create({
            data: {
              userId: ctx.userId,
              type: 'USAGE',
              amount: totalCost,
              balanceBefore,
              balanceAfter,
              status: 'COMPLETED',
              paymentMethod: 'SYSTEM',
              description: `API 调用: ${ctx.model} (${totalTokens} tokens)`,
            },
          });
        }

        // 记录调用日志
        await tx.usageLog.create({
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
          },
        });
      });
    } catch (err) {
      // 计费失败不影响已返回的响应，仅记录错误
      logger.error('计费/日志记录失败:', err);
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
  model: string;
  modelConfig: ReturnType<typeof resolveModel> & {};
  startTime: number;
}

export const proxyService = new ProxyService();

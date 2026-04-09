import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

// 支持的 Webhook 事件类型
export const WEBHOOK_EVENTS = {
  BALANCE_LOW: 'balance.low',
  BALANCE_TOPUP: 'balance.topup',
  BALANCE_DEPLETED: 'balance.depleted',
  KEY_LIMIT_REACHED: 'key.limit_reached',
} as const;

// HMAC-SHA256 签名
function signPayload(secret: string, payload: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

// 触发 Webhook：查询匹配的 Webhook 并逐个投递
export async function triggerWebhook(userId: string, event: string, data: object): Promise<void> {
  let webhooks;
  try {
    webhooks = await prisma.webhook.findMany({
      where: {
        userId,
        isActive: true,
        events: { has: event },
      },
    });
  } catch (err) {
    logger.error('查询 Webhook 失败:', err);
    return;
  }

  if (webhooks.length === 0) return;

  const payload = JSON.stringify({ event, data, timestamp: new Date().toISOString() });

  for (const wh of webhooks) {
    const signature = signPayload(wh.secret, payload);

    let statusCode: number | null = null;
    let responseText: string | null = null;
    let success = false;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(wh.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event,
          'X-Webhook-Signature': `sha256=${signature}`,
        },
        body: payload,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      statusCode = res.status;
      responseText = (await res.text().catch(() => '')).slice(0, 1000);
      success = res.ok;
    } catch (err: any) {
      responseText = (err.message || 'Request failed').slice(0, 1000);
      logger.warn(`Webhook 投递失败: id=${wh.id}, url=${wh.url}, error=${responseText}`);
    }

    // 记录投递结果
    try {
      await prisma.webhookDelivery.create({
        data: {
          webhookId: wh.id,
          event,
          payload: JSON.parse(payload),
          statusCode,
          response: responseText,
          success,
          attempts: 1,
        },
      });
    } catch (err) {
      logger.error('记录 WebhookDelivery 失败:', err);
    }
  }
}

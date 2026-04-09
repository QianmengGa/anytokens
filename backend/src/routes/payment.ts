import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { config } from '../config/index.js';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { success } from '../utils/response.js';
import { Errors } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { emailService } from '../services/email.service.js';
import { triggerWebhook, WEBHOOK_EVENTS } from '../services/webhookService.js';
import type { AuthRequest } from '../types/index.js';

const paymentRouter = Router();

// 初始化 Stripe
const stripe = new Stripe(config.stripeSecretKey);

// 最低充值金额（美元）
const MIN_AMOUNT = 5;
// 最高充值金额（美元）
const MAX_AMOUNT = 10000;

// ==================== 创建 Checkout Session ====================

paymentRouter.post(
  '/create-checkout-session',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { amount } = req.body;
      const userId = req.user!.id;
      const userEmail = req.user!.email;

      // 参数校验
      if (!amount || typeof amount !== 'number') {
        throw Errors.badRequest('amount 必须为数字');
      }
      if (amount < MIN_AMOUNT) {
        throw Errors.badRequest(`最低充值金额为 $${MIN_AMOUNT}`);
      }
      if (amount > MAX_AMOUNT) {
        throw Errors.badRequest(`最高充值金额为 $${MAX_AMOUNT}`);
      }
      // 只允许整数或两位小数
      if (Math.round(amount * 100) !== amount * 100) {
        throw Errors.badRequest('金额最多支持两位小数');
      }

      // 创建一笔 PENDING 交易记录
      const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
      const balanceBefore = Number(user.balance);

      const transaction = await prisma.transaction.create({
        data: {
          userId,
          type: 'TOPUP',
          amount,
          balanceBefore,
          balanceAfter: balanceBefore, // webhook 成功后再更新
          status: 'PENDING',
          paymentMethod: 'STRIPE',
          description: `Stripe 充值 $${amount}`,
        },
      });

      // 创建 Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: userEmail,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Anytokens 充值 $${amount}`,
                description: 'AI API 余额充值',
              },
              unit_amount: Math.round(amount * 100), // Stripe 以分为单位
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId,
          amount: amount.toString(),
          transactionId: transaction.id,
        },
        success_url: `${config.frontendUrl}/billing?success=true`,
        cancel_url: `${config.frontendUrl}/billing?canceled=true`,
      });

      // 保存 Stripe Session ID 到交易记录
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { externalId: session.id },
      });

      logger.info(`用户 ${userEmail} 创建充值订单: $${amount}, session=${session.id}`);

      return success(res, { url: session.url }, '支付链接创建成功');
    } catch (err) {
      next(err);
    }
  },
);

// ==================== Stripe Webhook ====================
// 注意：此路由需要原始请求体（raw body），在 app.ts 中单独配置

paymentRouter.post(
  '/webhook',
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
      logger.warn('Stripe webhook 缺少签名');
      res.status(400).json({ error: '缺少 stripe-signature' });
      return;
    }

    let event: any;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, config.stripeWebhookSecret);
    } catch (err: any) {
      logger.error(`Stripe webhook 签名验证失败: ${err.message}`);
      res.status(400).json({ error: `签名验证失败: ${err.message}` });
      return;
    }

    // 处理事件
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(event.data.object);
    }

    // 返回 200 确认收到
    res.json({ received: true });
  },
);

// 处理支付完成事件
async function handleCheckoutCompleted(session: any) {
  const userId = session.metadata?.userId;
  const amount = parseFloat(session.metadata?.amount || '0');
  const transactionId = session.metadata?.transactionId;

  if (!userId || !amount) {
    logger.error('Stripe webhook metadata 缺少 userId 或 amount');
    return;
  }

  logger.info(`处理 Stripe 支付完成: userId=${userId}, amount=$${amount}, session=${session.id}`);

  try {
    // 检查是否已处理（防止重复处理）
    if (transactionId) {
      const existing = await prisma.transaction.findUnique({ where: { id: transactionId } });
      if (existing && existing.status === 'COMPLETED') {
        logger.info(`交易 ${transactionId} 已处理，跳过`);
        return;
      }
    }

    await prisma.$transaction(async (tx) => {
      // 获取用户当前余额
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      const balanceBefore = Number(user.balance);
      const balanceAfter = balanceBefore + amount;

      // 更新用户余额
      await tx.user.update({
        where: { id: userId },
        data: { balance: balanceAfter },
      });

      if (transactionId) {
        // 更新已有的 PENDING 交易记录
        await tx.transaction.update({
          where: { id: transactionId },
          data: {
            status: 'COMPLETED',
            balanceBefore,
            balanceAfter,
            externalId: session.id,
          },
        });
      } else {
        // 兜底：如果没有 transactionId，创建新记录
        await tx.transaction.create({
          data: {
            userId,
            type: 'TOPUP',
            amount,
            balanceBefore,
            balanceAfter,
            status: 'COMPLETED',
            paymentMethod: 'STRIPE',
            externalId: session.id,
            description: `Stripe 充值 $${amount}`,
          },
        });
      }
    });

    logger.info(`充值成功: userId=${userId}, +$${amount}`);

    // 异步发送充值收据邮件
    const updatedUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, balance: true } });
    if (updatedUser) {
      const newBalance = Number(updatedUser.balance);
      emailService.sendTopupReceipt(updatedUser.email, {
        amount,
        method: 'Stripe',
        balanceAfter: newBalance,
        transactionId: transactionId || session.id,
      });

      // Webhook: 充值成功
      triggerWebhook(userId, WEBHOOK_EVENTS.BALANCE_TOPUP, {
        amount,
        newBalance,
        currency: 'USD',
      });

      // Webhook: 余额不足
      if (newBalance < 5) {
        triggerWebhook(userId, WEBHOOK_EVENTS.BALANCE_LOW, {
          balance: newBalance,
          threshold: 5,
        });
      }
    }
  } catch (err) {
    logger.error('Stripe webhook 处理充值失败:', err);
  }
}

export default paymentRouter;

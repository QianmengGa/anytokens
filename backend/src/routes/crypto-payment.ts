import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config/index.js';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { success } from '../utils/response.js';
import { Errors } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { AuthRequest } from '../types/index.js';

const cryptoPaymentRouter = Router();

// NOWPayments API 基础地址
const NP_BASE = 'https://api.nowpayments.io/v1';

// 支持的加密货币
const SUPPORTED_CURRENCIES: Record<string, string> = {
  usdt: 'usdttrc20',  // USDT TRC20
  usdc: 'usdctrc20',  // USDC TRC20
};

// 最低/最高金额
const MIN_AMOUNT = 5;
const MAX_AMOUNT = 10000;

// ==================== 创建加密货币支付订单 ====================

cryptoPaymentRouter.post(
  '/create',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { amount, currency } = req.body;
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

      const currencyKey = (currency || 'usdt').toLowerCase();
      const payCurrency = SUPPORTED_CURRENCIES[currencyKey];
      if (!payCurrency) {
        throw Errors.badRequest(`不支持的币种: ${currency}。支持: USDT, USDC`);
      }

      // 创建 PENDING 交易记录
      const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
      const balanceBefore = Number(user.balance);

      const transaction = await prisma.transaction.create({
        data: {
          userId,
          type: 'TOPUP',
          amount,
          balanceBefore,
          balanceAfter: balanceBefore,
          status: 'PENDING',
          paymentMethod: 'CRYPTO',
          description: `${currencyKey.toUpperCase()} 充值 $${amount}`,
          metadata: { currency: currencyKey },
        },
      });

      // 调用 NOWPayments 创建支付
      const npRes = await fetch(`${NP_BASE}/payment`, {
        method: 'POST',
        headers: {
          'x-api-key': config.nowpaymentsApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_amount: amount,
          price_currency: 'usd',
          pay_currency: payCurrency,
          order_id: transaction.id,
          order_description: `Anytokens topup $${amount} by ${userEmail}`,
          ipn_callback_url: `${config.frontendUrl.replace(':3000', ':4000')}/api/v1/crypto-payment/webhook`,
        }),
      });

      if (!npRes.ok) {
        const errText = await npRes.text().catch(() => '');
        logger.error(`NOWPayments 创建支付失败 ${npRes.status}: ${errText}`);
        // 标记交易失败
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'FAILED' },
        });
        throw Errors.internal('创建加密货币支付失败，请稍后重试');
      }

      const npData = await npRes.json() as any;

      // 保存 NOWPayments 支付 ID
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          externalId: npData.payment_id?.toString(),
          metadata: {
            currency: currencyKey,
            nowpaymentsId: npData.payment_id,
            payAddress: npData.pay_address,
            payAmount: npData.pay_amount,
            payCurrency: npData.pay_currency,
          },
        },
      });

      logger.info(`用户 ${userEmail} 创建加密货币充值: $${amount} ${currencyKey}, paymentId=${npData.payment_id}`);

      return success(res, {
        paymentId: npData.payment_id,
        payAddress: npData.pay_address,
        payAmount: npData.pay_amount,
        payCurrency: npData.pay_currency,
        transactionId: transaction.id,
      }, '支付订单创建成功');
    } catch (err) {
      next(err);
    }
  },
);

// ==================== 查询支付状态 ====================

cryptoPaymentRouter.get(
  '/status/:paymentId',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { paymentId } = req.params;

      const npRes = await fetch(`${NP_BASE}/payment/${paymentId}`, {
        headers: { 'x-api-key': config.nowpaymentsApiKey },
      });

      if (!npRes.ok) {
        throw Errors.internal('查询支付状态失败');
      }

      const npData = await npRes.json() as any;

      return success(res, {
        paymentId: npData.payment_id,
        paymentStatus: npData.payment_status,
        payAddress: npData.pay_address,
        payAmount: npData.pay_amount,
        actuallyPaid: npData.actually_paid,
        payCurrency: npData.pay_currency,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ==================== NOWPayments IPN Webhook ====================

cryptoPaymentRouter.post(
  '/webhook',
  async (req: Request, res: Response) => {
    try {
      const ipnSignature = req.headers['x-nowpayments-sig'] as string;

      if (!ipnSignature) {
        logger.warn('NOWPayments webhook 缺少签名');
        res.status(400).json({ error: '缺少签名' });
        return;
      }

      // 验证 HMAC SHA512 签名
      // NOWPayments 要求对 body 的 key 排序后计算签名
      const body = req.body;
      const sortedBody = sortObject(body);
      const hmac = crypto
        .createHmac('sha512', config.nowpaymentsIpnSecret)
        .update(JSON.stringify(sortedBody))
        .digest('hex');

      if (hmac !== ipnSignature) {
        logger.error('NOWPayments webhook 签名验证失败');
        res.status(400).json({ error: '签名验证失败' });
        return;
      }

      logger.info(`NOWPayments webhook: status=${body.payment_status}, orderId=${body.order_id}, paymentId=${body.payment_id}`);

      // 只处理 finished 和 partially_paid 状态
      if (body.payment_status === 'finished' || body.payment_status === 'partially_paid') {
        await handlePaymentFinished(body);
      }

      res.json({ received: true });
    } catch (err) {
      logger.error('NOWPayments webhook 处理异常:', err);
      res.status(500).json({ error: 'internal' });
    }
  },
);

// 递归排序对象的 key（NOWPayments 签名要求）
function sortObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sortObject);
  const sorted: any = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = sortObject(obj[key]);
  }
  return sorted;
}

// 处理支付完成
async function handlePaymentFinished(body: any) {
  const orderId = body.order_id; // 即 transaction.id
  const paymentId = body.payment_id?.toString();
  const priceAmount = parseFloat(body.price_amount || '0'); // USD 金额

  if (!orderId || !priceAmount) {
    logger.error('NOWPayments webhook 缺少 order_id 或 price_amount');
    return;
  }

  try {
    // 查找交易记录
    const transaction = await prisma.transaction.findUnique({ where: { id: orderId } });
    if (!transaction) {
      logger.error(`NOWPayments webhook: 交易不存在 orderId=${orderId}`);
      return;
    }

    // 防止重复处理
    if (transaction.status === 'COMPLETED') {
      logger.info(`交易 ${orderId} 已处理，跳过`);
      return;
    }

    const amount = priceAmount;

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: transaction.userId } });
      const balanceBefore = Number(user.balance);
      const balanceAfter = balanceBefore + amount;

      // 更新用户余额
      await tx.user.update({
        where: { id: transaction.userId },
        data: { balance: balanceAfter },
      });

      // 更新交易记录
      await tx.transaction.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          balanceBefore,
          balanceAfter,
          externalId: paymentId,
        },
      });
    });

    logger.info(`加密货币充值成功: userId=${transaction.userId}, +$${amount}, paymentId=${paymentId}`);
  } catch (err) {
    logger.error('NOWPayments webhook 充值处理失败:', err);
  }
}

export default cryptoPaymentRouter;

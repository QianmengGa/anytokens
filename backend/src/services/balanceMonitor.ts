import { config } from '../config/index.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { emailService } from './email.service.js';
import { triggerWebhook } from './webhookService.js';

// 缓存最新查询结果，供 admin API 读取
let lastBalance: number | null = null;
let lastCheckedAt: string | null = null;
let alertSent = false; // 避免重复告警

// 查询 SiliconFlow 余额
export async function fetchSiliconFlowBalance(): Promise<number | null> {
  if (!config.siliconflowApiKey) return null;

  try {
    const res = await fetch('https://api.siliconflow.cn/v1/user/info', {
      headers: { Authorization: `Bearer ${config.siliconflowApiKey}` },
    });
    const data = await res.json() as any;
    const balance = parseFloat(data.data?.totalBalance ?? data.data?.balance ?? '0');
    lastBalance = balance;
    lastCheckedAt = new Date().toISOString();
    return balance;
  } catch (err) {
    logger.error('SiliconFlow 余额查询失败:', err);
    return null;
  }
}

// 获取缓存的余额信息（供 admin API 使用）
export function getCachedBalance(): {
  balance: number | null;
  threshold: number;
  status: 'ok' | 'low' | 'critical' | 'unknown';
  lastCheckedAt: string | null;
} {
  const threshold = config.siliconflowBalanceAlertThreshold;
  let status: 'ok' | 'low' | 'critical' | 'unknown' = 'unknown';
  if (lastBalance !== null) {
    if (lastBalance <= 0) status = 'critical';
    else if (lastBalance < threshold) status = 'low';
    else status = 'ok';
  }
  return { balance: lastBalance, threshold, status, lastCheckedAt };
}

// 执行一次余额检查 + 告警
export async function checkSiliconFlowBalance(): Promise<void> {
  const balance = await fetchSiliconFlowBalance();
  if (balance === null) return;

  const threshold = config.siliconflowBalanceAlertThreshold;

  if (balance >= threshold) {
    // 余额恢复后重置告警标记
    alertSent = false;
    return;
  }

  // 余额低于阈值
  logger.warn(`SiliconFlow 余额不足: $${balance.toFixed(2)}（阈值 $${threshold}）`);

  if (alertSent) return; // 本轮已告警，不重复
  alertSent = true;

  // 1. 发送邮件给管理员
  if (config.adminEmail) {
    emailService.sendLowBalance(config.adminEmail, balance);
    logger.info(`SiliconFlow 余额告警邮件已发送至 ${config.adminEmail}`);
  }

  // 2. 触发 Webhook（给所有管理员用户）
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    });
    for (const admin of admins) {
      triggerWebhook(admin.id, 'provider.balance_low', {
        provider: 'siliconflow',
        balance,
        threshold,
      });
    }
  } catch (err) {
    logger.error('SiliconFlow 余额告警 Webhook 触发失败:', err);
  }
}

// 启动定时余额监控
export function startBalanceMonitor(): void {
  if (!config.siliconflowApiKey) {
    logger.info('SiliconFlow API Key 未配置，跳过余额监控');
    return;
  }

  const interval = config.siliconflowBalanceCheckInterval;
  logger.info(`SiliconFlow 余额监控已启动（间隔 ${interval / 1000}s，阈值 $${config.siliconflowBalanceAlertThreshold}）`);

  // 启动后立即检查一次
  checkSiliconFlowBalance();

  // 定时检查
  setInterval(checkSiliconFlowBalance, interval);
}

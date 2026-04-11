import { Router, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { config } from '../config/index.js';
import { Resend } from 'resend';
import { logger } from '../utils/logger.js';

const router = Router();
const resend = new Resend(config.resendApiKey);
const FROM = config.resendApiKey ? 'Anytokens <noreply@anytokens.net>' : 'Anytokens <onboarding@resend.dev>';

router.post('/inquiry', async (req: Request, res: Response) => {
  try {
    const { company, name, email, message: requirements } = req.body;

    if (!company || !name || !email || !requirements) {
      return res.status(400).json({ code: 40000, message: '请填写完整信息' });
    }

    // 1. 发邮件通知管理员
    if (config.resendApiKey && config.adminEmail) {
      try {
        await resend.emails.send({
          from: FROM,
          to: config.adminEmail,
          subject: `[Anytokens Enterprise] 新询盘 - ${company}`,
          html: `
            <h2>新企业询盘</h2>
            <table style="border-collapse:collapse;width:100%">
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">公司</td><td style="padding:8px;border:1px solid #ddd">${company}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">姓名</td><td style="padding:8px;border:1px solid #ddd">${name}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">邮箱</td><td style="padding:8px;border:1px solid #ddd">${email}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">需求</td><td style="padding:8px;border:1px solid #ddd">${requirements}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">时间</td><td style="padding:8px;border:1px solid #ddd">${new Date().toLocaleString('zh-CN')}</td></tr>
            </table>
            <p style="margin-top:16px;color:#666">请尽快回复客户：<a href="mailto:${email}">${email}</a></p>
          `,
        });
      } catch (err) {
        logger.error('企业询盘邮件发送失败:', err);
      }
    }

    // 2. 存入审计日志
    await prisma.auditLog.create({
      data: {
        action: 'ENTERPRISE_INQUIRY',
        detail: JSON.stringify({ company, name, email, requirements, replied: false }),
        ip: req.ip || 'unknown',
        result: 'success',
      },
    });

    // 3. 发 Telegram 即时通知
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;
    if (telegramToken && telegramChatId) {
      const msg = `🏢 <b>新企业询盘！</b>\n\n公司：${company}\n姓名：${name}\n邮箱：${email}\n需求：${requirements.slice(0, 200)}\n\n📧 请记得回复！`;
      const body = JSON.stringify({ chat_id: telegramChatId, text: msg, parse_mode: 'HTML' });
      const https = await import('https');
      await new Promise<void>((resolve) => {
        const req2 = https.request({
          hostname: 'api.telegram.org',
          path: `/bot${telegramToken}/sendMessage`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        }, (res2) => { res2.on('data', () => {}); res2.on('end', resolve); });
        req2.write(body);
        req2.end();
      });
    }

    res.json({ code: 0, message: '提交成功，我们将在24小时内与您联系' });
  } catch (err) {
    logger.error('[Enterprise inquiry error]', err);
    res.status(500).json({ code: 50000, message: '提交失败，请发邮件至 support@anytokens.net' });
  }
});

export default router;

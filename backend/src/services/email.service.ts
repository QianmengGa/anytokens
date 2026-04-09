import { Resend } from 'resend';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const resend = new Resend(config.resendApiKey);

// 发件人地址（需在 Resend 后台验证域名后使用自定义域名）
const FROM = config.resendApiKey ? 'Anytokens <noreply@anytokens.net>' : 'Anytokens <onboarding@resend.dev>';

// ══════════════════════════════════════════════════════
//  品牌邮件模板（统一 Header / Footer + 品牌色）
// ══════════════════════════════════════════════════════

function wrapTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="zh">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f8fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px;text-align:center">
            <div style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:0.5px">
              <span style="opacity:1">Any</span><span style="opacity:0.8">tokens</span>
            </div>
            <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px">${title}</div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px">${body}</td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #eef0f2;text-align:center">
            <p style="margin:0;font-size:12px;color:#9ca3af">
              &copy; ${new Date().getFullYear()} Anytokens &middot; AI Token 中转平台
            </p>
            <p style="margin:4px 0 0;font-size:12px">
              <a href="https://anytokens.net" style="color:#6366f1;text-decoration:none">anytokens.net</a>
              &nbsp;&middot;&nbsp;
              <a href="https://anytokens.net/docs" style="color:#6366f1;text-decoration:none">API 文档</a>
              &nbsp;&middot;&nbsp;
              <a href="https://status.anytokens.net" style="color:#6366f1;text-decoration:none">服务状态</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// 安全发送邮件（失败不抛异常，只记日志）
async function safeSend(to: string, subject: string, html: string) {
  try {
    if (!config.resendApiKey) {
      logger.warn(`邮件发送跳过（未配置 RESEND_API_KEY）: to=${to}, subject=${subject}`);
      return;
    }
    await resend.emails.send({ from: FROM, to, subject, html });
    logger.info(`邮件已发送: to=${to}, subject=${subject}`);
  } catch (err) {
    logger.error(`邮件发送失败: to=${to}, subject=${subject}`, err);
  }
}

class EmailService {
  // ==================== 验证码邮件（注册 / 密码重置） ====================

  async sendVerificationCode(email: string, code: string) {
    const body = `
      <h2 style="margin:0 0 16px;font-size:20px;color:#1f2937">注册验证码</h2>
      <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 16px">您正在注册 Anytokens 账号，请输入以下验证码完成注册：</p>
      <div style="font-size:36px;font-weight:700;letter-spacing:10px;text-align:center;
                  padding:20px;background:#f3f4f6;border-radius:8px;margin:0 0 16px;color:#6366f1">
        ${code}
      </div>
      <p style="color:#9ca3af;font-size:13px;margin:0">验证码有效期 10 分钟，请勿泄露给他人。</p>
    `;
    await safeSend(email, `${code} — Anytokens 注册验证码`, wrapTemplate('注册验证', body));
  }

  async sendPasswordResetCode(email: string, code: string) {
    const body = `
      <h2 style="margin:0 0 16px;font-size:20px;color:#1f2937">密码重置验证码</h2>
      <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 16px">您正在重置密码，请输入以下验证码：</p>
      <div style="font-size:36px;font-weight:700;letter-spacing:10px;text-align:center;
                  padding:20px;background:#f3f4f6;border-radius:8px;margin:0 0 16px;color:#6366f1">
        ${code}
      </div>
      <p style="color:#9ca3af;font-size:13px;margin:0">验证码有效期 10 分钟。如果您没有请求重置密码，请忽略此邮件。</p>
    `;
    await safeSend(email, `${code} — Anytokens 密码重置`, wrapTemplate('密码重置', body));
  }

  // ==================== 欢迎邮件（注册成功后发送） ====================

  async sendWelcome(email: string, name: string) {
    const body = `
      <h2 style="margin:0 0 16px;font-size:20px;color:#1f2937">Welcome to Anytokens! 🎉</h2>
      <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 16px">
        Hi ${name}，欢迎加入 Anytokens！您的账号已创建成功。
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:0 0 20px">
        <p style="margin:0;font-size:14px;color:#166534;font-weight:600">🎁 赠送 $0.50 免费额度</p>
        <p style="margin:4px 0 0;font-size:13px;color:#15803d">已自动到账，可立即调用免费模型体验</p>
      </div>
      <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 8px"><strong>快速开始：</strong></p>
      <ol style="color:#4b5563;font-size:14px;line-height:1.8;margin:0 0 20px;padding-left:20px">
        <li>前往 <a href="https://anytokens.net/api-keys" style="color:#6366f1">API 密钥页面</a> 获取 Key</li>
        <li>使用 OpenAI 兼容格式调用 30+ AI 模型</li>
        <li>查阅 <a href="https://anytokens.net/docs" style="color:#6366f1">API 文档</a> 了解详情</li>
      </ol>
      <div style="text-align:center;margin:0 0 8px">
        <a href="https://anytokens.net/dashboard" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none">进入控制台</a>
      </div>
    `;
    await safeSend(email, '欢迎加入 Anytokens — 您的 AI API 之旅开始了', wrapTemplate('Welcome', body));
  }

  // ==================== 充值成功收据 ====================

  async sendTopupReceipt(email: string, params: {
    amount: number;
    method: string;        // 'Stripe' / 'Crypto'
    balanceAfter: number;
    transactionId: string;
  }) {
    const { amount, method, balanceAfter, transactionId } = params;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    const body = `
      <h2 style="margin:0 0 16px;font-size:20px;color:#1f2937">充值成功</h2>
      <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 16px">
        您的账户已成功充值，以下是交易详情：
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#9ca3af">充值金额</td>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:16px;font-weight:700;color:#059669;text-align:right">+$${amount.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#9ca3af">支付方式</td>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#1f2937;text-align:right">${method}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#9ca3af">充值后余额</td>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#1f2937;text-align:right">$${balanceAfter.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#9ca3af">交易时间</td>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#1f2937;text-align:right">${now}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;font-size:13px;color:#9ca3af">交易编号</td>
          <td style="padding:10px 0;font-size:12px;color:#6b7280;text-align:right;font-family:monospace">${transactionId.slice(0, 8)}...</td>
        </tr>
      </table>
      <div style="text-align:center">
        <a href="https://anytokens.net/billing" style="display:inline-block;background:#6366f1;color:#fff;padding:10px 28px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none">查看账单</a>
      </div>
    `;
    await safeSend(email, `充值成功 +$${amount.toFixed(2)} — Anytokens`, wrapTemplate('充值收据', body));
  }

  // ==================== 余额不足提醒 ====================

  async sendLowBalance(email: string, balance: number) {
    const body = `
      <h2 style="margin:0 0 16px;font-size:20px;color:#1f2937">余额不足提醒</h2>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:0 0 20px">
        <p style="margin:0;font-size:14px;color:#991b1b;font-weight:600">⚠️ 当前余额：$${balance.toFixed(2)}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#b91c1c">余额低于 $1.00，付费模型可能无法正常使用</p>
      </div>
      <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 20px">
        为避免 API 调用中断，建议尽快充值。免费模型仍可正常使用。
      </p>
      <div style="text-align:center">
        <a href="https://anytokens.net/billing" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none">立即充值</a>
      </div>
    `;
    await safeSend(email, '⚠️ Anytokens 余额不足提醒', wrapTemplate('余额提醒', body));
  }

  // ==================== 团队邀请邮件 ====================

  async sendTeamInvite(email: string, params: {
    teamName: string;
    inviterName: string;
    role: string;
    inviteToken: string;
  }) {
    const { teamName, inviterName, role, inviteToken } = params;
    const acceptUrl = `https://anytokens.net/team?invite=${inviteToken}`;
    const roleLabel = role === 'ADMIN' ? '管理员' : '成员';
    const body = `
      <h2 style="margin:0 0 16px;font-size:20px;color:#1f2937">团队邀请</h2>
      <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 16px">
        <strong>${inviterName}</strong> 邀请您加入团队 <strong>${teamName}</strong>，角色为 <strong>${roleLabel}</strong>。
      </p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:0 0 20px">
        <p style="margin:0;font-size:13px;color:#1e40af">加入团队后，您可以使用团队共享的 API Key 和余额。</p>
      </div>
      <div style="text-align:center;margin:0 0 16px">
        <a href="${acceptUrl}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none">接受邀请</a>
      </div>
      <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center">邀请链接有效期 7 天。如您不认识发送者，请忽略此邮件。</p>
    `;
    await safeSend(email, `${inviterName} 邀请您加入 ${teamName} — Anytokens`, wrapTemplate('团队邀请', body));
  }
}

export const emailService = new EmailService();

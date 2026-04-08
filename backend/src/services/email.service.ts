import { Resend } from 'resend';
import { config } from '../config/index.js';

const resend = new Resend(config.resendApiKey);

class EmailService {
  // 发送验证码邮件
  async sendVerificationCode(email: string, code: string) {
    await resend.emails.send({
      from: 'Anytokens <onboarding@resend.dev>',
      to: email,
      subject: 'Anytokens 注册验证码',
      html: `
        <div style="max-width:480px;margin:0 auto;font-family:sans-serif;padding:24px">
          <h2 style="color:#333">Anytokens 注册验证码</h2>
          <p>您的验证码是：</p>
          <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;
                      padding:16px;background:#f5f5f5;border-radius:8px;margin:16px 0">
            ${code}
          </div>
          <p style="color:#666;font-size:14px">验证码有效期 10 分钟，请勿泄露给他人。</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
          <p style="color:#999;font-size:12px">如果您没有注册 Anytokens，请忽略此邮件。</p>
        </div>
      `,
    });
  }
  // 发送密码重置验证码邮件
  async sendPasswordResetCode(email: string, code: string) {
    await resend.emails.send({
      from: 'Anytokens <onboarding@resend.dev>',
      to: email,
      subject: 'Anytokens 密码重置验证码',
      html: `
        <div style="max-width:480px;margin:0 auto;font-family:sans-serif;padding:24px">
          <h2 style="color:#333">密码重置验证码</h2>
          <p>您正在重置密码，验证码是：</p>
          <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;
                      padding:16px;background:#f5f5f5;border-radius:8px;margin:16px 0">
            ${code}
          </div>
          <p style="color:#666;font-size:14px">验证码有效期 10 分钟，请勿泄露给他人。</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
          <p style="color:#999;font-size:12px">如果您没有请求重置密码，请忽略此邮件。</p>
        </div>
      `,
    });
  }
}

export const emailService = new EmailService();

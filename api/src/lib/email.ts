// src/lib/email.ts
/**
 * 邮件发送工具
 * 支持 SMTP 和第三方邮件服务
 */

import { logger } from './logger.ts';

/**
 * 邮件配置
 */
const EMAIL_CONFIG = {
    from: Deno.env.get('MAIL_FROM_EMAIL') || 'noreply@example.com',
    fromName: Deno.env.get('MAIL_FROM_NAME') || 'My API Project',
};

/**
 * 邮件发送选项
 */
interface SendEmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

/**
 * 发送邮件
 * @param options - 邮件选项
 * @returns Promise<boolean> - 是否发送成功
 * 
 * 注意：这里使用模拟发送，实际项目中应该集成真实的邮件服务
 * 推荐服务：SendGrid, AWS SES, Resend, Mailgun
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
        logger.info('Sending email', {
            to: options.to,
            subject: options.subject,
        });

        // TODO: 集成真实的邮件服务
        // 示例：使用 SendGrid
        /*
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: options.to }] }],
            from: { email: EMAIL_CONFIG.from, name: EMAIL_CONFIG.fromName },
            subject: options.subject,
            content: [
              { type: 'text/plain', value: options.text || '' },
              { type: 'text/html', value: options.html || '' },
            ],
          }),
        });
        
        return response.ok;
        */

        // 开发环境：模拟发送并打印到控制台
        if (Deno.env.get('ENVIRONMENT') === 'development') {
            logger.info('📧 Email content (development mode)', {
                from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.from}>`,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
            });
        }

        return true;
    } catch (error) {
        logger.error('Failed to send email', {
            to: options.to,
            error: error instanceof Error ? error.message : String(error),
        });
        return false;
    }
}

/**
 * 发送验证码邮件
 * @param email - 收件人邮箱
 * @param code - 验证码
 * @param purpose - 验证码用途
 * @returns Promise<boolean> - 是否发送成功
 */
export async function sendVerificationCodeEmail(
    email: string,
    code: string,
    purpose: string
): Promise<boolean> {
    const purposeText = {
        login: '登录',
        register: '注册',
        reset_password: '重置密码',
        change_email: '更换邮箱',
        verify_email: '验证邮箱',
    }[purpose] || '验证';

    const subject = `【${EMAIL_CONFIG.fromName}】您的${purposeText}验证码`;

    const text = `
您好！

您的${purposeText}验证码是：${code}

验证码有效期为 10 分钟，请尽快使用。

如果这不是您本人的操作，请忽略此邮件。

---
${EMAIL_CONFIG.fromName}
  `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .code { font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 4px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <h2>您好！</h2>
    <p>您的${purposeText}验证码是：</p>
    <div class="code">${code}</div>
    <p>验证码有效期为 <strong>10 分钟</strong>，请尽快使用。</p>
    <p>如果这不是您本人的操作，请忽略此邮件。</p>
    <div class="footer">
      <p>${EMAIL_CONFIG.fromName}</p>
    </div>
  </div>
</body>
</html>
  `.trim();

    return await sendEmail({
        to: email,
        subject,
        text,
        html,
    });
}
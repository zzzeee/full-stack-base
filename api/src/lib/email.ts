/**
 * @file email.ts
 * @description 邮件发送入口；当前为占位实现，接入 SMTP/第三方服务时在此扩展。
 */

import { logger } from "[@BASE]/lib/logger.ts";
import type { VerificationPurpose } from "[@BASE]/types/auth.types.ts";

/**
 * 发送验证码邮件（更换邮箱等场景）。
 * @returns 是否发送成功（占位实现默认返回 true，仅打日志）
 */
export async function sendVerificationCodeEmail(
  to: string,
  code: string,
  purpose: VerificationPurpose,
): Promise<boolean> {
  logger.info("sendVerificationCodeEmail (stub)", {
    to,
    purpose,
    codeLength: code.length,
  });
  return true;
}

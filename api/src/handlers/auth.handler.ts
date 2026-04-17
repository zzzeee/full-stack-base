/**
 * @file auth.handler.ts
 * @description 认证请求处理器，处理认证相关的 HTTP 请求和响应
 * @author System
 * @createDate 2026-01-25
 */

import type { Context } from "@hono/hono";
import { logger } from "[@BASE]/lib/logger.ts";
import { apiResponse } from "[@BASE]/lib/api-response.ts";
import type {
  // deno-lint-ignore no-unused-vars
  ErrorResponse,
  // deno-lint-ignore no-unused-vars
  SuccessResponse,
} from "[@BASE]/lib/api-response.ts";
import { ErrorCodes, ErrorInfos } from "[@BASE]/lib/errors/error-codes.ts";
import {
  PasswordLoginInput,
  SendVerificationCodeInput,
  VerificationCodeLoginInput,
} from "[@BASE-schemas]/auth.schema.ts";
import type { LoginResponse } from "[@BASE]/types/auth.types.ts";
import { authService } from "[@BASE-services]/auth.service.ts";

/**
 * 发送邮箱验证码
 *
 * @route POST /api/auth/send-code
 */
export async function sendVerificationCode(c: Context) {
  const body: SendVerificationCodeInput = await c.req.json();
  const result = await authService.sendVerificationCode(body.email);

  if (!result.ok) {
    logger.error("Failed to send verification code", {
      email: body.email,
      error: result.error.message,
      errorCode: result.error.status,
    });
    const errorInfo = ErrorInfos[ErrorCodes.EMAIL_SEND_FAILED];
    return c.json(
      apiResponse.error(errorInfo.message, errorInfo.code, result.error),
      errorInfo.status,
    );
  }

  logger.info("Verification code sent successfully", {
    email: body.email,
  });
  return c.json(
    apiResponse.success(null, "验证码已发送，请查收邮件"),
    200,
  );
}

/**
 * 验证码登录
 *
 * @route POST /api/auth/login/code
 */
export async function loginWithVerificationCode(c: Context) {
  const body: VerificationCodeLoginInput = await c.req.json();
  const result = await authService.loginWithVerificationCode(body.email, body.code);

  if (!result.ok) {
    if (result.kind === "otp") {
      logger.error("Verification code verification failed", {
        email: body.email,
        error: result.error.message,
        errorCode: result.error.status,
      });
      const errorInfo = ErrorInfos[ErrorCodes.VERIFICATION_CODE_INVALID];
      return c.json(
        apiResponse.error(errorInfo.message, errorInfo.code, result.error),
        errorInfo.status,
      );
    }
    if (result.kind === "no_auth_user") {
      logger.error("Supabase verifyOtp returned no user", { email: body.email });
      const errorInfo = ErrorInfos[ErrorCodes.INTERNAL_ERROR];
      return c.json(
        apiResponse.error("登录失败，请稍后重试", errorInfo.code),
        errorInfo.status,
      );
    }
    logger.error("Failed to sync user after verifyOtp", {
      email: body.email,
      error: result.error instanceof Error ? result.error.message : String(result.error),
    });
    const errorInfo = ErrorInfos[ErrorCodes.INTERNAL_ERROR];
    return c.json(
      apiResponse.error("用户注册失败，请稍后重试", errorInfo.code),
      errorInfo.status,
    );
  }

  return c.json(
    apiResponse.success<LoginResponse>(result.login, "登录成功"),
    200,
  );
}

/**
 * 密码登录
 *
 * @route POST /api/auth/login/password
 */
export async function loginWithPassword(c: Context) {
  const body: PasswordLoginInput = await c.req.json();
  const result = await authService.loginWithPassword(body.email, body.password);

  if (!result.ok) {
    if (result.kind === "auth") {
      logger.error("Password login failed", {
        email: body.email,
        error: result.error.message,
        errorCode: result.error.status,
      });
      const errorInfo = ErrorInfos[ErrorCodes.AUTH_INVALID_CREDENTIALS];
      return c.json(
        apiResponse.error(errorInfo.message, errorInfo.code, result.error),
        errorInfo.status,
      );
    }
    if (result.kind === "user_not_found") {
      const errorInfo = ErrorInfos[ErrorCodes.USER_NOT_FOUND];
      return c.json(
        apiResponse.error(errorInfo.message, errorInfo.code),
        errorInfo.status,
      );
    }
    const errorInfo = ErrorInfos[ErrorCodes.INTERNAL_ERROR];
    return c.json(
      apiResponse.error("登录失败，请稍后重试", errorInfo.code),
      errorInfo.status,
    );
  }

  return c.json(
    apiResponse.success<LoginResponse>(result.login, "登录成功"),
    200,
  );
}

/**
 * 退出登录
 *
 * @route POST /api/auth/logout
 */
export function logout(c: Context) {
  const userId = c.get("userId");

  logger.info("User logged out", { userId });

  return c.json(apiResponse.success(null, "退出登录成功"), 200);
}

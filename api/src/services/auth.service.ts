/**
 * @file auth.service.ts
 * @description 认证业务逻辑层：用户同步、登录响应组装等
 * @author System
 * @createDate 2026-01-26
 */

import type { AuthError } from "@supabase/supabase-js";
import { logger } from "[@BASE]/lib/logger.ts";
import { generateToken } from "[@BASE]/lib/jwt.ts";
import { supabaseAuthRepository } from "[@BASE-repositories]/supabase-auth.repository.ts";
import { UserRepository, userRepository } from "[@BASE-repositories]/user.repository.ts";
import type { LoginResponse } from "[@BASE]/types/auth.types.ts";
import type { User } from "[@BASE]/types/user.types.ts";

/**
 * 确保 public.users 中存在对应用户（不存在则自动创建）
 */
export interface EnsureUserParams {
  /** Supabase Auth 的用户 ID（auth.users.id） */
  id: string;
  /** 邮箱（经过请求校验后的邮箱） */
  email: string;
  /** 是否已验证邮箱（验证码登录通常视为已验证） */
  emailVerified: boolean;
}

/** 发送验证码结果 */
export type SendVerificationCodeResult =
  | { ok: true }
  | { ok: false; error: AuthError };

/** 验证码登录结果 */
export type VerificationCodeLoginResult =
  | { ok: true; login: LoginResponse }
  | { ok: false; kind: "otp"; error: AuthError }
  | { ok: false; kind: "no_auth_user" }
  | { ok: false; kind: "sync"; error: unknown };

/** 密码登录结果 */
export type PasswordLoginResult =
  | { ok: true; login: LoginResponse }
  | { ok: false; kind: "auth"; error: AuthError }
  | { ok: false; kind: "user_not_found" }
  | { ok: false; kind: "internal" };

export class AuthService {
  private readonly adminUserRepository = new UserRepository(true);

  /**
   * 发送邮箱 OTP（经 Supabase Auth）
   */
  async sendVerificationCode(email: string): Promise<SendVerificationCodeResult> {
    const { error } = await supabaseAuthRepository.signInWithOtp(email);
    if (error) return { ok: false, error };
    return { ok: true };
  }

  /**
   * 邮箱 OTP 验证成功后同步 public.users 并返回业务 JWT 登录载荷
   */
  async loginWithVerificationCode(
    email: string,
    code: string,
  ): Promise<VerificationCodeLoginResult> {
    const { data, error } = await supabaseAuthRepository.verifyEmailOtp(email, code);
    if (error) return { ok: false, kind: "otp", error };
    if (!data.user) return { ok: false, kind: "no_auth_user" };

    const supabaseUserId = data.user.id;
    try {
      const user = await this.ensurePublicUserExists({
        id: supabaseUserId,
        email,
        emailVerified: true,
      });
      const login = await this.buildLoginResponse(user);
      return { ok: true, login };
    } catch (syncErr: unknown) {
      return { ok: false, kind: "sync", error: syncErr };
    }
  }

  /**
   * 密码登录：Supabase Auth 校验密码后，用 public.users 组装业务 JWT
   */
  async loginWithPassword(
    email: string,
    password: string,
  ): Promise<PasswordLoginResult> {
    const { data, error } = await supabaseAuthRepository.signInWithPassword(
      email,
      password,
    );
    if (error) return { ok: false, kind: "auth", error };

    // Supabase 成功时通常必有 user；若缺失则视为服务端异常
    const authUserId = data.user?.id;
    if (!authUserId) {
      logger.error("signInWithPassword succeeded but data.user.id is missing", {
        email,
      });
      return { ok: false, kind: "internal" };
    }

    const user = await userRepository.findById(authUserId);
    if (!user) return { ok: false, kind: "user_not_found" };

    const login = await this.buildLoginResponse(user);
    return { ok: true, login };
  }

  /**
   * 确保 public.users 里存在用户，不存在则创建（使用管理员客户端绕过 RLS）
   */
  async ensurePublicUserExists(params: EnsureUserParams): Promise<User> {
    const { id, email, emailVerified } = params;

    // 登录阶段建议统一使用 admin 客户端，避免未来 RLS/策略变更导致匿名查询失败
    let user = await this.adminUserRepository.findById(id);
    if (user) return user;

    const emailName = email.split("@")[0] || "用户";

    logger.info("Auto-registering new user to public.users", {
      supabaseUserId: id,
      email,
      name: emailName,
    });

    try {
      user = await this.adminUserRepository.create({
        id,
        email,
        name: emailName,
        email_verified: emailVerified,
        status: "active",
      });

      logger.info("New user auto-registered successfully", {
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      return user;
    } catch (createErr: unknown) {
      // 可能是并发创建（或唯一约束）导致；尝试回读
      const message = createErr instanceof Error
        ? createErr.message
        : (createErr && typeof createErr === "object" && "message" in createErr)
        ? String((createErr as { message?: unknown }).message)
        : String(createErr);

      logger.error("Failed to auto-register user (will retry read)", {
        supabaseUserId: id,
        email,
        error: message,
      });

      user = await this.adminUserRepository.findById(id);
      if (user) return user;

      user = await this.adminUserRepository.findByEmail(email);
      if (user && user.id !== id) {
        throw new Error("用户数据不一致（Supabase Auth 与 public.users ID 不匹配）");
      }
      if (!user) {
        throw new Error("用户注册失败，请稍后重试");
      }
      return user;
    }
  }

  /**
   * 组装登录响应（生成业务 JWT）
   */
  async buildLoginResponse(user: User): Promise<LoginResponse> {
    const jwtToken = await generateToken({
      sub: user.id,
      email: user.email,
      role: undefined,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token: jwtToken,
    };
  }
}

export const authService = new AuthService();

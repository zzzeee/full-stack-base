/**
 * @file auth.service.ts
 * @description 认证业务逻辑层：用户同步、登录响应组装等
 */

import type { AuthError } from "@supabase/supabase-js";
import { logger } from "[@BASE]/lib/logger.ts";
import { generateToken } from "[@BASE]/lib/jwt.ts";
import { supabaseAuthRepository } from "[@BASE-repositories]/supabase-auth.repository.ts";
import { UserRepository, userRepository } from "[@BASE-repositories]/user.repository.ts";
import type { LoginResponse } from "[@BASE]/types/auth.types.ts";
import type { Profile } from "[@BASE]/types/user.types.ts";

/**
 * 确保 public.profiles 中存在对应行（不存在则自动创建）
 */
export interface EnsureUserParams {
  /** Supabase Auth 的用户 ID（auth.users.id） */
  id: string;
  /** 邮箱（经过请求校验后的邮箱） */
  email: string;
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
   * 邮箱 OTP 验证成功后同步 public.profiles 并返回业务 JWT 登录载荷
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
      const profile = await this.ensureProfileExists({
        id: supabaseUserId,
        email,
      });
      const { data: authData } = await supabaseAuthRepository.getUserById(supabaseUserId);
      const resolvedEmail = authData.user?.email ?? email;
      const login = await this.buildLoginResponse(profile, resolvedEmail);
      return { ok: true, login };
    } catch (syncErr: unknown) {
      return { ok: false, kind: "sync", error: syncErr };
    }
  }

  /**
   * 密码登录：Supabase Auth 校验密码后，用 public.profiles 组装业务 JWT
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

    const authUserId = data.user?.id;
    if (!authUserId) {
      logger.error("signInWithPassword succeeded but data.user.id is missing", {
        email,
      });
      return { ok: false, kind: "internal" };
    }

    const profile = await userRepository.findById(authUserId);
    if (!profile) return { ok: false, kind: "user_not_found" };

    const { data: authData } = await supabaseAuthRepository.getUserById(authUserId);
    const resolvedEmail = authData.user?.email ?? email;
    const login = await this.buildLoginResponse(profile, resolvedEmail);
    return { ok: true, login };
  }

  /**
   * 确保 public.profiles 里存在行；Auth 新用户一般由触发器插入，此处作兜底 upsert
   */
  async ensureProfileExists(params: EnsureUserParams): Promise<Profile> {
    const { id, email } = params;

    let profile = await this.adminUserRepository.findById(id);
    if (profile) return profile;

    const emailName = email.split("@")[0] || "用户";

    logger.info("Auto-creating profile row", {
      supabaseUserId: id,
      email,
      name: emailName,
    });

    try {
      profile = await this.adminUserRepository.create({
        id,
        name: emailName,
        status: "active",
      });

      logger.info("Profile created successfully", {
        userId: profile.id,
        name: profile.name,
      });

      return profile;
    } catch (createErr: unknown) {
      const message = createErr instanceof Error
        ? createErr.message
        : (createErr && typeof createErr === "object" && "message" in createErr)
        ? String((createErr as { message?: unknown }).message)
        : String(createErr);

      logger.error("Failed to auto-create profile (will retry read)", {
        supabaseUserId: id,
        email,
        error: message,
      });

      profile = await this.adminUserRepository.findById(id);
      if (profile) return profile;

      throw new Error("用户注册失败，请稍后重试");
    }
  }

  /**
   * 组装登录响应（生成业务 JWT）
   */
  async buildLoginResponse(profile: Profile, email: string): Promise<LoginResponse> {
    const jwtToken = await generateToken({
      sub: profile.id,
      email,
      role: undefined,
    });

    return {
      user: {
        id: profile.id,
        email,
        name: profile.name,
      },
      token: jwtToken,
    };
  }
}

export const authService = new AuthService();

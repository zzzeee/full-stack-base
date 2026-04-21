/**
 * @file user.service.ts
 * @description 用户业务逻辑层（profiles + Supabase Auth）
 */

import { userRepository } from "[@BASE-repositories]/user.repository.ts";
import { supabaseAuthRepository } from "[@BASE-repositories]/supabase-auth.repository.ts";
import { logger } from "[@BASE]/lib/logger.ts";
import { AppError } from "[@BASE]/lib/errors/app-error.ts";
import { ErrorCodes, ErrorInfos } from "[@BASE]/lib/errors/error-codes.ts";
import type {
  ChangePasswordData,
  Profile,
  UserProfile,
  UserUpdateData,
} from "[@BASE]/types/user.types.ts";

function toUserProfile(
  row: Profile,
  authUser: NonNullable<
    Awaited<ReturnType<typeof supabaseAuthRepository.getUserById>>["data"]["user"]
  >,
): UserProfile {
  return {
    id: row.id,
    email: authUser.email ?? "",
    name: row.name,
    avatar_url: row.avatar_url,
    bio: row.bio,
    phone: authUser.phone ?? null,
    phone_verified: authUser.phone_confirmed_at != null,
    status: row.status,
    email_verified: authUser.email_confirmed_at != null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_login_at: authUser.last_sign_in_at ?? null,
  };
}

export class UserService {
  async getUserProfile(userId: string): Promise<UserProfile> {
    logger.debug("Getting user profile", { userId });

    const [{ data: authData, error: authErr }, profile] = await Promise.all([
      supabaseAuthRepository.getUserById(userId),
      userRepository.findById(userId),
    ]);

    if (authErr || !authData.user) {
      const error = ErrorInfos[ErrorCodes.USER_NOT_FOUND];
      throw new AppError(error.code, error.message);
    }
    if (!profile) {
      const error = ErrorInfos[ErrorCodes.USER_NOT_FOUND];
      throw new AppError(error.code, error.message);
    }

    return toUserProfile(profile, authData.user);
  }

  async updateUserProfile(
    userId: string,
    data: UserUpdateData,
  ): Promise<UserProfile> {
    logger.info("Updating user profile", {
      userId,
      fields: Object.keys(data),
    });

    const existing = await userRepository.findById(userId);
    if (!existing) {
      const error = ErrorInfos[ErrorCodes.USER_NOT_FOUND];
      throw new AppError(error.code, error.message);
    }

    const profileUpdates: Record<string, unknown> = {};
    if (data.name !== undefined) profileUpdates.name = data.name;
    if (data.bio !== undefined) profileUpdates.bio = data.bio;

    const hasProfileUpdates = Object.keys(profileUpdates).length > 0;
    const hasPhoneUpdate = data.phone !== undefined;

    if (!hasProfileUpdates && !hasPhoneUpdate) {
      const error = ErrorInfos[ErrorCodes.VALIDATION_ERROR];
      throw new AppError(error.code, error.message);
    }

    if (hasProfileUpdates) {
      await userRepository.updateById(userId, profileUpdates);
    }

    if (hasPhoneUpdate) {
      const { error: phoneErr } = await supabaseAuthRepository.updateUserById(userId, {
        phone: data.phone === "" ? null : data.phone,
      });
      if (phoneErr) {
        logger.warn("Auth phone update failed", {
          userId,
          message: phoneErr.message,
        });
        const error = ErrorInfos[ErrorCodes.VALIDATION_ERROR];
        throw new AppError(
          error.code,
          phoneErr.message || "手机号更新失败",
        );
      }
    }

    logger.info("User profile updated successfully", { userId });

    return this.getUserProfile(userId);
  }

  async updateUserAvatar(userId: string, avatarUrl: string): Promise<string> {
    logger.info("Updating user avatar", { userId });

    const existing = await userRepository.findById(userId);
    if (!existing) {
      const error = ErrorInfos[ErrorCodes.USER_NOT_FOUND];
      throw new AppError(error.code, error.message);
    }

    const updated = await userRepository.updateById(userId, {
      avatar_url: avatarUrl,
    });

    logger.info("User avatar updated successfully", { userId });

    return updated.avatar_url || "";
  }

  async changeUserPassword(
    userId: string,
    data: ChangePasswordData,
  ): Promise<void> {
    logger.info("Changing user password", { userId });

    const { data: authData, error: authErr } = await supabaseAuthRepository.getUserById(
      userId,
    );
    if (authErr || !authData.user?.email) {
      const error = ErrorInfos[ErrorCodes.USER_NOT_FOUND];
      throw new AppError(error.code, error.message);
    }

    const email = authData.user.email;

    const { error: signErr } = await supabaseAuthRepository.signInWithPassword(
      email,
      data.old_password,
    );
    if (signErr) {
      const errInfo = ErrorInfos[ErrorCodes.AUTH_INVALID_OLD_PASSWORD];
      throw new AppError(errInfo.code, errInfo.message);
    }

    if (data.old_password === data.new_password) {
      const error = ErrorInfos[ErrorCodes.VALIDATION_ERROR];
      throw new AppError(error.code, error.message);
    }

    const { error: updErr } = await supabaseAuthRepository.updateUserById(userId, {
      password: data.new_password,
    });
    if (updErr) {
      logger.error("Failed to update password via Auth admin", {
        userId,
        message: updErr.message,
      });
      const error = ErrorInfos[ErrorCodes.INTERNAL_ERROR];
      throw new AppError(error.code, error.message);
    }

    logger.info("User password changed successfully", { userId });
  }

  async getUserPublicProfile(userId: string): Promise<Partial<UserProfile>> {
    logger.debug("Getting user public profile", { userId });

    const profile = await userRepository.findById(userId);

    if (!profile) {
      const error = ErrorInfos[ErrorCodes.USER_NOT_FOUND];
      throw new AppError(error.code, error.message);
    }

    return {
      id: profile.id,
      name: profile.name,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      created_at: profile.created_at,
    };
  }

  /**
   * 更换邮箱：由 Supabase Auth 发送确认邮件等（不再使用自建验证码表）
   */
  async changeEmail(userId: string, newEmail: string): Promise<UserProfile> {
    logger.info("Requesting email change via Auth", { userId, newEmail });

    const { data: authData, error: authErr } = await supabaseAuthRepository.getUserById(
      userId,
    );
    if (authErr || !authData.user?.email) {
      const error = ErrorInfos[ErrorCodes.USER_NOT_FOUND];
      throw new AppError(error.code, error.message);
    }

    if (authData.user.email === newEmail) {
      const error = ErrorInfos[ErrorCodes.VALIDATION_ERROR];
      throw new AppError(error.code, "新邮箱不能与当前邮箱相同");
    }

    const { error: updErr } = await supabaseAuthRepository.updateUserById(userId, {
      email: newEmail,
    });
    if (updErr) {
      logger.warn("Auth email update failed", {
        userId,
        message: updErr.message,
      });
      const error = ErrorInfos[ErrorCodes.VALIDATION_ERROR];
      throw new AppError(
        error.code,
        updErr.message || "更换邮箱失败，请确认新邮箱未被占用",
      );
    }

    logger.info("Auth email update requested", { userId, newEmail });

    return this.getUserProfile(userId);
  }
}

export const userService = new UserService();

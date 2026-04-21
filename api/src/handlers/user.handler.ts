/**
 * @file user.handler.ts
 * @description 用户请求处理器，通过 Service 层处理业务逻辑
 */

import type { Context } from "@hono/hono";
import { userService } from "[@BASE-services]/user.service.ts";
import { logger } from "[@BASE]/lib/logger.ts";
import { apiResponse } from "[@BASE]/lib/api-response.ts";
import type {
  ChangeEmailInput,
  ChangePasswordInput,
  UpdateAvatarInput,
  UpdateProfileInput,
} from "[@BASE-schemas]/user.schema.ts";

/**
 * @route GET /api/users/me
 */
export async function getCurrentUser(c: Context) {
  const userId = c.get("userId");

  const profile = await userService.getUserProfile(userId);

  return c.json(apiResponse.success(profile), 200);
}

/**
 * @route PUT /api/users/me
 */
export async function updateProfile(c: Context) {
  const userId = c.get("userId");
  const body: UpdateProfileInput = await c.req.json();

  const profile = await userService.updateUserProfile(userId, body);

  logger.info("User profile updated via handler", { userId });

  return c.json(apiResponse.success(profile, "资料更新成功"), 200);
}

/**
 * @route PUT /api/users/me/avatar
 */
export async function updateAvatar(c: Context) {
  const userId = c.get("userId");
  const body: UpdateAvatarInput = await c.req.json();

  const avatarUrl = await userService.updateUserAvatar(userId, body.avatar_url);

  logger.info("User avatar updated via handler", { userId });

  return c.json(
    apiResponse.success({ avatar_url: avatarUrl }, "头像更新成功"),
    200,
  );
}

/**
 * @route PUT /api/users/me/password
 */
export async function changePassword(c: Context) {
  const userId = c.get("userId");
  const body: ChangePasswordInput = await c.req.json();

  await userService.changeUserPassword(userId, body);

  logger.info("User password changed via handler", { userId });

  return c.json(apiResponse.success(null, "密码修改成功"), 200);
}

/**
 * @route GET /api/users/:id
 */
export async function getUserById(c: Context) {
  const userId = c.req.param("id");

  const publicProfile = await userService.getUserPublicProfile(userId);

  return c.json(apiResponse.success(publicProfile), 200);
}

/**
 * @route PUT /api/users/me/email
 * @description 由 Supabase Auth 处理换绑流程（确认邮件等），不再使用自建验证码表
 */
export async function changeEmail(c: Context) {
  const userId = c.get("userId");
  const body: ChangeEmailInput = await c.req.json();

  const profile = await userService.changeEmail(userId, body.new_email);

  logger.info("User email change requested via handler", { userId });

  return c.json(
    apiResponse.success(
      {
        email: profile.email,
        email_verified: profile.email_verified,
      },
      "已提交新邮箱，请按 Supabase Auth 邮件完成确认",
    ),
    200,
  );
}

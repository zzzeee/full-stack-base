/**
 * @file user.routes.ts
 * @description 用户路由模块，定义用户相关的路由和中间件
 * @author System
 * @createDate 2026-01-25
 */

import { Hono } from "@hono/hono";
import { zValidator } from "@hono/zod-validator";
import * as userHandler from "[@BASE-handlers]/user.handler.ts";
import {
  changeEmailSchema,
  changePasswordSchema,
  sendEmailVerificationCodeSchema,
  updateAvatarSchema,
  updateProfileSchema,
} from "[@BASE-schemas]/user.schema.ts";
import { authMiddleware } from "[@BASE-middlewares]/auth.middleware.ts";
import { zodValidationHook } from "[@BASE-middlewares]/zod-validation.hook.ts";

/**
 * 用户路由实例
 *
 * @constant
 */
const users = new Hono();

/**
 * 所有用户路由都需要认证
 */
users.use("*", authMiddleware);

/**
 * 当前用户相关
 */

// 获取当前用户资料
// GET /api/users/me
users.get("/me", userHandler.getCurrentUser);

// 更新当前用户资料
// PUT /api/users/me
users.put(
  "/me",
  zValidator("json", updateProfileSchema, zodValidationHook),
  userHandler.updateProfile,
);

// 更新头像
// PUT /api/users/me/avatar
users.put(
  "/me/avatar",
  zValidator("json", updateAvatarSchema, zodValidationHook),
  userHandler.updateAvatar,
);

// 修改密码
// PUT /api/users/me/password
users.put(
  "/me/password",
  zValidator("json", changePasswordSchema, zodValidationHook),
  userHandler.changePassword,
);

// 发送邮箱验证码（用于更换邮箱）
// POST /api/users/me/email/send-code
users.post(
  "/me/email/send-code",
  zValidator("json", sendEmailVerificationCodeSchema, zodValidationHook),
  userHandler.sendEmailVerificationCode,
);

// 确认更换邮箱
// PUT /api/users/me/email
users.put(
  "/me/email",
  zValidator("json", changeEmailSchema, zodValidationHook),
  userHandler.changeEmail,
);

/**
 * 公开用户信息
 */

// 获取用户公开资料
// GET /api/users/:id
users.get("/:id", userHandler.getUserById);

export default users;

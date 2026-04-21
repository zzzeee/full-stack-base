/**
 * @file user.routes.ts
 * @description 用户路由模块，定义用户相关的路由和中间件
 */

import { Hono } from "@hono/hono";
import { zValidator } from "@hono/zod-validator";
import * as userHandler from "[@BASE-handlers]/user.handler.ts";
import {
  changeEmailSchema,
  changePasswordSchema,
  updateAvatarSchema,
  updateProfileSchema,
} from "[@BASE-schemas]/user.schema.ts";
import { authMiddleware } from "[@BASE-middlewares]/auth.middleware.ts";
import { zodValidationHook } from "[@BASE-middlewares]/zod-validation.hook.ts";

const users = new Hono();

users.use("*", authMiddleware);

// GET /api/users/me
users.get("/me", userHandler.getCurrentUser);

// PUT /api/users/me
users.put(
  "/me",
  zValidator("json", updateProfileSchema, zodValidationHook),
  userHandler.updateProfile,
);

// PUT /api/users/me/avatar
users.put(
  "/me/avatar",
  zValidator("json", updateAvatarSchema, zodValidationHook),
  userHandler.updateAvatar,
);

// PUT /api/users/me/password
users.put(
  "/me/password",
  zValidator("json", changePasswordSchema, zodValidationHook),
  userHandler.changePassword,
);

// PUT /api/users/me/email（Supabase Auth 换绑）
users.put(
  "/me/email",
  zValidator("json", changeEmailSchema, zodValidationHook),
  userHandler.changeEmail,
);

// GET /api/users/:id
users.get("/:id", userHandler.getUserById);

export default users;

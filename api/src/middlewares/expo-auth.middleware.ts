/**
 * @file expo-auth.middleware.ts
 * @description 展会后台 JWT 校验：typ=expo、session_version 对齐
 */

import type { Context, Next } from "@hono/hono";
import { verifyToken, extractTokenFromHeader } from "[@BASE]/lib/jwt.ts";
import { logger } from "[@BASE]/lib/logger.ts";
import { createAuthError } from "[@BASE]/lib/errors/app-error.ts";
import { adminRepository } from "[@BASE-repositories]/base.repository.ts";
import type { Tables } from "[@BASE]/types/database.types.ts";

export type ExpoStaffRow = Tables<"staff_users">;

export async function expoAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  const token = extractTokenFromHeader(authHeader || "");

  if (!token) {
    throw createAuthError.unauthorized("缺少认证令牌");
  }

  let payload;
  try {
    payload = await verifyToken(token);
  } catch {
    throw createAuthError.tokenInvalid();
  }

  if (payload.typ !== "expo") {
    throw createAuthError.unauthorized("请使用展会账号登录");
  }

  const staff = await adminRepository.findOne<ExpoStaffRow>("staff_users", {
    id: payload.sub,
  });

  if (!staff) {
    throw createAuthError.unauthorized("用户不存在");
  }

  if (staff.disabled) {
    throw createAuthError.unauthorized("账号已被禁用");
  }

  if (staff.registration_status !== "approved") {
    throw createAuthError.unauthorized("账号未通过审核");
  }

  if (typeof payload.sv !== "number" || payload.sv !== staff.session_version) {
    logger.warn("Expo session version mismatch (kicked or password changed)", {
      staffId: staff.id,
      tokenSv: payload.sv,
      dbSv: staff.session_version,
    });
    throw createAuthError.tokenInvalid();
  }

  c.set("expoStaff", staff);
  c.set("userId", staff.id);
  c.set("userEmail", staff.username + "@expo.local");

  await next();
}

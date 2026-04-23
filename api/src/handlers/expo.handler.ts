/**
 * @file expo.handler.ts
 * @description 展会后台 HTTP 处理器
 */

import type { Context } from "@hono/hono";
import { apiResponse } from "[@BASE]/lib/api-response.ts";
import type { Tables } from "[@BASE]/types/database.types.ts";
import * as expoService from "[@BASE]/expo/expo.service.ts";
import {
  expoApproveRegistrationSchema,
  expoChangePasswordSchema,
  expoCreateEventSchema,
  expoCreateUserSchema,
  expoKickBodySchema,
  expoLoginSchema,
  expoPatchEventSchema,
  expoPatchStaffUserSchema,
  expoPutRolePermissionsSchema,
  expoRegisterSchema,
  expoResetPasswordSchema,
  expoSetCurrentEventSchema,
} from "[@BASE-schemas]/expo.schema.ts";

type StaffUser = Tables<"staff_users">;

function staff(c: Context): StaffUser {
  return c.get("expoStaff") as StaffUser;
}

export async function expoRegisterHandler(c: Context) {
  const body = expoRegisterSchema.parse(await c.req.json());
  const data = await expoService.expoRegister(body);
  return c.json(apiResponse.success(data, "注册成功，请等待管理员审核"));
}

export async function expoLoginHandler(c: Context) {
  const body = expoLoginSchema.parse(await c.req.json());
  const { token, user } = await expoService.expoLogin(body.username, body.password);
  return c.json(apiResponse.success({ token, user }, "登录成功"));
}

export async function expoMeHandler(c: Context) {
  const me = await expoService.expoGetMe(staff(c));
  return c.json(apiResponse.success(me));
}

export async function expoChangePasswordHandler(c: Context) {
  const body = expoChangePasswordSchema.parse(await c.req.json());
  const out = await expoService.expoChangeOwnPassword(
    staff(c),
    body.old_password,
    body.new_password,
  );
  return c.json(apiResponse.success(out, "密码已更新"));
}

export async function expoSetCurrentEventHandler(c: Context) {
  const body = expoSetCurrentEventSchema.parse(await c.req.json());
  const out = await expoService.expoSetCurrentEvent(staff(c), body.event_id);
  return c.json(apiResponse.success(out, "已切换当前展会"));
}

export async function expoListEventsHandler(c: Context) {
  const list = await expoService.expoListEvents(staff(c));
  return c.json(apiResponse.success(list));
}

export async function expoCreateEventHandler(c: Context) {
  const body = expoCreateEventSchema.parse(await c.req.json());
  const row = await expoService.expoCreateEvent(staff(c), body);
  return c.json(apiResponse.success(row, "展会已创建"));
}

export async function expoPatchEventHandler(c: Context) {
  const eventId = c.req.param("eventId");
  const body = expoPatchEventSchema.parse(await c.req.json());
  const row = await expoService.expoPatchEvent(staff(c), eventId, body);
  return c.json(apiResponse.success(row, "展会已更新"));
}

export async function expoListUsersHandler(c: Context) {
  const eventId = c.req.query("event_id");
  if (!eventId) {
    return c.json(apiResponse.error("缺少 event_id 参数", "VALIDATION_ERROR"), 400);
  }
  const list = await expoService.expoListUsers(staff(c), eventId);
  return c.json(apiResponse.success(list));
}

export async function expoCreateUserHandler(c: Context) {
  const body = expoCreateUserSchema.parse(await c.req.json());
  const out = await expoService.expoCreateUser(staff(c), body);
  return c.json(apiResponse.success(out, "用户已创建"));
}

export async function expoPatchUserHandler(c: Context) {
  const userId = c.req.param("userId");
  const body = expoPatchStaffUserSchema.parse(await c.req.json());
  const { event_id, ...patch } = body;
  const row = await expoService.expoPatchUser(staff(c), userId, event_id, patch);
  return c.json(apiResponse.success(row, "已更新"));
}

export async function expoResetPasswordHandler(c: Context) {
  const userId = c.req.param("userId");
  const body = expoResetPasswordSchema.parse(await c.req.json());
  await expoService.expoResetPassword(
    staff(c),
    userId,
    body.event_id,
    body.new_password,
  );
  return c.json(apiResponse.success({ ok: true }, "密码已重置"));
}

export async function expoKickUserHandler(c: Context) {
  const userId = c.req.param("userId");
  const body = expoKickBodySchema.parse(await c.req.json());
  await expoService.expoKickUser(staff(c), userId, body.event_id);
  return c.json(apiResponse.success({ ok: true }, "已踢下线"));
}

export async function expoListPendingRegistrationsHandler(c: Context) {
  const list = await expoService.expoListPendingRegistrations(staff(c));
  return c.json(apiResponse.success(list));
}

export async function expoApproveRegistrationHandler(c: Context) {
  const userId = c.req.param("userId");
  const body = expoApproveRegistrationSchema.parse(await c.req.json());
  await expoService.expoApproveRegistration(staff(c), userId, body);
  return c.json(apiResponse.success({ ok: true }, "已通过审核"));
}

export async function expoRejectRegistrationHandler(c: Context) {
  const userId = c.req.param("userId");
  await expoService.expoRejectRegistration(staff(c), userId);
  return c.json(apiResponse.success({ ok: true }, "已拒绝"));
}

export async function expoListRolesHandler(c: Context) {
  const list = await expoService.expoListRolesWithPermissions();
  return c.json(apiResponse.success(list));
}

export async function expoListPermissionsHandler(c: Context) {
  const list = await expoService.expoListPermissionsCatalog();
  return c.json(apiResponse.success(list));
}

export async function expoPutRolePermissionsHandler(c: Context) {
  const roleId = c.req.param("roleId");
  const body = expoPutRolePermissionsSchema.parse(await c.req.json());
  const out = await expoService.expoPutRolePermissions(staff(c), roleId, body);
  return c.json(apiResponse.success(out, "角色权限已更新"));
}

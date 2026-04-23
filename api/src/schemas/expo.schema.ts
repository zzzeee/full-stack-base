/**
 * @file expo.schema.ts
 * @description 展会后台（expo）请求体验证
 */

import { z } from "zod";

const usernameSchema = z
  .string()
  .min(2, "用户名至少 2 个字符")
  .max(64, "用户名过长")
  .regex(/^[a-zA-Z0-9_-]+$/, "用户名仅允许字母、数字、下划线与短横线");

const passwordSchema = z.string().min(6, "密码至少 6 位");

export const expoRegisterSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  display_name: z.string().max(120).optional(),
  phone: z.string().max(32).optional(),
  remark: z.string().max(500).optional(),
});

export const expoLoginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, "请输入密码"),
});

export const expoChangePasswordSchema = z.object({
  old_password: z.string().min(1, "请输入旧密码"),
  new_password: passwordSchema,
});

export const expoSetCurrentEventSchema = z.object({
  event_id: z.string().uuid("请选择有效展会"),
});

export const expoCreateEventSchema = z.object({
  name: z.string().min(1, "展会名称不能为空").max(200),
  logo_url: z.string().max(2000).optional().nullable(),
  starts_at: z.string().max(80).optional().nullable(),
  ends_at: z.string().max(80).optional().nullable(),
  status: z.enum(["draft", "active", "archived"]).optional(),
});

export const expoPatchEventSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  logo_url: z.string().max(2000).nullable().optional(),
  starts_at: z.string().max(80).nullable().optional(),
  ends_at: z.string().max(80).nullable().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
});

export const expoCreateUserSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  display_name: z.string().max(120).optional(),
  phone: z.string().max(32).optional(),
  remark: z.string().max(500).optional(),
  event_id: z.string().uuid(),
  role_id: z.string().uuid(),
});

export const expoPatchStaffUserSchema = z.object({
  event_id: z.string().uuid(),
  display_name: z.string().max(120).optional(),
  phone: z.string().max(32).nullable().optional(),
  remark: z.string().max(500).nullable().optional(),
  disabled: z.boolean().optional(),
  role_id: z.string().uuid().optional(),
});

export const expoResetPasswordSchema = z.object({
  event_id: z.string().uuid(),
  new_password: passwordSchema,
});

export const expoKickBodySchema = z.object({
  event_id: z.string().uuid(),
});

export const expoApproveRegistrationSchema = z.object({
  event_id: z.string().uuid(),
  role_id: z.string().uuid(),
});

export const expoPutRolePermissionsSchema = z.object({
  permission_ids: z.array(z.string().uuid()).min(0),
});

export type ExpoRegisterInput = z.infer<typeof expoRegisterSchema>;
export type ExpoLoginInput = z.infer<typeof expoLoginSchema>;
export type ExpoCreateEventInput = z.infer<typeof expoCreateEventSchema>;
export type ExpoCreateUserInput = z.infer<typeof expoCreateUserSchema>;
export type ExpoApproveRegistrationInput = z.infer<typeof expoApproveRegistrationSchema>;
export type ExpoPutRolePermissionsInput = z.infer<typeof expoPutRolePermissionsSchema>;

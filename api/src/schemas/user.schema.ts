/**
 * @file user.schema.ts
 * @description 用户相关的数据验证 Schema，使用 Zod 进行运行时验证和类型推导
 * @author System
 * @createDate 2026-01-25
 */

import { z } from 'zod';

/**
 * 更新用户资料 Schema
 * 
 * @constant
 * @description 验证更新用户资料请求的数据格式
 * 
 * @property {string} [name] - 用户名称，长度 2-50 字符，会自动去除首尾空格（可选）
 * @property {string} [bio] - 个人简介，最多 500 字符，会自动去除首尾空格（可选）
 * @property {string} [phone] - 手机号（写入 auth.users.phone），中国 11 位或空字符串清空
 */
export const updateProfileSchema = z.object({
    name: z
        .string()
        .min(2, '姓名至少 2 个字符')
        .max(50, '姓名最多 50 个字符')
        .trim()
        .optional(),
    bio: z
        .string()
        .max(500, '个人简介最多 500 个字符')
        .trim()
        .optional(),
    phone: z
        .string()
        .regex(/^1[3-9]\d{9}$/, '手机号格式不正确')
        .optional()
        .or(z.literal('')), // 允许空字符串（清空手机号）
});

/**
 * 更新用户资料输入类型
 * 
 * @typedef {z.infer<typeof updateProfileSchema>} UpdateProfileInput
 */
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * 更新头像 Schema
 * 
 * @constant
 * @description 验证更新头像请求的数据格式
 * 
 * @property {string} avatar_url - 头像URL，必须是有效的URL格式，长度不超过 500 字符
 */
export const updateAvatarSchema = z.object({
    avatar_url: z
        .url('头像 URL 格式不正确')
        .max(500, '头像 URL 长度不能超过 500 个字符'),
});

/**
 * 更新头像输入类型
 * 
 * @typedef {z.infer<typeof updateAvatarSchema>} UpdateAvatarInput
 */
export type UpdateAvatarInput = z.infer<typeof updateAvatarSchema>;

/**
 * 修改密码 Schema
 * 
 * @constant
 * @description 验证修改密码请求的数据格式
 * 
 * @property {string} old_password - 旧密码，不能为空
 * @property {string} new_password - 新密码，长度 8-100 字符，必须包含大小写字母和数字
 * 
 * @description 使用 refine 验证新密码不能与旧密码相同
 */
export const changePasswordSchema = z.object({
    old_password: z
        .string()
        .min(1, '旧密码不能为空'),
    new_password: z
        .string()
        .min(8, '新密码至少 8 个字符')
        .max(100, '新密码最多 100 个字符')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            '新密码必须包含大小写字母和数字'
        ),
}).refine((data: Record<string, unknown>) => data.old_password !== data.new_password, {
    message: '新密码不能与旧密码相同',
    path: ['new_password'],
});

/**
 * 修改密码输入类型
 * 
 * @typedef {z.infer<typeof changePasswordSchema>} ChangePasswordInput
 */
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * 更换邮箱 Schema（由 Supabase Auth 发确认邮件，不再使用自建验证码表）
 */
export const changeEmailSchema = z.object({
    new_email: z
        .string()
        .email('邮箱格式不正确')
        .min(1, '邮箱不能为空'),
});

/**
 * 确认更换邮箱输入类型
 * 
 * @typedef {z.infer<typeof changeEmailSchema>} ChangeEmailInput
 */
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
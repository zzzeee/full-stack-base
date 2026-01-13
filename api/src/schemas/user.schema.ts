// src/schemas/user.schema.ts
/**
 * 用户相关的数据验证 Schema
 */

import { z } from 'zod';

/**
 * 更新用户资料 Schema
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

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * 更新头像 Schema
 */
export const updateAvatarSchema = z.object({
    avatar_url: z
        .url('头像 URL 格式不正确')
        .max(500, '头像 URL 长度不能超过 500 个字符'),
});

export type UpdateAvatarInput = z.infer<typeof updateAvatarSchema>;

/**
 * 修改密码 Schema
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

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
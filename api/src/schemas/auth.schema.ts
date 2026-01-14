// src/schemas/auth.schema.ts
/**
 * 认证相关的数据验证 Schema
 * 使用 Zod 进行运行时验证和类型推导
 */

import { z } from 'zod';
import { VerificationPurpose } from '../types/auth.types.ts';

/**
 * 发送验证码 Schema
 */
export const sendVerificationCodeSchema = z.object({
    email: z
        .email('邮箱格式不正确')
        .min(1, '邮箱不能为空')
        .max(255, '邮箱长度不能超过 255 个字符'),

    purpose: z
        .enum(VerificationPurpose)
        .default(VerificationPurpose.LOGIN),
});

export type SendVerificationCodeInput = z.infer<typeof sendVerificationCodeSchema>;

/**
 * 验证码登录 Schema
 */
export const verificationCodeLoginSchema = z.object({
    email: z
        .email('邮箱格式不正确')
        .min(1, '邮箱不能为空'),

    code: z
        .string()
        .min(1, '验证码不能为空')
        .length(6, '验证码必须是 6 位数字')
        .regex(/^\d{6}$/, '验证码必须是 6 位数字'),
});

export type VerificationCodeLoginInput = z.infer<typeof verificationCodeLoginSchema>;

/**
 * 密码登录 Schema
 */
export const passwordLoginSchema = z.object({
    email: z
        .email('邮箱格式不正确')
        .min(1, '邮箱不能为空'),

    password: z
        .string()
        .min(1, '密码不能为空')
        .min(8, '密码至少 8 个字符')
        .max(100, '密码最多 100 个字符'),
});

export type PasswordLoginInput = z.infer<typeof passwordLoginSchema>;

/**
 * 注册 Schema
 */
export const registerSchema = z.object({
    email: z
        .email('邮箱格式不正确')
        .min(1, '邮箱不能为空')
        .max(255, '邮箱长度不能超过 255 个字符'),

    password: z
        .string()
        .min(1, '密码不能为空')
        .min(8, '密码至少 8 个字符')
        .max(100, '密码最多 100 个字符')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            '密码必须包含大小写字母和数字',
        ),

    name: z
        .string()
        // .min(1, '姓名不能为空')
        .min(2, '姓名至少 2 个字符')
        .max(50, '姓名最多 50 个字符')
        .trim(),

    code: z
        .string()
        .min(1, '验证码不能为空')
        .length(6, '验证码必须是 6 位数字')
        .regex(/^\d{6}$/, '验证码必须是 6 位数字'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
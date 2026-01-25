/**
 * @file auth.schema.ts
 * @description 认证相关的数据验证 Schema，使用 Zod 进行运行时验证和类型推导
 * @author System
 * @createDate 2026-01-25
 */

import { z } from 'zod';
import { VerificationPurpose } from '../types/auth.types.ts';

/**
 * 发送验证码 Schema
 * 
 * @constant
 * @description 验证发送验证码请求的数据格式
 * 
 * @property {string} email - 邮箱地址，必须是有效的邮箱格式，长度 1-255 字符
 * @property {VerificationPurpose} [purpose] - 验证码用途，默认为 LOGIN
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

/**
 * 验证码登录输入类型
 * 
 * @typedef {z.infer<typeof verificationCodeLoginSchema>} VerificationCodeLoginInput
 */
export type VerificationCodeLoginInput = z.infer<typeof verificationCodeLoginSchema>;

/**
 * 密码登录 Schema
 * 
 * @constant
 * @description 验证密码登录请求的数据格式
 * 
 * @property {string} email - 邮箱地址，必须是有效的邮箱格式
 * @property {string} password - 密码，长度 8-100 字符
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

/**
 * 密码登录输入类型
 * 
 * @typedef {z.infer<typeof passwordLoginSchema>} PasswordLoginInput
 */
export type PasswordLoginInput = z.infer<typeof passwordLoginSchema>;

/**
 * 注册 Schema
 * 
 * @constant
 * @description 验证用户注册请求的数据格式
 * 
 * @property {string} email - 邮箱地址，必须是有效的邮箱格式，长度 1-255 字符
 * @property {string} password - 密码，长度 8-100 字符，必须包含大小写字母和数字
 * @property {string} name - 姓名，长度 2-50 字符，会自动去除首尾空格
 * @property {string} code - 验证码，必须是 6 位数字
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

/**
 * 注册输入类型
 * 
 * @typedef {z.infer<typeof registerSchema>} RegisterInput
 */
export type RegisterInput = z.infer<typeof registerSchema>;
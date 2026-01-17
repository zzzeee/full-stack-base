// src/lib/errors/error-codes.ts
/**
 * 错误码常量
 */

import { ContentfulStatusCode } from '@hono/hono/utils/http-status';

interface ErrorInfo {
    code: string;
    message: string;
    status: ContentfulStatusCode;
}

export const ErrorInfos: Record<string, ErrorInfo> = {
    INTERNAL_ERROR: {
        code: '00-0001',
        message: '内部错误',
        status: 500,
    },
    VALIDATION_ERROR: {
        code: '00-0002',
        message: '数据验证失败',
        status: 400,
    },
    NOT_FOUND: {
        code: '00-0003',
        message: '资源不存在',
        status: 404,
    },
    AUTH_INVALID_CREDENTIALS: {
        code: '10-0001',
        message: '邮箱或密码错误',
        status: 401,
    },
    AUTH_TOKEN_EXPIRED: {
        code: '10-0002',
        message: '登录已过期，请重新登录',
        status: 401,
    },
    AUTH_TOKEN_INVALID: {
        code: '10-0003',
        message: 'Token 无效',
        status: 401,
    },
    AUTH_UNAUTHORIZED: {
        code: '10-0004',
        message: '未授权访问',
        status: 401,
    },
    AUTH_ACCOUNT_DISABLED: {
        code: '10-0005',
        message: '账号已被禁用',
        status: 403,
    },
    AUTH_ACCOUNT_LOCKED: {
        code: '10-0006',
        message: '账号已被锁定',
        status: 423,
    },
    AUTH_PASSWORD_NOT_SET: {
        code: '10-0007',
        message: '密码未设置',
        status: 400,
    },
    AUTH_INVALID_OLD_PASSWORD: {
        code: '10-0008',
        message: '旧密码错误',
        status: 400,
    },
    USER_NOT_FOUND: {
        code: '20-0001',
        message: '用户不存在',
        status: 404,
    },
    USER_ALREADY_EXISTS: {
        code: '20-0002',
        message: '用户已存在',
        status: 409,
    },
    USER_EMAIL_ALREADY_EXISTS: {
        code: '20-0003',
        message: '邮箱已存在',
        status: 409,
    },
    VERIFICATION_CODE_INVALID: {
        code: '30-0001',
        message: '验证码错误或已过期',
        status: 400,
    },
    VERIFICATION_CODE_EXPIRED: {
        code: '30-0002',
        message: '验证码已过期',
        status: 400,
    },
    VERIFICATION_CODE_TOO_FREQUENT: {
        code: '30-0003',
        message: '发送过于频繁，请稍后再试',
        status: 429,
    },
    VERIFICATION_CODE_MAX_ATTEMPTS: {
        code: '30-0004',
        message: '验证码重试次数过多，请稍后再试',
        status: 429,
    },
    EMAIL_SEND_FAILED: {
        code: '40-0001',
        message: '验证码发失败',
        status: 500,
    },
};

// src/lib/errors/error-codes.ts
/**
 * 错误码常量
 */

export const ErrorCodes = {
    // 通用错误 00-XXXX
    INTERNAL_ERROR: '00-0001',
    VALIDATION_ERROR: '00-0002',
    NOT_FOUND: '00-0003',

    // 认证错误 10-XXXX
    AUTH_INVALID_CREDENTIALS: '10-0001',
    AUTH_TOKEN_EXPIRED: '10-0002',
    AUTH_TOKEN_INVALID: '10-0003',
    AUTH_UNAUTHORIZED: '10-0004',
    AUTH_ACCOUNT_DISABLED: '10-0005',
    AUTH_ACCOUNT_LOCKED: '10-0006',
    AUTH_PASSWORD_NOT_SET: '10-0007',
    AUTH_INVALID_OLD_PASSWORD: '10-0008',

    // 用户错误 20-XXXX
    USER_NOT_FOUND: '20-0001',
    USER_ALREADY_EXISTS: '20-0002',
    USER_EMAIL_ALREADY_EXISTS: '20-0003',

    // 验证码错误 30-XXXX
    VERIFICATION_CODE_INVALID: '30-0001',
    VERIFICATION_CODE_EXPIRED: '30-0002',
    VERIFICATION_CODE_TOO_FREQUENT: '30-0003',
    VERIFICATION_CODE_MAX_ATTEMPTS: '30-0004',

    // 邮件错误 40-XXXX
    EMAIL_SEND_FAILED: '40-0001',
} as const;

export const ErrorStatusMap: Record<string, number> = {
    [ErrorCodes.INTERNAL_ERROR]: 500,
    [ErrorCodes.VALIDATION_ERROR]: 400,
    [ErrorCodes.NOT_FOUND]: 404,

    [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 401,
    [ErrorCodes.AUTH_TOKEN_EXPIRED]: 401,
    [ErrorCodes.AUTH_TOKEN_INVALID]: 401,
    [ErrorCodes.AUTH_UNAUTHORIZED]: 401,
    [ErrorCodes.AUTH_ACCOUNT_DISABLED]: 403,
    [ErrorCodes.AUTH_ACCOUNT_LOCKED]: 423,
    [ErrorCodes.AUTH_PASSWORD_NOT_SET]: 400,
    [ErrorCodes.AUTH_INVALID_OLD_PASSWORD]: 400,

    [ErrorCodes.USER_NOT_FOUND]: 404,
    [ErrorCodes.USER_ALREADY_EXISTS]: 409,
    [ErrorCodes.USER_EMAIL_ALREADY_EXISTS]: 409,

    [ErrorCodes.VERIFICATION_CODE_INVALID]: 400,
    [ErrorCodes.VERIFICATION_CODE_EXPIRED]: 400,
    [ErrorCodes.VERIFICATION_CODE_TOO_FREQUENT]: 429,
    [ErrorCodes.VERIFICATION_CODE_MAX_ATTEMPTS]: 429,

    [ErrorCodes.EMAIL_SEND_FAILED]: 500,
};

export const ErrorMessages: Record<string, string> = {
    [ErrorCodes.AUTH_INVALID_CREDENTIALS]: '邮箱或密码错误',
    [ErrorCodes.AUTH_TOKEN_EXPIRED]: '登录已过期，请重新登录',
    [ErrorCodes.AUTH_TOKEN_INVALID]: 'Token 无效',
    [ErrorCodes.AUTH_UNAUTHORIZED]: '未授权访问',
    [ErrorCodes.AUTH_ACCOUNT_DISABLED]: '账号已被禁用',
    [ErrorCodes.AUTH_ACCOUNT_LOCKED]: '账号已被锁定',
    [ErrorCodes.USER_EMAIL_ALREADY_EXISTS]: '该邮箱已被注册',
    [ErrorCodes.VERIFICATION_CODE_INVALID]: '验证码错误或已过期',
    [ErrorCodes.VERIFICATION_CODE_TOO_FREQUENT]: '发送过于频繁，请稍后再试',
};
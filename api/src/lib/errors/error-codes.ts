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

export const CheckIsErrorCodes = (code: string): code is ErrorCodes => {
    return Object.values(ErrorCodes).includes(code as ErrorCodes);
}

export const GetErrorInfoByCode = (code: string): ErrorInfo => {
    if(CheckIsErrorCodes(code)) {
        return ErrorInfos[code as ErrorCodes];
    }
    return ErrorInfos[ErrorCodes.UNKNOWN_ERROR];
}

export enum ErrorCodes {
    UNKNOWN_ERROR = '00-0900',
    INTERNAL_ERROR = '00-0001',
    VALIDATION_ERROR = '00-0002',
    NOT_FOUND = '00-0003',
    AUTH_INVALID_CREDENTIALS = '10-0001',
    AUTH_TOKEN_EXPIRED = '10-0002',
    AUTH_TOKEN_INVALID = '10-0003',
    AUTH_UNAUTHORIZED = '10-0004',
    AUTH_ACCOUNT_DISABLED = '10-0005',
    AUTH_ACCOUNT_LOCKED = '10-0006',
    AUTH_PASSWORD_NOT_SET = '10-0007',
    AUTH_INVALID_OLD_PASSWORD = '10-0008',
    USER_NOT_FOUND = '20-0001',
    USER_ALREADY_EXISTS = '20-0002',
    USER_EMAIL_ALREADY_EXISTS = '20-0003',
    VERIFICATION_CODE_INVALID = '30-0001',
    VERIFICATION_CODE_EXPIRED = '30-0002',
    VERIFICATION_CODE_TOO_FREQUENT = '30-0003',
    VERIFICATION_CODE_MAX_ATTEMPTS = '30-0004',
    EMAIL_SEND_FAILED = '40-0001',
}

export const ErrorInfos: Record<ErrorCodes, ErrorInfo> = {
    [ErrorCodes.UNKNOWN_ERROR]: {
        code: ErrorCodes.UNKNOWN_ERROR,
        message: '未知错误',
        status: 500,
    },
    [ErrorCodes.INTERNAL_ERROR]: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: '内部错误',
        status: 500,
    },
    [ErrorCodes.VALIDATION_ERROR]: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: '数据验证失败',
        status: 400,
    },
    [ErrorCodes.NOT_FOUND]: {
        code: ErrorCodes.NOT_FOUND,
        message: '资源不存在',
        status: 404,
    },
    [ErrorCodes.AUTH_INVALID_CREDENTIALS]: {
        code: ErrorCodes.AUTH_INVALID_CREDENTIALS,
        message: '邮箱或密码错误',
        status: 401,
    },
    [ErrorCodes.AUTH_TOKEN_EXPIRED]: {
        code: ErrorCodes.AUTH_TOKEN_EXPIRED,
        message: '登录已过期，请重新登录',
        status: 401,
    },
    [ErrorCodes.AUTH_TOKEN_INVALID]: {
        code: ErrorCodes.AUTH_TOKEN_INVALID,
        message: 'Token 无效',
        status: 401,
    },
    [ErrorCodes.AUTH_UNAUTHORIZED]: {
        code: ErrorCodes.AUTH_UNAUTHORIZED,
        message: '未授权访问',
        status: 401,
    },
    [ErrorCodes.AUTH_ACCOUNT_DISABLED]: {
        code: ErrorCodes.AUTH_ACCOUNT_DISABLED,
        message: '账号已被禁用',
        status: 403,
    },
    [ErrorCodes.AUTH_ACCOUNT_LOCKED]: {
        code: ErrorCodes.AUTH_ACCOUNT_LOCKED,
        message: '账号已被锁定',
        status: 423,
    },
    [ErrorCodes.AUTH_PASSWORD_NOT_SET]: {
        code: ErrorCodes.AUTH_PASSWORD_NOT_SET,
        message: '密码未设置',
        status: 400,
    },
    [ErrorCodes.AUTH_INVALID_OLD_PASSWORD]: {
        code: ErrorCodes.AUTH_INVALID_OLD_PASSWORD,
        message: '旧密码错误',
        status: 400,
    },
    [ErrorCodes.USER_NOT_FOUND]: {
        code: ErrorCodes.USER_NOT_FOUND,
        message: '用户不存在',
        status: 404,
    },
    [ErrorCodes.USER_ALREADY_EXISTS]: {
        code: ErrorCodes.USER_ALREADY_EXISTS,
        message: '用户已存在',
        status: 409,
    },
    [ErrorCodes.USER_EMAIL_ALREADY_EXISTS]: {
        code: ErrorCodes.USER_EMAIL_ALREADY_EXISTS,
        message: '邮箱已存在',
        status: 409,
    },
    [ErrorCodes.VERIFICATION_CODE_INVALID]: {
        code: ErrorCodes.VERIFICATION_CODE_INVALID,
        message: '验证码错误或已过期',
        status: 400,
    },
    [ErrorCodes.VERIFICATION_CODE_EXPIRED]: {
        code: ErrorCodes.VERIFICATION_CODE_EXPIRED,
        message: '验证码已过期',
        status: 400,
    },
    [ErrorCodes.VERIFICATION_CODE_TOO_FREQUENT]: {
        code: ErrorCodes.VERIFICATION_CODE_TOO_FREQUENT,
        message: '发送过于频繁，请稍后再试',
        status: 429,
    },
    [ErrorCodes.VERIFICATION_CODE_MAX_ATTEMPTS]: {
        code: ErrorCodes.VERIFICATION_CODE_MAX_ATTEMPTS,
        message: '验证码重试次数过多，请稍后再试',
        status: 429,
    },
    [ErrorCodes.EMAIL_SEND_FAILED]: {
        code: ErrorCodes.EMAIL_SEND_FAILED,
        message: '验证码发失败',
        status: 500,
    },
};

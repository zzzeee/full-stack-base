/**
 * @file error-codes.ts
 * @description 错误码常量定义和错误信息映射
 * @author System
 * @createDate 2026-01-25
 */

import { ContentfulStatusCode } from '@hono/hono/utils/http-status';

/**
 * 错误信息接口
 * 
 * @interface
 * @property {string} code - 错误代码
 * @property {string} message - 错误消息
 * @property {ContentfulStatusCode} status - HTTP 状态码
 */
interface ErrorInfo {
    code: string;
    message: string;
    status: ContentfulStatusCode;
}

/**
 * 检查字符串是否为有效的错误代码
 * 
 * @param {string} code - 待检查的错误代码字符串
 * @returns {code is ErrorCodes} 是否为有效的错误代码
 */
export const CheckIsErrorCodes = (code: string): code is ErrorCodes => {
    return Object.values(ErrorCodes).includes(code as ErrorCodes);
}

/**
 * 根据错误代码获取错误信息
 * 
 * @param {string} code - 错误代码
 * @returns {ErrorInfo} 错误信息对象，如果代码无效则返回未知错误信息
 */
export const GetErrorInfoByCode = (code: string): ErrorInfo => {
    if(CheckIsErrorCodes(code)) {
        return ErrorInfos[code as ErrorCodes];
    }
    return ErrorInfos[ErrorCodes.UNKNOWN_ERROR];
}

/**
 * 错误代码枚举
 * 
 * @enum {string}
 * @description 定义所有应用错误代码，格式为 "XX-YYYY"，XX 为模块代码，YYYY 为具体错误代码
 * - 00: 通用错误
 * - 10: 认证相关错误
 * - 20: 用户相关错误
 * - 30: 验证码相关错误
 * - 40: 邮件相关错误
 */
export enum ErrorCodes {
    /** 未知错误 */
    UNKNOWN_ERROR = '00-0900',
    /** 内部服务器错误 */
    INTERNAL_ERROR = '00-0001',
    /** 数据验证失败 */
    VALIDATION_ERROR = '00-0002',
    /** 资源不存在 */
    NOT_FOUND = '00-0003',
    /** 认证：无效凭据 */
    AUTH_INVALID_CREDENTIALS = '10-0001',
    /** 认证：Token 已过期 */
    AUTH_TOKEN_EXPIRED = '10-0002',
    /** 认证：Token 无效 */
    AUTH_TOKEN_INVALID = '10-0003',
    /** 认证：未授权 */
    AUTH_UNAUTHORIZED = '10-0004',
    /** 认证：账号已被禁用 */
    AUTH_ACCOUNT_DISABLED = '10-0005',
    /** 认证：账号已被锁定 */
    AUTH_ACCOUNT_LOCKED = '10-0006',
    /** 认证：密码未设置 */
    AUTH_PASSWORD_NOT_SET = '10-0007',
    /** 认证：旧密码错误 */
    AUTH_INVALID_OLD_PASSWORD = '10-0008',
    /** 用户：用户不存在 */
    USER_NOT_FOUND = '20-0001',
    /** 用户：用户已存在 */
    USER_ALREADY_EXISTS = '20-0002',
    /** 用户：邮箱已存在 */
    USER_EMAIL_ALREADY_EXISTS = '20-0003',
    /** 验证码：验证码无效 */
    VERIFICATION_CODE_INVALID = '30-0001',
    /** 验证码：验证码已过期 */
    VERIFICATION_CODE_EXPIRED = '30-0002',
    /** 验证码：发送过于频繁 */
    VERIFICATION_CODE_TOO_FREQUENT = '30-0003',
    /** 验证码：重试次数过多 */
    VERIFICATION_CODE_MAX_ATTEMPTS = '30-0004',
    /** 邮件：发送失败 */
    EMAIL_SEND_FAILED = '40-0001',
}

/**
 * 错误信息映射表
 * 
 * @constant
 * @description 将错误代码映射到对应的错误信息（消息和 HTTP 状态码）
 */
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

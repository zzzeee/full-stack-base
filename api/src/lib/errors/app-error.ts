/**
 * @file app-error.ts
 * @description 应用错误基类和具体错误类定义，提供统一的错误处理机制
 * @author System
 * @createDate 2026-01-25
 */

import { ErrorCodes, GetErrorInfoByCode } from './error-codes.ts';

/**
 * 应用错误基类
 * 
 * @class
 * @extends {Error}
 * @description 所有业务错误都应继承此类，提供统一的错误码、状态码和详情信息
 */
export class AppError extends Error {
    /** 错误代码 */
    public readonly code: string;
    /** HTTP 状态码 */
    public readonly statusCode: number;
    /** 是否为可预期的业务错误 */
    public readonly isOperational: boolean;
    /** 错误详情信息 */
    public readonly details?: unknown;

    /**
     * 创建 AppError 实例
     * 
     * @param {string} code - 错误代码
     * @param {string} [message] - 错误消息，如果不提供则从错误码映射中获取
     * @param {unknown} [details] - 错误详情
     * @param {boolean} [isOperational=true] - 是否为可预期的业务错误
     */
    constructor(
        code: string,
        message?: string,
        details?: unknown,
        isOperational = true
    ) {
        const errInfo = GetErrorInfoByCode(code);
        super(message || errInfo.message);

        this.code = code;
        this.statusCode = errInfo.status;
        this.isOperational = isOperational;
        this.details = details;

        // 保持正确的堆栈跟踪
        Error.captureStackTrace(this, this.constructor);

        // 设置原型链（TypeScript继承Error的问题）
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

// ========== 具体错误类 ==========

/**
 * 认证错误类
 * 
 * @class
 * @extends {AppError}
 * @description 用于处理认证相关的错误
 */
export class AuthError extends AppError {
    /**
     * 创建认证错误
     * 
     * @param {string} code - 错误代码
     * @param {string} [message] - 错误消息
     * @param {unknown} [details] - 错误详情
     */
    constructor(code: string, message?: string, details?: unknown) {
        super(code, message, details);
        this.name = 'AuthError';
    }
}

/**
 * 验证错误类
 * 
 * @class
 * @extends {AppError}
 * @description 用于处理数据验证失败的错误
 */
export class ValidationError extends AppError {
    /**
     * 创建验证错误
     * 
     * @param {unknown} details - 验证失败的详情信息
     * @param {string} [message='数据验证失败'] - 错误消息
     */
    constructor(details: unknown, message = '数据验证失败') {
        super(ErrorCodes.VALIDATION_ERROR, message, details);
        this.name = 'ValidationError';
    }
}

/**
 * 资源不存在错误类
 * 
 * @class
 * @extends {AppError}
 * @description 用于处理资源不存在的错误
 */
export class NotFoundError extends AppError {
    /**
     * 创建资源不存在错误
     * 
     * @param {string} resource - 资源名称
     */
    constructor(resource: string) {
        super(ErrorCodes.NOT_FOUND, `${resource} 不存在`);
        this.name = 'NotFoundError';
    }
}

// ========== 便捷工厂函数 ==========

/**
 * 认证错误工厂函数
 * 
 * @constant
 * @description 提供快速创建常见认证错误的便捷方法
 */
export const createAuthError = {
    /**
     * 创建无效凭据错误
     * 
     * @returns {AuthError} 无效凭据错误实例
     */
    invalidCredentials: () =>
        new AuthError(ErrorCodes.AUTH_INVALID_CREDENTIALS),

    /**
     * 创建 Token 过期错误
     * 
     * @returns {AuthError} Token 过期错误实例
     */
    tokenExpired: () =>
        new AuthError(ErrorCodes.AUTH_TOKEN_EXPIRED),

    /**
     * 创建 Token 无效错误
     * 
     * @returns {AuthError} Token 无效错误实例
     */
    tokenInvalid: () =>
        new AuthError(ErrorCodes.AUTH_TOKEN_INVALID),

    /**
     * 创建未授权错误
     * 
     * @param {string} [message] - 自定义错误消息
     * @returns {AuthError} 未授权错误实例
     */
    unauthorized: (message?: string) =>
        new AuthError(ErrorCodes.AUTH_UNAUTHORIZED, message),
};

/**
 * 用户错误工厂函数
 * 
 * @constant
 * @description 提供快速创建常见用户错误的便捷方法
 */
export const createUserError = {
    /**
     * 创建用户不存在错误
     * 
     * @param {string} userId - 用户ID
     * @returns {AppError} 用户不存在错误实例
     */
    notFound: (userId: string) =>
        new AppError(ErrorCodes.USER_NOT_FOUND, undefined, { userId }),

    /**
     * 创建邮箱已存在错误
     * 
     * @param {string} email - 邮箱地址
     * @returns {AppError} 邮箱已存在错误实例
     */
    emailTaken: (email: string) =>
        new AppError(ErrorCodes.USER_EMAIL_ALREADY_EXISTS, undefined, { email }),
};
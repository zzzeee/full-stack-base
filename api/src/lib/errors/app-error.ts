// src/core/errors/app-error.ts

import { ErrorCodes, ErrorStatusMap, ErrorMessages } from './error-codes.ts';

/**
 * 应用错误基类
 * 所有业务错误都应继承此类
 */
export class AppError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly isOperational: boolean; // 是否为可预期的业务错误
    public readonly details?: unknown;

    constructor(
        code: string,
        message?: string,
        details?: unknown,
        isOperational = true
    ) {
        super(message || ErrorMessages[code] || 'An error occurred');

        this.code = code;
        this.statusCode = ErrorStatusMap[code] || 500;
        this.isOperational = isOperational;
        this.details = details;

        // 保持正确的堆栈跟踪
        Error.captureStackTrace(this, this.constructor);

        // 设置原型链（TypeScript继承Error的问题）
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

// ========== 具体错误类 ==========

export class AuthError extends AppError {
    constructor(code: string, message?: string, details?: unknown) {
        super(code, message, details);
        this.name = 'AuthError';
    }
}

export class ValidationError extends AppError {
    constructor(details: unknown, message = '数据验证失败') {
        super(ErrorCodes.VALIDATION_ERROR, message, details);
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string) {
        super(ErrorCodes.NOT_FOUND, `${resource} 不存在`);
        this.name = 'NotFoundError';
    }
}

// ========== 便捷工厂函数 ==========

export const createAuthError = {
    invalidCredentials: () =>
        new AuthError(ErrorCodes.AUTH_INVALID_CREDENTIALS),

    tokenExpired: () =>
        new AuthError(ErrorCodes.AUTH_TOKEN_EXPIRED),

    tokenInvalid: () =>
        new AuthError(ErrorCodes.AUTH_TOKEN_INVALID),

    unauthorized: (message?: string) =>
        new AuthError(ErrorCodes.AUTH_UNAUTHORIZED, message),
};

export const createUserError = {
    notFound: (userId: string) =>
        new AppError(ErrorCodes.USER_NOT_FOUND, undefined, { userId }),

    emailTaken: (email: string) =>
        new AppError(ErrorCodes.USER_EMAIL_TAKEN, undefined, { email }),
};
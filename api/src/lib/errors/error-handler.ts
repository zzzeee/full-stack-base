// src/core/errors/error-handler.ts

import { Context, Hono } from '@hono/hono';
import { AppError } from './app-error.ts';
import { logger } from '@/lib/logger.ts';
import { apiResponse } from './api-response.ts';
import { ContentfulStatusCode } from "@hono/hono/utils/http-status";

/**
 * 全局错误处理中间件
 */
export const errorHandler = (err: Error, c: Context) => {
    // 1. 记录错误日志
    if (err instanceof AppError) {
        if (err.statusCode >= 500) {
            logger.error('Application error:', {
                code: err.code,
                message: err.message,
                details: err.details,
                stack: err.stack,
            });
        } else {
            logger.warn('Client error:', {
                code: err.code,
                message: err.message,
            });
        }
    } else {
        // 未预期的错误
        logger.error('Unexpected error:', {
            message: err.message,
            stack: err.stack,
        });
    }

    // 2. 构造错误响应
    if (err instanceof AppError) {
        const status = err.statusCode as ContentfulStatusCode;
        return c.json(
            apiResponse.error(err.message, err.code, err.details),
            status
        );
    }

    // 3. Zod验证错误特殊处理
    if (err.name === 'ZodError') {
        return c.json(
            apiResponse.error('数据验证失败', 'VALIDATION_ERROR', err),
            400
        );
    }

    // 4. 兜底：未知错误
    const isDev = Deno.env.get('ENVIRONMENT') === 'development';

    return c.json(
        apiResponse.error(
            isDev ? err.message : '服务器内部错误',
            'INTERNAL_ERROR',
            isDev ? { stack: err.stack } : undefined
        ),
        500
    );
};

/**
 * Hono注册方式
 */
export const registerErrorHandler = (app: Hono) => {
    app.onError(errorHandler);
};
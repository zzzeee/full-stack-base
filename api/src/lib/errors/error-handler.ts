/**
 * @file error-handler.ts
 * @description 全局错误处理中间件，统一处理应用中的各种错误
 * @author System
 * @createDate 2026-01-25
 */

import { Context, Hono } from '@hono/hono';
import { AppError } from '@/lib/errors/app-error.ts';
import { logger } from '@/lib/logger.ts';
import { apiResponse } from '@/lib/api-response.ts';
import { ContentfulStatusCode } from "@hono/hono/utils/http-status";

/**
 * 全局错误处理中间件
 * 
 * @param {Error} err - 错误对象
 * @param {Context} c - Hono 上下文对象
 * @returns {Response} JSON 格式的错误响应
 * 
 * @description
 * 处理不同类型的错误：
 * 1. AppError: 业务错误，根据错误码返回相应状态码和消息
 * 2. ZodError: 数据验证错误，返回 400 状态码
 * 3. 其他错误: 未知错误，开发环境返回详细错误，生产环境返回通用错误
 */
export const errorHandler = (err: Error, c: Context) => {
    // 1. 记录错误日志
    const requestId = c.get('requestId');
    const ip = c.get('clientIP');
    const userId = c.get('userId');

    if (err instanceof AppError) {
        if (err.statusCode >= 500) {
            logger.error('Application error:', {
                requestId,
                userId,
                ip,
                error: {
                    type: 'AppError',
                    code: err.code,
                    message: err.message,
                    stack: err.stack,
                },
                context: {
                    details: err.details,
                    statusCode: err.statusCode,
                },
            });
        } else {
            logger.warn('Client error:', {
                requestId,
                userId,
                ip,
                error: {
                    type: 'AppError',
                    code: err.code,
                    message: err.message,
                },
                context: {
                    statusCode: err.statusCode,
                },
            });
        }
    } else {
        // 未预期的错误
        logger.error('Unexpected error:', {
            requestId,
            userId,
            ip,
            error: {
                type: err.name || 'Error',
                message: err.message,
                stack: err.stack,
            },
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
 * 注册错误处理器到 Hono 应用
 * 
 * @param {Hono} app - Hono 应用实例
 * @description 将全局错误处理中间件注册到 Hono 应用的错误处理链中
 * 
 * @example
 * const app = new Hono();
 * registerErrorHandler(app);
 */
export const registerErrorHandler = (app: Hono) => {
    app.onError(errorHandler);
};
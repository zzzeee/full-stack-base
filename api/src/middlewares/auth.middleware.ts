// src/middlewares/auth.middleware.ts
/**
 * 认证中间件
 * 验证 JWT Token 并注入用户信息到上下文
 */

import type { Context, Next } from '@hono/hono';
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt.ts';
import { logger } from '@/lib/logger.ts';
import { createAuthError } from '@/lib/errors/app-error.ts';

/**
 * JWT 认证中间件
 * 从请求头中提取和验证 Token，将用户信息注入到上下文
 */
export async function authMiddleware(c: Context, next: Next) {
    try {
        // 1. 从请求头提取 Token
        const authHeader = c.req.header('Authorization');
        const token = extractTokenFromHeader(authHeader || '');

        if (!token) {
            throw createAuthError.unauthorized('缺少认证令牌');
        }

        // 2. 验证 Token
        const payload = await verifyToken(token);

        // 3. 将用户信息注入到上下文
        c.set('userId', payload.sub);
        c.set('userEmail', payload.email);
        c.set('userRole', payload.role);

        logger.debug('User authenticated', {
            userId: payload.sub,
            email: payload.email,
        });

        await next();
    } catch (error) {
        logger.warn('Authentication failed', {
            error: error instanceof Error ? error.message : String(error),
        });

        // 抛出错误，由全局错误处理器捕获
        if (error instanceof Error && error.message.includes('Token')) {
            throw createAuthError.tokenInvalid();
        }

        throw createAuthError.unauthorized();
    }
}

/**
 * 可选认证中间件
 * Token 存在时验证，不存在时也允许通过
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
    try {
        const authHeader = c.req.header('Authorization');
        const token = extractTokenFromHeader(authHeader || '');

        if (token) {
            const payload = await verifyToken(token);
            c.set('userId', payload.sub);
            c.set('userEmail', payload.email);
            c.set('userRole', payload.role);
        }

        await next();
    } catch (error) {
        // 可选认证失败不抛出错误，继续执行
        logger.debug('Optional authentication failed', {
            error: error instanceof Error ? error.message : String(error),
        });
        await next();
    }
}
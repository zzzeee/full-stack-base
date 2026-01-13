// src/handlers/auth.handler.ts
/**
 * 认证请求处理器
 * 处理 HTTP 请求和响应
 */

import type { Context } from '@hono/hono';
import { authService } from '@/services/auth.service.ts';
import { logger } from '@/lib/logger.ts';
import { apiResponse } from '@/lib/errors/api-response.ts';

/**
 * 获取客户端 IP 地址
 * @param c - Hono Context
 * @returns string - IP 地址
 */
function getClientIp(c: Context): string {
    // 优先从 X-Forwarded-For 获取（代理/负载均衡器）
    const forwardedFor = c.req.header('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    // 其次从 X-Real-IP 获取
    const realIp = c.req.header('x-real-ip');
    if (realIp) {
        return realIp;
    }

    // 最后使用默认值
    return '0.0.0.0';
}

/**
 * 获取 User Agent
 * @param c - Hono Context
 * @returns string | undefined - User Agent
 */
function getUserAgent(c: Context): string | undefined {
    return c.req.header('user-agent');
}

/**
 * 发送邮箱验证码
 * POST /api/auth/send-code
 * 
 * @body { email: string, purpose: string }
 * @returns { success: true, message: string }
 */
export async function sendVerificationCode(c: Context) {
    const body = c.req.valid('json');

    await authService.sendVerificationCode(
        body.email,
        body.purpose || 'login'
    );

    return c.json(
        apiResponse.success(null, '验证码已发送，请查收邮件'),
        200
    );
}

/**
 * 验证码登录
 * POST /api/auth/login/code
 * 
 * @body { email: string, code: string }
 * @returns { success: true, data: LoginResponse }
 */
export async function loginWithVerificationCode(c: Context) {
    const body = c.req.valid('json');
    const ipAddress = getClientIp(c);
    const userAgent = getUserAgent(c);

    const result = await authService.loginWithVerificationCode(
        body.email,
        body.code,
        ipAddress,
        userAgent
    );

    logger.info('User logged in with verification code', {
        userId: result.user.id,
        email: result.user.email,
    });

    return c.json(apiResponse.success(result, '登录成功'), 200);
}

/**
 * 密码登录
 * POST /api/auth/login/password
 * 
 * @body { email: string, password: string }
 * @returns { success: true, data: LoginResponse }
 */
export async function loginWithPassword(c: Context) {
    const body = c.req.valid('json');
    const ipAddress = getClientIp(c);
    const userAgent = getUserAgent(c);

    const result = await authService.loginWithPassword(
        body.email,
        body.password,
        ipAddress,
        userAgent
    );

    logger.info('User logged in with password', {
        userId: result.user.id,
        email: result.user.email,
    });

    return c.json(apiResponse.success(result, '登录成功'), 200);
}

/**
 * 用户注册
 * POST /api/auth/register
 * 
 * @body { email: string, password: string, name: string, code: string }
 * @returns { success: true, data: LoginResponse }
 */
export async function register(c: Context) {
    const body = c.req.valid('json');
    const ipAddress = getClientIp(c);
    const userAgent = getUserAgent(c);

    const result = await authService.register(
        body.email,
        body.password,
        body.name,
        body.code,
        ipAddress,
        userAgent
    );

    logger.info('User registered', {
        userId: result.user.id,
        email: result.user.email,
    });

    return c.json(apiResponse.success(result, '注册成功'), 201);
}

/**
 * 退出登录
 * POST /api/auth/logout
 * 
 * @returns { success: true, message: string }
 */
export async function logout(c: Context) {
    // 如果使用 JWT，客户端直接删除 Token 即可
    // 如果需要服务端黑名单，可以在这里处理

    const userId = c.get('userId'); // 从认证中间件注入

    logger.info('User logged out', { userId });

    return c.json(apiResponse.success(null, '退出登录成功'), 200);
}
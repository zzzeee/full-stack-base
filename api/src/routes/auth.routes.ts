/**
 * @file auth.routes.ts
 * @description 认证路由模块，定义认证相关的路由和中间件
 * @author System
 * @createDate 2026-01-25
 */

import { Hono } from '@hono/hono';
import { zValidator } from '@hono/zod-validator';
import * as authHandler from '[@BASE-handlers]/auth.handler.ts';
import {
    sendVerificationCodeSchema,
    verificationCodeLoginSchema,
    passwordLoginSchema,
} from '[@BASE-schemas]/auth.schema.ts';
import { authMiddleware } from '[@BASE-middlewares]/auth.middleware.ts';

/**
 * 认证路由实例
 * 
 * @constant
 */
const auth = new Hono();

/**
 * 公开路由（无需认证）
 */

// 发送验证码
// POST /api/auth/send-code
auth.post(
    '/send-code',
    zValidator('json', sendVerificationCodeSchema),
    authHandler.sendVerificationCode
);

// 验证码登录
// POST /api/auth/login/code
auth.post(
    '/login/code',
    zValidator('json', verificationCodeLoginSchema),
    authHandler.loginWithVerificationCode
);

// 密码登录
// POST /api/auth/login/password
auth.post(
    '/login/password',
    zValidator('json', passwordLoginSchema),
    authHandler.loginWithPassword
);

/**
 * 需要认证的路由
 */

// 退出登录
// POST /api/auth/logout
auth.post('/logout', authMiddleware, authHandler.logout);

export default auth;
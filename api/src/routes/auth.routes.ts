// src/routes/auth.routes.ts
/**
 * 认证路由
 * 定义认证相关的路由和中间件
 */

import { Hono } from '@hono/hono';
import type { Context } from '@hono/hono';
import { zValidator } from '@hono/zod-validator';
import * as authHandler from '@/handlers/auth.handler.ts';
import {
    sendVerificationCodeSchema,
    verificationCodeLoginSchema,
    passwordLoginSchema,
    registerSchema,
} from '@/schemas/auth.schema.ts';
import { authMiddleware } from '@/middlewares/auth.middleware.ts';

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
    // async (c: Context) => {
    //   const body = await c.req.json();  
    //   return c.json({
    //     message: `Hello! ${body.email}`,
    //   })
    // }
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

// 用户注册
// POST /api/auth/register
auth.post(
    '/register',
    zValidator('json', registerSchema),
    authHandler.register
);

/**
 * 需要认证的路由
 */

// 退出登录
// POST /api/auth/logout
auth.post('/logout', authMiddleware, authHandler.logout);

export default auth;
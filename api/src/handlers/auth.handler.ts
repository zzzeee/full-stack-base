// src/handlers/auth.handler.ts
/**
 * 认证请求处理器
 * 处理 HTTP 请求和响应
 */

import type { Context } from '@hono/hono';
import { logger } from '@/lib/logger.ts';
import { apiResponse } from '@lib/api-response.ts';
import { ErrorInfos, ErrorCodes } from '@lib/errors/error-codes.ts';
import { 
    SendVerificationCodeInput,
    VerificationCodeLoginInput,
    PasswordLoginInput,
} from '@schemas/auth.schema.ts'
import supabase from "@lib/supabase.client.ts";
import type { LoginResponse } from '@/types/auth.types.ts';

/**
 * 发送邮箱验证码
 * POST /api/auth/send-code
 * 
 * @body { email: string, purpose: string }
 * @returns { success: true, message: string }
 */
export async function sendVerificationCode(c: Context) {
    const body: SendVerificationCodeInput = await c.req.json();
    // 使用 Supabase Auth 发送验证码
    const { error } = await supabase.auth.signInWithOtp({
        email: body.email,
    });
    
    if(error) {
        const errorInfo = ErrorInfos[ErrorCodes.EMAIL_SEND_FAILED];
        return c.json(
            apiResponse.error(errorInfo.message, errorInfo.code, error),
            errorInfo.status
        )
    }else {
        return c.json(
            apiResponse.success(null, '验证码已发送，请查收邮件'),
            200
        );
    }
}

/**
 * 验证码登录
 * POST /api/auth/login/code
 * 
 * @body { email: string, code: string }
 * @returns { success: true, data: LoginResponse }
 */
export async function loginWithVerificationCode(c: Context) {
    const body: VerificationCodeLoginInput = await c.req.json();
    // 使用 Supabase Auth 验证验证码
    const { data, error } = await supabase.auth.verifyOtp({
        email: body.email,
        token: body.code,
        type: 'email',
    });
    
    if(error) {
        const errorInfo = ErrorInfos[ErrorCodes.VERIFICATION_CODE_INVALID];
        return c.json(
            apiResponse.error(errorInfo.message, errorInfo.code, error),
            errorInfo.status
        )
    }else {
        return c.json(
            apiResponse.success({
                user: data.user,
                session: {
                    token: data.session?.access_token,
                    refresh_token: data.session?.refresh_token,
                    expires_at: data.session?.expires_at,
                },
            } as LoginResponse, '登录成功'),
            200
        );
    }
}

/**
 * 密码登录
 * POST /api/auth/login/password
 * 
 * @body { email: string, password: string }
 * @returns { success: true, data: LoginResponse }
 */
export async function loginWithPassword(c: Context) {
    const body: PasswordLoginInput = await c.req.json();
    // 使用 Supabase Auth 密码登录
    const { data, error } = await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
    });
    
    if(error) {
        const errorInfo = ErrorInfos[ErrorCodes.AUTH_INVALID_CREDENTIALS];
        return c.json(
            apiResponse.error(errorInfo.message, errorInfo.code, error),
            errorInfo.status
        )
    }else {
        return c.json(
            apiResponse.success({
                user: data.user,
                session: {
                    token: data.session?.access_token,
                    refresh_token: data.session?.refresh_token,
                    expires_at: data.session?.expires_at,
                },
            } as LoginResponse, '登录成功'),
            200
        );
    }
}

/**
 * 退出登录
 * POST /api/auth/logout
 * 
 * @returns { success: true, message: string }
 */
export function logout(c: Context) {
    // 如果使用 JWT，客户端直接删除 Token 即可
    // 如果需要服务端黑名单，可以在这里处理

    const userId = c.get('userId'); // 从认证中间件注入

    logger.info('User logged out', { userId });

    return c.json(apiResponse.success(null, '退出登录成功'), 200);
}
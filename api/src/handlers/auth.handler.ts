/**
 * @file auth.handler.ts
 * @description 认证请求处理器，处理认证相关的 HTTP 请求和响应
 * @author System
 * @createDate 2026-01-25
 */

import type { Context } from '@hono/hono';
import { logger } from '[@BASE]/lib/logger.ts';
import { apiResponse } from '[@BASE]/lib/api-response.ts';
import type { 
    // deno-lint-ignore no-unused-vars
    SuccessResponse,
    // deno-lint-ignore no-unused-vars
    ErrorResponse, 
} from '[@BASE]/lib/api-response.ts';
import { ErrorInfos, ErrorCodes } from '[@BASE]/lib/errors/error-codes.ts';
import {
    SendVerificationCodeInput,
    VerificationCodeLoginInput,
    PasswordLoginInput,
} from '[@BASE-schemas]/auth.schema.ts'
import supabase from "[@BASE]/lib/supabase.client.ts";
import type { LoginResponse } from '[@BASE]/types/auth.types.ts';
import { authService } from '[@BASE-services]/auth.service.ts';
import { generateToken } from '[@BASE]/lib/jwt.ts';
import { userRepository } from '[@BASE-repositories]/user.repository.ts';


/**
 * 发送邮箱验证码
 * 
 * @route POST /api/auth/send-code
 * @param {Context<{RequestBody: SendVerificationCodeInput}>} c - Hono 上下文对象
 * @returns {Promise<Response<SuccessResponse<null> | ErrorResponse>>} JSON 响应
 * 
 * @description 使用 Supabase Auth 发送邮箱验证码
 */
export async function sendVerificationCode(c: Context) {
    const body: SendVerificationCodeInput = await c.req.json();
    // 使用 Supabase Auth 发送验证码
    const { error } = await supabase.auth.signInWithOtp({
        email: body.email,
    });

    if (error) {
        logger.error('Failed to send verification code', {
            email: body.email,
            error: error.message,
            errorCode: error.status,
        });
        const errorInfo = ErrorInfos[ErrorCodes.EMAIL_SEND_FAILED];
        return c.json(
            apiResponse.error(errorInfo.message, errorInfo.code, error),
            errorInfo.status
        )
    } else {
        logger.info('Verification code sent successfully', {
            email: body.email,
        });
        return c.json(
            apiResponse.success(null, '验证码已发送，请查收邮件'),
            200
        );
    }
}

/**
 * 验证码登录
 * 
 * @route POST /api/auth/login/code
 * @param {Context<{RequestBody: VerificationCodeLoginInput}>} c - Hono 上下文对象
 * @returns {Promise<Response<SuccessResponse<LoginResponse> | ErrorResponse>>} JSON 响应
 * 
 * @description 使用 Supabase Auth 验证验证码并完成登录。如果验证成功，会自动在 public.users 表中创建用户。
 */
export async function loginWithVerificationCode(c: Context) {
    // 路由层已通过 zValidator 校验，这里直接取校验后的数据
    const body: VerificationCodeLoginInput = await c.req.json();
    // 使用 Supabase Auth 验证验证码
    const { data, error } = await supabase.auth.verifyOtp({
        email: body.email,
        token: body.code,
        type: 'email',
    });

    if (error) {
        logger.error('Verification code verification failed', {
            email: body.email,
            error: error.message,
            errorCode: error.status,
        });
        const errorInfo = ErrorInfos[ErrorCodes.VERIFICATION_CODE_INVALID];
        return c.json(
            apiResponse.error(errorInfo.message, errorInfo.code, error),
            errorInfo.status
        )
    } else if (!data.user) {
        logger.error('Supabase verifyOtp returned no user', { data });
        const errorInfo = ErrorInfos[ErrorCodes.INTERNAL_ERROR];
        return c.json(
            apiResponse.error('登录失败，请稍后重试', errorInfo.code),
            errorInfo.status
        );
    } else {
        // Supabase Auth 验证成功后，会在 auth.users 中创建用户
        // 但不会在我们的 public.users 表中创建，需要手动同步
        const supabaseUserId = data.user.id;

        // email 在路由层已校验必填；这里直接使用 body.email 作为业务邮箱
        const email = body.email;

        try {
            const user = await authService.ensurePublicUserExists({
                id: supabaseUserId,
                email,
                emailVerified: true, // 验证码登录表示邮箱已验证
            });

            const loginData = await authService.buildLoginResponse(user);

            return c.json(
                apiResponse.success<LoginResponse>(loginData, '登录成功'),
                200
            );
        } catch (syncErr: unknown) {
            logger.error('Failed to sync user after verifyOtp', {
                supabaseUserId,
                email,
                error: syncErr instanceof Error ? syncErr.message : String(syncErr),
            });
            const errorInfo = ErrorInfos[ErrorCodes.INTERNAL_ERROR];
            return c.json(
                apiResponse.error('用户注册失败，请稍后重试', errorInfo.code),
                errorInfo.status
            );
        }
    }
}

/**
 * 密码登录
 * 
 * @route POST /api/auth/login/password
 * @param {Context<{RequestBody: PasswordLoginInput}>} c - Hono 上下文对象
 * @returns {Promise<Response<SuccessResponse<LoginResponse> | ErrorResponse>>} JSON 响应
 * 
 * @description 使用 Supabase Auth 进行密码登录
 */
export async function loginWithPassword(c: Context) {
    const body: PasswordLoginInput = await c.req.json();
    // 使用 Supabase Auth 密码登录
    const { data, error } = await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
    });

    if (error) {
        logger.error('Password login failed', {
            email: body.email,
            error: error.message,
            errorCode: error.status,
        });
        const errorInfo = ErrorInfos[ErrorCodes.AUTH_INVALID_CREDENTIALS];
        return c.json(
            apiResponse.error(errorInfo.message, errorInfo.code, error),
            errorInfo.status
        )
    } else {
        // 从数据库获取用户信息
        const user = await userRepository.findById(data.user!.id);
        if (!user) {
            const errorInfo = ErrorInfos[ErrorCodes.USER_NOT_FOUND];
            return c.json(
                apiResponse.error(errorInfo.message, errorInfo.code),
                errorInfo.status
            );
        }

        // 生成自己的 JWT token
        const jwtToken = await generateToken({
            sub: user.id,
            email: user.email,
            role: undefined, // 可以根据需要添加角色
        });

        const loginData: LoginResponse = {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
            token: jwtToken,
        };

        return c.json(
            apiResponse.success<LoginResponse>(loginData, '登录成功'),
            200
        );
    }
}

/**
 * 退出登录
 * 
 * @route POST /api/auth/logout
 * @param {Context} c - Hono 上下文对象
 * @returns {Response<SuccessResponse<null> | ErrorResponse>} JSON 响应
 * 
 * @description
 * 如果使用 JWT，客户端直接删除 Token 即可
 * 如果需要服务端黑名单，可以在这里处理
 * 从认证中间件注入的 userId 获取用户信息
 */
export function logout(c: Context) {
    // 如果使用 JWT，客户端直接删除 Token 即可
    // 如果需要服务端黑名单，可以在这里处理

    const userId = c.get('userId'); // 从认证中间件注入

    logger.info('User logged out', { userId });

    return c.json(apiResponse.success(null, '退出登录成功'), 200);
}
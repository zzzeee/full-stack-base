/**
 * @file auth.handler.ts
 * @description 认证请求处理器，处理认证相关的 HTTP 请求和响应
 * @author System
 * @createDate 2026-01-25
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
import { generateToken } from '@/lib/jwt.ts';
import { userRepository, UserRepository } from '@/repositories/user.repository.ts';
import type { LoginResponse } from '@/types/auth.types.ts';

/**
 * 发送邮箱验证码
 * 
 * @route POST /api/auth/send-code
 * @param {Context} c - Hono 上下文对象
 * @body {SendVerificationCodeInput} body - 请求体，包含邮箱和用途
 * @returns {Promise<Response>} JSON 响应，成功时返回成功消息，失败时返回错误信息
 * 
 * @description 使用 Supabase Auth 发送邮箱验证码
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
 * 
 * @route POST /api/auth/login/code
 * @param {Context} c - Hono 上下文对象
 * @body {VerificationCodeLoginInput} body - 请求体，包含邮箱和验证码
 * @returns {Promise<Response>} JSON 响应，成功时返回用户信息和会话 token
 * 
 * @description 使用 Supabase Auth 验证验证码并完成登录
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
        // Supabase Auth 验证成功后，会在 auth.users 中创建用户
        // 但不会在我们的 public.users 表中创建，需要手动同步
        const supabaseUserId = data.user!.id;
        const email = data.user!.email || body.email;
        
        if (!email) {
            logger.error('No email found in Supabase Auth response', { data });
            const errorInfo = ErrorInfos[ErrorCodes.VALIDATION_ERROR];
            return c.json(
                apiResponse.error('邮箱信息缺失', errorInfo.code),
                errorInfo.status
            );
        }

        // 检查 public.users 表中是否存在用户，不存在则自动创建
        let user = await userRepository.findById(supabaseUserId);
        
        if (!user) {
            // 新用户自动注册：从邮箱提取用户名作为默认名称
            const emailName = email.split('@')[0] || '用户';
            
            logger.info('Auto-registering new user to public.users', {
                supabaseUserId,
                email,
                name: emailName,
            });
            
            try {
                // 使用管理员客户端创建用户，绕过 RLS 策略
                const adminUserRepository = new UserRepository(true);
                user = await adminUserRepository.create({
                    id: supabaseUserId,
                    email: email,
                    name: emailName,
                    email_verified: true, // 验证码登录表示邮箱已验证
                    status: 'active',
                });
                
                logger.info('New user auto-registered successfully', {
                    userId: user.id,
                    email: user.email,
                    name: user.name,
                });
            } catch (createError: unknown) {
                // 提取错误信息
                let errorMessage = '未知错误';
                let errorCode: string | undefined;
                let errorDetails: Record<string, unknown> = {};
                
                if (createError instanceof Error) {
                    errorMessage = createError.message;
                    errorDetails = {
                        name: createError.name,
                        stack: createError.stack,
                    };
                } else if (createError && typeof createError === 'object') {
                    // 处理 Supabase 错误对象
                    const err = createError as Record<string, unknown>;
                    errorMessage = err.message as string || err.code as string || '创建用户失败';
                    errorCode = err.code as string;
                    errorDetails = {
                        code: err.code,
                        details: err.details,
                        hint: err.hint,
                    };
                } else {
                    errorMessage = String(createError);
                }
                
                logger.error('Failed to auto-register user', {
                    error: errorMessage,
                    errorCode,
                    supabaseUserId,
                    email,
                    ...errorDetails,
                });
                
                // 如果创建失败（可能是并发创建导致），再次尝试查找
                user = await userRepository.findById(supabaseUserId);
                
                // 如果通过 ID 找不到，尝试通过邮箱查找（处理并发创建的情况）
                if (!user) {
                    user = await userRepository.findByEmail(email);
                    
                    // 如果通过邮箱找到了用户，但 ID 不匹配，说明数据不一致
                    if (user && user.id !== supabaseUserId) {
                        logger.error('User ID mismatch between Supabase Auth and database', {
                            supabaseUserId,
                            databaseUserId: user.id,
                            email,
                        });
                        const errorInfo = ErrorInfos[ErrorCodes.INTERNAL_ERROR];
                        return c.json(
                            apiResponse.error('用户数据不一致，请联系管理员', errorInfo.code),
                            errorInfo.status
                        );
                    }
                }
                
                // 如果还是找不到，返回错误
                if (!user) {
                    logger.error('User not found after auto-register attempt', {
                        supabaseUserId,
                        email,
                        errorMessage,
                        errorCode,
                        errorDetails,
                    });
                    const errorInfo = ErrorInfos[ErrorCodes.INTERNAL_ERROR];
                    return c.json(
                        apiResponse.error('用户注册失败，请稍后重试', errorInfo.code, { 
                            error: errorMessage,
                            code: errorCode,
                            details: errorDetails,
                        }),
                        errorInfo.status
                    );
                }
            }
        }

        // 生成我们自己的 JWT token（因为认证中间件期望的是我们自己的 JWT）
        const jwtToken = await generateToken({
            sub: user.id,
            email: user.email,
            role: undefined,
        });

        return c.json(
            apiResponse.success({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
                token: jwtToken,
            } as LoginResponse, '登录成功'),
            200
        );
    }
}

/**
 * 密码登录
 * 
 * @route POST /api/auth/login/password
 * @param {Context} c - Hono 上下文对象
 * @body {PasswordLoginInput} body - 请求体，包含邮箱和密码
 * @returns {Promise<Response>} JSON 响应，成功时返回用户信息和会话 token
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
    
    if(error) {
        const errorInfo = ErrorInfos[ErrorCodes.AUTH_INVALID_CREDENTIALS];
        return c.json(
            apiResponse.error(errorInfo.message, errorInfo.code, error),
            errorInfo.status
        )
    }else {
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

        return c.json(
            apiResponse.success({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
                token: jwtToken,
            } as LoginResponse, '登录成功'),
            200
        );
    }
}

/**
 * 退出登录
 * 
 * @route POST /api/auth/logout
 * @param {Context} c - Hono 上下文对象
 * @returns {Response} JSON 响应，返回退出登录成功消息
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
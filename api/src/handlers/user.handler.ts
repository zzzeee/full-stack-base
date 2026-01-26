/**
 * @file user.handler.ts
 * @description 用户请求处理器，通过 Service 层处理业务逻辑
 * @author System
 * @createDate 2026-01-25
 */

import type { Context } from '@hono/hono';
import { userService } from '@/services/user.service.ts';
import { logger } from '@/lib/logger.ts';
import { apiResponse } from '@/lib/api-response.ts';
import type { 
    SuccessResponse as _SuccessResponse, 
    ErrorResponse as _ErrorResponse,
} from '@/lib/api-response.ts';
import type { UserProfile as _UserProfile } from '@/types/user.types.ts';
import {
    ChangePasswordInput,
    UpdateAvatarInput,
    UpdateProfileInput,
    SendEmailVerificationCodeInput,
    ChangeEmailInput,
} from '@schemas/user.schema.ts';

/**
 * 获取当前用户资料
 * 
 * @route GET /api/users/me
 * @param {Context} c - Hono 上下文对象
 * @returns {Promise<Response<_SuccessResponse<_UserProfile> | _ErrorResponse>>} JSON 响应
 * 
 * @description 从认证中间件获取 userId，返回当前登录用户的资料
 */
export async function getCurrentUser(c: Context) {
    const userId = c.get('userId');

    const profile = await userService.getUserProfile(userId);

    return c.json(apiResponse.success(profile), 200);
}

/**
 * 更新用户资料
 * 
 * @route PUT /api/users/me
 * @param {Context<{RequestBody: UpdateProfileInput}>} c - Hono 上下文对象
 * @returns {Promise<Response<_SuccessResponse<_UserProfile> | _ErrorResponse>>} JSON 响应
 */
export async function updateProfile(c: Context) {
    const userId = c.get('userId');
    const body: UpdateProfileInput = await c.req.json();

    const profile = await userService.updateUserProfile(userId, body);

    logger.info('User profile updated via handler', { userId });

    return c.json(apiResponse.success(profile, '资料更新成功'), 200);
}

/**
 * 更新头像
 * 
 * @route PUT /api/users/me/avatar
 * @param {Context<{RequestBody: UpdateAvatarInput}>} c - Hono 上下文对象
 * @returns {Promise<Response<_SuccessResponse<{ avatar_url: string }> | _ErrorResponse>>} JSON 响应
 */
export async function updateAvatar(c: Context) {
    const userId = c.get('userId');
    const body: UpdateAvatarInput = await c.req.json();

    const avatarUrl = await userService.updateUserAvatar(userId, body.avatar_url);

    logger.info('User avatar updated via handler', { userId });

    return c.json(
        apiResponse.success({ avatar_url: avatarUrl }, '头像更新成功'),
        200
    );
}

/**
 * 修改密码
 * 
 * @route PUT /api/users/me/password
 * @param {Context<{RequestBody: ChangePasswordInput}>} c - Hono 上下文对象
 * @returns {Promise<Response<_SuccessResponse<null> | _ErrorResponse>>} JSON 响应
 */
export async function changePassword(c: Context) {
    const userId = c.get('userId');
    const body: ChangePasswordInput = await c.req.json();

    await userService.changeUserPassword(userId, body);

    logger.info('User password changed via handler', { userId });

    return c.json(apiResponse.success(null, '密码修改成功'), 200);
}

/**
 * 获取用户公开资料（通过用户 ID）
 * 
 * @route GET /api/users/:id
 * @param {Context} c - Hono 上下文对象
 * @param {string} id - 用户 ID（从路由参数获取）
 * @returns {Promise<Response<_SuccessResponse<Partial<_UserProfile>> | _ErrorResponse>>} JSON 响应
 */
export async function getUserById(c: Context) {
    const userId = c.req.param('id');

    const publicProfile = await userService.getUserPublicProfile(userId);

    return c.json(apiResponse.success(publicProfile), 200);
}

/**
 * 发送邮箱验证码（用于更换邮箱）
 * 
 * @route POST /api/users/me/email/send-code
 * @param {Context<{RequestBody: SendEmailVerificationCodeInput}>} c - Hono 上下文对象
 * @returns {Promise<Response<_SuccessResponse<null> | _ErrorResponse>>} JSON 响应
 */
export async function sendEmailVerificationCode(c: Context) {
    const userId = c.get('userId');
    const body: SendEmailVerificationCodeInput = await c.req.json();

    await userService.sendEmailVerificationCode(userId, body.new_email);

    logger.info('Email verification code sent via handler', { userId });

    return c.json(
        apiResponse.success(null, '验证码已发送到新邮箱'),
        200
    );
}

/**
 * 确认更换邮箱
 * 
 * @route PUT /api/users/me/email
 * @param {Context<{RequestBody: ChangeEmailInput}>} c - Hono 上下文对象
 * @returns {Promise<Response<_SuccessResponse<{ email: string; email_verified: boolean }> | _ErrorResponse>>} JSON 响应
 */
export async function changeEmail(c: Context) {
    const userId = c.get('userId');
    const body: ChangeEmailInput = await c.req.json();

    const profile = await userService.changeEmail(userId, body.new_email, body.code);

    logger.info('User email changed via handler', { userId });

    return c.json(
        apiResponse.success(
            {
                email: profile.email,
                email_verified: profile.email_verified,
            },
            '邮箱更换成功，请验证新邮箱'
        ),
        200
    );
}

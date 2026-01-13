// src/handlers/user.handler.ts
/**
 * 用户请求处理器
 * 处理用户相关的 HTTP 请求
 */

import type { Context } from '@hono/hono';
import { userRepository } from '@/repositories/user.repository.ts';
import { hashPassword, verifyPassword } from '@/lib/password.ts';
import { logger } from '@/lib/logger.ts';
import { apiResponse } from '@/lib/api-response.ts';
import { AppError } from '@/lib/errors/app-error.ts';
import { ErrorCodes } from '@/lib/errors/error-codes.ts';
import type { UserProfile } from '@/types/user.types.ts';

/**
 * 获取当前用户资料
 * GET /api/users/me
 * 
 * @returns { success: true, data: UserProfile }
 */
export async function getCurrentUser(c: Context) {
    const userId = c.get('userId'); // 从认证中间件注入

    const user = await userRepository.findById(userId);

    if (!user) {
        throw new AppError(ErrorCodes.USER_NOT_FOUND, '用户不存在');
    }

    // 移除敏感字段
    const profile: UserProfile = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        phone: user.phone,
        status: user.status,
        email_verified: user.email_verified,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login_at: user.last_login_at,
    };

    return c.json(apiResponse.success(profile), 200);
}

/**
 * 更新用户资料
 * PUT /api/users/me
 * 
 * @body { name?: string, bio?: string, phone?: string }
 * @returns { success: true, data: UserProfile }
 */
export async function updateProfile(c: Context) {
    const userId = c.get('userId');
    const body = c.req.valid('json');

    // 过滤出有效的更新字段
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.bio !== undefined) updates.bio = body.bio;
    if (body.phone !== undefined) updates.phone = body.phone || null; // 空字符串转为 null

    // 如果没有任何更新字段，返回错误
    if (Object.keys(updates).length === 0) {
        throw new AppError(
            ErrorCodes.VALIDATION_ERROR,
            '至少需要提供一个更新字段'
        );
    }

    const user = await userRepository.updateById(userId, updates);

    logger.info('User profile updated', {
        userId,
        fields: Object.keys(updates),
    });

    // 返回更新后的资料（不包含敏感字段）
    const profile: UserProfile = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        phone: user.phone,
        status: user.status,
        email_verified: user.email_verified,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login_at: user.last_login_at,
    };

    return c.json(apiResponse.success(profile, '资料更新成功'), 200);
}

/**
 * 更新头像
 * PUT /api/users/me/avatar
 * 
 * @body { avatar_url: string }
 * @returns { success: true, data: { avatar_url: string } }
 */
export async function updateAvatar(c: Context) {
    const userId = c.get('userId');
    const body = c.req.valid('json');

    const user = await userRepository.updateById(userId, {
        avatar_url: body.avatar_url,
    });

    logger.info('User avatar updated', { userId });

    return c.json(
        apiResponse.success(
            { avatar_url: user.avatar_url },
            '头像更新成功'
        ),
        200
    );
}

/**
 * 修改密码
 * PUT /api/users/me/password
 * 
 * @body { old_password: string, new_password: string }
 * @returns { success: true, message: string }
 */
export async function changePassword(c: Context) {
    const userId = c.get('userId');
    const body = c.req.valid('json');

    // 1. 查找用户
    const user = await userRepository.findById(userId);

    if (!user) {
        throw new AppError(ErrorCodes.USER_NOT_FOUND, '用户不存在');
    }

    // 2. 检查是否已设置密码
    if (!user.password_hash) {
        throw new AppError(
            ErrorCodes.AUTH_PASSWORD_NOT_SET,
            '该账号未设置密码，无法修改'
        );
    }

    // 3. 验证旧密码
    const isValidOldPassword = await verifyPassword(
        body.old_password,
        user.password_hash
    );

    if (!isValidOldPassword) {
        throw new AppError(
            ErrorCodes.AUTH_INVALID_OLD_PASSWORD,
            '旧密码错误'
        );
    }

    // 4. 加密新密码
    const newPasswordHash = await hashPassword(body.new_password);

    // 5. 更新密码
    await userRepository.updateById(userId, {
        password_hash: newPasswordHash,
    });

    logger.info('User password changed', { userId });

    return c.json(apiResponse.success(null, '密码修改成功'), 200);
}

/**
 * 获取用户公开资料（通过用户 ID）
 * GET /api/users/:id
 * 
 * @param id - 用户 ID
 * @returns { success: true, data: Partial<UserProfile> }
 */
export async function getUserById(c: Context) {
    const userId = c.req.param('id');

    const user = await userRepository.findById(userId);

    if (!user) {
        throw new AppError(ErrorCodes.USER_NOT_FOUND, '用户不存在');
    }

    // 只返回公开字段
    const publicProfile = {
        id: user.id,
        name: user.name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        created_at: user.created_at,
    };

    return c.json(apiResponse.success(publicProfile), 200);
}
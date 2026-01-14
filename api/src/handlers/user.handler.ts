// src/handlers/user.handler.ts
/**
 * 用户请求处理器（重构版）
 * 通过 Service 层处理业务逻辑
 */

import type { Context } from '@hono/hono';
import { userService } from '@/services/user.service.ts';
import { logger } from '@/lib/logger.ts';
import { apiResponse } from '@/lib/errors/api-response.ts';
import { ChangePasswordInput, UpdateAvatarInput, UpdateProfileInput } from '@schemas/user.schema.ts';

/**
 * 获取当前用户资料
 * GET /api/users/me
 * 
 * @returns { success: true, data: UserProfile }
 */
export async function getCurrentUser(c: Context) {
    const userId = c.get('userId');

    const profile = await userService.getUserProfile(userId);

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
    const body: UpdateProfileInput = await c.req.json();

    const profile = await userService.updateUserProfile(userId, body);

    logger.info('User profile updated via handler', { userId });

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
 * PUT /api/users/me/password
 * 
 * @body { old_password: string, new_password: string }
 * @returns { success: true, message: string }
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
 * GET /api/users/:id
 * 
 * @param id - 用户 ID
 * @returns { success: true, data: Partial<UserProfile> }
 */
export async function getUserById(c: Context) {
    const userId = c.req.param('id');

    const publicProfile = await userService.getUserPublicProfile(userId);

    return c.json(apiResponse.success(publicProfile), 200);
}

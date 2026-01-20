// src/services/user.service.ts
/**
 * 用户业务逻辑层
 * 处理用户相关的核心业务逻辑
 */

import { userRepository } from '@/repositories/user.repository.ts';
import { hashPassword, verifyPassword } from '@/lib/password.ts';
import { logger } from '@/lib/logger.ts';
import { AppError } from '@/lib/errors/app-error.ts';
import { ErrorInfos, ErrorCodes } from '@/lib/errors/error-codes.ts';
import type { UserProfile, UserUpdateData, ChangePasswordData } from '@/types/user.types.ts';

/**
 * 用户服务类
 */
export class UserService {
    /**
     * 获取用户资料
     * @param userId - 用户 ID
     * @returns Promise<UserProfile> - 用户资料
     */
    async getUserProfile(userId: string): Promise<UserProfile> {
        logger.debug('Getting user profile', { userId });

        const user = await userRepository.findById(userId);

        if (!user) {
            const error = ErrorInfos[ErrorCodes.USER_NOT_FOUND];
            throw new AppError(error.code, error.message);
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

        return profile;
    }

    /**
     * 更新用户资料
     * @param userId - 用户 ID
     * @param data - 更新数据
     * @returns Promise<UserProfile> - 更新后的用户资料
     */
    async updateUserProfile(
        userId: string,
        data: UserUpdateData
    ): Promise<UserProfile> {
        logger.info('Updating user profile', {
            userId,
            fields: Object.keys(data),
        });

        // 1. 检查用户是否存在
        const existingUser = await userRepository.findById(userId);
        if (!existingUser) {
            const error = ErrorInfos[ErrorCodes.USER_NOT_FOUND];
            throw new AppError(error.code, error.message);
        }

        // 2. 过滤出有效的更新字段
        const updates: Record<string, unknown> = {};
        if (data.name !== undefined) updates.name = data.name;
        if (data.bio !== undefined) updates.bio = data.bio;
        if (data.phone !== undefined) updates.phone = data.phone || null;

        // 3. 如果没有任何更新字段，返回错误
        if (Object.keys(updates).length === 0) {
            const error = ErrorInfos[ErrorCodes.VALIDATION_ERROR];
            throw new AppError(error.code, error.message);
        }

        // 4. 更新用户资料
        const updatedUser = await userRepository.updateById(userId, updates);

        logger.info('User profile updated successfully', { userId });

        // 5. 返回更新后的资料
        return {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            avatar_url: updatedUser.avatar_url,
            bio: updatedUser.bio,
            phone: updatedUser.phone,
            status: updatedUser.status,
            email_verified: updatedUser.email_verified,
            created_at: updatedUser.created_at,
            updated_at: updatedUser.updated_at,
            last_login_at: updatedUser.last_login_at,
        };
    }

    /**
     * 更新用户头像
     * @param userId - 用户 ID
     * @param avatarUrl - 头像 URL
     * @returns Promise<string> - 新的头像 URL
     */
    async updateUserAvatar(userId: string, avatarUrl: string): Promise<string> {
        logger.info('Updating user avatar', { userId });

        // 1. 检查用户是否存在
        const existingUser = await userRepository.findById(userId);
        if (!existingUser) {
            const error = ErrorInfos[ErrorCodes.USER_NOT_FOUND];
            throw new AppError(error.code, error.message);
        }

        // 2. 更新头像
        const updatedUser = await userRepository.updateById(userId, {
            avatar_url: avatarUrl,
        });

        logger.info('User avatar updated successfully', { userId });

        return updatedUser.avatar_url || '';
    }

    /**
     * 修改用户密码
     * @param userId - 用户 ID
     * @param data - 修改密码数据
     * @returns Promise<void>
     */
    async changeUserPassword(
        userId: string,
        data: ChangePasswordData
    ): Promise<void> {
        logger.info('Changing user password', { userId });

        // 1. 查找用户
        const user = await userRepository.findById(userId);
        if (!user) {
            const error = ErrorInfos[ErrorCodes.USER_NOT_FOUND];
            throw new AppError(error.code, error.message);
        }

        // 2. 检查是否已设置密码
        if (!user.password_hash) {
            const error = ErrorInfos[ErrorCodes.AUTH_PASSWORD_NOT_SET];
            throw new AppError(error.code, error.message);
        }

        // 3. 验证旧密码
        const isValidOldPassword = await verifyPassword(
            data.old_password,
            user.password_hash
        );

        if (!isValidOldPassword) {
            const error = ErrorInfos[ErrorCodes.AUTH_INVALID_OLD_PASSWORD];
            throw new AppError(error.code, error.message);
        }

        // 4. 检查新旧密码是否相同
        if (data.old_password === data.new_password) {
            const error = ErrorInfos[ErrorCodes.VALIDATION_ERROR];
            throw new AppError(error.code, error.message);
        }

        // 5. 加密新密码
        const newPasswordHash = await hashPassword(data.new_password);

        // 6. 更新密码
        await userRepository.updateById(userId, {
            password_hash: newPasswordHash,
        });

        logger.info('User password changed successfully', { userId });
    }

    /**
     * 获取用户公开资料
     * @param userId - 用户 ID
     * @returns Promise<Partial<UserProfile>> - 用户公开资料
     */
    async getUserPublicProfile(userId: string): Promise<Partial<UserProfile>> {
        logger.debug('Getting user public profile', { userId });

        const user = await userRepository.findById(userId);

        if (!user) {
            const error = ErrorInfos[ErrorCodes.USER_NOT_FOUND];
            throw new AppError(error.code, error.message);
        }

        // 只返回公开字段
        return {
            id: user.id,
            name: user.name,
            avatar_url: user.avatar_url,
            bio: user.bio,
            created_at: user.created_at,
        };
    }
}

/**
 * 导出单例
 */
export const userService = new UserService();
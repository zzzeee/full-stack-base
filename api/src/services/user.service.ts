/**
 * @file user.service.ts
 * @description 用户业务逻辑层，处理用户相关的核心业务逻辑
 * @author System
 * @createDate 2026-01-25
 */

import { userRepository } from '@/repositories/user.repository.ts';
import { authRepository } from '@/repositories/auth.repository.ts';
import { hashPassword, verifyPassword } from '@/lib/password.ts';
import { logger } from '@/lib/logger.ts';
import { AppError } from '@/lib/errors/app-error.ts';
import { ErrorInfos, ErrorCodes } from '@/lib/errors/error-codes.ts';
import { sendVerificationCodeEmail } from '@/lib/email.ts';
import { VerificationPurpose } from '@/types/auth.types.ts';
import type { UserProfile, UserUpdateData, ChangePasswordData } from '@/types/user.types.ts';

/**
 * 用户服务类
 * 
 * @class
 * @description 提供用户相关的业务逻辑方法，包括资料查询、更新、密码修改等
 */
export class UserService {
    /**
     * 获取用户资料
     * 
     * @param {string} userId - 用户 ID
     * @returns {Promise<UserProfile>} 用户资料（不包含敏感信息）
     * @throws {AppError} 当用户不存在时抛出错误
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
     * 
     * @param {string} userId - 用户 ID
     * @param {UserUpdateData} data - 更新数据
     * @returns {Promise<UserProfile>} 更新后的用户资料
     * @throws {AppError} 当用户不存在或没有有效更新字段时抛出错误
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
     * 
     * @param {string} userId - 用户 ID
     * @param {string} avatarUrl - 头像 URL
     * @returns {Promise<string>} 新的头像 URL
     * @throws {AppError} 当用户不存在时抛出错误
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
     * 
     * @param {string} userId - 用户 ID
     * @param {ChangePasswordData} data - 修改密码数据（包含旧密码和新密码）
     * @returns {Promise<void>}
     * @throws {AppError} 当用户不存在、密码未设置、旧密码错误或新旧密码相同时抛出错误
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
     * 
     * @param {string} userId - 用户 ID
     * @returns {Promise<Partial<UserProfile>>} 用户公开资料（仅包含公开字段）
     * @throws {AppError} 当用户不存在时抛出错误
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

    /**
     * 发送邮箱验证码（用于更换邮箱）
     * 
     * @param {string} userId - 用户 ID
     * @param {string} newEmail - 新邮箱地址
     * @returns {Promise<void>}
     * @throws {AppError} 当用户不存在、新邮箱已被使用、新邮箱与当前邮箱相同或发送过于频繁时抛出错误
     */
    async sendEmailVerificationCode(userId: string, newEmail: string): Promise<void> {
        logger.info('Sending email verification code for email change', {
            userId,
            newEmail,
        });

        // 1. 检查用户是否存在
        const user = await userRepository.findById(userId);
        if (!user) {
            const error = ErrorInfos[ErrorCodes.USER_NOT_FOUND];
            throw new AppError(error.code, error.message);
        }

        // 2. 检查新邮箱是否与当前邮箱相同
        if (user.email === newEmail) {
            const error = ErrorInfos[ErrorCodes.VALIDATION_ERROR];
            throw new AppError(error.code, '新邮箱不能与当前邮箱相同');
        }

        // 3. 检查新邮箱是否已被其他用户使用
        const emailExists = await userRepository.emailExists(newEmail);
        if (emailExists) {
            const error = ErrorInfos[ErrorCodes.USER_EMAIL_ALREADY_EXISTS];
            throw new AppError(error.code, error.message);
        }

        // 4. 检查发送频率（60秒内只能发送一次）
        const lastVerification = await authRepository.getLastVerification(
            newEmail,
            VerificationPurpose.CHANGE_EMAIL
        );

        if (lastVerification) {
            const lastSentTime = new Date(lastVerification.created_at || '').getTime();
            const now = Date.now();
            const timeDiff = now - lastSentTime;

            // 60秒 = 60000毫秒
            if (timeDiff < 60000) {
                const error = ErrorInfos[ErrorCodes.VERIFICATION_CODE_TOO_FREQUENT];
                throw new AppError(error.code, error.message);
            }
        }

        // 5. 生成6位数字验证码
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // 6. 计算过期时间（10分钟后）
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        // 7. 保存验证码到数据库
        await authRepository.createVerificationCode({
            email: newEmail,
            code,
            purpose: VerificationPurpose.CHANGE_EMAIL,
            expires_at: expiresAt,
            user_id: userId,
            is_used: false,
            attempts: 0,
        });

        // 8. 发送验证码邮件
        const emailSent = await sendVerificationCodeEmail(
            newEmail,
            code,
            VerificationPurpose.CHANGE_EMAIL
        );

        if (!emailSent) {
            const error = ErrorInfos[ErrorCodes.EMAIL_SEND_FAILED];
            throw new AppError(error.code, error.message);
        }

        logger.info('Email verification code sent successfully', { userId, newEmail });
    }

    /**
     * 确认更换邮箱
     * 
     * @param {string} userId - 用户 ID
     * @param {string} newEmail - 新邮箱地址
     * @param {string} code - 验证码
     * @returns {Promise<UserProfile>} 更新后的用户资料
     * @throws {AppError} 当用户不存在、验证码错误或过期、新邮箱已被使用时抛出错误
     */
    async changeEmail(
        userId: string,
        newEmail: string,
        code: string
    ): Promise<UserProfile> {
        logger.info('Changing user email', { userId, newEmail });

        // 1. 检查用户是否存在
        const user = await userRepository.findById(userId);
        if (!user) {
            const error = ErrorInfos[ErrorCodes.USER_NOT_FOUND];
            throw new AppError(error.code, error.message);
        }

        // 2. 检查新邮箱是否与当前邮箱相同
        if (user.email === newEmail) {
            const error = ErrorInfos[ErrorCodes.VALIDATION_ERROR];
            throw new AppError(error.code, '新邮箱不能与当前邮箱相同');
        }

        // 3. 检查新邮箱是否已被其他用户使用
        const emailExists = await userRepository.emailExists(newEmail);
        if (emailExists) {
            const error = ErrorInfos[ErrorCodes.USER_EMAIL_ALREADY_EXISTS];
            throw new AppError(error.code, error.message);
        }

        // 4. 验证验证码
        const verificationCode = await authRepository.findValidVerificationCode(
            newEmail,
            code,
            VerificationPurpose.CHANGE_EMAIL
        );

        if (!verificationCode) {
            // 尝试增加验证码尝试次数（如果验证码存在但已过期或已使用）
            const lastCode = await authRepository.getLastVerification(
                newEmail,
                VerificationPurpose.CHANGE_EMAIL
            );
            if (lastCode && !lastCode.is_used) {
                await authRepository.incrementVerificationAttempts(lastCode.id);
            }

            const error = ErrorInfos[ErrorCodes.VERIFICATION_CODE_INVALID];
            throw new AppError(error.code, error.message);
        }

        // 5. 检查验证码是否属于当前用户
        if (verificationCode.user_id !== userId) {
            const error = ErrorInfos[ErrorCodes.VERIFICATION_CODE_INVALID];
            throw new AppError(error.code, '验证码无效');
        }

        // 6. 标记验证码为已使用
        await authRepository.markVerificationCodeAsUsed(verificationCode.id);

        // 7. 更新用户邮箱，并将 email_verified 设置为 false（需要重新验证）
        const updatedUser = await userRepository.updateById(userId, {
            email: newEmail,
            email_verified: false,
        });

        logger.info('User email changed successfully', { userId, newEmail });

        // 8. 返回更新后的用户资料
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
}

/**
 * 用户服务单例
 * 
 * @constant
 * @description 全局可用的用户服务实例
 */
export const userService = new UserService();
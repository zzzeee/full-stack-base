/**
 * @file profile.service.ts
 * @description 个人中心服务，处理用户资料相关的API调用
 * @author System
 * @createDate 2026-01-25
 */

import { apiClient } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import type {
    UserProfile,
    UpdateProfileData,
    UpdateAvatarData,
    ChangePasswordData,
    SendEmailCodeData,
    ChangeEmailData,
} from '../types/profile.types'

/**
 * 个人中心服务类
 * 处理用户资料相关的API调用
 */
class ProfileService {
    /**
     * 获取当前用户资料
     * 
     * @returns 用户资料
     * @throws {ApiClientError} 当请求失败时抛出错误
     */
    async getProfile(): Promise<UserProfile> {
        const response = await apiClient.get<UserProfile>(ENDPOINTS.users.me())

        if (!response.success) {
            throw new Error(response.error?.message || '获取用户资料失败')
        }

        return response.data
    }

    /**
     * 更新用户资料
     * 
     * @param data - 更新数据
     * @returns 更新后的用户资料
     * @throws {ApiClientError} 当请求失败时抛出错误
     */
    async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
        const response = await apiClient.put<UserProfile>(
            ENDPOINTS.users.updateMe(),
            data
        )

        if (!response.success) {
            throw new Error(response.error?.message || '更新资料失败')
        }

        return response.data
    }

    /**
     * 更新用户头像
     * 
     * @param data - 头像数据
     * @returns 更新后的头像URL
     * @throws {ApiClientError} 当请求失败时抛出错误
     */
    async updateAvatar(data: UpdateAvatarData): Promise<string> {
        const response = await apiClient.put<{ avatar_url: string }>(
            ENDPOINTS.users.updateMyAvatar(),
            data
        )

        if (!response.success) {
            throw new Error(response.error?.message || '更新头像失败')
        }

        return response.data.avatar_url
    }

    /**
     * 修改密码
     * 
     * @param data - 密码数据
     * @throws {ApiClientError} 当请求失败时抛出错误
     */
    async changePassword(data: ChangePasswordData): Promise<void> {
        const response = await apiClient.put<void>(
            ENDPOINTS.users.changeMyPassword(),
            data
        )

        if (!response.success) {
            throw new Error(response.error?.message || '修改密码失败')
        }
    }

    /**
     * 发送邮箱验证码（用于更换邮箱）
     * 
     * @param data - 邮箱数据
     * @throws {ApiClientError} 当请求失败时抛出错误
     */
    async sendEmailCode(data: SendEmailCodeData): Promise<void> {
        const response = await apiClient.post<void>(
            ENDPOINTS.users.sendEmailCode(),
            data
        )

        if (!response.success) {
            throw new Error(response.error?.message || '发送验证码失败')
        }
    }

    /**
     * 更换邮箱
     * 
     * @param data - 邮箱和验证码数据
     * @returns 更新后的邮箱信息
     * @throws {ApiClientError} 当请求失败时抛出错误
     */
    async changeEmail(data: ChangeEmailData): Promise<{ email: string; email_verified: boolean }> {
        const response = await apiClient.put<{ email: string; email_verified: boolean }>(
            ENDPOINTS.users.changeEmail(),
            data
        )

        if (!response.success) {
            throw new Error(response.error?.message || '更换邮箱失败')
        }

        return response.data
    }
}

export const profileService = new ProfileService()

/**
 * @file profile.service.ts
 * @description 个人中心服务，处理用户资料相关的API调用
 */

import { apiClient } from '[@BASE]/lib/api/client'
import { ENDPOINTS } from '[@BASE]/lib/api/endpoints'
import type {
    UserProfile,
    UpdateProfileData,
    UpdateAvatarData,
    ChangePasswordData,
    ChangeEmailData,
} from '[@BASE]/features/profile/types/profile.types'

/** 合并同一时刻对 /users/me 的重复调用（Strict Mode 双调用、effect 重跑等） */
let inflightMe: Promise<UserProfile> | null = null

class ProfileService {
    async getProfile(): Promise<UserProfile> {
        if (!inflightMe) {
            inflightMe = (async () => {
                const response = await apiClient.get<UserProfile>(ENDPOINTS.users.me())

                if (!response.success) {
                    throw new Error(response.error?.message || '获取用户资料失败')
                }

                return response.data
            })().finally(() => {
                inflightMe = null
            })
        }
        return inflightMe
    }

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

    async changePassword(data: ChangePasswordData): Promise<void> {
        const response = await apiClient.put<void>(
            ENDPOINTS.users.changeMyPassword(),
            data
        )

        if (!response.success) {
            throw new Error(response.error?.message || '修改密码失败')
        }
    }

    async changeEmail(
        data: ChangeEmailData
    ): Promise<{ email: string; email_verified: boolean }> {
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

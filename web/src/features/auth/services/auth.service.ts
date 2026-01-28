import { apiClient } from '[@BASE]/lib/api/client'
import type {
    LoginWithPasswordPayload,
    LoginWithCodePayload,
    AuthResponse
} from '../types/auth.types'

/**
 * 认证服务类
 * 处理用户登录、注册、验证码等认证相关操作
 */
class AuthService {
    /**
     * 使用密码登录
     * 
     * @param payload - 登录信息（邮箱和密码）
     * @returns 用户信息和 Token
     * @throws {ApiClientError} 当登录失败时抛出错误
     */
    async loginWithPassword(
        payload: LoginWithPasswordPayload
    ): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>(
            '/auth/login/password',
            payload
        )

        if (!response.success) {
            throw new Error(response.error.message)
        }

        return response.data
    }

    /**
     * 使用验证码登录
     * 
     * @param payload - 登录信息（邮箱和验证码）
     * @returns 用户信息和 Token
     * @throws {ApiClientError} 当登录失败时抛出错误
     */
    async loginWithCode(
        payload: LoginWithCodePayload
    ): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>(
            '/auth/login/code',
            payload
        )

        if (!response.success) {
            throw new Error(response.error.message)
        }

        return response.data
    }

    /**
     * 发送邮箱验证码
     * 
     * @param email - 邮箱地址
     * @throws {ApiClientError} 当发送失败时抛出错误
     */
    async sendVerificationCode(email: string): Promise<void> {
        const response = await apiClient.post<void>(
            '/auth/send-code',
            { email }
        )

        if (!response.success) {
            throw new Error(response.error.message)
        }
    }
}

export const authService = new AuthService()
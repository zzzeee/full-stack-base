import { env } from '@/lib/constants/env'
import type { ApiResponse, RequestConfig } from './types'

/**
 * API 客户端错误类
 * 用于统一处理 API 请求错误
 * 
 * @example
 * ```typescript
 * try {
 *   await apiClient.get('/users')
 * } catch (error) {
 *   if (error instanceof ApiClientError) {
 *     console.log(error.code)     // 错误码
 *     console.log(error.message)  // 错误信息
 *     console.log(error.status)   // HTTP 状态码
 *   }
 * }
 * ```
 */
export class ApiClientError extends Error {
    constructor(
        message: string,
        public code: string,
        public status?: number,
        public details?: unknown
    ) {
        super(message)
        this.name = 'ApiClientError'
    }
}

/**
 * API 客户端类
 * 封装了所有 HTTP 请求方法，支持：
 * - 自动添加认证 Token
 * - 请求超时控制
 * - 失败自动重试
 * - 统一错误处理
 * - 文件上传
 */
class ApiClient {
    /** API 基础 URL */
    private baseURL: string

    /** 默认请求超时时间（毫秒） */
    private defaultTimeout: number = 30000

    /** 默认请求头 */
    private defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
    }

    constructor(baseURL: string) {
        this.baseURL = baseURL
    }

    /**
     * 获取认证 Token
     * 从 localStorage 中读取 Zustand 持久化的认证信息
     * 
     * @returns Token 字符串或 null
     * @private
     */
    private getAuthToken(): string | null {
        // 服务端渲染时不访问 localStorage
        if (typeof window === 'undefined') return null

        try {
            const authStorage = localStorage.getItem('auth-storage')
            if (authStorage) {
                const { state } = JSON.parse(authStorage)
                return state?.token || null
            }
        } catch (error) {
            console.error('Failed to get auth token:', error)
        }
        return null
    }

    /**
     * 构建完整的请求 URL
     * 
     * @param endpoint - API 端点，如 '/users' 或完整 URL
     * @returns 完整的 URL 字符串
     * @private
     * 
     * @example
     * buildURL('/users') // => 'http://localhost:3000/api/users'
     * buildURL('https://api.example.com/users') // => 'https://api.example.com/users'
     */
    private buildURL(endpoint: string): string {
        // 如果是完整 URL，直接返回
        if (endpoint.startsWith('http')) {
            return endpoint
        }

        // 拼接 baseURL 和 endpoint
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
        return `${this.baseURL}${path}`
    }

    /**
     * 构建请求头
     * 合并默认请求头、自定义请求头和认证 Token
     * 
     * @param customHeaders - 自定义请求头
     * @returns 完整的请求头对象
     * @private
     */
    private buildHeaders(customHeaders?: HeadersInit): Record<string, string> {
        const headers: Record<string, string> = {
            ...this.defaultHeaders,
        }

        // 合并自定义请求头
        if (customHeaders) {
            Object.assign(headers, customHeaders)
        }

        // 添加认证 Token
        const token = this.getAuthToken()
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        return headers
    }

    /**
     * 处理响应数据
     * 自动解析 JSON 并检查 ApiResponse 格式
     * 
     * @param response - Fetch Response 对象
     * @returns 解析后的数据
     * @throws {ApiClientError} 当请求失败时抛出错误
     * @private
     */
    private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
        const contentType = response.headers.get('content-type')
        const isJSON = contentType?.includes('application/json')

        let data: any

        // 解析响应体
        if (isJSON) {
            data = await response.json()
        } else {
            data = await response.text()
        }

        // 检查是否是标准的 ApiResponse 格式
        if (data && typeof data === 'object' && 'success' in data) {
            // 失败响应，抛出错误
            if (data.success === false) {
                throw new ApiClientError(
                    data.error?.message || 'Request failed',
                    data.error?.code || 'UNKNOWN_ERROR',
                    response.status,
                    data.error?.details
                )
            }
            // 成功响应
            return data as ApiResponse<T>
        }

        // 非标准格式，检查 HTTP 状态码
        if (!response.ok) {
            throw new ApiClientError(
                data?.message || response.statusText || 'Request failed',
                data?.code || `HTTP_${response.status}`,
                response.status,
                data
            )
        }

        // 兼容非标准响应格式，包装成 ApiResponse
        return {
            success: true,
            data: data as T,
        }
    }

    /**
     * 执行请求（带超时和重试机制）
     * 
     * @param url - 请求 URL
     * @param config - 请求配置
     * @returns Promise<ApiResponse<T>>
     * @throws {ApiClientError} 当所有重试都失败时抛出错误
     * @private
     * 
     * @example
     * // 带重试的请求
     * executeRequest(url, { retry: 3, retryDelay: 2000 })
     */
    private async executeRequest<T>(
        url: string,
        config: RequestConfig
    ): Promise<ApiResponse<T>> {
        const {
            timeout = this.defaultTimeout,
            retry = 0,
            retryDelay = 1000,
            ...fetchConfig
        } = config

        let lastError: Error | null = null

        // 重试逻辑
        for (let attempt = 0; attempt <= retry; attempt++) {
            try {
                // 创建 AbortController 用于超时控制
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), timeout)

                const response = await fetch(url, {
                    ...fetchConfig,
                    signal: controller.signal,
                })

                clearTimeout(timeoutId)
                return await this.handleResponse<T>(response)
            } catch (error) {
                lastError = error as Error

                // 如果是超时错误
                if (error instanceof Error && error.name === 'AbortError') {
                    lastError = new ApiClientError(
                        'Request timeout',
                        'TIMEOUT',
                        undefined,
                        { timeout }
                    )
                }

                // 最后一次重试也失败了
                if (attempt === retry) {
                    break
                }

                // 等待后重试
                await new Promise((resolve) => setTimeout(resolve, retryDelay))
            }
        }

        throw lastError
    }

    /**
     * 发送 GET 请求
     * 
     * @param endpoint - API 端点
     * @param config - 请求配置（可选）
     * @returns Promise<ApiResponse<T>>
     * 
     * @example
     * ```typescript
     * // 基础用法
     * const response = await apiClient.get<User[]>('/users')
     * if (response.success) {
     *   console.log(response.data)
     * }
     * 
     * // 带配置
     * const response = await apiClient.get<User[]>('/users', {
     *   timeout: 5000,
     *   retry: 3,
     * })
     * ```
     */
    async get<T>(
        endpoint: string,
        config?: RequestConfig
    ): Promise<ApiResponse<T>> {
        const url = this.buildURL(endpoint)
        const headers = this.buildHeaders(config?.headers)

        return this.executeRequest<T>(url, {
            ...config,
            method: 'GET',
            headers,
        })
    }

    /**
     * 发送 POST 请求
     * 
     * @param endpoint - API 端点
     * @param data - 请求体数据（可选）
     * @param config - 请求配置（可选）
     * @returns Promise<ApiResponse<T>>
     * 
     * @example
     * ```typescript
     * const response = await apiClient.post<User>('/users', {
     *   name: 'John',
     *   email: 'john@example.com',
     * })
     * 
     * if (response.success) {
     *   console.log('Created user:', response.data)
     * }
     * ```
     */
    async post<T, D = any>(
        endpoint: string,
        data?: D,
        config?: RequestConfig
    ): Promise<ApiResponse<T>> {
        const url = this.buildURL(endpoint)
        const headers = this.buildHeaders(config?.headers)

        return this.executeRequest<T>(url, {
            ...config,
            method: 'POST',
            headers,
            body: data ? JSON.stringify(data) : undefined,
        })
    }

    /**
     * 发送 PUT 请求（完整更新）
     * 
     * @param endpoint - API 端点
     * @param data - 请求体数据（可选）
     * @param config - 请求配置（可选）
     * @returns Promise<ApiResponse<T>>
     * 
     * @example
     * ```typescript
     * const response = await apiClient.put<User>('/users/123', {
     *   name: 'John Updated',
     *   email: 'john.new@example.com',
     * })
     * ```
     */
    async put<T, D = any>(
        endpoint: string,
        data?: D,
        config?: RequestConfig
    ): Promise<ApiResponse<T>> {
        const url = this.buildURL(endpoint)
        const headers = this.buildHeaders(config?.headers)

        return this.executeRequest<T>(url, {
            ...config,
            method: 'PUT',
            headers,
            body: data ? JSON.stringify(data) : undefined,
        })
    }

    /**
     * 发送 PATCH 请求（部分更新）
     * 
     * @param endpoint - API 端点
     * @param data - 请求体数据（可选）
     * @param config - 请求配置（可选）
     * @returns Promise<ApiResponse<T>>
     * 
     * @example
     * ```typescript
     * // 只更新 name 字段
     * const response = await apiClient.patch<User>('/users/123', {
     *   name: 'John Updated',
     * })
     * ```
     */
    async patch<T, D = any>(
        endpoint: string,
        data?: D,
        config?: RequestConfig
    ): Promise<ApiResponse<T>> {
        const url = this.buildURL(endpoint)
        const headers = this.buildHeaders(config?.headers)

        return this.executeRequest<T>(url, {
            ...config,
            method: 'PATCH',
            headers,
            body: data ? JSON.stringify(data) : undefined,
        })
    }

    /**
     * 发送 DELETE 请求
     * 
     * @param endpoint - API 端点
     * @param config - 请求配置（可选）
     * @returns Promise<ApiResponse<T>>
     * 
     * @example
     * ```typescript
     * const response = await apiClient.delete<void>('/users/123')
     * if (response.success) {
     *   console.log('User deleted')
     * }
     * ```
     */
    async delete<T>(
        endpoint: string,
        config?: RequestConfig
    ): Promise<ApiResponse<T>> {
        const url = this.buildURL(endpoint)
        const headers = this.buildHeaders(config?.headers)

        return this.executeRequest<T>(url, {
            ...config,
            method: 'DELETE',
            headers,
        })
    }

    /**
     * 上传文件
     * 
     * @param endpoint - API 端点
     * @param file - 文件对象或 FormData
     * @param config - 请求配置（可选）
     * @returns Promise<ApiResponse<T>>
     * 
     * @example
     * ```typescript
     * // 上传单个文件
     * const file = document.querySelector('input[type="file"]').files[0]
     * const response = await apiClient.upload<{ url: string }>('/upload', file)
     * 
     * // 上传多个文件或带额外数据
     * const formData = new FormData()
     * formData.append('file1', file1)
     * formData.append('file2', file2)
     * formData.append('description', 'My files')
     * const response = await apiClient.upload('/upload', formData)
     * ```
     */
    async upload<T>(
        endpoint: string,
        file: File | FormData,
        config?: RequestConfig
    ): Promise<ApiResponse<T>> {
        const url = this.buildURL(endpoint)
        const headers = this.buildHeaders(config?.headers)

        // 删除 Content-Type，让浏览器自动设置（包含 boundary）
        delete headers['Content-Type']

        const formData = file instanceof FormData ? file : new FormData()
        if (file instanceof File) {
            formData.append('file', file)
        }

        return this.executeRequest<T>(url, {
            ...config,
            method: 'POST',
            headers,
            body: formData,
        })
    }
}

/**
 * API 客户端单例
 * 使用环境变量中的 API 基础 URL
 * 
 * @example
 * ```typescript
 * import { apiClient } from '@/lib/api/client'
 * 
 * // 使用示例
 * const response = await apiClient.get<User[]>('/users')
 * ```
 */
export const apiClient = new ApiClient(env.apiUrl)
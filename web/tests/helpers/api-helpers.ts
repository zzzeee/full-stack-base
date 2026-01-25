/**
 * API 测试辅助函数
 * 提供 mock 数据和测试工具
 */

import { vi, expect } from 'vitest'
import type { ApiResponse, ApiSuccess, ApiFailure, ApiMeta } from '@/lib/api/types'

/**
 * 创建 mock Response 对象
 */
export function createMockResponse<T>(
    data: T,
    options: {
        status?: number
        statusText?: string
        headers?: Record<string, string>
        ok?: boolean
    } = {}
): Response {
    const {
        status = 200,
        statusText = 'OK',
        headers = {},
        ok = status >= 200 && status < 300,
    } = options

    const headersObj = new Headers({
        'content-type': 'application/json',
        ...headers,
    })

    return {
        ok,
        status,
        statusText,
        headers: headersObj,
        json: async () => data,
        text: async () => JSON.stringify(data),
        clone: () => createMockResponse(data, options),
    } as Response
}

/**
 * 创建成功的 API 响应
 */
export function createSuccessResponse<T>(data: T): ApiSuccess<T> {
    return {
        success: true,
        data,
    }
}

/**
 * 创建失败的 API 响应
 */
export function createErrorResponse(
    message: string,
    code: string = 'ERROR',
    details?: unknown
): ApiFailure {
    return {
        success: false,
        error: {
            message,
            code,
            details,
        },
    }
}

/**
 * 创建分页响应
 */
export function createPaginatedResponse<T>(
    data: T[],
    page: number = 1,
    limit: number = 10,
    total: number = data.length
): ApiSuccess<T[]> & { meta: ApiMeta } {
    return {
        success: true,
        data,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total,
        },
    }
}

/**
 * Mock fetch 成功响应
 */
export function mockFetchSuccess<T>(data: T, delay: number = 0) {
    return vi.fn().mockImplementation(
        () =>
            new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    resolve(createMockResponse(createSuccessResponse(data)))
                    clearTimeout(timeout)
                }, delay)
            })
    )
}

/**
 * Mock fetch 失败响应
 */
export function mockFetchError(
    message: string,
    code: string = 'ERROR',
    status: number = 400,
    delay: number = 0
) {
    return vi.fn().mockImplementation(
        () =>
            new Promise((resolve) => {
                setTimeout(() => {
                    resolve(
                        createMockResponse(createErrorResponse(message, code), {
                            status,
                            ok: false,
                        })
                    )
                }, delay)
            })
    )
}

/**
 * Mock fetch 网络错误
 */
export function mockFetchNetworkError(delay: number = 0) {
    return vi.fn().mockImplementation(
        () =>
            new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new TypeError('Failed to fetch'))
                }, delay)
            })
    )
}

/**
 * Mock localStorage 认证数据
 */
export function mockAuthStorage(token: string, refreshToken?: string) {
    const authData = {
        state: {
            token,
            refreshToken: refreshToken || 'mock-refresh-token',
            user: {
                id: '1',
                email: 'test@example.com',
                name: 'Test User',
            },
        },
        version: 0,
    }

    localStorage.setItem('auth-storage', JSON.stringify(authData))
}

/**
 * 清除认证数据
 */
export function clearAuthStorage() {
    localStorage.removeItem('auth-storage')
}

/**
 * 等待指定时间
 */
export function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Mock 用户数据
 */
export const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    avatar: 'https://example.com/avatar.jpg',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
}

/**
 * Mock 用户列表
 */
export const mockUsers = [
    mockUser,
    {
        id: '2',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        avatar: 'https://example.com/john.jpg',
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
    },
    {
        id: '3',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'user',
        avatar: 'https://example.com/jane.jpg',
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
    },
]

/**
 * 断言 fetch 被调用
 */
export function expectFetchCalled(
    url: string,
    options?: {
        method?: string
        headers?: Record<string, string>
        body?: any
    }
) {
    expect(fetch).toHaveBeenCalledWith(
        url,
        expect.objectContaining({
            method: options?.method || 'GET',
            ...(options?.headers && {
                headers: expect.objectContaining(options.headers),
            }),
            ...(options?.body && { body: options.body }),
        })
    )
}
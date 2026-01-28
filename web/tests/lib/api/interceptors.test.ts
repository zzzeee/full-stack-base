/**
 * 拦截器测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    InterceptorManager,
    createDefaultRequestInterceptors,
    createDefaultResponseInterceptors,
    createTokenRefreshInterceptor,
} from '@/lib/api/interceptors'
import {
    mockFetchSuccess,
    mockFetchError,
    createMockResponse,
    mockAuthStorage,
    clearAuthStorage,
} from '[@BASE-tests]/helpers/api-helpers'

describe('InterceptorManager', () => {
    let manager: InterceptorManager

    beforeEach(() => {
        manager = new InterceptorManager()
        vi.clearAllMocks()
    })

    describe('请求拦截器', () => {
        it('应该能添加请求拦截器', async () => {
            const interceptor = vi.fn((url, config) => ({ url, config }))
            manager.addRequestInterceptor(interceptor)

            await manager.runRequestInterceptors('/test', { method: 'GET' })

            expect(interceptor).toHaveBeenCalled()
        })

        it('应该按顺序执行多个请求拦截器', async () => {
            const order: number[] = []

            manager.addRequestInterceptor((url, config) => {
                order.push(1)
                return { url, config }
            })

            manager.addRequestInterceptor((url, config) => {
                order.push(2)
                return { url, config }
            })

            manager.addRequestInterceptor((url, config) => {
                order.push(3)
                return { url, config }
            })

            await manager.runRequestInterceptors('/test', { method: 'GET' })

            expect(order).toEqual([1, 2, 3])
        })

        it('应该能修改请求 URL 和配置', async () => {
            manager.addRequestInterceptor((url, config) => ({
                url: url + '?modified=true',
                config: {
                    ...config,
                    headers: { ...config.headers, 'X-Modified': 'true' },
                },
            }))

            const result = await manager.runRequestInterceptors('/test', {
                method: 'GET',
            })

            expect(result.url).toBe('/test?modified=true')
            expect(result.config.headers).toHaveProperty('X-Modified', 'true')
        })

        it('应该能移除请求拦截器', async () => {
            const interceptor = vi.fn((url, config) => ({ url, config }))
            const index = manager.addRequestInterceptor(interceptor)

            manager.removeRequestInterceptor(index)

            await manager.runRequestInterceptors('/test', { method: 'GET' })

            expect(interceptor).not.toHaveBeenCalled()
        })
    })

    describe('响应拦截器', () => {
        it('应该能添加响应拦截器', async () => {
            const response = createMockResponse({ success: true })
            const interceptor = vi.fn((res) => res)
            manager.addResponseInterceptor(interceptor)

            await manager.runResponseInterceptors(response)

            expect(interceptor).toHaveBeenCalledWith(response)
        })

        it('应该按顺序执行多个响应拦截器', async () => {
            const response = createMockResponse({ success: true })
            const order: number[] = []

            manager.addResponseInterceptor((res) => {
                order.push(1)
                return res
            })

            manager.addResponseInterceptor((res) => {
                order.push(2)
                return res
            })

            await manager.runResponseInterceptors(response)

            expect(order).toEqual([1, 2])
        })
    })

    describe('错误拦截器', () => {
        it('应该能添加错误拦截器', async () => {
            const error = new Error('Test error')
            const interceptor = vi.fn((err) => {
                throw err
            })
            manager.addErrorInterceptor(interceptor)

            try {
                await manager.runErrorInterceptors(error)
            } catch (err) {
                expect(interceptor).toHaveBeenCalledWith(error)
            }
        })

        it('应该能捕获和修改错误', async () => {
            const originalError = new Error('Original error')
            const modifiedError = new Error('Modified error')

            manager.addErrorInterceptor(() => {
                throw modifiedError
            })

            try {
                await manager.runErrorInterceptors(originalError)
            } catch (err) {
                expect(err).toBe(modifiedError)
            }
        })
    })

    describe('清空拦截器', () => {
        it('应该能清空所有拦截器', async () => {
            const requestInterceptor = vi.fn((url, config) => ({ url, config }))
            const responseInterceptor = vi.fn((res) => res)
            const errorInterceptor = vi.fn((err) => {
                throw err
            })

            manager.addRequestInterceptor(requestInterceptor)
            manager.addResponseInterceptor(responseInterceptor)
            manager.addErrorInterceptor(errorInterceptor)

            manager.clear()

            await manager.runRequestInterceptors('/test', { method: 'GET' })
            await manager.runResponseInterceptors(createMockResponse({}))

            expect(requestInterceptor).not.toHaveBeenCalled()
            expect(responseInterceptor).not.toHaveBeenCalled()
        })
    })
})

describe('默认请求拦截器', () => {
    it('应该添加 Request ID', async () => {
        const interceptors = createDefaultRequestInterceptors()
        const manager = new InterceptorManager()

        interceptors.forEach((i) => manager.addRequestInterceptor(i))

        const result = await manager.runRequestInterceptors('/test', {
            method: 'GET',
        })

        expect(result.config.headers).toHaveProperty('X-Request-ID')
        const headers = result.config.headers as Record<string, string>
        expect(headers['X-Request-ID']).toMatch(/^req_\d+_/)
    })

    it('应该在 noCache 为 true 时添加时间戳', async () => {
        const interceptors = createDefaultRequestInterceptors()
        const manager = new InterceptorManager()

        interceptors.forEach((i) => manager.addRequestInterceptor(i))

        const result = await manager.runRequestInterceptors('/test', {
            method: 'GET',
            noCache: true,
        })

        expect(result.url).toMatch(/\?_t=\d+$/)
    })
})

describe('默认响应拦截器', () => {
    beforeEach(() => {
        clearAuthStorage()
    })

    it('应该保存新的 Token', async () => {
        mockAuthStorage('old-token')

        const interceptors = createDefaultResponseInterceptors()
        const manager = new InterceptorManager()

        interceptors.forEach((i) => manager.addResponseInterceptor(i))

        const response = createMockResponse(
            { success: true },
            {
                headers: {
                    'X-New-Token': 'new-token',
                },
            }
        )

        await manager.runResponseInterceptors(response)

        const authStorage = localStorage.getItem('auth-storage')
        expect(authStorage).toBeTruthy()
        if (authStorage) {
            const parsed = JSON.parse(authStorage)
            expect(parsed.state.token).toBe('new-token')
        }
    })
})

describe('Token 刷新拦截器', () => {
    beforeEach(() => {
        clearAuthStorage()
        vi.clearAllMocks()
    })

    it('应该在 401 错误时刷新 Token', async () => {
        mockAuthStorage('expired-token', 'valid-refresh-token')

        // Mock fetch 返回符合拦截器期望的格式
        // 拦截器会从 response.json() 获取 data.token 或 token
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                success: true,
                data: {
                    token: 'new-access-token',
                    refreshToken: 'new-refresh-token',
                },
            }),
        })

        const interceptor = createTokenRefreshInterceptor('/auth/refresh')
        const error = { status: 401, message: 'Unauthorized' }

        const result = await interceptor(error)

        expect(result).toBe('new-access-token')
        expect(fetch).toHaveBeenCalledWith(
            '/auth/refresh',
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('valid-refresh-token'),
            })
        )
    })

    it('应该在没有 refresh token 时直接抛出错误', async () => {
        clearAuthStorage()

        const interceptor = createTokenRefreshInterceptor('/auth/refresh')
        const error = { status: 401, message: 'Unauthorized' }

        await expect(interceptor(error)).rejects.toEqual(error)
    })

    it('应该在刷新失败时清除认证信息', async () => {
        mockAuthStorage('expired-token', 'invalid-refresh-token')

        global.fetch = mockFetchError('Invalid refresh token', 'INVALID_TOKEN', 401)

        const interceptor = createTokenRefreshInterceptor('/auth/refresh')
        const error = { status: 401, message: 'Unauthorized' }

        await expect(interceptor(error)).rejects.toThrow()

        expect(localStorage.getItem('auth-storage')).toBeNull()
    })

    it('应该忽略非 401 错误', async () => {
        const interceptor = createTokenRefreshInterceptor('/auth/refresh')
        const error = { status: 404, message: 'Not Found' }

        await expect(interceptor(error)).rejects.toEqual(error)
        expect(fetch).not.toHaveBeenCalled()
    })
})
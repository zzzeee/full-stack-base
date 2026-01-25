import type { RequestConfig } from './types'

/**
 * 请求拦截器类型
 */
export type RequestInterceptor = (
    url: string,
    config: RequestConfig
) => Promise<{ url: string; config: RequestConfig }> | { url: string; config: RequestConfig }

/**
 * 响应拦截器类型
 */
export type ResponseInterceptor = (response: Response) => Promise<Response> | Response

/**
 * 错误拦截器类型
 */
export type ErrorInterceptor = (error: any) => Promise<any> | any

/**
 * 拦截器管理器
 */
export class InterceptorManager {
    private requestInterceptors: RequestInterceptor[] = []
    private responseInterceptors: ResponseInterceptor[] = []
    private errorInterceptors: ErrorInterceptor[] = []

    /**
     * 添加请求拦截器
     */
    addRequestInterceptor(interceptor: RequestInterceptor) {
        this.requestInterceptors.push(interceptor)
        return this.requestInterceptors.length - 1
    }

    /**
     * 添加响应拦截器
     */
    addResponseInterceptor(interceptor: ResponseInterceptor) {
        this.responseInterceptors.push(interceptor)
        return this.responseInterceptors.length - 1
    }

    /**
     * 添加错误拦截器
     */
    addErrorInterceptor(interceptor: ErrorInterceptor) {
        this.errorInterceptors.push(interceptor)
        return this.errorInterceptors.length - 1
    }

    /**
     * 移除请求拦截器
     */
    removeRequestInterceptor(index: number) {
        this.requestInterceptors.splice(index, 1)
    }

    /**
     * 移除响应拦截器
     */
    removeResponseInterceptor(index: number) {
        this.responseInterceptors.splice(index, 1)
    }

    /**
     * 移除错误拦截器
     */
    removeErrorInterceptor(index: number) {
        this.errorInterceptors.splice(index, 1)
    }

    /**
     * 执行请求拦截器链
     */
    async runRequestInterceptors(
        url: string,
        config: RequestConfig
    ): Promise<{ url: string; config: RequestConfig }> {
        let currentUrl = url
        let currentConfig = config

        for (const interceptor of this.requestInterceptors) {
            const result = await interceptor(currentUrl, currentConfig)
            currentUrl = result.url
            currentConfig = result.config
        }

        return { url: currentUrl, config: currentConfig }
    }

    /**
     * 执行响应拦截器链
     */
    async runResponseInterceptors(response: Response): Promise<Response> {
        let currentResponse = response

        for (const interceptor of this.responseInterceptors) {
            currentResponse = await interceptor(currentResponse)
        }

        return currentResponse
    }

    /**
     * 执行错误拦截器链
     */
    async runErrorInterceptors(error: any): Promise<any> {
        let currentError = error

        for (const interceptor of this.errorInterceptors) {
            try {
                currentError = await interceptor(currentError)
            } catch (err) {
                currentError = err
            }
        }

        return currentError
    }

    /**
     * 清空所有拦截器
     */
    clear() {
        this.requestInterceptors = []
        this.responseInterceptors = []
        this.errorInterceptors = []
    }
}

/**
 * 创建默认的请求拦截器
 */
export const createDefaultRequestInterceptors = () => {
    const interceptors: RequestInterceptor[] = []

    // 1. 添加请求 ID
    interceptors.push((url, config) => {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

        return {
            url,
            config: {
                ...config,
                headers: {
                    ...config.headers,
                    'X-Request-ID': requestId,
                },
            },
        }
    })

    // 2. 添加时间戳（防止缓存）
    interceptors.push((url, config) => {
        if (config.noCache) {
            const separator = url.includes('?') ? '&' : '?'
            return {
                url: `${url}${separator}_t=${Date.now()}`,
                config,
            }
        }
        return { url, config }
    })

    // 3. 开发环境日志
    if (process.env.NODE_ENV === 'development') {
        interceptors.push((url, config) => {
            console.group(`[API Request] ${config.method || 'GET'} ${url}`)
            console.log('Headers:', config.headers)
            console.log('Body:', config.body)
            console.log('Config:', config)
            console.groupEnd()
            return { url, config }
        })
    }

    return interceptors
}

/**
 * 创建默认的响应拦截器
 */
export const createDefaultResponseInterceptors = () => {
    const interceptors: ResponseInterceptor[] = []

    // 1. 开发环境日志
    if (process.env.NODE_ENV === 'development') {
        interceptors.push(async (response) => {
            const clonedResponse = response.clone()
            const body = await clonedResponse.text()

            console.group(`[API Response] ${response.status} ${response.url}`)
            console.log('Status:', response.status, response.statusText)
            console.log('Headers:', Object.fromEntries(response.headers.entries()))
            console.log('Body:', body.length > 1000 ? `${body.substring(0, 1000)}...` : body)
            console.groupEnd()

            return response
        })
    }

    // 2. 检查并保存新 Token
    interceptors.push((response) => {
        const newToken = response.headers.get('X-New-Token')
        if (newToken && typeof window !== 'undefined') {
            try {
                const authStorage = localStorage.getItem('auth-storage')
                if (authStorage) {
                    const storage = JSON.parse(authStorage)
                    storage.state.token = newToken
                    localStorage.setItem('auth-storage', JSON.stringify(storage))
                }
            } catch (error) {
                console.error('Failed to update token:', error)
            }
        }
        return response
    })

    return interceptors
}

/**
 * 创建默认的错误拦截器
 */
export const createDefaultErrorInterceptors = () => {
    const interceptors: ErrorInterceptor[] = []

    // 1. 401 未认证处理
    interceptors.push((error) => {
        if (error?.status === 401) {
            // 清除认证信息
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth-storage')

                // 重定向到登录页
                const currentPath = window.location.pathname
                const redirectUrl = `/login?redirect=${encodeURIComponent(currentPath)}`
                window.location.href = redirectUrl
            }
        }
        throw error
    })

    // 2. 403 权限不足处理
    interceptors.push((error) => {
        if (error?.status === 403) {
            console.error('Permission denied:', error)
            // 可以选择显示提示或跳转到无权限页面
            if (typeof window !== 'undefined') {
                // window.location.href = '/403'
            }
        }
        throw error
    })

    // 3. 5xx 服务器错误处理
    interceptors.push((error) => {
        if (error?.status >= 500) {
            console.error('Server error:', error)
            // 可以选择显示全局错误提示
        }
        throw error
    })

    // 4. 网络错误处理
    interceptors.push((error) => {
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            console.error('Network error - please check your connection')
            // 可以选择显示网络错误提示
        }
        throw error
    })

    return interceptors
}

/**
 * Token 刷新拦截器
 * 自动刷新过期的 access token
 */
let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

const subscribeTokenRefresh = (callback: (token: string) => void) => {
    refreshSubscribers.push(callback)
}

const onTokenRefreshed = (token: string) => {
    refreshSubscribers.forEach((callback) => callback(token))
    refreshSubscribers = []
}

export const createTokenRefreshInterceptor = (
    refreshEndpoint: string = '/auth/refresh'
): ErrorInterceptor => {
    return async (error) => {
        // 只处理 401 错误
        if (error?.status !== 401) {
            throw error
        }

        // 获取 refresh token
        const refreshToken = (() => {
            if (typeof window === 'undefined') return null

            try {
                const authStorage = localStorage.getItem('auth-storage')
                if (authStorage) {
                    const { state } = JSON.parse(authStorage)
                    return state?.refreshToken || null
                }
            } catch (err) {
                console.error('Failed to get refresh token:', err)
            }
            return null
        })()

        if (!refreshToken) {
            throw error
        }

        // 如果正在刷新，等待刷新完成
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                subscribeTokenRefresh((token: string) => {
                    // 重试原请求
                    resolve(token)
                })
            })
        }

        isRefreshing = true

        try {
            // 调用刷新 token 接口
            const response = await fetch(refreshEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            })

            if (!response.ok) {
                throw new Error('Token refresh failed')
            }

            const data = await response.json()
            const newToken = data.data?.token || data.token

            if (!newToken) {
                throw new Error('No token in refresh response')
            }

            // 保存新 token
            if (typeof window !== 'undefined') {
                try {
                    const authStorage = localStorage.getItem('auth-storage')
                    if (authStorage) {
                        const storage = JSON.parse(authStorage)
                        storage.state.token = newToken
                        if (data.data?.refreshToken || data.refreshToken) {
                            storage.state.refreshToken = data.data?.refreshToken || data.refreshToken
                        }
                        localStorage.setItem('auth-storage', JSON.stringify(storage))
                    }
                } catch (err) {
                    console.error('Failed to save new token:', err)
                }
            }

            // 通知所有等待的请求
            onTokenRefreshed(newToken)

            // 返回新 token，让调用者重试请求
            return newToken
        } catch (refreshError) {
            // 刷新失败，清除认证信息
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth-storage')
                window.location.href = '/login'
            }
            throw refreshError
        } finally {
            isRefreshing = false
        }
    }
}
/**
 * API 端点配置文件
 * 集中管理所有 API 端点，方便维护和修改
 *
 * @example
 * ```typescript
 * import { ENDPOINTS } from '@/lib/api/endpoints'
 *
 * const response = await apiClient.get(ENDPOINTS.auth.login())
 * ```
 */

/**
 * 构建 URL 查询参数
 */
const buildQueryParams = (params?: Record<string, any>): string => {
    if (!params) return ''

    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            searchParams.append(key, String(value))
        }
    })

    const query = searchParams.toString()
    return query ? `?${query}` : ''
}

/**
 * 认证相关端点
 */
export const AUTH_ENDPOINTS = {
    /** 登录 */
    login: () => '/auth/login',

    /** 注册 */
    register: () => '/auth/register',

    /** 登出 */
    logout: () => '/auth/logout',

    /** 刷新 Token */
    refresh: () => '/auth/refresh',

    /** 忘记密码 */
    forgotPassword: () => '/auth/forgot-password',

    /** 重置密码 */
    resetPassword: () => '/auth/reset-password',

    /** 验证邮箱 */
    verifyEmail: (token: string) => `/auth/verify-email/${token}`,

    /** 获取当前用户信息 */
    me: () => '/auth/me',

    /** 修改密码 */
    changePassword: () => '/auth/change-password',

    /** OAuth 登录 */
    oauth: (provider: string) => `/auth/oauth/${provider}`,

    /** OAuth 回调 */
    oauthCallback: (provider: string) => `/auth/oauth/${provider}/callback`,
} as const

/**
 * 用户相关端点
 */
export const USER_ENDPOINTS = {
    list: (params?: {
        page?: number
        limit?: number
        search?: string
        role?: string
        status?: string
    }) => `/users${buildQueryParams(params)}`,

    getById: (id: string) => `/users/${id}`,

    create: () => '/users',

    update: (id: string) => `/users/${id}`,

    delete: (id: string) => `/users/${id}`,

    batchDelete: () => '/users/batch-delete',

    updateAvatar: (id: string) => `/users/${id}/avatar`,

    updatePassword: (id: string) => `/users/${id}/password`,

    stats: (id: string) => `/users/${id}/stats`,

    activities: (id: string, params?: { page?: number; limit?: number }) =>
        `/users/${id}/activities${buildQueryParams(params)}`,

    me: () => '/users/me',

    updateMe: () => '/users/me',

    updateMyAvatar: () => '/users/me/avatar',

    changeMyPassword: () => '/users/me/password',

    /** 更换邮箱（由 Supabase Auth 处理确认流程） */
    changeEmail: () => '/users/me/email',
} as const

/**
 * 文件上传相关端点
 */
export const UPLOAD_ENDPOINTS = {
    single: () => '/upload/single',

    multiple: () => '/upload/multiple',

    delete: (fileId: string) => `/upload/${fileId}`,

    batchDelete: () => '/upload/batch-delete',

    getInfo: (fileId: string) => `/upload/${fileId}`,

    list: (params?: { page?: number; limit?: number; type?: string }) =>
        `/upload${buildQueryParams(params)}`,

    getUploadToken: () => '/upload/token',
} as const

/**
 * 通知相关端点
 */
export const NOTIFICATION_ENDPOINTS = {
    list: (params?: { page?: number; limit?: number; unread?: boolean }) =>
        `/notifications${buildQueryParams(params)}`,

    getById: (id: string) => `/notifications/${id}`,

    markAsRead: (id: string) => `/notifications/${id}/read`,

    markAllAsRead: () => '/notifications/read-all',

    delete: (id: string) => `/notifications/${id}`,

    batchDelete: () => '/notifications/batch-delete',

    unreadCount: () => '/notifications/unread-count',

    settings: () => '/notifications/settings',

    updateSettings: () => '/notifications/settings',
} as const

/**
 * 搜索相关端点
 */
export const SEARCH_ENDPOINTS = {
    global: (query: string, params?: { type?: string; limit?: number }) =>
        `/search${buildQueryParams({ q: query, ...params })}`,

    users: (query: string) => `/search/users${buildQueryParams({ q: query })}`,

    suggestions: (query: string) =>
        `/search/suggestions${buildQueryParams({ q: query })}`,

    advanced: (params: Record<string, any>) =>
        `/search/advanced${buildQueryParams(params)}`,
} as const

/**
 * 设置相关端点
 */
export const SETTINGS_ENDPOINTS = {
    get: () => '/settings',

    update: () => '/settings',

    system: () => '/settings/system',

    theme: () => '/settings/theme',

    updateTheme: () => '/settings/theme',

    privacy: () => '/settings/privacy',

    updatePrivacy: () => '/settings/privacy',
} as const

/**
 * 统计相关端点
 */
export const ANALYTICS_ENDPOINTS = {
    overview: () => '/analytics/overview',

    userGrowth: (params?: { startDate?: string; endDate?: string; interval?: string }) =>
        `/analytics/user-growth${buildQueryParams(params)}`,

    activeUsers: (params?: { period?: 'day' | 'week' | 'month' | 'year' }) =>
        `/analytics/active-users${buildQueryParams(params)}`,

    contentStats: (params?: { startDate?: string; endDate?: string }) =>
        `/analytics/content${buildQueryParams(params)}`,

    userBehavior: (params?: { startDate?: string; endDate?: string }) =>
        `/analytics/behavior${buildQueryParams(params)}`,

    export: (params?: { type?: string; format?: string }) =>
        `/analytics/export${buildQueryParams(params)}`,
} as const

/**
 * 日志相关端点
 */
export const LOG_ENDPOINTS = {
    list: (params?: {
        page?: number
        limit?: number
        userId?: string
        action?: string
        startDate?: string
        endDate?: string
    }) => `/logs${buildQueryParams(params)}`,

    getById: (id: string) => `/logs/${id}`,

    errors: (params?: { page?: number; limit?: number }) =>
        `/logs/errors${buildQueryParams(params)}`,

    logins: (params?: { page?: number; limit?: number; userId?: string }) =>
        `/logs/logins${buildQueryParams(params)}`,
} as const

/**
 * 导出所有端点
 */
export const ENDPOINTS = {
    auth: AUTH_ENDPOINTS,
    users: USER_ENDPOINTS,
    upload: UPLOAD_ENDPOINTS,
    notifications: NOTIFICATION_ENDPOINTS,
    search: SEARCH_ENDPOINTS,
    settings: SETTINGS_ENDPOINTS,
    analytics: ANALYTICS_ENDPOINTS,
    logs: LOG_ENDPOINTS,
} as const

/**
 * API 端点类型
 */
export type ApiEndpoints = typeof ENDPOINTS

/**
 * 构建带路径参数的 URL
 */
export const buildPathUrl = (
    path: string,
    params: Record<string, string | number>
): string => {
    let url = path
    Object.entries(params).forEach(([key, value]) => {
        url = url.replace(`:${key}`, String(value))
    })
    return url
}

/**
 * 构建完整 URL（带查询参数）
 */
export const buildFullUrl = (
    path: string,
    queryParams?: Record<string, any>
): string => {
    return `${path}${buildQueryParams(queryParams)}`
}

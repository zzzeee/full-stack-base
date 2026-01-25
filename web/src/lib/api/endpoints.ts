/**
 * API 端点配置文件
 * 集中管理所有 API 端点，方便维护和修改
 * 
 * @example
 * ```typescript
 * import { ENDPOINTS } from '@/lib/api/endpoints'
 * 
 * // 使用端点
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
    /** 
     * 获取用户列表
     * @param params.page - 页码
     * @param params.limit - 每页数量
     * @param params.search - 搜索关键词
     * @param params.role - 角色筛选
     * @param params.status - 状态筛选
     */
    list: (params?: {
        page?: number
        limit?: number
        search?: string
        role?: string
        status?: string
    }) => `/users${buildQueryParams(params)}`,

    /** 获取单个用户 */
    getById: (id: string) => `/users/${id}`,

    /** 创建用户 */
    create: () => '/users',

    /** 更新用户 */
    update: (id: string) => `/users/${id}`,

    /** 删除用户 */
    delete: (id: string) => `/users/${id}`,

    /** 批量删除用户 */
    batchDelete: () => '/users/batch-delete',

    /** 更新用户头像 */
    updateAvatar: (id: string) => `/users/${id}/avatar`,

    /** 更新用户密码 */
    updatePassword: (id: string) => `/users/${id}/password`,

    /** 获取用户统计 */
    stats: (id: string) => `/users/${id}/stats`,

    /** 获取用户活动日志 */
    activities: (id: string, params?: { page?: number; limit?: number }) =>
        `/users/${id}/activities${buildQueryParams(params)}`,

    /** 获取当前用户资料 */
    me: () => '/users/me',

    /** 更新当前用户资料 */
    updateMe: () => '/users/me',

    /** 更新当前用户头像 */
    updateMyAvatar: () => '/users/me/avatar',

    /** 修改当前用户密码 */
    changeMyPassword: () => '/users/me/password',

    /** 发送邮箱验证码（用于更换邮箱） */
    sendEmailCode: () => '/users/me/email/send-code',

    /** 确认更换邮箱 */
    changeEmail: () => '/users/me/email',
} as const

/**
 * 文件上传相关端点
 */
export const UPLOAD_ENDPOINTS = {
    /** 上传单个文件 */
    single: () => '/upload/single',

    /** 上传多个文件 */
    multiple: () => '/upload/multiple',

    /** 删除文件 */
    delete: (fileId: string) => `/upload/${fileId}`,

    /** 批量删除文件 */
    batchDelete: () => '/upload/batch-delete',

    /** 获取文件信息 */
    getInfo: (fileId: string) => `/upload/${fileId}`,

    /** 获取文件列表 */
    list: (params?: { page?: number; limit?: number; type?: string }) =>
        `/upload${buildQueryParams(params)}`,

    /** 获取上传凭证（用于前端直传） */
    getUploadToken: () => '/upload/token',
} as const

/**
 * 通知相关端点
 */
export const NOTIFICATION_ENDPOINTS = {
    /** 获取通知列表 */
    list: (params?: { page?: number; limit?: number; unread?: boolean }) =>
        `/notifications${buildQueryParams(params)}`,

    /** 获取单个通知 */
    getById: (id: string) => `/notifications/${id}`,

    /** 标记为已读 */
    markAsRead: (id: string) => `/notifications/${id}/read`,

    /** 标记全部为已读 */
    markAllAsRead: () => '/notifications/read-all',

    /** 删除通知 */
    delete: (id: string) => `/notifications/${id}`,

    /** 批量删除通知 */
    batchDelete: () => '/notifications/batch-delete',

    /** 获取未读数量 */
    unreadCount: () => '/notifications/unread-count',

    /** 获取通知设置 */
    settings: () => '/notifications/settings',

    /** 更新通知设置 */
    updateSettings: () => '/notifications/settings',
} as const

/**
 * 搜索相关端点
 */
export const SEARCH_ENDPOINTS = {
    /** 全局搜索 */
    global: (query: string, params?: { type?: string; limit?: number }) =>
        `/search${buildQueryParams({ q: query, ...params })}`,

    /** 搜索用户 */
    users: (query: string) => `/search/users${buildQueryParams({ q: query })}`,

    /** 搜索建议 */
    suggestions: (query: string) => `/search/suggestions${buildQueryParams({ q: query })}`,

    /** 高级搜索 */
    advanced: (params: Record<string, any>) => `/search/advanced${buildQueryParams(params)}`,
} as const

/**
 * 设置相关端点
 */
export const SETTINGS_ENDPOINTS = {
    /** 获取用户设置 */
    get: () => '/settings',

    /** 更新用户设置 */
    update: () => '/settings',

    /** 获取系统配置 */
    system: () => '/settings/system',

    /** 获取主题设置 */
    theme: () => '/settings/theme',

    /** 更新主题设置 */
    updateTheme: () => '/settings/theme',

    /** 获取隐私设置 */
    privacy: () => '/settings/privacy',

    /** 更新隐私设置 */
    updatePrivacy: () => '/settings/privacy',
} as const

/**
 * 统计相关端点
 */
export const ANALYTICS_ENDPOINTS = {
    /** 获取概览数据 */
    overview: () => '/analytics/overview',

    /** 获取用户增长数据 */
    userGrowth: (params?: { startDate?: string; endDate?: string; interval?: string }) =>
        `/analytics/user-growth${buildQueryParams(params)}`,

    /** 获取活跃用户数据 */
    activeUsers: (params?: { period?: 'day' | 'week' | 'month' | 'year' }) =>
        `/analytics/active-users${buildQueryParams(params)}`,

    /** 获取内容统计 */
    contentStats: (params?: { startDate?: string; endDate?: string }) =>
        `/analytics/content${buildQueryParams(params)}`,

    /** 获取用户行为统计 */
    userBehavior: (params?: { startDate?: string; endDate?: string }) =>
        `/analytics/behavior${buildQueryParams(params)}`,

    /** 导出报表 */
    export: (params?: { type?: string; format?: string }) =>
        `/analytics/export${buildQueryParams(params)}`,
} as const

/**
 * 日志相关端点
 */
export const LOG_ENDPOINTS = {
    /** 获取操作日志 */
    list: (params?: {
        page?: number
        limit?: number
        userId?: string
        action?: string
        startDate?: string
        endDate?: string
    }) => `/logs${buildQueryParams(params)}`,

    /** 获取单条日志详情 */
    getById: (id: string) => `/logs/${id}`,

    /** 获取错误日志 */
    errors: (params?: { page?: number; limit?: number }) =>
        `/logs/errors${buildQueryParams(params)}`,

    /** 获取登录日志 */
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
 * 
 * @example
 * ```typescript
 * buildPathUrl('/users/:id/posts/:postId', { id: '1', postId: '2' })
 * // => '/users/1/posts/2'
 * ```
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
 * 
 * @example
 * ```typescript
 * buildFullUrl('/users', { page: 1, limit: 10 })
 * // => '/users?page=1&limit=10'
 * ```
 */
export const buildFullUrl = (
    path: string,
    queryParams?: Record<string, any>
): string => {
    return `${path}${buildQueryParams(queryParams)}`
}
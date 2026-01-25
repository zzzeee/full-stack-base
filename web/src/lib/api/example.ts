/**
 * API 客户端使用示例
 * 展示如何使用 apiClient、endpoints 和拦截器
 */

import { apiClient } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import type { ApiResponse } from '@/lib/api/types'

// ============ 示例 1: 基础 GET 请求 ============
async function getUsers() {
    try {
        const response = await apiClient.get<User[]>(ENDPOINTS.users.list())

        if (response.success) {
            console.log('Users:', response.data)
            return response.data
        }
    } catch (error) {
        console.error('Failed to get users:', error)
    }
}

// ============ 示例 2: 带查询参数的请求 ============
async function getUsersWithPagination() {
    try {
        const response = await apiClient.get<User[]>(
            ENDPOINTS.users.list({
                page: 1,
                limit: 10,
                search: 'john',
                role: 'admin',
            })
        )

        if (response.success) {
            console.log('Users:', response.data)
            return {
                users: response.data,
            }
        }
    } catch (error) {
        console.error('Failed to get users:', error)
    }
}

// ============ 示例 3: POST 请求创建资源 ============
async function createUser(userData: CreateUserData) {
    try {
        const response = await apiClient.post<User>(
            ENDPOINTS.users.create(),
            userData
        )

        if (response.success) {
            console.log('Created user:', response.data)
            return response.data
        }
    } catch (error) {
        console.error('Failed to create user:', error)
    }
}

// ============ 示例 4: PUT 请求更新资源 ============
async function updateUser(userId: string, userData: UpdateUserData) {
    try {
        const response = await apiClient.put<User>(
            ENDPOINTS.users.update(userId),
            userData
        )

        if (response.success) {
            console.log('Updated user:', response.data)
            return response.data
        }
    } catch (error) {
        console.error('Failed to update user:', error)
    }
}

// ============ 示例 5: DELETE 请求 ============
async function deleteUser(userId: string) {
    try {
        const response = await apiClient.delete<void>(
            ENDPOINTS.users.delete(userId)
        )

        if (response.success) {
            console.log('User deleted successfully')
            return true
        }
    } catch (error) {
        console.error('Failed to delete user:', error)
        return false
    }
}

// ============ 示例 6: 文件上传 ============
async function uploadAvatar(userId: string, file: File) {
    try {
        const response = await apiClient.upload<{ url: string }>(
            ENDPOINTS.users.updateAvatar(userId),
            file
        )

        if (response.success) {
            console.log('Avatar uploaded:', response.data?.url)
            return response.data?.url
        }
    } catch (error) {
        console.error('Failed to upload avatar:', error)
    }
}

// ============ 示例 7: 带重试的请求 ============
async function getUserWithRetry(userId: string) {
    try {
        const response = await apiClient.get<User>(
            ENDPOINTS.users.getById(userId),
            {
                retry: 3,
                retryDelay: 2000,
                timeout: 5000,
            }
        )

        if (response.success) {
            return response.data
        }
    } catch (error) {
        console.error('Failed to get user after retries:', error)
    }
}

// ============ 示例 8: 自定义请求头 ============
async function getDataWithCustomHeaders() {
    try {
        const response = await apiClient.get<any>('/custom-endpoint', {
            headers: {
                'X-Custom-Header': 'custom-value',
                'Accept-Language': 'zh-CN',
            },
        })

        if (response.success) {
            return response.data
        }
    } catch (error) {
        console.error('Failed to get data:', error)
    }
}

// ============ 示例 9: 添加自定义拦截器 ============
function setupCustomInterceptors() {
    // 添加请求拦截器
    apiClient.interceptors.addRequestInterceptor((url, config) => {
        // 在每个请求中添加自定义头
        return {
            url,
            config: {
                ...config,
                headers: {
                    ...config.headers,
                    'X-App-Version': '1.0.0',
                },
            },
        }
    })

    // 添加响应拦截器
    apiClient.interceptors.addResponseInterceptor((response) => {
        // 处理特殊响应头
        const rateLimit = response.headers.get('X-RateLimit-Remaining')
        if (rateLimit && parseInt(rateLimit) < 10) {
            console.warn('API rate limit is low:', rateLimit)
        }
        return response
    })

    // 添加错误拦截器
    apiClient.interceptors.addErrorInterceptor((error) => {
        // 自定义错误处理
        if (error?.code === 'RATE_LIMIT_EXCEEDED') {
            console.error('Rate limit exceeded, please try again later')
            // 显示用户友好的错误提示
        }
        throw error
    })
}

// ============ 示例 10: 并发请求 ============
async function fetchMultipleResources() {
    try {
        const [usersResponse, notificationsResponse, settingsResponse] =
            await Promise.all([
                apiClient.get<User[]>(ENDPOINTS.users.list()),
                apiClient.get<Notification[]>(ENDPOINTS.notifications.list()),
                apiClient.get<Settings>(ENDPOINTS.settings.get()),
            ])

        return {
            users: usersResponse.success ? usersResponse.data : [],
            notifications: notificationsResponse.success
                ? notificationsResponse.data
                : [],
            settings: settingsResponse.success ? settingsResponse.data : null,
        }
    } catch (error) {
        console.error('Failed to fetch resources:', error)
    }
}

// ============ 示例 11: 搜索功能 ============
async function searchUsers(query: string) {
    try {
        const response = await apiClient.get<User[]>(
            ENDPOINTS.search.users(query)
        )

        if (response.success) {
            return response.data
        }
    } catch (error) {
        console.error('Search failed:', error)
    }
}

// ============ 示例 12: 认证相关 ============
async function login(email: string, password: string) {
    try {
        const response = await apiClient.post<{ token: string; user: User }>(
            ENDPOINTS.auth.login(),
            { email, password }
        )

        if (response.success && response.data) {
            // Token 会被自动保存到 localStorage
            console.log('Login successful:', response.data.user)
            return response.data
        }
    } catch (error) {
        console.error('Login failed:', error)
        throw error
    }
}

async function logout() {
    try {
        const response = await apiClient.post(ENDPOINTS.auth.logout())

        if (response.success) {
            // 清除本地认证信息
            localStorage.removeItem('auth-storage')
            console.log('Logout successful')
            return true
        }
    } catch (error) {
        console.error('Logout failed:', error)
        return false
    }
}

// ============ 类型定义 ============
interface User {
    id: string
    name: string
    email: string
    role: string
    avatar?: string
    createdAt: string
    updatedAt: string
}

interface CreateUserData {
    name: string
    email: string
    password: string
    role?: string
}

interface UpdateUserData {
    name?: string
    email?: string
    avatar?: string
}

interface Notification {
    id: string
    title: string
    message: string
    read: boolean
    createdAt: string
}

interface Settings {
    theme: 'light' | 'dark'
    language: string
    notifications: boolean
}

// ============ React Hook 示例 ============
import { useState, useEffect } from 'react'

function useUsers() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchUsers = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await apiClient.get<User[]>(ENDPOINTS.users.list())
            if (response.success && response.data) {
                setUsers(response.data)
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch users')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    return { users, loading, error, refetch: fetchUsers }
}

// ============ 导出示例函数 ============
export {
    getUsers,
    getUsersWithPagination,
    createUser,
    updateUser,
    deleteUser,
    uploadAvatar,
    getUserWithRetry,
    getDataWithCustomHeaders,
    setupCustomInterceptors,
    fetchMultipleResources,
    searchUsers,
    login,
    logout,
    useUsers,
}
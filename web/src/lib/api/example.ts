// =====================================================
// 使用示例
// =====================================================

import { apiClient, ApiClientError } from '@/lib/api/client'

interface User {
    id: string
    name: string
    email: string
}

// =====================================================
// 示例 1: GET 请求
// =====================================================
const getUsers = async () => {
    try {
        const response = await apiClient.get<User[]>('/users')

        if (response.success) {
            console.log('用户列表:', response.data)
            // response.data 类型是 User[]
        }
    } catch (error) {
        if (error instanceof ApiClientError) {
            console.error('错误码:', error.code)
            console.error('错误信息:', error.message)
            console.error('HTTP 状态:', error.status)
        }
    }
}

// =====================================================
// 示例 2: POST 请求
// =====================================================
const createUser = async (userData: Partial<User>) => {
    try {
        const response = await apiClient.post<User>('/users', userData)

        if (response.success) {
            console.log('创建成功:', response.data)
            console.log('提示信息:', response.message) // 可选的消息
        }
    } catch (error) {
        if (error instanceof ApiClientError) {
            console.error('创建失败:', error.message)
        }
    }
}

// =====================================================
// 示例 3: 带配置的请求（超时、重试）
// =====================================================
const fetchWithConfig = async () => {
    const response = await apiClient.get<User[]>('/users', {
        timeout: 5000,      // 5秒超时
        retry: 3,           // 失败后重试3次
        retryDelay: 2000,   // 每次重试间隔2秒
    })

    if (response.success) {
        console.log(response.data)
    }
}

// =====================================================
// 示例 4: 文件上传
// =====================================================
const uploadFile = async (file: File) => {
    try {
        const response = await apiClient.upload<{ url: string }>('/upload', file)

        if (response.success) {
            console.log('文件URL:', response.data.url)
        }
    } catch (error) {
        console.error('上传失败:', error)
    }
}

// =====================================================
// 示例 5: 批量上传或带额外数据
// =====================================================
const uploadMultipleFiles = async (files: File[], description: string) => {
    const formData = new FormData()

    files.forEach((file, index) => {
        formData.append(`file${index}`, file)
    })
    formData.append('description', description)

    const response = await apiClient.upload<{ urls: string[] }>('/upload', formData)

    if (response.success) {
        console.log('上传的文件URLs:', response.data.urls)
    }
}

// =====================================================
// 示例 6: DELETE 请求
// =====================================================
const deleteUser = async (userId: string) => {
    const response = await apiClient.delete<void>(`/users/${userId}`)

    if (response.success) {
        console.log('删除成功')
    }
}

// =====================================================
// 示例 7: PATCH 请求（部分更新）
// =====================================================
const updateUserName = async (userId: string, newName: string) => {
    const response = await apiClient.patch<User>(`/users/${userId}`, {
        name: newName,
    })

    if (response.success) {
        console.log('更新后的用户:', response.data)
    }
}
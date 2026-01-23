// 错误结构
export interface ApiError<E = unknown> {
    code: string
    message: string
    details?: E
}

// 成功响应
export interface ApiSuccess<T> {
    success: true
    data: T
    message?: string
}

// 失败响应
export interface ApiFailure<E = unknown> {
    success: false
    error: ApiError<E>
}

export type ApiResponse<T, E = unknown> =
    | ApiSuccess<T>
    | ApiFailure<E>

// 请求配置
export interface RequestConfig extends RequestInit {
    timeout?: number
    retry?: number
    retryDelay?: number
}
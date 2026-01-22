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


export async function apiFetch<T, E = unknown>(
    input: RequestInfo,
    init?: RequestInit
): Promise<ApiResponse<T, E>> {
    const res = await fetch(input, {
        headers: {
            'Content-Type': 'application/json',
        },
        ...init,
    })

    return res.json()
}

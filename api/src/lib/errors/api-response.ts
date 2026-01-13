// src/lib/api-response.ts
/**
 * API 统一响应格式
 */

/**
 * 成功响应格式
 */
interface SuccessResponse<T = unknown> {
    success: true;
    data: T;
    message?: string;
}

/**
 * 错误响应格式
 */
interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}

/**
 * API 响应工具
 */
export const apiResponse = {
    /**
     * 成功响应
     * @param data - 响应数据
     * @param message - 可选消息
     * @returns SuccessResponse
     */
    success<T>(data: T, message?: string): SuccessResponse<T> {
        const response: SuccessResponse<T> = {
            success: true,
            data,
        };

        if (message) {
            response.message = message;
        }

        return response;
    },

    /**
     * 错误响应
     * @param message - 错误消息
     * @param code - 错误码
     * @param details - 错误详情
     * @returns ErrorResponse
     */
    error(message: string, code = 'INTERNAL_ERROR', details?: unknown): ErrorResponse {
        return {
            success: false,
            error: {
                code,
                message,
                details,
            },
        };
    },
};
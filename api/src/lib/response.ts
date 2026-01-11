// 统一API响应格式
export class ApiResponse<T = any> {
    constructor(
        public success: boolean,
        public data?: T,
        public message?: string,
        public code: number = 200
    ) { }

    static success<T>(data: T, message = '操作成功') {
        return new ApiResponse(true, data, message, 200)
    }

    static error(message: string, code = 400) {
        return new ApiResponse(false, undefined, message, code)
    }

    toJSON() {
        return {
            success: this.success,
            data: this.data,
            message: this.message,
            timestamp: new Date().toISOString()
        }
    }
}

// 快速响应方法
export function success<T>(data: T, message?: string) {
    return Response.json(ApiResponse.success(data, message).toJSON())
}

export function error(message: string, code = 400) {
    return Response.json(ApiResponse.error(message, code).toJSON(), { status: code })
}
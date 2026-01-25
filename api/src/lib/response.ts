/**
 * @file response.ts
 * @description 统一 API 响应格式工具类，提供标准化的响应结构
 * @author System
 * @createDate 2026-01-25
 */

/**
 * API 响应类
 * 
 * @class
 * @template T - 响应数据类型
 * @description 提供统一的 API 响应格式，包含成功/失败状态、数据、消息和状态码
 */
export class ApiResponse<T = unknown> {
    /**
     * 创建 ApiResponse 实例
     * 
     * @param {boolean} success - 请求是否成功
     * @param {T} [data] - 响应数据
     * @param {string} [message] - 响应消息
     * @param {number} [code=200] - HTTP 状态码
     */
    constructor(
        public success: boolean,
        public data?: T,
        public message?: string,
        public code: number = 200
    ) { }

    /**
     * 创建成功响应
     * 
     * @template T - 响应数据类型
     * @param {T} data - 响应数据
     * @param {string} [message='操作成功'] - 响应消息
     * @returns {ApiResponse<T>} 成功响应实例
     * 
     * @example
     * ApiResponse.success({ id: 1, name: 'John' }, '用户获取成功');
     */
    static success<T>(data: T, message = '操作成功') {
        return new ApiResponse(true, data, message, 200)
    }

    /**
     * 创建错误响应
     * 
     * @param {string} message - 错误消息
     * @param {number} [code=400] - HTTP 状态码
     * @returns {ApiResponse} 错误响应实例
     * 
     * @example
     * ApiResponse.error('用户不存在', 404);
     */
    static error(message: string, code = 400) {
        return new ApiResponse(false, undefined, message, code)
    }

    /**
     * 转换为 JSON 对象
     * 
     * @returns {Object} 包含 success、data、message 和 timestamp 的对象
     */
    toJSON() {
        return {
            success: this.success,
            data: this.data,
            message: this.message,
            timestamp: new Date().toISOString()
        }
    }
}

/**
 * 快速创建成功响应
 * 
 * @template T - 响应数据类型
 * @param {T} data - 响应数据
 * @param {string} [message] - 响应消息
 * @returns {Response} JSON 格式的 HTTP 响应
 * 
 * @example
 * return success({ users: [] }, '查询成功');
 */
export function success<T>(data: T, message?: string) {
    return Response.json(ApiResponse.success(data, message).toJSON())
}

/**
 * 快速创建错误响应
 * 
 * @param {string} message - 错误消息
 * @param {number} [code=400] - HTTP 状态码
 * @returns {Response} JSON 格式的 HTTP 错误响应
 * 
 * @example
 * return error('参数错误', 400);
 */
export function error(message: string, code = 400) {
    return Response.json(ApiResponse.error(message, code).toJSON(), { status: code })
}
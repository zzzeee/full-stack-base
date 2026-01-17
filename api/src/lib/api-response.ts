// src/lib/api-response.ts

/**
 * API 统一响应格式工具
 * 
 * 本模块提供了一个标准化的 API 响应格式，用于确保所有 API 接口返回统一的数据结构。
 * 包含成功响应和错误响应两种类型，支持 TypeScript 类型检查。
 * 
 * --------------- hono 使用示例 ---------------
 * return c.json(apiResponse.success(user, '用户获取成功'))
 * 
 * return c.json(
 *   apiResponse.error('用户名不能为空', 'VALIDATION_ERROR'),
 *   400
 * )
 * 
 * return c.json(
 *   apiResponse.error('服务器内部错误', 'INTERNAL_ERROR', {
 *       error: err.message,
 *       timestamp: new Date().toISOString()
 *   }),
 *   500
 * )
 * --------------- hono 使用示例 ---------------
 */

/**
 * 成功响应接口
 * 
 * 用于表示 API 调用成功的标准化响应格式。
 * 
 * @template T - 响应数据的类型，默认为 unknown
 * 
 * @property {boolean} success - 请求是否成功，始终为 true
 * @property {T} data - 响应数据主体
 * @property {string} [message] - 可选的描述性消息，用于向客户端提供额外信息
 * 
 * @example 返回用户数据的成功响应
 * {
 *   success: true,
 *   data: { id: 1, name: 'John Doe' },
 *   message: '用户信息获取成功'
 * }
 */
interface SuccessResponse<T = unknown> {
    success: true;
    data: T;
    message?: string;
}

/**
 * 错误响应接口
 * 
 * 用于表示 API 调用失败的标准化响应格式。
 * 
 * @property {boolean} success - 请求是否成功，始终为 false
 * @property {Object} error - 错误信息对象
 * @property {string} error.code - 错误代码，用于客户端程序化处理
 * @property {string} error.message - 人类可读的错误描述信息
 * @property {unknown} [error.details] - 可选的错误详情，用于调试或提供额外信息
 * 
 * @example 资源不存在的错误响应
 * {
 *   success: false,
 *   error: {
 *     code: 'RESOURCE_NOT_FOUND',
 *     message: '请求的用户不存在',
 *     details: { userId: 123 }
 *   }
 * }
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
 * API 响应工具集
 * 
 * 提供创建标准化 API 响应对象的工厂函数。
 */
export const apiResponse = {
    /**
     * 创建成功响应对象
     * 
     * @template T - 响应数据的类型
     * 
     * @param {T} data - 要返回的数据内容
     * @param {string} [message] - 可选的描述性消息
     * 
     * @returns {SuccessResponse<T>} 标准化成功响应对象
     * 
     * @example
     * // 基本用法
     * apiResponse.success({ id: 1, name: 'John' });
     * 
     * // 带消息的成功响应
     * apiResponse.success(
     *   { items: [], total: 0 },
     *   '查询成功，暂无数据'
     * );
     */
    success<T>(data: T, message?: string): SuccessResponse<T> {
        const response: SuccessResponse<T> = {
            success: true,
            data,
        };

        // 仅当提供消息时才添加 message 字段
        if (message) {
            response.message = message;
        }

        return response;
    },

    /**
     * 创建错误响应对象
     * 
     * @param {string} message - 错误描述信息（人类可读）
     * @param {string} [code='INTERNAL_ERROR'] - 错误代码，用于客户端程序化处理
     * @param {unknown} [details] - 可选的错误详情，用于调试或提供额外上下文
     * 
     * @returns {ErrorResponse} 标准化错误响应对象
     * 
     * @example
     * // 基本用法
     * apiResponse.error('用户认证失败');
     * 
     * // 带错误代码和详情
     * apiResponse.error(
     *   '文件大小超出限制',
     *   'FILE_TOO_LARGE',
     *   { maxSize: 10485760, actualSize: 15728640 }
     * );
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

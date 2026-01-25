/**
 * @file error.ts
 * @description 错误处理工具函数，提供错误类型转换和安全处理
 * @author System
 * @createDate 2026-01-25
 */

/**
 * 将未知错误转换为 Error 对象
 * 
 * @param {unknown} err - 未知类型的错误
 * @returns {Error} Error 对象
 * 
 * @description 安全地将各种类型的错误（Error、string、对象等）转换为标准的 Error 对象
 * 
 * @example
 * try {
 *   // some code
 * } catch (err) {
 *   const error = toError(err);
 *   console.error(error.message);
 * }
 */
export function toError(err: unknown): Error {
    if (err instanceof Error) {
        return err;
    }

    if (typeof err === 'string') {
        return new Error(err);
    }

    if (err && typeof err === 'object' && 'message' in err) {
        return new Error(String(err.message));
    }

    return new Error(String(err));
}

/**
 * 安全的错误信息提取
 * 
 * @param {unknown} err - 未知类型的错误
 * @returns {string} 错误消息字符串
 * 
 * @example
 * const message = getErrorMessage(someError);
 */
export function getErrorMessage(err: unknown): string {
    return toError(err).message;
}

/**
 * 获取错误堆栈
 * 
 * @param {unknown} err - 未知类型的错误
 * @returns {string | undefined} 错误堆栈信息，如果不存在则返回 undefined
 * 
 * @example
 * const stack = getErrorStack(someError);
 */
export function getErrorStack(err: unknown): string | undefined {
    return toError(err).stack;
}

/**
 * 类型安全的 try-catch 包装器
 * 
 * @template T - 函数返回值的类型
 * @param {() => Promise<T>} fn - 异步函数
 * @returns {Promise<[T, null] | [null, Error]>} 成功时返回 [result, null]，失败时返回 [null, Error]
 * 
 * @description 使用元组返回类型，避免使用 try-catch，提供更安全的错误处理方式
 * 
 * @example
 * const [data, error] = await tryCatch(async () => {
 *   return await fetchData();
 * });
 * if (error) {
 *   console.error(error);
 * } else {
 *   console.log(data);
 * }
 */
export async function tryCatch<T>(
    fn: () => Promise<T>
): Promise<[T, null] | [null, Error]> {
    try {
        const result = await fn();
        return [result, null];
    } catch (err) {
        return [null, toError(err)];
    }
}

// src/lib/error-utils.ts
/**
 * 将未知错误转换为 Error 对象
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
 */
export function getErrorMessage(err: unknown): string {
    return toError(err).message;
}

/**
 * 获取错误堆栈
 */
export function getErrorStack(err: unknown): string | undefined {
    return toError(err).stack;
}

/**
 * 类型安全的 try-catch 包装器
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

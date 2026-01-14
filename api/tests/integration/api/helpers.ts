// tests/integration/api/helpers.ts
/**
 * 测试辅助函数
 * 提供通用的测试工具方法
 */

import { TEST_CONFIG } from '../../setup.ts';

/**
 * 发起 HTTP 请求
 */
export async function request(
    method: string,
    path: string,
    options?: {
        body?: unknown;
        token?: string;
        headers?: Record<string, string>;
    }
) {
    const url = `${TEST_CONFIG.baseUrl}${path}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options?.headers,
    };

    if (options?.token) {
        headers['Authorization'] = `Bearer ${options.token}`;
    }

    const response = await fetch(url, {
        method,
        headers,
        body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json();

    return {
        status: response.status,
        data,
        headers: response.headers,
    };
}

/**
 * GET 请求
 */
export function get(path: string, token?: string) {
    return request('GET', path, { token });
}

/**
 * POST 请求
 */
export function post(path: string, body?: unknown, token?: string) {
    return request('POST', path, { body, token });
}

/**
 * PUT 请求
 */
export function put(path: string, body?: unknown, token?: string) {
    return request('PUT', path, { body, token });
}

/**
 * DELETE 请求
 */
export function del(path: string, token?: string) {
    return request('DELETE', path, { token });
}

/**
 * 等待指定时间
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 生成随机邮箱
 */
export function randomEmail(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * 生成随机密码
 */
export function randomPassword(): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';

    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];

    const allChars = lowercase + uppercase + numbers;
    for (let i = 3; i < 12; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password.split('').sort(() => Math.random() - 0.5).join('');
}
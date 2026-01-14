// tests/setup.ts
/**
 * 测试环境配置
 * 设置测试前后的钩子
 */

import { logger } from '@/lib/logger.ts';

// 设置测试环境变量
Deno.env.set('ENVIRONMENT', 'test');
Deno.env.set('LOG_LEVEL', 'error'); // 测试时只显示错误日志

// 全局测试设置
export const TEST_CONFIG = {
    baseUrl: 'http://localhost:3000',
    timeout: 5000,
};

// 测试用户数据
export const TEST_USERS = {
    testUser: {
        email: 'test@example.com',
        password: 'Test1234',
        name: 'Test User',
    },
    newUser: {
        email: `test-${Date.now()}@example.com`,
        password: 'NewUser1234',
        name: 'New Test User',
    },
};

/**
 * 清理测试数据
 */
export function cleanupTestData() {
    // TODO: 清理测试过程中创建的数据
    logger.info('Cleaning up test data');
}

// 测试前执行
// globalThis.addEventListener('beforeunload', cleanupTestData);
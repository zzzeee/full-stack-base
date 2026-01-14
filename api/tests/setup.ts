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

// 全局变量类型
declare global {
    var TOKEN: string;
}

/**
 * 清理测试数据
 */
export function cleanupTestData() {
    // TODO: 清理测试过程中创建的数据
    logger.info('Cleaning up test data');
}

// 程序即将退出时
// globalThis.addEventListener('beforeunload', cleanupTestData);
// 程序卸载时, 监听进程信号（如 Ctrl+C）
// globalThis.addEventListener('unload', cleanupTestData);
// error
// globalThis.addEventListener('error', cleanupTestData);
// 监听未处理的 Promise 拒绝
// globalThis.addEventListener('unhandledrejection', cleanupTestData);
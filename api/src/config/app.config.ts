/**
 * @file app.config.ts
 * @description 应用基础配置模块，从环境变量读取应用相关配置
 * @author System
 * @createDate 2026-01-25
 */

/**
 * 应用配置对象
 * 
 * @constant
 * @description 包含应用名称、版本、端口、环境、API 和日志等配置信息
 * 所有配置都从环境变量读取，不应硬编码
 */
export const appConfig = {
    /** 应用名称，从 APP_NAME 环境变量读取，默认为 'My Project' */
    name: Deno.env.get('APP_NAME') || 'My Project',
    /** 应用版本号，从 APP_VERSION 环境变量读取，默认为 '1.0.0' */
    version: Deno.env.get('APP_VERSION') || '1.0.0',
    /** 应用端口号，从 PORT 环境变量读取，默认为 8000 */
    port: parseInt(Deno.env.get('PORT') || '8000'),
    /** 时区设置，从 TIMEZONE 环境变量读取，可选 */
    timezone: Deno.env.get('TIMEZONE') || undefined,

    /** 运行环境，从 ENVIRONMENT 环境变量读取，默认为 'development' */
    environment: Deno.env.get('ENVIRONMENT') || 'development',
    /** 是否为开发环境 */
    isDevelopment: Deno.env.get('ENVIRONMENT') === 'development',
    /** 是否为生产环境 */
    isProduction: Deno.env.get('ENVIRONMENT') === 'production',

    /** API 版本号，从 API_VERSION 环境变量读取，默认为 'v1' */
    apiVersion: Deno.env.get('API_VERSION') || 'v1',
    /** API 路径前缀 */
    apiPrefix: '/api',

    /** 日志级别，从 LOG_LEVEL 环境变量读取，默认为 'info' */
    logLevel: Deno.env.get('LOG_LEVEL') || 'info',
    /** 日志格式，从 LOG_FORMAT 环境变量读取，默认为 'pretty' */
    logFormat: Deno.env.get('LOG_FORMAT') || 'pretty',
} as const;

/**
 * 验证应用配置
 * 
 * @description 检查必需的环境变量是否已设置，如果缺少则抛出错误
 * 
 * @throws {Error} 当必需的环境变量缺失时抛出错误
 * 
 * @example
 * validateAppConfig(); // 验证 APP_NAME 和 ENVIRONMENT 是否设置
 */
export function validateAppConfig() {
    const required = ['APP_NAME', 'ENVIRONMENT'];
    const missing = required.filter(key => !Deno.env.get(key));

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
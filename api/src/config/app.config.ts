// src/config/app.config.ts
/**
 * 应用基础配置
 * 所有配置都从环境变量读取，不应硬编码
 */

export const appConfig = {
    // 从环境变量读取
    name: Deno.env.get('APP_NAME') || 'My Project',
    version: Deno.env.get('APP_VERSION') || '1.0.0',
    port: parseInt(Deno.env.get('PORT') || '8000'),
    timezone: Deno.env.get('TIMEZONE') || undefined,

    // 环境相关
    environment: Deno.env.get('ENVIRONMENT') || 'development',
    isDevelopment: Deno.env.get('ENVIRONMENT') === 'development',
    isProduction: Deno.env.get('ENVIRONMENT') === 'production',

    // API 配置
    apiVersion: Deno.env.get('API_VERSION') || 'v1',
    apiPrefix: '/api',

    // 日志配置
    logLevel: Deno.env.get('LOG_LEVEL') || 'info',
    logFormat: Deno.env.get('LOG_FORMAT') || 'pretty',
} as const;

// 验证必需的环境变量
export function validateAppConfig() {
    const required = ['APP_NAME', 'ENVIRONMENT'];
    const missing = required.filter(key => !Deno.env.get(key));

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
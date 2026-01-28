/**
 * @file app.config.ts
 * @description 应用基础配置模块（由入口注入运行时变量构建）
 * @author System
 * @createDate 2026-01-25
 */

import type { FullConfig, AppConfig } from '[@BASE]/types/config.types.ts';

export function FormatAppConfig(config: FullConfig, newConf: AppConfig): AppConfig {
    return {
        name: newConf.name || config.app.name,
        version: newConf.version || config.app.version,
        port: newConf.port || config.app.port,
        timezone: newConf.timezone || config.app.timezone,
        environment: newConf.environment || config.app.environment,
        isDevelopment: newConf.isDevelopment || config.app.isDevelopment,
        isProduction: newConf.isProduction || config.app.isProduction,
        apiVersion: newConf.apiVersion || config.app.apiVersion,
        apiPrefix: newConf.apiPrefix || config.app.apiPrefix,
        corsOrigins: newConf.corsOrigins || config.app.corsOrigins,
        logLevel: newConf.logLevel || config.app.logLevel,
        logDirName: newConf.logDirName || config.app.logDirName,
    };
}

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
export function ValidateAppConfig(config: AppConfig) {
    const missing: string[] = [];
    if (!config.name) missing.push("APP_NAME");
    if (!config.environment) missing.push("ENVIRONMENT");

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
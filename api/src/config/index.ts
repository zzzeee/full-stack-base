/**
 * @file index.ts
 * @description 配置模块统一导出入口，提供所有配置的集中访问和验证功能
 * @author System
 * @createDate 2026-01-25
 */

import { appConfig, validateAppConfig } from './app.config.ts';
import { supabaseConfig, validateSupabaseConfig } from './supabase.config.ts';
import { authConfig, validateAuthConfig } from './auth.config.ts';

/**
 * 统一配置对象
 * 
 * @constant
 * @description 集中导出所有配置模块，包括应用配置、Supabase 配置和认证配置
 */
export const config = {
    /** 应用基础配置 */
    app: appConfig,
    /** Supabase 数据库配置 */
    supabase: supabaseConfig,
    /** 认证相关配置 */
    auth: authConfig,
} as const;

/**
 * 验证所有配置
 * 
 * @description 在应用启动时调用，验证所有配置模块的必需环境变量是否已正确设置
 * 如果验证失败，会输出错误信息并退出程序
 * 
 * @throws {Error} 当任何配置验证失败时抛出错误并退出程序
 * 
 * @example
 * // 在应用启动时调用
 * validateConfig();
 */
export function validateConfig() {
    try {
        validateAppConfig();
        validateSupabaseConfig();
        validateAuthConfig();

        console.log('✅ Configuration validated successfully');
    } catch (error) {
        console.error('❌ Configuration validation failed:', error);
        Deno.exit(1);
    }
}

// 默认导出
export default config;
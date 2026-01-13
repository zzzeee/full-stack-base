// src/config/index.ts
/**
 * 统一导出所有配置
 * 并在启动时验证配置
 */

import { appConfig, validateAppConfig } from './app.config.ts';
import { supabaseConfig, validateSupabaseConfig } from './supabase.config.ts';
import { authConfig, validateAuthConfig } from './auth.config.ts';

// 统一导出
export const config = {
    app: appConfig,
    supabase: supabaseConfig,
    auth: authConfig,
} as const;

/**
 * 验证所有配置
 * 在应用启动时调用
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
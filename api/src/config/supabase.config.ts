/**
 * @file supabase.config.ts
 * @description Supabase 数据库配置模块（由入口注入运行时变量构建）
 * @author System
 * @createDate 2026-01-25
 */

import type { FullConfig, SupabaseConfig } from '@/types/config.types.ts';

export function FormatSupabaseConfig(config: FullConfig, newConf: SupabaseConfig): SupabaseConfig {
    return {
        url: newConf.url || config.supabase.url,
        anonKey: newConf.anonKey || config.supabase.anonKey,
        serviceRoleKey: newConf.serviceRoleKey || config.supabase.serviceRoleKey,
        jwtSecret: newConf.jwtSecret || config.supabase.jwtSecret,
    };
}

/**
 * 验证 Supabase 配置
 * 
 * @description 检查必需的 Supabase 环境变量是否已设置
 * 
 * @throws {Error} 当 SUPABASE_URL 或 SUPABASE_ANON_KEY 缺失时抛出错误
 * 
 * @example
 * validateSupabaseConfig(); // 验证 Supabase 配置是否完整
 */
export function ValidateSupabaseConfig(config: SupabaseConfig) {
    if (!config.url) {
        throw new Error('SUPABASE_URL is required');
    }

    if (!config.anonKey) {
        throw new Error('SUPABASE_ANON_KEY is required');
    }

    // Service Role Key 是可选的（仅在需要管理员权限时使用）
    if (!config.serviceRoleKey) {
        console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not set - admin operations will not be available');
    }
}
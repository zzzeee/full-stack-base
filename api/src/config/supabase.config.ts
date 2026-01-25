/**
 * @file supabase.config.ts
 * @description Supabase 数据库配置模块，从环境变量读取 Supabase 相关配置
 * @author System
 * @createDate 2026-01-25
 */

/**
 * Supabase 配置对象
 * 
 * @constant
 * @description 包含 Supabase URL、匿名密钥、服务角色密钥和 JWT 密钥等配置
 * 所有敏感信息都从环境变量读取，不应硬编码
 */
export const supabaseConfig = {
    /** Supabase 项目 URL，从 SUPABASE_URL 环境变量读取 */
    url: Deno.env.get('SUPABASE_URL') || '',
    /** Supabase 匿名密钥，从 SUPABASE_ANON_KEY 环境变量读取 */
    anonKey: Deno.env.get('SUPABASE_ANON_KEY') || '',
    /** Supabase 服务角色密钥，从 SUPABASE_SERVICE_ROLE_KEY 环境变量读取（可选） */
    serviceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    /** Supabase JWT 密钥，从 SUPABASE_JWT_SECRET 环境变量读取 */
    jwtSecret: Deno.env.get('SUPABASE_JWT_SECRET') || '',
} as const;

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
export function validateSupabaseConfig() {
    if (!supabaseConfig.url) {
        throw new Error('SUPABASE_URL is required');
    }

    if (!supabaseConfig.anonKey) {
        throw new Error('SUPABASE_ANON_KEY is required');
    }

    // Service Role Key 是可选的（仅在需要管理员权限时使用）
    if (!supabaseConfig.serviceRoleKey) {
        console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not set - admin operations will not be available');
    }
}
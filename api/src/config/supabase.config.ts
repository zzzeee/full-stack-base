// src/config/supabase.config.ts
/**
 * Supabase 配置
 * 从环境变量读取所有敏感信息
 */

export const supabaseConfig = {
    url: Deno.env.get('SUPABASE_URL') || '',
    anonKey: Deno.env.get('SUPABASE_ANON_KEY') || '',
    serviceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    jwtSecret: Deno.env.get('SUPABASE_JWT_SECRET') || '',
} as const;

// 验证 Supabase 配置
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
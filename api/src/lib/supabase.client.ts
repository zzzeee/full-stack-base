/**
 * @file supabase.client.ts
 * @description Supabase 客户端模块，提供类型安全的数据库访问接口
 * @author System
 * @createDate 2026-01-25
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types.ts';
import config from '@/config/index.ts';
import { logger } from '@/lib/logger.ts';
import { toError } from "@/untils/error.ts";

/**
 * 类型安全的 Supabase 客户端类型
 * 
 * @typedef {SupabaseClient<Database>} TypedSupabaseClient
 * @description 使用生成的 Database 类型提供完整的类型安全
 */
export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Supabase 客户端配置选项接口
 * 
 * @interface
 * @property {boolean} [useServiceRole=false] - 是否使用 Service Role Key（绕过 RLS）
 * @property {boolean} [persistSession=false] - 是否持久化会话
 * @property {boolean} [autoRefreshToken=false] - 是否自动刷新 token
 */
interface SupabaseClientOptions {
    useServiceRole?: boolean; // 是否使用 Service Role Key（绕过 RLS）
    persistSession?: boolean;
    autoRefreshToken?: boolean;
}

/**
 * 创建 Supabase 客户端实例
 * 
 * @param {SupabaseClientOptions} [options={}] - 客户端配置选项
 * @returns {SupabaseClient<Database>} 类型安全的 Supabase 客户端
 * 
 * @throws {Error} 当必需的环境变量未配置时抛出错误
 * 
 * @example
 * const client = createSupabaseClient({ useServiceRole: true });
 */
function createSupabaseClient(
    options: SupabaseClientOptions = {}
): SupabaseClient<Database> {  // 返回完整类型
    const {
        useServiceRole = false,
        persistSession = false,
        autoRefreshToken = false,
    } = options;

    // 验证必需的环境变量
    if (!config.supabase.url) {
        throw new Error('SUPABASE_URL is not configured');
    }

    // 根据选项选择使用的 Key
    const apiKey = useServiceRole
        ? config.supabase.serviceRoleKey
        : config.supabase.anonKey;

    if (!apiKey) {
        const keyType = useServiceRole ? 'SUPABASE_SERVICE_ROLE_KEY' : 'SUPABASE_ANON_KEY';
        throw new Error(`${keyType} is not configured`);
    }

    // 从环境变量读取 environment
    const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';

    // 日志记录（仅开发环境）
    if (isDevelopment) {
        logger.info('Creating Supabase client', {
            url: config.supabase.url,
            useServiceRole,
            persistSession,
        });
    }

    return createClient<Database>(config.supabase.url, apiKey, {
        auth: {
            persistSession,
            autoRefreshToken,
            detectSessionInUrl: false, // API 服务不需要检测 URL 中的 session
            flowType: 'pkce', // 使用 PKCE 流程（更安全）
        },
        db: {
            schema: 'public', // 默认 schema
        },
        global: {
            headers: {
                'x-application-name': config.app.name,
                'x-app-version': config.app.version,
                'x-client-info': 'hono-api', // 用于 Supabase 分析
            },
        },
    });
}

// ==================== 导出客户端实例 ====================

/**
 * 默认 Supabase 客户端（使用 Anon Key）
 * 用于需要遵守 RLS（Row Level Security）的操作
 * 
 * @example
 * ```ts
 * const { data, error } = await supabase
 *   .from('users')
 *   .select('*')
 *   .eq('id', userId);
 * ```
 */
export const supabase: TypedSupabaseClient = createSupabaseClient();

/**
 * Admin Supabase 客户端（使用 Service Role Key）
 * 绕过所有 RLS 策略，拥有完全权限
 * ⚠️ 仅在服务端使用，不要暴露给客户端
 * 
 * @example
 * ```ts
 * // 管理员操作：删除任何用户
 * const { error } = await supabaseAdmin
 *   .from('users')
 *   .delete()
 *   .eq('id', userId);
 * ```
 */
export const supabaseAdmin: TypedSupabaseClient = createSupabaseClient({
    useServiceRole: true,
});

// ==================== 工具函数 ====================

/**
 * 创建带有用户上下文的 Supabase 客户端
 * 用于在已知用户 Token 的情况下执行操作
 * 
 * @param accessToken - 用户的 JWT Access Token
 * @returns 带有用户上下文的 Supabase 客户端
 * 
 * @example
 * ```ts
 * const userClient = createUserClient(userToken);
 * const { data } = await userClient.from('posts').select('*');
 * ```
 */
export function createUserClient(accessToken: string): TypedSupabaseClient {
    const client = createSupabaseClient();

    // 设置用户的 Access Token
    client.auth.setSession({
        access_token: accessToken,
        refresh_token: '', // API 服务通常不需要 refresh token
    });

    return client;
}

/**
 * 健康检查：测试 Supabase 连接
 * @returns 连接是否正常
 */
export async function checkSupabaseHealth(): Promise<boolean> {
    try {
        // 执行一个简单的查询测试连接
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1)
            .single() // 返回单行

        console.log('data:', data)
        console.log('error:', error)
        return !error;
    } catch (err) {
        const error = toError(err);
        logger.error('Supabase health check failed', {
            message: error.message,
            stack: error.stack,
        });
        return false;
    }
}

/**
 * 获取当前 Supabase 客户端配置信息（用于调试）
 * 
 * @returns {Object} 包含 Supabase URL、环境、密钥状态等信息
 * 
 * @example
 * const info = getSupabaseInfo();
 * console.log(info.url); // Supabase URL
 */
export function getSupabaseInfo() {
    return {
        url: config.supabase.url,
        environment: Deno.env.get('ENVIRONMENT') || 'development',
        hasServiceRoleKey: !!config.supabase.serviceRoleKey,
        hasAnonKey: !!config.supabase.anonKey,
    };
}

// ==================== 默认导出 ====================

export default supabase;
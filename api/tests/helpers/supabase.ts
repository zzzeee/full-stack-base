import { createClient } from "@supabase/supabase-js";
import config from "@config/index.ts";

const createSupabaseClient = () => {
    console.log(config.supabase.url, config.supabase.anonKey)
    return createClient(config.supabase.url, config.supabase.anonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
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

export const getLastVerification = async (email: string, purpose: string) => {
    const supabaseClient = createSupabaseClient();
    const { data, error } = await supabaseClient
        .from('email_verification_codes')
        .select('*')
        .eq('email', email)
        .eq('purpose', purpose)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())  // 使用 ISO 字符串
        .maybeSingle();  // 如果没有找到返回 null 而不是错误
    
    console.log('getLastVerification data: ', data)
    console.log('getLastVerification error: ', error)
    return data?.code || '';
} 
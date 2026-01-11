import { createClient } from '@supabase/supabase-js'
import { config } from '../config/index.ts'

// 创建 Supabase 客户端
export const supabaseClient = createClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
        auth: {
            persistSession: false, // API 服务通常不需要持久化
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
        db: {
            schema: 'public' // 默认 schema
        },
        global: {
            headers: {
                'x-application-name': 'hono-api',
                'x-app-version': '1.0.0'
            }
        }
    }
)

// 测试连接
export async function testSupabaseConnection() {
    try {
        // 方法1: 查询一个简单的表（比如 users）
        const { data, error } = await supabaseClient
            .from('users')
            .select('count')
            .limit(1)
            .single()

        // if (error && error.code !== 'PGRST116') { // 忽略表不存在错误
        if (error) { // 忽略表不存在错误
            throw error
        }

        console.log('✅ Supabase 客户端连接成功')
        console.log('data:', data)
        return true
    } catch (error) {
        console.error('❌ Supabase 连接失败:', error instanceof Error ? error.message : String(error))

        // 方法2: 尝试简单的健康检查
        try {
            //   const response = await fetch(`${config.supabase.url}/rest/v1/`, {
            const response = await fetch(`${config.supabase.url}/auth/v1/health`, {
                headers: {
                    'apikey': config.supabase.anonKey
                }
            })
            console.log(`📡 REST API 响应: ${response.status}`)
            response.json().
                then(data => console.log('response json: ', data)).
                catch(() => {
                    response.text().then((txt) => console.log('response text: ', txt));
                })
            return response.ok
        } catch (fetchError) {
            console.error('📡 REST API 也失败:', fetchError instanceof Error ? fetchError.message : String(fetchError))
            return false
        }
    }
}
import { createMiddleware } from 'hono/factory'
import { supabaseClient } from '../lib/supabase.client.ts'
import { error } from '../lib/response.ts'

// JWT认证中间件
export const authMiddleware = createMiddleware(async (c, next) => {
    const authHeader = c.req.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return error('未提供认证令牌', 401)
    }

    const token = authHeader.substring(7)

    try {
        // 验证JWT令牌
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

        if (authError || !user) {
            return error('无效的认证令牌', 401)
        }

        // 将用户信息存储在上下文中
        c.set('user', user)
        c.set('userId', user.id)
        c.set('userEmail', user.email)

        await next()
    } catch (err) {
        console.error('认证错误:', err)
        return error('认证失败', 401)
    }
})

// 获取当前用户（在控制器中使用）
export function getCurrentUser(c: any) {
    const user = c.get('user')
    if (!user) {
        throw new Error('用户未认证')
    }
    return user
}
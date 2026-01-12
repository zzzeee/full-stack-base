import { Context, Next } from '@hono/hono'
import { logger } from '../lib/logger.ts'

export const requestLogger = async (c: Context, next: Next) => {
    const start = Date.now()

    // 获取客户端 IP（支持多种情况）
    const getClientIP = (): string => {
        // 1. 检查 X-Forwarded-For（代理）
        const forwarded = c.req.header('x-forwarded-for')
        if (forwarded) {
            return forwarded.split(',')[0].trim()
        }

        // 2. 检查 CF-Connecting-IP（Cloudflare）
        const cfIP = c.req.header('cf-connecting-ip')
        if (cfIP) return cfIP

        // 3. 检查 True-Client-IP（Akamai）
        const trueClientIP = c.req.header('true-client-ip')
        if (trueClientIP) return trueClientIP

        // 4. 检查 X-Real-IP（Nginx）
        const realIP = c.req.header('x-real-ip')
        if (realIP) return realIP

        // 5. 使用连接的远程地址
        return c.req.header('x-forwarded-for') ||
            c.env?.remoteAddr?.hostname ||
            'unknown'
    }

    const clientIP = getClientIP()

    // 存储到上下文，供后续使用
    c.set('clientIP', clientIP)

    // 记录请求开始
    logger.info('<--', {
        method: c.req.method,
        path: c.req.path,
        ip: clientIP,
        userAgent: c.req.header('user-agent'),
        timestamp: new Date().getTime()
    })

    await next()

    const duration = Date.now() - start

    // 记录请求完成
    logger.info('-->', {
        status: c.res.status,
        duration: `${duration}ms`,
        timestamp: new Date().getTime()
    })
}
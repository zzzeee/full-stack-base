/**
 * @file request-logger.ts
 * @description 请求日志中间件，记录 HTTP 请求和响应的详细信息
 * @author System
 * @createDate 2026-01-25
 */

import { Context, Next } from '@hono/hono'
import { logger } from '[@BASE]/lib/logger.ts'

function redactSensitive(input: unknown): unknown {
    const SENSITIVE_KEYS = new Set([
        'password',
        'old_password',
        'new_password',
        'token',
        'access_token',
        'refresh_token',
    ])

    const visit = (v: unknown): unknown => {
        if (v === null || v === undefined) return v
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v
        if (Array.isArray(v)) return v.map(visit)
        if (typeof v === 'object') {
            const obj = v as Record<string, unknown>
            const out: Record<string, unknown> = {}
            for (const [k, val] of Object.entries(obj)) {
                if (SENSITIVE_KEYS.has(k.toLowerCase())) {
                    out[k] = '***'
                } else {
                    out[k] = visit(val)
                }
            }
            return out
        }
        return String(v)
    }

    return visit(input)
}

/**
 * 请求日志中间件
 * 
 * @param {Context} c - Hono 上下文对象
 * @param {Next} next - 下一个中间件函数
 * 
 * @description
 * 记录请求开始和完成的信息，包括：
 * - 请求方法、路径、客户端 IP、User-Agent
 * - 响应状态码和处理时长
 * 客户端 IP 支持多种代理场景（X-Forwarded-For、CF-Connecting-IP 等）
 * 
 * @example
 * app.use('*', requestLogger);
 */
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
    const requestId = `req_${Math.random().toString(36).slice(2, 10)}`

    // 存储到上下文，供后续使用
    c.set('clientIP', clientIP)
    c.set('requestId', requestId)
    c.header('X-Request-Id', requestId)

    const contentType = c.req.header('content-type') || ''
    // 尝试提前捕获请求体（仅用于 RESPONSE_FAIL，避免二次读取）
    let requestBody: unknown = undefined
    if (contentType.includes('application/json') && c.req.method !== 'GET') {
        try {
            const raw = await c.req.raw.clone().text()
            if (raw && raw.length <= 10_000) {
                requestBody = redactSensitive(JSON.parse(raw))
            }
        } catch {
            // ignore
        }
    }

    let error: unknown = null
    try {
        await next()
    } catch (err) {
        error = err
        throw err
    } finally {
        const duration = Date.now() - start

        // INFO：基础请求日志（简化）
        logger.info('HTTP request', {
            requestId,
            userId: c.get('userId'),
            ip: clientIP,
            context: {
                method: c.req.method,
                url: c.req.url,
                path: c.req.path,
                status: c.res.status,
                duration: duration,
                userAgent: c.req.header('user-agent'),
            },
        })

        // RESPONSE_FAIL：记录所有响应失败数据
        if (c.res.status >= 400) {
            let responseData: unknown = undefined
            try {
                const txt = await c.res.clone().text()
                if (txt && txt.length <= 20_000) {
                    try {
                        responseData = JSON.parse(txt)
                    } catch {
                        responseData = txt
                    }
                }
            } catch {
                // ignore
            }

            logger.responseFail('Response failed', {
                requestId,
                userId: c.get('userId'),
                ip: clientIP,
                error: error instanceof Error
                    ? { type: error.name, message: error.message, stack: error.stack }
                    : (error ? { message: String(error) } : undefined),
                context: {
                    request_method: c.req.method,
                    request_url: c.req.url,
                    request_body: requestBody,
                    header: {
                        userAgent: c.req.header('user-agent'),
                        referer: c.req.header('referer'),
                        contentType,
                        authorization: c.req.header('authorization') ? '***' : undefined,
                    },
                    response_status: c.res.status,
                    response_data: redactSensitive(responseData),
                },
            })
        }
    }
}
import type { Context } from '@hono/hono';

/**
 * 获取客户端 IP 地址
 * @param c - Hono Context
 * @returns string - IP 地址
 */
export function getClientIp(c: Context): string {
    // 优先从 X-Forwarded-For 获取（代理/负载均衡器）
    const forwardedFor = c.req.header('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    // 其次从 X-Real-IP 获取
    const realIp = c.req.header('x-real-ip');
    if (realIp) {
        return realIp;
    }

    // 最后使用默认值
    return '0.0.0.0';
}
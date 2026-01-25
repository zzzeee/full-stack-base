/**
 * @file server.ts
 * @description 服务器工具函数，提供与服务器相关的辅助功能
 * @author System
 * @createDate 2026-01-25
 */

import type { Context } from '@hono/hono';

/**
 * 获取客户端 IP 地址
 * 
 * @param {Context} c - Hono 上下文对象
 * @returns {string} 客户端 IP 地址
 * 
 * @description 从请求头中提取客户端 IP，支持代理和负载均衡器场景
 * 优先级：X-Forwarded-For > X-Real-IP > 默认值 '0.0.0.0'
 * 
 * @example
 * const ip = getClientIp(c);
 * logger.info('Request from', { ip });
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
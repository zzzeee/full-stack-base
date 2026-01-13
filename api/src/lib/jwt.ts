// src/lib/jwt.ts
/**
 * JWT 工具
 * 用于生成和验证 JSON Web Token
 */

import { create, verify, getNumericDate } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';
import type { Payload } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';
import { logger } from './logger.ts';
import type { JwtPayload } from '@/types/auth.types.ts';

/**
 * JWT 配置
 */
const JWT_SECRET = Deno.env.get('JWT_SECRET');
const JWT_EXPIRES_IN = parseInt(Deno.env.get('JWT_EXPIRES_IN') || '604800'); // 7 天

if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
}

/**
 * 加密密钥
 */
const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    true,
    ['sign', 'verify']
);

/**
 * 生成 JWT Token
 * @param payload - Token 载荷
 * @param expiresIn - 过期时间（秒），默认使用环境变量配置
 * @returns Promise<string> - JWT Token
 */
export async function generateToken(
    payload: JwtPayload,
    expiresIn: number = JWT_EXPIRES_IN
): Promise<string> {
    try {
        const jwtPayload: Payload = {
            sub: payload.sub,
            email: payload.email,
            role: payload.role,
            exp: getNumericDate(expiresIn),
            iat: getNumericDate(0), // 当前时间
        };

        const token = await create({ alg: 'HS256', typ: 'JWT' }, jwtPayload, key);

        logger.debug('JWT token generated', {
            userId: payload.sub,
            expiresIn,
        });

        return token;
    } catch (error) {
        logger.error('Failed to generate JWT token', {
            error: error instanceof Error ? error.message : String(error),
        });
        throw new Error('Token 生成失败');
    }
}

/**
 * 验证 JWT Token
 * @param token - JWT Token
 * @returns Promise<JwtPayload> - Token 载荷
 * @throws Error - Token 无效或过期
 */
export async function verifyToken(token: string): Promise<JwtPayload> {
    try {
        const payload = await verify(token, key);

        logger.debug('JWT token verified', {
            userId: payload.sub,
        });

        return {
            sub: payload.sub as string,
            email: payload.email as string,
            role: payload.role as string | undefined,
            iat: payload.iat as number | undefined,
            exp: payload.exp as number | undefined,
        };
    } catch (error) {
        logger.warn('JWT token verification failed', {
            error: error instanceof Error ? error.message : String(error),
        });
        throw new Error('Token 无效或已过期');
    }
}

/**
 * 从请求头中提取 Token
 * @param authorizationHeader - Authorization 请求头
 * @returns string | null - Token 或 null
 */
export function extractTokenFromHeader(
    authorizationHeader: string | null
): string | null {
    if (!authorizationHeader) {
        return null;
    }

    const parts = authorizationHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }

    return parts[1];
}
/**
 * @file jwt.ts
 * @description JWT 工具模块，用于生成和验证 JSON Web Token
 * @author System
 * @createDate 2026-01-25
 */

import { create, verify, getNumericDate } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';
import type { Payload } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';
import { logger } from '[@BASE]/lib/logger.ts';
import type { JwtPayload } from '[@BASE]/types/auth.types.ts';

/**
 * JWT 密钥，从环境变量读取
 * 
 * @constant
 * @description 用于签名和验证 JWT token 的密钥
 */
const JWT_SECRET = Deno.env.get('JWT_SECRET');

/**
 * JWT 过期时间（秒），从环境变量读取，默认 7 天（604800 秒）
 * 
 * @constant
 */
const JWT_EXPIRES_IN = parseInt(Deno.env.get('JWT_EXPIRES_IN') || '604800'); // 7 天

if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
}

/**
 * 加密密钥对象
 * 
 * @constant
 * @description 使用 HMAC SHA-256 算法导入的密钥，用于签名和验证 JWT
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
 * 
 * @param {JwtPayload} payload - Token 载荷，包含用户信息
 * @param {number} [expiresIn=JWT_EXPIRES_IN] - 过期时间（秒），默认使用环境变量配置
 * @returns {Promise<string>} JWT Token 字符串
 * 
 * @throws {Error} 当 token 生成失败时抛出错误
 * 
 * @example
 * const token = await generateToken({
 *   sub: 'user123',
 *   email: 'user@example.com',
 *   role: 'user'
 * });
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
 * 
 * @param {string} token - JWT Token 字符串
 * @returns {Promise<JwtPayload>} Token 载荷，包含用户信息
 * 
 * @throws {Error} 当 Token 无效或过期时抛出错误
 * 
 * @example
 * try {
 *   const payload = await verifyToken(token);
 *   console.log(payload.email); // 用户邮箱
 * } catch (error) {
 *   console.error('Token 验证失败');
 * }
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
 * 
 * @param {string | null} authorizationHeader - Authorization 请求头，格式为 "Bearer <token>"
 * @returns {string | null} 提取的 Token 字符串，如果格式不正确则返回 null
 * 
 * @example
 * const token = extractTokenFromHeader('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
 * // 返回: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
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
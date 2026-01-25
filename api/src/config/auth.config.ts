/**
 * @file auth.config.ts
 * @description 认证配置模块，包含 JWT、密码加密和会话相关配置
 * @author System
 * @createDate 2026-01-25
 */

/**
 * 认证配置对象
 * 
 * @constant
 * @description 包含 JWT 密钥、过期时间、密码加密轮数和会话密钥等配置
 */
export const authConfig = {
    /** JWT 密钥，从 JWT_SECRET 环境变量读取，用于签名和验证 JWT token */
    jwtSecret: Deno.env.get('JWT_SECRET') || '',
    /** JWT 访问令牌过期时间（秒），从 JWT_EXPIRES_IN 环境变量读取，默认 7 天（604800 秒） */
    jwtExpiresIn: parseInt(Deno.env.get('JWT_EXPIRES_IN') || '604800'), // 7天
    /** JWT 刷新令牌过期时间（秒），从 JWT_REFRESH_EXPIRES_IN 环境变量读取，默认 30 天（2592000 秒） */
    jwtRefreshExpiresIn: parseInt(Deno.env.get('JWT_REFRESH_EXPIRES_IN') || '2592000'), // 30天

    /** Bcrypt 加密轮数，从 BCRYPT_ROUNDS 环境变量读取，默认 10 轮 */
    bcryptRounds: parseInt(Deno.env.get('BCRYPT_ROUNDS') || '10'),

    /** 会话密钥，从 SESSION_SECRET 环境变量读取，用于加密会话数据 */
    sessionSecret: Deno.env.get('SESSION_SECRET') || '',
} as const;

/**
 * 验证认证配置
 * 
 * @description 检查 JWT 密钥长度和 Bcrypt 轮数是否符合安全要求
 * 
 * @throws {Error} 当 JWT_SECRET 长度小于 32 个字符时抛出错误
 * 
 * @example
 * validateAuthConfig(); // 验证认证配置是否符合安全要求
 */
export function validateAuthConfig() {
    if (!authConfig.jwtSecret || authConfig.jwtSecret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters');
    }

    if (authConfig.bcryptRounds < 10 || authConfig.bcryptRounds > 12) {
        console.warn('⚠️  BCRYPT_ROUNDS should be between 10-12 for security and performance balance');
    }
}
// src/config/auth.config.ts
/**
 * 认证配置
 */

export const authConfig = {
    jwtSecret: Deno.env.get('JWT_SECRET') || '',
    jwtExpiresIn: parseInt(Deno.env.get('JWT_EXPIRES_IN') || '604800'), // 7天
    jwtRefreshExpiresIn: parseInt(Deno.env.get('JWT_REFRESH_EXPIRES_IN') || '2592000'), // 30天

    // Bcrypt 配置
    bcryptRounds: parseInt(Deno.env.get('BCRYPT_ROUNDS') || '10'),

    // Session 配置
    sessionSecret: Deno.env.get('SESSION_SECRET') || '',
} as const;

export function validateAuthConfig() {
    if (!authConfig.jwtSecret || authConfig.jwtSecret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters');
    }

    if (authConfig.bcryptRounds < 10 || authConfig.bcryptRounds > 12) {
        console.warn('⚠️  BCRYPT_ROUNDS should be between 10-12 for security and performance balance');
    }
}
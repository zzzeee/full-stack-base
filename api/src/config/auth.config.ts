/**
 * @file auth.config.ts
 * @description 认证配置模块（由入口注入运行时变量构建），包含 JWT、密码加密和会话相关配置
 * @author System
 * @createDate 2026-01-25
 */

import type { FullConfig, AuthConfig } from '[@BASE]/types/config.types.ts';

export function FormatAuthConfig(config: FullConfig, newConf: AuthConfig): AuthConfig {
    return {
        jwtSecret: newConf.jwtSecret || config.auth.jwtSecret,
        jwtExpiresIn: newConf.jwtExpiresIn || config.auth.jwtExpiresIn,
        jwtRefreshExpiresIn: newConf.jwtRefreshExpiresIn || config.auth.jwtRefreshExpiresIn,
        bcryptRounds: newConf.bcryptRounds || config.auth.bcryptRounds,
        sessionSecret: newConf.sessionSecret || config.auth.sessionSecret,
    };
}

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
export function ValidateAuthConfig(config: AuthConfig) {
    if (!config.jwtSecret || config.jwtSecret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters');
    }

    if (config.bcryptRounds < 10 || config.bcryptRounds > 12) {
        console.warn('⚠️  BCRYPT_ROUNDS should be between 10-12 for security and performance balance');
    }
}
// src/types/auth.types.ts
/**
 * 认证相关类型定义
 */

import type { Database } from './database.types.ts';
import type { User } from '@supabase/supabase-js';


/**
 * 验证码表类型
 */
export type VerificationCode = Database['public']['Tables']['email_verification_codes']['Row'];
export type VerificationCodeInsert = Database['public']['Tables']['email_verification_codes']['Insert'];

/**
 * 登录日志表类型
 */
export type LoginLog = Database['public']['Tables']['login_logs']['Row'];
export type LoginLogInsert = Database['public']['Tables']['login_logs']['Insert'];

/**
 * 登录方式枚举
 */
export enum LoginMethod {
    PASSWORD = 'password',
    VERIFICATION_CODE = 'verification_code',
    OAUTH = 'oauth',
    SSO = 'sso',
}

/**
 * 验证码用途枚举
 */
export enum VerificationPurpose {
    LOGIN = 'login',
    REGISTER = 'register',
    RESET_PASSWORD = 'reset_password',
    CHANGE_EMAIL = 'change_email',
    VERIFY_EMAIL = 'verify_email',
}

/**
 * 用户状态枚举
 */
export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
    DELETED = 'deleted',
}

/**
 * 登录响应
 */
export interface LoginResponse {
    user: User;
    session: {
        token: string;
        refresh_token?: string;
        expires_at?: string;
    },
}

/**
 * JWT Payload
 */
export interface JwtPayload {
    sub: string;           // 用户 ID
    email: string;         // 邮箱
    role?: string;         // 角色
    iat?: number;          // 签发时间
    exp?: number;          // 过期时间
}

/**
 * 请求上下文中的用户信息
 */
export interface AuthUser {
    id: string;
    email: string;
    role?: string;
}

/**
 * 限流类型
 */
export type RateLimitType = 'email' | 'ip' | 'fingerprint';

/**
 * 限流记录
 */
export interface RateLimitRecord {
    id: string;
    limit_key: string;
    limit_type: RateLimitType;
    request_count: number;
    window_start: string;
    expires_at: string;
    created_at: string;
}

/**
 * 限流检查结果
 */
export interface RateLimitCheckResult {
    allowed: boolean;
    reason?: string;
    retryAfter?: number;
}

/**
 * 设备指纹数据
 */
export interface DeviceFingerprint {
    ip: string;
    userAgent: string;
    deviceId?: string;
}
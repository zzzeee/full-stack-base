/**
 * @file auth.types.ts
 * @description 认证相关类型定义，包含验证码、登录日志、JWT 等类型
 * @author System
 * @createDate 2026-01-25
 */

import type { Database } from '[@BASE]/types/database.types.ts';


/**
 * 验证码表行类型
 * 
 * @typedef {Database['public']['Tables']['email_verification_codes']['Row']} VerificationCode
 */
export type VerificationCode = Database['public']['Tables']['email_verification_codes']['Row'];

/**
 * 验证码表插入类型
 * 
 * @typedef {Database['public']['Tables']['email_verification_codes']['Insert']} VerificationCodeInsert
 */
export type VerificationCodeInsert = Database['public']['Tables']['email_verification_codes']['Insert'];

/**
 * 登录日志表行类型
 * 
 * @typedef {Database['public']['Tables']['login_logs']['Row']} LoginLog
 */
export type LoginLog = Database['public']['Tables']['login_logs']['Row'];

/**
 * 登录日志表插入类型
 * 
 * @typedef {Database['public']['Tables']['login_logs']['Insert']} LoginLogInsert
 */
export type LoginLogInsert = Database['public']['Tables']['login_logs']['Insert'];

/**
 * 登录方式枚举
 * 
 * @enum {string}
 */
export enum LoginMethod {
    /** 密码登录 */
    PASSWORD = 'password',
    /** 验证码登录 */
    VERIFICATION_CODE = 'verification_code',
    /** OAuth 登录 */
    OAUTH = 'oauth',
    /** SSO 单点登录 */
    SSO = 'sso',
}

/**
 * 验证码用途枚举
 * 
 * @enum {string}
 */
export enum VerificationPurpose {
    /** 登录 */
    LOGIN = 'login',
    /** 注册 */
    REGISTER = 'register',
    /** 重置密码 */
    RESET_PASSWORD = 'reset_password',
    /** 更换邮箱 */
    CHANGE_EMAIL = 'change_email',
    /** 验证邮箱 */
    VERIFY_EMAIL = 'verify_email',
}

/**
 * 用户状态枚举
 * 
 * @enum {string}
 */
export enum UserStatus {
    /** 活跃状态 */
    ACTIVE = 'active',
    /** 非活跃状态 */
    INACTIVE = 'inactive',
    /** 已暂停 */
    SUSPENDED = 'suspended',
    /** 已删除 */
    DELETED = 'deleted',
}

/**
 * 登录响应接口
 * 
 * @interface
 * @property {AuthUser} user - 用户信息
 * @property {string} token - JWT 访问令牌
 */
export interface LoginResponse {
    user: {
        id: string;
        email: string;
        name: string;
    };
    token: string;
}

/**
 * JWT Payload 接口
 * 
 * @interface
 * @property {string} sub - 用户 ID（subject）
 * @property {string} email - 用户邮箱
 * @property {string} [role] - 用户角色（可选）
 * @property {number} [iat] - 签发时间（issued at，Unix 时间戳）
 * @property {number} [exp] - 过期时间（expiration，Unix 时间戳）
 */
export interface JwtPayload {
    sub: string;           // 用户 ID
    email: string;         // 邮箱
    role?: string;         // 角色
    iat?: number;          // 签发时间
    exp?: number;          // 过期时间
}

/**
 * 请求上下文中的用户信息接口
 * 
 * @interface
 * @property {string} id - 用户ID
 * @property {string} email - 用户邮箱
 * @property {string} [role] - 用户角色（可选）
 */
export interface AuthUser {
    id: string;
    email: string;
    role?: string;
}

/**
 * 限流类型
 * 
 * @typedef {'email' | 'ip' | 'fingerprint'} RateLimitType
 * @description 限流的维度类型：按邮箱、IP 地址或设备指纹
 */
export type RateLimitType = 'email' | 'ip' | 'fingerprint';

/**
 * 限流记录接口
 * 
 * @interface
 * @property {string} id - 记录ID
 * @property {string} limit_key - 限流键（邮箱、IP 或设备指纹）
 * @property {RateLimitType} limit_type - 限流类型
 * @property {number} request_count - 请求计数
 * @property {string} window_start - 时间窗口开始时间（ISO 字符串）
 * @property {string} expires_at - 过期时间（ISO 字符串）
 * @property {string} created_at - 创建时间（ISO 字符串）
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
 * 限流检查结果接口
 * 
 * @interface
 * @property {boolean} allowed - 是否允许请求
 * @property {string} [reason] - 拒绝原因（可选）
 * @property {number} [retryAfter] - 重试等待时间（秒，可选）
 */
export interface RateLimitCheckResult {
    allowed: boolean;
    reason?: string;
    retryAfter?: number;
}

/**
 * 设备指纹数据接口
 * 
 * @interface
 * @property {string} ip - IP 地址
 * @property {string} userAgent - 用户代理字符串
 * @property {string} [deviceId] - 设备ID（可选）
 */
export interface DeviceFingerprint {
    ip: string;
    userAgent: string;
    deviceId?: string;
}
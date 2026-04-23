/**
 * @file auth.types.ts
 * @description 认证相关类型定义（JWT、登录响应等）
 */

/**
 * 登录方式枚举
 */
export enum LoginMethod {
    PASSWORD = "password",
    VERIFICATION_CODE = "verification_code",
    OAUTH = "oauth",
    SSO = "sso",
}

/**
 * 验证码用途枚举（发送邮箱 OTP 等场景）
 */
export enum VerificationPurpose {
    LOGIN = "login",
    REGISTER = "register",
    RESET_PASSWORD = "reset_password",
    CHANGE_EMAIL = "change_email",
    VERIFY_EMAIL = "verify_email",
}

/**
 * 用户状态枚举
 */
export enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended",
    DELETED = "deleted",
}

/**
 * 登录响应接口
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
 */
export interface JwtPayload {
    sub: string;
    email: string;
    role?: string;
    /** 展会后台 JWT */
    typ?: "expo";
    /** 与会话版本对齐，用于踢下线 */
    sv?: number;
    /** 当前工作展会 */
    eid?: string | null;
    iat?: number;
    exp?: number;
}

/**
 * 请求上下文中的用户信息接口
 */
export interface AuthUser {
    id: string;
    email: string;
    role?: string;
}

/**
 * 限流类型
 */
export type RateLimitType = "email" | "ip" | "fingerprint";

/**
 * 限流记录接口
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
 */
export interface RateLimitCheckResult {
    allowed: boolean;
    reason?: string;
    retryAfter?: number;
}

/**
 * 设备指纹数据接口
 */
export interface DeviceFingerprint {
    ip: string;
    userAgent: string;
    deviceId?: string;
}

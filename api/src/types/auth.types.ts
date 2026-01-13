// src/types/auth.types.ts
/**
 * 认证相关类型定义
 */

import type { Database } from './database.types.ts';

/**
 * 用户表类型
 */
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

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
  user: {
    id: string;
    email: string;
    name: string;
    avatar_url: string | null;
    status: string;
    email_verified: boolean;
  };
  token: string;
  refresh_token?: string;
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
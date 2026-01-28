/**
 * @file user.types.ts
 * @description 用户相关类型定义，包含用户表类型、用户资料和更新数据等类型
 * @author System
 * @createDate 2026-01-25
 */

import type { Database } from '[@BASE]/types/database.types.ts';

/**
 * 用户表行类型
 * 
 * @typedef {Database['public']['Tables']['users']['Row']} User
 */
export type User = Database['public']['Tables']['users']['Row'];

/**
 * 用户表插入类型
 * 
 * @typedef {Database['public']['Tables']['users']['Insert']} UserInsert
 */
export type UserInsert = Database['public']['Tables']['users']['Insert'];

/**
 * 用户表更新类型
 * 
 * @typedef {Database['public']['Tables']['users']['Update']} UserUpdate
 */
export type UserUpdate = Database['public']['Tables']['users']['Update'];

/**
 * 用户公开资料类型（不包含敏感信息）
 * 
 * @typedef {Omit<User, 'password_hash' | 'metadata'>} UserProfile
 * @description 从 User 类型中排除密码哈希和元数据字段，用于公开接口返回
 */
export type UserProfile = Omit<User, 'password_hash' | 'metadata'>;

/**
 * 用户更新数据接口
 * 
 * @interface
 * @property {string} [name] - 用户名称（可选）
 * @property {string} [avatar_url] - 头像URL（可选）
 * @property {string} [bio] - 个人简介（可选）
 * @property {string} [phone] - 手机号（可选）
 */
export interface UserUpdateData {
    name?: string;
    avatar_url?: string;
    bio?: string;
    phone?: string;
}

/**
 * 修改密码数据接口
 * 
 * @interface
 * @property {string} old_password - 旧密码
 * @property {string} new_password - 新密码
 */
export interface ChangePasswordData {
    old_password: string;
    new_password: string;
}
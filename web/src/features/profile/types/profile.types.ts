/**
 * @file profile.types.ts
 * @description 个人中心相关类型定义
 * @author System
 * @createDate 2026-01-25
 */

/**
 * 用户资料接口
 * 
 * @interface
 * @property {string} id - 用户ID
 * @property {string} email - 邮箱地址
 * @property {string} name - 用户名称
 * @property {string | null} avatar_url - 头像URL
 * @property {string | null} bio - 个人简介
 * @property {string | null} phone - 手机号
 * @property {string | null} status - 用户状态
 * @property {boolean | null} email_verified - 邮箱是否已验证
 * @property {string | null} created_at - 创建时间
 * @property {string | null} updated_at - 更新时间
 * @property {string | null} last_login_at - 最后登录时间
 */
export interface UserProfile {
    id: string
    email: string
    name: string
    avatar_url: string | null
    bio: string | null
    phone: string | null
    status: string | null
    email_verified: boolean | null
    created_at: string | null
    updated_at: string | null
    last_login_at: string | null
}

/**
 * 更新用户资料请求数据
 * 
 * @interface
 * @property {string} [name] - 用户名称（可选）
 * @property {string} [bio] - 个人简介（可选）
 * @property {string} [phone] - 手机号（可选）
 */
export interface UpdateProfileData {
    name?: string
    bio?: string
    phone?: string
}

/**
 * 更新头像请求数据
 * 
 * @interface
 * @property {string} avatar_url - 头像URL
 */
export interface UpdateAvatarData {
    avatar_url: string
}

/**
 * 修改密码请求数据
 * 
 * @interface
 * @property {string} old_password - 旧密码
 * @property {string} new_password - 新密码
 */
export interface ChangePasswordData {
    old_password: string
    new_password: string
}

/**
 * 发送邮箱验证码请求数据
 * 
 * @interface
 * @property {string} new_email - 新邮箱地址
 */
export interface SendEmailCodeData {
    new_email: string
}

/**
 * 更换邮箱请求数据
 * 
 * @interface
 * @property {string} new_email - 新邮箱地址
 * @property {string} code - 验证码（6位数字）
 */
export interface ChangeEmailData {
    new_email: string
    code: string
}

// src/types/user.types.ts
/**
 * 用户相关类型定义
 */

import type { User } from './auth.types.ts';

/**
 * 用户公开资料（不包含敏感信息）
 */
export type UserProfile = Omit<User, 'password_hash' | 'metadata'>;

/**
 * 用户更新数据
 */
export interface UserUpdateData {
  name?: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
}

/**
 * 修改密码数据
 */
export interface ChangePasswordData {
  old_password: string;
  new_password: string;
}
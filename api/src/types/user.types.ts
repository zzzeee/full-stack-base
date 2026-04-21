/**
 * @file user.types.ts
 * @description 用户资料类型（public.profiles + Supabase Auth 中的邮箱等）
 */

import type { Database } from "[@BASE]/types/database.types.ts";

/** public.profiles 行类型 */
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/** public.profiles 插入类型 */
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

/** public.profiles 更新类型 */
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

/**
 * API 返回的用户资料（邮箱、手机、验证状态、最后登录来自 Auth）
 */
export interface UserProfile {
    id: string;
    email: string;
    name: string;
    avatar_url: string | null;
    bio: string | null;
    /** 来自 auth.users.phone */
    phone: string | null;
    /** 来自 auth.users.phone_confirmed_at */
    phone_verified: boolean | null;
    status: string | null;
    email_verified: boolean | null;
    created_at: string | null;
    updated_at: string | null;
    last_login_at: string | null;
}

/**
 * 用户更新数据接口（phone 写入 auth.users，其余写入 profiles）
 */
export interface UserUpdateData {
    name?: string;
    avatar_url?: string;
    bio?: string;
    /** 写入 Supabase Auth auth.users.phone */
    phone?: string;
}

/**
 * 修改密码数据接口
 */
export interface ChangePasswordData {
    old_password: string;
    new_password: string;
}

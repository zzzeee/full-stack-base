/**
 * @file supabase-auth.repository.ts
 * @description 封装 Supabase Auth（GoTrue）HTTP API，仅做数据/外部服务访问，不含业务规则。
 */

import type { AdminUserAttributes } from "@supabase/supabase-js";
import supabase, { supabaseAdmin } from "[@BASE]/lib/supabase.client.ts";

/**
 * 服务端通过 Supabase Auth 完成的认证相关调用（OTP、密码、Admin 等）。
 */
export const supabaseAuthRepository = {
  signInWithOtp(email: string) {
    return supabase.auth.signInWithOtp({ email });
  },

  verifyEmailOtp(email: string, token: string) {
    return supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
  },

  signInWithPassword(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  getUserById(id: string) {
    return supabaseAdmin.auth.admin.getUserById(id);
  },

  updateUserById(
    id: string,
    attrs: {
      email?: string;
      password?: string;
      email_confirm?: boolean;
      /** null 表示尝试清空 auth.users.phone（以 GoTrue 实际支持为准） */
      phone?: string | null;
    },
  ) {
    return supabaseAdmin.auth.admin.updateUserById(
      id,
      attrs as AdminUserAttributes,
    );
  },
};

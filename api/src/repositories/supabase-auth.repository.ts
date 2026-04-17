/**
 * @file supabase-auth.repository.ts
 * @description 封装 Supabase Auth（GoTrue）HTTP API，仅做数据/外部服务访问，不含业务规则。
 */

import supabase from "[@BASE]/lib/supabase.client.ts";

/**
 * 服务端通过 Supabase Auth 完成的认证相关调用（OTP、密码等）。
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
};

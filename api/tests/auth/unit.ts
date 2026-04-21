// tests/auth/unit.ts
/**
 * 认证相关的测试单元
 */

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { AUTH_CONF } from "[@BASE-tests]/auth/config.ts";
import { post } from "[@BASE-tests]/helpers/index.ts";

/** 发送邮箱 OTP（Supabase Auth） */
export const sendCodeUnit = async (
    email = AUTH_CONF.email,
    purpose = "login",
) => {
    const response = await post("/api/auth/send-code", {
        email,
        purpose,
    });

    assertEquals(response.status, 200);

    console.log("✅ 验证码发送成功");
};

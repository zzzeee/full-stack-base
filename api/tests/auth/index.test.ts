/**
 * 认证相关的测试
 * tests/auth/index.test.ts
 */

import { sendCodeUnit } from "[@BASE-tests]/auth/unit.ts";

Deno.test("发送邮箱 OTP（Supabase Auth）", async (t) => {
    await t.step(">> 1. 发送验证码", () => sendCodeUnit());
});

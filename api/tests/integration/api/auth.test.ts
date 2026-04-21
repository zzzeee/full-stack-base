// tests/integration/api/auth.test.ts
/**
 * 认证接口集成测试（用户与资料来自 Supabase Auth + public.profiles）
 */

import {
    assertEquals,
    assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { post, randomEmail, randomPassword } from "[@BASE-tests]/helpers/index.ts";
import { supabaseAdmin } from "[@BASE]/lib/supabase.client.ts";

const testUser = {
    email: randomEmail(),
    password: randomPassword(),
    name: "Test User",
};

let authToken = "";

Deno.test("Auth API Integration Tests 003", async (t) => {
    await t.step("setup: create Auth user + profile name", async () => {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: testUser.email,
            password: testUser.password,
            email_confirm: true,
        });
        if (error) throw error;
        assertExists(data.user);
        const { error: upErr } = await supabaseAdmin
            .from("profiles")
            .update({ name: testUser.name })
            .eq("id", data.user.id);
        if (upErr) throw upErr;
    });

    await t.step("POST /api/auth/login/password", async () => {
        const response = await post("/api/auth/login/password", {
            email: testUser.email,
            password: testUser.password,
        });
        assertEquals(response.status, 200);
        assertExists(response.data.data.token);
        authToken = response.data.data.token;
    });

    await t.step("POST /api/auth/send-code (Supabase OTP)", async () => {
        const response = await post("/api/auth/send-code", {
            email: testUser.email,
            purpose: "login",
        });
        assertEquals(response.status, 200);
    });

    await t.step("POST /api/auth/logout", async () => {
        const response = await post("/api/auth/logout", {}, authToken);
        assertEquals(response.status, 200);
    });
});

export { authToken, testUser };

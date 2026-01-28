import {
    assertExists,
} from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { getEmailCode, getLastAnyEmailCode } from "[@BASE-tests]/helpers/supabase.ts";

Deno.test('获取任意邮箱的验证码', async (t) => {
    await t.step('数据库连接测试', async () => {
        const lastCode = await getLastAnyEmailCode()
        
        assertExists(lastCode || undefined)
    })
});

Deno.test('获取指定邮箱验证码', async (t) => {
    await t.step('数据库连接测试', async () => {
        const lastCode = await getEmailCode('test-1768372016442-jkvmdd@example.com', 'register')
        
        assertExists(lastCode || undefined)
    })
});
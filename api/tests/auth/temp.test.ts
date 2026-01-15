import {
    assertExists,
} from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { getLastVerification } from "../helpers/supabase.ts";

Deno.test('临时测试002', async (t) => {
    await t.step('数据库连接测试', async () => {
        const lastCode = await getLastVerification('test-1768372016442-jkvmdd@example.com', 'register')
        
        assertExists(lastCode || undefined)
    })
});
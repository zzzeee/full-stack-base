import { assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { getLastProfileId } from "[@BASE-tests]/helpers/supabase.ts";

Deno.test("读取最近一条 profiles", async (t) => {
    await t.step("数据库连接测试", async () => {
        const id = await getLastProfileId();

        assertExists(id || undefined);
    });
});

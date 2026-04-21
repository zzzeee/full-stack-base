// deno run --env-file=.env --allow-net --allow-env --allow-read scripts/test-db.ts
import config from "[@BASE]/config/index.ts";
import { checkSupabaseHealth, supabase } from "[@BASE]/lib/supabase.client.ts";

console.log("🧪 测试数据库连接...\n");

console.log("1. 📊 配置信息:");
console.log(`   Supabase URL: ${config.supabase.url}`);
console.log(`   环境: ${config.app.environment}\n`);

console.log("2. 🔗 测试 Supabase 连接...");
const supabaseOk = await checkSupabaseHealth();

console.log("\n4. 📋 连接状态汇总:");
console.log(`   Supabase: ${supabaseOk ? "✅ 连接成功" : "❌ 连接失败"}`);

if (!supabaseOk) {
    console.log("\n💡 建议:");
    console.log("   1. 确保 Supabase 已启动: supabase start");
    console.log("   2. 检查 .env 文件配置");
    console.log("   3. 检查网络连接");
    Deno.exit(1);
}

const testReadProfiles = async () => {
    const row = await supabase.from("profiles").select("id").limit(1).maybeSingle();
    console.log("read profiles: ", row);
};

console.log("\n\n测试读取 profiles");
await testReadProfiles();

console.log("\n🎉 所有数据库连接正常！");

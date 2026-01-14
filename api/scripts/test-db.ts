// deno run --env-file=.env --allow-net --allow-env --allow-read scripts/test-db.ts
import { config } from '@config/index.ts'
import { checkSupabaseHealth, supabase } from '../src/lib/supabase.client.ts'

console.log('🧪 测试数据库连接...\n')

console.log('1. 📊 配置信息:')
console.log(`   Supabase URL: ${config.supabase.url}`)
console.log(`   环境: ${config.app.environment}\n`)

console.log('2. 🔗 测试 Supabase 连接...')
const supabaseOk = await checkSupabaseHealth()

console.log('\n4. 📋 连接状态汇总:')
console.log(`   Supabase: ${supabaseOk ? '✅ 连接成功' : '❌ 连接失败'}`)

const testInsertData = async () => {
    const row = await supabase.from('email_verification_codes')
    .insert({
        email: 'test-11111@example.com',
        code: '111111',
        purpose: 'register',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })
    .select()
    .single();
    console.log('insert data: ', row);
}

if (!supabaseOk) {
    console.log('\n💡 建议:')
    console.log('   1. 确保 Supabase 已启动: supabase start')
    console.log('   2. 检查 .env 文件配置')
    console.log('   3. 检查网络连接')
    Deno.exit(1)
}else {
    console.log('\n\n测试插入数据');
    testInsertData()
}

console.log('\n🎉 所有数据库连接正常！')
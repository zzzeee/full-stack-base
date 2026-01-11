// scripts/test-db.ts
import { config } from '../src/config/index.ts'
import { testSupabaseConnection } from '../src/lib/supabase.client.ts'

console.log('🧪 测试数据库连接...\n')

console.log('1. 📊 配置信息:')
console.log(`   Supabase URL: ${config.supabase.url}`)
console.log(`   环境: ${config.app.env}\n`)

console.log('2. 🔗 测试 Supabase 连接...')
const supabaseOk = await testSupabaseConnection()

console.log('\n4. 📋 连接状态汇总:')
console.log(`   Supabase: ${supabaseOk ? '✅ 连接成功' : '❌ 连接失败'}`)

if (!supabaseOk) {
  console.log('\n💡 建议:')
  console.log('   1. 确保 Supabase 已启动: supabase start')
  console.log('   2. 检查 .env 文件配置')
  console.log('   3. 检查网络连接')
  Deno.exit(1)
}

console.log('\n🎉 所有数据库连接正常！')
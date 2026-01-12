// deno run --allow-read --allow-env --env-file=.env scripts/debug-env.ts
console.log('🔍 调试环境变量加载...\n')

// 1. 检查当前工作目录
console.log('1. 当前工作目录:')
console.log(`   ${Deno.cwd()}\n`)

// 2. 检查 .env 文件是否存在
console.log('2. 检查 .env 文件:')
try {
    const stat = await Deno.stat('.env')
    console.log('   ✅ .env 文件存在')
    console.log(`   📁 大小: ${stat.size} bytes`)

    // 读取内容
    const content = await Deno.readTextFile('.env')
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'))
    console.log(`   📄 行数: ${lines.length}`)

    // 显示关键配置（隐藏部分字符）
    lines.forEach(line => {
        const [key, value] = line.split('=')
        if (key && value) {
            const displayValue = key.includes('KEY') || key.includes('SECRET')
                ? `${value.substring(0, 10)}...`
                : value
            console.log(`   ${key.trim()}=${displayValue}`)
        }
    })
} catch {
    console.log('   ❌ .env 文件不存在')
}

// 3. 检查 Deno.env 中的值
console.log('\n3. 当前环境变量:')
const requiredKeys = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
requiredKeys.forEach(key => {
    const value = Deno.env.get(key)
    console.log(`   ${key}=${value ? '已设置' : '未设置'}`)
})

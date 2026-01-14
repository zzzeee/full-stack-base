// deno run --allow-net --allow-read --allow-env --env-file=.env scripts/test-api.ts
import { config } from '@config/index.ts'

const API_BASE = `http://localhost:${config.app.port}`

async function testAPI() {
    console.log('🧪 开始API测试...\n')

    // 1. 健康检查
    console.log('1. 测试健康检查...')
    const healthRes = await fetch(`${API_BASE}/health`)
    const healData = await healthRes.json();
    console.log(`   状态: ${healthRes.status}`)
    console.log(`   响应:`)
    console.log(JSON.stringify(healData, null, 4))

    // 2. 获取验证码
    console.log('\n2. 获取验证码...')
    const captchaRes = await fetch(`${API_BASE}/api/auth/captcha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' })
    })
    const captchaData = await captchaRes.json()
    console.log(`   状态: ${captchaRes.status}`)
    console.log(`   成功:`)
    // console.log(JSON.stringify(captchaData, null, 4))
    const code = getCodeBySvg(captchaData.data.svg || '');
    console.log(`   验证码: ${code}`)

    // 3. 注册新用户
    console.log('\n3. 注册/登录用户...')
    const loginRes = await fetch(`${API_BASE}/api/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'test@example.com',
            otp: code,
            type: 'email',
        })
    })
    const loginData = await loginRes.json()
    console.log(`   状态: ${loginRes.status}`)
    console.log(`   成功:`)
    console.log(JSON.stringify(loginData, null, 4))

    if (loginData.success && loginData.data?.token) {
        const token = loginData.data.token

        // 4. 获取个人资料
        console.log('\n4. 获取个人资料...')
        const profileRes = await fetch(`${API_BASE}/api/users/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        const profileData = await profileRes.json()
        console.log(`   状态: ${profileRes.status}`)
        console.log(`   用户邮箱: ${profileData.data?.email}`)

        // 5. 更新资料
        console.log('\n5. 更新个人资料...')
        const updateRes = await fetch(`${API_BASE}/api/users/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                nickname: '测试用户',
                bio: '这是一个测试用户'
            })
        })
        console.log(`   状态: ${updateRes.status}`)
    }

    console.log('\n✅ API测试完成!')
}

const getCodeBySvg = (svg: string): string => {
    // 解码 Base64
    const decoder = new TextDecoder();
    const svgBytes = Uint8Array.from(atob(svg?.split?.(',')?.[1] || ''), c => c.charCodeAt(0));
    const svgText = decoder.decode(svgBytes);

    // 使用正则表达式提取文本内容
    const regex = /<text[^>]*>[\s\n]*([\d]+)[\s\n]*<\/text>/;
    const result = svgText.match(regex);
    return result?.[1] || '';
}

// 运行测试
if (import.meta.main) {
    testAPI().catch(console.error)
}
// 统一配置管理
export const config = {
    app: {
        port: parseInt(Deno.env.get('PORT') || '3000'),
        env: Deno.env.get('DENO_ENV') || 'development',
        isDev: (Deno.env.get('DENO_ENV') || 'development') === 'development',
        frontendUrl: Deno.env.get('FRONTEND_URL') || 'http://localhost:5173',
    },

    supabase: {
        url: Deno.env.get('SUPABASE_URL') || '',
        anonKey: Deno.env.get('SUPABASE_ANON_KEY') || '',
        serviceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    },

    auth: {
        jwtSecret: Deno.env.get('JWT_SECRET') || 'dev-secret-change-in-prod',
        jwtExpiresIn: '7d',
        otpExpiresIn: 300, // OTP 5分钟过期
        // 邮件模板配置
        emailTemplates: {
            otp: {
                subject: '您的验证码',
                body: (code: string) => `您的验证码是: ${code}，5分钟内有效。`
            }
        }
    },

    cors: {
        allowedOrigins: (Deno.env.get('ALLOWED_ORIGINS') || 'http://localhost:5173').split(','),
    }
}

// 验证必要配置
if (!config.supabase.url || !config.supabase.anonKey) {
    console.error('❌ 错误: 缺少Supabase配置，请检查.env文件')
    Deno.exit(1)
}
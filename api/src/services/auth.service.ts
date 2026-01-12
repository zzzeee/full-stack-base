import { supabaseClient } from '../lib/supabase.client.ts'
import { config } from '../config/index.ts'
import type { VerifyEmailOtpParams, VerifyMobileOtpParams } from '@supabase/auth-js'

export const authService = {
    // 发送短信/邮箱验证码（使用Supabase Auth的OTP）
    async sendOTP(emailOrPhone: string, type: 'sms' | 'email' = 'email') {
        try {
            let result

            if (type === 'email') {
                // 发送邮箱验证码
                result = await supabaseClient.auth.signInWithOtp({
                    email: emailOrPhone,
                    options: {
                        // 重定向URL（验证成功后跳转）
                        emailRedirectTo: `${config.app.frontendUrl}/auth/callback`,
                        // 可以自定义邮件模板
                        data: {
                            purpose: 'login_verification'
                        }
                    }
                })
            } else {
                // 发送短信验证码（需要配置Twilio等短信服务）
                result = await supabaseClient.auth.signInWithOtp({
                    phone: emailOrPhone,
                    options: {
                        // 短信验证码设置
                        channel: 'sms'
                    }
                })
            }

            if (result.error) {
                console.error('发送验证码失败:', result.error)
                throw new Error(`发送验证码失败: ${result.error.message}`)
            }

            return {
                success: true,
                message: type === 'email' ? '验证码已发送到邮箱' : '验证码已发送到手机'
            }
        } catch (error) {
            console.error('发送验证码异常:', error)
            throw error
        }
    },

    // 验证OTP码（用于登录/注册）
    async verifyOTP(emailOrPhone: string, otp: string, type: 'sms' | 'email' = 'email') {
        try {
            let credentials: VerifyEmailOtpParams | VerifyMobileOtpParams
            if (type === 'email') {
                credentials = {
                    email: emailOrPhone,
                    token: otp,
                    type: 'email',
                }
            } else {
                credentials = {
                    phone: emailOrPhone,
                    token: otp,
                    type: 'sms',
                }
            }

            const { data, error } = await supabaseClient.auth.verifyOtp(credentials)

            if (error) {
                console.error('验证码验证失败:', error)
                throw new Error(`验证码错误或已过期: ${error.message}`)
            }

            return {
                success: true,
                session: data.session,
                user: data.user
            }
        } catch (error) {
            console.error('验证码验证异常:', error)
            throw error
        }
    },

    // 生成简单的图形验证码（用于防止机器人，非安全验证）
    generateSimpleCaptcha() {
        // 生成6位随机数字
        const code = Math.floor(100000 + Math.random() * 900000).toString()

        // 简单的SVG生成
        const width = 120
        const height = 40
        // svg 字符中不要出现中文, 不然btoa会出错
        const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8f9fa"/>
        <text x="50%" y="60%" font-family="monospace" font-size="24" 
              text-anchor="middle" fill="#495057" font-weight="bold"
              style="user-select: none;">
          ${code}
        </text>
        <line x1="10" y1="${Math.random() * height}" 
              x2="${width - 10}" y2="${Math.random() * height}" 
              stroke="#dee2e6" stroke-width="1"/>
        <line x1="10" y1="${Math.random() * height}" 
              x2="${width - 10}" y2="${Math.random() * height}" 
              stroke="#dee2e6" stroke-width="1"/>
        ${Array.from({ length: 30 }, (_, i) => `
          <circle key="circle-${i}" cx="${Math.random() * width}" 
                  cy="${Math.random() * height}" 
                  r="1" fill="#adb5bd"/>
        `).join('')}
      </svg>
    `

        return {
            code,
            svg: `data:image/svg+xml;base64,${btoa(svg)}`,
            expiresAt: Date.now() + (5 * 60 * 1000) // 5分钟过期
        }
    },

    // 刷新访问令牌
    async refreshToken(refreshToken: string) {
        const { data, error } = await supabaseClient.auth.refreshSession({
            refresh_token: refreshToken
        })

        if (error) {
            throw new Error(`令牌刷新失败: ${error.message}`)
        }

        return data.session
    }
}
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authService } from '../services/auth.service.ts'
import { userService } from '../services/user.service.ts'
import { success, error } from '../lib/response.ts'

const authController = new Hono()

// 验证码请求Schema
const otpRequestSchema = z.object({
    email: z.string().email().optional(),
    phone: z.string().regex(/^1[3-9]\d{9}$/).optional(),
    type: z.enum(['email', 'sms']).default('email')
}).refine(data => data.email || data.phone, {
    message: '必须提供邮箱或手机号'
})

// 图形验证码请求Schema（防机器人）
const captchaRequestSchema = z.object({
    type: z.enum(['login', 'register']).default('login')
})

// OTP验证Schema
const verifyOTPSchema = z.object({
    email: z.string().email().optional(),
    phone: z.string().regex(/^1[3-9]\d{9}$/).optional(),
    otp: z.string().length(6),
    type: z.enum(['email', 'sms']).default('email')
}).refine(data => data.email || data.phone, {
    message: '必须提供邮箱或手机号'
})

// 密码登录Schema
const passwordLoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    captchaCode: z.string().optional() // 图形验证码（可选）
})

// 1. 发送OTP验证码接口
authController.post('/otp/send', zValidator('json', otpRequestSchema), async (c) => {
    const { email, phone, type } = c.req.valid('json')

    try {
        const identifier = email || phone!
        const result = await authService.sendOTP(identifier, type)

        return success(result, '验证码发送成功')
    } catch (err) {
        console.error('发送验证码失败:', err)
        return error(err.message || '发送失败', 400)
    }
})

// 2. 验证OTP并登录/注册
authController.post('/otp/verify', zValidator('json', verifyOTPSchema), async (c) => {
    const { email, phone, otp, type } = c.req.valid('json')

    try {
        const identifier = email || phone!
        const otpResult = await authService.verifyOTP(identifier, otp, type)

        if (!otpResult.user) {
            return error('用户信息获取失败', 500)
        }

        // 获取或创建用户资料
        let userProfile = await userService.findByEmail(otpResult.user.email!)

        if (!userProfile) {
            // 新用户自动注册
            userProfile = await userService.create({
                email: otpResult.user.email!,
                password: Math.random().toString(36).slice(-10), // 生成随机密码
                nickname: otpResult.user.user_metadata?.nickname || otpResult.user.email!.split('@')[0]
            })
        }

        return success({
            user: userProfile,
            token: otpResult.session?.access_token
        }, '登录成功')
    } catch (err) {
        console.error('OTP验证失败:', err)
        return error(err.message || '验证失败', 400)
    }
})

// 3. 获取图形验证码（防机器人）
authController.post('/captcha', zValidator('json', captchaRequestSchema), async (c) => {
    const { type } = c.req.valid('json')
    const captcha = authService.generateSimpleCaptcha()

    // 这里可以将 captcha.code 存储到Redis或Session中
    // 用于后续验证

    return success({
        svg: captcha.svg,
        key: `${type}:${Date.now()}`, // 生成一个key用于验证
        expiresIn: 300 // 5分钟
    }, '验证码获取成功')
})

// 4. 密码登录接口
authController.post('/password/login', zValidator('json', passwordLoginSchema), async (c) => {
    const { email, password } = c.req.valid('json')

    try {
        const result = await userService.loginOrRegister({ email, password })

        return success({
            user: result.user,
            token: result.token
        }, '登录成功')
    } catch (err) {
        console.error('密码登录失败:', err)
        return error(err.message || '登录失败', 400)
    }
})

export default authController
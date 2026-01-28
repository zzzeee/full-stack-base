/**
 * @file login-form.tsx
 * @description 登录表单组件，支持密码登录和验证码登录两种方式
 * @author System
 * @createDate 2024-01-01
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Mail, Lock, KeyRound, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { Button } from "[@BASE]/components/ui/button"
import { Input } from "[@BASE]/components/ui/input"
import { Label } from "[@BASE]/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "[@BASE]/components/ui/card"
import { authService } from "../services/auth.service"
import { useAuthStore } from "../stores/auth.store"

/**
 * 密码登录表单验证 Schema
 * @constant
 */
const passwordSchema = z.object({
    email: z.email("请输入有效的邮箱地址"),
    password: z.string().min(6, "密码至少6位字符"),
})

/**
 * 验证码登录表单验证 Schema
 * @constant
 */
const codeSchema = z.object({
    email: z.email("请输入有效的邮箱地址"),
    code: z.string().length(6, "验证码必须是6位数字"),
})

/**
 * 密码登录表单数据类型
 * @typedef {Object} PasswordFormData
 */
type PasswordFormData = z.infer<typeof passwordSchema>

/**
 * 验证码登录表单数据类型
 * @typedef {Object} CodeFormData
 */
type CodeFormData = z.infer<typeof codeSchema>

/**
 * 登录表单组件
 *
 * @component
 * @description 提供密码登录和验证码登录两种登录方式，支持表单验证、错误处理和状态管理
 *
 * @returns {JSX.Element} 登录表单组件
 *
 * @example
 * <LoginForm />
 */
export function LoginForm() {
    const router = useRouter()
    const login = useAuthStore((state) => state.login)

    const [mode, setMode] = useState<"password" | "code">("password")
    const [isLoading, setIsLoading] = useState(false)
    const [isSendingCode, setIsSendingCode] = useState(false)
    const [codeSent, setCodeSent] = useState(false)
    const [countdown, setCountdown] = useState(0)

    // 密码登录表单
    const passwordForm = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { email: "", password: "" },
    })

    // 验证码登录表单
    const codeForm = useForm<CodeFormData>({
        resolver: zodResolver(codeSchema),
        defaultValues: { email: "", code: "" },
    })

    /**
     * 处理密码登录
     *
     * @param {PasswordFormData} data - 登录表单数据
     * @returns {Promise<void>}
     */
    const handlePasswordLogin = async (data: PasswordFormData) => {
        setIsLoading(true)

        try {
            const response = await authService.loginWithPassword(data)

            // 保存用户信息和 token 到 Zustand store
            login(response.user, response.token)

            toast.success("登录成功")

            // 跳转到主页
            router.push("/")
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "登录失败，请重试"
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * 处理验证码登录
     *
     * @param {CodeFormData} data - 验证码登录表单数据
     * @returns {Promise<void>}
     */
    const handleCodeLogin = async (data: CodeFormData) => {
        setIsLoading(true)

        try {
            const response = await authService.loginWithCode(data)

            // 保存用户信息和 token 到 Zustand store
            login(response.user, response.token)

            toast.success("登录成功")

            // 跳转到主页
            router.push("/")
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "登录失败，请重试"
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * 发送验证码
     *
     * @description 验证邮箱格式后发送验证码，并启动60秒倒计时
     * @returns {Promise<void>}
     */
    const handleSendCode = async () => {
        const email = codeForm.getValues("email")

        if (!email) {
            codeForm.setError("email", { message: "请输入邮箱地址" })
            return
        }

        // 验证邮箱格式
        const emailValidation = z.email().safeParse(email)
        if (!emailValidation.success) {
            codeForm.setError("email", { message: "请输入有效的邮箱地址!" })
            return
        }

        setIsSendingCode(true)

        try {
            await authService.sendVerificationCode(email)

            setCodeSent(true)
            setCountdown(60)
            
            toast.success('验证码已发送到您的邮箱')

            // 倒计时
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer)
                        setCodeSent(false)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "发送验证码失败"
            toast.error(errorMessage)
        } finally {
            setIsSendingCode(false)
        }
    }

    /**
     * 切换登录模式
     *
     * @description 在密码登录和验证码登录之间切换，重置表单和状态
     */
    const toggleMode = () => {
        setMode(mode === "password" ? "code" : "password")
        passwordForm.reset()
        codeForm.reset()
        setCodeSent(false)
        setCountdown(0)
    }

    return (
        <Card className="border-none shadow-2xl w-[90%] max-w-md">
            <CardHeader className="space-y-1 p-8 pb-0">
                <CardTitle className="text-2xl font-bold">欢迎回来</CardTitle>
                <CardDescription>
                    使用{mode === "password" ? "密码" : "验证码"}登录您的账户
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 p-8">
                {/* 密码登录表单 */}
                {mode === "password" && (
                    <form onSubmit={passwordForm.handleSubmit(handlePasswordLogin)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" required>
                                邮箱地址
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="text"
                                    className="pl-10"
                                    error={!!passwordForm.formState.errors.email}
                                    {...passwordForm.register("email")}
                                />
                            </div>
                            {passwordForm.formState.errors.email && (
                                <p className="text-xs text-destructive">
                                    {passwordForm.formState.errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" required>
                                密码
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    className="pl-10"
                                    error={!!passwordForm.formState.errors.password}
                                    {...passwordForm.register("password")}
                                />
                            </div>
                            {passwordForm.formState.errors.password && (
                                <p className="text-xs text-destructive">
                                    {passwordForm.formState.errors.password.message}
                                </p>
                            )}
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full" isLoading={isLoading}>
                                {isLoading ? "登录中..." : "登录"}
                                {!isLoading && <ArrowRight className="h-4 w-4" />}
                            </Button>
                        </div>
                    </form>
                )}

                {/* 验证码登录表单 */}
                {mode === "code" && (
                    <form onSubmit={codeForm.handleSubmit(handleCodeLogin)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email-code" required>
                                邮箱地址
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email-code"
                                    type="text"
                                    className="pl-10"
                                    error={!!codeForm.formState.errors.email}
                                    {...codeForm.register("email")}
                                />
                            </div>
                            {codeForm.formState.errors.email && (
                                <p className="text-xs text-destructive">
                                    {codeForm.formState.errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="code" required>
                                验证码
                            </Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="code"
                                        type="text"
                                        maxLength={6}
                                        className="pl-10"
                                        error={!!codeForm.formState.errors.code}
                                        {...codeForm.register("code")}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleSendCode}
                                    disabled={isSendingCode || codeSent}
                                    className="w-24 shrink-0"
                                    isLoading={isSendingCode}
                                >
                                    {isSendingCode
                                        ? "发送中"
                                        : codeSent
                                            ? `${countdown}s`
                                            : "发送"}
                                </Button>
                            </div>
                            {codeForm.formState.errors.code && (
                                <p className="text-xs text-destructive">
                                    {codeForm.formState.errors.code.message}
                                </p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" isLoading={isLoading}>
                            {isLoading ? "登录中..." : "登录"}
                            {!isLoading && <ArrowRight className="h-4 w-4" />}
                        </Button>
                    </form>
                )}

                {/* 切换登录模式 */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">或</span>
                    </div>
                </div>

                <Button
                    type="button"
                    variant="ghost"
                    onClick={toggleMode}
                    className="w-full"
                >
                    {mode === "password" ? "使用验证码登录" : "使用密码登录"}
                </Button>

                {/* 底部提示 */}
                <p className="text-center text-xs text-muted-foreground">
                    登录即表示您同意我们的{" "}
                    <a href="#" className="underline hover:text-primary">
                        服务条款
                    </a>{" "}
                    和{" "}
                    <a href="#" className="underline hover:text-primary">
                        隐私政策
                    </a>
                </p>
            </CardContent>
        </Card>
    )
}
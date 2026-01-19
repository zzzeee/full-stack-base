"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Mail, Lock, KeyRound, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"

// 验证 Schema
const passwordSchema = z.object({
    email: z.string().email("请输入有效的邮箱地址"),
    password: z.string().min(6, "密码至少6位字符"),
})

const codeSchema = z.object({
    email: z.string().email("请输入有效的邮箱地址"),
    code: z.string().length(6, "验证码必须是6位数字"),
})

type PasswordFormData = z.infer<typeof passwordSchema>
type CodeFormData = z.infer<typeof codeSchema>

export function LoginForm() {
    const router = useRouter()
    const [mode, setMode] = useState<"password" | "code">("password")
    const [isLoading, setIsLoading] = useState(false)
    const [isSendingCode, setIsSendingCode] = useState(false)
    const [error, setError] = useState<string | null>(null)
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

    // 密码登录处理
    const handlePasswordLogin = async (data: PasswordFormData) => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch("/api/auth/login/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "登录失败")
            }

            const result = await response.json()
            console.log("登录成功:", result)

            // 这里应该保存 token 和用户信息
            // useAuthStore.getState().login(result.user, result.token)

            router.push("/dashboard")
        } catch (err) {
            setError(err instanceof Error ? err.message : "登录失败，请重试")
        } finally {
            setIsLoading(false)
        }
    }

    // 验证码登录处理
    const handleCodeLogin = async (data: CodeFormData) => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch("/api/auth/login/code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "登录失败")
            }

            const result = await response.json()
            console.log("登录成功:", result)

            router.push("/dashboard")
        } catch (err) {
            setError(err instanceof Error ? err.message : "登录失败，请重试")
        } finally {
            setIsLoading(false)
        }
    }

    // 发送验证码
    const handleSendCode = async () => {
        const email = codeForm.getValues("email")

        if (!email) {
            codeForm.setError("email", { message: "请输入邮箱地址" })
            return
        }

        // 验证邮箱格式
        const emailValidation = z.string().email().safeParse(email)
        if (!emailValidation.success) {
            codeForm.setError("email", { message: "请输入有效的邮箱地址" })
            return
        }

        setIsSendingCode(true)
        setError(null)

        try {
            const response = await fetch("/api/auth/send-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "发送验证码失败")
            }

            setCodeSent(true)
            setCountdown(60)

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
            setError(err instanceof Error ? err.message : "发送验证码失败")
        } finally {
            setIsSendingCode(false)
        }
    }

    // 切换登录模式
    const toggleMode = () => {
        setMode(mode === "password" ? "code" : "password")
        setError(null)
        passwordForm.reset()
        codeForm.reset()
        setCodeSent(false)
        setCountdown(0)
    }

    return (
        <Card className="border-none shadow-2xl">
            <CardHeader className="space-y-1 p-8 pb-0">
                <CardTitle className="text-2xl font-bold">欢迎回来</CardTitle>
                <CardDescription>
                    使用{mode === "password" ? "密码" : "验证码"}登录您的账户
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 p-8">
                {/* 错误提示 */}
                {error && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-start gap-2">
                        <svg
                            className="h-5 w-5 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

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
                                    // placeholder="your@email.com"
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
                                    // placeholder="••••••••"
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

                        <Button type="submit" className="w-full" isLoading={isLoading}>
                            {isLoading ? "登录中..." : "登录"}
                            {!isLoading && <ArrowRight className="h-4 w-4" />}
                        </Button>
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
                                    // placeholder="your@email.com"
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
                                        // placeholder="请输入6位验证码"
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
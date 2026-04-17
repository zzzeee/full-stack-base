"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Mail, Smartphone, Lock, Edit2 } from "lucide-react"
import { Button } from "[@BASE]/components/ui/button"
import { Input } from "[@BASE]/components/ui/input"
import { Label } from "[@BASE]/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "[@BASE]/components/ui/card"
import { profileService } from "[@BASE]/features/profile/services/profile.service"
import type { UserProfile } from "[@BASE]/features/profile/types/profile.types"
import { useAuthStore } from "[@BASE]/features/auth/stores/auth.store"
import { toast } from "sonner"

const passwordSchema = z
    .object({
        old_password: z.string().min(1, "旧密码不能为空"),
        new_password: z
            .string()
            .min(8, "新密码至少8个字符")
            .max(100, "新密码最多100个字符")
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                "新密码必须包含大小写字母和数字",
            ),
    })
    .refine((data) => data.old_password !== data.new_password, {
        message: "新密码不能与旧密码相同",
        path: ["new_password"],
    })

const emailSchema = z.object({
    new_email: z.string().email("邮箱格式不正确"),
    code: z.string().regex(/^\d{6}$/, "验证码必须是6位数字"),
})

const phoneSchema = z.object({
    phone: z.string().refine(
        (v) => v === "" || /^1[3-9]\d{9}$/.test(v),
        "请输入11位中国大陆手机号或留空",
    ),
})

type PasswordFormData = z.infer<typeof passwordSchema>
type EmailFormData = z.infer<typeof emailSchema>
type PhoneFormData = z.infer<typeof phoneSchema>

type Props = {
    profile: UserProfile
    onProfileRefresh: () => Promise<void>
}

export function SecurityTab({ profile, onProfileRefresh }: Props) {
    const { login, logout } = useAuthStore()
    const authUser = useAuthStore((s) => s.user)

    const [isChangingEmail, setIsChangingEmail] = useState(false)
    const [emailCodeSent, setEmailCodeSent] = useState(false)
    const [emailCountdown, setEmailCountdown] = useState(0)
    const [isSendingEmailCode, setIsSendingEmailCode] = useState(false)

    const passwordForm = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { old_password: "", new_password: "" },
    })

    const emailForm = useForm<EmailFormData>({
        resolver: zodResolver(emailSchema),
        defaultValues: { new_email: "", code: "" },
    })

    const phoneForm = useForm<PhoneFormData>({
        resolver: zodResolver(phoneSchema),
        defaultValues: { phone: profile.phone ?? "" },
    })

    useEffect(() => {
        phoneForm.reset({ phone: profile.phone ?? "" })
        // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅在服务端返回的手机号变化时同步表单
    }, [profile.phone])

    useEffect(() => {
        if (emailCountdown > 0) {
            const t = setTimeout(() => setEmailCountdown((c) => c - 1), 1000)
            return () => clearTimeout(t)
        }
    }, [emailCountdown])

    const handleSendEmailCode = async () => {
        const newEmail = emailForm.getValues("new_email")
        if (!newEmail) {
            emailForm.setError("new_email", { message: "请先输入新邮箱" })
            return
        }
        try {
            setIsSendingEmailCode(true)
            await profileService.sendEmailCode({ new_email: newEmail })
            setEmailCodeSent(true)
            setEmailCountdown(60)
            toast.success("验证码已发送到新邮箱")
        } catch (err) {
            emailForm.setError("new_email", {
                message: err instanceof Error ? err.message : "发送验证码失败",
            })
        } finally {
            setIsSendingEmailCode(false)
        }
    }

    const handleChangeEmail = async (data: EmailFormData) => {
        try {
            const result = await profileService.changeEmail(data)
            await onProfileRefresh()
            setIsChangingEmail(false)
            setEmailCodeSent(false)
            emailForm.reset()
            if (authUser) {
                login(
                    { ...authUser, email: result.email },
                    useAuthStore.getState().token || "",
                )
            }
            toast.success("邮箱已更新")
        } catch (err) {
            emailForm.setError("code", {
                message: err instanceof Error ? err.message : "更换邮箱失败",
            })
        }
    }

    const handleChangePassword = async (data: PasswordFormData) => {
        try {
            await profileService.changePassword(data)
            passwordForm.reset()
            toast.success("密码已修改，请重新登录")
            logout()
            window.location.href = "/login"
        } catch (err) {
            passwordForm.setError("old_password", {
                message: err instanceof Error ? err.message : "修改密码失败",
            })
        }
    }

    const handleSavePhone = async (data: PhoneFormData) => {
        try {
            await profileService.updateProfile({
                phone: data.phone === "" ? undefined : data.phone,
            })
            await onProfileRefresh()
            toast.success("手机号已更新")
        } catch (err) {
            phoneForm.setError("phone", {
                message: err instanceof Error ? err.message : "更新失败",
            })
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Mail className="h-5 w-5" />
                        邮箱
                    </CardTitle>
                    <CardDescription>更换登录邮箱需验证新邮箱</CardDescription>
                </CardHeader>
                <CardContent>
                    {isChangingEmail ? (
                        <form
                            onSubmit={emailForm.handleSubmit(handleChangeEmail)}
                            className="space-y-4"
                        >
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Input
                                    {...emailForm.register("new_email")}
                                    type="email"
                                    placeholder="新邮箱"
                                    error={!!emailForm.formState.errors.new_email}
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleSendEmailCode}
                                    disabled={isSendingEmailCode || emailCountdown > 0}
                                >
                                    {emailCountdown > 0
                                        ? `${emailCountdown}s`
                                        : "发送验证码"}
                                </Button>
                            </div>
                            {emailForm.formState.errors.new_email && (
                                <p className="text-sm text-destructive">
                                    {emailForm.formState.errors.new_email.message}
                                </p>
                            )}
                            {emailCodeSent && (
                                <Input
                                    {...emailForm.register("code")}
                                    placeholder="6 位验证码"
                                    maxLength={6}
                                />
                            )}
                            <div className="flex gap-2">
                                <Button type="submit" disabled={!emailCodeSent}>
                                    确认更换
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsChangingEmail(false)
                                        setEmailCodeSent(false)
                                        emailForm.reset()
                                    }}
                                >
                                    取消
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="font-medium">{profile.email}</p>
                                <p className="text-sm text-muted-foreground">
                                    {profile.email_verified ? "已验证" : "未验证"}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsChangingEmail(true)}
                            >
                                <Edit2 className="h-4 w-4 mr-1" />
                                更换邮箱
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Smartphone className="h-5 w-5" />
                        手机号码
                    </CardTitle>
                    <CardDescription>
                        用于安全校验与找回，需符合中国大陆 11 位手机号格式
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={phoneForm.handleSubmit(handleSavePhone)}
                        className="flex flex-col gap-4 sm:flex-row sm:items-end"
                    >
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="phone">手机号</Label>
                            <Input
                                id="phone"
                                {...phoneForm.register("phone")}
                                placeholder="11 位手机号，留空可清空"
                                error={!!phoneForm.formState.errors.phone}
                            />
                            {phoneForm.formState.errors.phone && (
                                <p className="text-sm text-destructive">
                                    {phoneForm.formState.errors.phone.message}
                                </p>
                            )}
                        </div>
                        <Button type="submit">保存</Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Lock className="h-5 w-5" />
                        登录密码
                    </CardTitle>
                    <CardDescription>修改后需使用新密码重新登录</CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={passwordForm.handleSubmit(handleChangePassword)}
                        className="space-y-4 max-w-md"
                    >
                        <div className="space-y-2">
                            <Label>当前密码</Label>
                            <Input
                                type="password"
                                {...passwordForm.register("old_password")}
                                error={!!passwordForm.formState.errors.old_password}
                            />
                            {passwordForm.formState.errors.old_password && (
                                <p className="text-sm text-destructive">
                                    {passwordForm.formState.errors.old_password.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>新密码</Label>
                            <Input
                                type="password"
                                {...passwordForm.register("new_password")}
                                error={!!passwordForm.formState.errors.new_password}
                            />
                            {passwordForm.formState.errors.new_password && (
                                <p className="text-sm text-destructive">
                                    {passwordForm.formState.errors.new_password.message}
                                </p>
                            )}
                        </div>
                        <Button type="submit">更新密码</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

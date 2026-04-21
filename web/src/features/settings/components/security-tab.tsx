"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Mail, Smartphone, Lock } from "lucide-react"
import { Button } from "[@BASE]/components/ui/button"
import { Input } from "[@BASE]/components/ui/input"
import { Label } from "[@BASE]/components/ui/label"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "[@BASE]/components/ui/card"
import { profileService } from "[@BASE]/features/profile/services/profile.service"
import type { UserProfile } from "[@BASE]/features/profile/types/profile.types"
import { useAuthStore } from "[@BASE]/features/auth/stores/auth.store"
import { toast } from "sonner"
import { cn } from "[@BASE]/lib/utils/cn"

const passwordSchema = z
    .object({
        old_password: z.string().min(1, "原密码不能为空"),
        new_password: z
            .string()
            .min(8, "新密码至少8个字符")
            .max(100, "新密码最多100个字符")
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                "新密码必须包含大小写字母和数字",
            ),
        confirm_password: z.string().min(1, "请再次输入新密码"),
    })
    .refine((data) => data.old_password !== data.new_password, {
        message: "新密码不能与旧密码相同",
        path: ["new_password"],
    })
    .refine((data) => data.new_password === data.confirm_password, {
        message: "两次输入的新密码不一致",
        path: ["confirm_password"],
    })

const emailSchema = z.object({
    new_email: z.string().email("邮箱格式不正确"),
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

type StatusTagTone = "success" | "warning" | "muted"

function StatusTag({
    children,
    tone,
}: {
    children: ReactNode
    tone: StatusTagTone
}) {
    return (
        <span
            className={cn(
                "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                tone === "success" &&
                    "bg-emerald-500/15 text-emerald-800 dark:text-emerald-400",
                tone === "warning" &&
                    "bg-amber-500/15 text-amber-900 dark:text-amber-400",
                tone === "muted" && "bg-muted text-muted-foreground",
            )}
        >
            {children}
        </span>
    )
}

type Props = {
    profile: UserProfile
    onProfileRefresh: () => Promise<void>
}

export function SecurityTab({ profile, onProfileRefresh }: Props) {
    const { login, logout } = useAuthStore()
    const authUser = useAuthStore((s) => s.user)

    const [isChangingEmail, setIsChangingEmail] = useState(false)
    const [isChangingPhone, setIsChangingPhone] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)

    const passwordForm = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            old_password: "",
            new_password: "",
            confirm_password: "",
        },
    })

    const emailForm = useForm<EmailFormData>({
        resolver: zodResolver(emailSchema),
        defaultValues: { new_email: "" },
    })

    const phoneForm = useForm<PhoneFormData>({
        resolver: zodResolver(phoneSchema),
        defaultValues: { phone: profile.phone ?? "" },
    })

    useEffect(() => {
        phoneForm.reset({ phone: profile.phone ?? "" })
        // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅同步服务端手机号
    }, [profile.phone])

    const emailDisplay =
        profile.email?.trim() !== "" ? profile.email : "未填写"
    const phoneDisplay =
        profile.phone?.trim() !== "" ? profile.phone! : "未填写"

    const emailTag = profile.email_verified ? (
        <StatusTag tone="success">已验证</StatusTag>
    ) : (
        <StatusTag tone="warning">未验证</StatusTag>
    )

    const phoneTag =
        !profile.phone?.trim() ? (
            <StatusTag tone="muted">未绑定</StatusTag>
        ) : profile.phone_verified ? (
            <StatusTag tone="success">已验证</StatusTag>
        ) : (
            <StatusTag tone="warning">未验证</StatusTag>
        )

    const handleChangeEmail = async (data: EmailFormData) => {
        try {
            const result = await profileService.changeEmail({
                new_email: data.new_email,
            })
            await onProfileRefresh()
            setIsChangingEmail(false)
            emailForm.reset()
            if (authUser) {
                login(
                    { ...authUser, email: result.email },
                    useAuthStore.getState().token || "",
                )
            }
            toast.success(
                "已提交新邮箱，请查收邮件并在 Supabase Auth 流程中完成确认",
            )
        } catch (err) {
            emailForm.setError("new_email", {
                message: err instanceof Error ? err.message : "更换邮箱失败",
            })
        }
    }

    const handleSavePhone = async (data: PhoneFormData) => {
        try {
            await profileService.updateProfile({
                phone: data.phone === "" ? undefined : data.phone,
            })
            await onProfileRefresh()
            setIsChangingPhone(false)
            toast.success("手机号已更新")
        } catch (err) {
            phoneForm.setError("phone", {
                message: err instanceof Error ? err.message : "更新失败",
            })
        }
    }

    const handleChangePassword = async (data: PasswordFormData) => {
        try {
            await profileService.changePassword({
                old_password: data.old_password,
                new_password: data.new_password,
            })
            passwordForm.reset()
            setIsChangingPassword(false)
            toast.success("密码已修改，请重新登录")
            logout()
            window.location.href = "/login"
        } catch (err) {
            passwordForm.setError("old_password", {
                message: err instanceof Error ? err.message : "修改密码失败",
            })
        }
    }

    const cancelPasswordEdit = () => {
        setIsChangingPassword(false)
        passwordForm.reset()
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <Mail className="h-5 w-5" />
                        邮箱
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isChangingEmail ? (
                        <form
                            onSubmit={emailForm.handleSubmit(handleChangeEmail)}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="new_email"></Label>
                                <Input
                                    id="new_email"
                                    {...emailForm.register("new_email")}
                                    type="email"
                                    placeholder="输入新邮箱"
                                    error={
                                        !!emailForm.formState.errors.new_email
                                    }
                                />
                                {emailForm.formState.errors.new_email && (
                                    <p className="text-sm text-destructive">
                                        {
                                            emailForm.formState.errors.new_email
                                                .message
                                        }
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2 justify-end">
                                <Button type="submit">保存</Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsChangingEmail(false)
                                        emailForm.reset()
                                    }}
                                >
                                    取消
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="min-w-0 flex-1 space-y-2">
                                <p
                                    className={cn(
                                        "truncate text-base font-medium",
                                        emailDisplay === "未填写" &&
                                            "text-muted-foreground",
                                    )}
                                >
                                    {emailDisplay}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                    {emailTag}
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsChangingEmail(true)}
                            >
                                更改
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <Smartphone className="h-5 w-5" />
                        手机
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isChangingPhone ? (
                        <form
                            onSubmit={phoneForm.handleSubmit(handleSavePhone)}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="phone"></Label>
                                <Input
                                    id="phone"
                                    {...phoneForm.register("phone")}
                                    placeholder="请输入新的手机号码"
                                    error={!!phoneForm.formState.errors.phone}
                                />
                                {phoneForm.formState.errors.phone && (
                                    <p className="text-sm text-destructive">
                                        {phoneForm.formState.errors.phone.message}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2 justify-end">
                                <Button type="submit">保存</Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsChangingPhone(false)
                                        phoneForm.reset({
                                            phone: profile.phone ?? "",
                                        })
                                    }}
                                >
                                    取消
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="min-w-0 flex-1 space-y-2">
                                <p
                                    className={cn(
                                        "truncate text-base font-medium",
                                        phoneDisplay === "未填写" &&
                                            "text-muted-foreground",
                                    )}
                                >
                                    {phoneDisplay}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                    {phoneTag}
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsChangingPhone(true)}
                            >
                                更改
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <Lock className="h-5 w-5" />
                        登录密码
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isChangingPassword ? (
                        <form
                            onSubmit={passwordForm.handleSubmit(
                                handleChangePassword,
                            )}
                            className="space-y-4 max-w-md"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="old_password">原密码</Label>
                                <Input
                                    id="old_password"
                                    type="password"
                                    autoComplete="current-password"
                                    {...passwordForm.register("old_password")}
                                    error={
                                        !!passwordForm.formState.errors
                                            .old_password
                                    }
                                />
                                {passwordForm.formState.errors.old_password && (
                                    <p className="text-sm text-destructive">
                                        {
                                            passwordForm.formState.errors
                                                .old_password.message
                                        }
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new_password">新密码</Label>
                                <Input
                                    id="new_password"
                                    type="password"
                                    autoComplete="new-password"
                                    {...passwordForm.register("new_password")}
                                    error={
                                        !!passwordForm.formState.errors
                                            .new_password
                                    }
                                />
                                {passwordForm.formState.errors.new_password && (
                                    <p className="text-sm text-destructive">
                                        {
                                            passwordForm.formState.errors
                                                .new_password.message
                                        }
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm_password">
                                    确认新密码
                                </Label>
                                <Input
                                    id="confirm_password"
                                    type="password"
                                    autoComplete="new-password"
                                    {...passwordForm.register(
                                        "confirm_password",
                                    )}
                                    error={
                                        !!passwordForm.formState.errors
                                            .confirm_password
                                    }
                                />
                                {passwordForm.formState.errors
                                    .confirm_password && (
                                    <p className="text-sm text-destructive">
                                        {
                                            passwordForm.formState.errors
                                                .confirm_password.message
                                        }
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1 justify-end">
                                <Button type="submit">保存</Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={cancelPasswordEdit}
                                >
                                    取消
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <p className="text-sm text-muted-foreground">
                                定期更换密码有助于保护账号安全
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsChangingPassword(true)}
                            >
                                更改
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

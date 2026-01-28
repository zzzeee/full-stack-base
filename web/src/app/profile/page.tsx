/**
 * @file page.tsx
 * @description 个人中心页面
 * @author System
 * @createDate 2026-01-25
 */

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { User, Mail, Lock, Edit2, Check, X, Camera } from "lucide-react"
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

/**
 * 更新昵称表单验证 Schema
 * @constant
 */
const nameSchema = z.object({
    name: z
        .string()
        .min(2, "昵称至少2个字符")
        .max(50, "昵称最多50个字符")
        .regex(/^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/, "昵称只能包含中文、英文、数字、下划线和连字符"),
})

/**
 * 修改密码表单验证 Schema
 * @constant
 */
const passwordSchema = z.object({
    old_password: z.string().min(1, "旧密码不能为空"),
    new_password: z
        .string()
        .min(8, "新密码至少8个字符")
        .max(100, "新密码最多100个字符")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "新密码必须包含大小写字母和数字"
        ),
}).refine((data) => data.old_password !== data.new_password, {
    message: "新密码不能与旧密码相同",
    path: ["new_password"],
})

/**
 * 更换邮箱表单验证 Schema
 * @constant
 */
const emailSchema = z.object({
    new_email: z.string().email("邮箱格式不正确"),
    code: z.string().regex(/^\d{6}$/, "验证码必须是6位数字"),
})

type NameFormData = z.infer<typeof nameSchema>
type PasswordFormData = z.infer<typeof passwordSchema>
type EmailFormData = z.infer<typeof emailSchema>

/**
 * 个人中心页面组件
 *
 * @component
 * @description 用户个人中心页面，包含头像、昵称、邮箱和密码管理功能
 *
 * @returns {JSX.Element} 个人中心页面组件
 */
export default function ProfilePage() {
    const router = useRouter()
    const { user: authUser, logout, login, isAuthenticated, _hasHydrated } = useAuthStore()

    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // 编辑状态
    const [isEditingName, setIsEditingName] = useState(false)
    const [isChangingEmail, setIsChangingEmail] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)

    // 邮箱验证码相关
    const [emailCodeSent, setEmailCodeSent] = useState(false)
    const [emailCountdown, setEmailCountdown] = useState(0)
    const [isSendingEmailCode, setIsSendingEmailCode] = useState(false)

    // 表单
    const nameForm = useForm<NameFormData>({
        resolver: zodResolver(nameSchema),
        defaultValues: { name: "" },
    })

    const passwordForm = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { old_password: "", new_password: "" },
    })

    const emailForm = useForm<EmailFormData>({
        resolver: zodResolver(emailSchema),
        defaultValues: { new_email: "", code: "" },
    })

    /**
     * 检查认证状态（等待 Zustand 持久化加载完成）
     */
    useEffect(() => {
        // 等待持久化加载完成
        if (!_hasHydrated) {
            return
        }

        // 持久化加载完成后，检查认证状态
        if (!authUser || !isAuthenticated) {
            router.push("/login")
            return
        }

        // 已认证，加载用户资料
        loadProfile()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [_hasHydrated, authUser, isAuthenticated, router])

    /**
     * 倒计时处理
     */
    useEffect(() => {
        if (emailCountdown > 0) {
            const timer = setTimeout(() => {
                setEmailCountdown(emailCountdown - 1)
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [emailCountdown])

    /**
     * 加载用户资料
     */
    const loadProfile = async () => {
        try {
            setIsLoading(true)
            setError(null)
            const data = await profileService.getProfile()
            setProfile(data)
            nameForm.reset({ name: data.name })
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "加载资料失败"
            setError(errorMessage)
            toast.error(errorMessage)
            
            // 如果是 401 错误，错误拦截器已经处理了跳转，这里不需要再处理
            if (err instanceof Error && 'status' in err && (err as any).status === 401) {
                return
            }
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * 处理更新昵称
     */
    const handleUpdateName = async (data: NameFormData) => {
        try {
            const updated = await profileService.updateProfile({ name: data.name })
            setProfile(updated)
            setIsEditingName(false)
            // 更新 auth store 中的用户信息
            if (authUser) {
                login({ ...authUser, name: updated.name }, useAuthStore.getState().token || '')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "更新昵称失败")
        }
    }

    /**
     * 处理发送邮箱验证码
     */
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
            toast.success('验证码已发送到新邮箱')
        } catch (err) {
            emailForm.setError("new_email", {
                message: err instanceof Error ? err.message : "发送验证码失败",
            })
        } finally {
            setIsSendingEmailCode(false)
        }
    }

    /**
     * 处理更换邮箱
     */
    const handleChangeEmail = async (data: EmailFormData) => {
        try {
            const result = await profileService.changeEmail(data)
            await loadProfile()
            setIsChangingEmail(false)
            setEmailCodeSent(false)
            emailForm.reset()
            // 更新 auth store 中的用户信息
            if (authUser) {
                login({ ...authUser, email: result.email }, useAuthStore.getState().token || '')
            }
        } catch (err) {
            emailForm.setError("code", {
                message: err instanceof Error ? err.message : "更换邮箱失败",
            })
        }
    }

    /**
     * 处理修改密码
     */
    const handleChangePassword = async (data: PasswordFormData) => {
        try {
            await profileService.changePassword(data)
            passwordForm.reset()
            setIsChangingPassword(false)
            // 修改密码后需要重新登录
            logout()
            router.push("/login")
        } catch (err) {
            passwordForm.setError("old_password", {
                message: err instanceof Error ? err.message : "修改密码失败",
            })
        }
    }

    /**
     * 处理头像上传（简化版，实际需要文件上传功能）
     */
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // 验证文件类型和大小
        const validTypes = ["image/jpeg", "image/png", "image/gif"]
        if (!validTypes.includes(file.type)) {
            setError("只支持 JPG、PNG、GIF 格式")
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("文件大小不能超过 5MB")
            return
        }

        // TODO: 实现文件上传到服务器，获取 URL 后调用 updateAvatar
        // 这里简化处理，实际需要先上传文件获取 URL
        setError("头像上传功能待实现，需要先配置文件上传服务")
    }

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">加载中...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-destructive">加载资料失败</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-3xl font-bold mb-6">个人中心</h1>

            {error && (
                <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                    {error}
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>基本信息</CardTitle>
                    <CardDescription>管理您的个人资料和账户设置</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* 头像区域 */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                {profile.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt={profile.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-12 h-12 text-muted-foreground" />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                                <Camera className="w-4 h-4" />
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif"
                                    className="hidden"
                                    onChange={handleAvatarUpload}
                                />
                            </label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            支持 JPG、PNG、GIF，最大 5MB
                        </p>
                    </div>

                    {/* 昵称 */}
                    <div className="space-y-2">
                        <Label>昵称</Label>
                        {isEditingName ? (
                            <form
                                onSubmit={nameForm.handleSubmit(handleUpdateName)}
                                className="flex gap-2"
                            >
                                <Input
                                    {...nameForm.register("name")}
                                    error={!!nameForm.formState.errors.name}
                                    className="flex-1"
                                />
                                <Button type="submit" size="icon" variant="outline">
                                    <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditingName(false)
                                        nameForm.reset({ name: profile.name })
                                    }}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </form>
                        ) : (
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <span>{profile.name}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsEditingName(true)}
                                >
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                        {nameForm.formState.errors.name && (
                            <p className="text-sm text-destructive">
                                {nameForm.formState.errors.name.message}
                            </p>
                        )}
                    </div>

                    {/* 邮箱 */}
                    <div className="space-y-2">
                        <Label>邮箱</Label>
                        {isChangingEmail ? (
                            <form
                                onSubmit={emailForm.handleSubmit(handleChangeEmail)}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <Input
                                            {...emailForm.register("new_email")}
                                            type="email"
                                            placeholder="请输入新邮箱"
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
                                                ? `${emailCountdown}秒后重试`
                                                : "发送验证码"}
                                        </Button>
                                    </div>
                                    {emailForm.formState.errors.new_email && (
                                        <p className="text-sm text-destructive">
                                            {emailForm.formState.errors.new_email.message}
                                        </p>
                                    )}
                                </div>
                                {emailCodeSent && (
                                    <div className="space-y-2">
                                        <Input
                                            {...emailForm.register("code")}
                                            placeholder="请输入6位验证码"
                                            maxLength={6}
                                            error={!!emailForm.formState.errors.code}
                                        />
                                        {emailForm.formState.errors.code && (
                                            <p className="text-sm text-destructive">
                                                {emailForm.formState.errors.code.message}
                                            </p>
                                        )}
                                    </div>
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
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    <span>{profile.email}</span>
                                    {profile.email_verified ? (
                                        <span className="text-xs text-green-600">已验证</span>
                                    ) : (
                                        <span className="text-xs text-yellow-600">未验证</span>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsChangingEmail(true)}
                                >
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* 更换密码 */}
                    {isChangingPassword ? (
                        <div className="space-y-4 p-4 border rounded-lg">
                            <div className="flex items-center justify-between">
                                <Label>更换密码</Label>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setIsChangingPassword(false)
                                        passwordForm.reset()
                                    }}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            <form
                                onSubmit={passwordForm.handleSubmit(handleChangePassword)}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <Label>旧密码</Label>
                                    <Input
                                        {...passwordForm.register("old_password")}
                                        type="password"
                                        placeholder="请输入旧密码"
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
                                        {...passwordForm.register("new_password")}
                                        type="password"
                                        placeholder="请输入新密码（8-100字符，包含大小写字母和数字）"
                                        error={!!passwordForm.formState.errors.new_password}
                                    />
                                    {passwordForm.formState.errors.new_password && (
                                        <p className="text-sm text-destructive">
                                            {passwordForm.formState.errors.new_password.message}
                                        </p>
                                    )}
                                </div>
                                <Button type="submit">确认修改</Button>
                            </form>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-muted-foreground" />
                                <span>密码</span>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setIsChangingPassword(true)}
                            >
                                更换密码
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

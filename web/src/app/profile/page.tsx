/**
 * @file page.tsx
 * @description 个人中心页面（资料展示与昵称；安全相关见 /settings）
 */

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { User, Mail, Edit2, Check, X, Camera, Settings } from "lucide-react"
import { Button, buttonVariants } from "[@BASE]/components/ui/button"
import { cn } from "[@BASE]/lib/utils/cn"
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

const nameSchema = z.object({
    name: z
        .string()
        .min(2, "昵称至少2个字符")
        .max(50, "昵称最多50个字符")
        .regex(/^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/, "昵称只能包含中文、英文、数字、下划线和连字符"),
})

type NameFormData = z.infer<typeof nameSchema>

export default function ProfilePage() {
    const router = useRouter()
    const { user: authUser, login, isAuthenticated, _hasHydrated } = useAuthStore()

    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [isEditingName, setIsEditingName] = useState(false)

    const nameForm = useForm<NameFormData>({
        resolver: zodResolver(nameSchema),
        defaultValues: { name: "" },
    })

    useEffect(() => {
        if (!_hasHydrated) {
            return
        }

        const { user, isAuthenticated: authed } = useAuthStore.getState()
        if (!user || !authed) {
            router.push("/login")
            return
        }

        loadProfile()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [_hasHydrated, router])

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

            if (err instanceof Error && "status" in err && (err as { status?: number }).status === 401) {
                return
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdateName = async (data: NameFormData) => {
        try {
            const updated = await profileService.updateProfile({ name: data.name })
            setProfile(updated)
            setIsEditingName(false)
            if (authUser) {
                login(
                    { ...authUser, name: updated.name },
                    useAuthStore.getState().token || "",
                )
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "更新昵称失败")
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const validTypes = ["image/jpeg", "image/png", "image/gif"]
        if (!validTypes.includes(file.type)) {
            setError("只支持 JPG、PNG、GIF 格式")
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("文件大小不能超过 5MB")
            return
        }

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
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h1 className="text-3xl font-bold">个人中心</h1>
                <Link
                    href="/settings"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                    <Settings className="h-4 w-4" />
                    账号与安全设置
                </Link>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                    {error}
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>基本信息</CardTitle>
                    <CardDescription>头像与昵称；邮箱与密码请在设置中管理</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                </CardContent>
            </Card>
        </div>
    )
}

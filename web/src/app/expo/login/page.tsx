"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "[@BASE]/components/ui/button"
import { Input } from "[@BASE]/components/ui/input"
import { Label } from "[@BASE]/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "[@BASE]/components/ui/card"
import { expoPost } from "[@BASE]/features/expo/lib/expo-api"
import { useExpoAuthStore } from "[@BASE]/features/expo/stores/expo-auth.store"
import type { ExpoMe } from "[@BASE]/features/expo/types/expo.types"

const schema = z.object({
    username: z
        .string()
        .min(2)
        .max(64)
        .regex(/^[a-zA-Z0-9_-]+$/, "仅允许字母、数字、下划线与短横线"),
    password: z.string().min(1, "请输入密码"),
})

type Form = z.infer<typeof schema>

export default function ExpoLoginPage() {
    const router = useRouter()
    const setSession = useExpoAuthStore((s) => s.setSession)
    const [loading, setLoading] = useState(false)
    const form = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { username: "", password: "" } })

    const onSubmit = async (data: Form) => {
        setLoading(true)
        try {
            const res = await expoPost<{ token: string; user: ExpoMe }>("/expo/auth/login", data)
            setSession(res.token, res.user)
            toast.success("登录成功")
            router.push("/expo/dash")
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "登录失败")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="expo-auth-page">
            <Card className="w-full max-w-md border border-border/80 bg-card/95 shadow-soft backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">登录</CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="space-y-2">
                            <Label htmlFor="username">用户名</Label>
                            <Input id="username" autoComplete="username" {...form.register("username")} />
                            {form.formState.errors.username && (
                                <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">密码</Label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                {...form.register("password")}
                            />
                            {form.formState.errors.password && (
                                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                            )}
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "登录中…" : "登录"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

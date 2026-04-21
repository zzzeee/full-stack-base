/**
 * @file page.tsx
 * @description 账号设置：安全（邮箱/手机/密码）
 */

"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { profileService } from "[@BASE]/features/profile/services/profile.service"
import type { UserProfile } from "[@BASE]/features/profile/types/profile.types"
import { useAuthStore } from "[@BASE]/features/auth/stores/auth.store"
import { SecurityTab } from "[@BASE]/features/settings/components/security-tab"

export default function SettingsPage() {
    const router = useRouter()
    const { _hasHydrated } = useAuthStore()

    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    const loadProfile = useCallback(async () => {
        const data = await profileService.getProfile()
        setProfile(data)
    }, [])

    useEffect(() => {
        if (!_hasHydrated) return
        const { user, isAuthenticated: authed } = useAuthStore.getState()
        if (!user || !authed) {
            router.push("/login")
            return
        }
        ;(async () => {
            try {
                setLoading(true)
                await loadProfile()
            } catch {
                router.push("/login")
            } finally {
                setLoading(false)
            }
        })()
    }, [_hasHydrated, router, loadProfile])

    if (loading || !profile) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                <div className="flex min-h-[240px] items-center justify-center text-muted-foreground">
                    加载中…
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="mb-6 flex flex-wrap items-center gap-4">
                <Link
                    href="/profile"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    返回个人资料
                </Link>
            </div>

            <h1 className="text-3xl font-bold mb-2">设置</h1>
            <p className="text-muted-foreground mb-6">管理账号安全</p>

            <SecurityTab
                profile={profile}
                onProfileRefresh={async () => {
                    await loadProfile()
                }}
            />
        </div>
    )
}

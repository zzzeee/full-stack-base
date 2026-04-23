"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "[@BASE]/components/ui/button"
import { expoGet, expoPost } from "[@BASE]/features/expo/lib/expo-api"

interface Pending {
    id: string
    username: string
    display_name: string
    phone: string | null
    created_at: string
}

interface RoleRow {
    id: string
    key: string
    name: string
}

export default function ExpoAdminRegistrationsPage() {
    const [list, setList] = useState<Pending[]>([])
    const [roles, setRoles] = useState<RoleRow[]>([])

    const load = () => {
        expoGet<Pending[]>("/expo/registrations/pending")
            .then(setList)
            .catch((e) => toast.error(e instanceof Error ? e.message : "加载失败"))
        expoGet<RoleRow[]>("/expo/roles").then(setRoles).catch(() => {})
    }

    useEffect(() => {
        load()
    }, [])

    const approve = async (userId: string) => {
        const eventId = window.prompt("展会 ID（可从展会列表复制 UUID）")
        if (!eventId) return
        const role = roles.find((r) => r.key === "PART_TIME") ?? roles[0]
        if (!role) {
            toast.error("无可用角色")
            return
        }
        try {
            await expoPost(`/expo/registrations/${userId}/approve`, {
                event_id: eventId,
                role_id: role.id,
            })
            toast.success("已通过")
            load()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "失败")
        }
    }

    const reject = async (userId: string) => {
        try {
            await expoPost(`/expo/registrations/${userId}/reject`, {})
            toast.success("已拒绝")
            load()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "失败")
        }
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <h1 className="text-xl font-semibold">待审核</h1>
            <ul className="divide-y rounded-lg border bg-card text-sm">
                {list.map((p) => (
                    <li key={p.id} className="space-y-2 px-4 py-3">
                        <div className="font-medium">{p.username}</div>
                        <div className="text-xs text-muted-foreground">
                            {p.display_name || "—"} · {p.phone || "—"}
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={() => approve(p.id)}>
                                通过
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => reject(p.id)}>
                                拒绝
                            </Button>
                        </div>
                    </li>
                ))}
            </ul>
            {list.length === 0 && (
                <p className="text-sm text-muted-foreground">暂无待审核</p>
            )}
        </div>
    )
}

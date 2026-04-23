"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "[@BASE]/components/ui/button"
import { expoGet, expoPut } from "[@BASE]/features/expo/lib/expo-api"

interface Perm {
    id: string
    key: string
    label: string
    group_key: string
}

interface RoleWithPerms {
    id: string
    key: string
    name: string
    permission_keys: string[]
}

export default function ExpoAdminRolesPage() {
    const [roles, setRoles] = useState<RoleWithPerms[]>([])
    const [perms, setPerms] = useState<Perm[]>([])
    const [selectedRoleId, setSelectedRoleId] = useState("")
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [saving, setSaving] = useState(false)

    const load = () => {
        expoGet<RoleWithPerms[]>("/expo/roles")
            .then((r) => {
                setRoles(r)
                if (!selectedRoleId && r[0]) setSelectedRoleId(r[0].id)
            })
            .catch((e) => toast.error(e instanceof Error ? e.message : "加载失败"))
        expoGet<Perm[]>("/expo/permissions")
            .then(setPerms)
            .catch(() => {})
    }

    useEffect(() => {
        load()
    }, [])

    useEffect(() => {
        const r = roles.find((x) => x.id === selectedRoleId)
        if (!r || !perms.length) return
        const idSet = new Set<string>()
        for (const p of perms) {
            if (r.permission_keys.includes(p.key)) idSet.add(p.id)
        }
        setSelectedIds(idSet)
    }, [selectedRoleId, roles, perms])

    const toggle = (id: string) => {
        setSelectedIds((prev) => {
            const n = new Set(prev)
            if (n.has(id)) n.delete(id)
            else n.add(id)
            return n
        })
    }

    const save = async () => {
        if (!selectedRoleId) return
        setSaving(true)
        try {
            await expoPut(`/expo/roles/${selectedRoleId}/permissions`, {
                permission_ids: [...selectedIds],
            })
            toast.success("已保存")
            load()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "保存失败")
        } finally {
            setSaving(false)
        }
    }

    const current = roles.find((r) => r.id === selectedRoleId)

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <h1 className="mb-4 text-xl font-semibold">权限管理</h1>
            <div className="space-y-2">
                <label className="text-sm font-medium">角色</label>
                <select
                    className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm"
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                >
                    {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                            {r.name} ({r.key})
                        </option>
                    ))}
                </select>
            </div>
            {current && (
                <div className="space-y-3 rounded-lg border bg-card p-4">
                    <h2 className="text-sm font-medium">权限</h2>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {perms.map((p) => (
                            <label key={p.id} className="flex cursor-pointer items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(p.id)}
                                    onChange={() => toggle(p.id)}
                                />
                                <span>
                                    {p.label}
                                    <span className="ml-1 text-xs text-muted-foreground">({p.key})</span>
                                </span>
                            </label>
                        ))}
                    </div>
                    <Button onClick={save} disabled={saving}>
                        {saving ? "保存中…" : "保存"}
                    </Button>
                </div>
            )}
        </div>
    )
}

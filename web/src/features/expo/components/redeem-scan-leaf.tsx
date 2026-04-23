"use client"

import { useMemo } from "react"
import { ScanLine } from "lucide-react"
import { Typography } from "antd"
import { useExpoAuthStore } from "[@BASE]/features/expo/stores/expo-auth.store"

export function RedeemScanLeafPage({
    title,
    permission,
    description = "摄像头扫码与核销接口将在后续接入。",
}: {
    title: string
    permission?: string
    description?: string
}) {
    const user = useExpoAuthStore((s) => s.user)
    const perms = useMemo(() => new Set(user?.permissions ?? []), [user])

    const allowed = !permission || perms.has(permission)

    if (!allowed) {
        return (
            <div className="panel-surface mx-auto max-w-lg">
                <Typography.Title level={4}>{title}</Typography.Title>
                <Typography.Text type="danger">当前账号没有该操作的权限。</Typography.Text>
            </div>
        )
    }

    return (
        <div className="panel-surface mx-auto max-w-lg space-y-6">
            <div>
                <Typography.Title level={4} style={{ marginTop: 0 }}>
                    {title}
                </Typography.Title>
                <Typography.Text type="secondary">{description}</Typography.Text>
            </div>
            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/40">
                <ScanLine className="size-14 text-muted-foreground" aria-hidden />
                <Typography.Text type="secondary">扫码区域占位</Typography.Text>
            </div>
        </div>
    )
}

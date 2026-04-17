"use client"

import { useEffect, useState } from "react"
import { profileService } from "[@BASE]/features/profile/services/profile.service"
import type { LoginLogRow } from "[@BASE]/features/profile/types/profile.types"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "[@BASE]/components/ui/card"

function formatTime(iso: string | null): string {
    if (!iso) return "—"
    try {
        return new Date(iso).toLocaleString("zh-CN")
    } catch {
        return iso
    }
}

function formatIp(ip: string | null): string {
    if (ip == null || ip === "") return "—"
    return String(ip)
}

export function LoginLogsTab() {
    const [rows, setRows] = useState<LoginLogRow[]>([])
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                setLoading(true)
                setErr(null)
                const items = await profileService.getLoginLogs(50)
                if (!cancelled) setRows(items)
            } catch (e) {
                if (!cancelled) {
                    setErr(e instanceof Error ? e.message : "加载失败")
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [])

    return (
        <Card>
            <CardHeader>
                <CardTitle>登录记录</CardTitle>
                <CardDescription>展示近期登录尝试（含成功与失败）</CardDescription>
            </CardHeader>
            <CardContent>
                {loading && (
                    <p className="text-sm text-muted-foreground">加载中…</p>
                )}
                {err && <p className="text-sm text-destructive">{err}</p>}
                {!loading && !err && rows.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        暂无记录。若从未写入 login_logs 表，需在后端登录流程中落库。
                    </p>
                )}
                {!loading && rows.length > 0 && (
                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium">
                                        时间
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium">
                                        方式
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium">
                                        状态
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium">
                                        IP
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium hidden md:table-cell">
                                        设备
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr
                                        key={r.id}
                                        className="border-t border-border/60"
                                    >
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            {formatTime(r.created_at)}
                                        </td>
                                        <td className="px-3 py-2">
                                            {r.login_method}
                                        </td>
                                        <td className="px-3 py-2">
                                            <span
                                                className={
                                                    r.status === "success"
                                                        ? "text-green-600"
                                                        : "text-destructive"
                                                }
                                            >
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                            {formatIp(r.ip_address)}
                                        </td>
                                        <td className="px-3 py-2 max-w-[200px] truncate hidden md:table-cell">
                                            {r.device_type ||
                                                r.user_agent?.slice(0, 48) ||
                                                "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

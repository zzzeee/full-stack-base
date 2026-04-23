"use client"

import Link from "next/link"
import { useMemo } from "react"
import {
    ArrowRight,
    BusFront,
    ChevronRight,
    Coffee,
    Package,
    ScanLine,
    Ticket,
    UserRound,
} from "lucide-react"
import { Typography } from "antd"
import { useExpoAuthStore } from "[@BASE]/features/expo/stores/expo-auth.store"

function Gate({
    allowed = true,
    href,
    children,
}: {
    allowed?: boolean
    href: string
    children: React.ReactNode
}) {
    if (!allowed) {
        return (
            <div aria-disabled className="cursor-not-allowed opacity-45">
                {children}
            </div>
        )
    }
    return (
        <Link href={href} className="block transition-opacity hover:opacity-95 active:opacity-90">
            {children}
        </Link>
    )
}

export function RedeemScanHub() {
    const user = useExpoAuthStore((s) => s.user)
    const perms = useMemo(() => new Set(user?.permissions ?? []), [user])

    const canCoffee = perms.has("coffee.scan")
    const canMaterial = perms.has("material.scan")
    const canBusOut = perms.has("bus.departure")
    const canBusIn = perms.has("bus.return")

    return (
        <div className="redeem-scan-root mx-auto w-full max-w-md space-y-8 px-1 pb-24 pt-4 md:max-w-2xl md:pb-12 md:pt-2">
            <section className="relative overflow-hidden rounded-[20px] px-2 py-2 pt-3">
                <div className="pointer-events-none absolute inset-0 rounded-[20px] bg-gradient-to-r from-teal-700/[0.06] to-transparent" />
                <div className="relative space-y-1.5">
                    <Typography.Title level={3} style={{ margin: 0 }} className="!font-extrabold !tracking-tight !text-[#191C1C]">
                        核销管理
                    </Typography.Title>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1A1C1C]">SCAN & VERIFY CONSOLE</p>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center gap-2.5 px-1">
                    <ScanLine className="size-5 shrink-0 text-[#1A1C1C]" aria-hidden />
                    <Typography.Text strong className="!text-[15px] !text-[rgba(25,28,28,0.85)]">
                        扫码核销
                    </Typography.Text>
                </div>

                <Gate allowed href="/expo/dash/redeem/scan/buyer-entry">
                    <div className="relative flex items-center justify-between gap-6 rounded-[20px] border border-[rgba(224,232,231,0.6)] bg-white px-5 py-5 shadow-[0px_4px_20px_-2px_rgba(0,0,0,0.05),0px_2px_8px_-2px_rgba(0,0,0,0.03)]">
                        <div className="flex min-w-0 items-center gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[rgba(232,237,236,0.5)]">
                                <UserRound className="size-6 text-[#1A1C1C]" aria-hidden />
                            </div>
                            <div className="min-w-0">
                                <div className="text-lg font-semibold leading-7 text-[#191C1C]">买家入场</div>
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <span className="rounded-full border border-[#E5E7EB] px-4 py-1.5 text-xs font-bold text-[#1A1C1C]">
                                扫一扫
                            </span>
                            <ChevronRight className="size-4 text-[#1A1C1C]" aria-hidden />
                        </div>
                    </div>
                </Gate>

                <div className="grid grid-cols-2 gap-4">
                    <Gate allowed={canCoffee} href="/expo/dash/redeem/scan/coffee">
                        <div className="flex h-[109px] flex-col justify-between rounded-[20px] border border-[rgba(224,232,231,0.6)] bg-white p-4 shadow-[0px_4px_20px_-2px_rgba(0,0,0,0.05),0px_2px_8px_-2px_rgba(0,0,0,0.03)]">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-[rgba(232,237,236,0.5)]">
                                    <Coffee className="size-[18px] text-[#1A1C1C]" aria-hidden />
                                </div>
                                <span className="text-[15px] font-semibold leading-snug text-[rgba(25,28,28,0.9)]">咖啡券</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-[#1A1C1C]">
                                <span>核销</span>
                                <ArrowRight className="size-3.5" aria-hidden />
                            </div>
                        </div>
                    </Gate>

                    <Gate allowed={canMaterial} href="/expo/dash/redeem/scan/material">
                        <div className="flex h-[109px] flex-col justify-between rounded-[20px] border border-[rgba(224,232,231,0.6)] bg-white p-4 shadow-[0px_4px_20px_-2px_rgba(0,0,0,0.05),0px_2px_8px_-2px_rgba(0,0,0,0.03)]">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-[rgba(232,237,236,0.5)]">
                                    <Package className="size-[18px] text-[#1A1C1C]" aria-hidden />
                                </div>
                                <span className="text-[15px] font-semibold leading-snug text-[rgba(25,28,28,0.9)]">物资券</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-[#1A1C1C]">
                                <span>核销</span>
                                <ArrowRight className="size-3.5" aria-hidden />
                            </div>
                        </div>
                    </Gate>

                    <Gate allowed={canBusOut} href="/expo/dash/redeem/scan/bus/departure">
                        <div className="flex h-[109px] flex-col justify-between rounded-[20px] border border-[rgba(224,232,231,0.6)] bg-white p-4 shadow-[0px_4px_20px_-2px_rgba(0,0,0,0.05),0px_2px_8px_-2px_rgba(0,0,0,0.03)]">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-[rgba(232,237,236,0.5)]">
                                    <BusFront className="size-[18px] text-[#1A1C1C]" aria-hidden />
                                </div>
                                <span className="text-[15px] font-semibold leading-snug text-[rgba(25,28,28,0.9)]">大巴往程</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-[#1A1C1C]">
                                <span>核销</span>
                                <ArrowRight className="size-3.5" aria-hidden />
                            </div>
                        </div>
                    </Gate>

                    <Gate allowed={canBusIn} href="/expo/dash/redeem/scan/bus/return">
                        <div className="flex h-[109px] flex-col justify-between rounded-[20px] border border-[rgba(224,232,231,0.6)] bg-white p-4 shadow-[0px_4px_20px_-2px_rgba(0,0,0,0.05),0px_2px_8px_-2px_rgba(0,0,0,0.03)]">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-[rgba(232,237,236,0.5)]">
                                    <Ticket className="size-[18px] text-[#1A1C1C]" aria-hidden />
                                </div>
                                <span className="text-[15px] font-semibold leading-snug text-[rgba(25,28,28,0.9)]">大巴返程</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-[#1A1C1C]">
                                <span>核销</span>
                                <ArrowRight className="size-3.5" aria-hidden />
                            </div>
                        </div>
                    </Gate>
                </div>
            </section>
        </div>
    )
}

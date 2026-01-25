/**
 * @file header.tsx
 * @description 头部导航栏组件，显示品牌 Logo、导航菜单和用户状态（登录/未登录）
 * @author System
 * @createDate 2024-01-01
 */

"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { User, LogOut, Settings, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/features/auth/stores/auth.store"

/**
 * 头部导航栏组件
 *
 * @component
 * @description 显示品牌 Logo、导航菜单和用户状态（登录/未登录），支持用户下拉菜单和退出登录功能
 *
 * @returns {JSX.Element} 头部导航栏组件
 *
 * @example
 * <Header />
 */
export function Header() {
    const router = useRouter()
    const { user, isAuthenticated, logout } = useAuthStore()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    /**
     * 点击外部关闭下拉菜单
     * @description 监听点击事件，当点击菜单外部区域时关闭下拉菜单
     */
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    /**
     * 处理退出登录
     * @description 清除用户认证状态并跳转到首页
     */
    const handleLogout = () => {
        logout()
        setIsMenuOpen(false)
        router.push("/")
    }

    /**
     * 跳转到个人资料页
     * @description 关闭下拉菜单并导航到用户个人资料页面
     */
    const handleProfile = () => {
        setIsMenuOpen(false)
        router.push("/profile")
    }

    return (
        <header className="flex items-center justify-center sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                {/* Logo 和品牌名称 */}
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                        A
                    </div>
                    <span className="font-semibold text-lg">MyApp</span>
                </Link>

                {/* 用户状态区域 */}
                <div className="flex items-center gap-4">
                    {isAuthenticated && user ? (
                        // 已登录：显示用户菜单
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
                            >
                                {/* 用户头像（首字母） */}
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                                    {(user?.email || 'A').charAt(0).toUpperCase()}
                                </div>
                                <span className="hidden sm:inline">{user.name}</span>
                                <ChevronDown
                                    className={`h-4 w-4 transition-transform ${isMenuOpen ? "rotate-180" : ""
                                        }`}
                                />
                            </button>

                            {/* 下拉菜单 */}
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-popover shadow-lg animate-in fade-in slide-in-from-top-1">
                                    {/* 用户信息 */}
                                    <div className="px-4 py-3 border-b">
                                        <p className="text-sm font-medium">{user.name}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>

                                    {/* 菜单项 */}
                                    <div className="py-2">
                                        <button
                                            onClick={handleProfile}
                                            className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors"
                                        >
                                            <User className="h-4 w-4" />
                                            <span>个人资料</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false)
                                                router.push("/settings")
                                            }}
                                            className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors"
                                        >
                                            <Settings className="h-4 w-4" />
                                            <span>设置</span>
                                        </button>
                                    </div>

                                    {/* 退出登录 */}
                                    <div className="border-t py-2">
                                        <button
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-accent transition-colors"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            <span>退出登录</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        // 未登录：显示登录按钮
                        <Link href="/login">
                            <Button>登录</Button>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    )
}

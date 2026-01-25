/**
 * @file layout.tsx
 * @description 认证页面布局组件，为登录、注册等认证相关页面提供统一的布局样式
 * @author System
 * @createDate 2024-01-01
 */

import type { Metadata } from "next"

/**
 * 认证页面元数据配置
 * @constant
 */
export const metadata: Metadata = {
    title: "Authentication",
    description: "Sign in to your account",
}

/**
 * 认证页面布局组件
 *
 * @component
 * @description 为认证相关页面（登录、注册等）提供统一的居中布局和渐变背景
 *
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件内容（通常是登录或注册表单）
 *
 * @returns {JSX.Element} 认证页面布局组件
 *
 * @example
 * <AuthLayout>
 *   <LoginForm />
 * </AuthLayout>
 */
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
            <div className="w-full max-w-md">
                
                {children}
            </div>
        </div>
    )
}
/**
 * @file layout.tsx
 * @description 根布局组件，定义应用的全局结构和元数据
 * @author System
 * @createDate 2024-01-01
 */

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "[@BASE]/styles/globals.css"
import { AntdAppProvider } from "[@BASE]/components/providers/antd-app-provider"
import { Toaster } from "sonner"

/**
 * Inter 字体配置
 * @constant
 */
const inter = Inter({ subsets: ["latin"] })

/**
 * 页面元数据配置
 * @constant
 */
export const metadata: Metadata = {
    title: "MyApp - 让工作变得更简单高效",
    description: "强大而简洁的工具，帮助你的团队提升生产力",
}

/**
 * 根布局组件
 *
 * @component
 * @description 应用的根布局，包含 HTML 结构、全局样式和头部导航栏
 *
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件内容
 *
 * @returns {JSX.Element} 根布局组件
 *
 * @example
 * <RootLayout>
 *   <HomePage />
 * </RootLayout>
 */
export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="zh-CN" className="h-full">
            <body className={`${inter.className} app-body min-h-full antialiased`}>
                <AntdAppProvider>
                    <div className="flex min-h-screen flex-col">{children}</div>
                    <Toaster position="top-center" richColors />
                </AntdAppProvider>
            </body>
        </html>
    )
}
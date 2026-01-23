import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/styles/globals.css"
import { Header } from "@/components/layout/header"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "MyApp - 让工作变得更简单高效",
    description: "强大而简洁的工具，帮助你的团队提升生产力",
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="zh-CN">
            <body className={inter.className}>
                {/* 头部导航栏 */}
                <Header />
                
                <div className="flex min-h-screen flex-col">
                    {children}
                </div>
            </body>
        </html>
    )
}
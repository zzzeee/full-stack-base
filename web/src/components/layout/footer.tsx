/**
 * @file footer.tsx
 * @description 页脚组件，显示版权信息和相关链接
 * @author System
 * @createDate 2024-01-01
 */

import Link from "next/link"

/**
 * 页脚组件
 *
 * @component
 * @description 显示版权信息、产品链接、公司信息、支持链接和法律信息
 *
 * @returns {JSX.Element} 页脚组件
 *
 * @example
 * <Footer />
 */
export function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="border-t bg-muted/40 flex items-center justify-center">
            <div className="container py-8 md:py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {/* 产品 */}
                    <div>
                        <h3 className="font-semibold mb-3">产品</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    功能
                                </Link>
                            </li>
                            <li>
                                <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    价格
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* 公司 */}
                    <div>
                        <h3 className="font-semibold mb-3">公司</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    关于我们
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    联系我们
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* 支持 */}
                    <div>
                        <h3 className="font-semibold mb-3">支持</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/help" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    帮助中心
                                </Link>
                            </li>
                            <li>
                                <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    文档
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* 法律 */}
                    <div>
                        <h3 className="font-semibold mb-3">法律</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    隐私政策
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    服务条款
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* 版权信息 */}
                <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
                    <p>&copy; {currentYear} MyApp. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}
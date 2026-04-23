/**
 * 对外首页等：无营销顶栏，由页面自行排版
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
    return <div className="flex min-h-screen flex-col">{children}</div>
}

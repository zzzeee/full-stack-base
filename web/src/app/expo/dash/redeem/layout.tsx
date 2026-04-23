/**
 * 核销模块：工作台背景对齐 RedeemQR 移动端稿（浅灰绿画布）
 */
export default function ExpoRedeemLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-[calc(100vh-7rem)] rounded-xl bg-[#F4F7F6]/95 px-2 py-4 md:bg-[#F4F7F6]/40 md:py-6">{children}</div>
    )
}

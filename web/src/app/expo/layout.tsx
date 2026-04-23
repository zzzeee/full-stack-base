/**
 * 展会后台独立壳层：无主站 Header，全宽工作台
 */
export default function ExpoRootLayout({ children }: { children: React.ReactNode }) {
    return <div className="expo-root min-h-screen bg-expo-canvas text-foreground">{children}</div>
}

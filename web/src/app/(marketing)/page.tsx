import Link from "next/link"
import { EXPO_PROJECT_DISPLAY_NAME } from "[@BASE]/features/expo/config/expo-brand"

export default function HomePage() {
    return (
        <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-20">
            <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.18),transparent)]"
                aria-hidden
            />
            <div className="relative z-[1] w-full max-w-lg text-center">
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    内部系统
                </p>
                <h1 className="mb-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    {EXPO_PROJECT_DISPLAY_NAME}
                </h1>
                <Link
                    href="/expo/login"
                    className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-md transition hover:bg-primary/90"
                >
                    登录
                </Link>
            </div>
        </main>
    )
}

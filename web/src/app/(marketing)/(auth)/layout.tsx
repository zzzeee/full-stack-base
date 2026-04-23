import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Authentication",
    description: "Sign in to your account",
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="auth-shell">
            <div className="w-full max-w-md">{children}</div>
        </div>
    )
}

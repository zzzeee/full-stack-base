import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Authentication",
    description: "Sign in to your account",
}

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
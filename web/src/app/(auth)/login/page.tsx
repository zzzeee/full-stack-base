// src/app/(auth)/login/page.tsx
import { LoginForm } from '@/features/auth/components/login-form'

export default function LoginPage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center">
            <LoginForm />
        </div>
    )
}
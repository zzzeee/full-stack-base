import { env } from '@/lib/constants/env'
import type {
    LoginWithPasswordPayload,
    LoginWithCodePayload,
    AuthResponse
} from '../types/auth.types'

class AuthService {
    private baseUrl = env.apiUrl

    async loginWithPassword(payload: LoginWithPasswordPayload): Promise<AuthResponse> {
        const response = await fetch(`${this.baseUrl}/auth/login/password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Login failed')
        }

        return response.json()
    }

    async loginWithCode(payload: LoginWithCodePayload): Promise<AuthResponse> {
        const response = await fetch(`${this.baseUrl}/auth/login/code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Login failed')
        }

        return response.json()
    }

    async sendVerificationCode(email: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/auth/send-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to send code')
        }
    }
}

export const authService = new AuthService()
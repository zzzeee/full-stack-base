import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '[@BASE]/features/auth/types/auth.types'

interface AuthStore {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    _hasHydrated: boolean

    login: (user: User, token: string) => void
    logout: () => void
    setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            _hasHydrated: false,

            login: (user: User, token: string) => set({
                user,
                token,
                isAuthenticated: true
            }),

            logout: () => set({
                user: null,
                token: null,
                isAuthenticated: false
            }),

            setHasHydrated: (state: boolean) => {
                set({
                    _hasHydrated: state
                })
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true)
            },
        }
    )
)
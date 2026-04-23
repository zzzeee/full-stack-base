"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { ExpoMe } from "[@BASE]/features/expo/types/expo.types"

interface ExpoAuthStore {
    token: string | null
    user: ExpoMe | null
    isAuthenticated: boolean
    _hasHydrated: boolean
    setSession: (token: string, user: ExpoMe) => void
    setUser: (user: ExpoMe) => void
    setToken: (token: string) => void
    logout: () => void
    setHasHydrated: (v: boolean) => void
}

export const useExpoAuthStore = create<ExpoAuthStore>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            isAuthenticated: false,
            _hasHydrated: false,
            setSession: (token, user) =>
                set({ token, user, isAuthenticated: true }),
            setUser: (user) => set({ user }),
            setToken: (token) => set({ token }),
            logout: () =>
                set({ token: null, user: null, isAuthenticated: false }),
            setHasHydrated: (v) => set({ _hasHydrated: v }),
        }),
        {
            name: "expo-auth-storage",
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true)
            },
        }
    )
)

export function isExpoElevated(user: ExpoMe | null): boolean {
    if (!user?.memberships?.length) return false
    return user.memberships.some(
        (m) => m.role_key === "SUPER_ADMIN" || m.role_key === "ORGANIZER"
    )
}

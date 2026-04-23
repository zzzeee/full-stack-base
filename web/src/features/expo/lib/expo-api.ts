"use client"

import { env } from "[@BASE]/lib/constants/env"

function readExpoToken(): string | null {
    if (typeof window === "undefined") return null
    try {
        const raw = localStorage.getItem("expo-auth-storage")
        if (!raw) return null
        const parsed = JSON.parse(raw) as { state?: { token?: string | null } }
        return parsed.state?.token ?? null
    } catch {
        return null
    }
}

async function expoRequest<T>(
    method: string,
    path: string,
    body?: unknown
): Promise<T> {
    const base = env.apiUrl.startsWith("http")
        ? env.apiUrl
        : `${typeof window !== "undefined" ? window.location.origin : ""}${env.apiUrl}`
    const token = readExpoToken()
    const res = await fetch(`${base}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const json = (await res.json()) as {
        success: boolean
        data?: T
        error?: { message?: string; code?: string }
    }
    if (!json.success) {
        throw new Error(json.error?.message || "请求失败")
    }
    return json.data as T
}

export function expoGet<T>(path: string): Promise<T> {
    return expoRequest<T>("GET", path)
}

export function expoPost<T>(path: string, body?: unknown): Promise<T> {
    return expoRequest<T>("POST", path, body)
}

export function expoPatch<T>(path: string, body: unknown): Promise<T> {
    return expoRequest<T>("PATCH", path, body)
}

export function expoPut<T>(path: string, body: unknown): Promise<T> {
    const base = env.apiUrl.startsWith("http")
        ? env.apiUrl
        : `${typeof window !== "undefined" ? window.location.origin : ""}${env.apiUrl}`
    const token = readExpoToken()
    return fetch(`${base}${path}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    }).then(async (res) => {
        const json = (await res.json()) as {
            success: boolean
            data?: T
            error?: { message?: string }
        }
        if (!json.success) throw new Error(json.error?.message || "请求失败")
        return json.data as T
    })
}

/**
 * 测试环境配置
 * 同时兼容 node / jsdom
 */

import { afterEach, vi } from 'vitest'

// ⚠️ 只在 jsdom 环境才引入 react-testing-library
if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('@testing-library/jest-dom')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { cleanup } = require('@testing-library/react')

    afterEach(() => {
        cleanup()
    })
}

// 每个测试后清理 mock
afterEach(() => {
    vi.clearAllMocks()
})

/* ----------------------------- */
/* localStorage mock（通用）      */
/* ----------------------------- */

const localStorageMock = (() => {
    let store: Record<string, string> = {}

    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
            store[key] = String(value)
        },
        removeItem: (key: string) => {
            delete store[key]
        },
        clear: () => {
            store = {}
        },
    }
})()

if (typeof globalThis.localStorage === 'undefined') {
    Object.defineProperty(globalThis, 'localStorage', {
        value: localStorageMock,
        writable: true,
    })
}

/* ----------------------------- */
/* fetch mock（node 必须）       */
/* ----------------------------- */

if (typeof globalThis.fetch === 'undefined') {
    globalThis.fetch = vi.fn()
}

/* ----------------------------- */
/* console mock（安全）          */
/* ----------------------------- */

globalThis.console = {
    ...console,
    error: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
}

/* ----------------------------- */
/* 环境变量                      */
/* ----------------------------- */

if (!process.env.NEXT_PUBLIC_API_URL) {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api'
}

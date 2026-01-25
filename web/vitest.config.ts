import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom', // 用于测试 React 组件
        globals: true, // 启用全局 API
        setupFiles: './tests/setup.ts', // 测试配置文件
        css: true, // 处理 CSS 文件
        exclude: ['node_modules', 'dist', '.next', 'coverage', 'debug.test.ts'],
    },
    // 解决路径别名问题
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@ui': path.resolve(__dirname, './src/components/ui'),
            '@utils': path.resolve(__dirname, './src/lib/utils'),
            '@tests': path.resolve(__dirname, './tests'),
        },
    },
})
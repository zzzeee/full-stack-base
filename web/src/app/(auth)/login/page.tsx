/**
 * @file page.tsx
 * @description 登录页面组件，展示登录表单
 * @author System
 * @createDate 2024-01-01
 */

import { LoginForm } from '@/features/auth/components/login-form'

/**
 * 登录页面组件
 *
 * @component
 * @description 登录页面，居中显示登录表单组件
 *
 * @returns {JSX.Element} 登录页面组件
 *
 * @example
 * <LoginPage />
 */
export default function LoginPage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center">
            <LoginForm />
        </div>
    )
}
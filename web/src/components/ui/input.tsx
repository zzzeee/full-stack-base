/**
 * @file input.tsx
 * @description 输入框组件，用于表单输入，支持错误状态显示
 * @author System
 * @createDate 2024-01-01
 */

import * as React from "react"
import { cn } from "@/lib/utils/cn"

/**
 * 输入框组件属性接口
 *
 * @interface
 * @extends {React.InputHTMLAttributes<HTMLInputElement>}
 * @property {boolean} [error] - 是否显示错误状态（红色边框）
 */
export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean
}

/**
 * 输入框组件
 *
 * @component
 * @description 表单输入框组件，支持错误状态显示和自定义样式
 *
 * @param {InputProps} props - 组件属性
 * @param {boolean} [props.error] - 是否显示错误状态
 *
 * @returns {JSX.Element} 输入框组件
 *
 * @example
 * <Input
 *   type="email"
 *   placeholder="请输入邮箱"
 *   error={hasError}
 * />
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    error && "border-destructive focus-visible:ring-destructive",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
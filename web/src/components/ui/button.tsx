/**
 * @file button.tsx
 * @description 按钮组件，支持多种样式变体和加载状态
 * @author System
 * @createDate 2024-01-01
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "[@BASE]/lib/utils/cn"

/**
 * 按钮样式变体配置
 * @constant
 * @description 定义按钮的不同样式变体（variant）和尺寸（size）
 */
const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
                destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
                outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
                secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3 text-xs",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

/**
 * 按钮组件属性接口
 *
 * @interface
 * @extends {React.ButtonHTMLAttributes<HTMLButtonElement>}
 * @extends {VariantProps<typeof buttonVariants>}
 * @property {boolean} [isLoading] - 是否显示加载状态（显示加载动画并禁用按钮）
 */
export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    isLoading?: boolean
}

/**
 * 按钮组件
 *
 * @component
 * @description 通用的按钮组件，支持多种样式变体、尺寸和加载状态
 *
 * @param {ButtonProps} props - 组件属性
 * @param {string} [props.variant="default"] - 按钮样式变体：default、destructive、outline、secondary、ghost、link
 * @param {string} [props.size="default"] - 按钮尺寸：default、sm、lg、icon
 * @param {boolean} [props.isLoading] - 是否显示加载状态
 *
 * @returns {JSX.Element} 按钮组件
 *
 * @example
 * <Button variant="default" size="lg" isLoading={loading}>
 *   提交
 * </Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, isLoading, disabled, children, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && (
                    <svg
                        className="h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                )}
                {children}
            </button>
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
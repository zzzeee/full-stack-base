/**
 * @file label.tsx
 * @description 标签组件，用于表单字段的标签显示，支持必填标记
 * @author System
 * @createDate 2024-01-01
 */

import * as React from "react"
import { cn } from "[@BASE]/lib/utils/cn"

/**
 * 标签组件属性接口
 *
 * @interface
 * @extends {React.LabelHTMLAttributes<HTMLLabelElement>}
 * @property {boolean} [required] - 是否显示必填标记（红色星号）
 */
export interface LabelProps
    extends React.LabelHTMLAttributes<HTMLLabelElement> {
    required?: boolean
}

/**
 * 标签组件
 *
 * @component
 * @description 表单标签组件，支持必填字段标记和自定义样式
 *
 * @param {LabelProps} props - 组件属性
 * @param {boolean} [props.required] - 是否显示必填标记
 *
 * @returns {JSX.Element} 标签组件
 *
 * @example
 * <Label htmlFor="email" required>邮箱地址</Label>
 */
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
    ({ className, required, children, ...props }, ref) => (
        <label
            ref={ref}
            className={cn(
                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                className
            )}
            {...props}
        >
            {children}
            {required && <span className="ml-1 text-destructive">*</span>}
        </label>
    )
)
Label.displayName = "Label"

export { Label }
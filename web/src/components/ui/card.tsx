/**
 * @file card.tsx
 * @description 卡片组件集合，包含 Card、CardHeader、CardTitle、CardDescription、CardContent、CardFooter 等子组件
 * @author System
 * @createDate 2024-01-01
 */

import * as React from "react"
import { cn } from "@/lib/utils/cn"

/**
 * 卡片容器组件
 *
 * @component
 * @description 卡片的主容器，提供圆角、边框和阴影样式
 *
 * @param {React.HTMLAttributes<HTMLDivElement>} props - 组件属性
 *
 * @returns {JSX.Element} 卡片容器组件
 *
 * @example
 * <Card>
 *   <CardHeader>
 *     <CardTitle>标题</CardTitle>
 *   </CardHeader>
 *   <CardContent>内容</CardContent>
 * </Card>
 */
const Card = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "rounded-xl border bg-card text-card-foreground shadow",
            className
        )}
        {...props}
    />
))
Card.displayName = "Card"

/**
 * 卡片头部组件
 *
 * @component
 * @description 卡片的头部区域，通常包含标题和描述
 *
 * @param {React.HTMLAttributes<HTMLDivElement>} props - 组件属性
 *
 * @returns {JSX.Element} 卡片头部组件
 */
const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
))
CardHeader.displayName = "CardHeader"

/**
 * 卡片标题组件
 *
 * @component
 * @description 卡片的标题，使用 h3 标签渲染
 *
 * @param {React.HTMLAttributes<HTMLHeadingElement>} props - 组件属性
 *
 * @returns {JSX.Element} 卡片标题组件
 */
const CardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn("font-semibold leading-none tracking-tight", className)}
        {...props}
    />
))
CardTitle.displayName = "CardTitle"

/**
 * 卡片描述组件
 *
 * @component
 * @description 卡片的描述文字，通常显示在标题下方
 *
 * @param {React.HTMLAttributes<HTMLParagraphElement>} props - 组件属性
 *
 * @returns {JSX.Element} 卡片描述组件
 */
const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
))
CardDescription.displayName = "CardDescription"

/**
 * 卡片内容组件
 *
 * @component
 * @description 卡片的主要内容区域
 *
 * @param {React.HTMLAttributes<HTMLDivElement>} props - 组件属性
 *
 * @returns {JSX.Element} 卡片内容组件
 */
const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

/**
 * 卡片底部组件
 *
 * @component
 * @description 卡片的底部区域，通常包含操作按钮
 *
 * @param {React.HTMLAttributes<HTMLDivElement>} props - 组件属性
 *
 * @returns {JSX.Element} 卡片底部组件
 */
const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0", className)}
        {...props}
    />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

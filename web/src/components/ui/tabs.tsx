"use client"

import { cn } from "[@BASE]/lib/utils/cn"

export type TabItem = {
    id: string
    label: string
}

type TabsProps = {
    tabs: TabItem[]
    value: string
    onValueChange: (id: string) => void
    className?: string
}

/**
 * 轻量 Tabs：仅样式与切换，内容由父组件按 value 渲染。
 */
export function TabsList({ tabs, value, onValueChange, className }: TabsProps) {
    return (
        <div
            role="tablist"
            className={cn(
                "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
                className,
            )}
        >
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={value === tab.id}
                    className={cn(
                        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
                        value === tab.id
                            ? "bg-background text-foreground shadow-sm"
                            : "hover:text-foreground",
                    )}
                    onClick={() => onValueChange(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    )
}

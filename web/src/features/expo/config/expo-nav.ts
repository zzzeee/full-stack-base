/**
 * 展会后台导航树 → Ant Design Menu（与后端 permission key / elevated 对齐）
 * 结构对齐 works/系统结构.ini
 */

import type { MenuProps } from "antd"

export type ExpoNavMatch = "exact" | "prefix"

export type ExpoMenuLeaf = {
    type: "item"
    key: string
    label: string
    href: string
    match?: ExpoNavMatch
    permission?: string
    elevatedOnly?: boolean
}

export type ExpoMenuBranch = {
    type: "submenu"
    key: string
    label: string
    elevatedOnly?: boolean
    children: ExpoMenuNode[]
}

export type ExpoMenuNode = ExpoMenuLeaf | ExpoMenuBranch

export const EXPO_MENU_TREE: ExpoMenuNode[] = [
    {
        type: "submenu",
        key: "m-redeem",
        label: "核销管理",
        children: [
            {
                type: "submenu",
                key: "m-redeem-scan",
                label: "扫码核销",
                children: [
                    {
                        type: "item",
                        key: "/expo/dash/redeem/scan",
                        label: "工作台",
                        href: "/expo/dash/redeem/scan",
                        match: "exact",
                    },
                    {
                        type: "item",
                        key: "/expo/dash/redeem/scan/coffee",
                        label: "核销咖啡券",
                        href: "/expo/dash/redeem/scan/coffee",
                        permission: "coffee.scan",
                    },
                    {
                        type: "item",
                        key: "/expo/dash/redeem/scan/material",
                        label: "核销物资券",
                        href: "/expo/dash/redeem/scan/material",
                        permission: "material.scan",
                    },
                    {
                        type: "item",
                        key: "/expo/dash/redeem/scan/bus/departure",
                        label: "核销大巴往程",
                        href: "/expo/dash/redeem/scan/bus/departure",
                        permission: "bus.departure",
                    },
                    {
                        type: "item",
                        key: "/expo/dash/redeem/scan/bus/return",
                        label: "核销大巴返程",
                        href: "/expo/dash/redeem/scan/bus/return",
                        permission: "bus.return",
                    },
                    {
                        type: "item",
                        key: "/expo/dash/redeem/scan/buyer-entry",
                        label: "买家入场",
                        href: "/expo/dash/redeem/scan/buyer-entry",
                    },
                ],
            },
            {
                type: "submenu",
                key: "m-redeem-records",
                label: "核销记录",
                children: [
                    {
                        type: "item",
                        key: "/expo/dash/redeem/records/coffee",
                        label: "咖啡券",
                        href: "/expo/dash/redeem/records/coffee",
                        permission: "coffee.records",
                    },
                    {
                        type: "item",
                        key: "/expo/dash/redeem/records/material",
                        label: "物资券",
                        href: "/expo/dash/redeem/records/material",
                        permission: "material.records",
                    },
                    {
                        type: "item",
                        key: "/expo/dash/redeem/records/bus",
                        label: "大巴行程",
                        href: "/expo/dash/redeem/records/bus",
                        permission: "bus.list",
                    },
                ],
            },
            {
                type: "item",
                key: "/expo/dash/redeem/coffee/gift",
                label: "赠送咖啡券",
                href: "/expo/dash/redeem/coffee/gift",
                permission: "coffee.gift",
            },
        ],
    },
    {
        type: "submenu",
        key: "m-workorder",
        label: "工单管理",
        children: [
            {
                type: "item",
                key: "/expo/dash/workorder/preview",
                label: "人员预览",
                href: "/expo/dash/workorder/preview",
                permission: "workorder.list",
            },
            {
                type: "item",
                key: "/expo/dash/workorder/stats",
                label: "概况统计",
                href: "/expo/dash/workorder/stats",
                permission: "workorder.stats",
            },
        ],
    },
    {
        type: "submenu",
        key: "m-hall",
        label: "展馆管理",
        elevatedOnly: true,
        children: [
            {
                type: "item",
                key: "/expo/dash/halls",
                label: "各个展馆",
                href: "/expo/dash/halls",
                match: "prefix",
                elevatedOnly: true,
            },
        ],
    },
    {
        type: "submenu",
        key: "m-system",
        label: "系统",
        elevatedOnly: true,
        children: [
            {
                type: "submenu",
                key: "m-staff",
                label: "人员管理",
                elevatedOnly: true,
                children: [
                    {
                        type: "item",
                        key: "/expo/dash/admin/users",
                        label: "人员列表",
                        href: "/expo/dash/admin/users",
                        match: "prefix",
                        elevatedOnly: true,
                    },
                    {
                        type: "item",
                        key: "/expo/dash/admin/registrations",
                        label: "待审核",
                        href: "/expo/dash/admin/registrations",
                        match: "prefix",
                        elevatedOnly: true,
                    },
                ],
            },
            {
                type: "item",
                key: "/expo/dash/admin/roles",
                label: "角色权限",
                href: "/expo/dash/admin/roles",
                match: "prefix",
                elevatedOnly: true,
            },
            {
                type: "item",
                key: "/expo/dash/admin/events",
                label: "展会管理",
                href: "/expo/dash/admin/events",
                match: "prefix",
                elevatedOnly: true,
            },
            {
                type: "item",
                key: "/expo/dash/settings",
                label: "参数设置",
                href: "/expo/dash/settings",
                match: "prefix",
                elevatedOnly: true,
            },
        ],
    },
    {
        type: "item",
        key: "/expo/dash/settings/links",
        label: "常用链接",
        href: "/expo/dash/settings/links",
        match: "exact",
        permission: "common.links",
    },
]

export function isNavActive(pathname: string, href: string, match: ExpoNavMatch = "exact"): boolean {
    if (match === "prefix") return pathname === href || pathname.startsWith(`${href}/`)
    return pathname === href
}

function leafVisible(leaf: ExpoMenuLeaf, perms: Set<string>, elevated: boolean): boolean {
    if (leaf.elevatedOnly && !elevated) return false
    if (leaf.permission && !perms.has(leaf.permission)) return false
    return true
}

function filterNode(node: ExpoMenuNode, perms: Set<string>, elevated: boolean): ExpoMenuNode | null {
    if (node.type === "item") return leafVisible(node, perms, elevated) ? node : null
    if (node.elevatedOnly && !elevated) return null
    const children = node.children
        .map((c) => filterNode(c, perms, elevated))
        .filter((c): c is ExpoMenuNode => c !== null)
    if (!children.length) return null
    return { ...node, children }
}

export function filterMenuTree(perms: Set<string>, elevated: boolean): ExpoMenuNode[] {
    return EXPO_MENU_TREE.map((n) => filterNode(n, perms, elevated)).filter((n): n is ExpoMenuNode => n !== null)
}

function walkLeaves(nodes: ExpoMenuNode[], out: ExpoMenuLeaf[]) {
    for (const n of nodes) {
        if (n.type === "item") out.push(n)
        else walkLeaves(n.children, out)
    }
}

/** 已过滤菜单树：展开命中路由的各级 SubMenu */
export function collectOpenKeysForPathFiltered(
    pathname: string,
    nodes: ExpoMenuNode[],
    perms: Set<string>,
    elevated: boolean,
): string[] {
    const open: string[] = []

    function visitBranch(branch: ExpoMenuBranch): boolean {
        let hit = false
        for (const c of branch.children) {
            if (c.type === "item") {
                if (!leafVisible(c, perms, elevated)) continue
                const m = c.match ?? "exact"
                if (isNavActive(pathname, c.href, m)) hit = true
            } else if (visitBranch(c)) {
                hit = true
            }
        }
        if (hit) open.push(branch.key)
        return hit
    }

    for (const n of nodes) {
        if (n.type === "submenu") visitBranch(n)
    }
    return open
}

export function getSelectedMenuKey(pathname: string, nodes: ExpoMenuNode[], perms: Set<string>, elevated: boolean): string | undefined {
    const leaves: ExpoMenuLeaf[] = []
    walkLeaves(nodes, leaves)
    for (const leaf of leaves) {
        if (!leafVisible(leaf, perms, elevated)) continue
        const m = leaf.match ?? "exact"
        if (isNavActive(pathname, leaf.href, m)) return leaf.key
    }
    return undefined
}

function toAntdItemsInner(nodes: ExpoMenuNode[]): MenuProps["items"] {
    return nodes.map((n) => {
        if (n.type === "item") {
            return { key: n.key, label: n.label }
        }
        return {
            key: n.key,
            label: n.label,
            children: toAntdItemsInner(n.children),
        }
    })
}

export function menuTreeToAntdItems(nodes: ExpoMenuNode[]): MenuProps["items"] {
    return toAntdItemsInner(nodes)
}

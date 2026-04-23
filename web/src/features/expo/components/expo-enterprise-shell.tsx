"use client"

import { useEffect, useMemo, useState } from "react"
import { Avatar, Drawer, Dropdown, Grid, Layout, Menu, Typography } from "antd"
import type { MenuProps } from "antd"
import {
    LogOut,
    Menu as MenuIcon,
    PanelLeftClose,
    PanelLeftOpen,
    UserRound,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { EXPO_PROJECT_DISPLAY_NAME } from "[@BASE]/features/expo/config/expo-brand"
import {
    collectOpenKeysForPathFiltered,
    filterMenuTree,
    getSelectedMenuKey,
    menuTreeToAntdItems,
} from "[@BASE]/features/expo/config/expo-nav"
import { useExpoAuthStore, isExpoElevated } from "[@BASE]/features/expo/stores/expo-auth.store"

const { Header, Sider, Content } = Layout

export function ExpoEnterpriseShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const user = useExpoAuthStore((s) => s.user)
    const logout = useExpoAuthStore((s) => s.logout)
    const hydrated = useExpoAuthStore((s) => s._hasHydrated)

    const elevated = isExpoElevated(user)
    const perms = useMemo(() => new Set(user?.permissions ?? []), [user?.permissions])

    const filteredTree = useMemo(() => filterMenuTree(perms, elevated), [perms, elevated])

    const menuItems = useMemo(() => menuTreeToAntdItems(filteredTree), [filteredTree])

    const selectedKey = useMemo(
        () => getSelectedMenuKey(pathname, filteredTree, perms, elevated),
        [pathname, filteredTree, perms, elevated],
    )

    const openKeysDefault = useMemo(
        () => collectOpenKeysForPathFiltered(pathname, filteredTree, perms, elevated),
        [pathname, filteredTree, perms, elevated],
    )

    const [openKeys, setOpenKeys] = useState<string[]>(openKeysDefault)
    const [collapsed, setCollapsed] = useState(false)
    const [drawerOpen, setDrawerOpen] = useState(false)

    const screens = Grid.useBreakpoint()
    const isMobile = !screens.md

    useEffect(() => {
        setOpenKeys(openKeysDefault)
    }, [openKeysDefault])

    const onMenuNavigate: MenuProps["onClick"] = (e) => {
        router.push(String(e.key))
        if (isMobile) setDrawerOpen(false)
    }

    const menu = (
        <Menu
            className="expo-enterprise-menu !border-none"
            theme="dark"
            mode="inline"
            selectedKeys={selectedKey ? [selectedKey] : []}
            openKeys={openKeys}
            onOpenChange={(keys) => setOpenKeys(keys as string[])}
            items={menuItems}
            onClick={onMenuNavigate}
        />
    )

    const eventName = user?.current_event?.name ?? "未选择展会"
    const displayName = user?.display_name?.trim() || user?.username || "用户"

    const userMenu: MenuProps["items"] = [
        {
            key: "logout",
            label: "退出登录",
            icon: <LogOut className="size-4" aria-hidden />,
            onClick: () => {
                logout()
                router.push("/expo/login")
            },
        },
    ]

    if (!hydrated) {
        return (
            <div className="expo-enterprise-root flex min-h-screen items-center justify-center bg-expo-canvas">
                <Typography.Text type="secondary">加载会话…</Typography.Text>
            </div>
        )
    }

    return (
        <Layout className="expo-enterprise-root min-h-screen bg-expo-canvas">
            {!isMobile && (
                <Sider
                    collapsible
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                    width={256}
                    theme="dark"
                    trigger={null}
                    className="!bg-[rgb(15_23_42)] shadow-sidebar"
                >
                    <div className="expo-sidebar-brand !border-white/10 !bg-transparent">
                        <Link href="/expo/dash" className="block">
                            <div className="expo-sidebar-brand-title text-white">{EXPO_PROJECT_DISPLAY_NAME}</div>
                            <div className="expo-sidebar-brand-sub line-clamp-2 text-white/55">{eventName}</div>
                        </Link>
                    </div>
                    {menu}
                </Sider>
            )}

            <Layout className="min-h-screen">
                <Header className="flex !h-14 items-center justify-between gap-3 !bg-card px-4 !leading-[56px] shadow-header">
                    <div className="flex min-w-0 items-center gap-2">
                        {isMobile && (
                            <button
                                type="button"
                                className="inline-flex size-9 items-center justify-center rounded-md text-foreground hover:bg-muted"
                                aria-label="打开菜单"
                                onClick={() => setDrawerOpen(true)}
                            >
                                <MenuIcon className="size-5" />
                            </button>
                        )}
                        {!isMobile && (
                            <button
                                type="button"
                                className="inline-flex size-9 items-center justify-center rounded-md text-foreground hover:bg-muted"
                                aria-label={collapsed ? "展开侧栏" : "收起侧栏"}
                                onClick={() => setCollapsed((c) => !c)}
                            >
                                {collapsed ? (
                                    <PanelLeftOpen className="size-5" />
                                ) : (
                                    <PanelLeftClose className="size-5" />
                                )}
                            </button>
                        )}
                        <Typography.Text className="truncate font-medium">{eventName}</Typography.Text>
                    </div>
                    <Dropdown menu={{ items: userMenu }} trigger={["click"]} placement="bottomRight">
                        <button
                            type="button"
                            className="flex max-w-[220px] items-center gap-2 rounded-md px-2 py-1 hover:bg-muted"
                        >
                            <Avatar size={32} className="!bg-primary/90" icon={<UserRound className="size-4" />} />
                            <span className="truncate text-sm font-medium">{displayName}</span>
                        </button>
                    </Dropdown>
                </Header>

                <Content className="expo-main-surface">{children}</Content>
            </Layout>

            <Drawer
                title={EXPO_PROJECT_DISPLAY_NAME}
                placement="left"
                width={280}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                styles={{ body: { padding: 0, background: "rgb(15 23 42)" } }}
                classNames={{ header: "!border-white/10 !bg-[rgb(15_23_42)] !text-white" }}
            >
                <div className="border-b border-white/10 px-4 py-3 text-xs text-white/60">{eventName}</div>
                {menu}
            </Drawer>
        </Layout>
    )
}

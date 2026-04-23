"use client"

import { AntdRegistry } from "@ant-design/nextjs-registry"
import { App, ConfigProvider } from "antd"
import zhCN from "antd/locale/zh_CN"
import dayjs from "dayjs"
import "dayjs/locale/zh-cn"

dayjs.locale("zh-cn")

export function AntdAppProvider({ children }: { children: React.ReactNode }) {
    return (
        <AntdRegistry>
            <ConfigProvider locale={zhCN}>
                <App>{children}</App>
            </ConfigProvider>
        </AntdRegistry>
    )
}

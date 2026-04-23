"use client"

import { Typography } from "antd"

/** 兼容旧路由 /expo/dash/material/stats 重定向至此 */
export default function RedeemMaterialStatsPage() {
    return (
        <div className="panel-surface mx-auto max-w-lg">
            <Typography.Title level={4} style={{ marginTop: 0 }}>
                物资券 · 概况统计
            </Typography.Title>
            <Typography.Text type="secondary">概况指标将在后续迭代接入。</Typography.Text>
        </div>
    )
}

"use client"

import { Typography } from "antd"

export default function ExpoHallsPage() {
    return (
        <div className="panel-surface mx-auto max-w-lg">
            <Typography.Title level={4} style={{ marginTop: 0 }}>
                展馆管理 · 各个展馆
            </Typography.Title>
            <Typography.Text type="secondary">展馆列表与现场指标将在后续迭代接入。</Typography.Text>
        </div>
    )
}

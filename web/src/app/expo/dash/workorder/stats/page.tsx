"use client"

import { Typography } from "antd"

export default function WorkorderStatsPage() {
    return (
        <div className="panel-surface mx-auto max-w-lg">
            <Typography.Title level={4} style={{ marginTop: 0 }}>
                工单管理 · 概况统计
            </Typography.Title>
            <Typography.Text type="secondary">统计数据将在后续迭代接入。</Typography.Text>
        </div>
    )
}

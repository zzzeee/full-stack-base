"use client"

import { Typography } from "antd"

export default function WorkorderPreviewPage() {
    return (
        <div className="panel-surface mx-auto max-w-lg">
            <Typography.Title level={4} style={{ marginTop: 0 }}>
                工单管理 · 人员预览
            </Typography.Title>
            <Typography.Text type="secondary">预览数据将在后续迭代接入。</Typography.Text>
        </div>
    )
}

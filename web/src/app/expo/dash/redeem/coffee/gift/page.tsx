"use client"

import { Typography } from "antd"

export default function RedeemCoffeeGiftPage() {
    return (
        <div className="panel-surface mx-auto max-w-lg">
            <Typography.Title level={4} style={{ marginTop: 0 }}>
                赠送咖啡券
            </Typography.Title>
            <Typography.Text type="secondary">赠送流程与配额将在后续迭代接入。</Typography.Text>
        </div>
    )
}

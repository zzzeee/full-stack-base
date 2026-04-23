"use client"

import { List, Typography } from "antd"
import { EXPO_COMMON_LINKS } from "[@BASE]/config/expo-common-links"

const { Title } = Typography

export default function ExpoSettingsLinksPage() {
    return (
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
                常用链接
            </Title>
            <List
                bordered
                dataSource={[...EXPO_COMMON_LINKS]}
                renderItem={(link) => (
                    <List.Item>
                        <a href={link.href} target="_blank" rel="noopener noreferrer">
                            {link.label}
                        </a>
                    </List.Item>
                )}
            />
        </div>
    )
}

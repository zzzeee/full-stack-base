"use client"

import { useState } from "react"
import { App, Button, Form, Input, Typography } from "antd"
import { z } from "zod"
import { expoPatch } from "[@BASE]/features/expo/lib/expo-api"
import { useExpoAuthStore } from "[@BASE]/features/expo/stores/expo-auth.store"

const { Title } = Typography

const schema = z.object({
    old_password: z.string().min(1, "请输入旧密码"),
    new_password: z.string().min(6, "新密码至少 6 位"),
})

type FormValues = {
    old_password: string
    new_password: string
}

export default function ExpoSettingsPasswordPage() {
    const { message } = App.useApp()
    const setToken = useExpoAuthStore((s) => s.setToken)
    const [form] = Form.useForm<FormValues>()
    const [loading, setLoading] = useState(false)

    const onFinish = async (values: FormValues) => {
        const parsed = schema.safeParse(values)
        if (!parsed.success) {
            message.error(parsed.error.issues[0]?.message ?? "校验失败")
            return
        }
        setLoading(true)
        try {
            const out = await expoPatch<{ token: string }>("/expo/me/password", parsed.data)
            setToken(out.token)
            message.success("已更新")
            form.resetFields()
        } catch (e) {
            message.error(e instanceof Error ? e.message : "修改失败")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ maxWidth: 440, margin: "0 auto" }}>
            <Title level={4} style={{ marginTop: 0, marginBottom: 24 }}>
                修改密码
            </Title>
            <Form form={form} layout="vertical" onFinish={onFinish} requiredMark="optional">
                <Form.Item
                    label="当前密码"
                    name="old_password"
                    rules={[{ required: true, message: "必填" }]}
                >
                    <Input.Password autoComplete="current-password" />
                </Form.Item>
                <Form.Item
                    label="新密码"
                    name="new_password"
                    rules={[{ required: true, message: "必填" }, { min: 6, message: "至少 6 位" }]}
                >
                    <Input.Password autoComplete="new-password" />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        保存
                    </Button>
                </Form.Item>
            </Form>
        </div>
    )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import type { Dayjs } from "dayjs"
import dayjs from "dayjs"
import {
    App,
    Button,
    DatePicker,
    Form,
    Image,
    Input,
    Modal,
    Select,
    Space,
    Table,
    Tag,
    Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import { expoGet, expoPatch, expoPost } from "[@BASE]/features/expo/lib/expo-api"

const { Title } = Typography

interface EventRow {
    id: string
    name: string
    logo_url: string | null
    status: string
    starts_at: string | null
    ends_at: string | null
}

type CreateForm = {
    name: string
    logo_url?: string
    starts_at?: Dayjs | null
    ends_at?: Dayjs | null
}

type EditForm = {
    name: string
    logo_url?: string | null
    starts_at?: Dayjs | null
    ends_at?: Dayjs | null
    status: "draft" | "active" | "archived"
}

function toIsoOrNull(v: Dayjs | null | undefined): string | null {
    if (!v || !v.isValid()) return null
    return v.toISOString()
}

export default function ExpoAdminEventsPage() {
    const { message } = App.useApp()
    const [events, setEvents] = useState<EventRow[]>([])
    const [loadingList, setLoadingList] = useState(false)
    const [createLoading, setCreateLoading] = useState(false)
    const [createForm] = Form.useForm<CreateForm>()
    const [editOpen, setEditOpen] = useState(false)
    const [editLoading, setEditLoading] = useState(false)
    const [editing, setEditing] = useState<EventRow | null>(null)
    const [editForm] = Form.useForm<EditForm>()

    const load = () => {
        setLoadingList(true)
        expoGet<EventRow[]>("/expo/events")
            .then(setEvents)
            .catch((e) => message.error(e instanceof Error ? e.message : "加载失败"))
            .finally(() => setLoadingList(false))
    }

    useEffect(() => {
        load()
    }, [])

    const openEdit = (row: EventRow) => {
        setEditing(row)
        editForm.setFieldsValue({
            name: row.name,
            logo_url: row.logo_url ?? "",
            starts_at: row.starts_at ? dayjs(row.starts_at) : null,
            ends_at: row.ends_at ? dayjs(row.ends_at) : null,
            status: row.status as EditForm["status"],
        })
        setEditOpen(true)
    }

    const onCreate = async (values: CreateForm) => {
        if (!values.name?.trim()) {
            message.error("请填写展会名称")
            return
        }
        setCreateLoading(true)
        try {
            await expoPost<EventRow>("/expo/events", {
                name: values.name.trim(),
                logo_url: values.logo_url?.trim() || null,
                starts_at: toIsoOrNull(values.starts_at ?? null),
                ends_at: toIsoOrNull(values.ends_at ?? null),
                status: "draft",
            })
            message.success("已创建")
            createForm.resetFields()
            load()
        } catch (e) {
            message.error(e instanceof Error ? e.message : "创建失败")
        } finally {
            setCreateLoading(false)
        }
    }

    const onEditSave = async () => {
        if (!editing) return
        try {
            const values = await editForm.validateFields()
            setEditLoading(true)
            await expoPatch<EventRow>(`/expo/events/${editing.id}`, {
                name: values.name.trim(),
                logo_url: values.logo_url?.trim() ? values.logo_url.trim() : null,
                starts_at: toIsoOrNull(values.starts_at ?? null),
                ends_at: toIsoOrNull(values.ends_at ?? null),
                status: values.status,
            })
            message.success("已保存")
            setEditOpen(false)
            setEditing(null)
            load()
        } catch (e) {
            if (e && typeof e === "object" && "errorFields" in e) return
            message.error(e instanceof Error ? e.message : "保存失败")
        } finally {
            setEditLoading(false)
        }
    }

    const archive = async (id: string) => {
        try {
            await expoPatch<EventRow>(`/expo/events/${id}`, { status: "archived" })
            message.success("已归档")
            load()
        } catch (e) {
            message.error(e instanceof Error ? e.message : "操作失败")
        }
    }

    const columns: ColumnsType<EventRow> = useMemo(
        () => [
            {
                title: "名称",
                dataIndex: "name",
                key: "name",
            },
            {
                title: "LOGO",
                dataIndex: "logo_url",
                key: "logo_url",
                width: 88,
                render: (url: string | null) =>
                    url ? (
                        <Image src={url} alt="" width={40} height={40} style={{ objectFit: "contain" }} />
                    ) : (
                        <span style={{ color: "#999" }}>—</span>
                    ),
            },
            {
                title: "开始时间",
                dataIndex: "starts_at",
                key: "starts_at",
                render: (v: string | null) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm") : "—"),
            },
            {
                title: "结束时间",
                dataIndex: "ends_at",
                key: "ends_at",
                render: (v: string | null) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm") : "—"),
            },
            {
                title: "状态",
                dataIndex: "status",
                key: "status",
                width: 100,
                render: (s: string) => {
                    const color = s === "active" ? "green" : s === "draft" ? "default" : "volcano"
                    return <Tag color={color}>{s}</Tag>
                },
            },
            {
                title: "操作",
                key: "actions",
                width: 200,
                render: (_, row) => (
                    <Space>
                        <Button type="link" size="small" onClick={() => openEdit(row)}>
                            编辑
                        </Button>
                        {row.status !== "archived" && (
                            <Button type="link" size="small" danger onClick={() => archive(row.id)}>
                                归档
                            </Button>
                        )}
                    </Space>
                ),
            },
        ],
        [],
    )

    return (
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <Title level={3} style={{ marginTop: 0 }}>
                展会
            </Title>
            <Form
                form={createForm}
                layout="vertical"
                onFinish={onCreate}
                style={{ marginBottom: 24, maxWidth: 560 }}
            >
                <Form.Item label="名称" name="name" rules={[{ required: true, message: "请填写展会名称" }]}>
                    <Input placeholder="展会名称" />
                </Form.Item>
                <Form.Item label="LOGO URL" name="logo_url">
                    <Input placeholder="https://… 图片地址" />
                </Form.Item>
                <Space wrap size="large">
                    <Form.Item label="开始时间" name="starts_at">
                        <DatePicker showTime style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item label="结束时间" name="ends_at">
                        <DatePicker showTime style={{ width: "100%" }} />
                    </Form.Item>
                </Space>
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={createLoading}>
                        创建展会
                    </Button>
                </Form.Item>
            </Form>
            <Table<EventRow>
                rowKey="id"
                loading={loadingList}
                columns={columns}
                dataSource={events}
                pagination={false}
            />
            <Modal
                title="编辑展会"
                open={editOpen}
                onCancel={() => {
                    setEditOpen(false)
                    setEditing(null)
                }}
                onOk={onEditSave}
                confirmLoading={editLoading}
                destroyOnHidden
            >
                <Form form={editForm} layout="vertical">
                    <Form.Item label="名称" name="name" rules={[{ required: true, message: "请填写名称" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="LOGO URL" name="logo_url">
                        <Input allowClear placeholder="留空可清除" />
                    </Form.Item>
                    <Form.Item label="开始时间" name="starts_at">
                        <DatePicker showTime style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item label="结束时间" name="ends_at">
                        <DatePicker showTime style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item label="状态" name="status" rules={[{ required: true }]}>
                        <Select
                            options={[
                                { value: "draft", label: "draft" },
                                { value: "active", label: "active" },
                                { value: "archived", label: "archived" },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

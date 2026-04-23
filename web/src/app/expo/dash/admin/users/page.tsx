"use client"

import { useEffect, useMemo, useState } from "react"
import {
    App,
    Button,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Table,
    Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import { expoGet, expoPatch, expoPost } from "[@BASE]/features/expo/lib/expo-api"
import { useExpoAuthStore } from "[@BASE]/features/expo/stores/expo-auth.store"

const { Title, Text } = Typography

interface RoleRow {
    id: string
    key: string
    name: string
}

interface ListedUser {
    user: {
        id: string
        username: string
        display_name: string
        phone: string | null
        disabled: boolean
        registration_status: string
    }
    role_id: string
    role_key?: string
}

type CreateForm = {
    display_name?: string
    phone?: string
    username: string
    password: string
    role_id: string
}

type EditForm = {
    display_name: string
    phone?: string
    role_id: string
}

export default function ExpoAdminUsersPage() {
    const { message } = App.useApp()
    const currentEventId = useExpoAuthStore((s) => s.user?.current_event_id)
    const [roles, setRoles] = useState<RoleRow[]>([])
    const [users, setUsers] = useState<ListedUser[]>([])
    const [listLoading, setListLoading] = useState(false)
    const [createLoading, setCreateLoading] = useState(false)
    const [createForm] = Form.useForm<CreateForm>()

    const [resetOpen, setResetOpen] = useState(false)
    const [resetUserId, setResetUserId] = useState<string | null>(null)
    const [resetLoading, setResetLoading] = useState(false)
    const [resetForm] = Form.useForm<{ new_password: string }>()

    const [editOpen, setEditOpen] = useState(false)
    const [editRow, setEditRow] = useState<ListedUser | null>(null)
    const [editLoading, setEditLoading] = useState(false)
    const [editForm] = Form.useForm<EditForm>()

    const loadRoles = () => {
        expoGet<RoleRow[]>("/expo/roles")
            .then((r) => {
                setRoles(r)
                const rid = createForm.getFieldValue("role_id")
                if (!rid && r[0]) createForm.setFieldValue("role_id", r[0].id)
            })
            .catch((e) => message.error(e instanceof Error ? e.message : "加载角色失败"))
    }

    const loadUsers = () => {
        if (!currentEventId) {
            message.warning("请先在侧栏切换当前展会")
            return
        }
        setListLoading(true)
        expoGet<ListedUser[]>(`/expo/users?event_id=${currentEventId}`)
            .then(setUsers)
            .catch((e) => message.error(e instanceof Error ? e.message : "加载用户失败"))
            .finally(() => setListLoading(false))
    }

    useEffect(() => {
        loadRoles()
    }, [])

    useEffect(() => {
        loadUsers()
    }, [currentEventId])

    const onCreate = async (values: CreateForm) => {
        if (!currentEventId) return
        if (!values.username?.trim() || !values.password || !values.role_id) {
            message.error("请填写用户名、密码并选择角色")
            return
        }
        setCreateLoading(true)
        try {
            await expoPost("/expo/users", {
                username: values.username.trim(),
                password: values.password,
                display_name: values.display_name?.trim() || undefined,
                phone: values.phone?.trim() || undefined,
                event_id: currentEventId,
                role_id: values.role_id,
            })
            message.success("用户已创建")
            createForm.resetFields(["username", "password", "display_name", "phone"])
            loadUsers()
        } catch (e) {
            message.error(e instanceof Error ? e.message : "创建失败")
        } finally {
            setCreateLoading(false)
        }
    }

    const toggleDisabled = async (u: ListedUser) => {
        if (!currentEventId) return
        try {
            await expoPatch(`/expo/users/${u.user.id}`, {
                event_id: currentEventId,
                disabled: !u.user.disabled,
            })
            message.success("已更新")
            loadUsers()
        } catch (e) {
            message.error(e instanceof Error ? e.message : "更新失败")
        }
    }

    const kick = async (userId: string) => {
        if (!currentEventId) return
        try {
            await expoPost(`/expo/users/${userId}/kick`, { event_id: currentEventId })
            message.success("已踢下线")
        } catch (e) {
            message.error(e instanceof Error ? e.message : "操作失败")
        }
    }

    const openReset = (userId: string) => {
        setResetUserId(userId)
        resetForm.resetFields()
        setResetOpen(true)
    }

    const submitReset = async () => {
        if (!currentEventId || !resetUserId) return
        try {
            const v = await resetForm.validateFields()
            setResetLoading(true)
            await expoPost(`/expo/users/${resetUserId}/reset-password`, {
                event_id: currentEventId,
                new_password: v.new_password,
            })
            message.success("密码已重置（不会在界面回显）")
            setResetOpen(false)
            setResetUserId(null)
        } catch (e) {
            if (e && typeof e === "object" && "errorFields" in e) return
            message.error(e instanceof Error ? e.message : "失败")
        } finally {
            setResetLoading(false)
        }
    }

    const openEdit = (row: ListedUser) => {
        setEditRow(row)
        editForm.setFieldsValue({
            display_name: row.user.display_name ?? "",
            phone: row.user.phone ?? "",
            role_id: row.role_id,
        })
        setEditOpen(true)
    }

    const submitEdit = async () => {
        if (!currentEventId || !editRow) return
        try {
            const v = await editForm.validateFields()
            setEditLoading(true)
            await expoPatch(`/expo/users/${editRow.user.id}`, {
                event_id: currentEventId,
                display_name: v.display_name.trim(),
                phone: v.phone?.trim() ? v.phone.trim() : null,
                role_id: v.role_id,
            })
            message.success("已保存")
            setEditOpen(false)
            setEditRow(null)
            loadUsers()
        } catch (e) {
            if (e && typeof e === "object" && "errorFields" in e) return
            message.error(e instanceof Error ? e.message : "保存失败")
        } finally {
            setEditLoading(false)
        }
    }

    const columns: ColumnsType<ListedUser> = useMemo(
        () => [
            { title: "姓名", key: "display_name", render: (_, r) => r.user.display_name || "—" },
            { title: "手机", key: "phone", render: (_, r) => r.user.phone || "—" },
            { title: "用户名", key: "username", render: (_, r) => r.user.username },
            { title: "角色", key: "role", render: (_, r) => r.role_key ?? "—" },
            {
                title: "状态",
                key: "st",
                width: 100,
                render: (_, r) => (r.user.disabled ? "已禁用" : "正常"),
            },
            {
                title: "操作",
                key: "actions",
                width: 320,
                render: (_, row) => (
                    <Space wrap>
                        <Button type="link" size="small" onClick={() => openEdit(row)}>
                            编辑
                        </Button>
                        <Button type="link" size="small" onClick={() => toggleDisabled(row)}>
                            {row.user.disabled ? "启用" : "禁用"}
                        </Button>
                        <Button type="link" size="small" onClick={() => openReset(row.user.id)}>
                            重置密码
                        </Button>
                        <Button type="link" size="small" onClick={() => kick(row.user.id)}>
                            踢下线
                        </Button>
                    </Space>
                ),
            },
        ],
        [],
    )

    return (
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <Title level={3} style={{ marginTop: 0 }}>
                人员列表
            </Title>
            {!currentEventId && <Text type="danger">请先切换展会。</Text>}
            <Title level={5}>新建</Title>
            <Form
                form={createForm}
                layout="vertical"
                onFinish={onCreate}
                style={{ maxWidth: 640, marginBottom: 24 }}
            >
                <Form.Item label="姓名" name="display_name">
                    <Input placeholder="可选" />
                </Form.Item>
                <Form.Item label="手机" name="phone">
                    <Input placeholder="可选" />
                </Form.Item>
                <Form.Item label="用户名" name="username" rules={[{ required: true, message: "必填" }]}>
                    <Input autoComplete="off" />
                </Form.Item>
                <Form.Item
                    label="密码"
                    name="password"
                    rules={[{ required: true, message: "必填" }, { min: 6, message: "至少 6 位" }]}
                >
                    <Input.Password autoComplete="new-password" />
                </Form.Item>
                <Form.Item label="角色" name="role_id" rules={[{ required: true, message: "请选择角色" }]}>
                    <Select
                        options={roles.map((r) => ({ value: r.id, label: `${r.name} (${r.key})` }))}
                        placeholder="选择角色"
                    />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={createLoading}>
                        创建
                    </Button>
                </Form.Item>
            </Form>
            <Table<ListedUser>
                rowKey={(r) => r.user.id}
                loading={listLoading}
                columns={columns}
                dataSource={users}
                pagination={false}
            />
            <Modal
                title="重置密码"
                open={resetOpen}
                onCancel={() => {
                    setResetOpen(false)
                    setResetUserId(null)
                }}
                onOk={submitReset}
                confirmLoading={resetLoading}
                destroyOnHidden
            >
                <Form form={resetForm} layout="vertical">
                    <Form.Item
                        label="新密码"
                        name="new_password"
                        rules={[{ required: true, message: "请输入新密码" }, { min: 6, message: "至少 6 位" }]}
                    >
                        <Input.Password autoComplete="new-password" />
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                title="编辑用户"
                open={editOpen}
                onCancel={() => {
                    setEditOpen(false)
                    setEditRow(null)
                }}
                onOk={submitEdit}
                confirmLoading={editLoading}
                destroyOnHidden
            >
                <Form form={editForm} layout="vertical">
                    <Form.Item label="姓名" name="display_name" rules={[{ required: true, message: "请输入姓名" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="手机" name="phone">
                        <Input allowClear placeholder="可选" />
                    </Form.Item>
                    <Form.Item label="角色" name="role_id" rules={[{ required: true }]}>
                        <Select options={roles.map((r) => ({ value: r.id, label: `${r.name} (${r.key})` }))} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

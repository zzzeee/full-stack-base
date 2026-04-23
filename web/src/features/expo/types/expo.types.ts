/**
 * /api/expo/me 与登录返回中的 user 载荷（节选）
 */
export interface ExpoMembership {
    event: {
        id: string
        name: string
        logo_url: string | null
        status: string
        starts_at: string | null
        ends_at: string | null
    }
    role_key?: string
    role_id: string
}

export interface ExpoMe {
    id: string
    username: string
    display_name: string
    phone: string | null
    remark: string | null
    registration_status: string
    current_event_id: string | null
    current_event: ExpoMembership["event"] | null
    memberships: ExpoMembership[]
    permissions: string[]
}

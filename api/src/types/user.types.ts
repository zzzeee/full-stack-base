export interface UserProfile {
    id: string
    email: string
    phone?: string
    nickname?: string
    avatar?: string
    bio?: string
    created_at: string
    updated_at: string
}

export interface LoginRequest {
    email: string
    password: string
    captcha?: string // 验证码（可选，根据需求）
}

export interface RegisterRequest extends LoginRequest {
    nickname?: string
    phone?: string
}

export interface UpdateProfileRequest {
    nickname?: string
    phone?: string
    avatar?: string
    bio?: string
}

export interface AuthResponse {
    user: UserProfile
    token: string
}
export interface User {
    id: string
    email: string
    name: string
}

export interface LoginWithPasswordPayload {
    email: string
    password: string
}

export interface LoginWithCodePayload {
    email: string
    code: string
}

export interface AuthResponse {
    user: User
    token: string
}
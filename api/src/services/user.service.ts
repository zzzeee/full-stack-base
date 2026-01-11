import { supabaseClient } from '../lib/supabase.client.ts'
import { config } from '../config/index.ts'
import type { UserProfile, RegisterRequest, UpdateProfileRequest } from '../types/user.types.ts'

export const userService = {
    // 查找用户（邮箱）
    async findByEmail(email: string): Promise<UserProfile | null> {
        const { data, error: dbError } = await supabaseClient
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle()

        if (dbError) {
            console.error('查询用户失败:', dbError)
            return null
        }
        return data
    },

    // 创建用户（先创建Auth用户，再创建profile）
    async create(userData: RegisterRequest): Promise<UserProfile> {
        // 1. 先在Supabase Auth中创建用户
        const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true, // 自动确认邮箱
            user_metadata: {
                nickname: userData.nickname || userData.email.split('@')[0]
            }
        })

        if (authError) {
            console.error('创建Auth用户失败:', authError)
            throw new Error(`创建用户失败: ${authError.message}`)
        }

        // 2. 在users表中创建用户资料
        const { data, error: dbError } = await supabaseClient
            .from('users')
            .insert([{
                id: authData.user.id, // 使用Auth的user.id
                email: userData.email,
                nickname: userData.nickname || userData.email.split('@')[0],
                phone: userData.phone || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single()

        if (dbError) {
            // 如果users表插入失败，尝试删除Auth用户（清理）
            await supabaseClient.auth.admin.deleteUser(authData.user.id)
            throw new Error(`创建用户资料失败: ${dbError.message}`)
        }

        return data
    },

    // 更新用户资料
    async updateProfile(userId: string, updates: UpdateProfileRequest): Promise<UserProfile> {
        const updateData = {
            ...updates,
            updated_at: new Date().toISOString()
        }

        const { data, error: dbError } = await supabaseClient
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .select()
            .single()

        if (dbError) {
            console.error('更新用户资料失败:', dbError)
            throw new Error(`更新失败: ${dbError.message}`)
        }

        return data
    },

    // 获取用户资料
    async getProfile(userId: string): Promise<UserProfile> {
        const { data, error: dbError } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()

        if (dbError) {
            console.error('获取用户资料失败:', dbError)
            throw new Error(`用户不存在: ${dbError.message}`)
        }

        return data
    },

    // 登录（新用户自动注册）
    async loginOrRegister(loginData: RegisterRequest): Promise<{ user: UserProfile; token: string }> {
        try {
            // 1. 尝试登录
            const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
                email: loginData.email,
                password: loginData.password
            })

            // 2. 如果登录失败且是因为用户不存在，则注册
            if (authError) {
                if (authError.message.includes('Invalid login credentials')) {
                    console.log('用户不存在，自动注册:', loginData.email)
                    const newUser = await this.create(loginData)

                    // 注册后自动登录
                    const { data: newAuthData, error: newAuthError } = await supabaseClient.auth.signInWithPassword({
                        email: loginData.email,
                        password: loginData.password
                    })

                    if (newAuthError) {
                        throw new Error(`注册后登录失败: ${newAuthError.message}`)
                    }

                    return {
                        user: newUser,
                        token: newAuthData.session.access_token
                    }
                }
                throw new Error(`登录失败: ${authError.message}`)
            }

            // 3. 登录成功，获取或创建用户资料
            let user = await this.findByEmail(loginData.email)

            if (!user) {
                // 用户存在于Auth但不在users表，自动同步
                user = await this.create({
                    email: loginData.email,
                    password: loginData.password, // 仅用于类型，实际上不重复创建
                    nickname: authData.user.user_metadata?.nickname
                })
            }

            return {
                user,
                token: authData.session.access_token
            }
        } catch (error) {
            console.error('登录/注册过程错误:', error)
            throw error
        }
    },

    // 更新用户在Auth中的metadata
    async updateAuthMetadata(userId: string, metadata: Record<string, any>) {
        const { error } = await supabaseClient.auth.admin.updateUserById(
            userId,
            { user_metadata: metadata }
        )

        if (error) {
            console.error('更新Auth metadata失败:', error)
            throw new Error(`更新用户信息失败: ${error.message}`)
        }
    }
}
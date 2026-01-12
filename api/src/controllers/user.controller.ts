import { Hono } from '@hono/hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware, getCurrentUser } from '../middlewares/auth.middleware.ts'
import { userService } from '../services/user.service.ts'
import { success, error } from '../lib/response.ts'
import type { UpdateProfileRequest } from '../types/user.types.ts'
import { getErrorMessage } from '../untils/error.ts'

const userController = new Hono()

// 应用认证中间件
userController.use('*', authMiddleware)

// 更新资料Schema
const updateProfileSchema = z.object({
    nickname: z.string().min(2).max(20).optional(),
    phone: z.string().regex(/^1[3-9]\d{9}$/).optional(),
    avatar: z.string().url().optional(),
    bio: z.string().max(200).optional()
})

// 3. 获取个人资料
userController.get('/profile', async (c) => {
    try {
        const user = getCurrentUser(c)
        const profile = await userService.getProfile(user.id)

        return success(profile, '获取成功')
    } catch (err) {
        console.error('获取资料失败:', err)
        return error(getErrorMessage(err) || '获取失败', 400)
    }
})

// 4. 更新个人资料
userController.put('/profile', zValidator('json', updateProfileSchema), async (c) => {
    try {
        const user = getCurrentUser(c)
        const updates = c.req.valid('json') as UpdateProfileRequest

        const updatedProfile = await userService.updateProfile(user.id, updates)

        return success(updatedProfile, '资料更新成功')
    } catch (err) {
        console.error('更新资料失败:', err)
        return error(getErrorMessage(err) || '更新失败', 400)
    }
})

export default userController
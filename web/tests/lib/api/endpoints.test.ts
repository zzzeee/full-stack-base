/**
 * API Endpoints 测试
 */

import { describe, it, expect } from 'vitest'
import {
    ENDPOINTS,
    AUTH_ENDPOINTS,
    USER_ENDPOINTS,
    UPLOAD_ENDPOINTS,
    NOTIFICATION_ENDPOINTS,
    SEARCH_ENDPOINTS,
    buildPathUrl,
    buildFullUrl,
} from '@/lib/api/endpoints'

describe('AUTH_ENDPOINTS', () => {
    it('应该返回正确的登录端点', () => {
        expect(AUTH_ENDPOINTS.login()).toBe('/auth/login')
    })

    it('应该返回正确的注册端点', () => {
        expect(AUTH_ENDPOINTS.register()).toBe('/auth/register')
    })

    it('应该返回正确的验证邮箱端点', () => {
        expect(AUTH_ENDPOINTS.verifyEmail('test-token')).toBe(
            '/auth/verify-email/test-token'
        )
    })

    it('应该返回正确的 OAuth 端点', () => {
        expect(AUTH_ENDPOINTS.oauth('google')).toBe('/auth/oauth/google')
        expect(AUTH_ENDPOINTS.oauth('github')).toBe('/auth/oauth/github')
    })
})

describe('USER_ENDPOINTS', () => {
    it('应该返回不带参数的用户列表端点', () => {
        expect(USER_ENDPOINTS.list()).toBe('/users')
    })

    it('应该返回带查询参数的用户列表端点', () => {
        const endpoint = USER_ENDPOINTS.list({
            page: 1,
            limit: 10,
            search: 'john',
            role: 'admin',
        })

        expect(endpoint).toContain('/users?')
        expect(endpoint).toContain('page=1')
        expect(endpoint).toContain('limit=10')
        expect(endpoint).toContain('search=john')
        expect(endpoint).toContain('role=admin')
    })

    it('应该返回单个用户端点', () => {
        expect(USER_ENDPOINTS.getById('123')).toBe('/users/123')
    })

    it('应该返回用户创建端点', () => {
        expect(USER_ENDPOINTS.create()).toBe('/users')
    })

    it('应该返回用户更新端点', () => {
        expect(USER_ENDPOINTS.update('123')).toBe('/users/123')
    })

    it('应该返回用户删除端点', () => {
        expect(USER_ENDPOINTS.delete('123')).toBe('/users/123')
    })

    it('应该返回用户头像更新端点', () => {
        expect(USER_ENDPOINTS.updateAvatar('123')).toBe('/users/123/avatar')
    })

    it('应该返回用户统计端点', () => {
        expect(USER_ENDPOINTS.stats('123')).toBe('/users/123/stats')
    })

    it('应该返回用户活动日志端点', () => {
        const endpoint = USER_ENDPOINTS.activities('123', { page: 1, limit: 20 })

        expect(endpoint).toContain('/users/123/activities')
        expect(endpoint).toContain('page=1')
        expect(endpoint).toContain('limit=20')
    })

    it('应该过滤掉 undefined 和 null 参数', () => {
        const endpoint = USER_ENDPOINTS.list({
            page: 1,
            limit: undefined,
            search: null as any,
        })

        expect(endpoint).toContain('page=1')
        expect(endpoint).not.toContain('limit')
        expect(endpoint).not.toContain('search')
    })
})

describe('UPLOAD_ENDPOINTS', () => {
    it('应该返回正确的上传端点', () => {
        expect(UPLOAD_ENDPOINTS.single()).toBe('/upload/single')
        expect(UPLOAD_ENDPOINTS.multiple()).toBe('/upload/multiple')
    })

    it('应该返回文件删除端点', () => {
        expect(UPLOAD_ENDPOINTS.delete('file-123')).toBe('/upload/file-123')
    })

    it('应该返回文件信息端点', () => {
        expect(UPLOAD_ENDPOINTS.getInfo('file-123')).toBe('/upload/file-123')
    })

    it('应该返回带参数的文件列表端点', () => {
        const endpoint = UPLOAD_ENDPOINTS.list({ page: 1, type: 'image' })

        expect(endpoint).toContain('/upload?')
        expect(endpoint).toContain('page=1')
        expect(endpoint).toContain('type=image')
    })
})

describe('NOTIFICATION_ENDPOINTS', () => {
    it('应该返回通知列表端点', () => {
        const endpoint = NOTIFICATION_ENDPOINTS.list({
            page: 1,
            limit: 10,
            unread: true,
        })

        expect(endpoint).toContain('/notifications?')
        expect(endpoint).toContain('page=1')
        expect(endpoint).toContain('unread=true')
    })

    it('应该返回标记已读端点', () => {
        expect(NOTIFICATION_ENDPOINTS.markAsRead('notif-123')).toBe(
            '/notifications/notif-123/read'
        )
    })

    it('应该返回标记全部已读端点', () => {
        expect(NOTIFICATION_ENDPOINTS.markAllAsRead()).toBe(
            '/notifications/read-all'
        )
    })

    it('应该返回未读数量端点', () => {
        expect(NOTIFICATION_ENDPOINTS.unreadCount()).toBe(
            '/notifications/unread-count'
        )
    })
})

describe('SEARCH_ENDPOINTS', () => {
    it('应该返回全局搜索端点', () => {
        const endpoint = SEARCH_ENDPOINTS.global('test query')

        expect(endpoint).toContain('/search?')
        expect(endpoint).toContain('q=test+query')
    })

    it('应该返回用户搜索端点', () => {
        const endpoint = SEARCH_ENDPOINTS.users('john')

        expect(endpoint).toContain('/search/users?')
        expect(endpoint).toContain('q=john')
    })

    it('应该返回搜索建议端点', () => {
        const endpoint = SEARCH_ENDPOINTS.suggestions('test')

        expect(endpoint).toContain('/search/suggestions?')
        expect(endpoint).toContain('q=test')
    })

    it('应该支持额外参数', () => {
        const endpoint = SEARCH_ENDPOINTS.global('test', {
            type: 'users',
            limit: 20,
        })

        expect(endpoint).toContain('q=test')
        expect(endpoint).toContain('type=users')
        expect(endpoint).toContain('limit=20')
    })
})

describe('辅助函数', () => {
    describe('buildPathUrl', () => {
        it('应该替换路径参数', () => {
            const url = buildPathUrl('/users/:id/posts/:postId', {
                id: '123',
                postId: '456',
            })

            expect(url).toBe('/users/123/posts/456')
        })

        it('应该处理数字参数', () => {
            const url = buildPathUrl('/users/:id', { id: 123 })

            expect(url).toBe('/users/123')
        })

        it('应该处理单个参数', () => {
            const url = buildPathUrl('/users/:id', { id: 'abc' })

            expect(url).toBe('/users/abc')
        })
    })

    describe('buildFullUrl', () => {
        it('应该构建带查询参数的完整 URL', () => {
            const url = buildFullUrl('/users', {
                page: 1,
                limit: 10,
                search: 'john',
            })

            expect(url).toContain('/users?')
            expect(url).toContain('page=1')
            expect(url).toContain('limit=10')
            expect(url).toContain('search=john')
        })

        it('应该处理没有参数的情况', () => {
            const url = buildFullUrl('/users')

            expect(url).toBe('/users')
        })

        it('应该过滤掉 undefined 和 null', () => {
            const url = buildFullUrl('/users', {
                page: 1,
                limit: undefined,
                search: null,
            })

            expect(url).toContain('page=1')
            expect(url).not.toContain('limit')
            expect(url).not.toContain('search')
        })

        it('应该正确编码特殊字符', () => {
            const url = buildFullUrl('/search', {
                q: 'hello world & test',
            })

            expect(url).toContain('q=hello+world')
        })
    })
})

describe('ENDPOINTS 完整性', () => {
    it('应该包含所有模块', () => {
        expect(ENDPOINTS).toHaveProperty('auth')
        expect(ENDPOINTS).toHaveProperty('users')
        expect(ENDPOINTS).toHaveProperty('upload')
        expect(ENDPOINTS).toHaveProperty('notifications')
        expect(ENDPOINTS).toHaveProperty('search')
        expect(ENDPOINTS).toHaveProperty('settings')
        expect(ENDPOINTS).toHaveProperty('analytics')
        expect(ENDPOINTS).toHaveProperty('logs')
    })

    it('每个模块应该是函数集合', () => {
        Object.values(ENDPOINTS).forEach((module) => {
            expect(typeof module).toBe('object')
            Object.values(module).forEach((endpoint) => {
                expect(typeof endpoint).toBe('function')
            })
        })
    })
})
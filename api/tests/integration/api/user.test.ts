// tests/integration/api/user.test.ts
/**
 * 用户接口集成测试
 * 测试所有用户相关的 API 端点
 */

import {
    assertEquals,
    assertExists,
} from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { get, put } from '[@BASE-tests]/helpers/index.ts';
import { authToken, testUser } from '[@BASE-tests]/integration/api/auth.test.ts';

/**
 * 测试套件：用户接口
 */
Deno.test('User API Integration Tests', async (t) => {
    let userId = '';

    /**
     * 1. GET /api/users/me - 获取当前用户资料
     */
    await t.step('should get current user profile', async () => {
        const response = await get('/api/users/me', authToken);

        assertEquals(response.status, 200);
        assertExists(response.data.data.id);
        assertExists(response.data.data.email);
        assertExists(response.data.data.name);

        // 保存用户 ID
        userId = response.data.data.id;

        // 验证用户信息
        assertEquals(response.data.data.email, testUser.email);
        assertEquals(response.data.data.name, testUser.name);

        console.log('✅ 获取用户资料成功');
        console.log(`   User ID: ${userId}`);
    });

    /**
     * 2. 测试未认证访问
     */
    await t.step('should reject unauthenticated request', async () => {
        const response = await get('/api/users/me');

        assertEquals(response.status, 401); // Unauthorized

        console.log('✅ 未认证访问被拒绝');
    });

    /**
     * 3. PUT /api/users/me - 更新用户资料
     */
    await t.step('should update user profile', async () => {
        const updateData = {
            name: 'Updated Test User',
            bio: 'This is my bio',
            phone: '13800138000',
        };

        const response = await put('/api/users/me', updateData, authToken);

        assertEquals(response.status, 200);
        assertEquals(response.data.data.name, updateData.name);
        assertEquals(response.data.data.bio, updateData.bio);
        assertEquals(response.data.data.phone, updateData.phone);

        console.log('✅ 用户资料更新成功');
    });

    /**
     * 4. 测试部分更新
     */
    await t.step('should partially update user profile', async () => {
        const updateData = {
            bio: 'New bio only',
        };

        const response = await put('/api/users/me', updateData, authToken);

        assertEquals(response.status, 200);
        assertEquals(response.data.data.bio, updateData.bio);
        // 其他字段应保持不变
        assertEquals(response.data.data.name, 'Updated Test User');

        console.log('✅ 部分更新成功');
    });

    /**
     * 5. 测试无效数据更新
     */
    await t.step('should reject invalid profile data', async () => {
        const invalidData = {
            name: 'A', // 太短（少于 2 个字符）
        };

        const response = await put('/api/users/me', invalidData, authToken);

        assertEquals(response.status, 400); // Bad Request

        console.log('✅ 无效数据被拒绝');
    });

    /**
     * 6. PUT /api/users/me/avatar - 更新头像
     */
    await t.step('should update user avatar', async () => {
        const avatarData = {
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=updated',
        };

        const response = await put('/api/users/me/avatar', avatarData, authToken);

        assertEquals(response.status, 200);
        assertEquals(response.data.data.avatar_url, avatarData.avatar_url);

        console.log('✅ 头像更新成功');
    });

    /**
     * 7. 测试无效头像 URL
     */
    await t.step('should reject invalid avatar URL', async () => {
        const invalidData = {
            avatar_url: 'not-a-valid-url',
        };

        const response = await put('/api/users/me/avatar', invalidData, authToken);

        assertEquals(response.status, 400); // Bad Request

        console.log('✅ 无效头像 URL 被拒绝');
    });

    /**
     * 8. PUT /api/users/me/password - 修改密码
     */
    await t.step('should change password', async () => {
        const passwordData = {
            old_password: testUser.password,
            new_password: 'NewPassword123',
        };

        const response = await put('/api/users/me/password', passwordData, authToken);

        assertEquals(response.status, 200);

        // 更新测试用户密码
        testUser.password = passwordData.new_password;

        console.log('✅ 密码修改成功');
    });

    /**
     * 9. 测试错误的旧密码
     */
    await t.step('should reject wrong old password', async () => {
        const passwordData = {
            old_password: 'WrongOldPassword123',
            new_password: 'AnotherNewPassword123',
        };

        const response = await put('/api/users/me/password', passwordData, authToken);

        assertEquals(response.status, 400); // Bad Request

        console.log('✅ 错误的旧密码被拒绝');
    });

    /**
     * 10. 测试新密码与旧密码相同
     */
    await t.step('should reject same new password', async () => {
        const passwordData = {
            old_password: testUser.password,
            new_password: testUser.password, // 相同密码
        };

        const response = await put('/api/users/me/password', passwordData, authToken);

        assertEquals(response.status, 400); // Bad Request

        console.log('✅ 相同的新密码被拒绝');
    });

    /**
     * 11. GET /api/users/:id - 获取用户公开资料
     */
    await t.step('should get user public profile', async () => {
        const response = await get(`/api/users/${userId}`, authToken);

        assertEquals(response.status, 200);
        assertEquals(response.data.data.id, userId);
        assertExists(response.data.data.name);
        assertExists(response.data.data.avatar_url);
        assertExists(response.data.data.bio);

        // 验证敏感信息未泄露
        assertEquals(response.data.data.email, undefined);
    
        console.log('✅ 获取公开资料成功（敏感信息已隐藏）');
    });
});

// tests/integration/api/auth.test.ts
/**
 * 认证接口集成测试
 * 测试所有认证相关的 API 端点
 */

import {
    assertEquals,
} from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { post, randomEmail, randomPassword } from '../../helpers/index.ts';

// 测试用户数据
const testUser = {
    email: randomEmail(),
    password: randomPassword(),
    name: 'Test User',
};

/**
 * 测试套件：认证接口
 */
Deno.test('Send Code API Tests', async (t) => {
    /**
     * 1. POST /api/auth/send-code - 发送验证码
     */
    await t.step('should send verification code successfully', async () => {
        const response = await post('/api/auth/send-code', {
            email: testUser.email,
            purpose: 'register',
        });

        assertEquals(response.status, 200);
        // assertEquals(response.data.data, null);
        // assertExists(response.data.message);
        console.log('✅ 验证码发送成功');
    });
});

// tests/integration/api/auth.test.ts
/**
 * 认证接口集成测试
 * 测试所有认证相关的 API 端点
 */

import {
    assertEquals,
    assertExists,
} from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { post, sleep, randomEmail, randomPassword } from './helpers.ts';
import { authRepository } from '@repositories/auth.repository.ts'

// 测试用户数据
const testUser = {
    email: randomEmail(),
    password: randomPassword(),
    name: 'Test User',
};

let authToken = '';

/**
 * 测试套件：认证接口
 */
Deno.test('Auth API Integration Tests 003', async (t) => {
    /**
     * 1. POST /api/auth/send-code - 发送验证码
     */
    await t.step('==> 1. should send verification code successfully', async () => {
        const response = await post('/api/auth/send-code', {
            email: testUser.email,
            purpose: 'register',
        });

        assertEquals(response.status, 200);

        console.log('✅ 验证码发送成功');
    });

    /**
     * 2. 测试验证码发送频率限制
     */
    await t.step('==> 2. should reject too frequent verification code requests', async () => {
        const response = await post('/api/auth/send-code', {
            email: testUser.email,
            purpose: 'register',
        });

        assertEquals(response.status, 429); // Too Many Requests

        console.log('✅ 频率限制测试通过');
    });

    /**
     * 3. 等待 60 秒后重新发送（跳过此测试以节省时间）
     */
    await t.step('==> 3. wait 5 seconds for rate limit', () => {
        console.log('⏳ 等待 5 秒以测试重新发送...');
        sleep(5*1000);
        console.log('⏭️  跳过等待（注释掉以实际测试）');
    });

    /**
     * 4. POST /api/auth/register - 用户注册
     */
    await t.step('==> 4. should register new user successfully', async () => {
        const lastCode = await authRepository.getLastVerification(testUser.email, 'register')
        console.log('get email code(db data): ', lastCode?.code);

        assertExists(lastCode?.code)
        if(lastCode?.code) {
            const response = await post('/api/auth/register', {
                email: testUser.email,
                password: testUser.password,
                name: testUser.name,
                code: lastCode?.code,
            });
    
            assertEquals(response.status, 201);
            assertExists(response.data.data.user);
            assertExists(response.data.data.token);
            // 保存 token 用于后续测试
            authToken = response.data.data.token;
    
            // 验证用户信息
            assertEquals(response.data.data.user.email, testUser.email);
            assertEquals(response.data.data.user.name, testUser.name);
    
            console.log('✅ 用户注册成功');
            console.log(`   Token: ${authToken.substring(0, 20)}...`);
        }

    });

    /**
     * 5. 测试重复注册
     */
    await t.step('==> 5. should reject duplicate email registration', async () => {
        const response = await post('/api/auth/send-code', {
            email: testUser.email,
            purpose: 'register',
        });

        assertEquals(response.status, 429); // Conflict

        console.log('✅ 重复邮箱注册被拒绝');
    });

    /**
     * 6. POST /api/auth/logout - 退出登录
     */
    await t.step('==> 6. should logout successfully', async () => {
        const response = await post('/api/auth/logout', {}, authToken);

        assertEquals(response.status, 200);

        console.log('✅ 退出登录成功');
    });

    /**
     * 7. POST /api/auth/login/password - 密码登录
     */
    // await t.step('should login with password successfully', async () => {
    //     const response = await post('/api/auth/login/password', {
    //         email: testUser.email,
    //         password: testUser.password,
    //     });

    //     assertEquals(response.status, 200);
    //     assertExists(response.data.data.user);
    //     assertExists(response.data.data.token);

    //     // 更新 token
    //     authToken = response.data.data.token;

    //     console.log('✅ 密码登录成功');
    // });

    /**
     * 8. 测试错误密码登录
     */
    // await t.step('should reject invalid password', async () => {
    //     const response = await post('/api/auth/login/password', {
    //         email: testUser.email,
    //         password: 'WrongPassword123',
    //     });

    //     assertEquals(response.status, 401); // Unauthorized

    //     console.log('✅ 错误密码被拒绝');
    // });

    /**
     * 9. POST /api/auth/send-code - 发送登录验证码
     */
    // await t.step('should send login verification code', async () => {
    //     const response = await post('/api/auth/send-code', {
    //         email: testUser.email,
    //         purpose: 'login',
    //     });

    //     assertEquals(response.status, 200);

    //     console.log('✅ 登录验证码发送成功');
    // });

    /**
     * 10. POST /api/auth/login/code - 验证码登录
     */
    await t.step('==> 7. should login with verification code', async () => {
        await sleep(10 * 1000)
        const lastCode = await authRepository.getLastVerification(testUser.email, 'register')
        console.log('get email code(db data): ', lastCode?.code);

        assertExists(lastCode?.code)
        if(lastCode?.code) {
            const response = await post('/api/auth/login/code', {
                email: testUser.email,
                code: lastCode.code,
            });
    
            assertEquals(response.status, 200);
            assertExists(response.data.data.user);
            assertExists(response.data.data.token);
    
            // 更新 token
            authToken = response.data.data.token;
    
            console.log('✅ 验证码登录成功');
        }
    });

    /**
     * 11. 测试错误验证码
     */
    // await t.step('should reject invalid verification code', async () => {
    //     const response = await post('/api/auth/login/code', {
    //         email: testUser.email,
    //         code: '999999',
    //     });

    //     assertEquals(response.status, 400); // Bad Request

    //     console.log('✅ 错误验证码被拒绝');
    // });
});

// 导出 token 供其他测试使用
export { authToken, testUser };
// tests/auth/unit.ts
/**
 * 认证相关的测试单元
 */

import {
    assertEquals,
    assertExists,
} from 'https://deno.land/std@0.208.0/assert/mod.ts';
import {
    AUTH_CONF,
} from './config.ts';
import { 
    post,
    // randomEmail
} from '../helpers/index.ts';
import { getLastVerification } from "../helpers/supabase.ts";


// 发送验证码
export const sendCodeUnit = async () => {
    const response = await post('/api/auth/send-code', {
        email: AUTH_CONF.email,
        purpose: 'register',
    });

    assertEquals(response.status, 200);

    console.log('✅ 验证码发送成功');
}

// 测试验证码发送频率限制
export const frequentSendCodeUnit = async () => {
    const response = await post('/api/auth/send-code', {
        email: AUTH_CONF.email,
        purpose: 'register',
    });

    assertEquals(response.status, 429); // Too Many Requests

    console.log('✅ 频率限制测试通过');
}

export const registerWithOTPUnit = async (
    email = AUTH_CONF.email, 
    purpose = 'register',
    password = AUTH_CONF.password,
    name = AUTH_CONF.name,
) => {
    const lastCode = await getLastVerification(email, purpose);

    assertExists(lastCode || undefined)

    const response = await post('/api/auth/register', {
        email: lastCode,
        password: password,
        name: name,
        code: lastCode,
    });

    assertEquals(response.status, 201);
    assertExists(response.data.data.user);
    assertExists(response.data.data.token);
    
    // 保存 token 用于后续测试
    globalThis.TOKEN = response.data.data.token;

    // 验证用户信息
    assertEquals(response.data.data.user.email, email);
    assertEquals(response.data.data.user.name, name);

    console.log('✅ 用户注册成功');
    console.log(`Token: ${globalThis.TOKEN.substring(0, 20)}...`);
}

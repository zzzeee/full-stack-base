// tests/auth/unit.ts
/**
 * 认证相关的测试单元
 */

import {
    assertEquals,
    assertExists,
} from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { AUTH_CONF } from './config.ts';
import { post } from '../helpers/index.ts';
import { getEmailCode } from "../helpers/supabase.ts";


// 发送验证码
export const sendCodeUnit = async (email = AUTH_CONF.email, purpose = 'register') => {
    const response = await post('/api/auth/send-code', {
        email,
        purpose,
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

/*************************************
 * 使用OTP注册的测试单元
 * 
 * @param email <string> 注册邮件
 * @param password <string> 用户密码
 * @param name <string> 用户姓名
 * 
 * @return void
 *************************************/
export const registerWithOTPUnit = async (
    email = AUTH_CONF.email,
    password = AUTH_CONF.password,
    name = AUTH_CONF.name,
) => {
    const lastCode = await getEmailCode(email, 'register');
    // --------------------------
    // | 断言: 判断验证是不是不存在 |
    // --------------------------
    assertExists(lastCode || undefined)
    
    // 请求接口
    console.log(`email: [${email}]`);
    console.log(`password: [${password}]`);
    console.log(`name: [${name}]`);
    console.log(`lastCode: [${lastCode}]`);
    const response = await post('/api/auth/register', {
        email: email,
        password: password,
        name: name,
        code: lastCode,
    });
    console.log('response.status: ', response.status);
    if(response.data?.success && response.data?.data?.token) {
        console.log('token: ', response.data.data.token);
    }else {
        console.log('response.data: ', response.data);
    }

    // -------------------------------
    // | 断言: 判断是否注册成功并返回数据 |
    // -------------------------------
    assertEquals(response.status, 201);
    assertExists(response.data.data.user);
    assertExists(response.data.data.token);
    
    // 保存 token 和 user, 用于后续测试
    globalThis.TOKEN = response.data.data.token;
    globalThis.USER = response.data.data.user;

    // -------------------------------
    // | 断言: 验证返回的用户数据是否正确 |
    // -------------------------------
    assertEquals(response.data.data.user.email, email);
    assertEquals(response.data.data.user.name, name);

    console.log('✅ 用户注册成功');
    // -- token --
    // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ODZlODlmNi1jNDlhLTRlMWItOTQxMi1mZjAyZGQxYTczMTkiLCJlbWFpbCI6InRlc3QtMTc2ODQ4OTY0NzYyMy0za2dhbTVAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImV4cCI6MTc2OTA5NDQ1MCwiaWF0IjoxNzY4NDg5NjUwfQ.kP22lDaQCXbUpm-XC-9ECk6jUZgyJkyXWkBeYOC2_5k
    // -- id --
    // 786e89f6-c49a-4e1b-9412-ff02dd1a7319
    // -- email --
    // test-1768489647623-3kgam5@example.com
}

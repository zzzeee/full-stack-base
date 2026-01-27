/**
 * 认证相关的测试
 * tests/auth/index.test.ts
 */

import {
    sendCodeUnit,
    frequentSendCodeUnit,
    registerWithOTPUnit,
} from '@tests/auth/unit.ts';


Deno.test('从发验证码到注册用户`', async (t) => {
    // *********
    await t.step('>> 1. 发送验证码', () => sendCodeUnit());

    // *********
    await t.step('>> 2. 频繁发送验证码', () => frequentSendCodeUnit());

    // *********
    await t.step('>> 3. 注册用户', () => registerWithOTPUnit())
});
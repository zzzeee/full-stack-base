// tests/auth/index.test.ts
/**
 * 认证相关的测试
 */

import {
    sendCodeUnit,
    frequentSendCodeUnit,
} from './unit.ts';


Deno.test('认证接口测试00`', async (t) => {
    // *********
    await t.step('>> 1. 发送验证码', sendCodeUnit);
    // *********
    await t.step('>> 2. 频繁发送验证码', frequentSendCodeUnit);
});
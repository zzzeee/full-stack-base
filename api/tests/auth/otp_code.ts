/**
 * 发送验证的测试
 */

import { sendCodeUnit } from '[@BASE-tests]/auth/unit.ts';

Deno.test('从发验证码到注册用户`', async (t) => {
    // *********
    await t.step('>> 1. 发送验证码', () => sendCodeUnit());
});
// tests/auth/config.ts
/**
 * 认证相关的配置
 */

import {
    randomEmail, 
    randomPassword,
} from '../helpers/index.ts';


export const AUTH_CONF = {
    email: randomEmail(),
    password: randomPassword(),
    name: 'Test' + (new Date().getTime()),
}

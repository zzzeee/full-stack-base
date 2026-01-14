// src/lib/password.ts
/**
 * 密码加密和验证工具
 * 使用 bcrypt 算法
 */

import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';
import { logger } from './logger.ts';

/**
 * 默认加密轮数
 * 推荐值：10-12
 */
const SALT_ROUNDS = parseInt(Deno.env.get('BCRYPT_ROUNDS') || '10');

/**
 * 加密密码
 * @param password - 明文密码
 * @returns Promise<string> - 加密后的密码哈希
 */
export async function hashPassword(password: string): Promise<string> {
    try {
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        const hash = await bcrypt.hash(password, salt);
        logger.debug('Password hashed successfully');
        return hash;
    } catch (error) {
        logger.error('Failed to hash password', {
            error: error instanceof Error ? error.message : String(error),
        });
        throw new Error('密码加密失败');
    }
}

/**
 * 验证密码
 * @param password - 明文密码
 * @param hash - 密码哈希
 * @returns Promise<boolean> - 密码是否匹配
 */
export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    try {
        const isValid = await bcrypt.compare(password, hash);
        logger.debug('Password verification completed', { isValid });
        return isValid;
    } catch (error) {
        logger.error('Failed to verify password', {
            error: error instanceof Error ? error.message : String(error),
        });
        return false;
    }
}

/**
 * 生成随机密码
 * @param length - 密码长度（默认 16）
 * @returns string - 随机密码
 */
export function generateRandomPassword(length = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';

    const allChars = lowercase + uppercase + numbers + symbols;

    let password = '';

    // 确保包含每种字符类型
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // 填充剩余长度
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // 打乱顺序
    return password
        .split('')
        .sort(() => Math.random() - 0.5)
        .join('');
}
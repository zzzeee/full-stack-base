/**
 * @file auth.repository.ts
 * @description 认证数据访问层，负责验证码和登录日志的操作
 * @author System
 * @createDate 2026-01-25
 */

import { BaseRepository } from '@/repositories/base.repository.ts';
import { logger } from '@/lib/logger.ts';
import type {
    VerificationCode,
    VerificationCodeInsert,
    LoginLog,
    LoginLogInsert,
} from '@/types/auth.types.ts';

/**
 * 认证仓储类
 * 
 * @class
 * @extends {BaseRepository}
 * @description 提供验证码和登录日志的数据访问方法
 */
export class AuthRepository extends BaseRepository {
    /** 验证码表名 */
    private readonly verificationTable = 'email_verification_codes';
    /** 登录日志表名 */
    private readonly loginLogTable = 'login_logs';

    // ==================== 验证码相关 ====================

    /**
     * 创建验证码
     * 
     * @param {VerificationCodeInsert} data - 验证码数据
     * @returns {Promise<VerificationCode>} 创建的验证码记录
     */
    createVerificationCode(
        data: VerificationCodeInsert
    ): Promise<VerificationCode> {
        logger.info('Creating verification code', {
            email: data.email,
            purpose: data.purpose,
        });
        return this.insert<VerificationCode>(this.verificationTable, data);
    }

    /**
     * 查找有效的验证码
     * 
     * @param {string} email - 邮箱
     * @param {string} code - 验证码
     * @param {string} purpose - 用途
     * @returns {Promise<VerificationCode | null>} 验证码记录或 null
     * 
     * @description 查询未使用且未过期的验证码，按创建时间倒序返回第一条
     */
    async findValidVerificationCode(
        email: string,
        code: string,
        purpose: string
    ): Promise<VerificationCode | null> {
        logger.debug('Finding valid verification code', { email, purpose });

        // 查询未使用且未过期的验证码
        const result = await this.query<VerificationCode>(this.verificationTable, {
            where: {
                email,
                code,
                purpose,
                is_used: false,
                expires_at: { op: 'gt', value: new Date().toISOString() },
            },
            orderBy: { column: 'created_at', ascending: false },
            limit: 1,
        });

        return result.data[0] || null;
    }

    /**
     * 标记验证码为已使用
     * 
     * @param {string} id - 验证码 ID
     * @returns {Promise<void>}
     */
    async markVerificationCodeAsUsed(id: string): Promise<void> {
        logger.debug('Marking verification code as used', { id });
        await this.update<VerificationCode>(
            this.verificationTable,
            { id },
            {
                is_used: true,
                used_at: new Date().toISOString(),
            }
        );
    }

    /**
     * 增加验证码尝试次数
     * 
     * @param {string} id - 验证码 ID
     * @returns {Promise<void>}
     * 
     * @description 先查询验证码记录，然后将其尝试次数加 1
     */
    async incrementVerificationAttempts(id: string): Promise<void> {
        logger.debug('Incrementing verification attempts', { id });
        // 注意：这里需要使用原生 SQL 来实现 attempts + 1
        // 或者先查询再更新
        const code = await this.findOne<VerificationCode>(
            this.verificationTable,
            { id }
        );
        if (code) {
            await this.update<VerificationCode>(
                this.verificationTable,
                { id },
                { attempts: (code.attempts || 0) + 1 }
            );
        }
    }

    /**
     * 获取最近发送的验证码
     * 
     * @param {string} email - 邮箱
     * @param {string} purpose - 用途
     * @returns {Promise<VerificationCode | null>} 最近发送的验证码记录或 null
     */
    async getLastVerification(
        email: string,
        purpose: string
    ): Promise<VerificationCode | null> {
        logger.debug('Getting last verification code time', { email, purpose });

        const result = await this.query<VerificationCode>(this.verificationTable, {
            where: { 
                email, 
                purpose,
                // is_used: false,
                // expires_at: new Date().toISOString(),
            },
            orderBy: { column: 'created_at', ascending: false },
            limit: 1,
        });

        return result.data.length ? result.data[0] : null;
    }

    // ==================== 登录日志相关 ====================

    /**
     * 创建登录日志
     * 
     * @param {LoginLogInsert} data - 登录日志数据
     * @returns {Promise<LoginLog>} 创建的登录日志记录
     */
    createLoginLog(data: LoginLogInsert): Promise<LoginLog> {
        logger.info('Creating login log', {
            email: data.email,
            status: data.status,
            ip: data.ip_address,
        });
        return this.insert<LoginLog>(this.loginLogTable, data);
    }

    /**
     * 获取用户登录历史
     * 
     * @param {string} userId - 用户 ID
     * @param {number} [limit=10] - 返回数量，默认 10 条
     * @returns {Promise<LoginLog[]>} 登录日志列表，按创建时间倒序
     */
    async getUserLoginHistory(
        userId: string,
        limit = 10
    ): Promise<LoginLog[]> {
        logger.debug('Getting user login history', { userId, limit });

        const result = await this.query<LoginLog>(this.loginLogTable, {
            where: { user_id: userId },
            orderBy: { column: 'created_at', ascending: false },
            limit,
        });

        return result.data;
    }

    /**
     * 获取最近的失败登录次数
     * 
     * @param {string} email - 邮箱
     * @param {number} [minutes=60] - 时间范围（分钟），默认 60 分钟
     * @returns {Promise<number>} 失败登录次数
     */
    getRecentFailedLoginCount(
        email: string,
        minutes = 60
    ): Promise<number> {
        logger.debug('Getting recent failed login count', { email, minutes });

        const sinceTime = new Date(Date.now() - minutes * 60 * 1000).toISOString();

        return this.count(this.loginLogTable, {
            email,
            status: 'failed',
            created_at: { op: 'gte', value: sinceTime },
        });
    }
}

/**
 * 认证仓储单例
 * 
 * @constant
 * @description 全局可用的认证仓储实例
 */
export const authRepository = new AuthRepository();
// src/repositories/auth.repository.ts
/**
 * 认证数据访问层
 * 负责验证码和登录日志的操作
 */

import { BaseRepository } from './base.repository.ts';
import { logger } from '@/lib/logger.ts';
import type {
    VerificationCode,
    VerificationCodeInsert,
    LoginLog,
    LoginLogInsert,
} from '@/types/auth.types.ts';

export class AuthRepository extends BaseRepository {
    private readonly verificationTable = 'email_verification_codes';
    private readonly loginLogTable = 'login_logs';

    // ==================== 验证码相关 ====================

    /**
     * 创建验证码
     * @param data - 验证码数据
     * @returns Promise<VerificationCode> - 创建的验证码记录
     */
    async createVerificationCode(
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
     * @param email - 邮箱
     * @param code - 验证码
     * @param purpose - 用途
     * @returns Promise<VerificationCode | null> - 验证码记录或 null
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
     * @param id - 验证码 ID
     * @returns Promise<void>
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
     * @param id - 验证码 ID
     * @returns Promise<void>
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
     * 获取最近发送的验证码时间
     * @param email - 邮箱
     * @param purpose - 用途
     * @returns Promise<Date | null> - 最近发送时间或 null
     */
    async getLastVerificationCodeTime(
        email: string,
        purpose: string
    ): Promise<Date | null> {
        logger.debug('Getting last verification code time', { email, purpose });

        const result = await this.query<VerificationCode>(this.verificationTable, {
            where: { email, purpose },
            orderBy: { column: 'created_at', ascending: false },
            limit: 1,
        });

        const lastCode = result.data[0];
        return lastCode ? new Date(lastCode.created_at || '') : null;
    }

    // ==================== 登录日志相关 ====================

    /**
     * 创建登录日志
     * @param data - 登录日志数据
     * @returns Promise<LoginLog> - 创建的登录日志记录
     */
    async createLoginLog(data: LoginLogInsert): Promise<LoginLog> {
        logger.info('Creating login log', {
            email: data.email,
            status: data.status,
            ip: data.ip_address,
        });
        return this.insert<LoginLog>(this.loginLogTable, data);
    }

    /**
     * 获取用户登录历史
     * @param userId - 用户 ID
     * @param limit - 返回数量
     * @returns Promise<LoginLog[]> - 登录日志列表
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
     * @param email - 邮箱
     * @param minutes - 时间范围（分钟）
     * @returns Promise<number> - 失败次数
     */
    async getRecentFailedLoginCount(
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
 * 导出单例
 */
export const authRepository = new AuthRepository();
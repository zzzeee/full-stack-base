// src/services/auth.service.ts
/**
 * 认证业务逻辑层
 * 处理登录、注册、验证码等核心业务逻辑
 */

import { userRepository } from '@/repositories/user.repository.ts';
import { authRepository } from '@/repositories/auth.repository.ts';
import { hashPassword, verifyPassword } from '@/lib/password.ts';
import { generateToken } from '@/lib/jwt.ts';
import { sendVerificationCodeEmail } from '@/lib/email.ts';
import { logger } from '@/lib/logger.ts';
import {
    AppError,
    createAuthError,
} from '@/lib/errors/app-error.ts';
import { ErrorCodes } from '@/lib/errors/error-codes.ts';
import type {
    LoginResponse,
    LoginMethod,
    VerificationPurpose,
} from '@/types/auth.types.ts';

/**
 * 认证服务类
 */
export class AuthService {
    /**
     * 生成 6 位随机验证码
     * @returns string - 6位数字验证码
     */
    private generateVerificationCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * 检查发送频率限制
     * @param email - 邮箱
     * @param purpose - 用途
     * @throws AppError - 如果发送过于频繁
     */
    private async checkSendRateLimit(
        email: string,
        purpose: string
    ): Promise<void> {
        const lastSendTime = await authRepository.getLastVerificationCodeTime(
            email,
            purpose
        );

        if (lastSendTime) {
            const secondsSinceLastSend = Math.floor(
                (Date.now() - lastSendTime.getTime()) / 1000
            );

            // 60 秒内不能重复发送
            if (secondsSinceLastSend < 60) {
                throw new AppError(
                    ErrorCodes.VERIFICATION_CODE_TOO_FREQUENT,
                    `请在 ${60 - secondsSinceLastSend} 秒后重试`
                );
            }
        }
    }

    /**
     * 检查登录失败次数限制
     * @param email - 邮箱
     * @throws AppError - 如果失败次数过多
     */
    private async checkLoginRateLimit(email: string): Promise<void> {
        const failedCount = await authRepository.getRecentFailedLoginCount(
            email,
            60
        );

        // 1小时内失败5次则锁定
        if (failedCount >= 5) {
            throw new AppError(
                ErrorCodes.AUTH_ACCOUNT_LOCKED,
                '登录失败次数过多，账号已被临时锁定，请1小时后重试'
            );
        }
    }

    /**
     * 记录登录日志
     * @param data - 登录日志数据
     */
    private async recordLoginLog(data: {
        userId?: string;
        email: string;
        loginMethod: LoginMethod;
        status: 'success' | 'failed' | 'blocked';
        failureReason?: string;
        ipAddress: string;
        userAgent?: string;
    }): Promise<void> {
        try {
            await authRepository.createLoginLog({
                user_id: data.userId,
                email: data.email,
                login_method: data.loginMethod,
                status: data.status,
                failure_reason: data.failureReason,
                ip_address: data.ipAddress,
                user_agent: data.userAgent,
            });
        } catch (error) {
            // 记录日志失败不应该影响主流程
            logger.error('Failed to record login log', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * 构建登录响应
     * @param user - 用户信息
     * @returns Promise<LoginResponse> - 登录响应
     */
    private async buildLoginResponse(
        user: { id: string; email: string; name: string; avatar_url: string | null; status: string; email_verified: boolean }
    ): Promise<LoginResponse> {
        // 生成 JWT Token
        const token = await generateToken({
            sub: user.id,
            email: user.email,
            role: 'user', // 可以从 user.metadata 中读取
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar_url: user.avatar_url,
                status: user.status,
                email_verified: user.email_verified,
            },
            token,
        };
    }

    // ==================== 公开方法 ====================

    /**
     * 发送邮箱验证码
     * @param email - 邮箱
     * @param purpose - 验证码用途
     * @returns Promise<void>
     */
    async sendVerificationCode(
        email: string,
        purpose: VerificationPurpose
    ): Promise<void> {
        logger.info('Sending verification code', { email, purpose });

        // 1. 检查发送频率
        await this.checkSendRateLimit(email, purpose);

        // 2. 如果是注册，检查邮箱是否已存在
        if (purpose === 'register') {
            const exists = await userRepository.emailExists(email);
            if (exists) {
                throw new AppError(
                    ErrorCodes.USER_EMAIL_ALREADY_EXISTS,
                    '该邮箱已被注册'
                );
            }
        }

        // 3. 如果是登录/重置密码，检查用户是否存在
        if (purpose === 'login' || purpose === 'reset_password') {
            const user = await userRepository.findByEmail(email);
            if (!user) {
                throw new AppError(
                    ErrorCodes.USER_NOT_FOUND,
                    '该邮箱未注册'
                );
            }

            // 检查账号状态
            if (user.status !== 'active') {
                throw new AppError(
                    ErrorCodes.AUTH_ACCOUNT_DISABLED,
                    '账号已被禁用'
                );
            }
        }

        // 4. 生成验证码
        const code = this.generateVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 分钟后过期

        // 5. 保存验证码
        await authRepository.createVerificationCode({
            email,
            code,
            purpose,
            expires_at: expiresAt.toISOString(),
        });

        // 6. 发送邮件
        const sent = await sendVerificationCodeEmail(email, code, purpose);

        if (!sent) {
            throw new AppError(
                ErrorCodes.EMAIL_SEND_FAILED,
                '验证码发送失败，请稍后重试'
            );
        }

        logger.info('Verification code sent successfully', { email, purpose });
    }

    /**
     * 验证码登录
     * @param email - 邮箱
     * @param code - 验证码
     * @param ipAddress - IP 地址
     * @param userAgent - User Agent
     * @returns Promise<LoginResponse> - 登录响应
     */
    async loginWithVerificationCode(
        email: string,
        code: string,
        ipAddress: string,
        userAgent?: string
    ): Promise<LoginResponse> {
        logger.info('Login with verification code', { email });

        try {
            // 1. 检查登录频率限制
            await this.checkLoginRateLimit(email);

            // 2. 查找用户
            const user = await userRepository.findByEmail(email);
            if (!user) {
                await this.recordLoginLog({
                    email,
                    loginMethod: 'verification_code',
                    status: 'failed',
                    failureReason: '用户不存在',
                    ipAddress,
                    userAgent,
                });
                throw new AppError(ErrorCodes.USER_NOT_FOUND, '该邮箱未注册');
            }

            // 3. 检查账号状态
            if (user.status !== 'active') {
                await this.recordLoginLog({
                    userId: user.id,
                    email,
                    loginMethod: 'verification_code',
                    status: 'blocked',
                    failureReason: '账号已被禁用',
                    ipAddress,
                    userAgent,
                });
                throw new AppError(ErrorCodes.AUTH_ACCOUNT_DISABLED, '账号已被禁用');
            }

            // 4. 验证验证码
            const verificationCode = await authRepository.findValidVerificationCode(
                email,
                code,
                'login'
            );

            if (!verificationCode) {
                await this.recordLoginLog({
                    userId: user.id,
                    email,
                    loginMethod: 'verification_code',
                    status: 'failed',
                    failureReason: '验证码错误或已过期',
                    ipAddress,
                    userAgent,
                });
                throw new AppError(
                    ErrorCodes.VERIFICATION_CODE_INVALID,
                    '验证码错误或已过期'
                );
            }

            // 5. 检查验证码尝试次数
            if ((verificationCode.attempts || 0) >= 5) {
                throw new AppError(
                    ErrorCodes.VERIFICATION_CODE_MAX_ATTEMPTS,
                    '验证码尝试次数过多，请重新获取'
                );
            }

            // 6. 标记验证码为已使用
            await authRepository.markVerificationCodeAsUsed(verificationCode.id);

            // 7. 更新最后登录时间
            await userRepository.updateLastLogin(user.id);

            // 8. 记录成功日志
            await this.recordLoginLog({
                userId: user.id,
                email,
                loginMethod: 'verification_code',
                status: 'success',
                ipAddress,
                userAgent,
            });

            // 9. 返回登录响应
            logger.info('Login successful', { userId: user.id, email });
            return this.buildLoginResponse(user);
        } catch (error) {
            // 如果是验证码错误，增加尝试次数
            if (error instanceof AppError && error.code === ErrorCodes.VERIFICATION_CODE_INVALID) {
                const verificationCode = await authRepository.findValidVerificationCode(
                    email,
                    code,
                    'login'
                );
                if (verificationCode) {
                    await authRepository.incrementVerificationAttempts(verificationCode.id);
                }
            }

            throw error;
        }
    }

    /**
     * 密码登录
     * @param email - 邮箱
     * @param password - 密码
     * @param ipAddress - IP 地址
     * @param userAgent - User Agent
     * @returns Promise<LoginResponse> - 登录响应
     */
    async loginWithPassword(
        email: string,
        password: string,
        ipAddress: string,
        userAgent?: string
    ): Promise<LoginResponse> {
        logger.info('Login with password', { email });

        // 1. 检查登录频率限制
        await this.checkLoginRateLimit(email);

        // 2. 查找用户
        const user = await userRepository.findByEmail(email);
        if (!user) {
            await this.recordLoginLog({
                email,
                loginMethod: 'password',
                status: 'failed',
                failureReason: '用户不存在',
                ipAddress,
                userAgent,
            });
            throw createAuthError.invalidCredentials();
        }

        // 3. 检查账号状态
        if (user.status !== 'active') {
            await this.recordLoginLog({
                userId: user.id,
                email,
                loginMethod: 'password',
                status: 'blocked',
                failureReason: '账号已被禁用',
                ipAddress,
                userAgent,
            });
            throw new AppError(ErrorCodes.AUTH_ACCOUNT_DISABLED, '账号已被禁用');
        }

        // 4. 检查是否设置了密码
        if (!user.password_hash) {
            await this.recordLoginLog({
                userId: user.id,
                email,
                loginMethod: 'password',
                status: 'failed',
                failureReason: '未设置密码',
                ipAddress,
                userAgent,
            });
            throw new AppError(
                ErrorCodes.AUTH_PASSWORD_NOT_SET,
                '该账号未设置密码，请使用验证码登录'
            );
        }

        // 5. 验证密码
        const isValidPassword = await verifyPassword(password, user.password_hash);
        if (!isValidPassword) {
            await this.recordLoginLog({
                userId: user.id,
                email,
                loginMethod: 'password',
                status: 'failed',
                failureReason: '密码错误',
                ipAddress,
                userAgent,
            });
            throw createAuthError.invalidCredentials();
        }

        // 6. 更新最后登录时间
        await userRepository.updateLastLogin(user.id);

        // 7. 记录成功日志
        await this.recordLoginLog({
            userId: user.id,
            email,
            loginMethod: 'password',
            status: 'success',
            ipAddress,
            userAgent,
        });

        // 8. 返回登录响应
        logger.info('Login successful', { userId: user.id, email });
        return this.buildLoginResponse(user);
    }

    /**
     * 注册用户
     * @param email - 邮箱
     * @param password - 密码
     * @param name - 姓名
     * @param code - 验证码
     * @param ipAddress - IP 地址
     * @param userAgent - User Agent
     * @returns Promise<LoginResponse> - 登录响应
     */
    async register(
        email: string,
        password: string,
        name: string,
        code: string,
        ipAddress: string,
        userAgent?: string
    ): Promise<LoginResponse> {
        logger.info('User registration', { email, name });

        // 1. 检查邮箱是否已存在
        const exists = await userRepository.emailExists(email);
        if (exists) {
            throw new AppError(
                ErrorCodes.USER_EMAIL_ALREADY_EXISTS,
                '该邮箱已被注册'
            );
        }

        // 2. 验证验证码
        const verificationCode = await authRepository.findValidVerificationCode(
            email,
            code,
            'register'
        );

        if (!verificationCode) {
            throw new AppError(
                ErrorCodes.VERIFICATION_CODE_INVALID,
                '验证码错误或已过期'
            );
        }

        // 3. 加密密码
        const passwordHash = await hashPassword(password);

        // 4. 创建用户
        const user = await userRepository.create({
            email,
            password_hash: passwordHash,
            name,
            status: 'active',
            email_verified: true, // 通过验证码注册的用户自动验证邮箱
        });

        // 5. 标记验证码为已使用
        await authRepository.markVerificationCodeAsUsed(verificationCode.id);

        // 6. 记录登录日志
        await this.recordLoginLog({
            userId: user.id,
            email,
            loginMethod: 'password',
            status: 'success',
            ipAddress,
            userAgent,
        });

        // 7. 返回登录响应
        logger.info('Registration successful', { userId: user.id, email });
        return this.buildLoginResponse(user);
    }
}

/**
 * 导出单例
 */
export const authService = new AuthService();
/**
 * @file auth.service.ts
 * @description 认证业务逻辑层：用户同步、登录响应组装等
 * @author System
 * @createDate 2026-01-26
 */

import { logger } from '@/lib/logger.ts';
import { generateToken } from '@/lib/jwt.ts';
import { UserRepository } from '@/repositories/user.repository.ts';
import type { LoginResponse } from '@/types/auth.types.ts';
import type { User } from '@/types/user.types.ts';

/**
 * 确保 public.users 中存在对应用户（不存在则自动创建）
 */
export interface EnsureUserParams {
    /** Supabase Auth 的用户 ID（auth.users.id） */
    id: string;
    /** 邮箱（经过请求校验后的邮箱） */
    email: string;
    /** 是否已验证邮箱（验证码登录通常视为已验证） */
    emailVerified: boolean;
}

export class AuthService {
    private readonly adminUserRepository = new UserRepository(true);

    /**
     * 确保 public.users 里存在用户，不存在则创建（使用管理员客户端绕过 RLS）
     */
    async ensurePublicUserExists(params: EnsureUserParams): Promise<User> {
        const { id, email, emailVerified } = params;

        // 登录阶段建议统一使用 admin 客户端，避免未来 RLS/策略变更导致匿名查询失败
        let user = await this.adminUserRepository.findById(id);
        if (user) return user;

        const emailName = email.split('@')[0] || '用户';

        logger.info('Auto-registering new user to public.users', {
            supabaseUserId: id,
            email,
            name: emailName,
        });

        try {
            user = await this.adminUserRepository.create({
                id,
                email,
                name: emailName,
                email_verified: emailVerified,
                status: 'active',
            });

            logger.info('New user auto-registered successfully', {
                userId: user.id,
                email: user.email,
                name: user.name,
            });

            return user;
        } catch (createErr: unknown) {
            // 可能是并发创建（或唯一约束）导致；尝试回读
            const message =
                createErr instanceof Error
                    ? createErr.message
                    : (createErr && typeof createErr === 'object' && 'message' in createErr)
                        ? String((createErr as { message?: unknown }).message)
                        : String(createErr);

            logger.error('Failed to auto-register user (will retry read)', {
                supabaseUserId: id,
                email,
                error: message,
            });

            user = await this.adminUserRepository.findById(id);
            if (user) return user;

            user = await this.adminUserRepository.findByEmail(email);
            if (user && user.id !== id) {
                throw new Error('用户数据不一致（Supabase Auth 与 public.users ID 不匹配）');
            }
            if (!user) {
                throw new Error('用户注册失败，请稍后重试');
            }
            return user;
        }
    }

    /**
     * 组装登录响应（生成业务 JWT）
     */
    async buildLoginResponse(user: User): Promise<LoginResponse> {
        const jwtToken = await generateToken({
            sub: user.id,
            email: user.email,
            role: undefined,
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
            token: jwtToken,
        };
    }
}

export const authService = new AuthService();


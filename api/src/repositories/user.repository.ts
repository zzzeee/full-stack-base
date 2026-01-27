/**
 * @file user.repository.ts
 * @description 用户数据访问层，负责用户表的 CRUD 操作
 * @author System
 * @createDate 2026-01-25
 */

import { BaseRepository } from '@/repositories/base.repository.ts';
import { logger } from '@/lib/logger.ts';
import type { User, UserInsert, UserUpdate } from '@/types/user.types.ts';

/**
 * 用户仓储类
 * 
 * @class
 * @extends {BaseRepository}
 * @description 提供用户表的数据访问方法
 */
export class UserRepository extends BaseRepository {
    /** 用户表名 */
    private readonly table = 'users';

    /**
     * 通过邮箱查找用户
     * 
     * @param {string} email - 用户邮箱
     * @returns {Promise<User | null>} 用户信息或 null
     */
    findByEmail(email: string): Promise<User | null> {
        logger.debug('Finding user by email', { email });
        return this.findOne<User>(this.table, { email });
    }

    /**
     * 通过 ID 查找用户
     * 
     * @param {string} id - 用户 ID
     * @returns {Promise<User | null>} 用户信息或 null
     */
    findById(id: string): Promise<User | null> {
        logger.debug('Finding user by id', { id });
        return this.findOne<User>(this.table, { id });
    }

    /**
     * 创建用户
     * 
     * @param {UserInsert} data - 用户数据
     * @returns {Promise<User>} 创建的用户信息
     */
    create(data: UserInsert): Promise<User> {
        logger.info('Creating user', { email: data.email });
        return this.insert<User>(this.table, data);
    }

    /**
     * 更新用户信息
     * 
     * @param {string} id - 用户 ID
     * @param {UserUpdate} data - 更新数据
     * @returns {Promise<User>} 更新后的用户信息
     */
    updateById(id: string, data: UserUpdate): Promise<User> {
        logger.info('Updating user', { id, fields: Object.keys(data) });
        return this.update<User>(this.table, { id }, data);
    }

    /**
     * 删除用户（软删除：标记为 deleted）
     * 
     * @param {string} id - 用户 ID
     * @returns {Promise<boolean>} 是否删除成功
     */
    async softDelete(id: string): Promise<boolean> {
        logger.info('Soft deleting user', { id });
        await this.update<User>(this.table, { id }, { status: 'deleted' });
        return true;
    }

    /**
     * 检查邮箱是否已存在
     * 
     * @param {string} email - 邮箱
     * @returns {Promise<boolean>} 是否存在
     */
    emailExists(email: string): Promise<boolean> {
        logger.debug('Checking if email exists', { email });
        return this.exists(this.table, { email });
    }

    /**
     * 更新最后登录时间
     * 
     * @param {string} id - 用户 ID
     * @returns {Promise<void>}
     */
    async updateLastLogin(id: string): Promise<void> {
        logger.debug('Updating last login time', { id });
        await this.update<User>(this.table, { id }, {
            last_login_at: new Date().toISOString(),
        });
    }
}

/**
 * 用户仓储单例
 * 
 * @constant
 * @description 全局可用的用户仓储实例
 */
export const userRepository = new UserRepository();
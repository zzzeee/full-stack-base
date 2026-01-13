// src/repositories/base.repository.ts
/**
 * 通用数据访问层基类
 * 提供 CRUD 操作的通用实现
 */

import { supabase, supabaseAdmin } from '@/lib/supabase.client.ts';
import { logger } from '@/lib/logger.ts';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types.ts';

// ==================== 类型定义 ====================

/**
 * 查询操作符
 */
type WhereOperator =
    | 'eq'      // 等于 =
    | 'neq'     // 不等于 !=
    | 'gt'      // 大于 >
    | 'gte'     // 大于等于 >=
    | 'lt'      // 小于 
    | 'lte'     // 小于等于 <=
    | 'like'    // 模糊匹配 LIKE
    | 'ilike'   // 不区分大小写的模糊匹配 ILIKE
    | 'in'      // IN (array)
    | 'is'      // IS NULL
    | 'not';    // IS NOT NULL

/**
 * Where 条件定义
 */
type WhereCondition =
    | { op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'; value: unknown }
    | { op: 'like' | 'ilike'; value: string }
    | { op: 'in'; value: unknown[] }
    | { op: 'is'; value: null }
    | { op: 'not'; value: null };

/**
 * Where 选项（支持简写）
 */
type WhereOptions = Record<string, WhereCondition | string | number | boolean | null>;

/**
 * 排序选项
 */
interface OrderByOption {
    column: string;
    ascending?: boolean;
    nullsFirst?: boolean;
}

/**
 * 分页选项
 */
interface PaginationOptions {
    page?: number;      // 页码（从 1 开始）
    pageSize?: number;  // 每页数量
    limit?: number;     // 或直接指定 limit
    offset?: number;    // 或直接指定 offset
}

/**
 * 查询选项
 */
interface QueryOptions extends PaginationOptions {
    select?: string;
    where?: WhereOptions;
    orderBy?: OrderByOption | OrderByOption[];
    count?: boolean; // 是否返回总数
}

/**
 * 查询结果（带分页信息）
 */
interface QueryResult<T> {
    data: T[];
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
}

// ==================== 基础仓储类 ====================

export class BaseRepository {
    protected client: SupabaseClient<Database>;
    protected useAdmin: boolean;

    constructor(useAdmin = false) {
        this.client = useAdmin ? supabaseAdmin : supabase;
        this.useAdmin = useAdmin;
    }

    // ==================== 私有方法 ====================

    /**
     * 应用 where 条件
     */
    private applyWhere(
        // deno-lint-ignore no-explicit-any
        query: any,
        where?: WhereOptions
        // deno-lint-ignore no-explicit-any
    ): any {
        if (!where) return query;

        for (const [column, condition] of Object.entries(where)) {
            if (condition === undefined) continue;

            // 简写形式：直接值 -> eq 操作
            if (typeof condition !== 'object' || condition === null || !('op' in condition)) {
                query = query.eq(column, condition);
                continue;
            }

            const { op, value } = condition;

            switch (op) {
                case 'eq':
                    query = query.eq(column, value);
                    break;
                case 'neq':
                    query = query.neq(column, value);
                    break;
                case 'gt':
                    query = query.gt(column, value);
                    break;
                case 'gte':
                    query = query.gte(column, value);
                    break;
                case 'lt':
                    query = query.lt(column, value);
                    break;
                case 'lte':
                    query = query.lte(column, value);
                    break;
                case 'like':
                    query = query.like(column, String(value));
                    break;
                case 'ilike':
                    query = query.ilike(column, String(value));
                    break;
                case 'in':
                    if (Array.isArray(value)) {
                        query = query.in(column, value);
                    }
                    break;
                case 'is':
                    query = query.is(column, null);
                    break;
                case 'not':
                    query = query.not(column, 'is', null);
                    break;
                default:
                    logger.warn(`Unknown operator: ${op}`, { column, value });
            }
        }

        return query;
    }

    /**
     * 应用排序
     */
    private applyOrderBy(
        // deno-lint-ignore no-explicit-any
        query: any,
        orderBy?: OrderByOption | OrderByOption[]
        // deno-lint-ignore no-explicit-any
    ): any {
        if (!orderBy) return query;

        const orders = Array.isArray(orderBy) ? orderBy : [orderBy];

        for (const { column, ascending = true, nullsFirst } of orders) {
            query = query.order(column, {
                ascending,
                nullsFirst,
            });
        }

        return query;
    }

    /**
     * 应用分页
     */
    private applyPagination(
        // deno-lint-ignore no-explicit-any
        query: any,
        options: PaginationOptions
        // deno-lint-ignore no-explicit-any
    ): any {
        // 优先使用 page + pageSize
        if (options.page !== undefined && options.pageSize !== undefined) {
            const from = (options.page - 1) * options.pageSize;
            const to = from + options.pageSize - 1;
            return query.range(from, to);
        }

        // 其次使用 limit + offset
        if (options.limit !== undefined) {
            const from = options.offset ?? 0;
            const to = from + options.limit - 1;
            return query.range(from, to);
        }

        return query;
    }

    // ==================== 公开方法 ====================

    /**
     * 查询单条记录
     * @example
     * const user = await repo.findOne('users', { email: 'test@example.com' });
     */
    async findOne<T>(
        table: keyof Database['public']['Tables'],
        where: WhereOptions,
        select = '*'
    ): Promise<T | null> {
        try {
            let query = this.client.from(table).select(select);
            query = this.applyWhere(query, where);

            const { data, error } = await query.maybeSingle();

            if (error) {
                logger.error('Database findOne error', {
                    table,
                    where,
                    message: error.message,
                    code: error.code,
                });
                throw error;
            }

            return data as T | null;
        } catch (error) {
            logger.error('Unexpected error in findOne', {
                table,
                where,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }

    /**
     * 通过 ID 查询
     * @example
     * const user = await repo.findById('users', '123');
     */
    findById<T>(
        table: keyof Database['public']['Tables'],
        id: string | number,
        options?: { idField?: string; select?: string }
    ): Promise<T | null> {
        const { idField = 'id', select = '*' } = options ?? {};
        return this.findOne<T>(table, { [idField]: id }, select);
    }

    /**
     * 查询多条记录
     * @example
     * const users = await repo.query('users', {
     *   where: { status: 'active' },
     *   orderBy: { column: 'created_at', ascending: false },
     *   page: 1,
     *   pageSize: 10,
     *   count: true,
     * });
     */
    async query<T>(
        table: keyof Database['public']['Tables'],
        options: QueryOptions = {}
    ): Promise<QueryResult<T>> {
        try {
            const { select = '*', count = false } = options;

            // 构建查询
            let query = this.client
                .from(table)
                .select(select, { count: count ? 'exact' : undefined });

            query = this.applyWhere(query, options.where);
            query = this.applyOrderBy(query, options.orderBy);
            query = this.applyPagination(query, options);

            const { data, error, count: total } = await query;

            if (error) {
                logger.error('Database query error', {
                    table,
                    options,
                    message: error.message,
                    code: error.code,
                });
                throw error;
            }

            // 构建返回结果
            const result: QueryResult<T> = {
                data: (data ?? []) as T[],
            };

            // 添加分页信息
            if (count && total !== null) {
                result.total = total;

                if (options.page && options.pageSize) {
                    result.page = options.page;
                    result.pageSize = options.pageSize;
                    result.totalPages = Math.ceil(total / options.pageSize);
                }
            }

            return result;
        } catch (error) {
            logger.error('Unexpected error in query', {
                table,
                options,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }

    /**
     * 插入单条记录
     * @example
     * const user = await repo.insert('users', { email: 'test@example.com', name: 'Test' });
     */
    async insert<T>(
        table: keyof Database['public']['Tables'],
        // deno-lint-ignore no-explicit-any
        data: any
    ): Promise<T> {
        try {
            // 使用类型断言绕过 Supabase 的严格类型检查
            const { data: result, error } = await (this.client
                .from(table)
                // deno-lint-ignore no-explicit-any
                .insert(data as any)
                .select()
                .single());

            if (error) {
                logger.error('Database insert error', {
                    table,
                    data,
                    message: error.message,
                    code: error.code,
                });
                throw error;
            }

            return result as T;
        } catch (error) {
            logger.error('Unexpected error in insert', {
                table,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }

    /**
     * 批量插入
     * @example
     * const users = await repo.insertMany('users', [
     *   { email: 'user1@example.com', name: 'User 1' },
     *   { email: 'user2@example.com', name: 'User 2' },
     * ]);
     */
    async insertMany<T>(
        table: keyof Database['public']['Tables'],
        // deno-lint-ignore no-explicit-any
        rows: any[]
    ): Promise<T[]> {
        if (!rows.length) return [];

        try {
            // 使用类型断言绕过 Supabase 的严格类型检查
            const { data, error } = await (this.client
                .from(table)
                // deno-lint-ignore no-explicit-any
                .insert(rows as any)
                .select());

            if (error) {
                logger.error('Database insertMany error', {
                    table,
                    count: rows.length,
                    message: error.message,
                    code: error.code,
                });
                throw error;
            }

            return (data ?? []) as T[];
        } catch (error) {
            logger.error('Unexpected error in insertMany', {
                table,
                count: rows.length,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }

    /**
     * 更新记录
     * @example
     * const user = await repo.update('users', { id: '123' }, { name: 'New Name' });
     */
    async update<T>(
        table: keyof Database['public']['Tables'],
        where: WhereOptions,
        // deno-lint-ignore no-explicit-any
        updates: any
    ): Promise<T> {
        try {
            // 使用类型断言绕过 Supabase 的严格类型检查
            let query = this.client.from(table).update(updates);
            query = this.applyWhere(query, where);

            const { data, error } = await query.select().single();

            if (error) {
                logger.error('Database update error', {
                    table,
                    where,
                    updates,
                    message: error.message,
                    code: error.code,
                });
                throw error;
            }

            return data as T;
        } catch (error) {
            logger.error('Unexpected error in update', {
                table,
                where,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }

    /**
     * 批量更新（返回更新的记录）
     */
    async updateMany<T>(
        table: keyof Database['public']['Tables'],
        where: WhereOptions,
        // deno-lint-ignore no-explicit-any
        updates: any
    ): Promise<T[]> {
        try {
            // 使用类型断言绕过 Supabase 的严格类型检查
            let query = this.client.from(table).update(updates);
            query = this.applyWhere(query, where);

            const { data, error } = await query.select();

            if (error) {
                logger.error('Database updateMany error', {
                    table,
                    where,
                    updates,
                    message: error.message,
                    code: error.code,
                });
                throw error;
            }

            return (data ?? []) as T[];
        } catch (error) {
            logger.error('Unexpected error in updateMany', {
                table,
                where,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }

    /**
     * 删除记录
     * @example
     * await repo.delete('users', { id: '123' });
     */
    async delete(table: keyof Database['public']['Tables'], where: WhereOptions): Promise<boolean> {
        try {
            let query = this.client.from(table).delete();
            query = this.applyWhere(query, where);

            const { error } = await query;

            if (error) {
                logger.error('Database delete error', {
                    table,
                    where,
                    message: error.message,
                    code: error.code,
                });
                throw error;
            }

            return true;
        } catch (error) {
            logger.error('Unexpected error in delete', {
                table,
                where,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }

    /**
     * 统计记录数
     * @example
     * const count = await repo.count('users', { status: 'active' });
     */
    async count(table: keyof Database['public']['Tables'], where?: WhereOptions): Promise<number> {
        try {
            let query = this.client
                .from(table)
                .select('*', { count: 'exact', head: true });

            query = this.applyWhere(query, where);

            const { count, error } = await query;

            if (error) {
                logger.error('Database count error', {
                    table,
                    where,
                    message: error.message,
                    code: error.code,
                });
                throw error;
            }

            return count ?? 0;
        } catch (error) {
            logger.error('Unexpected error in count', {
                table,
                where,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }

    /**
     * 检查记录是否存在
     * @example
     * const exists = await repo.exists('users', { email: 'test@example.com' });
     */
    async exists(table: keyof Database['public']['Tables'], where: WhereOptions): Promise<boolean> {
        const count = await this.count(table, where);
        return count > 0;
    }
}

// ==================== 导出便捷实例 ====================

/**
 * 默认仓储实例（使用 Anon Key）
 */
export const repository = new BaseRepository();

/**
 * 管理员仓储实例（使用 Service Role Key）
 */
export const adminRepository = new BaseRepository(true);

/**
 * 便捷方法导出
 */
export const db = {
    // 查询
    query: repository.query.bind(repository),
    findOne: repository.findOne.bind(repository),
    findById: repository.findById.bind(repository),
    count: repository.count.bind(repository),
    exists: repository.exists.bind(repository),

    // 插入
    insert: repository.insert.bind(repository),
    insertMany: repository.insertMany.bind(repository),

    // 更新
    update: repository.update.bind(repository),
    updateMany: repository.updateMany.bind(repository),

    // 删除
    delete: repository.delete.bind(repository),
};

/**
 * 管理员操作（绕过 RLS）
 */
export const adminDb = {
    query: adminRepository.query.bind(adminRepository),
    findOne: adminRepository.findOne.bind(adminRepository),
    findById: adminRepository.findById.bind(adminRepository),
    insert: adminRepository.insert.bind(adminRepository),
    update: adminRepository.update.bind(adminRepository),
    delete: adminRepository.delete.bind(adminRepository),
};

export default db;
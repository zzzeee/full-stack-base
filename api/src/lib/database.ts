import { supabaseClient, testSupabaseConnection } from './supabase.client.ts'
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js'

type opValue = 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'is' | 'not' | 'raw'

/** where 条件定义 */
// eq (equal): =
// gt (greater than): >
// gte	(greater than or equal): >=
// lt (less than): <
// lte	(less than or equal): <=
type WhereCondition =
    | { op: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like'; value: unknown }
    | { op: 'in'; value: unknown[] }
    | { op: 'is'; value: null }           // is null
    | { op: 'not'; value: null }          // is not null
    | { op: 'raw'; value: string }        // 原始 SQL（⚠️慎用）

type WhereOptions = Record<string, WhereCondition | string | number>

/** 排序定义 */
interface OrderByOption {
    column: string
    ascending?: boolean
}

/** 查询参数 */
interface QueryOptions {
    select?: string
    where?: WhereOptions
    orderBy?: OrderByOption | OrderByOption[]
    limit?: number
    offset?: number
}

export class DatabaseService {
    /** 内部：应用 where 条件 */
    private static applyWhere(
        query: PostgrestFilterBuilder<any, any, any, any, unknown, unknown, unknown>,
        // Generic type 'PostgrestFilterBuilder<ClientOptions, Schema, Row, Result$1, RelationName, Relationships, Method>' requires between 4 and 7 type arguments.deno-ts(2707)
        where?: WhereOptions
    ) {
        if (!where) return query
    
        for (const [column, condition] of Object.entries(where)) {
            if (condition === undefined) continue
    
            // 简写 eq
            if (typeof condition !== 'object' || !('op' in condition)) {
                query = query.eq(column, condition)
                continue
            }
    
            const { op, value } = condition
    
            switch (op) {
                case 'eq': query = query.eq(column, value); break
                case 'gt': query = query.gt(column, value); break
                case 'gte': query = query.gte(column, value); break
                case 'lt': query = query.lt(column, value); break
                case 'lte': query = query.lte(column, value); break
                case 'like': query = query.like(column, String(value)); break
                case 'in': query = query.in(column, value); break
                case 'is': query = query.is(column, null); break
                case 'not': query = query.not(column, 'is', null); break
    
                case 'raw':
                    // ⚠️ raw 是逃生舱，只建议复杂场景使用
                    // 仅 .or 支持自定义的sql语句
                    query = query.or(value)
                    break
            }
        }
    
        return query
    }    

    /** 
     * 查询单行（按任意字段） 
     * const user = await db.findOne<User>('users', {
     *    email: 'test@example.com',
     * })
     * */
    static async findOne<T = unknown>(
        table: string,
        where: WhereOptions,
        select: string = '*'
    ): Promise<T | null> {
        let query = supabaseClient.from(table).select(select)

        query = this.applyWhere(query, where)

        const { data, error } = await query.maybeSingle()

        if (error) {
            throw new Error(
                `[DB FIND ONE ERROR]
table=${table}
where=${JSON.stringify(where)}
message=${error.message}`
            )
        }

        return data as T | null
    }

    static findById<T = unknown>(
        table: string,
        id: string | number,
        idField: string = 'id',
        select: string = '*'
    ): Promise<T | null> {
        return this.findOne<T>(
            table,
            { [idField]: id },
            select
        )
    }    

    /** 查询多行 */
    static async query<T = unknown>(table: string, options: QueryOptions = {}) {
        let query = supabaseClient.from(table).select(options.select ?? '*')

        query = this.applyWhere(query, options.where)

        // 排序
        if (options.orderBy) {
            const orders = Array.isArray(options.orderBy)
                ? options.orderBy
                : [options.orderBy]

            for (const { column, ascending = true } of orders) {
                query = query.order(column, { ascending })
            }
        }

        // 分页
        if (options.limit !== undefined) {
            const from = options.offset ?? 0
            const to = from + options.limit - 1
            query = query.range(from, to)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(
                `[DB QUERY ERROR]
table=${table}
options=${JSON.stringify(options)}
message=${error.message}`
            )
        }

        return data as T[]
    }

    /** 插入 */
    static async insert<T = unknown>(table: string, data: Record<string, unknown>) {
        const { data: result, error } = await supabaseClient
            .from(table)
            .insert(data)
            .select()
            .single()

        if (error) {
            throw new Error(`[DB INSERT ERROR] table=${table} message=${error.message}`)
        }

        return result as T
    }

    /** 更新 */
    static async update<T = unknown>(
        table: string,
        where: WhereOptions,
        updates: Record<string, unknown>
    ) {
        let query = supabaseClient.from(table).update(updates)
        query = this.applyWhere(query, where)

        const { data, error } = await query.select().single()

        if (error) {
            throw new Error(`[DB UPDATE ERROR] table=${table} message=${error.message}`)
        }

        return data as T
    }

    /** 删除 */
    static async remove(table: string, where: WhereOptions) {
        let query = supabaseClient.from(table).delete()
        query = this.applyWhere(query, where)

        const { error } = await query

        if (error) {
            throw new Error(`[DB DELETE ERROR] table=${table} message=${error.message}`)
        }

        return true
    }

    /** 健康检查 */
    static async healthCheck() {
        const supabaseOk = await testSupabaseConnection()

        return {
            supabase: supabaseOk ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString(),
        }
    }

    // 批量插入
    static async insertMany<T = unknown>(
        table: string,
        rows: Record<string, unknown>[]
    ): Promise<T[]> {
        if (!rows.length) return []
    
        const { data, error } = await supabaseClient
            .from(table)
            .insert(rows)
            .select()
    
        if (error) {
            throw new Error(
                `[DB INSERT MANY ERROR]
    table=${table}
    message=${error.message}`
            )
        }
    
        return data as T[]
    }    
}

/** 门面导出 */
export const db = {
    query: DatabaseService.query,
    findOne: DatabaseService.findOne,
    findById: DatabaseService.findById,

    insert: DatabaseService.insert,
    insertMany: DatabaseService.insertMany,

    update: DatabaseService.update,
    delete: DatabaseService.remove,

    health: DatabaseService.healthCheck,
}

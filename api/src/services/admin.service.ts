/**
 * @file admin.service.ts
 * @description 管理员服务模块，提供需要管理员权限的操作
 * @author System
 * @createDate 2026-01-25
 */

import { supabaseAdmin } from '[@BASE]/lib/supabase.client.ts';

/**
 * 管理员服务类
 * 
 * @class
 * @description 提供需要管理员权限的业务逻辑方法，使用 Admin 客户端可以绕过 RLS
 */
export class AdminService {
    /**
     * 删除用户
     * 
     * @param {string} userId - 用户 ID
     * @returns {Promise<void>}
     * @throws {Error} 当删除操作失败时抛出错误
     * 
     * @description 使用 Admin 客户端可以删除任何用户（绕过 RLS）
     */
    async deleteUser(userId: string) {
        // 使用 Admin 客户端可以删除任何用户
        const { error } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', userId);

        if (error) throw error;
    }
}
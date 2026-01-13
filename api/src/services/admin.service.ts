// src/services/admin.service.ts
import { supabaseAdmin } from '@/lib/supabase.client.ts';

export class AdminService {
    async deleteUser(userId: string) {
        // 使用 Admin 客户端可以删除任何用户
        const { error } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', userId);

        if (error) throw error;
    }
}
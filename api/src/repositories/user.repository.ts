// src/repositories/user.repository.ts
import { supabase } from '@/lib/supabase.client.ts';

export class UserRepository {
    async findById(id: string) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }
}
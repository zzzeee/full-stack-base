/**
 * @file 20260125000003_create_rls_policies.sql
 * @description profiles 表 RLS（直连 Supabase 客户端时使用；API 服务端可用 service role 绕过）
 */

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 公开读取基础资料（与业务「公开用户页」一致时需再收紧为视图或字段级策略）
CREATE POLICY "Public can view profile basics"
    ON public.profiles
    FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (id = public.current_user_id())
    WITH CHECK (id = public.current_user_id());

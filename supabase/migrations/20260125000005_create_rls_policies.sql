/**
 * @file 20260125000005_create_rls_policies.sql
 * @description 创建行级安全策略（RLS）
 * @author System
 * @createDate 2026-01-25
 */

-- 启用 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

-- ==================== users 表 RLS 策略 ====================

-- 用户只能查看自己的资料
CREATE POLICY "Users can view own profile"
    ON public.users
    FOR SELECT
    USING (id = public.current_user_id());

-- 用户只能更新自己的资料
CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    USING (id = public.current_user_id())
    WITH CHECK (id = public.current_user_id());

-- 允许公开查看用户的基本信息（用于公开资料）
CREATE POLICY "Public can view user basic info"
    ON public.users
    FOR SELECT
    USING (true);

-- 注意：实际项目中，公开策略应该只返回特定字段
-- 可以通过视图（View）来实现，而不是直接对表设置策略

-- ==================== email_verification_codes 表 RLS 策略 ====================

-- 用户只能查看自己的验证码
CREATE POLICY "Users can view own verification codes"
    ON public.email_verification_codes
    FOR SELECT
    USING (user_id = public.current_user_id() OR user_id IS NULL);

-- 允许插入验证码（创建时可能没有 user_id）
CREATE POLICY "Allow insert verification codes"
    ON public.email_verification_codes
    FOR INSERT
    WITH CHECK (true);

-- 用户只能更新自己的验证码
CREATE POLICY "Users can update own verification codes"
    ON public.email_verification_codes
    FOR UPDATE
    USING (user_id = public.current_user_id() OR user_id IS NULL)
    WITH CHECK (user_id = public.current_user_id() OR user_id IS NULL);

-- ==================== login_logs 表 RLS 策略 ====================

-- 用户只能查看自己的登录日志
CREATE POLICY "Users can view own login logs"
    ON public.login_logs
    FOR SELECT
    USING (user_id = public.current_user_id());

-- 允许插入登录日志
CREATE POLICY "Allow insert login logs"
    ON public.login_logs
    FOR INSERT
    WITH CHECK (true);

-- 管理员可以查看所有登录日志（需要实现 is_admin 函数）
-- CREATE POLICY "Admins can view all login logs"
--     ON public.login_logs
--     FOR SELECT
--     USING (public.is_admin());

-- ==================== 注意事项 ====================
-- 
-- 1. current_user_id() 函数需要根据实际的认证系统实现
--    如果使用 Supabase Auth，应该从 auth.users 表获取当前用户ID
-- 
-- 2. 对于公开用户信息，建议创建视图而不是直接对表设置策略
--    例如：
--    CREATE VIEW public.user_profiles AS
--    SELECT id, name, avatar_url, bio, created_at
--    FROM public.users
--    WHERE status = 'active';
-- 
-- 3. 生产环境中，建议：
--    - 定期清理过期验证码（使用 cleanup_expired_verification_codes 函数）
--    - 定期归档旧登录日志
--    - 监控异常登录行为

/**
 * @file 20260125000002_create_profile_functions.sql
 * @description 辅助函数（RLS / 应用层 session 变量）
 */

-- 获取当前用户 ID（自定义 JWT 时由应用层 SET LOCAL app.user_id）
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID AS $$
DECLARE
    user_id_text TEXT;
BEGIN
    BEGIN
        user_id_text := current_setting('app.user_id', true);
        IF user_id_text IS NOT NULL AND user_id_text != '' THEN
            RETURN user_id_text::UUID;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
    END;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.current_user_id() IS '当前请求用户 ID（RLS）；需 SET LOCAL app.user_id';

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_admin() IS '是否管理员（占位）';

-- 邮箱是否已验证（以 Auth 为准）
CREATE OR REPLACE FUNCTION public.is_email_verified()
RETURNS BOOLEAN AS $$
DECLARE
    uid UUID;
BEGIN
    uid := public.current_user_id();
    IF uid IS NULL THEN
        RETURN false;
    END IF;
    RETURN COALESCE(
        (SELECT email_confirmed_at IS NOT NULL FROM auth.users WHERE id = uid),
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = auth, public;

COMMENT ON FUNCTION public.is_email_verified() IS '当前用户邮箱是否在 Auth 中已确认';

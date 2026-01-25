/**
 * @file 20260125000004_create_functions.sql
 * @description 创建数据库辅助函数
 * @author System
 * @createDate 2026-01-25
 */

-- 清理过期验证码的函数
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
    -- 删除已过期7天以上的验证码记录
    DELETE FROM public.email_verification_codes
    WHERE expires_at < now() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_expired_verification_codes() IS '清理过期验证码（删除7天前过期的验证码）';

-- 获取当前用户ID的函数（用于 RLS）
-- 注意：此项目使用自定义 JWT 认证，RLS 策略需要特殊处理
-- 方案1：使用 session 变量（推荐）
-- 在应用层设置：SET LOCAL app.user_id = 'user-uuid';
-- 然后在此函数中读取：current_setting('app.user_id', true)::UUID
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID AS $$
DECLARE
    user_id_text TEXT;
BEGIN
    -- 尝试从 session 变量获取用户ID
    -- 应用层需要在执行查询前设置：SET LOCAL app.user_id = 'user-uuid';
    BEGIN
        user_id_text := current_setting('app.user_id', true);
        IF user_id_text IS NOT NULL AND user_id_text != '' THEN
            RETURN user_id_text::UUID;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- 如果 session 变量不存在，返回 NULL
        RETURN NULL;
    END;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.current_user_id() IS '获取当前登录用户ID（用于 RLS 策略）。需要应用层在执行查询前设置 session 变量：SET LOCAL app.user_id = ''user-uuid'';';

-- 检查是否为管理员的函数
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- 检查当前用户是否为管理员
    -- 这里需要根据实际的权限系统实现
    -- 可以从 users 表的 role 字段或 metadata 中判断
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_admin() IS '检查当前用户是否为管理员';

-- 检查邮箱是否已验证的函数
CREATE OR REPLACE FUNCTION public.is_email_verified()
RETURNS BOOLEAN AS $$
DECLARE
    user_id UUID;
BEGIN
    user_id := public.current_user_id();
    IF user_id IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN COALESCE(
        (SELECT email_verified FROM public.users WHERE id = user_id),
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_email_verified() IS '检查当前用户的邮箱是否已验证';

-- 检测可疑登录的函数
CREATE OR REPLACE FUNCTION public.detect_suspicious_login(
    p_user_id UUID,
    p_ip_address INET,
    p_country TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    recent_country TEXT;
    recent_ip INET;
BEGIN
    -- 获取用户最近一次成功登录的国家和IP
    SELECT country, ip_address INTO recent_country, recent_ip
    FROM public.login_logs
    WHERE user_id = p_user_id
        AND status = 'success'
        AND created_at > now() - INTERVAL '30 days'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- 如果IP地址或国家发生变化，可能为可疑登录
    IF recent_ip IS NOT NULL AND recent_ip != p_ip_address THEN
        RETURN true;
    END IF;
    
    IF recent_country IS NOT NULL AND recent_country != p_country THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.detect_suspicious_login(UUID, INET, TEXT) IS '检测可疑登录（基于IP地址和国家变化）';

-- 获取用户最近登录记录的函数
CREATE OR REPLACE FUNCTION public.get_user_recent_logins(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    login_method TEXT,
    device_type TEXT,
    ip_address INET,
    location TEXT,
    status TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ll.id,
        ll.login_method,
        ll.device_type,
        ll.ip_address,
        COALESCE(
            CONCAT_WS(', ', 
                NULLIF(ll.city, ''),
                NULLIF(ll.region, ''),
                NULLIF(ll.country, '')
            ),
            '未知'
        ) AS location,
        ll.status,
        ll.created_at
    FROM public.login_logs ll
    WHERE ll.user_id = p_user_id
    ORDER BY ll.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_recent_logins(UUID, INTEGER) IS '获取用户最近登录记录';

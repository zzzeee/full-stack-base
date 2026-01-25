/**
 * @file 20260125000003_create_login_logs_table.sql
 * @description 创建登录日志表
 * @author System
 * @createDate 2026-01-25
 */

-- 创建登录日志表
CREATE TABLE IF NOT EXISTS public.login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    email TEXT,
    login_method TEXT NOT NULL CHECK (login_method IN ('password', 'verification_code', 'oauth', 'sso')),
    status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
    failure_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    device_type TEXT,
    device_name TEXT,
    os TEXT,
    browser TEXT,
    country TEXT,
    region TEXT,
    city TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON public.login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_email ON public.login_logs(email);
CREATE INDEX IF NOT EXISTS idx_login_logs_status ON public.login_logs(status);
CREATE INDEX IF NOT EXISTS idx_login_logs_login_method ON public.login_logs(login_method);
CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON public.login_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_login_logs_ip_address ON public.login_logs(ip_address);

-- 创建复合索引（用于查询用户登录历史）
CREATE INDEX IF NOT EXISTS idx_login_logs_user_created 
    ON public.login_logs(user_id, created_at DESC);

-- 添加表注释
COMMENT ON TABLE public.login_logs IS '登录日志表';
COMMENT ON COLUMN public.login_logs.id IS '日志ID（UUID）';
COMMENT ON COLUMN public.login_logs.user_id IS '用户ID（登录成功时关联）';
COMMENT ON COLUMN public.login_logs.email IS '登录邮箱';
COMMENT ON COLUMN public.login_logs.login_method IS '登录方式：password-密码, verification_code-验证码, oauth-OAuth, sso-SSO';
COMMENT ON COLUMN public.login_logs.status IS '登录状态：success-成功, failed-失败';
COMMENT ON COLUMN public.login_logs.failure_reason IS '失败原因（登录失败时）';
COMMENT ON COLUMN public.login_logs.ip_address IS 'IP地址';
COMMENT ON COLUMN public.login_logs.user_agent IS '用户代理';
COMMENT ON COLUMN public.login_logs.device_type IS '设备类型';
COMMENT ON COLUMN public.login_logs.device_name IS '设备名称';
COMMENT ON COLUMN public.login_logs.os IS '操作系统';
COMMENT ON COLUMN public.login_logs.browser IS '浏览器';
COMMENT ON COLUMN public.login_logs.country IS '国家';
COMMENT ON COLUMN public.login_logs.region IS '地区';
COMMENT ON COLUMN public.login_logs.city IS '城市';
COMMENT ON COLUMN public.login_logs.metadata IS '扩展元数据（JSON格式）';
COMMENT ON COLUMN public.login_logs.created_at IS '创建时间';

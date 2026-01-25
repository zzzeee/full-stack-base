/**
 * @file 20260125000002_create_email_verification_codes_table.sql
 * @description 创建邮箱验证码表
 * @author System
 * @createDate 2026-01-25
 */

-- 创建邮箱验证码表
CREATE TABLE IF NOT EXISTS public.email_verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('login', 'register', 'reset_password', 'change_email', 'verify_email')),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    is_used BOOLEAN DEFAULT false,
    attempts INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email ON public.email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_purpose ON public.email_verification_codes(purpose);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_user_id ON public.email_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires_at ON public.email_verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_created_at ON public.email_verification_codes(created_at);

-- 创建复合索引（用于查询有效验证码）
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_lookup 
    ON public.email_verification_codes(email, code, purpose, is_used, expires_at);

-- 添加表注释
COMMENT ON TABLE public.email_verification_codes IS '邮箱验证码表';
COMMENT ON COLUMN public.email_verification_codes.id IS '验证码ID（UUID）';
COMMENT ON COLUMN public.email_verification_codes.email IS '邮箱地址';
COMMENT ON COLUMN public.email_verification_codes.code IS '验证码（6位数字）';
COMMENT ON COLUMN public.email_verification_codes.purpose IS '验证码用途：login-登录, register-注册, reset_password-重置密码, change_email-更换邮箱, verify_email-验证邮箱';
COMMENT ON COLUMN public.email_verification_codes.user_id IS '关联的用户ID（可选）';
COMMENT ON COLUMN public.email_verification_codes.is_used IS '是否已使用';
COMMENT ON COLUMN public.email_verification_codes.attempts IS '尝试次数';
COMMENT ON COLUMN public.email_verification_codes.expires_at IS '过期时间';
COMMENT ON COLUMN public.email_verification_codes.used_at IS '使用时间';
COMMENT ON COLUMN public.email_verification_codes.ip_address IS 'IP地址';
COMMENT ON COLUMN public.email_verification_codes.user_agent IS '用户代理';
COMMENT ON COLUMN public.email_verification_codes.created_at IS '创建时间';

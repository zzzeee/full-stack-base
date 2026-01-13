-- 创建邮箱验证码表
-- 说明：存储发送给用户的验证码，用于邮箱登录和验证

CREATE TABLE IF NOT EXISTS public.email_verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 验证码信息
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL, -- 6位数字验证码
    
    -- 用途类型
    purpose VARCHAR(20) NOT NULL CHECK (purpose IN ('login', 'register', 'reset_password', 'change_email', 'verify_email')),
    
    -- 状态
    is_used BOOLEAN DEFAULT FALSE, -- 是否已使用
    used_at TIMESTAMP WITH TIME ZONE, -- 使用时间
    
    -- 时间控制
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 过期时间（通常 5-10 分钟）
    
    -- 安全控制
    ip_address INET, -- 请求 IP
    user_agent TEXT, -- 用户代理
    attempts INT DEFAULT 0, -- 验证尝试次数
    
    -- 关联用户（可选，如果是已登录用户操作）
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_verification_codes_email ON public.email_verification_codes(email);
CREATE INDEX idx_verification_codes_code ON public.email_verification_codes(code);
CREATE INDEX idx_verification_codes_purpose ON public.email_verification_codes(purpose);
CREATE INDEX idx_verification_codes_created_at ON public.email_verification_codes(created_at DESC);
CREATE INDEX idx_verification_codes_expires_at ON public.email_verification_codes(expires_at);

-- 创建复合索引（用于快速查询有效验证码）
CREATE INDEX idx_verification_codes_lookup ON public.email_verification_codes(email, code, purpose, is_used, expires_at);

-- 添加注释
COMMENT ON TABLE public.email_verification_codes IS '邮箱验证码表';
COMMENT ON COLUMN public.email_verification_codes.email IS '接收验证码的邮箱';
COMMENT ON COLUMN public.email_verification_codes.code IS '6位数字验证码';
COMMENT ON COLUMN public.email_verification_codes.purpose IS '用途：login-登录 register-注册 reset_password-重置密码 change_email-更换邮箱 verify_email-验证邮箱';
COMMENT ON COLUMN public.email_verification_codes.is_used IS '是否已使用';
COMMENT ON COLUMN public.email_verification_codes.expires_at IS '过期时间';
COMMENT ON COLUMN public.email_verification_codes.attempts IS '验证尝试次数（防暴力破解）';

-- 创建定时清理过期验证码的函数
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
    -- 删除超过 24 小时的过期验证码
    DELETE FROM public.email_verification_codes
    WHERE expires_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- 创建定时任务（使用 pg_cron 扩展，需要在 Supabase Dashboard 启用）
-- 每小时执行一次清理
-- SELECT cron.schedule('cleanup-verification-codes', '0 * * * *', 'SELECT cleanup_expired_verification_codes()');
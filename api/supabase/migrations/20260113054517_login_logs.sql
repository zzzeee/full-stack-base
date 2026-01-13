-- 创建登录日志表
-- 说明：记录用户的登录行为，用于安全审计和统计分析

CREATE TABLE IF NOT EXISTS public.login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 用户信息
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- 允许 NULL（未知用户的登录尝试）
    email VARCHAR(255), -- 记录邮箱（即使用户被删除也能追溯）
    
    -- 登录方式
    login_method VARCHAR(20) NOT NULL CHECK (login_method IN ('password', 'verification_code', 'oauth', 'sso')),
    
    -- 登录状态
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'blocked')),
    failure_reason TEXT, -- 失败原因（密码错误、验证码错误、账号被封禁等）
    
    -- 设备和位置信息
    ip_address INET NOT NULL,
    user_agent TEXT, -- 浏览器 User-Agent
    device_type VARCHAR(20), -- 设备类型：desktop, mobile, tablet
    device_name VARCHAR(100), -- 设备名称
    browser VARCHAR(50), -- 浏览器名称
    os VARCHAR(50), -- 操作系统
    
    -- 地理位置（可选，通过 IP 解析）
    country VARCHAR(2), -- 国家代码（ISO 3166-1 alpha-2）
    region VARCHAR(100), -- 省/州
    city VARCHAR(100), -- 城市
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 元数据
    metadata JSONB DEFAULT '{}'::JSONB -- 存储额外信息（如 OAuth provider 等）
);

-- 创建索引
CREATE INDEX idx_login_logs_user_id ON public.login_logs(user_id);
CREATE INDEX idx_login_logs_email ON public.login_logs(email);
CREATE INDEX idx_login_logs_status ON public.login_logs(status);
CREATE INDEX idx_login_logs_created_at ON public.login_logs(created_at DESC);
CREATE INDEX idx_login_logs_ip_address ON public.login_logs(ip_address);

-- 创建复合索引（用于查询用户登录历史）
CREATE INDEX idx_login_logs_user_history ON public.login_logs(user_id, created_at DESC);

-- 添加注释
COMMENT ON TABLE public.login_logs IS '登录日志表';
COMMENT ON COLUMN public.login_logs.user_id IS '用户ID（可为空）';
COMMENT ON COLUMN public.login_logs.email IS '登录邮箱';
COMMENT ON COLUMN public.login_logs.login_method IS '登录方式：password-密码 verification_code-验证码 oauth-第三方登录 sso-单点登录';
COMMENT ON COLUMN public.login_logs.status IS '登录状态：success-成功 failed-失败 blocked-被阻止';
COMMENT ON COLUMN public.login_logs.failure_reason IS '失败原因';
COMMENT ON COLUMN public.login_logs.ip_address IS '登录IP地址';
COMMENT ON COLUMN public.login_logs.device_type IS '设备类型';
COMMENT ON COLUMN public.login_logs.country IS 'IP所属国家';

-- 创建统计函数：获取用户最近的登录记录
CREATE OR REPLACE FUNCTION get_user_recent_logins(
    p_user_id UUID,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    login_method VARCHAR,
    status VARCHAR,
    ip_address INET,
    device_type VARCHAR,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id,
        l.login_method,
        l.status,
        l.ip_address,
        l.device_type,
        CONCAT_WS(', ', l.city, l.region, l.country) AS location,
        l.created_at
    FROM public.login_logs l
    WHERE l.user_id = p_user_id
    ORDER BY l.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 创建统计函数：检测异常登录
CREATE OR REPLACE FUNCTION detect_suspicious_login(
    p_user_id UUID,
    p_ip_address INET,
    p_country VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    recent_country VARCHAR;
    login_count INT;
BEGIN
    -- 获取用户最近一次成功登录的国家
    SELECT country INTO recent_country
    FROM public.login_logs
    WHERE user_id = p_user_id
      AND status = 'success'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- 如果国家突然改变，标记为可疑
    IF recent_country IS NOT NULL AND recent_country != p_country THEN
        RETURN TRUE;
    END IF;
    
    -- 检查最近 1 小时内的失败登录次数
    SELECT COUNT(*) INTO login_count
    FROM public.login_logs
    WHERE user_id = p_user_id
      AND status = 'failed'
      AND created_at > NOW() - INTERVAL '1 hour';
    
    -- 如果失败次数超过 5 次，标记为可疑
    IF login_count >= 5 THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
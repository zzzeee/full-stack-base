-- 创建用户表
-- 说明：存储用户的基本信息和认证数据

-- 创建用户表
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 认证信息
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255), -- 密码哈希（可为空，支持纯验证码登录）
    
    -- 基本资料
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT, -- 头像 URL（可以是 Supabase Storage 路径或外部 URL）
    bio TEXT, -- 个人简介
    phone VARCHAR(20), -- 手机号
    
    -- 状态
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),
    email_verified BOOLEAN DEFAULT FALSE, -- 邮箱是否已验证
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE, -- 最后登录时间
    
    -- 元数据（存储额外信息）
    metadata JSONB DEFAULT '{}'::JSONB
);

-- 创建索引
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);

-- 添加注释
COMMENT ON TABLE public.users IS '用户表';
COMMENT ON COLUMN public.users.id IS '用户唯一标识';
COMMENT ON COLUMN public.users.email IS '用户邮箱（登录凭证）';
COMMENT ON COLUMN public.users.password_hash IS '密码哈希值';
COMMENT ON COLUMN public.users.name IS '用户昵称';
COMMENT ON COLUMN public.users.avatar_url IS '头像URL';
COMMENT ON COLUMN public.users.status IS '账号状态：active-正常 inactive-未激活 suspended-封禁 deleted-已删除';
COMMENT ON COLUMN public.users.email_verified IS '邮箱是否已验证';
COMMENT ON COLUMN public.users.metadata IS '扩展元数据（JSON格式）';

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 users 表添加自动更新触发器
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
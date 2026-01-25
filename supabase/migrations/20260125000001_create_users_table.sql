/**
 * @file 20260125000001_create_users_table.sql
 * @description 创建用户表
 * @author System
 * @createDate 2026-01-25
 */

-- 创建用户表
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT,
    avatar_url TEXT,
    bio TEXT,
    phone TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),
    email_verified BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_login_at TIMESTAMPTZ
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- 创建更新时间触发器函数
-- 先删除已存在的函数和触发器（如果存在且属于其他所有者）
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建更新时间触发器
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 添加表注释
COMMENT ON TABLE public.users IS '用户表';
COMMENT ON COLUMN public.users.id IS '用户ID（UUID）';
COMMENT ON COLUMN public.users.email IS '邮箱地址（唯一）';
COMMENT ON COLUMN public.users.name IS '用户名称';
COMMENT ON COLUMN public.users.password_hash IS '密码哈希值';
COMMENT ON COLUMN public.users.avatar_url IS '头像URL';
COMMENT ON COLUMN public.users.bio IS '个人简介';
COMMENT ON COLUMN public.users.phone IS '手机号';
COMMENT ON COLUMN public.users.status IS '用户状态：active-活跃, inactive-非活跃, suspended-已暂停, deleted-已删除';
COMMENT ON COLUMN public.users.email_verified IS '邮箱是否已验证';
COMMENT ON COLUMN public.users.metadata IS '扩展元数据（JSON格式）';
COMMENT ON COLUMN public.users.created_at IS '创建时间';
COMMENT ON COLUMN public.users.updated_at IS '更新时间';
COMMENT ON COLUMN public.users.last_login_at IS '最后登录时间';

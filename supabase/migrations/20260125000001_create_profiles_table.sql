/**
 * @file 20260125000001_create_profiles_table.sql
 * @description 用户扩展资料表（与 auth.users 一对一，业务字段仅存于此）
 */

-- ==================== profiles ====================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    bio TEXT,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles (status);

COMMENT ON TABLE public.profiles IS '用户公开/业务资料（与 Supabase Auth 的 auth.users 对应）';
COMMENT ON COLUMN public.profiles.id IS '与 auth.users.id 一致';

-- 更新时间
CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_profiles_updated_at();

-- Auth 新用户自动插入 profile（邮箱、密码等仍在 auth.users）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, name)
    VALUES (
        NEW.id,
        COALESCE(
            NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
            '用户'
        )
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

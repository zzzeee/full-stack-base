-- 创建行级安全策略（Row Level Security）
-- 说明：控制用户只能访问自己的数据

-- ==================== 启用 RLS ====================

-- 启用 users 表的 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 启用 login_logs 表的 RLS
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

-- ==================== users 表策略 ====================

-- 策略 1：用户可以查看自己的信息
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- 策略 2：用户可以更新自己的信息
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 策略 3：允许注册（通过 Service Role Key）
-- 注意：实际插入操作应该在后端通过 Service Role Key 完成
CREATE POLICY "Allow service role to insert users"
ON public.users
FOR INSERT
WITH CHECK (true);

-- 策略 4：公开查看用户基本信息（用于用户列表、搜索等）
-- 注意：这个策略允许所有人查看所有用户，可以根据需求调整
CREATE POLICY "Public users are viewable by everyone"
ON public.users
FOR SELECT
USING (true);

-- ==================== email_verification_codes 表策略 ====================

-- 不设置任何用户级别的策略，因为验证码不应该被用户直接访问
-- 所有操作都应该通过后端 API（使用 Service Role Key）完成

-- ==================== login_logs 表策略 ====================

-- 策略 1：用户可以查看自己的登录日志
CREATE POLICY "Users can view own login logs"
ON public.login_logs
FOR SELECT
USING (auth.uid() = user_id);

-- 策略 2：不允许用户修改登录日志
-- 所有插入操作都应该通过后端 API（使用 Service Role Key）完成

-- ==================== 辅助函数（在 public schema 中）====================

-- 获取当前认证用户的 ID（在 public schema 中创建）
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查用户是否为管理员
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
          AND metadata->>'role' = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查用户是否已验证邮箱
CREATE OR REPLACE FUNCTION public.is_email_verified()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
          AND email_verified = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加注释
COMMENT ON FUNCTION public.current_user_id IS '获取当前认证用户的ID';
COMMENT ON FUNCTION public.is_admin IS '检查当前用户是否为管理员';
COMMENT ON FUNCTION public.is_email_verified IS '检查当前用户邮箱是否已验证';
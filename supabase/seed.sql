/**
 * @file seed.sql
 * @description 数据库种子数据（可选，用于开发测试）
 */

-- 注意：种子数据仅用于开发环境，生产环境不应包含此文件
-- 用户身份请在 Supabase Auth 中创建；业务资料在 public.profiles（可由触发器自动插入）

-- 示例：若已存在 auth.users，可补充 profile 显示名（需替换为真实 UUID）
-- INSERT INTO public.profiles (id, name, status)
-- VALUES ('00000000-0000-0000-0000-000000000001', '测试用户', 'active')
-- ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

/**
 * @file 20260125000006_optional_disable_rls.sql
 * @description 可选：禁用 RLS（如果使用应用层权限控制）
 * @author System
 * @createDate 2026-01-25
 * 
 * 注意：此文件是可选的
 * - 如果使用应用层（middleware/handler）控制权限，可以禁用 RLS
 * - 如果需要在数据库层面使用 RLS，请跳过此文件
 */

-- 如果使用应用层权限控制，可以禁用 RLS
-- 取消下面的注释来禁用 RLS：

-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.email_verification_codes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.login_logs DISABLE ROW LEVEL SECURITY;

-- 注意：
-- 1. 禁用 RLS 后，所有用户都可以访问所有数据（除非在应用层控制）
-- 2. 确保在应用层（middleware/handler）实现完整的权限控制
-- 3. 使用 Supabase Service Role Key 的操作会绕过 RLS，需要谨慎使用

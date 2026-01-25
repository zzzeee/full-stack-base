/**
 * @file seed.sql
 * @description 数据库种子数据（可选，用于开发测试）
 * @author System
 * @createDate 2026-01-25
 */

-- 注意：种子数据仅用于开发环境，生产环境不应包含此文件
-- 如果需要测试数据，可以在这里添加

-- 示例：创建一个测试用户（密码：test123456，需要先哈希）
-- INSERT INTO public.users (id, email, name, password_hash, email_verified, status)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001',
--     'test@example.com',
--     '测试用户',
--     '$2b$10$...', -- 这里应该是实际的密码哈希值
--     true,
--     'active'
-- );

-- 清理函数示例（可选）
-- SELECT public.cleanup_expired_verification_codes();

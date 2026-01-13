-- supabase/seed.sql
-- 种子数据：用于开发和测试
-- 注意：生产环境不要运行此文件

-- 插入测试用户
INSERT INTO public.users (id, email, password_hash, name, avatar_url, status, email_verified)
VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'admin@example.com',
        '$2a$10$example_hash', -- 实际使用时需要用真实的 bcrypt hash
        'Admin User',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        'active',
        TRUE
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'test@example.com',
        '$2a$10$example_hash',
        'Test User',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
        'active',
        TRUE
    ),
    (
        '00000000-0000-0000-0000-000000000003',
        'inactive@example.com',
        '$2a$10$example_hash',
        'Inactive User',
        NULL,
        'inactive',
        FALSE
    )
ON CONFLICT (email) DO NOTHING;

-- 插入测试验证码
INSERT INTO public.email_verification_codes (email, code, purpose, expires_at)
VALUES
    (
        'test@example.com',
        '123456',
        'login',
        NOW() + INTERVAL '10 minutes'
    )
ON CONFLICT DO NOTHING;

-- 插入测试登录日志
INSERT INTO public.login_logs (user_id, email, login_method, status, ip_address, device_type)
VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'admin@example.com',
        'password',
        'success',
        '127.0.0.1',
        'desktop'
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'test@example.com',
        'verification_code',
        'success',
        '192.168.1.100',
        'mobile'
    )
ON CONFLICT DO NOTHING;
# Supabase 数据库迁移说明

> 本文档说明如何使用 Supabase 迁移文件创建数据库表结构

## 📋 迁移文件列表

迁移文件按执行顺序排列：

1. **20260125000001_create_users_table.sql** - 创建用户表
2. **20260125000002_create_email_verification_codes_table.sql** - 创建邮箱验证码表
3. **20260125000003_create_login_logs_table.sql** - 创建登录日志表
4. **20260125000004_create_functions.sql** - 创建数据库辅助函数
5. **20260125000005_create_rls_policies.sql** - 创建行级安全策略（RLS）
6. **20260125000006_optional_disable_rls.sql** - 可选：禁用 RLS（如果使用应用层权限控制）

## 🚀 使用方法

### 1. 本地开发环境

```bash
# 启动本地 Supabase（需要 Docker）
supabase start

# 应用迁移文件
supabase db reset  # 重置并应用所有迁移

# 或者只应用迁移（不重置）
supabase migration up
```

### 2. 远程 Supabase 项目

```bash
# 登录 Supabase
supabase login

# 链接到远程项目
supabase link --project-ref <your-project-ref>

# 推送迁移到远程
supabase db push
```

### 3. 手动执行 SQL

如果需要在 Supabase Dashboard 中手动执行：

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 按顺序执行每个迁移文件的内容

## 📊 数据库表结构

### users 表

用户主表，存储用户基本信息。

**主要字段：**
- `id` (UUID) - 用户ID，主键
- `email` (TEXT) - 邮箱地址，唯一索引
- `name` (TEXT) - 用户名称
- `password_hash` (TEXT) - 密码哈希值
- `avatar_url` (TEXT) - 头像URL
- `bio` (TEXT) - 个人简介
- `phone` (TEXT) - 手机号
- `status` (TEXT) - 用户状态：active, inactive, suspended, deleted
- `email_verified` (BOOLEAN) - 邮箱是否已验证
- `metadata` (JSONB) - 扩展元数据
- `created_at`, `updated_at`, `last_login_at` - 时间戳

**索引：**
- `idx_users_email` - 邮箱索引
- `idx_users_status` - 状态索引
- `idx_users_created_at` - 创建时间索引

### email_verification_codes 表

邮箱验证码表，用于存储各种用途的验证码。

**主要字段：**
- `id` (UUID) - 验证码ID，主键
- `email` (TEXT) - 邮箱地址
- `code` (TEXT) - 验证码（6位数字）
- `purpose` (TEXT) - 用途：login, register, reset_password, change_email, verify_email
- `user_id` (UUID) - 关联的用户ID（外键）
- `is_used` (BOOLEAN) - 是否已使用
- `attempts` (INTEGER) - 尝试次数
- `expires_at` (TIMESTAMPTZ) - 过期时间
- `ip_address` (INET) - IP地址
- `user_agent` (TEXT) - 用户代理

**索引：**
- `idx_email_verification_codes_email` - 邮箱索引
- `idx_email_verification_codes_purpose` - 用途索引
- `idx_email_verification_codes_user_id` - 用户ID索引
- `idx_email_verification_codes_expires_at` - 过期时间索引
- `idx_email_verification_codes_lookup` - 复合索引（用于快速查询有效验证码）

### login_logs 表

登录日志表，记录所有登录尝试。

**主要字段：**
- `id` (UUID) - 日志ID，主键
- `user_id` (UUID) - 用户ID（登录成功时关联）
- `email` (TEXT) - 登录邮箱
- `login_method` (TEXT) - 登录方式：password, verification_code, oauth, sso
- `status` (TEXT) - 登录状态：success, failed
- `failure_reason` (TEXT) - 失败原因
- `ip_address` (INET) - IP地址
- `user_agent` (TEXT) - 用户代理
- `device_type`, `device_name`, `os`, `browser` - 设备信息
- `country`, `region`, `city` - 地理位置信息
- `metadata` (JSONB) - 扩展元数据

**索引：**
- `idx_login_logs_user_id` - 用户ID索引
- `idx_login_logs_email` - 邮箱索引
- `idx_login_logs_status` - 状态索引
- `idx_login_logs_created_at` - 创建时间索引
- `idx_login_logs_user_created` - 复合索引（用于查询用户登录历史）

## 🔧 数据库函数

### cleanup_expired_verification_codes()

清理过期验证码，删除7天前过期的验证码记录。

**使用示例：**
```sql
SELECT public.cleanup_expired_verification_codes();
```

**建议：** 设置定时任务定期执行此函数。

### current_user_id()

获取当前登录用户ID（用于 RLS 策略）。

**注意：** 此函数需要根据实际的认证系统实现。如果使用 Supabase Auth，需要从 JWT token 中解析用户ID。

### is_admin()

检查当前用户是否为管理员。

**注意：** 需要根据实际的权限系统实现。

### is_email_verified()

检查当前用户的邮箱是否已验证。

### detect_suspicious_login(user_id, ip_address, country)

检测可疑登录，基于IP地址和国家变化判断。

### get_user_recent_logins(user_id, limit)

获取用户最近登录记录。

## 🔒 行级安全策略（RLS）

所有表都启用了 RLS，策略如下：

### users 表
- 用户只能查看和更新自己的资料
- 允许公开查看用户基本信息（用于公开资料）

### email_verification_codes 表
- 用户只能查看和更新自己的验证码
- 允许插入验证码（创建时可能没有 user_id）

### login_logs 表
- 用户只能查看自己的登录日志
- 允许插入登录日志

## ⚠️ 重要提示

1. **current_user_id() 函数实现**
   - 本项目使用自定义 JWT 认证，RLS 策略通过 session 变量传递用户ID
   - 应用层需要在执行查询前设置：`SET LOCAL app.user_id = 'user-uuid';`
   - 如果不需要 RLS，可以禁用或调整策略，在应用层控制权限
   
2. **RLS 策略说明**
   - 由于使用自定义 JWT，RLS 策略需要应用层配合设置 session 变量
   - 如果不需要数据库层面的权限控制，可以禁用 RLS，在应用层（middleware/handler）控制权限
   - 禁用 RLS：`ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;`

2. **生产环境建议**
   - 定期清理过期验证码（使用 `cleanup_expired_verification_codes` 函数）
   - 定期归档旧登录日志
   - 监控异常登录行为
   - 考虑使用视图（View）来限制公开用户信息的字段

3. **RLS 策略调整**
   - 根据实际业务需求调整 RLS 策略
   - 如果不需要公开用户信息，可以删除相关策略
   - 管理员权限需要实现 `is_admin()` 函数

## 📝 后续步骤

1. **执行迁移文件创建表结构**
   ```bash
   supabase db reset  # 本地环境
   # 或
   supabase db push   # 远程环境
   ```

2. **选择 RLS 策略方案**
   - **方案A（推荐）**：使用应用层权限控制，禁用 RLS
     - 执行 `20260125000006_optional_disable_rls.sql` 中的 SQL
     - 在 middleware/handler 中控制权限
   - **方案B**：使用数据库 RLS
     - 应用层需要在执行查询前设置 session 变量
     - 使用 Supabase Service Role Key 的操作会绕过 RLS

3. **设置定时任务清理过期数据**
   - 定期执行 `cleanup_expired_verification_codes()` 函数
   - 可以使用 Supabase Edge Functions 或外部 cron 服务

4. **生成 TypeScript 类型定义**
   ```bash
   # 本地环境
   supabase gen types typescript --local > api/src/types/database.types.ts
   
   # 远程环境
   supabase gen types typescript --project-id <project-ref> > api/src/types/database.types.ts
   ```

5. **验证表结构**
   - 在 Supabase Dashboard 中检查表是否正确创建
   - 验证索引和约束是否正确
   - 测试 RLS 策略（如果启用）

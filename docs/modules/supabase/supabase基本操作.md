# supabase操作


## CLI 安装

```bash
# 安装 Supabase CLI
npm install -g supabase
# 或使用包管理器
brew install supabase/tap/supabase  # macOS
winget install supabase.cli        # Windows
```

## 项目初始化

```bash
# 初始化项目（创建 supabase/ 目录）
supabase init

# 初始化并链接远程项目
supabase init --remote <project-ref>

# ------------ 拉取远程supabase ------------
# 登录 Supabase
supabase login

# 拉取远程
supabase init --remote team-project-id
# 或
supabase init
supabase link --project-ref team-project-id
supabase db pull

# 推送
supabase db push
# 取消链接
supabase unlink
# ------------ end ------------
```


## 迁移文件管理

```bash
# 创建新迁移文件
supabase migration new <name>

# 推送本地迁移到远程
supabase db push [--local]

# 拉取远程模式到本地
supabase db pull

# 显示数据库差异
supabase db diff

# 修复迁移冲突
supabase db remote commit

# 重置本地数据库（清空数据）
supabase db reset [--local]
```


## 环境管理

```bash
# 启动本地开发环境（Docker 容器）
supabase start

# 停止本地环境
supabase stop

# 重启本地环境
supabase restart

# 重置本地数据库（清空数据）
supabase db reset
```


## 数据备份与恢复

```bash
# 备份数据库
supabase db dump --local  # 本地备份
supabase db dump          # 远程备份

# 执行 SQL 文件(无迁移版本管理)
supabase db execute --file ./migration.sql

# 快速重置（不备份）
supabase db reset --no-backup
```


## 配置文件

```toml
# supabase/config.toml
project_id = "your-project-ref"
  
[api]
host = "localhost"
port = 54321

[db]
host = "localhost"
port = 54322

[auth]
host = "localhost"
port = 54324

[storage]
host = "localhost"
port = 54325

[realtime]
host = "localhost"
port = 54326
```


## 文件操作

```bash
# 下载存储桶文件
supabase storage download <bucket-name> <local-path>

# 上传文件到存储桶
supabase storage upload <bucket-name> <file-path>

# 列出存储桶内容
supabase storage list <bucket-name>

# 创建存储桶
supabase storage create <bucket-name>
```


## 用户管理

```bash
# 生成 TypeScript 类型定义
supabase gen types typescript --local  # 本地
supabase gen types typescript          # 远程

# 管理用户
supabase users list
supabase users create <email> <password>
supabase users invite <email>
```


## 部署命令

```bash
# 部署所有更改到远程
supabase deploy

# 部署特定分支
supabase deploy --db-only
supabase deploy --functions-only

# 列出远程部署
supabase deployments list
```


## 函数管理

```bash
# 创建新函数
supabase functions new <function-name>

# 部署函数
supabase functions deploy <function-name>

# 调用函数
supabase functions invoke <function-name>

# 查看函数日志
supabase functions logs <function-name>
```

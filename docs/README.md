# 文档索引

本目录约定：**架构 → 规范 → 模块说明**，与仓库根目录 `README.md` 中的快速入口配合使用。

| 路径 | 内容 |
|------|------|
| [architecture/web.md](./architecture/web.md) | 前端（`web/`）目录与 Feature 划分 |
| [architecture/api.md](./architecture/api.md) | 后端分层、别名、与 Supabase 边界 |
| [rules/web.md](./rules/web.md) | React/Next 代码风格与注释约定 |
| [rules/api.md](./rules/api.md) | Handler/Service/Repository 写法与错误、校验 |
| [modules/logs.md](./modules/logs.md) | 日志级别、JSON 字段、脱敏（与 `api/src/lib/logger.ts` 对齐） |
| [modules/supabase/](./modules/supabase/) | Supabase Auth 心智模型与 CLI 操作备忘 |

**阅读顺序建议**：先读对应端的 `architecture`，再读 `rules`，需要查库/日志时再打开 `modules/`。

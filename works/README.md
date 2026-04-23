# works — 按模块管理的工作清单

本目录按 **产品模块** 分子文件夹，每个模块内自带 `tasks.yaml`（及可选 `spec-*.md`）。根目录 **[registry.yaml](./registry.yaml)** 登记所有模块路径，便于人类浏览与脚本遍历。

## 当前模块

| 模块 ID | 说明 | 任务清单 | 规格 |
|---------|------|----------|------|
| `expo-auth` | 登录、RBAC、用户、展会、权限与业务壳 | [expo-auth/tasks.yaml](./expo-auth/tasks.yaml) | [expo-auth/spec-auth-rbac.md](./expo-auth/spec-auth-rbac.md) |

## 新增模块时

1. 在 `works/<module-id>/` 下创建 **`tasks.yaml`**（建议复制 `expo-auth/tasks.yaml` 的结构，清空 `tasks` 后重写）。
2. 可选：同目录增加 **`spec-*.md`** 或 **`README.md`** 说明范围。
3. 在 **[registry.yaml](./registry.yaml)** 的 `modules` 数组中追加一条，填好 `id`、`title`、`tasks`、`spec`（无 spec 可省略或写 `null`）。

跨模块需求：归入主模块的 `tasks.yaml`，或在任务 `notes` 里链到另一模块的 task id。

## 任务状态（`tasks.yaml` 中 `status`）

| 值 | 含义 |
|----|------|
| `pending` | 未开始 |
| `in_progress` | 进行中 |
| `blocked` | 依赖未满足或外部阻塞 |
| `done` | 已完成 |
| `skipped` | 经确认本期不做 |

## 更新约定

- 开工：将对应模块 `tasks.yaml` 中该条 `status` 改为 `in_progress`，可填 `assignee` / `updated`。
- 完成：改为 `done`，可填 `notes`。
- 阻塞：改为 `blocked`，在 `notes` 写原因。

## 与代码仓库的关系

实现栈：**API**（Hono + Deno + Supabase）、**Web**（Next.js）。表名与路由以代码为准；模块内 **spec** 为该产品块的逻辑真源。

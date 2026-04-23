# 规格：展会现场后台 — 登录 / 用户 / 角色 / 展会 / 权限

> 与 [tasks.yaml](./tasks.yaml) 同步维护；任务完成状态以 `tasks.yaml` 为准。

## 1. 产品范围（首期）

- **登录**：账号（全局唯一 `username`）+ 密码；**无 refresh**；token **7 天**；**多设备**；**不绑定设备**。
- **注册**：自助注册，默认状态 **待审核**；**超级管理员** 与 **主办方** 可审核通过/拒绝。
- **修改密码**：本人旧密码修改；**管理员可重置他人密码**；**无忘记密码**。
- **踢下线**：服务端递增 `session_version`，JWT 校验与 DB 不一致则 **401**。
- **权限**：**方案 A** — 用户在 **某个展会（Event）下** 仅一个 **角色**；菜单权限 = **该角色** 在 `role_permissions` 中拥有的 `permission`（按菜单叶子划分）。**角色权限矩阵由你后续自行维护**（首期可提供 API/种子/可选 UI）。
- **角色（6 种）**：`SUPER_ADMIN`（超级管理员）、`ORGANIZER`（主办方）、`PART_TIME`（兼职人员）、`OUTSOURCE_COFFEE`（外包-咖啡车）、`WORKORDER_ADMIN`（工单-管理员）、`WORKORDER_WORKER`（工单-施工员）。
- **创建用户规则**：
  - **超级管理员**：可创建 **任意** 角色用户。
  - **主办方**：可创建 **除主办方以外** 的所有角色。
  - **工单-管理员**：仅可 **新建与修改** **工单-施工员**（同展会上下文下，服务端强制）。
- **展会**：所有业务数据挂在 `event_id` 下；支持 **创建 / 切换** 当前工作展会（见 API 与 `event_memberships`）。
- **业务模块**：咖啡券 / 物资券 / 大巴 / 工单 / 常用链接 — **仅壳与路由**；常用链接 **写死在 Web 配置常量**。
- **用户资料**：需要 **真实姓名、手机、备注** 等（字段在迁移中定案）；需要 **启用/禁用**。

## 2. 数据模型（逻辑）

| 实体 | 说明 |
|------|------|
| `events` | 展会：名称、时间、状态（draft/active/archived）等 |
| `roles` | 六角色固定枚举 + 展示名 |
| `permissions` | 菜单叶子稳定 `key`（如 `coffee.scan`）、分组、排序 |
| `role_permissions` | `role_id` + `permission_id` |
| `staff_users` | `username` 全局唯一、`password_hash`、`registration_status`、`session_version`、`disabled`、姓名手机备注等 |
| `event_memberships` | `(staff_user_id, event_id)` 唯一，绑定 **该展会下的角色** |

**已定案实现细节**：

- 展会后台账号使用 **`public.staff_users`**（用户名 + bcrypt 密码），**不经过** Supabase Auth；原 `profiles` + 邮箱 OTP 流程仍保留在 `/api/auth/*`。
- 自助注册仅创建 `staff_users`（`pending`），**不产生** `event_memberships`；审核通过时由管理员指定 `event_id` + `role_id` 并写入会员关系。

## 3. 权限 key 树（首期种子建议）

与前期菜单一致（可按实现微调 key）：

- **咖啡券**：`coffee.scan`，`coffee.records`，`coffee.gift`
- **物资券**：`material.scan`，`material.records`，`material.stats`
- **大巴**：`bus.departure`，`bus.return`，`bus.list`
- **工单**：`workorder.list`，`workorder.stats`
- **常用链接**：可单独 `common.links`；链接 URL **前端配置**，可不落库。

## 4. 接口索引（实现前缀：`/api/expo`）

| 区域 | 方法 | 路径 | 备注 |
|------|------|------|------|
| 公开 | POST | `/api/expo/auth/register` | pending |
| 公开 | POST | `/api/expo/auth/login` | approved + 未禁用 |
| 公开 | POST | `/api/expo/auth/logout` | 无状态，客户端清 token |
| 已登录 | GET | `/api/expo/me` | 用户、当前展会、权限 keys |
| 已登录 | PATCH | `/api/expo/me/password` | 旧+新，≥6 位 |
| 已登录 | PATCH | `/api/expo/me/current-event` | membership 校验 |
| 管理 | GET/POST | `/api/expo/events` | 创建展会 |
| 管理 | PATCH | `/api/expo/events/:id` | 更新/归档 |
| 管理 | GET/POST/PATCH | `/api/expo/users` | 列表、创建、改角色/禁用 |
| 管理 | POST | `/api/expo/users/:id/reset-password` | |
| 管理 | POST | `/api/expo/users/:id/kick` | session_version++ |
| 管理 | GET + POST | `/api/expo/registrations/...` | 待审核；approve/reject（超管+主办） |
| 管理 | GET | `/api/expo/roles`、`/api/expo/permissions` | |
| 管理 | PUT | `/api/expo/roles/:roleId/permissions` | 维护矩阵 |

挂载见 `api/src/app.ts` 中 `app.route('/api/expo', expoRoutes)`。

## 5. Web 页面（逻辑）

- `/expo/login`、`/expo/register`
- `/expo/dash`：展会切换、按权限导航、管理子页、业务壳与常用链接

## 6. 任务 ID 速查（详见 tasks.yaml）

| ID | 摘要 |
|----|------|
| SPEC-001 | 规格冻结与变更流程 |
| DB-001 … DB-006 | 迁移与种子 |
| API-001 … API-013 | 后端服务与路由 |
| WEB-001 … WEB-007 | 前端页面与壳 |
| QA-001 | 测试与手测 |

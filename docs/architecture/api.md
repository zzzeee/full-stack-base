# API 项目设计

> 本文档用于统一 **Deno + Hono + Supabase**（独立 HTTP 服务，非必须部署为 Edge Function）
> 项目的代码风格、分层职责与结构约定，作为团队协作与 AI 辅助编码的基础规范。

---

## 一、总体设计原则（必须遵守）

1. 严格遵循以下调用方向（单向）：

```
Route → Handler → Service → Repository
```

- `routes`：只定义 URL 与中间件组合
- `handlers`：只处理 HTTP 输入输出（ctx），复杂逻辑尽量写到services
- `services`：只写业务规则，不关心 HTTP
- `repositories`：只做数据访问，不写业务判断

❌ 禁止：
- handler 直接操作数据库
- service 直接读取 ctx / request
- repository 里写权限逻辑

2. 别名约定

在`deno.json`的`imports`有定义，除以下路径其他均使用 `[@BASE]/`，指向 `./src/`

-  `[@BASE-handlers]/` 指向 `./src/handlers/`
-  `[@BASE-middlewares]/` 指向 `./src/middlewares/`
-  `[@BASE-repositories]/` 指向 `./src/repositories/`
-  `[@BASE-routes]/` 指向 `./src/routes/`
-  `[@BASE-services]/` 指向 `./src/services/`
-  `[@BASE-schemas]/` 指向 `./src/schemas/`
-  `[@BASE-tests]/` 指向 `./tests/`
-  `[@BASE-scripts]/` 指向 `./scripts/`

---

## 二、项目结构（重点约定）

> 目标：**一眼知道代码放哪、只能怎么调用**。

```text
src/
├─ app.ts                # Hono 应用入口（中间件 / 路由注册）
│
├─ routes/               # 路由定义（只管 URL + 中间件）
├─ handlers/             # HTTP 层（ctx 解析 / 响应返回）
├─ services/             # 业务逻辑层（规则 / 权限 / 流程）
├─ repositories/         # 数据访问层（PostgREST / Supabase Auth 等外部服务）
│   └─ supabase-auth.repository.ts  # 仅封装 supabase.auth.*（GoTrue）
│
├─ schemas/              # Zod 校验规则（所有外部输入）
├─ middlewares/          # 通用中间件（auth / validator / logger）
│
├─ lib/                  # 基础设施（error / logger / response）
├─ types/                # 全局 TypeScript 类型 (含: response的数据结构)
└─ config/               # 应用配置（env / 常量）
```

### 核心调用规则（必须遵守）

```
Route → Handler → Service → Repository
```

- **禁止跨层调用**
- **引用只能使用别名**
- 上层只能依赖下层，下层对上层无感知

---

## 三、与 Supabase 的边界

- **Postgres（`public` 等 schema）**：经 `BaseRepository` / 各表 `*Repository`，服务端使用 **Service Role** 时需清楚绕过 RLS 的含义。
- **Supabase Auth（GoTrue）**：封装在 `repositories/supabase-auth.repository.ts`，由 **service** 编排（如同步 `public.users`、签发业务 JWT），**handler 不直接** `supabase.auth.*`。
- **JWT**：业务 token 由应用层 `lib/jwt.ts` 签发；与 Supabase 会话 JWT 区分使用场景。

## 四、运行与本地开发

- 入口：`api/index.ts`；开发：`deno task dev`（见 `api/deno.json`）。
- 环境变量：键名与示例见 `api/.env.example`；仓库根 `.env.example` 仅为索引（指向各子目录应建何文件）。

---

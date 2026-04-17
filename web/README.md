# Web（Next.js）

本目录为前端应用，与根目录 `api/` 的后端通过 HTTP 联调（开发环境下常用 `next.config.ts` 中的 **rewrites** 将 `/api` 代理到 `API_BASE_URL`）。

## 命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 本地开发 |
| `npm run build` / `npm start` | 生产构建与启动 |
| `npm run lint` | ESLint |
| `npm run test:run` | Vitest |

## 环境变量

在 **`web/.env.local`**（或 `web/.env`）中配置，例如：

| 变量 | 说明 |
|------|------|
| `API_BASE_URL` | 后端基址，供 `next.config.ts` 的 rewrites 使用（如 `http://localhost:8000`） |
| `API_PREFIX` | 前端对外路径前缀，默认 `/api` |
| `NEXT_PUBLIC_API_URL` | 可选；测试默认见 `tests/setup.ts` |

全仓库变量索引见根目录 `.env.example`（仅说明路径，不重复模板）。

## 结构约定

详见 `docs/architecture/web.md`（`src/app`、`src/features/*`、`src/lib/*`）。

- 约定式脚手架提示：`npm run scaffold:feature`（见 `scripts/scaffold-feature.mjs`）。
- 本仓库示例模块：`src/features/settings/`（`/settings` 页面）、`src/features/auth/`、`src/features/profile/`。

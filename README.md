# full-stack-base

本地开发时按下面顺序启动各服务即可。

## 启动顺序

**1. Supabase（本地）** — 先启动 **Docker**，在**仓库根目录**执行：

```bash
supabase start
```

**2. API**

```bash
cd api && deno task dev
```

首次将 `api/.env.example` 复制为 `api/.env` 并填写密钥。

**3. Web**

```bash
cd web && npm install && npm run dev
```

默认前端 <http://localhost:3000>，API 端口见 `api/.env` 中的 `PORT`（常见 `8000`）。

---

更细的说明文档见 [docs/README.md](./docs/README.md)。

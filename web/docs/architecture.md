# 架构设计


# Web 项目结构

```text
apps/web/
├─ app/                              # Next.js App Router 页面目录（只存页面 & layout）
│  ├─ layout.tsx                     # 全局布局
│  ├─ page.tsx                        # 首页：/
│  ├─ about/                          # 多级页面示例
│  │  └─ page.tsx                     # /about
│  ├─ product/
│  │  ├─ page.tsx                     # /product
│  │  └─ [id]/                        # 带参数路由
│  │     └─ page.tsx                   # /product/:id
│  ├─ auth/                           # 登录注册相关页面
│  │  ├─ login/page.tsx               # /auth/login
│  │  └─ register/page.tsx            # /auth/register
│  └─ dashboard/                       # 未来后台占位
│     ├─ layout.tsx                    # 后台通用布局
│     └─ page.tsx                      # /dashboard
│
├─ components/                        # UI 组件库（可复用）
│  ├─ Button.tsx
│  ├─ Card.tsx
│  └─ Header.tsx
│
├─ features/                           # 业务模块目录（每个模块独立）
│  ├─ auth/
│  │  ├─ LoginForm.tsx                 # 登录表单
│  │  ├─ RegisterForm.tsx              # 注册表单
│  │  ├─ hooks.ts                      # 自定义 hook
│  │  └─ api.ts                        # 封装 API 调用
│  ├─ product/
│  │  ├─ ProductList.tsx
│  │  ├─ ProductCard.tsx
│  │  └─ api.ts                        # 对应调用 /api/products
│  └─ user/
│     ├─ UserList.tsx
│     ├─ UserDetail.tsx
│     └─ api.ts                        # 对应 /api/users
│
├─ lib/                                # 工具库（独立于页面的逻辑）
│  ├─ api-client.ts                     # fetch 封装，调用你的 api/
│  ├─ supabase-client.ts                # 如果前端也直接访问 supabase
│  ├─ logger.ts                         # 浏览器日志
│  └─ utils.ts                          # 通用工具函数
│
├─ hooks/                               # 自定义 hook
│  ├─ useAuth.ts
│  ├─ useFetch.ts
│  └─ usePagination.ts
│
├─ styles/                              # 样式
│  ├─ globals.css
│  └─ tailwind.css
│
├─ types/                               # TS 类型
│  ├─ auth.types.ts
│  ├─ user.types.ts
│  ├─ product.types.ts
│  └─ api.types.ts                       # 通用响应类型
│
├─ middleware.ts                         # Next.js middleware（鉴权、重定向）
├─ next.config.js                         # Next.js 配置
├─ tsconfig.json
├─ package.json
└─ README.md
```


# 结构职责说明

| 目录	| 作用 |
| -- | -- |
| `app/` | 只放路由相关的东西：页面、布局、404、loading、not-found 等。不要放业务逻辑。 |
| `components/` |	可复用 UI 组件（无业务逻辑，只负责渲染） |
| `features/` |	业务模块：页面组件依赖的表单、Hook、API 调用等。每个模块自成一体，便于拆分后台。 |
| `lib/` |	工具库：api 封装、supabase client、通用函数 |
| `hooks/` |	全局或通用 Hook |
| `styles/` |	CSS / Tailwind / 全局样式 |
| `types/` |	TypeScript 类型定义（与 API 对应） |
| `middleware.ts` |	Next.js middleware，用于鉴权 / 路由重定向等 |
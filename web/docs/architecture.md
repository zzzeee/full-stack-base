# 架构设计


# Web 项目结构

```text
apps/web/
├─ src/                              # 源代码根目录
│  │
│  ├─ app/                            # Next.js App Router（页面 & 路由）
│  │  ├─ (auth)/                     # 路由组：认证相关页面
│  │  │  ├─ login/
│  │  │  │  └─ page.tsx
│  │  │  ├─ register/
│  │  │  │  └─ page.tsx
│  │  │  └─ layout.tsx               # 认证页面专用布局
│  │  │
│  │  ├─ (main)/                     # 路由组：主应用页面
│  │  │  ├─ dashboard/
│  │  │  │  └─ page.tsx
│  │  │  ├─ products/
│  │  │  │  ├─ page.tsx              # /products
│  │  │  │  └─ [id]/
│  │  │  │     ├─ page.tsx           # /products/:id
│  │  │  │     └─ loading.tsx        # 加载状态
│  │  │  └─ layout.tsx               # 主应用布局（带导航）
│  │  │
│  │  ├─ about/
│  │  │  └─ page.tsx
│  │  │
│  │  ├─ api/                        # API Routes（如需要）
│  │  │  └─ health/
│  │  │     └─ route.ts
│  │  │
│  │  ├─ layout.tsx                  # 全局根布局
│  │  ├─ page.tsx                    # 首页
│  │  ├─ error.tsx                   # 全局错误边界
│  │  ├─ loading.tsx                 # 全局加载状态
│  │  └─ not-found.tsx               # 404 页面
│  │
│  ├─ components/                    # UI 组件库
│  │  ├─ ui/                         # 基础 UI 组件（shadcn/ui 风格）
│  │  │  ├─ button.tsx
│  │  │  ├─ card.tsx
│  │  │  ├─ input.tsx
│  │  │  ├─ dialog.tsx
│  │  │  └─ index.ts                 # 统一导出
│  │  │
│  │  ├─ layout/                     # 布局组件
│  │  │  ├─ header.tsx
│  │  │  ├─ footer.tsx
│  │  │  ├─ sidebar.tsx
│  │  │  └─ navbar.tsx
│  │  │
│  │  └─ shared/                     # 共享业务组件
│  │     ├─ loading-spinner.tsx
│  │     ├─ error-message.tsx
│  │     └─ empty-state.tsx
│  │
│  ├─ features/                      # 功能模块（Feature-Sliced Design）
│  │  ├─ auth/
│  │  │  ├─ components/              # 模块专用组件
│  │  │  │  ├─ login-form.tsx
│  │  │  │  ├─ register-form.tsx
│  │  │  │  └─ social-login.tsx
│  │  │  ├─ hooks/                   # 模块专用 hooks
│  │  │  │  ├─ use-auth.ts
│  │  │  │  └─ use-login.ts
│  │  │  ├─ services/                # 业务逻辑 & API 调用
│  │  │  │  └─ auth.service.ts
│  │  │  ├─ stores/                  # 状态管理（Zustand/Jotai）
│  │  │  │  └─ auth.store.ts
│  │  │  ├─ types/                   # 模块类型定义
│  │  │  │  └─ auth.types.ts
│  │  │  └─ index.ts                 # 统一导出
│  │  │
│  │  ├─ products/
│  │  │  ├─ components/
│  │  │  │  ├─ product-list.tsx
│  │  │  │  ├─ product-card.tsx
│  │  │  │  ├─ product-detail.tsx
│  │  │  │  └─ product-filters.tsx
│  │  │  ├─ hooks/
│  │  │  │  ├─ use-products.ts
│  │  │  │  └─ use-product-detail.ts
│  │  │  ├─ services/
│  │  │  │  └─ products.service.ts
│  │  │  ├─ stores/
│  │  │  │  └─ products.store.ts
│  │  │  ├─ types/
│  │  │  │  └─ product.types.ts
│  │  │  └─ index.ts
│  │  │
│  │  └─ users/
│  │     ├─ components/
│  │     │  ├─ user-list.tsx
│  │     │  ├─ user-card.tsx
│  │     │  └─ user-profile.tsx
│  │     ├─ hooks/
│  │     │  └─ use-users.ts
│  │     ├─ services/
│  │     │  └─ users.service.ts
│  │     ├─ types/
│  │     │  └─ user.types.ts
│  │     └─ index.ts
│  │
│  ├─ lib/                           # 工具库 & 配置
│  │  ├─ api/                        # API 相关
│  │  │  ├─ client.ts                # Fetch/Axios 封装
│  │  │  ├─ interceptors.ts          # 请求/响应拦截器
│  │  │  └─ endpoints.ts             # API 端点配置
│  │  │
│  │  ├─ db/                         # 数据库客户端
│  │  │  ├─ supabase.ts
│  │  │  └─ prisma.ts
│  │  │
│  │  ├─ utils/                      # 通用工具函数
│  │  │  ├─ cn.ts                    # classnames 合并（tailwind-merge）
│  │  │  ├─ format.ts                # 格式化（日期、货币等）
│  │  │  ├─ validation.ts            # 验证函数
│  │  │  └─ storage.ts               # localStorage/sessionStorage
│  │  │
│  │  ├─ hooks/                      # 全局通用 hooks
│  │  │  ├─ use-mounted.ts
│  │  │  ├─ use-debounce.ts
│  │  │  ├─ use-local-storage.ts
│  │  │  └─ use-media-query.ts
│  │  │
│  │  ├─ constants/                  # 常量配置
│  │  │  ├─ routes.ts                # 路由常量
│  │  │  ├─ config.ts                # 应用配置
│  │  │  └─ env.ts                   # 环境变量（类型安全）
│  │  │
│  │  └─ logger.ts                   # 日志工具
│  │
│  ├─ types/                         # 全局类型定义
│  │  ├─ global.d.ts                 # 全局类型声明
│  │  ├─ api.types.ts                # API 通用类型
│  │  └─ common.types.ts             # 通用业务类型
│  │
│  ├─ styles/                        # 样式文件
│  │  ├─ globals.css                 # 全局样式
│  │  ├─ variables.css               # CSS 变量
│  │  └─ theme.css                   # 主题样式
│  │
│  ├─ config/                        # 应用配置
│  │  ├─ site.config.ts              # 站点元信息
│  │  ├─ seo.config.ts               # SEO 配置
│  │  └─ navigation.config.ts        # 导航配置
│  │
│  └─ middleware.ts                  # Next.js 中间件
│
├─ public/                           # 静态资源
│  ├─ images/
│  ├─ fonts/
│  ├─ icons/
│  └─ favicon.ico
│
├─ tests/                            # 测试文件
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
│
├─ .env.local                        # 环境变量（本地）
├─ .env.example                      # 环境变量示例
├─ .eslintrc.json                    # ESLint 配置
├─ .prettierrc                       # Prettier 配置
├─ next.config.js                    # Next.js 配置
├─ tailwind.config.ts                # Tailwind 配置
├─ tsconfig.json                     # TypeScript 配置
├─ package.json
└─ README.md
```

---

# 🎯 优化亮点

## 1. 使用 `src/` 目录

- 将所有源代码放入 src/ 目录，与配置文件分离
- 让项目根目录更整洁

## 2. 路由组（Route Groups）

```text
(auth)/    # 认证相关页面（共享布局）
(main)/    # 主应用页面（共享导航）
```

- 使用括号创建路由组，不影响 URL 路径
- 每个组可以有独立的 layout.tsx

## 3. Feature-Sliced 模块化

每个功能模块包含：
```text
features/auth/
├─ components/    # 组件
├─ hooks/         # Hooks
├─ services/      # API & 业务逻辑
├─ stores/        # 状态管理
├─ types/         # 类型定义
└─ index.ts       # 统一导出
```

## 4. 清晰的组件分层

```text
components/
├─ ui/           # 纯 UI 组件（无业务逻辑）
├─ layout/       # 布局组件
└─ shared/       # 共享业务组件
```

## 5. 更好的 lib 组织

```text
lib/
├─ api/          # API 相关封装
├─ db/           # 数据库客户端
├─ utils/        # 工具函数（细分）
├─ hooks/        # 全局 hooks
└─ constants/    # 常量配置
```

## 6. 完善的特性支持

- ✅ 加载状态（loading.tsx）
- ✅ 错误处理（error.tsx）
- ✅ 404 页面（not-found.tsx）
- ✅ 中间件（鉴权、重定向）
- ✅ 测试目录


## 📝 使用建议

### 导入路径配置（tsconfig.json）

```json
{
    "compilerOptions": {
        "baseUrl": ".",
        "paths": {
            "@/*": ["./src/*"],
            "@/components/*": ["./src/components/*"],
            "@/features/*": ["./src/features/*"],
            "@/lib/*": ["./src/lib/*"],
            "@/types/*": ["./src/types/*"]
        }
    }
}
```

### 使用示例

```tsx
// ✅ 推荐
import { Button } from '@/components/ui'
import { useAuth } from '@/features/auth'
import { apiClient } from '@/lib/api/client'

// ❌ 避免
import { Button } from '../../../components/ui/button'
```

### 环境变量类型安全

```typescript
// lib/constants/env.ts
export const env = {
    apiUrl: process.env.NEXT_PUBLIC_API_URL!,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
} as const;
```

---

这个结构遵循了 Next.js 最佳实践，同时借鉴了 Feature-Sliced Design 架构思想，适合中大型项目！
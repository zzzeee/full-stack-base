# AI 编程提示词模板

> 用途: 指导 AI 按照项目规范生成代码和测试

---

## 📁 项目上下文（首次对话必读）

```markdown
这是一个 Next.js 14 + TypeScript + Tailwind CSS 项目。

项目结构：
- src/app/ - Next.js App Router 页面
- src/components/ - UI 组件（ui/layout/shared）
- src/features/ - 功能模块（Feature-Sliced Design）
- src/lib/ - 工具库和配置
- tests/ - 测试文件

技术栈：
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (状态管理)
- Vitest + Testing Library (测试)
- React Hook Form + Zod (表单验证)

导入路径别名：
- @/ => src/
- @/components/* => src/components/*
- @/features/* => src/features/*
- @/lib/* => src/lib/*

代码规范见: ./docs/code-style.md
架构设计见: ./docs/architecture.md
```

---

## 🎯 快速提示词模板

### 1. 创建新功能模块

```markdown
请创建一个 [功能名称] 功能模块/页面

功能及要求描述：
[详细描述功能需求]

目录结构：
src/features/[模块名]/
├── components/    # 模块专用组件
├── services/      # API调用和业务逻辑和hook
├── stores/        # Zustand 状态管理
├── types/         # 类型定义
└── index.ts       # 统一导出

要求：
1. 遵循 Feature-Sliced Design 架构
2. 使用 TypeScript 严格模式
3. 组件使用函数式 + hooks
4. 添加完整的 JSDoc 注释

示例代码风格参考: ./docs/code-style.md
```

---

### 2. 创建 React 组件

```markdown
请创建一个 [组件名称] 组件：

位置: src/[components|features]/[路径]/[组件名].tsx

功能描述：
[组件功能和交互]

Props 定义：
- prop1: string - 描述
- prop2?: number - 描述（可选）

要求：
1. 使用 React.FC<Props> 类型
2. Props 使用 interface 定义，命名为 [组件名]Props
3. 添加完整的 JSDoc 文件头和组件注释
4. 包含 @example 使用示例
5. 使用 Tailwind CSS 样式
6. 遵循 Composition 模式（小组件组合）

JSDoc 格式示例：
/**
 * @file ComponentName.tsx
 * @description 组件功能描述
 * @author [Your Name]
 * @createDate YYYY-MM-DD
 */

/**
 * 组件说明
 *
 * @component
 * @param {Object} props - 组件属性
 * @param {string} props.name - 属性说明
 * @returns {JSX.Element}
 * @example
 * <ComponentName name="test" />
 */
```

---

### 4. 创建 API Service

```markdown
请创建 [模块] 的 API Service：

位置: src/features/[模块]/services/[模块].service.ts

功能描述：
需要以下 API 方法：
- getList() - 获取列表
- getById(id) - 获取详情
- create(data) - 创建
- update(id, data) - 更新
- delete(id) - 删除

要求：
1. 使用 apiClient (src/lib/api/client.ts)
2. 使用 ENDPOINTS 配置 (src/lib/api/endpoints.ts)
3. 所有方法添加 JSDoc 注释
4. 返回类型使用 ApiResponse<T>
5. 添加错误处理
6. 导出所有方法

代码模板：
import { apiClient } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import type { ApiResponse } from '@/lib/api/types'
import type { [Type] } from './types'

/**
 * 获取列表
 * @param params - 查询参数
 * @returns Promise<ApiResponse<Type[]>>
 */
export const getList = async (params?: QueryParams) => {
  return apiClient.get<Type[]>(ENDPOINTS.[module].list(params))
}
```

---

### 5. 创建 Zustand Store

```markdown
请创建 [模块] 的状态管理 Store：

位置: src/features/[模块]/stores/[模块].store.ts

状态字段：
- field1: type - 描述
- field2: type - 描述

操作方法：
- action1() - 描述
- action2(param) - 描述

要求：
1. 使用 Zustand 的 create
2. 启用 persist 中间件（如需持久化）
3. 添加完整的 JSDoc 注释
4. 类型定义清晰（State 和 Actions）
5. 导出 hook: use[Module]Store

代码模板：
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface [Module]State {
  // 状态字段
  field: type
  // 操作方法
  action: () => void
}

/**
 * [模块] 状态管理
 */
export const use[Module]Store = create<[Module]State>()(
  persist(
    (set, get) => ({
      // 实现
    }),
    { name: '[module]-storage' }
  )
)
```

---

### 6. 创建页面组件

```markdown
请创建 [页面名称] 页面：

位置: src/app/[路由路径]/page.tsx

功能描述：
[页面功能和布局]

要求：
1. 使用 Next.js 14 App Router 约定
2. 添加 Metadata export
3. 使用 async Server Component（如需服务端数据）
4. 或使用 'use client' + hooks（如需客户端交互）
5. 添加 loading.tsx 和 error.tsx（同目录）
6. SEO 优化（title, description）

代码模板：
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '页面标题',
  description: '页面描述',
}

/**
 * [页面名称]
 * @page
 */
export default function Page() {
  return (
    <div>
      {/* 页面内容 */}
    </div>
  )
}
```

---

### 7. 编写测试

```markdown
请为以下代码编写测试：

[粘贴代码]

测试位置: tests/[对应路径]/[文件名].test.ts

要求：
1. 使用 Vitest + Testing Library
2. 测试文件结构：
   - describe('[模块名]', () => {})
   - beforeEach(() => {}) 清理
   - it('应该...', () => {})
3. 覆盖场景：
   - 正常流程
   - 边界条件（null/undefined/空数组）
   - 错误处理
   - 异步操作
4. Mock 外部依赖：
   - fetch => mockFetchSuccess/mockFetchError
   - localStorage => mockAuthStorage
5. 使用辅助函数: tests/helpers/api-helpers.ts
6. 断言使用 expect(...).toBe/toEqual/toThrow

模板参考: tests/lib/api/client.test.ts

导入示例：
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockFetchSuccess, mockAuthStorage } from '[@BASE-tests]/helpers/api-helpers'
```

---

### 8. 添加 API 端点配置

```markdown
请在 API 端点配置中添加 [模块] 的端点：

位置: src/lib/api/endpoints.ts

需要添加的端点：
- list(params) - 列表
- getById(id) - 详情
- create() - 创建
- update(id) - 更新
- delete(id) - 删除

要求：
1. 添加到 ENDPOINTS 对象
2. 使用 buildQueryParams 处理查询参数
3. 添加 JSDoc 注释
4. 导出类型定义

代码模板：
export const [MODULE]_ENDPOINTS = {
  /**
   * 获取列表
   * @param params - 查询参数
   */
  list: (params?: {
    page?: number
    limit?: number
  }) => `/[module]${buildQueryParams(params)}`,
  
  /** 获取详情 */
  getById: (id: string) => `/[module]/${id}`,
  
  // ... 其他端点
} as const
```

---

### 9. 创建类型定义

```markdown
请创建 [模块] 的类型定义：

位置: src/features/[模块]/types/[模块].types.ts

需要定义的类型：
- [Entity] - 实体类型
- [Entity]Input - 创建/更新输入
- [Entity]Query - 查询参数

要求：
1. 使用 interface 定义对象类型
2. 使用 type 定义联合类型
3. 添加完整的 JSDoc 注释
4. 每个字段添加说明
5. 使用 Utility Types（Partial, Pick, Omit）

JSDoc 格式：
/**
 * [实体] 类型
 *
 * @interface
 * @property {string} id - 唯一标识
 * @property {string} name - 名称
 */
export interface Entity {
  id: string
  name: string
}

/** 创建输入（省略 id 和时间戳） */
export type EntityInput = Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>
```

---

### 10. 重构现有代码

```markdown
请重构以下代码，要求：

[粘贴需要重构的代码]

重构目标：
- [ ] 提取重复逻辑
- [ ] 优化性能（useMemo/useCallback）
- [ ] 改进可读性
- [ ] 添加类型安全
- [ ] 添加错误处理
- [ ] 补充注释

保持：
- 现有功能不变
- API 接口不变
- 导出方式不变

请说明：
1. 重构的原因
2. 改进的点
3. 潜在的风险
```

---

## 🎓 提示词使用技巧

### 技巧 1: 提供完整上下文

```markdown
✅ 好的提示：
我在做 [功能]，需要创建 [组件/Hook/Service]
项目使用: [技术栈]
相关文件: [路径]
参考代码: [粘贴示例]

❌ 不好的提示：
帮我写一个组件
```

### 技巧 2: 明确约束条件

```markdown
要求：
1. 使用 TypeScript 严格模式
2. 遵循项目代码规范
3. 添加完整注释
4. 包含错误处理
5. 提供使用示例
```

### 技巧 3: 分步骤进行

```markdown
第一步: 请帮我设计 [功能] 的数据结构
第二步: 基于数据结构，创建类型定义
第三步: 创建 API Service
第四步: 创建状态管理
第五步: 创建 UI 组件
第六步: 编写测试
```

### 技巧 4: 提供参考

```markdown
请参考以下文件的风格和结构：
- src/features/auth/components/LoginForm.tsx
- src/features/users/services/users.service.ts

保持相同的：
- 注释风格
- 代码组织
- 命名规范
```

---

## 📋 常用检查清单

### 代码检查

- [ ] 类型定义完整（无 any）
- [ ] JSDoc 注释完整
- [ ] 错误处理完善
- [ ] 导入路径使用别名（@/）
- [ ] 遵循命名规范
- [ ] 组件可复用
- [ ] 性能优化（memo/callback）

### 测试检查

- [ ] 测试覆盖主要场景
- [ ] Mock 外部依赖
- [ ] 断言清晰准确
- [ ] 测试独立（beforeEach 清理）
- [ ] 测试命名描述性强

### 提交前检查

- [ ] 运行 `npm run lint`
- [ ] 运行 `npm test`
- [ ] 检查类型 `npm run type-check`
- [ ] 代码格式化 `npm run format`

---

## 🔗 相关文档

- 架构设计: `./docs/architecture.md`
- 代码规范: `./docs/code-style.md`
- API 文档: `apps/web/docs/api.md`
- 组件库: `apps/web/docs/components.md`

---

## 💡 使用示例

### 示例 1: 创建用户管理功能

```markdown
请创建用户管理功能模块，包含：

1. 类型定义 (src/features/users/types/user.types.ts)
   - User 接口
   - UserInput 类型
   - UserQuery 类型

2. API Service (src/features/users/services/users.service.ts)
   - getUsers(query)
   - getUserById(id)
   - createUser(data)
   - updateUser(id, data)
   - deleteUser(id)

3. 状态管理 (src/features/users/stores/users.store.ts)
   - users: User[]
   - selectedUser: User | null
   - setUsers, setSelectedUser

4. 组件
   - UserList.tsx - 用户列表
   - UserCard.tsx - 用户卡片
   - UserForm.tsx - 用户表单

5. 测试
   - users.service.test.ts
   - UserList.test.tsx

遵循项目规范，参考: ./docs/code-style.md
```

### 示例 2: 修复 Bug

```markdown
这段代码有问题：

[粘贴代码]

错误信息：
[粘贴错误]

请：
1. 分析问题原因
2. 提供修复方案
3. 添加错误处理
4. 补充注释说明
5. 提供测试用例

保持代码风格一致
```

---

## 🎯 核心原则

1. **类型安全**: 使用 TypeScript 严格模式
2. **注释完整**: 添加 JSDoc 注释
3. **测试优先**: 重要功能必须有测试
4. **关注分离**: 组件/逻辑/样式分离
5. **可复用**: 提取公共逻辑
6. **性能优化**: 合理使用 memo/callback
7. **错误处理**: 完善的异常处理
8. **可维护**: 清晰的代码结构
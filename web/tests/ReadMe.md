# API 模块测试文档

## 📁 测试结构

```
tests/
├── setup.ts                          # 测试环境配置
├── helpers/
│   └── api-helpers.ts                # API 测试辅助函数
└── lib/
    └── api/
        ├── client.test.ts            # API Client 测试
        ├── interceptors.test.ts      # 拦截器测试
        └── endpoints.test.ts         # 端点测试
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8 jsdom
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev @vitejs/plugin-react
```

### 2. 运行测试

```bash
# 运行所有测试
npm test

# 以监听模式运行测试
npm run test:watch

# 运行测试并生成覆盖率报告
npm run test:coverage

# 只运行 API 模块测试
npm run test:api

# 使用 UI 界面运行测试
npm run test:ui
```

## 📝 测试文件说明

### setup.ts
测试环境的全局配置文件，包含：
- Mock localStorage
- Mock fetch
- Mock console
- 环境变量设置
- 全局清理逻辑

### helpers/api-helpers.ts
提供测试辅助函数：
- `createMockResponse` - 创建 mock Response 对象
- `createSuccessResponse` - 创建成功响应
- `createErrorResponse` - 创建错误响应
- `mockFetchSuccess` - Mock 成功的 fetch 请求
- `mockFetchError` - Mock 失败的 fetch 请求
- `mockAuthStorage` - Mock 认证数据
- 预定义的测试数据（mockUser, mockUsers 等）

### client.test.ts
测试 API Client 的核心功能：
- ✅ GET/POST/PUT/PATCH/DELETE 请求
- ✅ 文件上传
- ✅ 超时处理
- ✅ 重试机制
- ✅ 认证 Token 自动添加
- ✅ 自定义请求头
- ✅ URL 构建
- ✅ 错误处理
- ✅ noCache 选项

### interceptors.test.ts
测试拦截器系统：
- ✅ 拦截器管理器（添加/移除/执行）
- ✅ 请求拦截器（Request ID、时间戳、日志）
- ✅ 响应拦截器（保存 Token、日志）
- ✅ 错误拦截器（401/403/5xx 处理）
- ✅ Token 刷新机制

### endpoints.test.ts
测试端点配置：
- ✅ 各模块端点定义
- ✅ 查询参数构建
- ✅ 路径参数替换
- ✅ URL 编码
- ✅ 参数过滤（undefined/null）

## 🎯 测试覆盖目标

| 模块 | 目标覆盖率 |
|------|-----------|
| client.ts | 80%+ |
| interceptors.ts | 80%+ |
| endpoints.ts | 90%+ |
| types.ts | N/A (类型定义) |

## 📊 查看测试报告

运行测试后，可以查看以下报告：

1. **终端输出** - 直接显示测试结果
2. **HTML 报告** - `coverage/index.html` (覆盖率报告)
3. **Vitest UI** - 运行 `npm run test:ui` 查看可视化界面

## ✍️ 编写新测试

### 基础模板

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { apiClient } from '@/lib/api/client'
import { mockFetchSuccess } from '[@BASE-tests]/helpers/api-helpers'

describe('你的功能', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该做某事', async () => {
    // Arrange (准备)
    global.fetch = mockFetchSuccess({ data: 'test' })

    // Act (执行)
    const response = await apiClient.get('/test')

    // Assert (断言)
    expect(response.success).toBe(true)
  })
})
```

### 测试异步操作

```typescript
it('应该处理异步请求', async () => {
  global.fetch = mockFetchSuccess(mockUsers, 100) // 100ms 延迟

  const response = await apiClient.get('/users')

  expect(response.data).toEqual(mockUsers)
})
```

### 测试错误情况

```typescript
it('应该处理错误', async () => {
  global.fetch = mockFetchError('Error message', 'ERROR_CODE', 400)

  await expect(apiClient.get('/users')).rejects.toThrow()
})
```

### 测试 Mock

```typescript
it('应该调用正确的端点', async () => {
  global.fetch = mockFetchSuccess(mockUsers)

  await apiClient.get('/users')

  expect(fetch).toHaveBeenCalledWith(
    'http://localhost:3000/api/users',
    expect.objectContaining({
      method: 'GET',
    })
  )
})
```

## 🐛 调试技巧

### 1. 使用 console.log
```typescript
it('调试测试', async () => {
  const response = await apiClient.get('/users')
  console.log('Response:', response) // 会在测试输出中显示
})
```

### 2. 只运行特定测试
```typescript
it.only('只运行这个测试', async () => {
  // 测试代码
})
```

### 3. 跳过某个测试
```typescript
it.skip('暂时跳过这个测试', async () => {
  // 测试代码
})
```

### 4. 使用 Vitest UI
```bash
npm run test:ui
```
然后在浏览器中查看详细的测试结果和覆盖率。

## 💡 最佳实践

1. **测试命名要清晰** - 使用 "应该..." 的格式
2. **一个测试只测一件事** - 保持测试简单专注
3. **使用 AAA 模式** - Arrange, Act, Assert
4. **Mock 外部依赖** - 不要依赖真实的网络请求
5. **测试边界条件** - 包括成功和失败的情况
6. **保持测试独立** - 每个测试都应该能独立运行
7. **使用有意义的断言** - 确保测试真正验证了功能

## 🔗 相关资源

- [Vitest 文档](https://vitest.dev/)
- [Testing Library 文档](https://testing-library.com/)
- [Jest DOM 匹配器](https://github.com/testing-library/jest-dom)

## 📞 获取帮助

如果遇到测试问题：
1. 查看测试输出的错误信息
2. 使用 `npm run test:ui` 查看详细信息
3. 检查 mock 是否正确设置
4. 确认测试环境配置是否正确
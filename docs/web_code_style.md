# React 代码规范与项目结构指南

> 本文档用于统一 React 项目的**代码风格、注释规范与项目结构**，
> 同时作为 AI 辅助编码的约束参考。强调：**可读性优先、约定优于配置、结构清晰**。

---

## 一、总体代码风格（核心原则）

### 1. 可读性优先（Readable First）
- 代码是给人看的，其次才是给机器执行的
- 宁可多写一行清晰代码，也不要“聪明但难懂”的写法
- 复杂逻辑必须有注释，**不允许“靠猜”**

### 2. 一致性高于个人偏好
- 统一使用 **ESLint + Prettier** 自动格式化
- 相同语义使用相同命名（如：`handleX`、`useX`、`fetchX`）
- 注释风格、文件结构保持一致，避免“每个人一套”

### 3. 函数 & 组件保持“短而清晰”
- 单个函数 / 组件只做一件事
- 超过 **80~120 行**通常意味着需要拆分
- 复杂逻辑优先下沉到 hooks / services

### 4. 显式优于隐式（Explicit > Implicit）
- 重要逻辑不要“藏”在魔法写法里
- 关键分支、边界条件必须清楚表达
- 类型能写清楚就不要偷懒

---

## 二、注释规范（使用原则总结）

> 注释不是“翻译代码”，而是**解释“为什么这么写”**。

### 什么时候必须写注释
- 业务规则 / 特殊判断
- 非直观的算法或数据处理
- 与后端 / 产品约定强相关的逻辑
- 临时方案（TODO / FIXME / HACK）

### 什么时候不建议写注释
- 一眼就懂的代码（如 `setLoading(true)`）
- 纯描述性废话注释（如“这里定义一个变量”）

### 2.1 文件头部注释

每个文件开头应包含文件说明注释：

```tsx
/**
 * @file UserProfile.tsx
 * @description 用户个人资料页面组件，包含基本信息展示和编辑功能
 * @author OpenAI
 * @createDate 2024-01-15
 * @lastModified 2024-01-20
 */
```

**工具函数文件：**

```tsx
/**
 * @file validators.ts
 * @description 表单验证相关工具函数集合
 * @author Claude Code
 * @createDate 2024-01-10
 */
```

### 2.2 组件注释

使用 JSDoc 格式注释组件，说明功能、Props 和使用示例：

```tsx
/**
 * 用户个人资料组件
 *
 * @component
 * @description 展示和编辑用户的个人信息，包括头像、昵称、邮箱等
 *
 * @param {Object} props - 组件属性
 * @param {string} props.userId - 用户ID
 * @param {Function} props.onSave - 保存回调函数
 * @param {boolean} [props.editable=true] - 是否可编辑
 * @param {string} [props.className] - 自定义样式类名
 *
 * @returns {JSX.Element} 用户个人资料组件
 *
 * @example
 * <UserProfile
 *   userId="123"
 *   onSave={handleSave}
 *   editable={true}
 * />
 */
const UserProfile: React.FC<UserProfileProps> = ({
    userId,
    onSave,
    editable = true,
    className,
}) => {
    // 组件实现
};
```

### 2.3 函数注释

普通函数和工具函数使用简洁的 JSDoc 注释：

```tsx
/**
 * 验证邮箱格式
 *
 * @param {string} email - 待验证的邮箱地址
 * @returns {boolean} 是否为有效邮箱格式
 *
 * @example
 * validateEmail('test@example.com') // true
 * validateEmail('invalid-email') // false
 */
const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

/**
 * 深度克隆对象
 *
 * @template T - 对象类型
 * @param {T} obj - 待克隆的对象
 * @returns {T} 克隆后的新对象
 *
 * @throws {Error} 当对象包含循环引用时抛出错误
 */
const deepClone = <T,>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
};
```

### 2.4 类型/接口注释

为类型和接口添加清晰的说明：

```tsx
/**
 * 用户信息接口
 *
 * @interface
 * @property {string} id - 用户唯一标识
 * @property {string} username - 用户名，长度 3-20 字符
 * @property {string} email - 邮箱地址
 * @property {string} [avatar] - 头像URL，可选
 * @property {UserRole} role - 用户角色
 * @property {Date} createdAt - 创建时间
 * @property {Date} [updatedAt] - 最后更新时间
 */
interface User {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    role: UserRole;
    createdAt: Date;
    updatedAt?: Date;
}

/**
 * 用户角色枚举
 *
 * @enum {string}
 */
enum UserRole {
    /** 管理员 - 拥有所有权限 */
    ADMIN = "admin",
    /** 普通用户 - 基础权限 */
    USER = "user",
    /** 访客 - 只读权限 */
    GUEST = "guest",
}

/**
 * API 响应数据结构
 *
 * @template T - 响应数据类型
 */
type ApiResponse<T> = {
    /** 响应状态码 */
    code: number;
    /** 响应数据 */
    data: T;
    /** 响应消息 */
    message: string;
    /** 是否成功 */
    success: boolean;
};
```

### 2.5 常量注释

为常量提供清晰的说明和单位：

```tsx
/**
 * API 端点配置
 * @constant
 */
const API_ENDPOINTS = {
    /** 用户相关接口 */
    USERS: "/api/users",
    /** 认证相关接口 */
    AUTH: "/api/auth",
    /** 文件上传接口 */
    UPLOAD: "/api/upload",
} as const;

/** 最大文件上传大小（5MB） */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** 请求超时时间（毫秒） */
const REQUEST_TIMEOUT = 30000;

/** 默认分页大小 */
const DEFAULT_PAGE_SIZE = 20;

/**
 * 表单验证规则
 * @constant
 */
const VALIDATION_RULES = {
    /** 用户名最小长度 */
    USERNAME_MIN_LENGTH: 3,
    /** 用户名最大长度 */
    USERNAME_MAX_LENGTH: 20,
    /** 密码最小长度 */
    PASSWORD_MIN_LENGTH: 8,
} as const;
```

### 2.6 复杂逻辑注释

为复杂业务逻辑添加分步说明：

```tsx
const handleFormSubmit = async (data: FormData) => {
    // 步骤1: 验证表单数据
    const errors = validateFormData(data);
    if (errors.length > 0) {
        setFormErrors(errors);
        return;
    }

    // 步骤2: 准备上传数据
    const formattedData = {
        ...data,
        // 将时间戳转换为 ISO 格式字符串，便于后端处理
        createdAt: new Date(data.timestamp).toISOString(),
        // 过滤掉空值字段，减少请求体积
        tags: data.tags.filter(Boolean),
    };

    try {
        // 步骤3: 发送请求到服务器
        const response = await api.updateUser(formattedData);

        // 步骤4: 更新本地状态
        setUser(response.data);

        // 步骤5: 同步更新缓存
        queryClient.setQueryData(["user", userId], response.data);

        // TODO: 添加成功提示动画
        showSuccessMessage("保存成功");
    } catch (error) {
        // FIXME: 需要更详细的错误处理和用户提示
        console.error("保存失败:", error);
        showErrorMessage("保存失败，请重试");
    }
};
```

**算法逻辑注释：**

```tsx
/**
 * 使用二分查找在有序数组中查找目标值
 */
const binarySearch = (arr: number[], target: number): number => {
    let left = 0;
    let right = arr.length - 1;

    while (left <= right) {
        // 使用位运算避免溢出
        const mid = left + ((right - left) >> 1);

        if (arr[mid] === target) {
            return mid;
        }

        // 目标值在右半部分
        if (arr[mid] < target) {
            left = mid + 1;
        } else {
            // 目标值在左半部分
            right = mid - 1;
        }
    }

    return -1;
};
```

### 2.7 标记注释

使用标准标记标识特殊情况：

```tsx
// TODO: 待实现的功能
// TODO: 添加分页功能和搜索过滤

// FIXME: 需要修复的问题
// FIXME: 修复在 Safari 浏览器中的滚动抖动问题

// HACK: 临时解决方案
// HACK: 暂时使用 setTimeout 延迟渲染，等待 API 更新后移除

// NOTE: 重要说明
// NOTE: 此处不能使用 useEffect，会导致无限循环

// WARNING: 警告信息
// WARNING: 修改此处代码需要同步更新测试用例

// OPTIMIZE: 性能优化点
// OPTIMIZE: 考虑使用 useMemo 优化大列表渲染

// DEPRECATED: 已废弃的代码
// DEPRECATED: 此方法已废弃，请使用 newMethod 替代

// REVIEW: 需要代码审查
// REVIEW: 此处逻辑较复杂，需要 team leader 审查
```

### 2.8 JSX 注释

在 JSX 中使用 `{/* */}` 格式注释：

```tsx
return (
    <div className="user-profile">
        {/* 头部区域 - 包含头像和基本信息 */}
        <header className="profile-header">
            <Avatar src={user.avatar} size="large" />
            <h1>{user.username}</h1>
        </header>

        {
            /*
      主要内容区域
      注意: 此区域在移动端会折叠显示
    */
        }
        <main className="profile-content">
            {/* 表单编辑区 */}
            <ProfileForm
                data={user}
                onSubmit={handleSubmit}
            />

            {/* 仅在编辑模式下显示保存按钮 */}
            {isEditing && <Button onClick={handleSave}>保存</Button>}
        </main>

        {/* 底部操作栏 */}
        <footer className="profile-footer">
            <Button variant="secondary" onClick={handleCancel}>
                取消
            </Button>
        </footer>
    </div>
);
```

---

## 三、命名风格约定（重点）

### 1. 文件命名
- 组件：`PascalCase.tsx`（如 `UserProfile.tsx`）
- hooks：`useXxx.ts`
- 工具函数：`camelCase.ts`
- 常量文件：`constants.ts`

### 2. 变量 / 函数命名
- 布尔值：`is` / `has` / `can` 开头
- 事件处理：`handleX`
- 请求方法：`fetchX` / `getX` / `updateX`

---

## 四、项目结构（简化示例）

> 结构目标：**按职责拆分，避免“所有东西塞 components”**。

```text
apps/web/
├─ src/                              # 源代码根目录
│  │
│  ├─ app/                            # Next.js App Router（页面 & 路由）
│  │  ├─ (auth)/                     # 路由组：认证相关页面
│  │  │  ├─ login/
│  │  │  │  └─ page.tsx
│  │  │  └─ layout.tsx               # 认证页面专用布局
│  │  │
│  │  ├─ about/
│  │  │  └─ page.tsx
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
│  │  │  │  └─ login-form.tsx
│  │  │  ├─ services/                # 业务逻辑 & API调用 & hook
│  │  │  │  └─ auth.service.ts
│  │  │  ├─ stores/                  # 状态管理（Zustand/Jotai）
│  │  │  │  └─ auth.store.ts
│  │  │  ├─ types/                   # 模块类型定义
│  │  │  │  └─ auth.types.ts
│  │  │  └─ index.ts                 # 统一导出
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
│
├─ .env                              # 环境变量
├─ .env.local                        # 环境变量（本地）
├─ next.config.js                    # Next.js 配置
├─ tailwind.config.ts                # Tailwind 配置
├─ tsconfig.json                     # TypeScript 配置
├─ package.json
└─ README.md
```

### 1. 使用 `src/` 目录

- 将所有源代码放入 src/ 目录，与配置文件分离
- 让项目根目录更整洁

### 2. 路由组（Route Groups）

```text
(auth)/    # 认证相关页面（共享布局）
(main)/    # 主应用页面（共享导航）
```

- 使用括号创建路由组，不影响 URL 路径
- 每个组可以有独立的 layout.tsx

### 3. Feature-Sliced 模块化

每个功能模块包含：
```text
features/auth/
├─ components/    # 组件
├─ services/      # API & 业务逻辑 && Hooks
├─ stores/        # 状态管理
├─ types/         # 类型定义
└─ index.ts       # 统一导出

---

## 五、与 AI 协作的约定（重要）

- AI 生成代码必须：
  - 遵循本规范
  - 包含必要注释
  - 避免过度封装和炫技写法
- AI 生成的复杂逻辑，**必须可人工维护**

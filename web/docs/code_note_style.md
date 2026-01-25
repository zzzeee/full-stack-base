# React 代码规范与注释指南

本文档定义了 React 前端项目的代码风格、注释规范和最佳实践，用于指导开发和 AI 辅助编码。

---

## 目录

- [一、注释规范](#一注释规范)
  - [1.1 文件头部注释](#11-文件头部注释)
  - [1.2 组件注释](#12-组件注释)
  - [1.3 Hooks 注释](#13-hooks-注释)
  - [1.4 函数注释](#14-函数注释)
  - [1.5 类型/接口注释](#15-类型接口注释)
  - [1.6 常量注释](#16-常量注释)
  - [1.7 复杂逻辑注释](#17-复杂逻辑注释)
  - [1.8 标记注释](#18-标记注释)
  - [1.9 JSX 注释](#19-jsx-注释)
  

---

## 一、注释规范

### 1.1 文件头部注释

每个文件开头应包含文件说明注释：

```tsx
/**
 * @file UserProfile.tsx
 * @description 用户个人资料页面组件，包含基本信息展示和编辑功能
 * @author Zhang San
 * @createDate 2024-01-15
 * @lastModified 2024-01-20
 */
```

**工具函数文件：**

```tsx
/**
 * @file validators.ts
 * @description 表单验证相关工具函数集合
 * @author Li Si
 * @createDate 2024-01-10
 */
```

### 1.2 组件注释

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
  className 
}) => {
  // 组件实现
};
```

### 1.3 Hooks 注释

自定义 Hooks 需要详细说明用途、参数和返回值：

```tsx
/**
 * 用户数据管理 Hook
 * 
 * @hook
 * @description 管理用户数据的获取、更新和缓存，包含自动重试和错误处理
 * 
 * @param {string} userId - 用户ID
 * @param {Object} [options] - 配置选项
 * @param {boolean} [options.autoRefresh=false] - 是否自动刷新
 * @param {number} [options.refreshInterval=30000] - 刷新间隔（毫秒）
 * 
 * @returns {Object} 返回用户数据和操作方法
 * @returns {User | null} returns.user - 用户数据
 * @returns {boolean} returns.loading - 加载状态
 * @returns {Error | null} returns.error - 错误信息
 * @returns {Function} returns.updateUser - 更新用户信息的方法
 * @returns {Function} returns.refresh - 手动刷新方法
 * 
 * @example
 * const { user, loading, updateUser } = useUserData('123', {
 *   autoRefresh: true,
 *   refreshInterval: 60000
 * });
 */
const useUserData = (userId: string, options?: UseUserDataOptions) => {
  // Hook 实现
};
```

### 1.4 函数注释

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
const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};
```

### 1.5 类型/接口注释

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
  ADMIN = 'admin',
  /** 普通用户 - 基础权限 */
  USER = 'user',
  /** 访客 - 只读权限 */
  GUEST = 'guest',
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

### 1.6 常量注释

为常量提供清晰的说明和单位：

```tsx
/**
 * API 端点配置
 * @constant
 */
const API_ENDPOINTS = {
  /** 用户相关接口 */
  USERS: '/api/users',
  /** 认证相关接口 */
  AUTH: '/api/auth',
  /** 文件上传接口 */
  UPLOAD: '/api/upload',
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

### 1.7 复杂逻辑注释

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
    queryClient.setQueryData(['user', userId], response.data);
    
    // TODO: 添加成功提示动画
    showSuccessMessage('保存成功');
  } catch (error) {
    // FIXME: 需要更详细的错误处理和用户提示
    console.error('保存失败:', error);
    showErrorMessage('保存失败，请重试');
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

### 1.8 标记注释

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

### 1.9 JSX 注释

在 JSX 中使用 `{/* */}` 格式注释：

```tsx
return (
  <div className="user-profile">
    {/* 头部区域 - 包含头像和基本信息 */}
    <header className="profile-header">
      <Avatar src={user.avatar} size="large" />
      <h1>{user.username}</h1>
    </header>

    {/* 
      主要内容区域
      注意: 此区域在移动端会折叠显示
    */}
    <main className="profile-content">
      {/* 表单编辑区 */}
      <ProfileForm 
        data={user} 
        onSubmit={handleSubmit} 
      />

      {/* 仅在编辑模式下显示保存按钮 */}
      {isEditing && (
        <Button onClick={handleSave}>保存</Button>
      )}
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

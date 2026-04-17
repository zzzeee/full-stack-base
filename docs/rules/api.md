# API 项目代码规范


### 处理器层（handlers/）

**职责**：
- 从 `ctx` 中读取参数 (如: `const body: VerificationCodeLoginInput = await c.req.json();`)
- 调用 service
- 返回统一 API 响应格式 (最好在 `types/*.types.ts` 整理返回结构)

**规则**：
- 注释规范最好附上结构
- 代码尽量优雅，逻辑清晰
- 不直接访问数据库
- 不包含复杂业务处理

```ts
// auth.handler.ts
/**
 * 验证码登录
 * 
 * @route POST /api/auth/login/code
 * @param {Context<{RequestBody: VerificationCodeLoginInput}>} c - Hono 上下文对象
 * @returns {Promise<Response<_SuccessResponse<LoginResponse> | _ErrorResponse>>} JSON 响应
 * 
 * @description 使用 Supabase Auth 验证验证码并完成登录。如果验证成功，会自动在 public.users 表中创建用户。
 */
export async function loginWithVerificationCode(c: Context) {
    // 路由层已通过 zValidator 校验，这里直接取校验后的数据
    const body: VerificationCodeLoginInput = await c.req.json();
    // 使用 Supabase Auth 验证验证码
    const { data, error } = await supabase.auth.verifyOtp({
        email: body.email,
        token: body.code,
        type: 'email',
    });

    if (error) {
        logger.error('supabase.auth.verifyOtp error:', {
            email: body.email,
            error: error.message,
            errorCode: error.status,
        });
        const errorInfo = ErrorInfos[ErrorCodes.VERIFICATION_CODE_INVALID];
        return c.json(
            apiResponse.error(errorInfo.message, errorInfo.code, error),
            errorInfo.status
        )
    } else {
        // 新用户自动注册成功
        const user = await authService.ensurePublicUserExists({
            id: data.user.id,
            email: body.email,
            emailVerified: true, // 验证码登录表示邮箱已验证
        });

        // 组装返回数据，并成功响应
        const loginData = await authService.buildLoginResponse(user);
        return c.json(
            apiResponse.success<LoginResponse>(loginData, '登录成功'),
            200
        );
    }
}
```

---

### 业务层（services/）

**职责**：
- 核心业务规则
- 权限判断
- 跨表 / 跨模块逻辑

**规则**：
- 不依赖 Hono Context
- 不返回 HTTP Response
- 出错时抛出业务错误（AppError）

```ts
if (!user.isAdmin) {
  throw new ForbiddenError('无权限操作')
}
```

---

### 4. 数据访问层（repositories/）

**职责**：
- 封装 Supabase / 数据库操作
- 提供纯数据方法

**规则**：
- 不做权限判断
- 不关心业务含义

---

## 错误处理规范（强约束）

### 1. 统一错误模型

- 所有可预期错误必须继承 `AppError`
- 禁止随意 `throw new Error()`

```ts
throw new ValidationError('参数不合法', ERROR_CODES.INVALID_PARAMS)
```

### 2. 错误只在一处被处理

- 错误统一交给 `error-handler.ts`
- handler / service 不捕获非必要错误

---

## 四、数据校验与 Schema 规范

- 所有外部输入 **必须使用 Zod 校验**
- 校验逻辑集中在 `schemas/`
- handler 中只调用 validator 中间件

```ts
validatorMiddleware(createUserSchema)
```

---

## 命名与代码风格约定

### 1. 文件命名

- 路由：`xxx.routes.ts`
- 处理器：`xxx.handler.ts`
- 服务：`xxx.service.ts`
- 仓库：`xxx.repository.ts`

### 2. 函数命名

- handler：`getX / createX / updateX / deleteX`
- service：`getX / createX / validateX / checkX`
- repository：`findX / insertX / updateX`

---

## 日志规范

- 禁止使用 `console.log`
- 统一使用 `lib/logger.ts`
- 日志必须包含：
  - requestId（如有）
  - 模块名
  - 错误上下文

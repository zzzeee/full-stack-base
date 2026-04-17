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
// auth.handler.ts — handler 只解析输入、调 service、映射 HTTP；Supabase Auth 调用在 service → supabase-auth.repository
/**
 * 验证码登录
 * @route POST /api/auth/login/code
 */
export async function loginWithVerificationCode(c: Context) {
    const body: VerificationCodeLoginInput = await c.req.json();
    const result = await authService.loginWithVerificationCode(body.email, body.code);

    if (!result.ok) {
        if (result.kind === "otp") {
            const errorInfo = ErrorInfos[ErrorCodes.VERIFICATION_CODE_INVALID];
            return c.json(
                apiResponse.error(errorInfo.message, errorInfo.code, result.error),
                errorInfo.status,
            );
        }
        // …其它 kind：no_auth_user / sync，映射为统一错误响应
        const errorInfo = ErrorInfos[ErrorCodes.INTERNAL_ERROR];
        return c.json(
            apiResponse.error("登录失败，请稍后重试", errorInfo.code),
            errorInfo.status,
        );
    }

    return c.json(
        apiResponse.success<LoginResponse>(result.login, "登录成功"),
        200,
    );
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

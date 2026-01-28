# API 项目设计及代码规范

> 本文档用于统一 **Deno + Hono + Supabase Edge Functions** 
> 项目的代码风格、分层职责与结构约定，作为团队协作与 AI 辅助编码的基础规范。

---

## 一、总体设计原则（必须遵守）

1. 严格遵循以下调用方向（单向）：

```
Route → Handler → Service → Repository
```

- `routes`：只定义 URL 与中间件组合
- `handlers`：只处理 HTTP 输入输出（ctx），复杂逻辑尽量写到services
- `services`：只写业务规则，不关心 HTTP
- `repositories`：只做数据访问，不写业务判断

❌ 禁止：
- handler 直接操作数据库
- service 直接读取 ctx / request
- repository 里写权限逻辑

2. 别名约定

在`deno.json`的`imports`有定义，除以下路径其他均使用 `[@BASE]/`，指向 `./src/`

-  `[@BASE-handlers]/` 指向 `./src/handlers/`
-  `[@BASE-middlewares]/` 指向 `./src/middlewares/`
-  `[@BASE-repositories]/` 指向 `./src/repositories/`
-  `[@BASE-routes]/` 指向 `./src/routes/`
-  `[@BASE-services]/` 指向 `./src/services/`
-  `[@BASE-schemas]/` 指向 `./src/schemas/`
-  `[@BASE-tests]/` 指向 `./tests/`
-  `[@BASE-scripts]/` 指向 `./scripts/`

---

## 二、项目结构（重点约定）

> 目标：**一眼知道代码放哪、只能怎么调用**。

```text
src/
├─ app.ts                # Hono 应用入口（中间件 / 路由注册）
│
├─ routes/               # 路由定义（只管 URL + 中间件）
├─ handlers/             # HTTP 层（ctx 解析 / 响应返回）
├─ services/             # 业务逻辑层（规则 / 权限 / 流程）
├─ repositories/         # 数据访问层（Supabase / DB）
│
├─ schemas/              # Zod 校验规则（所有外部输入）
├─ middlewares/          # 通用中间件（auth / validator / logger）
│
├─ lib/                  # 基础设施（error / logger / response）
├─ types/                # 全局 TypeScript 类型 (含: response的数据结构)
└─ config/               # 应用配置（env / 常量）
```

### 核心调用规则（必须遵守）

```
Route → Handler → Service → Repository
```

- **禁止跨层调用**
- **引用只能使用别名**
- 上层只能依赖下层，下层对上层无感知

---

### 2. 处理器层（handlers/）

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

### 3. 业务层（services/）

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

## 三、错误处理规范（强约束）

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

## 五、命名与代码风格约定

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

## 六、日志规范

- 禁止使用 `console.log`
- 统一使用 `lib/logger.ts`
- 日志必须包含：
  - requestId（如有）
  - 模块名
  - 错误上下文

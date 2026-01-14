# Supabase Auth 说明文档

> 本文档基于你前面所有问题整理，目标是：
> **不背 API，不猜行为，而是“知道 Supabase Auth 为什么这样设计、实际什么时候做了什么”。**

---

## 一、Supabase Auth 的设计理念（先建立正确心智模型）

### 1. 核心理念

Supabase Auth 的核心理念只有一句话：

> **Sign up 和 Sign in 在 Auth 层是同一件事**

也就是说：
- 不刻意区分「注册接口 / 登录接口」
- 是否创建用户，取决于 **“验证是否成功 + 用户是否存在”**

---

### 2. Supabase Auth 关心的只有三件事

1. **身份标识（Identity）**
   - email
   - phone

2. **验证方式（Credential / Proof）**
   - password
   - OTP（email / sms）
   - magic link

3. **是否完成验证（Verified）**
   - email_confirmed_at
   - phone_confirmed_at

---

## 二、Auth 中最重要的几个对象

### 1. auth.users（用户）

- 表示一个“真实存在的用户”
- **只有在验证成功后才会创建**

关键字段：
- id
- email
- phone
- encrypted_password
- email_confirmed_at
- phone_confirmed_at
- user_metadata

---

### 2. auth.identities（身份）

- 一个 user 可以有多个 identity
- email / phone / OAuth provider 都是 identity

---

### 3. auth.one_time_tokens（内部表）

- 存储 OTP / Magic Link token（hash 后）
- **内部使用，不是 Public API**
- 自动过期 / 自动清理

> ⚠️ 不可用于业务用途

---

## 三、核心 API 与真实行为（按流程拆解）

---

## 四、signInWithOtp（最容易被误解，但最重要）

### 1. API 示例

```ts
supabase.auth.signInWithOtp({
  email: 'user@example.com',
})
```

或

```ts
supabase.auth.signInWithOtp({
  phone: '+8613812345678',
})
```

---

### 2. 它**实际只做了什么**

✅ 生成 OTP / Magic Link
✅ 发送邮件或短信

❌ 不创建用户
❌ 不登录
❌ 不返回 session

---

### 3. 常见 options 的真实含义

#### channel

- email / sms
- **通常可省略**，Supabase 会自动推断

#### shouldCreateUser

- 默认：true
- true：验证成功时，如不存在 → 创建用户
- false：只允许已存在用户登录

> 用于“禁止新用户注册”的场景

---

## 五、verifyOtp（真正的分水岭）

```ts
supabase.auth.verifyOtp({
  email,
  token,
  type: 'email',
})
```

或（sms）

```ts
supabase.auth.verifyOtp({
  phone,
  token,
  type: 'sms',
})
```

---

### verifyOtp 发生时，Supabase 才会：

1. 校验 OTP
2. 如用户不存在 → 创建 auth.users
3. 标记 email / phone 已确认
4. 创建 session
5. 返回 access_token / refresh_token

---

## 六、Magic Link 的本质

> **Magic Link = verifyOtp 的另一种触发方式**

- 用户点击链接
- Supabase 在回调页完成验证
- 行为等同于 verifyOtp

---

## 七、signUp（邮箱 + 密码）

```ts
supabase.auth.signUp({
  email,
  password,
})
```

### 它的语义是：

> “创建一个邮箱 + 密码账号，并请求邮箱验证”

---

### 它会做什么

1. password 在服务端 hash
2. 创建 auth.users（未确认）
3. 发送 **邮箱验证邮件（不是登录链接）**

❌ 邮件中不会出现密码

---

### 是否会登录？

- Email confirmation = ON（默认）
  - ❌ 不登录
- Email confirmation = OFF
  - ✅ 直接返回 session

---

## 八、signInWithPassword（邮箱 + 密码登录）

```ts
supabase.auth.signInWithPassword({
  email,
  password,
})
```

### 行为

1. 校验用户是否存在
2. 校验密码
3. 校验邮箱是否已确认
4. 成功 → 返回 session

---

## 九、Supabase 不支持的方式（必须明确）

| 方式 | 是否支持 |
|----|----|
| phone + password | ❌ |
| 自定义 OTP 校验 | ❌ |
| 读取 Auth OTP | ❌ |

---

## 十、本地开发行为（Supabase CLI）

### 1. 邮件

- `supabase start`
- 所有 Auth 邮件 → Mailpit
- 地址：
  ```
  http://127.0.0.1:54324
  ```

---

### 2. OTP 存储

- 位于 `auth.one_time_tokens`
- hash 存储
- 不可访问

---

## 十一、Auth OTP vs 业务 OTP（重要边界）

### Auth OTP

- 只用于登录 / 注册
- 生命周期短
- 内部表

### 业务 OTP（你自己建）

- 用于支付 / 操作确认 / 敏感行为
- 自己控制
- 推荐单独建表

---

## 十二、完整流程图（文字版）

### 邮箱 OTP / Magic Link

1. signInWithOtp
2. 发送邮件
3. verifyOtp / 点击链接
4. 创建用户（如不存在）
5. 登录成功

---

### 邮箱 + 密码

1. signUp
2. 邮箱验证
3. signInWithPassword
4. 登录成功

---

## 十三、常见误区总结

❌ signInWithOtp 会创建用户
❌ 验证码可以复用做业务逻辑
❌ 手机号可以配密码
❌ 注册和登录是两套体系

✅ 用户只在验证成功时创建
✅ Auth 只负责“你是谁”

---

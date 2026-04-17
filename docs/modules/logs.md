# 日志设计文档

## 1. 设计大纲

### 核心理念
- 按日志级别分类存储：DEBUG、INFO、WARN、ERROR、RESPONSE_FAIL
- 统一 JSON 格式，便于解析和查询
- requestId 追踪完整请求链路
- 按天自动轮转，按级别设置保留期

### 目录结构
```
logs/
├── debug/2026-01-27.log            # 调试日志（保留 3 天）
├── info/2026-01-27.log             # 信息日志（保留 30 天）
├── warn/2026-01-27.log             # 警告日志（保留 90 天）
├── response_fail/2026-01-27.log    # 响应失败日志（保留 90 天）
└── error/2026-01-27.log            # 错误日志（保留 180 天）
```

### 职责划分
- **Nginx**: HTTP 访问日志、性能指标
- **应用日志**: 业务逻辑、错误、调试信息

---

## 2. 分类说明

### DEBUG - 调试信息
**用途**: 开发调试，仅开发环境启用

**记录内容**:
- 函数调用参数
- 数据库查询语句
- 缓存命中情况
- 中间处理步骤

**示例**: `"查询用户详情 userId: user_456"`

---

### INFO - 信息日志
**用途**: 重要业务操作记录

**记录内容**:
- 用户登录/注册/登出
- 数据创建/更新/删除
- 定时任务执行
- 应用启动/关闭

**示例**: `"用户登录成功 userId: user_456"`

---

### WARN - 警告信息
**用途**: 潜在问题，需要关注但不紧急

**记录内容**:
- 资源使用率高（内存、连接数）
- 连续失败操作（登录失败）
- 降级/重试操作
- 可疑行为

**示例**: `"登录失败 5 次 email: user@example.com"`

---

### ERROR - 错误信息
**用途**: 操作失败，需要立即关注

**记录内容**:
- 数据库操作失败
- API 调用失败
- 未捕获异常
- 数据验证失败（导致操作失败）

**示例**: `"创建用户失败 error: 邮箱已存在"`

---

### RESPONSE_FAIL - 响应失败记录

**记录所有响应失败数据**:
- 请求Method+url
- 请求Header
- 请求Body
- 响应status+status_code
- 响应数据

---

## 3. JSON 结构

### 通用字段（必需）
```json
{
  "timestamp": "2026-01-27T14:23:45.123+08:00",
  "level": "INFO",
  "requestId": "req_7a3k9m2p",
  "ip": "127.0.0.1",
  "message": "用户登录成功"
}
```

### 扩展字段（可选）
```json
{
  "userId": "user_456",
  "error": {
    "type": "DatabaseError",
    "code": "UNIQUE_VIOLATION",
    "stack": "Error: ...\n    at ..."
  },
  "context": {
    "action": "login",
    "resource": "/api/auth/login",
    "duration": 45,
    "custom_field": "任意自定义数据"
  }
}
```

### 完整示例

**INFO 级别**:
```json
{
  "timestamp": "2026-01-27T14:23:45.123+08:00",
  "level": "INFO",
  "requestId": "req_7a3k9m2p",
  "message": "用户登录成功",
  "userId": "user_456",
  "ip": "192.168.1.100",
  "context": {
    "action": "login",
    "method": "password",
    "duration": 45
  }
}
```

**ERROR 级别**:
```json
{
  "timestamp": "2026-01-27T14:23:45.234+08:00",
  "level": "ERROR",
  "requestId": "req_7a3k9m2p",
  "message": "创建用户失败",
  "userId": "user_456",
  "ip": "192.168.1.100",
  "error": {
    "type": "DatabaseError",
    "code": "UNIQUE_VIOLATION",
    "stack": "Error: duplicate key\n    at Database.query (db.ts:45)"
  },
  "context": {
    "action": "createUser",
    "input": {
      "email": "user@example.com"
    }
  }
}
```

**RESPONSE_FAIL 级别**:
```json
{
  "timestamp": "2026-01-27T14:23:45.234+08:00",
  "level": "RESPONSE_FAIL",
  "requestId": "req_7a3k9m2p",
  "message": "创建用户失败",
  "userId": "user_456",
  "ip": "192.168.1.100",
  "error": {
    "type": "DatabaseError",
    "code": "UNIQUE_VIOLATION",
    "stack": "Error: duplicate key\n    at Database.query (db.ts:45)"
  },
  "context": {
    "action": "createUser",
    "request_method": "GET",
    "request_url": "/api/login/auth",
    "request_body": {},
    "header": {},
    "response_status": 500,
    "response_status_code": "",
    "response_data": {}
  }
}

---

## 4. 注意事项

### requestId 规范
- **格式**: `req_` + 8位随机字符（base58）
- **生成时机**: 请求到达时
- **传递**: 所有日志包含相同的 requestId
- **返回**: 响应头 `X-Request-Id: req_7a3k9m2p`

### 敏感信息处理
**永远不记录**:
- 密码（明文）
- 信用卡号
- 身份证号
- 完整 Token

**脱敏记录**:
- 邮箱: `u***r@example.com`
- 手机: `138****5678`
- Token: 只记录前 10 个字符

### 日志级别使用原则
- **DEBUG**: 仅开发环境，帮助调试
- **INFO**: 重要业务节点，一个月后看仍有价值
- **WARN**: 可能预示未来问题
- **ERROR**: 用户期望成功但实际失败

### 文件管理
- **自动轮转**: 每天 0 点切换新文件
- **大小限制**: 单文件最大 100MB
- **命名格式**: `YYYY-MM-DD.log`
- **过期清理**: 按级别自动删除过期日志

### 性能考虑
- 日志写入异步执行，不阻塞主线程
- DEBUG 日志在生产环境禁用
- 避免在循环中记录日志
- 大对象只记录关键字段

### 查询示例
```bash
# 追踪单个请求
grep "req_7a3k9m2p" logs/*/2026-01-27.log | sort

# 查看某用户操作
grep "user_456" logs/info/2026-01-27.log

# 统计错误类型
cat logs/error/2026-01-27.log | jq -r '.error.type' | sort | uniq -c

# 查找慢操作
cat logs/info/2026-01-27.log | jq 'select(.context.duration > 1000)'
```
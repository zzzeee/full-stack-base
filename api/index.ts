import app from './src/app.ts'
import { config } from './src/config/index.ts'

const PORT = config.app.port

console.log(`
🚀 Hono API 服务器启动中...
📍 环境: ${config.app.env}
🌐 端口: ${PORT}
🔗 本地地址: http://localhost:${PORT}
📚 API文档:
  GET  /health         健康检查
  POST /api/auth/captcha 获取验证码
  POST /api/auth/login   登录/注册
  GET  /api/users/profile 获取资料
  PUT  /api/users/profile 更新资料
`)

// 启动服务器
Deno.serve({ port: PORT }, app.fetch)
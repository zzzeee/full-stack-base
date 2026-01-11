import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { config } from './config/index.ts'
import { testSupabaseConnection } from './lib/supabase.client.ts'
// import { requestLogger } from './middlewares/request-logger.ts'

// 导入控制器
import authController from './controllers/auth.controller.ts'
import userController from './controllers/user.controller.ts'

const app = new Hono()

// 全局中间件
app.use('*', logger())
// app.use('*', requestLogger)
app.use('*', cors({
    origin: config.cors.allowedOrigins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}))

// 健康检查（数据库连接测试）
app.get('/health', async (c) => {
    const dbConnected = await testSupabaseConnection()

    return c.json({
        status: dbConnected ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'hono-api',
        version: '1.0.0',
        database: dbConnected ? 'connected' : 'disconnected'
    }, dbConnected ? 200 : 503)
})

// 注册路由
app.route('/api/auth', authController)
app.route('/api/users', userController)

// 根路由
app.get('/', (c) => {
    return c.json({
        message: 'Hono API 服务运行中',
        documentation: '/api/docs',
        version: '1.0.0'
    })
})

// 404处理
app.notFound((c) => {
    return c.json({
        success: false,
        error: 'Endpoint not found',
        path: c.req.path
    }, 404)
})

// 错误处理
app.onError((err, c) => {
    console.error('服务器错误:', err)

    return c.json({
        success: false,
        error: 'Internal server error',
        message: config.app.isDev ? err.message : undefined
    }, 500)
})

export default app
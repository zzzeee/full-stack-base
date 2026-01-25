/**
 * @file app.ts
 * @description Hono 应用主文件，注册路由、中间件和错误处理
 * @author System
 * @createDate 2026-01-25
 */

import { Context, Hono } from '@hono/hono';
import { logger as honoLogger } from 'hono/logger';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';

// 导入路由
import authRoutes from '@routes/auth.routes.ts';
import userRoutes from '@routes/user.routes.ts';

// 导入错误处理
import { registerErrorHandler } from '@lib/errors/error-handler.ts';
import { logger } from './lib/logger.ts';
import { checkSupabaseHealth } from './lib/supabase.client.ts';

/**
 * Hono 应用实例
 * 
 * @constant
 * @description 主应用实例，包含所有路由、中间件和错误处理
 */
const app = new Hono();

// ==================== 全局中间件 ====================

// 请求日志中间件
app.use('*', honoLogger());

/**
 * CORS 允许的来源列表
 * 
 * @constant
 * @description 从环境变量 CORS_ORIGINS 读取，默认为本地开发地址
 */
const allowedOrigins = Deno.env.get('CORS_ORIGINS')?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
];

// CORS 配置中间件
app.use('*', cors({
    origin: allowedOrigins,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 hours
}));

// 美化 JSON 输出（仅开发环境）
if (Deno.env.get('ENVIRONMENT') === 'development') {
    app.use('*', prettyJSON());
}

// ==================== 健康检查 ====================

app.get('/health', async (c: Context) => {
    const supabaseHealthy = await checkSupabaseHealth();

    return c.json({
        status: supabaseHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        environment: Deno.env.get('ENVIRONMENT') || 'development',
        services: {
            supabase: supabaseHealthy ? 'ok' : 'error',
        },
    });
});

// ==================== API 路由 ====================

/**
 * 根路径端点
 * 
 * @route GET /
 * @description 返回 API 基本信息
 * @returns {Object} API 名称、版本和文档地址
 */
app.get('/', (c: Context) => {
    return c.json({
        name: 'My API Project',
        version: '1.0.0',
        docs: '/api/docs', // 如果有 API 文档
    });
});

// 认证路由（公开访问，无需认证）
app.route('/api/auth', authRoutes);

// 用户路由（需要认证，由路由内部中间件处理）
app.route('/api/users', userRoutes);

// ==================== 404 处理 ====================

/**
 * 404 未找到路由处理
 * 
 * @description 当请求的路由不存在时触发，记录警告日志并返回 404 响应
 */
app.notFound((c: Context) => {
    logger.warn('Route not found', {
        method: c.req.method,
        path: c.req.path,
    });

    return c.json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `路由 ${c.req.method} ${c.req.path} 不存在`,
        },
    }, 404);
});

// ==================== 全局错误处理 ====================

registerErrorHandler(app);

// ==================== 导出应用 ====================

logger.info('Application initialized', {
    environment: Deno.env.get('ENVIRONMENT'),
});

export default app;
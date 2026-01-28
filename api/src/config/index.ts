/**
 * @file index.ts
 * @description 配置模块统一导出入口，提供所有配置的集中访问和验证功能
 * @author System
 * @createDate 2026-01-25
 */

import type { 
    FullConfig, 
    AppEnvironment,
    AppConfig,
    SupabaseConfig,
    AuthConfig,
} from '[@BASE]/types/config.types.ts';
import { 
    FormatAppConfig, 
    ValidateAppConfig,
} from '[@BASE]/config/app.config.ts';
import {
    FormatSupabaseConfig,
    ValidateSupabaseConfig,
} from '[@BASE]/config/supabase.config.ts';
import {
    FormatAuthConfig,
    ValidateAuthConfig,
} from '[@BASE]/config/auth.config.ts';
import type { LogLevelName } from '[@BASE]/lib/logger.ts';

const config: FullConfig = {
    baseDir: Deno.env.get("BASE_DIR") || "./",
    app: {
        name: Deno.env.get("APP_NAME") || "My Project",
        version: Deno.env.get("APP_VERSION") || "1.0.0",
        port: parseInt(Deno.env.get("PORT") || "8000"),
        timezone: Deno.env.get("TIMEZONE") || "UTC",
        environment: Deno.env.get("ENVIRONMENT") as AppEnvironment || "development",
        isDevelopment: Deno.env.get("ENVIRONMENT") === "development",
        isProduction: Deno.env.get("ENVIRONMENT") === "production",
        apiVersion: Deno.env.get("API_VERSION") || "v1",
        apiPrefix: "/api",
        corsOrigins: Deno.env.get("CORS_ORIGINS")?.split(",") || ["http://localhost:3000", "http://localhost:5173"],
        logLevel: Deno.env.get("LOG_LEVEL") as LogLevelName | "INFO",
        logDirName: Deno.env.get("LOG_DIR_NAME") || "logs",
    },
    supabase: {
        url: Deno.env.get("SUPABASE_URL") || "",
        anonKey: Deno.env.get("SUPABASE_ANON_KEY") || "",
        serviceRoleKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
        jwtSecret: Deno.env.get("SUPABASE_JWT_SECRET") || "",
    },
    auth: {
        jwtSecret: Deno.env.get("JWT_SECRET") || "",
        jwtExpiresIn: parseInt(Deno.env.get("JWT_EXPIRES_IN") || "604800"),
        jwtRefreshExpiresIn: parseInt(Deno.env.get("JWT_REFRESH_EXPIRES_IN") || "2592000"),
        bcryptRounds: parseInt(Deno.env.get("BCRYPT_ROUNDS") || "10"),
        sessionSecret: Deno.env.get("SESSION_SECRET") || "",
    },
};

/**
 * 构建配置（由入口传入运行时变量）
 */
export function setBaseDir(dir: string): void {
    config.baseDir = dir;
}
export function setAppConfig(conf: AppConfig): void {
    config.app = FormatAppConfig(config, conf);
}
export function setSupabaseConfig(conf: SupabaseConfig): void {
    config.supabase = FormatSupabaseConfig(config, conf);
}
export function setAuthConfig(conf: AuthConfig): void {
    config.auth = FormatAuthConfig(config, conf);
}

/**
 * 验证所有配置
 * 
 * @description 在应用启动时调用，验证所有配置模块的必需环境变量是否已正确设置
 * 如果验证失败，会输出错误信息并退出程序
 * 
 * @throws {Error} 当任何配置验证失败时抛出错误并退出程序
 * 
 * @example
 * // 在应用启动时调用
 * validateConfig(config);
 */
export function ValidateConfig() {
    try {
        ValidateAppConfig(config.app);
        ValidateSupabaseConfig(config.supabase);
        ValidateAuthConfig(config.auth);

        console.log('✅ Configuration validated successfully');
    } catch (error) {
        console.error('❌ Configuration validation failed:', error);
        Deno.exit(1);
    }
}

export default config;
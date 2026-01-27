/**
 * 统一配置对象
 * 
 * @constant
 * @description 集中导出所有配置模块，包括应用配置、Supabase 配置和认证配置
 */
export interface FullConfig {
    baseDir: string;
    app: AppConfig;
    supabase: SupabaseConfig;
    auth: AuthConfig;
}

export type AppEnvironment = "development" | "production" | "test" | "" | undefined;

export interface AppConfig {
    name: string;
    version: string;
    port: number;
    timezone?: string;
    environment: AppEnvironment;
    isDevelopment: boolean;
    isProduction: boolean;
    apiVersion: string;
    apiPrefix: string;
    corsOrigins: string[];
    logLevel: string;
    logDirName: string;
}

/**
 * 认证配置对象
 * 
 * @constant
 * @description 包含 JWT 密钥、过期时间、密码加密轮数和会话密钥等配置
 */
export interface AuthConfig {
    jwtSecret: string;
    jwtExpiresIn: number;
    jwtRefreshExpiresIn: number;
    bcryptRounds: number;
    sessionSecret: string;
}

/**
 * Supabase 配置对象
 * 
 * @constant
 * @description 包含 Supabase URL、匿名密钥、服务角色密钥和 JWT 密钥等配置
 * 所有敏感信息都从环境变量读取，不应硬编码
 */
export interface SupabaseConfig {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
    jwtSecret: string;
}

/**
 * 认证配置对象
 * 
 * @constant
 * @description 包含 JWT 密钥、过期时间、密码加密轮数和会话密钥等配置
 */
export interface AuthConfig {
    jwtSecret: string;
    jwtExpiresIn: number;
    jwtRefreshExpiresIn: number;
    bcryptRounds: number;
    sessionSecret: string;
}
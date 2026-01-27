/**
 * @file logger.ts
 * @description 简化 JSON Lines 日志：按级别分目录（debug/info/warn/error/response_fail），按日期滚动
 * @author System
 * @createDate 2026-01-25
 */

// ==================== 类型定义 ====================

/**
 * 日志级别枚举
 * 
 * @enum {number}
 * @description 定义日志的严重程度级别，数值越小级别越低
 */
/**
 * 日志级别常量（按 docs/simple_log_design.md）
 */
export const LOG_LEVELS = {
    DEBUG: "DEBUG",
    INFO: "INFO",
    WARN: "WARN",
    ERROR: "ERROR",
    RESPONSE_FAIL: "RESPONSE_FAIL",
} as const;

export type LogLevelName = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];

const LOG_LEVEL_ORDER: Record<LogLevelName, number> = {
    DEBUG: 10,
    INFO: 20,
    WARN: 30,
    ERROR: 40,
    RESPONSE_FAIL: 50,
};

/**
 * 日志数据对象类型
 * 
 * @typedef {Record<string, unknown>} LogData
 * @description 用于传递额外的结构化日志数据
 */
type LogData = Record<string, unknown>;

/**
 * JSON 日志通用结构（必含字段）
 * - timestamp/level/requestId/message 对齐 docs/simple_log_design.md
 */
export interface BaseLogEntry {
    timestamp: string; // ISO 8601 with timezone offset
    level: LogLevelName;
    requestId: string;
    message: string;
    ip?: string;
    userId?: string;
    context?: Record<string, unknown>;
    error?: {
        type?: string;
        code?: string;
        message?: string;
        stack?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

/**
 * Logger 配置接口
 * 
 * @interface
 * @property {LogLevel} level - 日志级别，低于此级别的日志将被过滤
 * @property {boolean} timestamp - 是否显示时间戳
 * @property {string | null} logFile - 日志文件路径，null 表示不写入文件
 */
interface LoggerConfig {
    /** 低于此级别不写入（默认 INFO） */
    level: LogLevelName;
    /** 控制台也输出 JSON（默认 true） */
    console?: boolean;
    /** 日志根目录，默认：<APP_BASE_DIR>/logs */
    logDir: string;
}

// ==================== 工具函数 ====================

/**
 * 获取默认日志根目录：logger.ts 文件前2级目录下的 logs（即 api/logs）
 */
function getDefaultAppBaseDir(): string {
    const envBase = Deno.env.get("APP_BASE_DIR");
    if (envBase) return envBase.replace(/\/$/, "");

    // 兜底：使用 Deno.mainModule 所在目录（入口文件目录）
    try {
        const mainUrl = new URL(Deno.mainModule);
        return new URL(".", mainUrl).pathname.replace(/\/$/, "");
    } catch {
        return Deno.cwd();
    }
}

function getDefaultLogDir(): string {
    return `${getDefaultAppBaseDir()}/logs`;
}

function pad2(n: number): string {
    return String(n).padStart(2, "0");
}

/**
 * ISO 8601（带本地时区偏移），形如：2026-01-27T14:23:45.123+08:00
 */
function formatIsoWithOffset(date: Date): string {
    const y = date.getFullYear();
    const m = pad2(date.getMonth() + 1);
    const d = pad2(date.getDate());
    const hh = pad2(date.getHours());
    const mm = pad2(date.getMinutes());
    const ss = pad2(date.getSeconds());
    const ms = String(date.getMilliseconds()).padStart(3, "0");

    const tzMin = -date.getTimezoneOffset(); // e.g. +480 for +08:00
    const sign = tzMin >= 0 ? "+" : "-";
    const abs = Math.abs(tzMin);
    const tzh = pad2(Math.floor(abs / 60));
    const tzm = pad2(abs % 60);
    return `${y}-${m}-${d}T${hh}:${mm}:${ss}.${ms}${sign}${tzh}:${tzm}`;
}

function formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = pad2(date.getMonth() + 1);
    const d = pad2(date.getDate());
    return `${y}-${m}-${d}`;
}

function randomId8(): string {
    return Math.random().toString(36).slice(2, 10);
}

function ensureRequestId(data?: LogData): string {
    const existing = data?.requestId;
    if (typeof existing === "string" && existing.length > 0) return existing;
    return `req_${randomId8()}`;
}

function normalizeLevel(value: unknown): LogLevelName | null {
    if (value === "DEBUG" || value === "INFO" || value === "WARN" || value === "ERROR" || value === "RESPONSE_FAIL") {
        return value;
    }
    return null;
}

function levelDirName(level: LogLevelName): string {
    return level.toLowerCase();
}

async function ensureDir(dir: string) {
    try {
        await Deno.mkdir(dir, { recursive: true });
    } catch (err) {
        if (!(err instanceof Error && err.message.includes("already exists"))) {
            throw err;
        }
    }
}

// ==================== Logger 类 ====================

/**
 * Logger 类
 * 
 * @class
 * @description 提供日志记录功能，支持多种日志级别和格式化选项
 */
class Logger {
    /** Logger 配置 */
    private config: LoggerConfig;
    /** 默认附加字段（child logger 会继承） */
    private baseContext: LogData;

    /**
     * 创建 Logger 实例
     * 
     * @param {Partial<LoggerConfig>} [config] - 可选的配置覆盖
     * @description 从环境变量读取默认配置，可通过参数覆盖
     */
    constructor(config?: Partial<LoggerConfig>) {
        // 从环境变量读取配置
        const envLevelRaw = Deno.env.get('LOG_LEVEL')?.toUpperCase();
        const envLogDir = Deno.env.get('LOG_DIR') || null;

        this.config = {
            level: normalizeLevel(envLevelRaw) ?? "INFO",
            // console: true,
            logDir: envLogDir || getDefaultLogDir(),
            ...config,
        };
        this.baseContext = {};
    }

    /**
     * 写入日志到文件
     * 
     * @private
     * @param {LogCategoryName} category - 日志分类
     * @param {string} dateStr - YYYY-MM-DD
     * @param {string} line - 要写入的日志行（JSON）
     */
    private async writeToFile(level: LogLevelName, dateStr: string, line: string) {
        try {
            const dir = `${this.config.logDir}/${levelDirName(level)}`;
            await ensureDir(dir);
            const filePath = `${dir}/${dateStr}.log`;

            const encoder = new TextEncoder();
            const bytes = encoder.encode(line + "\n");
            const file = await Deno.open(filePath, { write: true, create: true, append: true });
            await file.write(bytes);
            file.close();
        } catch (error) {
            // 文件写入失败时只输出到控制台，不抛出错误
            console.error('Failed to write log to file:', error);
        }
    }

    /**
     * 核心日志方法
     * 
     * @private
     * @param {LogLevelName} level - 日志级别
     * @param {string} message - 日志消息
     * @param {LogData} [data] - 可选的附加数据
     * @description 输出 JSON Lines，并按 level/日期分文件写入 logs/<level>/YYYY-MM-DD.log
     */
    private log(level: LogLevelName, message: string, data?: LogData) {
        // 级别过滤
        if (LOG_LEVEL_ORDER[level] < LOG_LEVEL_ORDER[this.config.level]) return;

        const now = new Date();
        const merged: LogData = { ...this.baseContext, ...(data ?? {}) };

        const entry: BaseLogEntry = {
            timestamp: formatIsoWithOffset(now),
            level,
            requestId: ensureRequestId(merged),
            message,
            ...merged,
        };

        const line = JSON.stringify(entry);

        if (this.config.console) {
            console.log(line);
        }

        const dateStr = formatDate(now);
        this.writeToFile(level, dateStr, line).catch(() => {});
    }

    // ==================== 公开方法 ====================

    /**
     * 标记请求开始
     * 
     * @param {string} requestId - 请求 ID（可选）
     * @param {LogData} [data] - 可选的附加数据
     */
    requestStart(_requestId?: string, _data?: LogData) {
        // 兼容旧接口：不再写 “start/end” 分隔符（JSON Lines 不需要）
    }

    /**
     * 标记请求结束
     * 
     * @param {LogData} [data] - 可选的附加数据
     */
    requestEnd(_data?: LogData) {
        // 兼容旧接口：不再写 “start/end” 分隔符（JSON Lines 不需要）
    }

    /**
     * 记录调试级别日志
     * 
     * @param {string} message - 日志消息
     * @param {LogData} [data] - 可选的附加数据
     */
    debug(message: string, data?: LogData) {
        this.log("DEBUG", message, data);
    }

    /**
     * 记录信息级别日志
     * 
     * @param {string} message - 日志消息
     * @param {LogData} [data] - 可选的附加数据
     */
    info(message: string, data?: LogData) {
        this.log("INFO", message, data);
    }

    /**
     * 记录警告级别日志
     * 
     * @param {string} message - 日志消息
     * @param {LogData} [data] - 可选的附加数据
     */
    warn(message: string, data?: LogData) {
        this.log("WARN", message, data);
    }

    /**
     * 记录错误级别日志
     * 
     * @param {string} message - 日志消息
     * @param {LogData} [data] - 可选的附加数据
     */
    error(message: string, data?: LogData) {
        this.log("ERROR", message, data);
    }

    /**
     * RESPONSE_FAIL：专门记录所有响应失败数据（见 docs/simple_log_design.md）
     */
    responseFail(message: string, data?: LogData) {
        this.log("RESPONSE_FAIL", message, data);
    }

    /**
     * 创建子 Logger（带上下文）
     * 
     * @param {LogData} context - 上下文数据，会自动附加到所有日志中
     * @returns {Logger} 新的 Logger 实例，包含上下文信息
     * 
     * @example
     * const userLogger = logger.child({ userId: '123', requestId: 'abc' });
     * userLogger.info('User action'); // 会自动包含 userId 和 requestId
     */
    child(context: LogData): Logger {
        const childLogger = new Logger(this.config);
        childLogger.baseContext = { ...this.baseContext, ...context };
        return childLogger;
    }

    /**
     * 设置日志级别（运行时）
     */
    setLevel(level: LogLevelName) {
        this.config.level = level;
    }
}

// ==================== 导出单例 ====================

/**
 * 默认 Logger 实例
 * 
 * @constant
 * @description 全局可用的日志记录器单例
 */
export const logger = new Logger();

export default logger;
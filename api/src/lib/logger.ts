/**
 * @file logger.ts
 * @description 日志工具模块，提供易读的格式化输出、结构化日志和日志级别控制
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
export enum LogLevel {
    /** 调试信息 - 用于开发调试 */
    DEBUG = 0,
    /** 一般信息 - 用于记录正常操作 */
    INFO = 1,
    /** 警告信息 - 用于记录潜在问题 */
    WARN = 2,
    /** 错误信息 - 用于记录错误 */
    ERROR = 3,
    /** 致命错误 - 用于记录严重错误，会导致程序退出 */
    FATAL = 4,
}

/**
 * 日志数据对象类型
 * 
 * @typedef {Record<string, unknown>} LogData
 * @description 用于传递额外的结构化日志数据
 */
type LogData = Record<string, unknown>;

/**
 * Logger 配置接口
 * 
 * @interface
 * @property {LogLevel} level - 日志级别，低于此级别的日志将被过滤
 * @property {boolean} timestamp - 是否显示时间戳
 * @property {string | null} logFile - 日志文件路径，null 表示不写入文件
 */
interface LoggerConfig {
    level: LogLevel;
    timestamp: boolean;
    logFile: string | null; // 日志文件路径
}

// ==================== 工具函数 ====================

/**
 * 获取默认日志文件路径
 * logger.ts 文件前2级目录下的logs，文件名为日期(如:2026-01-26.log)
 * logger.ts 位于 api/src/lib/logger.ts，前2级目录是 api，所以日志文件在 api/logs/日期.log
 * 
 * @returns {string} 默认日志文件路径
 */
function getDefaultLogFile(): string {
    // 获取当前文件的路径
    const currentFile = new URL(import.meta.url).pathname;
    // 获取前2级目录（api/src/lib/logger.ts -> api/logs）
    const parts = currentFile.split('/').filter(p => p); // 过滤空字符串
    
    // 找到 'api' 或 'src' 的索引
    const apiIndex = parts.findIndex(p => p === 'api');
    const srcIndex = parts.findIndex(p => p === 'src');
    
    let baseDir: string;
    if (apiIndex !== -1) {
        // 如果找到 api，使用 api 目录
        baseDir = '/' + parts.slice(0, apiIndex + 1).join('/');
    } else if (srcIndex !== -1) {
        // 如果找到 src，使用 src 的上一级目录
        baseDir = '/' + parts.slice(0, srcIndex).join('/');
    } else {
        // 如果都找不到，使用当前工作目录
        baseDir = Deno.cwd();
    }
    
    // 生成日期文件名
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `${baseDir}/logs/${today}.log`;
}

/**
 * 格式化时间戳
 * 
 * @returns {string} 格式化的时间戳字符串（YYYY-MM-DD HH:mm:ss.SSS）
 */
function formatTimestamp(): string {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];
    const ms = now.getMilliseconds().toString().padStart(3, '0');
    return `${date} ${time}.${ms}`;
}

/**
 * 格式化数据对象为 key: value 格式
 * 
 * @param {LogData} data - 要格式化的日志数据对象
 * @returns {string[]} 格式化后的数据行数组
 */
function formatData(data: LogData): string[] {
    const entries = Object.entries(data);
    if (entries.length === 0) return [];

    return entries.map(([key, value]) => {
        let valueStr: string;

        // 特殊处理不同类型
        if (value === null) {
            valueStr = 'null';
        } else if (value === undefined) {
            valueStr = 'undefined';
        } else if (typeof value === 'string') {
            // 字符串直接显示，如果包含换行符则处理
            valueStr = value.includes('\n') 
                ? `\n${value.split('\n').map(line => `    ${line}`).join('\n')}`
                : value;
        } else if (typeof value === 'object') {
            // 对象转换为 JSON，如果太长则截断
            try {
                const json = JSON.stringify(value, null, 2);
                valueStr = json.length > 2000
                    ? `${json.substring(0, 2000)}...`
                    : json;
            } catch {
                valueStr = '[Object]';
            }
        } else {
            valueStr = String(value);
        }

        return `  ${key}: ${valueStr}`;
    });
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
    /** 当前请求 ID（用于标记请求） */
    private currentRequestId: string | null = null;

    /**
     * 创建 Logger 实例
     * 
     * @param {Partial<LoggerConfig>} [config] - 可选的配置覆盖
     * @description 从环境变量读取默认配置，可通过参数覆盖
     */
    constructor(config?: Partial<LoggerConfig>) {
        // 从环境变量读取配置
        const envLevel = Deno.env.get('LOG_LEVEL')?.toUpperCase() as keyof typeof LogLevel | undefined;
        const envLogFile = Deno.env.get('LOG_FILE') || null;

        // 如果没有设置 LOG_FILE，使用默认路径
        const logFile = envLogFile || getDefaultLogFile();

        this.config = {
            level: envLevel ? LogLevel[envLevel] : LogLevel.INFO,
            timestamp: true,
            logFile: logFile,
            ...config,
        };

        // 如果配置了日志文件，确保目录存在
        if (this.config.logFile) {
            this.ensureLogDirectory().catch(err => {
                console.error('Failed to create log directory:', err);
            });
        }
    }

    /**
     * 确保日志目录存在
     * 
     * @private
     */
    private async ensureLogDirectory() {
        if (!this.config.logFile) return;
        
        const logDir = this.config.logFile.split('/').slice(0, -1).join('/');
        if (logDir) {
            try {
                await Deno.mkdir(logDir, { recursive: true });
            } catch (error) {
                // 如果目录已存在，忽略错误
                if (!(error instanceof Error && error.message.includes('already exists'))) {
                    throw error;
                }
            }
        }
    }

    /**
     * 写入日志到文件
     * 
     * @private
     * @param {string} logLine - 要写入的日志行
     */
    private async writeToFile(logLine: string) {
        if (!this.config.logFile) return;

        try {
            // 确保日志目录存在
            const logDir = this.config.logFile.split('/').slice(0, -1).join('/');
            if (logDir) {
                try {
                    await Deno.mkdir(logDir, { recursive: true });
                } catch (err) {
                    // 如果目录已存在，忽略错误
                    if (!(err instanceof Error && err.message.includes('already exists'))) {
                        throw err;
                    }
                }
            }

            // 追加写入日志文件
            const encoder = new TextEncoder();
            const logData = encoder.encode(logLine + '\n');
            
            // 使用 append 模式写入
            const file = await Deno.open(this.config.logFile, { 
                write: true, 
                create: true, 
                append: true 
            });
            await file.write(logData);
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
     * @param {LogLevel} level - 日志级别
     * @param {string} message - 日志消息
     * @param {LogData} [data] - 可选的附加数据
     * @description 格式化并输出日志，文件格式为易读的 key: value 格式
     */
    private log(level: LogLevel, message: string, data?: LogData) {
        // 级别过滤
        if (level < this.config.level) return;

        const levelLabels = {
            [LogLevel.DEBUG]: 'DEBUG',
            [LogLevel.INFO]: 'INFO ',
            [LogLevel.WARN]: 'WARN ',
            [LogLevel.ERROR]: 'ERROR',
            [LogLevel.FATAL]: 'FATAL',
        };

        const levelLabel = levelLabels[level];
        const timestamp = this.config.timestamp ? formatTimestamp() : '';

        // 构建日志行
        const logLines: string[] = [];

        // 时间戳 + 级别 + 消息
        const mainLine = timestamp 
            ? `${timestamp} [${levelLabel}] ${message}`
            : `[${levelLabel}] ${message}`;
        
        logLines.push(mainLine);

        // 添加数据（key: value 格式）
        if (data && Object.keys(data).length > 0) {
            const dataLines = formatData(data);
            logLines.push(...dataLines);
        }

        // 输出到控制台（带颜色，用于终端查看）
        const consoleLines = logLines.map(line => {
            // 控制台输出可以带颜色，但文件输出不带颜色
            if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
                return `\x1b[31m${line}\x1b[0m`; // 红色
            } else if (level === LogLevel.WARN) {
                return `\x1b[33m${line}\x1b[0m`; // 黄色
            } else if (level === LogLevel.DEBUG) {
                return `\x1b[90m${line}\x1b[0m`; // 灰色
            }
            return line;
        });

        consoleLines.forEach(line => console.log(line));

        // 写入文件（不带颜色）
        logLines.forEach(line => {
            this.writeToFile(line).catch(err => {
                console.error('Failed to write log to file:', err);
            });
        });
    }

    // ==================== 公开方法 ====================

    /**
     * 标记请求开始
     * 
     * @param {string} requestId - 请求 ID（可选）
     * @param {LogData} [data] - 可选的附加数据
     */
    requestStart(requestId?: string, data?: LogData) {
        this.currentRequestId = requestId || `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        this.writeToFile('---------- request start ----------').catch(() => {});
        if (this.config.timestamp) {
            this.writeToFile(`  time: ${formatTimestamp()}`).catch(() => {});
        }
        if (requestId) {
            this.writeToFile(`  requestId: ${requestId}`).catch(() => {});
        }
        if (data && Object.keys(data).length > 0) {
            formatData(data).forEach(line => {
                this.writeToFile(line).catch(() => {});
            });
        }
    }

    /**
     * 标记请求结束
     * 
     * @param {LogData} [data] - 可选的附加数据
     */
    requestEnd(data?: LogData) {
        if (data && Object.keys(data).length > 0) {
            formatData(data).forEach(line => {
                this.writeToFile(line).catch(() => {});
            });
        }
        this.writeToFile('---------- request end ----------').catch(() => {});
        this.writeToFile('').catch(() => {}); // 空行分隔
        this.currentRequestId = null;
    }

    /**
     * 记录调试级别日志
     * 
     * @param {string} message - 日志消息
     * @param {LogData} [data] - 可选的附加数据
     */
    debug(message: string, data?: LogData) {
        this.log(LogLevel.DEBUG, message, data);
    }

    /**
     * 记录信息级别日志
     * 
     * @param {string} message - 日志消息
     * @param {LogData} [data] - 可选的附加数据
     */
    info(message: string, data?: LogData) {
        this.log(LogLevel.INFO, message, data);
    }

    /**
     * 记录警告级别日志
     * 
     * @param {string} message - 日志消息
     * @param {LogData} [data] - 可选的附加数据
     */
    warn(message: string, data?: LogData) {
        this.log(LogLevel.WARN, message, data);
    }

    /**
     * 记录错误级别日志
     * 
     * @param {string} message - 日志消息
     * @param {LogData} [data] - 可选的附加数据
     */
    error(message: string, data?: LogData) {
        this.log(LogLevel.ERROR, message, data);
    }

    /**
     * 记录致命错误级别日志并退出程序
     * 
     * @param {string} message - 日志消息
     * @param {LogData} [data] - 可选的附加数据
     * @description Fatal 级别会记录日志后立即退出程序（Deno.exit(1)）
     */
    fatal(message: string, data?: LogData) {
        this.log(LogLevel.FATAL, message, data);
        Deno.exit(1); // Fatal 级别直接退出
    }

    /**
     * HTTP 请求日志（专用格式）
     * 
     * @param {string} method - HTTP 方法（GET, POST 等）
     * @param {string} path - 请求路径
     * @param {number} status - HTTP 状态码
     * @param {number} duration - 请求处理时长（毫秒）
     */
    http(method: string, path: string, status: number, duration: number) {
        this.log(LogLevel.INFO, `HTTP ${method} ${path}`, {
            status,
            duration: `${duration}ms`,
        });
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
        const originalLog = childLogger.log.bind(childLogger);

        // 重写 log 方法，自动附加上下文
        childLogger.log = (level: LogLevel, message: string, data?: LogData) => {
            originalLog(level, message, { ...context, ...data });
        };

        return childLogger;
    }

    /**
     * 设置日志级别
     * 
     * @param {LogLevel} level - 新的日志级别
     */
    setLevel(level: LogLevel) {
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
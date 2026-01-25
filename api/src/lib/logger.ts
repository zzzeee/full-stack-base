/**
 * @file logger.ts
 * @description 轻量级日志工具模块，提供易读的格式化输出、彩色终端支持、结构化日志和日志级别控制
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
 * @property {'pretty' | 'json'} format - 日志格式，pretty 为人类可读格式，json 为机器解析格式
 * @property {boolean} timestamp - 是否显示时间戳
 * @property {boolean} colorize - 是否启用颜色输出
 * @property {string | null} logFile - 日志文件路径，null 表示不写入文件
 */
interface LoggerConfig {
    level: LogLevel;
    format: 'pretty' | 'json'; // pretty: 人类可读，json: 机器解析
    timestamp: boolean;
    colorize: boolean;
    logFile: string | null; // 日志文件路径
}

// ==================== 颜色工具 ====================

/**
 * ANSI 颜色代码映射
 * 
 * @constant
 * @description 用于终端输出的颜色控制代码
 */
const colors = {
    /** 重置所有样式 */
    reset: '\x1b[0m',
    /** 加粗文本 */
    bright: '\x1b[1m',
    /** 暗淡文本 */
    dim: '\x1b[2m',

    // 前景色
    /** 黑色 */
    black: '\x1b[30m',
    /** 红色 */
    red: '\x1b[31m',
    /** 绿色 */
    green: '\x1b[32m',
    /** 黄色 */
    yellow: '\x1b[33m',
    /** 蓝色 */
    blue: '\x1b[34m',
    /** 洋红色 */
    magenta: '\x1b[35m',
    /** 青色 */
    cyan: '\x1b[36m',
    /** 白色 */
    white: '\x1b[37m',
    /** 灰色 */
    gray: '\x1b[90m',

    // 背景色
    /** 红色背景 */
    bgRed: '\x1b[41m',
    /** 黄色背景 */
    bgYellow: '\x1b[43m',
    /** 蓝色背景 */
    bgBlue: '\x1b[44m',
};

/**
 * 为文本添加颜色
 * 
 * @param {string} text - 要着色的文本
 * @param {keyof typeof colors} color - 颜色名称
 * @returns {string} 带颜色代码的文本
 */
function colorize(text: string, color: keyof typeof colors): string {
    return `${colors[color]}${text}${colors.reset}`;
}

// ==================== 日志级别配置 ====================

/**
 * 日志级别显示配置
 * 
 * @constant
 * @description 定义每个日志级别的显示标签、颜色和图标
 */
const levelConfig = {
    [LogLevel.DEBUG]: {
        label: 'DEBUG',
        color: 'gray' as const,
        icon: '🔍',
    },
    [LogLevel.INFO]: {
        label: 'INFO ',
        color: 'blue' as const,
        icon: 'ℹ️ ',
    },
    [LogLevel.WARN]: {
        label: 'WARN ',
        color: 'yellow' as const,
        icon: '⚠️ ',
    },
    [LogLevel.ERROR]: {
        label: 'ERROR',
        color: 'red' as const,
        icon: '❌',
    },
    [LogLevel.FATAL]: {
        label: 'FATAL',
        color: 'bgRed' as const,
        icon: '💀',
    },
};

// ==================== 格式化工具 ====================

/**
 * 格式化时间戳
 * 
 * @returns {string} 格式化的时间戳字符串（YYYY-MM-DD HH:mm:ss）
 */
function formatTimestamp(): string {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];
    return `${date} ${time}`;
}

/**
 * 格式化数据对象（易读格式）
 * 
 * @param {LogData} data - 要格式化的日志数据对象
 * @returns {string} 格式化后的数据字符串
 */
function formatData(data: LogData): string {
    const entries = Object.entries(data);

    if (entries.length === 0) return '';

    // 单行格式化（简洁）
    const formatted = entries
        .map(([key, value]) => {
            let valueStr: string;

            // 特殊处理不同类型
            if (value === null) {
                valueStr = 'null';
            } else if (value === undefined) {
                valueStr = 'undefined';
            } else if (typeof value === 'string') {
                valueStr = `"${value}"`;
            } else if (typeof value === 'object') {
                // 对象简化显示
                try {
                    const json = JSON.stringify(value);
                    // 如果太长，截断
                    valueStr = json.length > 2000
                        ? `${json.substring(0, 2000)}...`
                        : json;
                } catch {
                    valueStr = '[Object]';
                }
            } else {
                valueStr = String(value);
            }

            return `${colorize(key, 'cyan')}=${valueStr}`;
        })
        .join(' ');

    return ` ${colorize('│', 'dim')} ${formatted}`;
}

/**
 * 格式化堆栈信息
 * 
 * @param {string} [stack] - 错误堆栈字符串
 * @returns {string} 格式化后的堆栈信息
 */
function formatStack(stack?: string): string {
    if (!stack) return '';

    const lines = stack.split('\n');
    // 只显示前 5 行堆栈
    const relevant = lines.slice(0, 5).map(line =>
        `  ${colorize('│', 'dim')} ${colorize(line.trim(), 'gray')}`
    );

    return '\n' + relevant.join('\n');
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

    /**
     * 创建 Logger 实例
     * 
     * @param {Partial<LoggerConfig>} [config] - 可选的配置覆盖
     * @description 从环境变量读取默认配置，可通过参数覆盖
     */
    constructor(config?: Partial<LoggerConfig>) {
        // 从环境变量读取配置
        const envLevel = Deno.env.get('LOG_LEVEL')?.toUpperCase() as keyof typeof LogLevel | undefined;
        const envFormat = Deno.env.get('LOG_FORMAT') as 'pretty' | 'json' | undefined;
        const envLogFile = Deno.env.get('LOG_FILE') || null;

        this.config = {
            level: envLevel ? LogLevel[envLevel] : LogLevel.INFO,
            format: envFormat || 'pretty',
            timestamp: true,
            colorize: true,
            logFile: envLogFile,
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
     * @description 根据配置格式化并输出日志，支持 pretty 和 json 两种格式
     */
    private log(level: LogLevel, message: string, data?: LogData) {
        // 级别过滤
        if (level < this.config.level) return;

        const levelInfo = levelConfig[level];

        // JSON 格式（机器解析）
        if (this.config.format === 'json') {
            const logEntry = {
                timestamp: new Date().toISOString(),
                level: levelInfo.label.trim(),
                message,
                ...data,
            };
            const logLine = JSON.stringify(logEntry);
            console.log(logLine);
            // 异步写入文件，不阻塞
            this.writeToFile(logLine).catch(err => {
                console.error('Failed to write log to file:', err);
            });
            return;
        }

        // Pretty 格式（人类可读）
        const parts: string[] = [];

        // 1. 时间戳
        if (this.config.timestamp) {
            parts.push(colorize(formatTimestamp(), 'dim'));
        }

        // 2. 级别标签（带图标和颜色）
        const levelLabel = this.config.colorize
            ? `${levelInfo.icon} ${colorize(levelInfo.label, levelInfo.color)}`
            : `[${levelInfo.label}]`;
        parts.push(levelLabel);

        // 3. 消息（加粗）
        const formattedMessage = this.config.colorize
            ? colorize(message, 'bright')
            : message;
        parts.push(formattedMessage);

        // 输出主要信息
        const mainLine = parts.join(' ');
        console.log(mainLine);
        // 异步写入文件，不阻塞
        this.writeToFile(mainLine).catch(err => {
            console.error('Failed to write log to file:', err);
        });

        // 4. 附加数据（下一行缩进）
        if (data && Object.keys(data).length > 0) {
            const dataLine = formatData(data);
            console.log(dataLine);
            // 异步写入文件，不阻塞
            this.writeToFile(dataLine).catch(err => {
                console.error('Failed to write log to file:', err);
            });
        }

        // 5. 堆栈信息（如果有）
        if (data?.stack && typeof data.stack === 'string') {
            const stackLine = formatStack(data.stack);
            console.log(stackLine);
            // 异步写入文件，不阻塞
            this.writeToFile(stackLine).catch(err => {
                console.error('Failed to write log to file:', err);
            });
        }
    }

    // ==================== 公开方法 ====================

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
        const statusColor = status >= 500 ? 'red'
            : status >= 400 ? 'yellow'
                : status >= 300 ? 'cyan'
                    : 'green';

        const parts = [
            colorize(method.padEnd(6), 'bright'),
            path,
            colorize(status.toString(), statusColor),
            colorize(`${duration}ms`, 'dim'),
        ];

        this.log(LogLevel.INFO, parts.join(' '));
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

    /**
     * 设置日志格式
     * 
     * @param {'pretty' | 'json'} format - 日志格式，pretty 为人类可读，json 为机器解析
     */
    setFormat(format: 'pretty' | 'json') {
        this.config.format = format;
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
// src/lib/logger.ts
/**
 * 轻量级日志工具
 * 特点：
 * 1. 易读的格式化输出
 * 2. 彩色终端支持
 * 3. 结构化日志（可选 JSON）
 * 4. 日志级别控制
 */

// ==================== 类型定义 ====================

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    FATAL = 4,
}

type LogData = Record<string, unknown>;

interface LoggerConfig {
    level: LogLevel;
    format: 'pretty' | 'json'; // pretty: 人类可读，json: 机器解析
    timestamp: boolean;
    colorize: boolean;
}

// ==================== 颜色工具 ====================

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',

    // 前景色
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',

    // 背景色
    bgRed: '\x1b[41m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
};

function colorize(text: string, color: keyof typeof colors): string {
    return `${colors[color]}${text}${colors.reset}`;
}

// ==================== 日志级别配置 ====================

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
 */
function formatTimestamp(): string {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];
    return `${date} ${time}`;
}

/**
 * 格式化数据对象（易读格式）
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
                    valueStr = json.length > 100
                        ? `${json.substring(0, 100)}...`
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

class Logger {
    private config: LoggerConfig;

    constructor(config?: Partial<LoggerConfig>) {
        // 从环境变量读取配置
        const envLevel = Deno.env.get('LOG_LEVEL')?.toUpperCase() as keyof typeof LogLevel | undefined;
        const envFormat = Deno.env.get('LOG_FORMAT') as 'pretty' | 'json' | undefined;

        this.config = {
            level: envLevel ? LogLevel[envLevel] : LogLevel.INFO,
            format: envFormat || 'pretty',
            timestamp: true,
            colorize: true,
            ...config,
        };
    }

    /**
     * 核心日志方法
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
            console.log(JSON.stringify(logEntry));
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
        console.log(parts.join(' '));

        // 4. 附加数据（下一行缩进）
        if (data && Object.keys(data).length > 0) {
            console.log(formatData(data));
        }

        // 5. 堆栈信息（如果有）
        if (data?.stack && typeof data.stack === 'string') {
            console.log(formatStack(data.stack));
        }
    }

    // ==================== 公开方法 ====================

    debug(message: string, data?: LogData) {
        this.log(LogLevel.DEBUG, message, data);
    }

    info(message: string, data?: LogData) {
        this.log(LogLevel.INFO, message, data);
    }

    warn(message: string, data?: LogData) {
        this.log(LogLevel.WARN, message, data);
    }

    error(message: string, data?: LogData) {
        this.log(LogLevel.ERROR, message, data);
    }

    fatal(message: string, data?: LogData) {
        this.log(LogLevel.FATAL, message, data);
        Deno.exit(1); // Fatal 级别直接退出
    }

    /**
     * HTTP 请求日志（专用格式）
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
     */
    setLevel(level: LogLevel) {
        this.config.level = level;
    }

    /**
     * 设置日志格式
     */
    setFormat(format: 'pretty' | 'json') {
        this.config.format = format;
    }
}

// ==================== 导出单例 ====================

export const logger = new Logger();

export default logger;
// src/lib/logger.ts
import { ensureDir } from '@std/fs'
import { join } from '@std/path'

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

export interface LogEntry {
    timestamp: string
    level: LogLevel
    message: string
    context?: Record<string, unknown>
    ip?: string
    userId?: string
    path?: string
    error?: Error
}

export class Logger {
    private logDir: string
    private logToConsole: boolean

    constructor(options: { logDir?: string; console?: boolean } = {}) {
        this.logDir = options.logDir || join(Deno.cwd(), 'logs')
        this.logToConsole = options.console ?? true
    }

    private async ensureLogDir() {
        await ensureDir(this.logDir)
    }

    private getLogFilePath(date: Date = new Date()): string {
        const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
        return join(this.logDir, `app-${dateStr}.log`)
    }

    private formatLogEntry(entry: LogEntry): string {
        return JSON.stringify({
            ...entry,
            // 如果有错误对象，提取关键信息
            error: entry.error ? {
                name: entry.error.name,
                message: entry.error.message,
                stack: entry.error.stack?.split('\n').slice(0, 5) // 只保留前5行
            } : undefined
        })
    }

    private async writeToFile(entry: LogEntry) {
        try {
            await this.ensureLogDir()
            const logFile = this.getLogFilePath()
            const logEntry = this.formatLogEntry(entry) + '\n'

            await Deno.writeTextFile(logFile, logEntry, { append: true })
        } catch (error) {
            // 如果文件写入失败，至少输出到控制台
            console.error('日志文件写入失败:', error)
            if (this.logToConsole) {
                console.log(this.formatLogEntry(entry))
            }
        }
    }

    private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context
        }

        // 写入文件
        this.writeToFile(entry)

        // 输出到控制台
        if (this.logToConsole) {
            const color = this.getColorForLevel(level)
            console.log(
                `%c[${level}]%c ${new Date().toLocaleString()} - ${message}`,
                `color: ${color}; font-weight: bold`,
                'color: inherit'
            )
            if (context) {
                console.log('Context:', context)
            }
        }
    }

    private getColorForLevel(level: LogLevel): string {
        switch (level) {
            case LogLevel.ERROR: return '#ff4444'
            case LogLevel.WARN: return '#ffaa00'
            case LogLevel.INFO: return '#44ff44'
            case LogLevel.DEBUG: return '#8888ff'
            default: return '#ffffff'
        }
    }

    // 公共方法
    debug(message: string, context?: Record<string, unknown>) {
        this.log(LogLevel.DEBUG, message, context)
    }

    info(message: string, context?: Record<string, unknown>) {
        this.log(LogLevel.INFO, message, context)
    }

    warn(message: string, context?: Record<string, unknown>) {
        this.log(LogLevel.WARN, message, context)
    }

    error(message: string, error?: Error, context?: Record<string, unknown>) {
        this.log(LogLevel.ERROR, message, { ...context, error })
    }

    // API 请求专用日志
    apiRequest(request: {
        method: string
        path: string
        ip: string
        userId?: string
        duration?: number
        status?: number
    }) {
        this.info('API Request', request)
    }

    // API 错误专用日志
    apiError(error: Error, request: {
        method: string
        path: string
        ip: string
        userId?: string
    }) {
        this.error('API Error', error, request)
    }
}

// 创建全局日志实例
export const logger = new Logger({
    logDir: join(Deno.cwd(), 'logs'),
    console: Deno.env.get('NODE_ENV') !== 'production'
})
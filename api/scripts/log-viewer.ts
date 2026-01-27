#!/usr/bin/env -S deno run --allow-read

/**
 * 交互式日志查询脚本
 * 使用方法：deno run --allow-read log-viewer.ts
 */

import { resolve, join } from "jsr:@std/path@^1.0.8";
import { existsSync } from "jsr:@std/fs@^1.0.0";

// ============================================
// 类型定义
// ============================================

interface LogEntry {
    timestamp: string;
    level: string;
    requestId: string;
    message: string;
    userId?: string;
    ip?: string;
    error?: {
        type: string;
        code: string;
        stack: string;
    };
    context?: Record<string, unknown>;
}

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "RESPONSE_FAIL";

interface QueryConfig {
    basePath: string;
    levels: LogLevel[];
    target: "all" | "requestId" | "userId";
    targetValue?: string;
    dateRange: "all" | "today" | number; // number 表示最近 N 天
    limit: "all" | number;
}

// ============================================
// 颜色工具
// ============================================

const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
};

function colorize(text: string, color: keyof typeof colors): string {
    return `${colors[color]}${text}${colors.reset}`;
}

// ============================================
// 输入工具
// ============================================

function prompt(message: string): string {
    console.log(colorize(message, "cyan"));
    const buf = new Uint8Array(1024);
    const n = Deno.stdin.readSync(buf);
    return new TextDecoder().decode(buf.subarray(0, n!)).trim();
}

function printHeader(title: string) {
    console.clear();
    console.log(colorize("═".repeat(70), "cyan"));
    console.log(colorize(`  ${title}`, "bright"));
    console.log(colorize("═".repeat(70), "cyan"));
    console.log();
}

// ============================================
// 交互式选择
// ============================================

async function selectBasePath(): Promise<string | null> {
    printHeader("步骤 1/5: 确认日志路径");

    console.log("请选择日志路径：");
    console.log("  1. 默认路径 (../logs)");
    console.log("  2. 输入自定义路径");
    console.log("  3. 退出");
    console.log();

    const choice = prompt("请输入选项 (1/2/3): ");

    if (choice === "1") {
        const defaultPath = resolve(Deno.cwd(), "../logs");
        console.log(colorize(`\n使用默认路径: ${defaultPath}`, "green"));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return defaultPath;
    } else if (choice === "2") {
        const customPath = prompt("\n请输入日志路径: ");
        const absolutePath = resolve(customPath);

        if (!existsSync(absolutePath)) {
            console.log(colorize(`\n❌ 路径不存在: ${absolutePath}`, "red"));
            await new Promise((resolve) => setTimeout(resolve, 2000));
            return selectBasePath();
        }

        console.log(colorize(`\n使用自定义路径: ${absolutePath}`, "green"));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return absolutePath;
    } else if (choice === "3") {
        return null;
    } else {
        console.log(colorize("\n❌ 无效的选项，请重新选择", "red"));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return selectBasePath();
    }
}

async function selectLevels(): Promise<LogLevel[] | null> {
    printHeader("步骤 2/5: 选择日志级别");

    const allLevels: LogLevel[] = ["DEBUG", "INFO", "WARN", "ERROR", "RESPONSE_FAIL"];

    console.log("可选的日志级别：");
    allLevels.forEach((level, index) => {
        console.log(`  ${index + 1}. ${level}`);
    });
    console.log();
    console.log("选项：");
    console.log("  1. 全部级别");
    console.log("  2. 自定义选择（输入序号，用空格或逗号分隔）");
    console.log("  3. 退出");
    console.log();

    const choice = prompt("请输入选项 (1/2/3): ");

    if (choice === "1") {
        console.log(colorize("\n✓ 已选择: 全部级别", "green"));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return allLevels;
    } else if (choice === "2") {
        const input = prompt("\n请输入序号（例如: 1,2,5 或 1 2 5）: ");
        const indices = input
            .split(/[,\s]+/)
            .map((s) => parseInt(s.trim()))
            .filter((n) => !isNaN(n) && n >= 1 && n <= allLevels.length);

        if (indices.length === 0) {
            console.log(colorize("\n❌ 无效的输入，请重新选择", "red"));
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return selectLevels();
        }

        const selectedLevels = indices.map((i) => allLevels[i - 1]);
        console.log(colorize(`\n✓ 已选择: ${selectedLevels.join(", ")}`, "green"));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return selectedLevels;
    } else if (choice === "3") {
        return null;
    } else {
        console.log(colorize("\n❌ 无效的选项，请重新选择", "red"));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return selectLevels();
    }
}

async function selectTarget(): Promise<
    { type: "all" } | { type: "requestId"; value: string } | { type: "userId"; value: string } | null
> {
    printHeader("步骤 3/5: 选择查询目标");

    console.log("请选择查询目标：");
    console.log("  1. 全部日志");
    console.log("  2. 指定 requestId");
    console.log("  3. 指定 userId");
    console.log("  4. 退出");
    console.log();

    const choice = prompt("请输入选项 (1/2/3/4): ");

    if (choice === "1") {
        console.log(colorize("\n✓ 已选择: 全部日志", "green"));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { type: "all" };
    } else if (choice === "2") {
        const requestId = prompt("\n请输入 requestId: ");
        if (!requestId) {
            console.log(colorize("\n❌ requestId 不能为空", "red"));
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return selectTarget();
        }
        console.log(colorize(`\n✓ 查询 requestId: ${requestId}`, "green"));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { type: "requestId", value: requestId };
    } else if (choice === "3") {
        const userId = prompt("\n请输入 userId: ");
        if (!userId) {
            console.log(colorize("\n❌ userId 不能为空", "red"));
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return selectTarget();
        }
        console.log(colorize(`\n✓ 查询 userId: ${userId}`, "green"));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { type: "userId", value: userId };
    } else if (choice === "4") {
        return null;
    } else {
        console.log(colorize("\n❌ 无效的选项，请重新选择", "red"));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return selectTarget();
    }
}

async function selectDateRange(): Promise<"all" | "today" | number | null> {
    printHeader("步骤 4/5: 选择日期范围");

    console.log("请选择日期范围：");
    console.log("  1. 全部日期");
    console.log("  2. 今天");
    console.log("  3. 最近 N 天");
    console.log("  4. 退出");
    console.log();

    const choice = prompt("请输入选项 (1/2/3/4): ");

    if (choice === "1") {
        console.log(colorize("\n✓ 已选择: 全部日期", "green"));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return "all";
    } else if (choice === "2") {
        console.log(colorize("\n✓ 已选择: 今天", "green"));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return "today";
    } else if (choice === "3") {
        const daysInput = prompt("\n请输入天数（例如: 7）: ");
        const days = parseInt(daysInput);
        if (isNaN(days) || days <= 0) {
            console.log(colorize("\n❌ 无效的天数，请重新输入", "red"));
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return selectDateRange();
        }
        console.log(colorize(`\n✓ 已选择: 最近 ${days} 天`, "green"));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return days;
    } else if (choice === "4") {
        return null;
    } else {
        console.log(colorize("\n❌ 无效的选项，请重新选择", "red"));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return selectDateRange();
    }
}

async function selectLimit(): Promise<"all" | number | null> {
    printHeader("步骤 5/5: 选择显示数量");

    console.log("请选择显示数量：");
    console.log("  1. 全部");
    console.log("  2. 最近 1 条");
    console.log("  3. 最近 10 条");
    console.log("  4. 自定义条数");
    console.log("  5. 退出");
    console.log();

    const choice = prompt("请输入选项 (1/2/3/4/5): ");

    if (choice === "1") {
        console.log(colorize("\n✓ 已选择: 全部", "green"));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return "all";
    } else if (choice === "2") {
        console.log(colorize("\n✓ 已选择: 最近 1 条", "green"));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return 1;
    } else if (choice === "3") {
        console.log(colorize("\n✓ 已选择: 最近 10 条", "green"));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return 10;
    } else if (choice === "4") {
        const countInput = prompt("\n请输入条数: ");
        const count = parseInt(countInput);
        if (isNaN(count) || count <= 0) {
            console.log(colorize("\n❌ 无效的条数，请重新输入", "red"));
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return selectLimit();
        }
        console.log(colorize(`\n✓ 已选择: 最近 ${count} 条`, "green"));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return count;
    } else if (choice === "5") {
        return null;
    } else {
        console.log(colorize("\n❌ 无效的选项，请重新选择", "red"));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return selectLimit();
    }
}

// ============================================
// 日志读取
// ============================================

function getDateList(dateRange: "all" | "today" | number): string[] {
    const dates: string[] = [];
    const today = new Date();

    if (dateRange === "today") {
        dates.push(formatDate(today));
    } else if (typeof dateRange === "number") {
        for (let i = 0; i < dateRange; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(formatDate(date));
        }
    }
    // "all" 返回空数组，后续会读取目录下所有文件

    return dates;
}

function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

async function readLogsFromLevel(
    basePath: string,
    level: LogLevel,
    dates: string[]
): Promise<LogEntry[]> {
    const levelPath = join(basePath, level.toLowerCase());
    const logs: LogEntry[] = [];

    if (!existsSync(levelPath)) {
        return logs;
    }

    // 如果 dates 为空（all），读取目录下所有 .log 文件
    let filesToRead: string[] = [];

    if (dates.length === 0) {
        for await (const entry of Deno.readDir(levelPath)) {
            if (entry.isFile && entry.name.endsWith(".log")) {
                filesToRead.push(entry.name);
            }
        }
    } else {
        filesToRead = dates.map((date) => `${date}.log`);
    }

    // 读取每个文件
    for (const fileName of filesToRead) {
        const filePath = join(levelPath, fileName);

        if (!existsSync(filePath)) {
            continue;
        }

        try {
            const content = await Deno.readTextFile(filePath);

            for (const line of content.split("\n")) {
                if (!line.trim()) continue;

                try {
                    const log = JSON.parse(line) as LogEntry;
                    logs.push(log);
                } catch {
                    // 跳过无效的 JSON 行
                }
            }
        } catch (error) {
            console.error(colorize(`读取文件失败: ${filePath}`, "red"), error);
        }
    }

    return logs;
}

async function readAllLogs(basePath: string, levels: LogLevel[], dates: string[]): Promise<LogEntry[]> {
    const allLogs: LogEntry[] = [];

    for (const level of levels) {
        const logs = await readLogsFromLevel(basePath, level, dates);
        allLogs.push(...logs);
    }

    // 按时间排序
    allLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return allLogs;
}

// ============================================
// 日志过滤
// ============================================

function filterLogs(logs: LogEntry[], target: QueryConfig["target"], targetValue?: string): LogEntry[] {
    if (target === "all") {
        return logs;
    }

    return logs.filter((log) => {
        if (target === "requestId") {
            return log.requestId === targetValue;
        } else if (target === "userId") {
            return log.userId === targetValue;
        }
        return false;
    });
}

function limitLogs(logs: LogEntry[], limit: "all" | number): LogEntry[] {
    if (limit === "all") {
        return logs;
    }
    return logs.slice(-limit);
}

// ============================================
// 日志显示
// ============================================

function formatLevel(level: string): string {
    const levelColors: Record<string, keyof typeof colors> = {
        DEBUG: "gray",
        INFO: "green",
        WARN: "yellow",
        ERROR: "red",
        RESPONSE_FAIL: "red",
    };
    const color = levelColors[level] || "white";
    return colorize(`[${level}]`, color);
}

function printLog(log: LogEntry, index: number) {
    const separator = "─".repeat(70);

    console.log();
    console.log(colorize(`[${index + 1}]`, "bright"));
    console.log(colorize(separator, "gray"));

    // 第一行
    console.log(
        `${colorize(log.timestamp, "gray")} ${formatLevel(log.level)} ${colorize(`[${log.requestId}]`, "magenta")}`
    );

    // 消息
    console.log(colorize(`Message: ${log.message}`, "bright"));

    // 用户信息
    if (log.userId || log.ip) {
        console.log();
        if (log.userId) {
            console.log(`  User: ${colorize(log.userId, "blue")}`);
        }
        if (log.ip) {
            console.log(`  IP: ${log.ip}`);
        }
    }

    // 错误信息
    if (log.error) {
        console.log();
        console.log(colorize(`  ❌ ${log.error.type}: ${log.error.code}`, "red"));
        if (log.error.stack) {
            console.log(colorize("\n  Stack Trace:", "dim"));
            const stackLines = log.error.stack.split("\n").slice(0, 5);
            stackLines.forEach((line: string) => {
                console.log(colorize(`    ${line}`, "dim"));
            });
        }
    }

    // 上下文
    if (log.context && Object.keys(log.context).length > 0) {
        console.log();
        console.log(colorize("  Context:", "dim"));
        Object.entries(log.context).forEach(([key, value]) => {
            console.log(`    ${key}: ${JSON.stringify(value)}`);
        });
    }

    console.log(colorize(separator, "gray"));
}

function printSummary(logs: LogEntry[], displayCount: number) {
    console.log();
    console.log(colorize("═".repeat(70), "cyan"));
    console.log(colorize("📈 统计信息", "bright"));
    console.log(colorize("═".repeat(70), "cyan"));

    console.log(colorize(`\n总共找到: ${logs.length} 条日志`, "green"));
    console.log(colorize(`显示: ${displayCount} 条`, "green"));

    const stats = {
        byLevel: {} as Record<string, number>,
    };

    logs.forEach((log) => {
        stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
    });

    console.log("\n按级别:");
    Object.entries(stats.byLevel).forEach(([level, count]) => {
        const color =
            level === "ERROR" || level === "RESPONSE_FAIL" ? "red" : level === "WARN" ? "yellow" : "green";
        console.log(`  ${colorize(level, color)}: ${count}`);
    });

    console.log();
}

// ============================================
// 主程序
// ============================================

async function main() {
    try {
        // 步骤 1: 选择路径
        const basePath = await selectBasePath();
        if (!basePath) {
            console.log(colorize("\n👋 已退出", "yellow"));
            return;
        }

        // 步骤 2: 选择级别
        const levels = await selectLevels();
        if (!levels) {
            console.log(colorize("\n👋 已退出", "yellow"));
            return;
        }

        // 步骤 3: 选择目标
        const target = await selectTarget();
        if (!target) {
            console.log(colorize("\n👋 已退出", "yellow"));
            return;
        }

        // 步骤 4: 选择日期
        const dateRange = await selectDateRange();
        if (!dateRange) {
            console.log(colorize("\n👋 已退出", "yellow"));
            return;
        }

        // 步骤 5: 选择数量
        const limit = await selectLimit();
        if (!limit) {
            console.log(colorize("\n👋 已退出", "yellow"));
            return;
        }

        // 读取日志
        printHeader("正在加载日志...");
        const dates = getDateList(dateRange);
        const allLogs = await readAllLogs(basePath, levels, dates);

        if (allLogs.length === 0) {
            console.log(colorize("\n❌ 没有找到任何日志", "red"));
            return;
        }

        // 过滤日志
        const filteredLogs = filterLogs(
            allLogs,
            target.type as QueryConfig["target"],
            target.type !== "all" ? target.value : undefined
        );

        if (filteredLogs.length === 0) {
            console.log(colorize("\n❌ 没有找到匹配的日志", "red"));
            return;
        }

        // 限制数量
        const displayLogs = limitLogs(filteredLogs, limit);

        // 显示结果
        printHeader("查询结果");

        displayLogs.forEach((log, index) => {
            printLog(log, index);
        });

        printSummary(filteredLogs, displayLogs.length);
    } catch (error) {
        const err = error as Error;
        console.error(colorize(`\n❌ 错误: ${err.message}`, "red"));
        console.error(err);
    }
}

// 运行主程序
if (import.meta.main) {
    main();
}
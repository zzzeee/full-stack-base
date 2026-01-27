#!/usr/bin/env bash

# ============================================================
# 日志监控脚本（终端交互版 · 优化增强版）
# 特性：
# - 稳定的非阻塞键盘交互
# - 分页 / 跳页 / 详情查看 / 多条件过滤
# - 紧凑美观的 UI 设计
# ============================================================

set -u

# -------------------- 默认配置 --------------------
LOG_DIR="../logs"
START_TIME=$(date +"%Y-%m-%d 00:00:00")
END_TIME=$(date +"%Y-%m-%d 23:59:59")
SUBDIRS=""
USE_COLOR=true
WATCH_MODE=true
PAGE_SIZE=20

# -------------------- 过滤条件 --------------------
FILTER_TIME=""
FILTER_REQUEST_ID=""
FILTER_USER_ID=""

# -------------------- 全局状态 --------------------
CURRENT_PAGE=1
TOTAL_PAGES=1
TOTAL_LOGS=0
ALL_LOGS_FILE=""

# -------------------- 终端判断 --------------------
IS_TERMINAL=false
[ -t 1 ] && IS_TERMINAL=true || USE_COLOR=false

# -------------------- 颜色定义 --------------------
if [ "$USE_COLOR" = true ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  BLUE='\033[0;34m'
  MAGENTA='\033[0;35m'
  CYAN='\033[0;36m'
  GRAY='\033[0;90m'
  BOLD='\033[1m'
  RESET='\033[0m'
else
  RED='' GREEN='' YELLOW='' BLUE='' MAGENTA='' CYAN='' GRAY='' BOLD='' RESET=''
fi

# ============================================================
# 参数解析函数
# ============================================================

show_help() {
    cat << EOF
${BOLD}日志监控脚本（带翻页、过滤和详情查看功能）${RESET}

${BOLD}用法:${RESET}
  $0 [选项]

${BOLD}选项:${RESET}
  ${GREEN}-d, --dir=DIR${RESET}        日志目录 (默认: ../logs)
  ${GREEN}-s, --start=TIME${RESET}     起始时间 (默认: 当天 00:00:00)
  ${GREEN}-e, --end=TIME${RESET}       结束时间 (默认: 当天 23:59:59)
  ${GREEN}--subdirs=DIRS${RESET}       子目录，逗号分隔 (默认: 全部)
  ${GREEN}-c, --color${RESET}          使用彩色输出 (默认)
  ${GREEN}--no-color${RESET}           不使用彩色输出
  ${GREEN}-w, --watch${RESET}          监听模式，按 f 刷新 (默认)
  ${GREEN}--no-watch${RESET}           一次性显示后退出
  ${GREEN}-h, --help${RESET}           显示此帮助信息

${BOLD}操作说明（监听模式下）:${RESET}
  ${CYAN}←/a${RESET} 上页      ${CYAN}→/d${RESET} 下页      ${CYAN}p${RESET} 跳页      ${CYAN}s${RESET} 详情
  ${CYAN}t${RESET} 时间过滤    ${CYAN}r${RESET} ReqID过滤  ${CYAN}u${RESET} User过滤  ${CYAN}c${RESET} 清除过滤
  ${CYAN}f${RESET} 刷新       ${CYAN}q${RESET} 退出

${BOLD}示例:${RESET}
  $0 --dir=/var/logs
  $0 -d ./logs --subdirs=error,warn --no-watch
  $0 --start="2026-01-27 10:00:00" --end="2026-01-27 12:00:00"

EOF
    exit 0
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--dir)
                LOG_DIR="$2"
                shift 2
                ;;
            --dir=*)
                LOG_DIR="${1#*=}"
                shift
                ;;
            -s|--start)
                START_TIME="$2"
                shift 2
                ;;
            --start=*)
                START_TIME="${1#*=}"
                shift
                ;;
            -e|--end)
                END_TIME="$2"
                shift 2
                ;;
            --end=*)
                END_TIME="${1#*=}"
                shift
                ;;
            --subdirs)
                SUBDIRS="$2"
                shift 2
                ;;
            --subdirs=*)
                SUBDIRS="${1#*=}"
                shift
                ;;
            -c|--color)
                USE_COLOR=true
                shift
                ;;
            --no-color)
                USE_COLOR=false
                shift
                ;;
            -w|--watch)
                WATCH_MODE=true
                shift
                ;;
            --no-watch)
                WATCH_MODE=false
                shift
                ;;
            -h|--help)
                show_help
                ;;
            *)
                echo -e "${RED}未知参数: $1${RESET}"
                echo "使用 --help 查看帮助"
                exit 1
                ;;
        esac
    done
}

# ============================================================
# 工具函数
# ============================================================

check_dependencies() {
    command -v jq >/dev/null 2>&1 || {
        echo -e "${RED}错误: 需要安装 jq 工具${RESET}"
        echo "安装方法:"
        echo "  macOS: brew install jq"
        echo "  Linux: sudo apt-get install jq 或 sudo yum install jq"
        exit 1
    }
}

safe_clear() {
    [ "$IS_TERMINAL" = true ] && [ "$WATCH_MODE" = true ] && clear
}

# 获取绝对路径
get_absolute_path() {
    local path="$1"
    if [[ "$path" == /* ]]; then
        echo "$path"
    else
        echo "$(cd "$(dirname "$path")" && pwd)/$(basename "$path")"
    fi
}

# 获取级别颜色
get_level_color() {
    local level="$1"
    case "$level" in
        "ERROR"|"RESPONSE_FAIL") echo -n "$RED" ;;
        "WARN") echo -n "$YELLOW" ;;
        "INFO") echo -n "$GREEN" ;;
        "DEBUG") echo -n "$GRAY" ;;
        *) echo -n "$RESET" ;;
    esac
}

# 读取并处理日志（倒序排列）
read_logs() {
    local tmp=$(mktemp)
    local files=()
    
    # 获取绝对路径
    LOG_DIR_ABS=$(get_absolute_path "$LOG_DIR")

    # 构建搜索文件列表
    if [ -n "$SUBDIRS" ]; then
        IFS=',' read -ra ds <<< "$SUBDIRS"
        for d in "${ds[@]}"; do
            d=$(echo "$d" | xargs)  # 去除空格
            if [ -d "$LOG_DIR_ABS/$d" ]; then
                files+=("$LOG_DIR_ABS/$d")
            fi
        done
        [ ${#files[@]} -eq 0 ] && { echo "[]" > "$tmp"; echo "$tmp"; return; }
    else
        files+=("$LOG_DIR_ABS")
    fi

    # 查找并读取所有日志文件
    find "${files[@]}" -type f -name "*.log" 2>/dev/null | while read -r f; do
        while IFS= read -r line; do
            # 检查是否为有效 JSON
            if ! echo "$line" | jq -e '.timestamp and .requestId' >/dev/null 2>&1; then
                continue
            fi
            
            # 时间过滤
            local ts=$(echo "$line" | jq -r '.timestamp' | cut -c1-19)
            local t=$(date -d "$ts" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%S" "$ts" +%s 2>/dev/null)
            
            # 基本时间范围过滤
            if [ "$t" -ge "$START_TS" ] && [ "$t" -le "$END_TS" ]; then
                # 额外过滤条件
                local include=true
                
                if [ -n "$FILTER_TIME" ]; then
                    echo "$line" | jq -r '.timestamp' | grep -iq "$FILTER_TIME" || include=false
                fi
                
                if [ "$include" = true ] && [ -n "$FILTER_REQUEST_ID" ]; then
                    echo "$line" | jq -r '.requestId' | grep -iq "$FILTER_REQUEST_ID" || include=false
                fi
                
                if [ "$include" = true ] && [ -n "$FILTER_USER_ID" ]; then
                    local user_id=$(echo "$line" | jq -r '.userId // ""')
                    if [ -n "$user_id" ]; then
                        echo "$user_id" | grep -iq "$FILTER_USER_ID" || include=false
                    else
                        include=false
                    fi
                fi
                
                [ "$include" = true ] && echo "$line" >> "$tmp"
            fi
        done < "$f"
    done

    # 按时间倒序排序（最新的在前面）
    if [ -s "$tmp" ]; then
        local tmp_sorted=$(mktemp)
        jq -s 'sort_by(.timestamp) | reverse' "$tmp" > "$tmp_sorted"
        mv "$tmp_sorted" "$tmp"
    else
        echo "[]" > "$tmp"
    fi
    
    echo "$tmp"
}

# ============================================================
# 显示函数
# ============================================================

print_header() {
    safe_clear
    
    # 顶部边框和标题
    echo -e "${BOLD}${CYAN}┌──────────────────────────────────────────────────────────────────────────┐${RESET}"
    echo -e "${BOLD}${CYAN}│${RESET} ${BOLD}📊 日志监控面板${RESET} ${GRAY}$(printf '%.0s ' {1..52})${CYAN}${BOLD}│${RESET}"
    echo -e "${BOLD}${CYAN}├──────────────────────────────────────────────────────────────────────────┤${RESET}"
    
    # 目录路径（绝对路径）
    LOG_DIR_ABS=$(get_absolute_path "$LOG_DIR")
    local dir_display="$LOG_DIR_ABS"
    [ ${#dir_display} -gt 70 ] && dir_display="...${dir_display: -67}"
    echo -e "${BOLD}${CYAN}│${RESET} ${BOLD}📁 目录:${RESET} ${GREEN}$dir_display${RESET} ${GRAY}$(printf '%.0s ' {1..$((70 - ${#dir_display}))})${CYAN}${BOLD}│${RESET}"
    
    # 时间范围和过滤条件在一行
    local time_display="${START_TIME:11:8} - ${END_TIME:11:8}"
    local filter_display=""
    [ -n "$FILTER_TIME" ] && filter_display="${filter_display}时间:${FILTER_TIME} "
    [ -n "$FILTER_REQUEST_ID" ] && filter_display="${filter_display}ReqID:${FILTER_REQUEST_ID} "
    [ -n "$FILTER_USER_ID" ] && filter_display="${filter_display}User:${FILTER_USER_ID} "
    [ -z "$filter_display" ] && filter_display="无过滤"
    
    local line2="🕒 ${time_display}  |  🔍 ${filter_display}"
    echo -e "${BOLD}${CYAN}│${RESET} $line2 ${GRAY}$(printf '%.0s ' {1..$((72 - ${#line2}))})${CYAN}${BOLD}│${RESET}"
    
    echo -e "${BOLD}${CYAN}└──────────────────────────────────────────────────────────────────────────┘${RESET}"
    echo ""
}

display_table() {
    ALL_LOGS_FILE="$1"
    TOTAL_LOGS=$(jq 'length' "$ALL_LOGS_FILE")
    
    # 计算分页信息
    TOTAL_PAGES=$(( (TOTAL_LOGS + PAGE_SIZE - 1) / PAGE_SIZE ))
    [ "$TOTAL_PAGES" -eq 0 ] && TOTAL_PAGES=1
    
    # 边界检查
    if [ "$CURRENT_PAGE" -gt "$TOTAL_PAGES" ]; then
        CURRENT_PAGE="$TOTAL_PAGES"
    elif [ "$CURRENT_PAGE" -lt 1 ]; then
        CURRENT_PAGE=1
    fi
    
    local start_index=$(( (CURRENT_PAGE - 1) * PAGE_SIZE ))
    local end_index=$(( start_index + PAGE_SIZE ))
    [ "$end_index" -gt "$TOTAL_LOGS" ] && end_index="$TOTAL_LOGS"
    
    # 显示数据行数信息
    local display_start=$((start_index + 1))
    local display_end="$end_index"
    [ "$TOTAL_LOGS" -eq 0 ] && display_start=0 && display_end=0
    
    # 表格标题（去掉下划线）
    echo -e "${BOLD}${CYAN}  序号   时间     级别       RequestID      用户ID                                  消息${RESET}"
    echo -e "${GRAY}$(printf '─%.0s' {1..110})${RESET}"
    
    if [ "$TOTAL_LOGS" -eq 0 ]; then
        echo -e "  ${YELLOW}暂无符合条件的数据${RESET}"
        echo -e "${GRAY}$(printf '─%.0s' {1..110})${RESET}"
        echo -e "${BOLD}当前 ${CURRENT_PAGE}/${TOTAL_PAGES} 页, 共 ${TOTAL_LOGS} 条${RESET}"
        return
    fi
    
    # 显示当前页数据
    jq -r ".[$start_index:$end_index][] | [.timestamp, .level, .requestId, (.userId // \"-\"), .message] | @tsv" "$ALL_LOGS_FILE" |
    while IFS=$'\t' read -r timestamp level request_id user_id message; do
        # 序号（全局序号）
        local global_idx=$((start_index + 1))
        start_index=$((start_index + 1))
        
        local start_date="${START_TIME:0:10}"
        local end_date="${END_TIME:0:10}"
        local time_display=""
        if [ "$start_date" == "$end_date" ]; then
            # 同一天只显示时间范围
            time_display="${START_TIME:11:8} - ${END_TIME:11:8}"
        else
            # 不同天显示完整日期时间
            time_display="${START_TIME} - ${END_TIME}"
            [ ${#time_display} -gt 40 ] && time_display="${START_TIME:5} - ${END_TIME:5}"
        fi
        
        # 截断长字段（加宽了userId列）
        local request_display="${request_id:0:12}"
        [ ${#request_id} -gt 12 ] && request_display="${request_display}..."
        
        local user_display="${user_id:0:40}"
        [ ${#user_id} -gt 40 ] && user_display="${user_display}..."
        
        local msg_display="${message:0:60}"
        [ ${#message} -gt 60 ] && msg_display="${msg_display}..."
        
        # 获取级别颜色
        local level_color=$(get_level_color "$level")
        
        # 显示行
        printf "  %-4s %9s  ${level_color}%-8s${RESET} %-14s %-40s %s\n" \
            "$global_idx" "$time_display" "$level" "$request_display" "$user_display" "$msg_display"
    done
    
    echo -e "${GRAY}$(printf '─%.0s' {1..110})${RESET}"
    
    # 分页信息（单行）
    if [ "$TOTAL_PAGES" -gt 1 ]; then
        echo -e "${BOLD}当前 ${CURRENT_PAGE}/${TOTAL_PAGES} 页, 共 ${TOTAL_LOGS} 条  (显示 ${display_start}-${display_end})${RESET}"
    else
        echo -e "${BOLD}共 ${TOTAL_LOGS} 条日志${RESET}"
    fi
}

show_controls() {
    echo ""
    echo -e "${CYAN}${BOLD}📋 操作说明:${RESET}"
    echo -e "  ${GREEN}←/a${RESET} 上页        ${GREEN}→/d${RESET} 下页        ${GREEN}p${RESET} 跳页        ${GREEN}s${RESET} 详情"
    echo -e "  ${GREEN}t${RESET} 时间过滤      ${GREEN}r${RESET} Req过滤        ${GREEN}u${RESET} User过滤    ${GREEN}c${RESET} 清除过滤"
    echo -e "  ${GREEN}f${RESET} 刷新          ${GREEN}q${RESET} 退出"
    echo ""
}

# ============================================================
# 交互功能函数
# ============================================================

show_log_detail() {
    safe_clear
    echo -e "${BOLD}${CYAN}┌──────────────────────────────────────────────────────────────────────────┐${RESET}"
    echo -e "${BOLD}${CYAN}│${RESET} ${BOLD}📄 查看日志详情${RESET} ${GRAY}$(printf '%.0s ' {1..52})${CYAN}${BOLD}│${RESET}"
    echo -e "${BOLD}${CYAN}├──────────────────────────────────────────────────────────────────────────┤${RESET}"
    
    echo -e "${BOLD}${CYAN}│${RESET} ${GRAY}可查看序号范围: 1-$TOTAL_LOGS${RESET} ${GRAY}$(printf '%.0s ' {1..42})${CYAN}${BOLD}│${RESET}"
    echo -e "${BOLD}${CYAN}│${RESET} ${YELLOW}请输入要查看的日志序号: ${RESET}${GRAY}$(printf '%.0s ' {1..37})${CYAN}${BOLD}│${RESET}"
    echo -e "${BOLD}${CYAN}└──────────────────────────────────────────────────────────────────────────┘${RESET}"
    
    echo -ne "${YELLOW}▶ ${RESET}"
    read -r index
    
    if ! [[ "$index" =~ ^[0-9]+$ ]]; then
        echo -e "${RED}错误: 请输入有效的数字${RESET}"
        read -n 1 -s -p "按任意键继续..."
        return 1
    fi
    
    if [ "$index" -lt 1 ] || [ "$index" -gt "$TOTAL_LOGS" ]; then
        echo -e "${RED}错误: 序号超出范围 (1-$TOTAL_LOGS)${RESET}"
        read -n 1 -s -p "按任意键继续..."
        return 1
    fi
    
    # 显示详情
    safe_clear
    echo -e "${BOLD}${CYAN}┌──────────────────────────────────────────────────────────────────────────┐${RESET}"
    echo -e "${BOLD}${CYAN}│${RESET} ${BOLD}📄 日志详情 (序号: $index)${RESET} ${GRAY}$(printf '%.0s ' {1..44})${CYAN}${BOLD}│${RESET}"
    echo -e "${BOLD}${CYAN}├──────────────────────────────────────────────────────────────────────────┤${RESET}"
    
    local log_index=$((index - 1))
    local log_json=$(jq -r ".[$log_index]" "$ALL_LOGS_FILE")
    
    echo "$log_json" | jq '.' | while read -r line; do
        echo -e "${BOLD}${CYAN}│${RESET} ${GREEN}$line${RESET}"
    done
    
    echo -e "${BOLD}${CYAN}└──────────────────────────────────────────────────────────────────────────┘${RESET}"
    echo -e "\n${GRAY}按任意键返回主界面...${RESET}"
    read -n 1 -s
}

set_filter() {
    local type="$1"
    safe_clear
    
    echo -e "${BOLD}${CYAN}┌──────────────────────────────────────────────────────────────────────────┐${RESET}"
    case "$type" in
        time)
            echo -e "${BOLD}${CYAN}│${RESET} ${BOLD}🕒 设置时间过滤${RESET} ${GRAY}$(printf '%.0s ' {1..50})${CYAN}${BOLD}│${RESET}"
            echo -e "${BOLD}${CYAN}│${RESET} ${GRAY}示例: 10:30, 14:, :45 (支持部分匹配)${RESET} ${GRAY}$(printf '%.0s ' {1..27})${CYAN}${BOLD}│${RESET}"
            echo -ne "${BOLD}${CYAN}│${RESET} ${YELLOW}输入时间 (留空清除): ${RESET}"
            ;;
        request)
            echo -e "${BOLD}${CYAN}│${RESET} ${BOLD}🔑 设置 RequestID 过滤${RESET} ${GRAY}$(printf '%.0s ' {1..43})${CYAN}${BOLD}│${RESET}"
            echo -ne "${BOLD}${CYAN}│${RESET} ${YELLOW}输入 RequestID (留空清除): ${RESET}"
            ;;
        user)
            echo -e "${BOLD}${CYAN}│${RESET} ${BOLD}👤 设置 UserID 过滤${RESET} ${GRAY}$(printf '%.0s ' {1..46})${CYAN}${BOLD}│${RESET}"
            echo -ne "${BOLD}${CYAN}│${RESET} ${YELLOW}输入 UserID (留空清除): ${RESET}"
            ;;
    esac
    
    echo -e "${GRAY}$(printf '%.0s ' {1..22})${CYAN}${BOLD}│${RESET}"
    echo -e "${BOLD}${CYAN}└──────────────────────────────────────────────────────────────────────────┘${RESET}"
    
    echo -ne "${YELLOW}▶ ${RESET}"
    read -r value
    
    case "$type" in
        time) FILTER_TIME="$value" ;;
        request) FILTER_REQUEST_ID="$value" ;;
        user) FILTER_USER_ID="$value" ;;
    esac
    
    CURRENT_PAGE=1  # 重置到第一页
}

goto_page() {
    safe_clear
    echo -e "${BOLD}${CYAN}┌──────────────────────────────────────────────────────────────────────────┐${RESET}"
    echo -e "${BOLD}${CYAN}│${RESET} ${BOLD}📑 跳转到指定页码${RESET} ${GRAY}$(printf '%.0s ' {1..48})${CYAN}${BOLD}│${RESET}"
    echo -e "${BOLD}${CYAN}│${RESET} ${GRAY}页码范围: 1-$TOTAL_PAGES${RESET} ${GRAY}$(printf '%.0s ' {1..47})${CYAN}${BOLD}│${RESET}"
    echo -e "${BOLD}${CYAN}└──────────────────────────────────────────────────────────────────────────┘${RESET}"
    
    echo -ne "${YELLOW}请输入页码 (1-$TOTAL_PAGES): ${RESET}"
    read -r page
    
    if ! [[ "$page" =~ ^[0-9]+$ ]]; then
        echo -e "${RED}错误: 请输入有效的数字${RESET}"
        read -n 1 -s -p "按任意键继续..."
        return 1
    fi
    
    if [ "$page" -lt 1 ] || [ "$page" -gt "$TOTAL_PAGES" ]; then
        echo -e "${RED}错误: 页码超出范围 (1-$TOTAL_PAGES)${RESET}"
        read -n 1 -s -p "按任意键继续..."
        return 1
    fi
    
    CURRENT_PAGE="$page"
}

# ============================================================
# 键盘监听主循环
# ============================================================

keyboard_loop() {
    # 保存原始终端设置
    local original_stty
    original_stty=$(stty -g 2>/dev/null)
    
    # 设置非阻塞读取
    stty -echo -icanon time 0 min 0 2>/dev/null
    
    while true; do
        # 读取按键（带超时）
        if read -rsn1 -t 0.1 key; then
            case "$key" in
                $'\x1b')  # ESC序列
                    read -rsn2 -t 0.01 seq
                    case "$seq" in
                        '[D') key='a' ;;  # 左箭头
                        '[C') key='d' ;;  # 右箭头
                    esac
                    ;;
            esac
            
            case "$key" in
                'a'|'A')
                    if [ "$CURRENT_PAGE" -gt 1 ]; then
                        CURRENT_PAGE=$((CURRENT_PAGE - 1))
                    fi
                    ;;
                'd'|'D')
                    if [ "$CURRENT_PAGE" -lt "$TOTAL_PAGES" ]; then
                        CURRENT_PAGE=$((CURRENT_PAGE + 1))
                    fi
                    ;;
                'p'|'P')
                    stty "$original_stty" 2>/dev/null
                    goto_page
                    stty -echo -icanon time 0 min 0 2>/dev/null
                    ;;
                's'|'S')
                    if [ "$TOTAL_LOGS" -eq 0 ]; then
                        echo -e "${RED}没有数据可查看${RESET}"
                        sleep 1
                    else
                        stty "$original_stty" 2>/dev/null
                        show_log_detail
                        stty -echo -icanon time 0 min 0 2>/dev/null
                    fi
                    ;;
                't'|'T')
                    stty "$original_stty" 2>/dev/null
                    set_filter "time"
                    stty -echo -icanon time 0 min 0 2>/dev/null
                    ALL_LOGS_FILE=$(read_logs)
                    ;;
                'r'|'R')
                    stty "$original_stty" 2>/dev/null
                    set_filter "request"
                    stty -echo -icanon time 0 min 0 2>/dev/null
                    ALL_LOGS_FILE=$(read_logs)
                    ;;
                'u'|'U')
                    stty "$original_stty" 2>/dev/null
                    set_filter "user"
                    stty -echo -icanon time 0 min 0 2>/dev/null
                    ALL_LOGS_FILE=$(read_logs)
                    ;;
                'c'|'C')
                    FILTER_TIME=""
                    FILTER_REQUEST_ID=""
                    FILTER_USER_ID=""
                    CURRENT_PAGE=1
                    ALL_LOGS_FILE=$(read_logs)
                    ;;
                'f'|'F')
                    ALL_LOGS_FILE=$(read_logs)
                    ;;
                'q'|'Q')
                    stty "$original_stty" 2>/dev/null
                    return 0
                    ;;
            esac
            
            # 刷新显示
            print_header
            display_table "$ALL_LOGS_FILE"
            show_controls
        fi
    done
}

# ============================================================
# 主程序
# ============================================================

main() {
    # 解析参数
    parse_args "$@"
    
    # 检查依赖
    check_dependencies
    
    # 获取绝对路径
    LOG_DIR_ABS=$(get_absolute_path "$LOG_DIR")
    
    # 检查目录是否存在
    if [ ! -d "$LOG_DIR_ABS" ]; then
        echo -e "${RED}错误: 目录不存在: $LOG_DIR_ABS${RESET}"
        exit 1
    fi
    
    # 日期时间转换函数，支持多种格式
    convert_datetime() {
        local datetime="$1"
        # 去除首尾空格
        datetime=$(echo "$datetime" | xargs)
        
        # 尝试多种格式
        local formats=(
            "%Y/%m/%d %H:%M:%S"
            "%Y-%m-%d %H:%M:%S"
            "%Y/%m/%d %H:%M"
            "%Y-%m-%d %H:%M"
            "%Y/%m/%d"
            "%Y-%m-%d"
        )
        
        for fmt in "${formats[@]}"; do
            if date -d "$datetime" "+%s" 2>/dev/null; then
                return 0
            elif date -j -f "$fmt" "$datetime" "+%s" 2>/dev/null; then
                return 0
            fi
        done
        
        echo "错误: 无法解析时间格式: $datetime" >&2
        exit 1
    }

    # 解析起始和结束时间（支持 - 或 , 分隔）
    if [[ "$START_TIME" == *"-"* ]] || [[ "$START_TIME" == *","* ]]; then
        # 如果输入了范围格式，如 "2026-12-32 11:11:00 - 2026-12-32 11:11:00"
        if [[ "$START_TIME" == *" - "* ]]; then
            START_TIME=$(echo "$START_TIME" | awk -F' - ' '{print $1}')
            END_TIME=$(echo "$START_TIME" | awk -F' - ' '{print $2}')
        elif [[ "$START_TIME" == *","* ]]; then
            START_TIME=$(echo "$START_TIME" | awk -F',' '{print $1}' | xargs)
            END_TIME=$(echo "$START_TIME" | awk -F',' '{print $2}' | xargs)
        fi
    fi

    # 转换时间戳
    START_TS=$(convert_datetime "$START_TIME")
    END_TS=$(convert_datetime "$END_TIME")

    # 确保 END_TS >= START_TS
    if [ "$END_TS" -lt "$START_TS" ]; then
        echo -e "${RED}错误: 结束时间不能早于开始时间${RESET}"
        exit 1
    fi

    # 更新显示的时间格式（统一为 YYYY-MM-DD HH:MM:SS）
    START_TIME=$(date -d "@$START_TS" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || date -j -f "%s" "$START_TS" "+%Y-%m-%d %H:%M:%S")
    END_TIME=$(date -d "@$END_TS" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || date -j -f "%s" "$END_TS" "+%Y-%m-%d %H:%M:%S")
    
    # 初始化加载数据
    ALL_LOGS_FILE=$(read_logs)
    
    # 首次显示
    print_header
    display_table "$ALL_LOGS_FILE"
    show_controls
    
    # 监听模式
    if [ "$WATCH_MODE" = true ]; then
        keyboard_loop
    fi
    
    # 清理和退出
    stty echo icanon 2>/dev/null
    [ -f "$ALL_LOGS_FILE" ] && rm -f "$ALL_LOGS_FILE"
    echo -e "\n${GREEN}已退出日志监控${RESET}"
}

# 设置退出清理
trap 'stty echo icanon 2>/dev/null; [ -f "$ALL_LOGS_FILE" ] && rm -f "$ALL_LOGS_FILE"; echo -e "\n${GREEN}程序已退出${RESET}"; exit 0' INT TERM

# 启动主程序
main "$@"
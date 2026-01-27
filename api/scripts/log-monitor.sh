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
FILTER_SUBDIR=""
FILTER_KEYWORD=""

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

${BOLD}Controls (in watch mode):${RESET}
  ${CYAN}←/a${RESET} Prev      ${CYAN}→/d${RESET} Next      ${CYAN}p${RESET} Jump      ${CYAN}s${RESET} Detail
  ${CYAN}t${RESET} Time       ${CYAN}r${RESET} ReqID      ${CYAN}u${RESET} User       ${CYAN}k${RESET} Keyword    ${CYAN}m${RESET} Subdir
  ${CYAN}c${RESET} Clear      ${CYAN}f${RESET} Refresh    ${CYAN}q${RESET} Quit

${BOLD}Time filter examples:${RESET}
  ${GREEN}Full range:${RESET}             2026/01/26 12:00:00-2026/01/26 16:00:00
  ${GREEN}Without seconds:${RESET}         2026/01/26 12:00-2026/01/26 16:00
  ${GREEN}Date range:${RESET}              2026/01/26-2026/01/27
  ${GREEN}Single date:${RESET}             2026/01/26
  ${GREEN}Omit start:${RESET}              -2026/01/26, -2026/01/26 11:22, -2026/01/26 11:22:00
  ${GREEN}Omit end:${RESET}                2026/01/26-, 2026/01/26 11:22-, 2026/01/26 11:22:00-
  ${GREEN}Relative time:${RESET}          12seconds, 12minutes, 12hours, 12days

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

# ISO时间格式化函数 - 输出 Y/m/d H:i:s 格式
format_iso_time() {
    local iso_time="$1"
    # 去除毫秒，修正时区格式
    local fixed_time=$(echo "$iso_time" | sed -E 's/\.[0-9]+//; s/([+-][0-9]{2}):([0-9]{2})$/\1\2/')
    date -j -f "%Y-%m-%dT%H:%M:%S%z" "$fixed_time" "+%Y/%m/%d %H:%M:%S" 2>/dev/null || echo "$iso_time"
}

# 将ISO 8601时间戳转换为Unix时间戳
iso_to_timestamp() {
    local iso_time="$1"
    # 去除毫秒，修正时区格式为+0800格式（macOS date命令需要）
    local fixed_time=$(echo "$iso_time" | sed -E 's/\.[0-9]+//; s/([+-][0-9]{2}):([0-9]{2})$/\1\2/')
    # 尝试解析ISO 8601格式（带时区）
    local result=$(date -j -f "%Y-%m-%dT%H:%M:%S%z" "$fixed_time" +%s 2>/dev/null)
    if [ -n "$result" ] && [ "$result" != "0" ]; then
        echo "$result"
        return 0
    fi
    # 如果失败，尝试不带时区的格式（假设本地时区）
    local no_tz=$(echo "$iso_time" | sed -E 's/\.[0-9]+//' | sed 's/[+-][0-9]\{2\}:[0-9]\{2\}$//')
    result=$(date -j -f "%Y-%m-%dT%H:%M:%S" "$no_tz" +%s 2>/dev/null)
    if [ -n "$result" ] && [ "$result" != "0" ]; then
        echo "$result"
        return 0
    fi
    echo "0"
    return 1
}

# ============================================================
# 时间处理函数
# ============================================================

# 时间转换函数（支持多种格式）
parse_time() {
    local input="$1"
    local default_hour="${2:-00}"
    local default_minute="${3:-00}"
    local default_second="${4:-00}"
    
    # 去除空格
    input=$(echo "$input" | xargs)
    
    # 空值处理
    if [ -z "$input" ]; then
        echo "empty"
        return 0
    fi
    
    # 检查是否是相对时间
    if [[ "$input" =~ ^[0-9]+(seconds|minutes|hours|days)$ ]]; then
        echo "relative:$input"
        return 0
    fi
    
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
        if date -j -f "$fmt" "$input" "+%s" 2>/dev/null; then
            return 0
        fi
    done
    
    echo "error"
    return 1
}

# 处理时间范围输入
process_time_range() {
    local input="$1"
    
    # 去除首尾空格
    input=$(echo "$input" | xargs)
    
    # 空值处理
    if [ -z "$input" ]; then
        START_TIME=$(date +"%Y-%m-%d 00:00:00")
        END_TIME=$(date +"%Y-%m-%d 23:59:59")
        return 0
    fi
    
    # 处理相对时间 (2.11-2.14)
    if [[ "$input" =~ ^[0-9]+(seconds|minutes|hours|days)$ ]]; then
        local amount=$(echo "$input" | grep -o '[0-9]*')
        local unit=$(echo "$input" | grep -o '[a-z]*')
        
        END_TIME=$(date +"%Y-%m-%d %H:%M:%S")
        case "$unit" in
            seconds)
                START_TIME=$(date -v -${amount}S +"%Y-%m-%d %H:%M:%S")
                ;;
            minutes)
                START_TIME=$(date -v -${amount}M +"%Y-%m-%d %H:%M:%S")
                ;;
            hours)
                START_TIME=$(date -v -${amount}H +"%Y-%m-%d %H:%M:%S")
                ;;
            days)
                START_TIME=$(date -v -${amount}d +"%Y-%m-%d %H:%M:%S")
                ;;
        esac
        return 0
    fi
    
    # 检查是否有分隔符
    local separator=""
    if [[ "$input" == *"-"* ]]; then
        separator="-"
    elif [[ "$input" == *","* ]]; then
        separator=","
    fi
    
    # 如果没有分隔符，认为是单个日期 (2.4)
    if [ -z "$separator" ]; then
        local parsed=$(parse_time "$input")
        if [ "$parsed" != "error" ] && [ "$parsed" != "empty" ]; then
            START_TIME=$(date -j -f "%s" "$parsed" "+%Y-%m-%d 00:00:00")
            END_TIME=$(date -j -f "%s" "$parsed" "+%Y-%m-%d 23:59:59")
            return 0
        fi
    fi
    
    # 解析分隔的时间范围
    if [ -n "$separator" ]; then
        local start_part=$(echo "$input" | awk -F"$separator" '{print $1}' | xargs)
        local end_part=$(echo "$input" | awk -F"$separator" '{print $2}' | xargs)
        
        # 处理省略开始时间的情况 (2.5-2.7)
        if [ -z "$start_part" ] && [ -n "$end_part" ]; then
            START_TIME="1970-01-01 00:00:00"  # 最早时间
            local end_ts=$(parse_time "$end_part")
            if [ "$end_ts" != "error" ]; then
                # 检查是否包含时间部分
                if [[ "$end_part" =~ [0-9]:[0-9] ]]; then
                    END_TIME=$(date -j -f "%s" "$end_ts" "+%Y-%m-%d %H:%M:%S")
                else
                    # 只有日期，设置为当天的23:59:59
                    END_TIME=$(date -j -f "%s" "$end_ts" "+%Y-%m-%d 23:59:59")
                fi
            else
                END_TIME=$(date +"%Y-%m-%d %H:%M:%S")
            fi
            return 0
        fi
        
        # 处理省略结束时间的情况 (2.8-2.10)
        if [ -n "$start_part" ] && [ -z "$end_part" ]; then
            local start_ts=$(parse_time "$start_part")
            if [ "$start_ts" != "error" ]; then
                # 检查是否包含时间部分
                if [[ "$start_part" =~ [0-9]:[0-9] ]]; then
                    START_TIME=$(date -j -f "%s" "$start_ts" "+%Y-%m-%d %H:%M:%S")
                else
                    # 只有日期，设置为当天的00:00:00
                    START_TIME=$(date -j -f "%s" "$start_ts" "+%Y-%m-%d 00:00:00")
                fi
                END_TIME=$(date +"%Y-%m-%d %H:%M:%S")  # 当前时间
            else
                START_TIME=$(date +"%Y-%m-%d 00:00:00")
                END_TIME=$(date +"%Y-%m-%d %H:%M:%S")
            fi
            return 0
        fi
        
        # 完整的开始和结束时间 (2.1-2.3)
        if [ -n "$start_part" ] && [ -n "$end_part" ]; then
            local start_ts=$(parse_time "$start_part")
            local end_ts=$(parse_time "$end_part")
            
            if [ "$start_ts" != "error" ] && [ "$end_ts" != "error" ]; then
                # 检查开始时间是否包含时间部分
                if [[ "$start_part" =~ [0-9]:[0-9] ]]; then
                    START_TIME=$(date -j -f "%s" "$start_ts" "+%Y-%m-%d %H:%M:%S")
                else
                    # 只有日期，设置为当天的00:00:00 (2.3)
                    START_TIME=$(date -j -f "%s" "$start_ts" "+%Y-%m-%d 00:00:00")
                fi
                
                # 检查结束时间是否包含时间部分
                if [[ "$end_part" =~ [0-9]:[0-9] ]]; then
                    END_TIME=$(date -j -f "%s" "$end_ts" "+%Y-%m-%d %H:%M:%S")
                else
                    # 只有日期，设置为当天的23:59:59 (2.3)
                    END_TIME=$(date -j -f "%s" "$end_ts" "+%Y-%m-%d 23:59:59")
                fi
                return 0
            fi
        fi
    fi
    
    # 默认返回当天
    START_TIME=$(date +"%Y-%m-%d 00:00:00")
    END_TIME=$(date +"%Y-%m-%d 23:59:59")
}

# ============================================================
# 显示函数
# ============================================================

print_header() {
    safe_clear
    
    # 顶部边框和标题
    local total_width=80  # 控制总宽度
    echo -e "${BOLD}${CYAN}┌$(printf '─%.0s' $(seq 1 $((total_width-2))))┐${RESET}"
    
    # 标题行
    local title="Log Monitor Panel"
    local title_padding=$((total_width - ${#title} - 4))
    echo -e "${BOLD}${CYAN}│${RESET} ${BOLD}$title${RESET} $(printf ' %.0s' $(seq 1 $title_padding))${CYAN}${BOLD}│${RESET}"
    echo -e "${BOLD}${CYAN}├$(printf '─%.0s' $(seq 1 $((total_width-2))))┤${RESET}"
    
    # 目录路径（绝对路径）
    LOG_DIR_ABS=$(get_absolute_path "$LOG_DIR")
    local dir_display="$LOG_DIR_ABS"
    [ ${#dir_display} -gt $((total_width-10)) ] && dir_display="...${dir_display: -$((total_width-13))}"
    local dir_line="Directory: $dir_display"
    local dir_padding=$((total_width - ${#dir_line} - 3))
    echo -e "${BOLD}${CYAN}│${RESET} $dir_line$(printf ' %.0s' $(seq 1 $dir_padding))${CYAN}${BOLD}│${RESET}"
    
    # 时间范围
    local start_display="${START_TIME:0:10} ${START_TIME:11:8}"
    local end_display="${END_TIME:0:10} ${END_TIME:11:8}"
    local time_line="Time Range: $start_display - $end_display"
    local time_padding=$((total_width - ${#time_line} - 3))
    echo -e "${BOLD}${CYAN}│${RESET} $time_line$(printf ' %.0s' $(seq 1 $time_padding))${CYAN}${BOLD}│${RESET}"
    
    # 子目录显示 - 显示所有子目录名称
    local subdir_display=""
    if [ -n "$FILTER_SUBDIR" ]; then
        subdir_display="$FILTER_SUBDIR"
    elif [ -n "$SUBDIRS" ]; then
        subdir_display="$SUBDIRS"
    else
        # 列出所有子目录
        local all_subdirs=()
        if [ -d "$LOG_DIR_ABS" ]; then
            while IFS= read -r dir; do
                if [ -d "$dir" ] && [ -n "$dir" ]; then
                    all_subdirs+=("$(basename "$dir")")
                fi
            done < <(find "$LOG_DIR_ABS" -maxdepth 1 -type d ! -path "$LOG_DIR_ABS" 2>/dev/null | sort)
        fi
        if [ ${#all_subdirs[@]} -gt 0 ]; then
            subdir_display=$(IFS=','; echo "${all_subdirs[*]}")
        else
            subdir_display="all"
        fi
    fi
    local subdir_line="Subdirs: $subdir_display"
    local subdir_padding=$((total_width - ${#subdir_line} - 3))
    echo -e "${BOLD}${CYAN}│${RESET} $subdir_line$(printf ' %.0s' $(seq 1 $subdir_padding))${CYAN}${BOLD}│${RESET}"
    
    # 过滤条件（不包含时间和子目录，因为已单独显示）
    local filter_display=""
    [ -n "$FILTER_REQUEST_ID" ] && filter_display="${filter_display}ReqID:${FILTER_REQUEST_ID} "
    [ -n "$FILTER_USER_ID" ] && filter_display="${filter_display}User:${FILTER_USER_ID} "
    [ -n "$FILTER_KEYWORD" ] && filter_display="${filter_display}Keyword:${FILTER_KEYWORD} "
    [ -z "$filter_display" ] && filter_display="none"
    
    local filter_line="Filters: $filter_display"
    local filter_padding=$((total_width - ${#filter_line} - 3))
    echo -e "${BOLD}${CYAN}│${RESET} $filter_line$(printf ' %.0s' $(seq 1 $filter_padding))${CYAN}${BOLD}│${RESET}"
    
    echo -e "${BOLD}${CYAN}└$(printf '─%.0s' $(seq 1 $((total_width-2))))┘${RESET}"
    echo ""
}

# 读取并处理日志（倒序排列）
read_logs() {
    local tmp=$(mktemp)
    local files=()
    
    # 获取绝对路径
    LOG_DIR_ABS=$(get_absolute_path "$LOG_DIR")

    # 构建搜索文件列表
    local search_dirs=()
    if [ -n "$FILTER_SUBDIR" ]; then
        # 如果设置了子目录过滤，只搜索该子目录
        if [ -d "$LOG_DIR_ABS/$FILTER_SUBDIR" ]; then
            search_dirs+=("$LOG_DIR_ABS/$FILTER_SUBDIR")
        else
            echo "[]" > "$tmp"
            echo "$tmp"
            return
        fi
    elif [ -n "$SUBDIRS" ]; then
        IFS=',' read -ra ds <<< "$SUBDIRS"
        for d in "${ds[@]}"; do
            d=$(echo "$d" | xargs)  # 去除空格
            if [ -d "$LOG_DIR_ABS/$d" ]; then
                search_dirs+=("$LOG_DIR_ABS/$d")
            fi
        done
        [ ${#search_dirs[@]} -eq 0 ] && { echo "[]" > "$tmp"; echo "$tmp"; return; }
    else
        search_dirs+=("$LOG_DIR_ABS")
    fi

    # 查找并读取所有日志文件
    find "${search_dirs[@]}" -type f -name "*.log" 2>/dev/null | while read -r f; do
        while IFS= read -r line; do
            # 检查是否为有效 JSON
            if ! echo "$line" | jq -e '.timestamp and .requestId' >/dev/null 2>&1; then
                continue
            fi
            
            # 时间过滤 - 正确解析ISO 8601时间戳
            local iso_ts=$(echo "$line" | jq -r '.timestamp')
            local t=$(iso_to_timestamp "$iso_ts")
            
            # 基本时间范围过滤
            if [ -n "$t" ] && [ "$t" != "0" ] && [ "$t" -ge "$START_TS" ] && [ "$t" -le "$END_TS" ]; then
                # 额外过滤条件
                local include=true
                
                if [ -n "$FILTER_REQUEST_ID" ]; then
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
                
                if [ "$include" = true ] && [ -n "$FILTER_KEYWORD" ]; then
                    # 关键词搜索：在message字段中搜索
                    local msg=$(echo "$line" | jq -r '.message // ""')
                    echo "$msg" | grep -iq "$FILTER_KEYWORD" || include=false
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
    
    # 表格标题
    echo -e "${BOLD}${CYAN}  #     Time                Level     RequestID         UserID                                    Message${RESET}"
    echo -e "${GRAY}$(printf '─%.0s' {1..120})${RESET}"
    
    if [ "$TOTAL_LOGS" -eq 0 ]; then
        echo -e "  ${YELLOW}No data found${RESET}"
        echo -e "${GRAY}$(printf '─%.0s' {1..120})${RESET}"
        echo -e "${BOLD}Page ${CURRENT_PAGE}/${TOTAL_PAGES}, Total ${TOTAL_LOGS} logs${RESET}"
        return
    fi
    
    # 显示当前页数据
    jq -r ".[$start_index:$end_index][] | [.timestamp, .level, .requestId, (.userId // \"-\"), .message] | @tsv" "$ALL_LOGS_FILE" |
    while IFS=$'\t' read -r timestamp level request_id user_id message; do
        # 序号（全局序号）
        local global_idx=$((start_index + 1))
        start_index=$((start_index + 1))
        
        # 格式化时间 - Y/m/d H:i:s 格式
        local formatted_time=$(format_iso_time "$timestamp")
        
        # 截断长字段
        local request_display="${request_id:0:14}"
        [ ${#request_id} -gt 14 ] && request_display="${request_display}..."
        
        # 用户ID显示完整
        local user_display="$user_id"
        
        local msg_display="${message:0:40}"
        [ ${#message} -gt 40 ] && msg_display="${msg_display}..."
        
        # 获取级别颜色
        local level_color=$(get_level_color "$level")
        
        # 显示行
        printf "  %-4s %-20s ${level_color}%-8s${RESET} %-16s %-40s %s\n" \
            "$global_idx" "$formatted_time" "$level" "$request_display" "$user_display" "$msg_display"
    done
    
    echo -e "${GRAY}$(printf '─%.0s' {1..120})${RESET}"
    
    # 分页信息（单行）
    if [ "$TOTAL_PAGES" -gt 1 ]; then
        echo -e "${BOLD}Page ${CURRENT_PAGE}/${TOTAL_PAGES}, Total ${TOTAL_LOGS} logs  (Showing ${display_start}-${display_end})${RESET}"
    else
        echo -e "${BOLD}Total ${TOTAL_LOGS} logs${RESET}"
    fi
}

show_controls() {
    echo ""
    echo -e "${CYAN}${BOLD}Controls:${RESET}"
    echo -e "  ${GREEN}←/a${RESET} 上一页      ${GREEN}→/d${RESET} 下一页      ${GREEN}p${RESET} 跳页      ${CYAN}s${RESET} 详情"
    echo -e "  ${GREEN}t${RESET} 时间过滤      ${GREEN}r${RESET} ReqID过滤     ${GREEN}u${RESET} User过滤  ${GREEN}k${RESET} Keyword过滤  ${GREEN}m${RESET} Subdir过滤"
    echo -e "  ${CYAN}c${RESET} 清除过滤      ${GREEN}f${RESET} 刷新          ${RED}q${RESET} 退出"
    echo ""
}

# ============================================================
# 交互功能函数
# ============================================================

show_log_detail() {
    safe_clear
    echo -e "${BOLD}${CYAN}┌──────────────────────────────────────────────────────────────────────┐${RESET}"
    echo -e "${BOLD}${CYAN}│${RESET} ${BOLD}View Log Detail${RESET} ${GRAY}$(printf '%.0s ' {1..56})${CYAN}${BOLD}│${RESET}"
    echo -e "${BOLD}${CYAN}├──────────────────────────────────────────────────────────────────────┤${RESET}"
    
    echo -e "${BOLD}${CYAN}│${RESET} ${GRAY}Available index range: 1-$TOTAL_LOGS${RESET} ${GRAY}$(printf '%.0s ' {1..38})${CYAN}${BOLD}│${RESET}"
    echo -e "${BOLD}${CYAN}│${RESET} ${YELLOW}Enter log index to view: ${RESET}${GRAY}$(printf '%.0s ' {1..38})${CYAN}${BOLD}│${RESET}"
    echo -e "${BOLD}${CYAN}└──────────────────────────────────────────────────────────────────────┘${RESET}"
    
    echo -ne "${YELLOW}▶ ${RESET}"
    read -r index
    
    if ! [[ "$index" =~ ^[0-9]+$ ]]; then
        echo -e "${RED}Error: Please enter a valid number${RESET}"
        read -n 1 -s -p "Press any key to continue..."
        return 1
    fi
    
    if [ "$index" -lt 1 ] || [ "$index" -gt "$TOTAL_LOGS" ]; then
        echo -e "${RED}Error: Index out of range (1-$TOTAL_LOGS)${RESET}"
        read -n 1 -s -p "Press any key to continue..."
        return 1
    fi
    
    # 显示详情
    safe_clear
    echo -e "${BOLD}${CYAN}┌──────────────────────────────────────────────────────────────────────┐${RESET}"
    echo -e "${BOLD}${CYAN}│${RESET} ${BOLD}Log Detail (Index: $index)${RESET} ${GRAY}$(printf '%.0s ' {1..45})${CYAN}${BOLD}│${RESET}"
    echo -e "${BOLD}${CYAN}├──────────────────────────────────────────────────────────────────────┤${RESET}"
    
    local log_index=$((index - 1))
    local log_json=$(jq -r ".[$log_index]" "$ALL_LOGS_FILE")
    
    echo "$log_json" | jq '.' | while read -r line; do
        echo -e "${BOLD}${CYAN}│${RESET} ${GREEN}$line${RESET}"
    done
    
    echo -e "${BOLD}${CYAN}└──────────────────────────────────────────────────────────────────────┘${RESET}"
    echo -e "\n${GRAY}Press any key to return...${RESET}"
    read -n 1 -s
}

set_filter() {
    local type="$1"
    safe_clear
    
    echo -e "${BOLD}${CYAN}┌──────────────────────────────────────────────────────────────────────┐${RESET}"
    case "$type" in
        time)
            echo -e "${BOLD}${CYAN}│${RESET} ${BOLD}Time Filter${RESET} ${GRAY}$(printf '%.0s ' {1..55})${CYAN}${BOLD}│${RESET}"
            echo -e "${BOLD}${CYAN}│${RESET} ${GRAY}Examples:${RESET}"
            echo -e "${BOLD}${CYAN}│${RESET} ${GRAY}• 2026/01/26 12:00:00-2026/01/26 16:00:00  (full range)${RESET}"
            echo -e "${BOLD}${CYAN}│${RESET} ${GRAY}• 2026/01/26 12:00-2026/01/26 16:00      (without seconds)${RESET}"
            echo -e "${BOLD}${CYAN}│${RESET} ${GRAY}• 2026/01/26-2026/01/27                 (date range)${RESET}"
            echo -e "${BOLD}${CYAN}│${RESET} ${GRAY}• 2026/01/26                            (single date)${RESET}"
            echo -e "${BOLD}${CYAN}│${RESET} ${GRAY}• -2026/01/26                           (omit start 1)${RESET}"
            echo -e "${BOLD}${CYAN}│${RESET} ${GRAY}• -2026/01/26 11:22                     (omit start 2)${RESET}"
            echo -e "${BOLD}${CYAN}│${RESET} ${GRAY}• -2026/01/26 11:22:00                  (omit start 3)${RESET}"
            echo -e "${BOLD}${CYAN}│${RESET} ${GRAY}• 2026/01/26-                           (omit end 1)${RESET}"
            echo -e "${BOLD}${CYAN}│${RESET} ${GRAY}• 2026/01/26 11:22-                    (omit end 2)${RESET}"
            echo -e "${BOLD}${CYAN}│${RESET} ${GRAY}• 2026/01/26 11:22:00-                 (omit end 3)${RESET}"
            echo -e "${BOLD}${CYAN}│${RESET} ${GRAY}• 12seconds/12minutes/12hours/12days   (relative time)${RESET}"
            echo -ne "${BOLD}${CYAN}│${RESET} ${YELLOW}Enter time range (empty to clear): ${RESET}"
            ;;
        request)
            echo -e "${BOLD}${CYAN}│${RESET} ${BOLD}RequestID Filter${RESET} ${GRAY}$(printf '%.0s ' {1..48})${CYAN}${BOLD}│${RESET}"
            echo -ne "${BOLD}${CYAN}│${RESET} ${YELLOW}Enter RequestID (empty to clear): ${RESET}"
            ;;
        user)
            echo -e "${BOLD}${CYAN}│${RESET} ${BOLD}UserID Filter${RESET} ${GRAY}$(printf '%.0s ' {1..51})${CYAN}${BOLD}│${RESET}"
            echo -ne "${BOLD}${CYAN}│${RESET} ${YELLOW}Enter UserID (empty to clear): ${RESET}"
            ;;
        keyword)
            echo -e "${BOLD}${CYAN}│${RESET} ${BOLD}Keyword Filter${RESET} ${GRAY}$(printf '%.0s ' {1..50})${CYAN}${BOLD}│${RESET}"
            echo -e "${BOLD}${CYAN}│${RESET} ${GRAY}Search in message field${RESET}"
            echo -ne "${BOLD}${CYAN}│${RESET} ${YELLOW}Enter keyword (empty to clear): ${RESET}"
            ;;
        subdir)
            echo -e "${BOLD}${CYAN}│${RESET} ${BOLD}Subdir Filter${RESET} ${GRAY}$(printf '%.0s ' {1..52})${CYAN}${BOLD}│${RESET}"
            echo -e "${BOLD}${CYAN}│${RESET} ${GRAY}Available subdirs:${RESET}"
            # 列出所有可用的子目录
            local dir_count=0
            if [ -d "$LOG_DIR_ABS" ]; then
                while IFS= read -r dir; do
                    if [ -d "$dir" ] && [ -n "$dir" ]; then
                        local dir_name=$(basename "$dir")
                        echo -e "${BOLD}${CYAN}│${RESET} ${GRAY}  • $dir_name${RESET}"
                        dir_count=$((dir_count + 1))
                    fi
                done < <(find "$LOG_DIR_ABS" -maxdepth 1 -type d ! -path "$LOG_DIR_ABS" 2>/dev/null | sort)
                [ "$dir_count" -eq 0 ] && echo -e "${BOLD}${CYAN}│${RESET} ${GRAY}  (no subdirs)${RESET}"
            fi
            echo -ne "${BOLD}${CYAN}│${RESET} ${YELLOW}Enter subdir name (empty to clear): ${RESET}"
            ;;
    esac
    
    echo -e "${GRAY}$(printf '%.0s ' {1..20})${CYAN}${BOLD}│${RESET}"
    echo -e "${BOLD}${CYAN}└──────────────────────────────────────────────────────────────────────┘${RESET}"
    
    echo -ne "${YELLOW}▶ ${RESET}"
    read -r value
    
    case "$type" in
        time)
            if [ -n "$value" ]; then
                process_time_range "$value"
                START_TS=$(date -j -f "%Y-%m-%d %H:%M:%S" "$START_TIME" +%s 2>/dev/null || date -d "$START_TIME" +%s 2>/dev/null)
                END_TS=$(date -j -f "%Y-%m-%d %H:%M:%S" "$END_TIME" +%s 2>/dev/null || date -d "$END_TIME" +%s 2>/dev/null)
                FILTER_TIME="$value"
            else
                FILTER_TIME=""
                # 恢复默认时间范围
                START_TIME=$(date +"%Y-%m-%d 00:00:00")
                END_TIME=$(date +"%Y-%m-%d 23:59:59")
                START_TS=$(date -j -f "%Y-%m-%d %H:%M:%S" "$START_TIME" +%s 2>/dev/null || date -d "$START_TIME" +%s 2>/dev/null)
                END_TS=$(date -j -f "%Y-%m-%d %H:%M:%S" "$END_TIME" +%s 2>/dev/null || date -d "$END_TIME" +%s 2>/dev/null)
            fi
            ;;
        request)
            FILTER_REQUEST_ID="$value"
            ;;
        user)
            FILTER_USER_ID="$value"
            ;;
        keyword)
            FILTER_KEYWORD="$value"
            ;;
        subdir)
            if [ -n "$value" ]; then
                # 验证子目录是否存在
                if [ -d "$LOG_DIR_ABS/$value" ]; then
                    FILTER_SUBDIR="$value"
                else
                    echo -e "${RED}Error: Subdir not found: $value${RESET}"
                    read -n 1 -s -p "Press any key to continue..."
                    return 1
                fi
            else
                FILTER_SUBDIR=""
            fi
            ;;
    esac
    
    CURRENT_PAGE=1  # 重置到第一页
}

goto_page() {
    safe_clear
    echo -e "${BOLD}${CYAN}┌──────────────────────────────────────────────────────────────────────┐${RESET}"
    echo -e "${BOLD}${CYAN}│${RESET} ${BOLD}Jump to Page${RESET} ${GRAY}$(printf '%.0s ' {1..58})${CYAN}${BOLD}│${RESET}"
    echo -e "${BOLD}${CYAN}│${RESET} ${GRAY}Page range: 1-$TOTAL_PAGES${RESET} ${GRAY}$(printf '%.0s ' {1..50})${CYAN}${BOLD}│${RESET}"
    echo -e "${BOLD}${CYAN}└──────────────────────────────────────────────────────────────────────┘${RESET}"
    
    echo -ne "${YELLOW}Enter page number (1-$TOTAL_PAGES): ${RESET}"
    read -r page
    
    if ! [[ "$page" =~ ^[0-9]+$ ]]; then
        echo -e "${RED}Error: Please enter a valid number${RESET}"
        read -n 1 -s -p "Press any key to continue..."
        return 1
    fi
    
    if [ "$page" -lt 1 ] || [ "$page" -gt "$TOTAL_PAGES" ]; then
        echo -e "${RED}Error: Page out of range (1-$TOTAL_PAGES)${RESET}"
        read -n 1 -s -p "Press any key to continue..."
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
                        echo -e "${RED}No data to view${RESET}"
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
                'k'|'K')
                    stty "$original_stty" 2>/dev/null
                    set_filter "keyword"
                    stty -echo -icanon time 0 min 0 2>/dev/null
                    ALL_LOGS_FILE=$(read_logs)
                    ;;
                'm'|'M')
                    stty "$original_stty" 2>/dev/null
                    set_filter "subdir"
                    stty -echo -icanon time 0 min 0 2>/dev/null
                    ALL_LOGS_FILE=$(read_logs)
                    ;;
                'c'|'C')
                    FILTER_TIME=""
                    FILTER_REQUEST_ID=""
                    FILTER_USER_ID=""
                    FILTER_KEYWORD=""
                    FILTER_SUBDIR=""
                    # 恢复默认时间范围
                    START_TIME=$(date +"%Y-%m-%d 00:00:00")
                    END_TIME=$(date +"%Y-%m-%d 23:59:59")
                    START_TS=$(date -j -f "%Y-%m-%d %H:%M:%S" "$START_TIME" +%s 2>/dev/null || date -d "$START_TIME" +%s 2>/dev/null)
                    END_TS=$(date -j -f "%Y-%m-%d %H:%M:%S" "$END_TIME" +%s 2>/dev/null || date -d "$END_TIME" +%s 2>/dev/null)
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
    
    # 处理命令行参数中的时间范围
    if [[ "$START_TIME" == *"-"* ]] || [[ "$START_TIME" == *","* ]]; then
        process_time_range "$START_TIME"
    fi
    
    # 转换时间戳
    START_TS=$(date -j -f "%Y-%m-%d %H:%M:%S" "$START_TIME" +%s 2>/dev/null || date -d "$START_TIME" +%s 2>/dev/null)
    END_TS=$(date -j -f "%Y-%m-%d %H:%M:%S" "$END_TIME" +%s 2>/dev/null || date -d "$END_TIME" +%s 2>/dev/null)
    
    # 确保 END_TS >= START_TS
    if [ "$END_TS" -lt "$START_TS" ]; then
        echo -e "${RED}错误: 结束时间不能早于开始时间${RESET}"
        exit 1
    fi
    
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
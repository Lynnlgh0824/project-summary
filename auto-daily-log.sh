#!/bin/bash
# 项目日志自动生成脚本
# 检测Git变更，智能生成今日工作日志

PROJECT_DIR="/Users/yuzhoudeshengyin/Documents/my_project"
LOG_DIR="$PROJECT_DIR/project summary"
DATA_FILE="$LOG_DIR/project-log-data.json"
REPORT_DIR="$LOG_DIR/daily-reports"
TODAY=$(date +%Y-%m-%d)

# 创建报告目录
mkdir -p "$REPORT_DIR"

echo "========================================"
echo "项目日志自动生成系统"
echo "日期: $TODAY"
echo "========================================"

# 1. 检查各项目的Git变更
check_git_changes() {
    local project_path=$1
    local project_name=$2
    cd "$project_path" 2>/dev/null || return

    # 检查是否有Git仓库
    if [ ! -d ".git" ]; then
        return
    fi

    # 获取今天的提交（从昨天0点到今天23:59）
    local yesterday=$(date -v-1d +%Y-%m-%d)
    local commits=$(git log --since="$yesterday 00:00:00" --until="$TODAY 23:59:59" --pretty=format:"%h|%s|%an|%ai" --reverse)

    if [ -z "$commits" ]; then
        return
    fi

    echo "发现 $project_name 的变更："
    echo "$commits" | while IFS='|' read -r hash msg author time; do
        echo "  - $hash: $msg"
    done
}

# 2. 检测文件修改
check_file_changes() {
    local project_path=$1
    local project_name=$2
    cd "$project_path" 2>/dev/null || return

    if [ ! -d ".git" ]; then
        return
    fi

    # 获取今天修改的文件
    local yesterday=$(date -v-1d +%Y-%m-%d)
    local changed_files=$(git diff --name-only --since="$yesterday 00:00:00" --until="$TODAY 23:59:59")

    if [ -n "$changed_files" ]; then
        echo "修改的文件："
        echo "$changed_files" | while read file; do
            echo "  - $file"
        done
    fi
}

# 3. 分析变更类型
analyze_change_type() {
    local commit_msg=$1

    if echo "$commit_msg" | grep -qi "修复\|fix\|bug"; then
        echo "fix"
    elif echo "$commit_msg" | grep -qi "添加\|新增\|feat\|功能"; then
        echo "feature"
    elif echo "$commit_msg" | grep -qi "优化\|改进\|improve\|优化"; then
        echo "improvement"
    elif echo "$commit_msg" | grep -qi "文档\|doc\|readme\|说明"; then
        echo "docs"
    else
        echo "other"
    fi
}

# 4. 生成日志JSON
generate_log_json() {
    local project_id=$1
    local project_name=$2
    local project_path=$3

    cd "$project_path" 2>/dev/null || return

    if [ ! -d ".git" ]; then
        return
    fi

    local yesterday=$(date -v-1d +%Y-%m-%d)
    local commits=$(git log --since="$yesterday 00:00:00" --until="$TODAY 23:59:59" --pretty=format:"%s" --reverse)

    if [ -z "$commits" ]; then
        return
    fi

    # 构建日志条目
    echo "{"
    echo "  \"id\": \"$(date +%s)000\","
    echo "  \"projectId\": \"$project_id\","
    echo "  \"projectName\": \"$project_name\","
    echo "  \"date\": \"$TODAY\","
    echo "  \"datetime\": \"$(date '+%Y/%m/%d %H:%M:%S')\","
    echo "  \"title\": \"📝 $project_name - 今日工作\","

    # 分析提交类型
    local first_commit=$(echo "$commits" | head -1)
    local change_type=$(analyze_change_type "$first_commit")

    # 根据类型设置标签
    case $change_type in
        fix)
            echo "  \"tags\": [{\"name\": \"🔧 修复\", \"type\": \"fix\"}],"
            ;;
        feature)
            echo "  \"tags\": [{\"name\": \"✨ 新功能\", \"type\": \"feature\"}],"
            ;;
        improvement)
            echo "  \"tags\": [{\"name\": \"🚀 优化\", \"type\": \"improvement\"}],"
            ;;
        docs)
            echo "  \"tags\": [{\"name\": \"📚 文档\", \"type\": \"docs\"}],"
            ;;
        *)
            echo "  \"tags\": [{\"name\": \"📝 其他\", \"type\": \"other\"}],"
            ;;
    esac

    # 提取提交信息作为任务项
    echo "  \"items\": ["
    echo "$commits" | while read msg; do
        # 转义特殊字符
        msg=$(echo "$msg" | sed 's/"/\\"/g')
        echo "    \"✅ $msg\","
    done | sed '$ s/,$//'
    echo "  ],"
    echo "  \"code\": null"
    echo "}"
}

# 5. 生成今日工作报告
generate_daily_report() {
    local report_file="$REPORT_DIR/$TODAY.md"

    echo "# 每日工作报告" > "$report_file"
    echo "" >> "$report_file"
    echo "**日期**: $TODAY" >> "$report_file"
    echo "**生成时间**: $(date '+%H:%M:%S')" >> "$report_file"
    echo "" >> "$report_file"
    echo "---" >> "$report_file"
    echo "" >> "$report_file"
    echo "## 📊 今日工作概览" >> "$report_file"
    echo "" >> "$report_file"

    # 遍历所有项目
    for project in "project-organization" "english-learning-tts" "chiang-mai-activities" "aisaas-video" "clawdbot-railway" "skills-development"; do
        case $project in
            "project-organization")
                project_name="项目组织与管理"
                project_path="$PROJECT_DIR/project summary"
                ;;
            "english-learning-tts")
                project_name="英语学习TTS系统"
                project_path="$PROJECT_DIR/english-learning"
                ;;
            "chiang-mai-activities")
                project_name="清迈活动策划"
                project_path="$PROJECT_DIR/Chiengmai"
                ;;
            "aisaas-video")
                project_name="AI SaaS视频项目"
                project_path="$PROJECT_DIR/aisaasvideo"
                ;;
            "clawdbot-railway")
                project_name="Clawdbot Railway模板"
                project_path="$PROJECT_DIR/clawdbot-railway-template"
                ;;
            "skills-development")
                project_name="技能开发与学习"
                project_path="$PROJECT_DIR/skills"
                ;;
        esac

        # 检查Git变更
        local has_changes=false
        cd "$project_path" 2>/dev/null || continue

        if [ -d ".git" ]; then
            local yesterday=$(date -v-1d +%Y-%m-%d)
            local commits=$(git log --since="$yesterday 00:00:00" --until="$TODAY 23:59:59" --oneline)

            if [ -n "$commits" ]; then
                has_changes=true
                echo "### $project_name" >> "$report_file"
                echo "" >> "$report_file"
                echo "**提交记录**：" >> "$report_file"
                echo "\`\`\" >> "$report_file"
                echo "$commits" >> "$report_file"
                echo "\`\`\" >> "$report_file"
                echo "" >> "$report_file"

                # 获取修改的文件
                local changed_files=$(git diff --stat --since="$yesterday 00:00:00" --until="$TODAY 23:59:59")
                if [ -n "$changed_files" ]; then
                    echo "**文件变更**：" >> "$report_file"
                    echo "\`\`\" >> "$report_file"
                    echo "$changed_files" >> "$report_file"
                    echo "\`\`\" >> "$report_file"
                    echo "" >> "$report_file"
                fi
            fi
        fi
    done

    echo "✅ 每日报告已生成: $report_file"
}

# 主执行流程
main() {
    cd "$PROJECT_DIR"

    echo "1. 检查项目变更..."
    # 检查各个项目
    check_git_changes "$PROJECT_DIR/project summary" "项目组织与管理"
    check_git_changes "$PROJECT_DIR/english-learning" "英语学习TTS系统"
    check_git_changes "$PROJECT_DIR/Chiengmai" "清迈活动策划"
    check_git_changes "$PROJECT_DIR/aisaasvideo" "AI SaaS视频项目"
    check_git_changes "$PROJECT_DIR/clawdbot-railway-template" "Clawdbot Railway模板"
    check_git_changes "$PROJECT_DIR/skills" "技能开发与学习"

    echo ""
    echo "2. 生成每日报告..."
    generate_daily_report

    echo ""
    echo "3. 检查数据文件..."
    if [ -f "$DATA_FILE" ]; then
        echo "✅ 数据文件存在: $DATA_FILE"
        # 可以在这里添加自动打开浏览器的逻辑
    else
        echo "⚠️  数据文件不存在，请先打开 project-log.html 创建数据文件"
    fi

    echo ""
    echo "✅ 自动日志检测完成！"
    echo ""
    echo "📋 查看每日报告: cat $REPORT_DIR/$TODAY.md"
}

# 执行主函数
main

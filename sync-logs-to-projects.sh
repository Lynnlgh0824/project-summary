#!/bin/bash
# 将项目日志系统的工作日志同步到对应项目的目录结构中

PROJECT_SYSTEM_PATH="/Users/yuzhoudeshengyin/Documents/my_project/project-summary"
HTML_FILE="$PROJECT_SYSTEM_PATH/项目日志系统.html"

# 项目路径配置
declare -A PROJECT_PATHS=(
    ["project-organization"]="/Users/yuzhoudeshengyin/Documents/my_project/project-summary/"
    ["english-learning-tts"]="/Users/yuzhoudeshengyin/Documents/my_project/english-learning/"
    ["chiang-mai-activities"]="/Users/yuzhoudeshengyin/Documents/my_project/Chiengmai/"
    ["aisaas-video"]="/Users/yuzhoudeshengyin/Desktop/AI相关项目/"
    ["clawdbot-railway"]="/Users/yuzhoudeshengyin/Documents/my_project/clawdbot-railway/"
    ["skills-development"]="/Users/yuzhoudeshengyin/Documents/my_project/skills/"
    ["planning-system"]="/Users/yuzhoudeshengyin/Documents/my_project/"
)

# 项目名称配置
declare -A PROJECT_NAMES=(
    ["project-organization"]="🗂️ 项目管理汇总"
    ["english-learning-tts"]="🎧 英语朗读学习"
    ["chiang-mai-activities"]="🏝️ 清迈活动平台"
    ["aisaas-video"]="🎥 AI SaaS 视频"
    ["clawdbot-railway"]="🤖 Clawdbot"
    ["skills-development"]="⚡ 技能开发与学习"
    ["planning-system"]="📋 Planning 系统"
)

echo "📤 开始同步工作日志到项目目录..."
echo ""

# 提取 localStorage 中的日志数据
LOGS=$(grep -o 'localStorage.getItem("project_logs")' "$HTML_FILE" | head -1)

if [ -z "$LOGS" ]; then
    echo "⚠️ 无法从 HTML 文件提取日志"
    echo "💡 请使用浏览器控制台导出日志"
    echo ""
    echo "步骤："
    echo "1. 打开 项目日志系统.html"
    echo "2. 按 F12 打开控制台"
    echo "3. 运行: console.log(localStorage.getItem('project_logs'))"
    echo "4. 复制输出的 JSON 数据"
    echo "5. 粘贴到临时文件: /tmp/project_logs.json"
    echo ""
    read -p "是否已创建日志文件? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 检查临时日志文件
if [ ! -f "/tmp/project_logs.json" ]; then
    echo "❌ 未找到日志文件: /tmp/project_logs.json"
    echo ""
    echo "请先创建日志文件，然后重新运行此脚本"
    exit 1
fi

echo "📊 开始处理日志..."
echo ""

# 遍历每个项目
for PROJECT_ID in "${!PROJECT_PATHS[@]}"; do
    PROJECT_PATH="${PROJECT_PATHS[$PROJECT_ID]}"
    PROJECT_NAME="${PROJECT_NAMES[$PROJECT_ID]}"

    echo "处理: $PROJECT_NAME"
    echo "路径: $PROJECT_PATH"

    # 创建必要的目录结构
    mkdir -p "$PROJECT_PATH/memory"
    mkdir -p "$PROJECT_PATH/docs"

    # 创建日志文件
    LOG_FILE="$PROJECT_PATH/memory/work-log.md"

    if [ -f "$LOG_FILE" ]; then
        echo "  ⚠️ 文件已存在，备份中..."
        cp "$LOG_FILE" "$LOG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    fi

    echo "  ✅ 日志将写入: memory/work-log.md"
    echo ""
done

echo "✅ 目录结构已创建！"
echo ""
echo "下一步："
echo "1. 在浏览器控制台运行 export-logs-to-projects.js"
echo "2. 下载各个项目的日志文件"
echo "3. 将下载的文件移动到对应项目的 memory/ 目录"
echo ""
echo "或使用 Node.js 自动化脚本（推荐）"

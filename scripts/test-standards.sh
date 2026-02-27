#!/bin/bash

echo "=== 规范集成测试报告 ==="
echo "测试时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo

# 项目列表
projects=("Chiengmai" "aisaasvideo" "english-learning" "project-summary" "clawdbot-railway-template")

# 统计变量
total_checks=0
passed_checks=0
failed_checks=0

# 检查函数
check_item() {
    local project=$1
    local item=$2
    local check_cmd=$3
    
    total_checks=$((total_checks + 1))
    
    if eval "$check_cmd" > /dev/null 2>&1; then
        echo "  ✅ $item"
        passed_checks=$((passed_checks + 1))
        return 0
    else
        echo "  ❌ $item (缺失)"
        failed_checks=$((failed_checks + 1))
        return 1
    fi
}

# 遍历所有项目
for project in "${projects[@]}"; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📁 $project"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 1. CLAUDE.md 检查
    echo "📄 CLAUDE.md:"
    check_item "$project" "文件存在" "[ -f '$project/CLAUDE.md' ]"
    if [ -f "$project/CLAUDE.md" ]; then
        check_item "$project" "包含 Workflow Rules" "grep -q 'Workflow Rules' '$project/CLAUDE.md'"
        check_item "$project" "包含项目边界控制" "grep -q 'Project Identity' '$project/CLAUDE.md'"
    fi
    
    # 2. docs/WORKFLOW.md 检查
    echo "📄 docs/WORKFLOW.md:"
    check_item "$project" "文件存在" "[ -f '$project/docs/WORKFLOW.md' ]"
    if [ -f "$project/docs/WORKFLOW.md" ]; then
        check_item "$project" "包含7层能力模型" "grep -q '能力要求模型' '$project/docs/WORKFLOW.md'"
        check_item "$project" "包含产品思维" "grep -q '产品思维' '$project/docs/WORKFLOW.md'"
        check_item "$project" "包含标准工作流程" "grep -q '标准工作流程' '$project/docs/WORKFLOW.md'"
    fi
    
    # 3. memory/ 系统检查
    echo "📦 memory/ 系统:"
    check_item "$project" "目录存在" "[ -d '$project/memory' ]"
    if [ -d "$project/memory" ]; then
        check_item "$project" "project-memory.md" "[ -f '$project/memory/project-memory.md' ]"
        check_item "$project" "progress.md" "[ -f '$project/memory/progress.md' ]"
        check_item "$project" "decisions.md" "[ -f '$project/memory/decisions.md' ]"
        check_item "$project" "mistakes.md" "[ -f '$project/memory/mistakes.md' ]"
    fi
    
    # 4. tests/ 结构检查
    echo "🧪 tests/ 结构:"
    check_item "$project" "目录存在" "[ -d '$project/tests' ]"
    if [ -d "$project/tests" ]; then
        check_item "$project" "tests/unit/" "[ -d '$project/tests/unit' ]"
        check_item "$project" "tests/integration/" "[ -d '$project/tests/integration' ]"
        check_item "$project" "tests/e2e/" "[ -d '$project/tests/e2e' ]"
    fi
    
    # 5. docs/guides/ 检查
    echo "📚 docs/guides/:"
    check_item "$project" "目录存在" "[ -d '$project/docs/guides' ]"
    
    # 6. 配置文件检查
    echo "⚙️ 配置文件:"
    check_item "$project" ".gitignore" "[ -f '$project/.gitignore' ]"
    check_item "$project" ".env.example" "[ -f '$project/.env.example' ]"
    
    echo
done

# 汇总报告
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 测试汇总"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "总检查项: $total_checks"
echo "✅ 通过: $passed_checks"
echo "❌ 失败: $failed_checks"
echo "通过率: $(echo "scale=1; $passed_checks * 100 / $total_checks" | bc)%"
echo

if [ $failed_checks -eq 0 ]; then
    echo "🎉 所有项目规范集成完成！"
    exit 0
else
    echo "⚠️ 发现 $failed_checks 个问题，需要修复"
    exit 1
fi

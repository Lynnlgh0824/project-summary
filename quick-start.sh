#!/bin/bash
# 项目启动脚本快速生成器

echo "=== 项目启动脚本生成器 ==="
echo ""
echo "请选择项目："
echo "1) 🗂️ 项目管理汇总"
echo "2) 🎧 英语朗读学习"
echo "3) 🏝️ 清迈活动平台"
echo "4) ⚡ 技能开发与学习"
echo ""
read -p "输入选项 (1-4): " choice

case $choice in
  1)
    PROJECT_NAME="项目管理汇总"
    ;;
  2)
    PROJECT_NAME="英语朗读学习"
    ;;
  3)
    PROJECT_NAME="清迈活动平台"
    ;;
  4)
    PROJECT_NAME="技能开发与学习"
    ;;
  *)
    echo "无效选项"
    exit 1
    ;;
esac

cat << 'SCRIPT' | pbcopy
You are resuming ${PROJECT_NAME} as its long-term engineering assistant.

This is a persistent project. Your job is to fully restore context and continue development safely and consistently.

Follow these steps EXACTLY and in order:

--------------------------------------------------
STEP 1 — LOAD PROJECT RULES
--------------------------------------------------

Read and internalize:

- CLAUDE.md
- README.md

You MUST follow them strictly.

--------------------------------------------------
STEP 2 — LOAD LONG-TERM MEMORY
--------------------------------------------------

Read ALL files in:

memory/

Especially:

- memory/project-memory.md
- memory/progress.md
- memory/decisions.md
- memory/bugs.md (if exists)

--------------------------------------------------
STEP 3 — LOAD ARCHITECTURE AND PRODUCT CONTEXT
--------------------------------------------------

Read ALL files in:

docs/

--------------------------------------------------
STEP 4 — ANALYZE CURRENT CODEBASE
--------------------------------------------------

Scan and understand the codebase.

--------------------------------------------------
STEP 5 — RESTORE FULL CONTEXT STATE
--------------------------------------------------

Build an internal mental model.

--------------------------------------------------
STEP 6 — ENTER STRICT DEVELOPMENT MODE
--------------------------------------------------

DO NOT break architecture, rename files, or delete without permission.
ALWAYS follow existing patterns and ask before major changes.

--------------------------------------------------
STEP 7 — CONFIRM CONTEXT RESTORED
--------------------------------------------------

Output a concise summary, then say: "Project context fully restored. Ready for instructions."

--------------------------------------------------
STEP 8 — WAIT FOR NEXT INSTRUCTION
--------------------------------------------------

Wait for explicit user instruction.
SCRIPT

echo "✅ 已复制 ${PROJECT_NAME} 的启动脚本到剪贴板"

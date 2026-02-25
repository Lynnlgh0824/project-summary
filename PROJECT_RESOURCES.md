# 项目资源管理清单

> ⚠️ **强制规则**：在创建任何新工具前，必须先搜索现有资源！

---

## 📋 现有资源清单

### 🧪 测试工具

| 工具名称 | 文件路径 | 用途 | 使用方法 |
|---------|---------|------|---------|
| TTS代码验证 | `../english-learning/validate-tts-code.js` | TTS代码静态检查 | `node validate-tts-code.js` |
| TTS自动化测试 | `../english-learning/archives/test-files/auto-test-runner.html` | 完整TTS测试套件 | 浏览器打开，点击测试按钮 |
| 项目全链路测试 | `../english-learning/test-full-project.js` | 项目完整性检查 | `node test-full-project.js` |

### 📝 文档资源

| 文档名称 | 文件路径 | 说明 |
|---------|---------|------|
| 项目日志 | `project-log.html` | 工作日志记录系统 |
| 项目工具清单 | `TEST_TOOLS.md` | 已有测试工具清单 |
| 项目资源管理 | `PROJECT_RESOURCES.md` | 本文件 |
| TTS故障排除 | `TTS_TROUBLESHOOTING.md` | TTS功能诊断和解决方法 |
| 修复报告 | `DAILY_FIX_REPORT_2026-02-07.md` | TTS功能修复总结报告 |

### 🔧 脚本工具

| 脚本名称 | 文件路径 | 用途 |
|---------|---------|------|
| 自动日志服务器 | `auto-log-server.sh` | 智能日志API服务 |
| 日志服务器脚本 | `auto-log-server.js` | Node.js服务器实现 |

---

## ⚠️ 创建新工具前的检查清单

### 步骤1：搜索现有资源
```bash
# 搜索测试工具
find . -name "*test*.html" -o -name "*test*.js" -o -name "*validate*.js"

# 搜索已有文档
find . -name "PROJECT_RESOURCES.md" -o -name "TEST_TOOLS.md"

# 搜索脚本工具
find . -name "*.sh" -o -name "*server*.js"
```

### 步骤2：评估现有工具
- [ ] 现有工具能解决问题？
- [ ] 是否需要扩展现有工具？
- [ ] 确实需要创建新工具？

### 步骤3：记录新工具（仅在步骤2确认后）
- 工具名称：
- 创建原因：
- 功能说明：
- 文件路径：

---

## 🎯 项目特定说明

### TTS学习系统
- **主要工具**: auto-test-runner.html
- **验证工具**: validate-tts-code.js
- **学习记录**: english-learning/records/*.html

### 日志系统
- **主文件**: project-log.html
- **功能**: 按项目和日期记录工作日志
- **自动化**: 支持智能生成、待办事项管理

---

## 🔄 更新日志

- 2026-02-07: 创建项目资源管理系统
- 2026-02-07: 记录现有TTS和日志系统工具

# PROJECT_STRUCTURE.md - 项目结构详解

> **版本**: v1.0.0
> **最后更新**: 2026-02-25
> **项目根目录**: `/Users/yuzhoudeshengyin/Documents/my_project/project-summary`

---

## 📁 目录结构

### 完整目录树

```
project-summary/
├── 📄 核心应用文件
│   ├── project-log.html              # 项目日志管理系统 ⭐
│   ├── check-todos.html              # 待办清单数据恢复工具
│   └── 项目日志系统.html                # 项目日志系统（中文命名）
│
├── 📚 文档目录
│   ├── README.md                     # 项目说明文档 ⭐
│   ├── PROJECT_RULES.md              # 项目规则和约定 ⭐
│   ├── PROJECT_CONTEXT.md            # 项目上下文 ⭐
│   ├── PROJECT_STRUCTURE.md          # 项目结构详解 ⭐ (本文件)
│   ├── PROJECT-SUMMARY.md            # 项目总结
│   ├── STRUCTURE.md                  # 结构说明
│   ├── PROJECT_RESOURCES.md          # 项目资源
│   ├── CHANGELOG.md                  # 变更日志 ⭐
│   ├── AUTO-LOG-SYSTEM.md            # 自动日志系统文档
│   ├── TTS_TROUBLESHOOTING.md        # TTS 故障排除
│   ├── DAILY_FIX_REPORT_*.md         # 日常修复报告
│   └── MOLTBOOK_AUTH_GUIDE.md        # Moltbook 认证指南
│
├── 🔧 配置文件
│   ├── .gitignore                    # Git 忽略规则
│   ├── .env.example                  # 环境变量示例
│   ├── .project-cache.json           # 项目缓存
│   └── config/
│       └── default.json              # 默认配置
│
├── 📊 数据文件
│   ├── data.json                     # 项目数据
│   └── project-log.html.backup       # 备份文件
│
├── 🤖 自动化脚本
│   ├── auto-daily-log.sh             # 自动日志 Shell 脚本
│   ├── auto-log-server.js            # 自动日志 Node.js 服务
│   ├── auto-log-server.sh            # 服务启动脚本
│   └── fix-and-add-log.js            # 修复和添加日志脚本
│
├── 📁 子目录
│   ├── learnings/                    # 学习资源
│   │   ├── ai-agent-memory-system.md # AI Agent 内存系统
│   │   ├── moltbook-auth-integration.js  # Moltbook 认证集成
│   │   ├── moltbook-auth-test.js     # 认证测试脚本
│   │   ├── MOLTBOOK_AUTH_GUIDE.md    # 认证指南
│   │   └── .env.example              # 环境变量示例
│   │
│   ├── daily-reports/                # 日报目录
│   │   └── 2026-02-06.md             # 示例日报
│   │
│   └── .claude/                      # Claude AI 编辑器配置
│       └── settings.local.json       # 本地设置
│
└── 📦 Git 相关
    └── .git/                         # Git 仓库目录
```

---

## 📄 文件组织

### 核心应用文件

#### [project-log.html](./project-log.html)
**用途**: 项目日志管理系统主界面

**功能**:
- 多项目日志记录
- 标签分类（新功能、Bug修复、优化等）
- 代码片段记录
- 数据导出/导入
- 自动保存到本地文件

**技术栈**: HTML5 + CSS3 + 原生 JavaScript

**关键 API**:
- File System Access API (文件读写)
- LocalStorage (数据缓存)
- JSON (数据格式)

---

#### [check-todos.html](./check-todos.html)
**用途**: 待办清单数据恢复工具

**功能**:
- 检查浏览器中的待办数据
- 数据统计和可视化
- 导出/导入备份数据
- 数据清空功能

**数据结构**:
```javascript
{
  version: "1.0",
  exportTime: "2026-02-25T...",
  todos: {},        // 待办清单
  projects: [],     // 项目列表
  logs: []          // 工作日志
}
```

---

#### 项目日志系统.html
**用途**: 项目日志系统（中文命名版本）

**说明**: 与 `project-log.html` 功能相同，使用中文命名便于识别

---

### 文档目录

#### [README.md](./README.md)
**用途**: 项目使用说明

**内容**:
- 目录结构说明
- 自动保存机制
- 快速开始指南
- 数据文件格式
- 注意事项

**维护**: 每次功能更新时同步更新

---

#### [PROJECT_RULES.md](./PROJECT_RULES.md)
**用途**: 项目规则和约定

**内容**:
- 代码规范
- Git 工作流
- 文件命名规范
- 注释规范
- 安全规范

**目标读者**: 项目开发者

---

#### [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)
**用途**: 项目上下文

**内容**:
- 项目背景
- 技术架构
- 设计理念
- 核心功能
- 用户场景

**目标读者**: 新加入团队成员、项目干系人

---

#### [PROJECT-SUMMARY.md](./PROJECT-SUMMARY.md)
**用途**: 项目总结文档

**内容**:
- 项目概述
- 今日完成的工作
- 当前状态
- 下一步计划

**更新频率**: 每日或每次重要变更后

---

#### [CHANGELOG.md](./CHANGELOG.md)
**用途**: 版本变更日志

**内容**:
- 版本历史
- 功能更新
- Bug 修复记录
- 不兼容变更

**维护**: 每次 Commit 同步更新

---

### 配置文件

#### [.gitignore](./.gitignore)
**用途**: Git 忽略规则

**关键规则**:
```gitignore
# 环境变量
.env
.env.*

# AI 模型文件
*.gguf
*.bin
*.pt

# 编辑器配置
.claude/
.cursor/

# 系统文件
.DS_Store
```

---

#### [config/default.json](./config/default.json)
**用途**: 默认配置

**内容示例**:
```json
{
  "app": {
    "name": "Project Summary",
    "version": "1.0.0"
  },
  "storage": {
    "fileName": "project-log-data.json"
  }
}
```

---

### 自动化脚本

#### [auto-daily-log.sh](./auto-daily-log.sh)
**用途**: 自动日志记录 Shell 脚本

**功能**:
- 检测 Git 仓库变更
- 自动生成日志条目
- 调用主程序保存

**使用方式**:
```bash
./auto-daily-log.sh
```

---

#### [auto-log-server.js](./auto-log-server.js)
**用途**: 自动日志 Node.js 服务

**功能**:
- HTTP 服务
- 配置文件驱动
- Git 变更捕获
- RESTful API

**端口**: 默认 3000

**启动方式**:
```bash
node auto-log-server.js
# 或使用脚本
./auto-log-server.sh
```

---

### 子目录说明

#### `/learnings/`
**用途**: 学习资源和文档

**内容**:
- AI Agent 内存系统文档
- Moltbook 认证集成代码
- 认证测试脚本

---

#### `/daily-reports/`
**用途**: 日报存档

**命名格式**: `YYYY-MM-DD.md`

**内容模板**:
```markdown
# 日报 - YYYY-MM-DD

## 今日完成
- [x] 任务1
- [x] 任务2

## 遇到的问题
- 问题描述

## 明日计划
- [ ] 计划1
```

---

#### `/.claude/`
**用途**: Claude AI 编辑器配置

**内容**:
- 本地项目设置
- 自定义规则
- 技能配置

---

## 🏗️ 模块说明

### 核心模块架构

```
┌─────────────────────────────────────────┐
│            UI 层 (HTML)                 │
├─────────────────────────────────────────┤
│  • project-log.html                     │
│  • check-todos.html                     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         逻辑层 (JavaScript)             │
├─────────────────────────────────────────┤
│  • 数据管理模块                          │
│  • 文件操作模块                          │
│  • UI 交互模块                           │
│  • 标签系统                              │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         存储层 (Storage)                │
├─────────────────────────────────────────┤
│  • LocalStorage                         │
│  • File System Access API               │
│  • JSON 文件                             │
└─────────────────────────────────────────┘
```

### 数据管理模块

**文件**: project-log.html 中的 JavaScript 部分

**职责**:
- 数据加载和保存
- 数据验证和转换
- 缓存管理

**关键函数**:
```javascript
loadData()          // 加载数据
saveData()          // 保存数据
validateData()      // 验证数据
exportData()        // 导出数据
importData()        // 导入数据
```

---

### 文件操作模块

**职责**:
- 文件系统访问
- 读写操作
- 错误处理

**关键 API**:
```javascript
window.showSaveFilePicker()  // 选择保存位置
window.showOpenFilePicker()  // 选择打开文件
fileHandle.createWritable()  // 创建可写流
```

---

### 标签系统

**支持标签**:
| 标签 | 类型 | 颜色 | 说明 |
|------|------|------|------|
| ✨ 新功能 | feature | 绿色 | 新增功能 |
| 🐛 Bug修复 | fix | 红色 | Bug 修复 |
| ⚡ 性能优化 | perf | 蓝色 | 性能提升 |
| ♻️ 代码重构 | refactor | 紫色 | 代码重构 |
| 📝 文档更新 | docs | 黄色 | 文档更新 |
| 🎨 样式调整 | style | 粉色 | 样式修改 |
| ✅ 测试相关 | test | 青色 | 测试相关 |
- 🔧 构建/工具 | chore | 灰色 | 构建/工具 |

---

## 🔄 数据流向

### 数据保存流程

```
用户输入 (表单)
    │
    ▼
构建数据对象
    │
    ▼
保存到 LocalStorage (运行时缓存)
    │
    ▼
写入 JSON 文件 (持久化)
    │
    ▼
显示成功提示
```

### 数据加载流程

```
页面加载
    │
    ▼
读取 LocalStorage
    │
    ├─→ 有数据 → 直接使用
    │
    └─→ 无数据 → 提示打开数据文件
              │
              ▼
         用户选择文件
              │
              ▼
         解析 JSON 数据
              │
              ▼
         保存到 LocalStorage
              │
              ▼
         渲染 UI
```

---

## 📦 依赖关系

### 外部依赖

**无外部依赖** - 纯原生实现

### 浏览器要求

| 特性 | 最低版本 | 说明 |
|------|----------|------|
| File System Access API | Chrome 86+ | 文件读写 |
| LocalStorage | All | 数据缓存 |
| ES6+ | Modern browsers | JavaScript 特性 |
| CSS Grid | All | 布局 |
| CSS Flexbox | All | 布局 |

---

## 🎯 扩展指南

### 添加新功能

1. **在 HTML 中添加 UI**
```html
<button onclick="newFeature()">新功能</button>
```

2. **在 JavaScript 中实现逻辑**
```javascript
function newFeature() {
    // 功能实现
}
```

3. **更新文档**
- README.md
- CHANGELOG.md
- PROJECT_CONTEXT.md (如需要)

---

### 添加新标签

编辑 `project-log.html` 中的标签定义:

```javascript
const TAGS = [
    { name: '✨ 新功能', type: 'feature' },
    { name: '🐛 Bug修复', type: 'fix' },
    // 添加新标签
    { name: '🔒 安全相关', type: 'security' },
];
```

---

## 📊 文件大小统计

| 类型 | 大小范围 | 说明 |
|------|----------|------|
| HTML 文件 | ~50-100 KB | 包含 CSS 和 JavaScript |
| JSON 数据 | ~10-100 KB | 取决于日志数量 |
| 文档文件 | ~5-20 KB | Markdown 格式 |
| 脚本文件 | ~1-10 KB | Shell/Node.js 脚本 |

---

**文档版本**: v1.0.0
**最后更新**: 2026-02-25
**维护者**: Project Team

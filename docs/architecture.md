# Project Summary - 系统架构

> Version: 1.0 | Last Updated: 2026-06-01

---

## 1. 系统架构总览

```
┌─────────────────────────────────────────────────────┐
│                    用户浏览器                          │
│  ┌───────────────────────────────────────────────┐  │
│  │              UI 层 (HTML + CSS)                │  │
│  │  index.html (单页应用, 全部内联)                │  │
│  └─────────────────────┬─────────────────────────┘  │
│                        │                             │
│  ┌─────────────────────▼─────────────────────────┐  │
│  │            业务逻辑层 (JavaScript ES6+)         │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐   │  │
│  │  │ 项目管理  │ │ 日志管理  │ │ Todo 管理    │   │  │
│  │  └──────────┘ └──────────┘ └──────────────┘   │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐   │  │
│  │  │ 搜索引擎  │ │ Git 集成  │ │ 数据导入导出  │   │  │
│  │  └──────────┘ └──────────┘ └──────────────┘   │  │
│  └─────────────────────┬─────────────────────────┘  │
│                        │                             │
│  ┌─────────────────────▼─────────────────────────┐  │
│  │           数据层                                │  │
│  │  ┌──────────────┐  ┌───────────────────────┐  │  │
│  │  │ localStorage │  │ File System Access API │  │  │
│  │  │ (内存缓存)    │  │ (持久化 JSON 文件)     │  │  │
│  │  └──────────────┘  └───────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 2. 核心模块

### 2.1 项目管理模块

```
┌─────────────────────────┐
│     ProjectManager       │
│                          │
│  projects[]              │
│  ├── id                  │
│  ├── name                │
│  ├── color               │
│  ├── logs[]              │
│  └── todos[]             │
│                          │
│  createProject()         │
│  deleteProject()         │
│  switchProject()         │
│  reorderProjects()       │  ← v2.0 拖拽排序
└─────────────────────────┘
```

### 2.2 日志管理模块

```
┌─────────────────────────┐
│       LogManager         │
│                          │
│  logs[]                  │
│  ├── id                  │
│  ├── title               │
│  ├── content             │
│  ├── tags[]              │
│  ├── codeSnippets[]      │
│  ├── createdAt           │
│  └── updatedAt           │
│                          │
│  createLog()             │
│  updateLog()             │
│  deleteLog()             │
│  searchLogs()            │
│  filterByTag()           │
│  filterByDate()          │
└─────────────────────────┘
```

### 2.3 数据持久化模块

```
┌─────────────────────────┐
│    DataPersistence       │
│                          │
│  ┌────────────────────┐ │
│  │ File System Access  │ │  ← 主要存储
│  │ API → JSON 文件     │ │
│  └────────────────────┘ │
│           │              │
│           ▼ 降级         │
│  ┌────────────────────┐ │
│  │ localStorage        │ │  ← 备用存储
│  └────────────────────┘ │
│                          │
│  save()                  │
│  load()                  │
│  autoSave()              │  ← 每 30 分钟
│  exportJSON()            │
│  importJSON()            │
│  restoreFromBackup()     │
└─────────────────────────┘
```

---

## 3. 数据模型

```javascript
// 项目
Project {
  id: string,
  name: string,
  color: string,        // #3B82F6, #EF4444, etc.
  createdAt: timestamp,
  updatedAt: timestamp
}

// 日志
Log {
  id: string,
  projectId: string,
  title: string,
  content: string,      // 支持 Markdown
  tags: string[],       // ['feature', 'bugfix', 'perf', ...]
  codeSnippets: [{
    language: string,
    code: string
  }],
  createdAt: timestamp,
  updatedAt: timestamp
}

// 待办
Todo {
  id: string,
  projectId: string,
  text: string,
  completed: boolean,
  priority: 'high' | 'medium' | 'low',
  linkedLogId: string?,  // 可选关联日志
  createdAt: timestamp
}
```

---

## 4. 文件结构

```
project-summary/
├── index.html              # 单页应用 (全部内联 CSS + JS)
├── data.json               # 持久化数据文件
├── diary-data.json          # 日记数据
├── scripts/
│   ├── auto-daily-log.js    # 自动生成日志
│   ├── export-logs.js       # 导出日志
│   ├── extract-todos.js     # 提取待办
│   ├── sync-diary.js        # 同步日记
│   └── git-log-capture.js   # Git 日志捕获
├── data/                    # 备份文件目录
├── docs/                    # 文档
└── tests/                   # 测试
```

---

## 5. 交互流程

### 创建日志

```
用户点击"新建日志"
    → 弹出编辑器（标题 + 内容 + 标签 + 代码块）
    → 输入内容
    → 点击保存
    → 写入 localStorage (即时)
    → 写入 JSON 文件 (File System Access API)
    → 更新 UI 列表
    总耗时: < 30 秒
```

### Git 自动捕获

```
git commit 触发
    → 解析 commit message
    → 提取变更文件列表
    → 生成日志草稿
    → 插入待编辑队列
```

---

## 6. 性能策略

| 策略 | 说明 |
|------|------|
| 虚拟滚动 | 10000+ 日志不卡顿 |
| 防抖搜索 | 输入 300ms 后触发 |
| 增量保存 | 只保存变更部分 |
| 内存缓存 | localStorage 热数据 |
| 懒加载 | 代码块按需渲染 |

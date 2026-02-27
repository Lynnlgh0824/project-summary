# 项目日志系统 - 设计系统总览

> **版本**: v1.0
> **更新时间**: 2026-02-27
> **适用于**: 项目日志系统

---

## 📖 设计系统定义

### 什么是设计系统

设计系统由**设计原则**、**设计语言**和**组件库**构成，在设计原则的指导下使用设计语言和组件库创建体验一致的用户界面。

```
设计系统
├── 设计原则 - 指导方向
├── 设计语言 - 视觉元素
│   ├── 色彩系统
│   ├── 文字系统
│   ├── 间距系统
│   └── 卡片系统
└── 组件库 - 可复用元素
    ├── 日志卡片
    ├── 统计图表
    └── 操作按钮
```

---

## 🎯 设计原则

### 1. 功能优先 (Function First)

项目日志系统的核心是记录和查看日志，界面应简洁高效。

**应用示例：**
- 信息密度高，单屏显示更多内容
- 快速搜索和筛选
- 一键导出数据

### 2. 清晰层次 (Clear Hierarchy)

通过视觉层次帮助用户快速定位信息。

**应用示例：**
- 使用卡片区分日志条目
- 时间、标签、状态分类明确
- 颜色编码不同状态

### 3. 快速操作 (Quick Actions)

常用操作应触手可及。

**应用示例：**
- 悬停显示操作按钮
- 快捷键支持
- 批量操作

### 4. 数据安全 (Data Safety)

保护用户的项目数据。

**应用示例：**
- 明确的保存提示
- 导出备份功能
- 数据持久化

---

## 🧬 设计元素

### 1. 色彩系统

详见：[COLOR-GUIDELINES.md](COLOR-GUIDELINES.md)

- **主色调**: `#2563EB` (蓝色) - 专业可靠
- **成功色**: `#10B981` (绿色) - 完成状态
- **警告色**: `#F59E0B` (橙色) - 进行中
- **错误色**: `#EF4444` (红色) - 阻塞/失败
- **背景色**: `#F9FAFB` (浅灰) - 柔和护眼
- **文字色**: `#111827` (深灰) - 高可读性
- **次要文字**: `#6B7280` (中灰)

### 2. 文字系统

详见：[TYPOGRAPHY.md](TYPOGRAPHY.md)

- **字体**: 系统默认（PingFang SC、Microsoft YaHei）
- **字号**:
  - 标题: 18px - 20px
  - 正文: 14px - 16px
  - 辅助: 12px - 13px
- **行高**: 1.5 - 1.6
- **字重**: 400 (Regular), 500 (Medium), 600 (Semibold)

### 3. 间距系统

基于 **8点网格**：

| 名称 | 数值 | 用途 |
|------|------|------|
| **xs** | 4px | 小间距 |
| **sm** | 8px | 标签内边距 |
| **md** | 12px | 卡片内边距 |
| **lg** | 16px | 卡片间距 |
| **xl** | 24px | 区块间距 |

### 4. 圆角系统

| 元素 | 圆角 | CSS |
|------|------|-----|
| **标签** | 4px | `border-radius: 4px` |
| **按钮** | 6px | `border-radius: 6px` |
| **卡片** | 8px | `border-radius: 8px` |

---

## 🧩 组件库

详见：[COMPONENT-LIBRARY.md](COMPONENT-LIBRARY.md)

### 核心组件

#### 1. 日志卡片 (Log Card)

```html
<div class="log-card">
  <div class="log-header">
    <h3 class="log-title">项目日志标题</h3>
    <span class="log-date">2024-02-27</span>
  </div>
  <div class="log-content">
    <p>日志内容...</p>
  </div>
  <div class="log-footer">
    <span class="log-tag">技术</span>
    <span class="log-status">进行中</span>
  </div>
</div>
```

#### 2. 统计卡片 (Stats Card)

```html
<div class="stats-card">
  <div class="stat-item">
    <span class="stat-label">总日志数</span>
    <span class="stat-value">128</span>
  </div>
  <div class="stat-item">
    <span class="stat-label">本周新增</span>
    <span class="stat-value">12</span>
  </div>
</div>
```

#### 3. 搜索框 (Search Box)

```html
<div class="search-box">
  <input type="text" placeholder="搜索日志..." />
  <button>🔍</button>
</div>
```

#### 4. 操作按钮组 (Action Buttons)

```html
<div class="action-buttons">
  <button class="btn-primary">➕ 添加日志</button>
  <button class="btn-secondary">📂 打开数据文件</button>
  <button class="btn-secondary">💾 导出备份</button>
</div>
```

---

## 📋 状态系统

### 日志状态

| 状态 | 颜色 | 标签样式 | 用途 |
|------|------|----------|------|
| **进行中** | 橙色 | 黄色背景 + 橙色文字 | 正在进行的项目 |
| **已完成** | 绿色 | 绿色背景 + 深绿文字 | 已完成的项目 |
| **暂停** | 灰色 | 灰色背景 + 深灰文字 | 暂停的项目 |
| **阻塞** | 红色 | 红色背景 + 深红文字 | 遇到问题的项目 |

### 标签分类

| 分类 | 颜色 | 用途 |
|------|------|------|
| **技术** | 蓝色 | 技术相关日志 |
| **设计** | 紫色 | 设计相关日志 |
| **产品** | 绿色 | 产品相关日志 |
| **其他** | 灰色 | 其他类型日志 |

---

## 📐 布局规范

详见：[LAYOUT.md](LAYOUT.md)

### 页面布局

```
┌─────────────────────────────────────┐
│  顶部操作栏                           │
│  [添加] [打开] [导出] [搜索]          │
├─────────────────────────────────────┤
│  统计区域                             │
│  [总日志] [本周新增] [完成率]          │
├─────────────────────────────────────┤
│                                     │
│  日志卡片网格                         │
│  ┌─────┐ ┌─────┐ ┌─────┐            │
│  │日志1│ │日志2│ │日志3│            │
│  └─────┘ └─────┘ └─────┘            │
│  ┌─────┐ ┌─────┐ ┌─────┐            │
│  │日志4│ │日志5│ │日志6│            │
│  └─────┘ └─────┘ └─────┘            │
│                                     │
└─────────────────────────────────────┘
```

### 响应式设计

- **Mobile**: 单列布局
- **Tablet**: 双列布局
- **Desktop**: 三列布局

---

## 💾 数据管理

### 文件格式

使用 JSON 格式存储数据：

```json
{
  "version": "1.0",
  "created": "2024-02-27",
  "updated": "2024-02-27",
  "logs": [
    {
      "id": "1",
      "title": "项目日志标题",
      "content": "日志内容...",
      "date": "2024-02-27",
      "tags": ["技术"],
      "status": "进行中"
    }
  ]
}
```

### 自动保存机制

1. **首次保存**: 用户选择保存位置
2. **自动更新**: 后续操作自动保存到同一文件
3. **备份提示**: 定期提醒导出备份

---

## 🎨 视觉规范

### 卡片样式

```css
.log-card {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.log-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
```

### 按钮样式

```css
.btn-primary {
  background: #2563EB;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 500;
  cursor: pointer;
}
```

---

## 📝 文案规范

### 原则

1. **简洁准确** - 用最少的文字表达完整意思
2. **动词开头** - 按钮文案使用动词
3. **状态明确** - 清晰表达当前状态

### 示例

| 场景 | 文案 |
|------|------|
| 添加按钮 | "➕ 添加日志" |
| 打开文件 | "📂 打开数据文件" |
| 导出备份 | "💾 导出备份" |
| 搜索提示 | "搜索日志标题、内容、标签..." |
| 空状态 | "暂无日志，点击上方按钮添加" |

---

## 🎯 设计规范使用流程

### 开发者

1. **保持简洁** - 不要添加不必要的装饰
2. **功能优先** - 界面服务于功能
3. **响应式** - 确保各种设备可用
4. **性能优化** - 大量日志时保持流畅

### 设计师

1. **清晰层次** - 通过视觉引导用户
2. **一致性** - 保持样式统一
3. **易用性** - 操作直观简单
4. **数据可视化** - 清晰展示统计信息

---

## 📚 相关文档

- [色彩规范](COLOR-GUIDELINES.md)
- [排版规范](TYPOGRAPHY.md)
- [布局规范](LAYOUT.md)
- [组件库文档](COMPONENT-LIBRARY.md)
- [响应式规范](RESPONSIVE.md)

---

## 🔧 技术栈

- **框架**: 原生 HTML/CSS/JavaScript
- **存储**: JSON 文件
- **文件 API**: File System Access API

---

## 🔄 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| v1.0 | 2026-02-27 | 初始版本，建立设计系统框架 |
| | | 功能优先设计原则 |
| | | 状态和标签系统 |
| | | 自动保存机制规范 |

---

**维护者**: 项目日志系统开发团队
**反馈**: 如有问题或建议，请提交 Issue 或 PR

# PROJECT_RULES.md - 项目规则和约定

> **版本**: v1.0.0
> **最后更新**: 2026-02-25
> **状态**: ✅ 活跃维护中

---

## 📖 概述

本文档定义了 **Project Summary** 项目的开发规范、代码标准和协作约定，确保团队成员能够高效、一致地进行开发工作。

---

## 🔧 代码规范

### 1. 文件编码规范

#### HTML 文件
- **字符编码**: UTF-8
- **缩进方式**: 4 空格（软制表符）
- **行尾符**: LF (Unix 风格)
- **命名风格**: 小写字母 + 连字符 `-`

```html
<!-- ✅ 正确示例 -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>项目日志系统</title>
</head>

<!-- ❌ 错误示例 -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>ProjectLogSystem</title>  <!-- 应使用中文或小写英文 -->
</head>
```

#### JavaScript 文件
- **字符编码**: UTF-8
- **缩进方式**: 4 空格
- **语句结尾**: 必须使用分号
- **字符串引号**: 优先使用单引号

```javascript
// ✅ 正确示例
const STORAGE_KEY = 'project_logs';

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ❌ 错误示例
const storageKey = "project_logs"  // 缺少分号，使用了双引号
function saveData(data) {          // 缺少 JSDoc 注释
    localStorage.setItem(storageKey, JSON.stringify(data))
}
```

#### Markdown 文件
- **列表缩进**: 2 空格
- **代码块**: 指定语言类型
- **链接格式**: 使用描述性文字

```markdown
<!-- ✅ 正确示例 -->
## 功能列表

- [x] 完成用户登录
- [ ] 实现数据导出

详见 [API 文档](./API.md)

```javascript
const example = 'code';
```

<!-- ❌ 错误示例 -->
## 功能列表
* [x] 完成用户登录  <!-- 应使用 "- " 而非 "* " -->
* [ ] 实现数据导出

见文档 [这里](./API.md)  <!-- 缺少描述性文字 -->
```

---

### 2. 代码风格规范

#### 变量命名
```javascript
// 常量：UPPER_SNAKE_CASE
const STORAGE_KEY = 'project_logs';
const MAX_RETRY_COUNT = 3;

// 普通变量：camelCase
let currentProject = null;
const userSettings = {};

// 类名：PascalCase
class ProjectManager {
    constructor() {
        this.projects = [];
    }
}

// 私有属性：前缀下划线
class DataStore {
    constructor() {
        this._cache = new Map();
        this._initialized = false;
    }
}
```

#### 函数规范
```javascript
/**
 * 保存项目日志数据
 * @param {Object} log - 日志对象
 * @param {string} log.projectId - 项目 ID
 * @param {string} log.title - 日志标题
 * @param {Array<string>} log.items - 日志条目列表
 * @returns {Promise<boolean>} 保存成功返回 true
 */
async function saveLog(log) {
    try {
        const data = await loadData();
        data.logs.push(log);
        await persistData(data);
        return true;
    } catch (error) {
        console.error('保存失败:', error);
        return false;
    }
}
```

---

## 🔄 Git 工作流

### 1. 分支策略

```
main (主分支)
 ├── protected
 ├── 只接受 Pull Request
 ├── 自动部署到生产环境

feature/* (功能分支)
 ├── feature/add-export-functionality
 ├── feature/mobile-optimization
 └── 从 main 分出，完成后合并回 main

fix/* (修复分支)
 ├── fix/data-import-bug
 ├── fix/mobile-scroll-issue
 └── 用于紧急修复

docs/* (文档分支)
 ├── docs/update-readme
 └── 用于文档更新
```

### 2. Commit 规范

#### Commit Message 格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type 类型
| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加数据导出功能` |
| `fix` | Bug 修复 | `fix: 修复移动端滚动问题` |
| `docs` | 文档更新 | `docs: 更新 README 说明` |
| `style` | 代码格式 | `style: 统一缩进为 4 空格` |
| `refactor` | 重构 | `refactor: 重构数据管理模块` |
| `perf` | 性能优化 | `perf: 优化大数据加载速度` |
| `test` | 测试相关 | `test: 添加单元测试` |
| `chore` | 构建/工具 | `chore: 更新依赖版本` |

#### Commit 示例
```bash
# ✅ 正确示例
git commit -m "feat(data): 添加 JSON 数据导出功能

- 支持导出为 JSON 格式
- 包含时间戳和版本信息
- 添加文件名自动生成

Closes #123"

# ❌ 错误示例
git commit -m "更新代码"     # 太模糊
git commit -m "fix bug"      # 缺少具体内容
git commit -m "add feature"  # 应使用中文描述
```

### 3. Pull Request 规范

#### PR 标题格式
```
[Type] 简短描述

例如：
[Feat] 添加数据导出功能
[Fix] 修复移动端日期筛选问题
[Docs] 更新项目文档
```

#### PR 描述模板
```markdown
## 📝 变更说明
简要描述本次变更的内容和目的

## 🔗 相关 Issue
Closes #123

## ✅ 变更类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 代码重构
- [ ] 文档更新
- [ ] 性能优化

## 🧪 测试情况
- [ ] 本地测试通过
- [ ] 移动端测试通过
- [ ] 数据导入/导出测试通过

## 📸 截图（如适用）
<!-- 添加截图展示变更效果 -->
```

---

## 📁 文件命名规范

### 1. HTML 文件
```
格式: <功能名称>.html

✅ 正确示例:
- project-log.html          (项目日志系统)
- check-todos.html          (待办清单检查)
- project-summary.html      (项目总结)

❌ 错误示例:
- ProjectLog.html           (不应使用大写)
- project_log.html          (不应使用下划线)
- index.html                (应使用描述性名称)
```

### 2. JavaScript 文件
```
格式: <功能描述>.js

✅ 正确示例:
- auto-log-server.js        (自动日志服务)
- data-manager.js           (数据管理器)
- export-handler.js         (导出处理器)

❌ 错误示例:
- AutoLogServer.js          (JS 文件不应使用 PascalCase)
- data_manager.js           (不应使用下划线)
- script.js                 (应使用描述性名称)
```

### 3. Shell 脚本文件
```
格式: <功能描述>.sh

✅ 正确示例:
- auto-daily-log.sh         (自动日志脚本)
- deploy.sh                 (部署脚本)
- backup-data.sh            (数据备份)

❌ 错误示例:
- AutoDailyLog.sh           (不应使用大写)
- daily_log.sh              (不应使用下划线)
```

### 4. Markdown 文档
```
格式: <文档主题>.md (全大写用于重要文档)

✅ 正确示例:
- README.md                 (项目说明)
- CHANGELOG.md              (变更日志)
- PROJECT_RULES.md          (项目规则)
- api-guide.md              (API 指南)

❌ 错误示例:
- readme.md                 (应使用全大写)
- Project_Rules.md          (不应使用下划线)
```

### 5. 数据文件
```
格式: <名称>-data.json

✅ 正确示例:
- project-log-data.json     (项目日志数据)
- todo-backup-2026-02-25.json (带日期的备份)

❌ 错误示例:
- data.json                 (应使用描述性名称)
- projectData.json          (不应使用驼峰命名)
```

### 6. 配置文件
```
✅ 正确示例:
- .env.example              (环境变量示例)
- .gitignore                (Git 忽略规则)
- vercel.json               (部署配置)

❌ 错误示例:
- env.example               (环境变量文件必须以 . 开头)
- gitignore                 (配置文件必须以 . 开头)
```

---

## 🎨 注释规范

### 1. 文件头注释
```html
<!--
    项目日志系统

    功能说明：
    - 管理多个项目的日志记录
    - 支持标签分类和搜索
    - 自动保存到本地文件

    作者: 项目团队
    创建时间: 2026-02-25
    最后更新: 2026-02-25
-->
```

### 2. 函数注释
```javascript
/**
 * 从本地存储加载数据
 * @returns {Promise<Object>} 返回解析后的数据对象
 * @throws {Error} 当数据格式错误时抛出异常
 */
async function loadData() {
    // 实现代码...
}
```

### 3. 代码注释
```javascript
// ✅ 单行注释：解释"为什么"
// 使用 setTimeout 避免 UI 阻塞
setTimeout(() => renderItems(), 0);

// ❌ 避免无意义的注释
// 设置变量值为 1
const value = 1;
```

---

## 🔒 安全规范

### 1. 数据安全
- ❌ **禁止提交**: `.env` 文件、密钥文件、凭证文件
- ✅ **提交模板**: `.env.example` (不包含真实值)
- ✅ **敏感信息**: 使用环境变量存储

### 2. 代码审查
- 所有代码变更必须经过 Code Review
- 安全相关变更需要双人确认
- 第三方依赖引入前需要安全审查

---

## 📊 文档维护

### 文档更新要求
| 文档 | 更新频率 | 负责人 |
|------|----------|--------|
| README.md | 每次发布 | 项目维护者 |
| CHANGELOG.md | 每次 Commit | 开发者 |
| PROJECT_RULES.md | 按需更新 | 团队共识 |
| PROJECT_CONTEXT.md | 重大变更 | 项目负责人 |

---

**文档版本**: v1.0.0
**维护者**: Project Team
**最后审核**: 2026-02-25

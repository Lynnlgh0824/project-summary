# Project Summary - API 参考

> Version: 1.0 | Last Updated: 2026-06-01

> 注：本项目为纯前端应用，无 REST API。本文档描述 JavaScript 模块的内部接口。

---

## 1. 项目管理 API

### `ProjectManager.createProject(name, color)`
创建新项目。

| 参数 | 类型 | 说明 |
|------|------|------|
| name | string | 项目名称 |
| color | string | 颜色标签 (hex) |

**返回**: `Project` 对象

### `ProjectManager.deleteProject(id)`
删除项目及其所有日志和待办。

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 项目 ID |

### `ProjectManager.switchProject(id)`
切换当前活跃项目。

### `ProjectManager.getAllProjects()`
获取所有项目列表。

**返回**: `Project[]`

---

## 2. 日志管理 API

### `LogManager.createLog(projectId, data)`
创建日志。

| 参数 | 类型 | 说明 |
|------|------|------|
| projectId | string | 所属项目 ID |
| data.title | string | 日志标题 |
| data.content | string | 内容（支持 Markdown） |
| data.tags | string[] | 标签数组 |
| data.codeSnippets | object[] | 代码片段 |

**返回**: `Log` 对象

### `LogManager.updateLog(id, data)`
更新日志。

### `LogManager.deleteLog(id)`
删除日志。

### `LogManager.searchLogs(query)`
全文搜索。

| 参数 | 类型 | 说明 |
|------|------|------|
| query | string | 搜索关键词 |

**返回**: `Log[]` (匹配结果)

### `LogManager.filterByTag(tag)`
按标签过滤。

### `LogManager.filterByDate(startDate, endDate)`
按日期范围过滤。

---

## 3. Todo 管理 API

### `TodoManager.createTodo(projectId, text, priority)`
创建待办。

| 参数 | 类型 | 说明 |
|------|------|------|
| projectId | string | 所属项目 ID |
| text | string | 待办内容 |
| priority | 'high' \| 'medium' \| 'low' | 优先级 |

### `TodoManager.toggleTodo(id)`
切换完成状态。

### `TodoManager.deleteTodo(id)`
删除待办。

### `TodoManager.linkToLog(todoId, logId)`
关联日志。

---

## 4. 数据持久化 API

### `DataStore.save(data)`
保存数据到 File System Access API 文件。

### `DataStore.load()`
从文件加载数据。

**返回**: `Promise<object>`

### `DataStore.exportJSON()`
导出为 JSON 文件下载。

### `DataStore.importJSON(file)`
从 JSON 文件导入。

| 参数 | 类型 | 说明 |
|------|------|------|
| file | File | JSON 文件对象 |

### `DataStore.autoSave(interval)`
设置自动保存间隔。

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| interval | number | 1800000 | 间隔毫秒（默认 30 分钟） |

### `DataStore.restoreFromBackup(backupId)`
从备份快照恢复数据。

---

## 5. Git 集成 API

### `GitCapture.captureChanges(repoPath)`
捕获 Git 变更生成日志草稿。

| 参数 | 类型 | 说明 |
|------|------|------|
| repoPath | string | Git 仓库路径 |

**返回**: `Log` 草稿对象

### `GitCapture.parseCommitLog(repoPath, since)`
解析 Git commit 历史。

| 参数 | 类型 | 说明 |
|------|------|------|
| repoPath | string | Git 仓库路径 |
| since | string | 起始日期 |

---

## 6. 标签系统

### 预设标签

| 标签名 | 色值 | 说明 |
|--------|------|------|
| `feature` | #3B82F6 | 新功能 |
| `bugfix` | #EF4444 | Bug 修复 |
| `performance` | #F59E0B | 性能优化 |
| `refactor` | #8B5CF6 | 重构 |
| `docs` | #10B981 | 文档 |
| `other` | #6B7280 | 其他 |

### 自定义标签

用户可创建自定义标签，系统自动分配颜色。

---

## 7. 数据格式

### data.json 导出格式

```json
{
  "version": "1.3",
  "exportedAt": "2026-06-01T10:00:00Z",
  "projects": [
    {
      "id": "proj_001",
      "name": "My Project",
      "color": "#3B82F6",
      "createdAt": "2026-01-15T08:00:00Z",
      "logs": [
        {
          "id": "log_001",
          "title": "实现用户登录功能",
          "content": "完成了 OAuth 集成...",
          "tags": ["feature"],
          "codeSnippets": [
            {
              "language": "javascript",
              "code": "const login = async () => {...}"
            }
          ],
          "createdAt": "2026-06-01T10:30:00Z"
        }
      ],
      "todos": [
        {
          "id": "todo_001",
          "text": "添加单元测试",
          "completed": false,
          "priority": "high",
          "linkedLogId": "log_001"
        }
      ]
    }
  ]
}
```

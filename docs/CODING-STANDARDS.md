# 项目日志系统 - 代码规范

> **版本**: v1.0
> **更新时间**: 2026-02-27
> **适用于**: 项目日志系统

---

## 📖 规范概述

本规范参考 [Hango 代码规范](https://hango-io.github.io/developer-guide/code/coding-guide/)，结合原生 JavaScript + File System Access API 项目实际情况制定。

---

## 🎯 核心原则

### 1. 数据持久化优先

使用 File System Access API 确保数据安全保存。

### 2. 用户数据安全

明确提示保存操作，提供备份/导出功能。

### 3. 简洁高效

界面功能优先，避免不必要的复杂度。

---

## 📝 命名规范

### 变量和函数

```javascript
// ✅ 推荐：小驼峰，语义明确
const currentProject = null;
const isEditing = false;
function addLog(log) { }
function updateLog(id, updates) { }
function deleteLog(id) { }

// ❌ 避免：无意义命名
const data = null;
const flag = false;
function handle() { }
```

**命名建议：**
- **状态变量**: is/has 开头 `isLoading`, `hasChanges`
- **CRUD 操作**: add/update/delete/get 开头
- **事件处理**: handle 开头 `handleSave`, `handleExport`
- **文件操作**: save/load/open/export 开头

### 常量

```javascript
// ✅ 推荐：全大写下划线
const MAX_LOGS_PER_PAGE = 50;
const FILE_FILTERS = [{ name: 'JSON', accept: ['.json'] }];
const STORAGE_VERSION = '1.0';

// ❌ 避免
const maxLogs = 50;
const filters = [...];
```

---

## 🧩 函数规范

### 1. 拒绝超大函数

**规则**: 函数不超过 50 行

```javascript
// ❌ 避免：超大函数
function renderLogs() {
  // 100+ 行代码...
}

// ✅ 推荐：拆分为小函数
function renderLogs() {
  const filtered = filterLogs(logs, filters);
  const sorted = sortLogs(filtered, sortBy);
  const paginated = paginateLogs(sorted, currentPage);
  return paginated.map(log => createLogCard(log));
}

function filterLogs(logs, filters) { }
function sortLogs(logs, sortBy) { }
function paginateLogs(logs, page) { }
function createLogCard(log) { }
```

### 2. 控制圈复杂度

**规则**: 圈复杂度不超过 15

```javascript
// ❌ 避免：高圈复杂度
function getLogStatus(log) {
  if (log.completed) {
    if (log.archived) {
      if (log.deleted) {
        // 更多嵌套...
      }
    }
  }
}

// ✅ 推荐：提前返回
function getLogStatus(log) {
  if (!log) return 'unknown';
  if (log.deleted) return 'deleted';
  if (log.archived) return 'archived';
  if (log.completed) return 'completed';
  return 'active';
}
```

### 3. 减少函数入参

**规则**: 参数不超过 5 个

```javascript
// ❌ 避免：参数过多
function createLog(title, content, date, tags, status, priority) { }

// ✅ 推荐：使用对象参数
function createLog({ title, content, date, tags, status, priority }) { }

// 调用更清晰
createLog({
  title: '项目日志',
  content: '...',
  date: '2024-02-27',
  tags: ['技术'],
  status: '进行中',
  priority: '高'
});
```

---

## 💾 文件系统 API 规范

### File System Access API

```javascript
// ✅ 推荐：封装文件操作
class FileManager {
  async openFile() {
    try {
      const [handle] = await window.showOpenFilePicker(FILE_FILTERS);
      const file = await handle.getFile();
      const content = await file.text();
      const data = JSON.parse(content);

      this.fileHandle = handle;
      return data;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('打开文件失败:', err);
        showErrorMessage('打开文件失败');
      }
      return null;
    }
  }

  async saveFile(data) {
    try {
      if (!this.fileHandle) {
        // 首次保存，让用户选择位置
        this.fileHandle = await window.showSaveFilePicker({
          suggestedName: `project-logs-${getDate()}.json`,
          types: FILE_FILTERS
        });
      }

      const writable = await this.fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();

      showSuccessMessage('保存成功');
      return true;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('保存失败:', err);
        showErrorMessage('保存失败');
      }
      return false;
    }
  }

  async exportBackup(data) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: `backup-${getDate()}.json`,
        types: FILE_FILTERS
      });

      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();

      showSuccessMessage('备份导出成功');
      return true;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('导出备份失败:', err);
      }
      return false;
    }
  }
}
```

### API 检测与降级

```javascript
// ✅ 推荐：功能检测，提供降级方案
class FileManager {
  static isSupported() {
    return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
  }

  static getFallbackMethod() {
    if (!this.isSupported()) {
      // 降级方案：使用传统文件下载
      return {
        saveFile: (data) => {
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `project-logs-${getDate()}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }
      };
    }
    return null;
  }
}

// 使用
if (!FileManager.isSupported()) {
  showWarningMessage('您的浏览器不支持文件系统 API，将使用传统下载方式');
}
```

---

## 📊 数据管理规范

### 数据结构

```javascript
// ✅ 推荐：统一数据结构
const projectData = {
  version: '1.0',
  created: '2024-02-27',
  updated: '2024-02-27',
  logs: [
    {
      id: generateId(), // 唯一 ID
      title: '项目日志标题',
      content: '日志内容...',
      date: '2024-02-27',
      tags: ['技术', '前端'],
      status: '进行中', // 进行中、已完成、暂停、阻塞
      priority: '中', // 高、中、低
      createdAt: '2024-02-27T10:30:00',
      updatedAt: '2024-02-27T10:30:00'
    }
  ],
  metadata: {
    totalLogs: 100,
    completedLogs: 80,
    inProgressLogs: 15,
    pausedLogs: 3,
    blockedLogs: 2
  }
};
```

### 数据操作

```javascript
// ✅ 推荐：封装数据操作
class DataManager {
  constructor() {
    this.data = { version: '1.0', created: getDate(), updated: getDate(), logs: [] };
  }

  addLog(log) {
    const newLog = {
      id: generateId(),
      ...log,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.logs.push(newLog);
    this.data.updated = getDate();
    return newLog;
  }

  updateLog(id, updates) {
    const index = this.data.logs.findIndex(log => log.id === id);
    if (index === -1) return null;

    this.data.logs[index] = {
      ...this.data.logs[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.data.updated = getDate();
    return this.data.logs[index];
  }

  deleteLog(id) {
    const index = this.data.logs.findIndex(log => log.id === id);
    if (index === -1) return false;

    this.data.logs.splice(index, 1);
    this.data.updated = getDate();
    return true;
  }

  searchLogs(query) {
    const lowerQuery = query.toLowerCase();
    return this.data.logs.filter(log =>
      log.title.toLowerCase().includes(lowerQuery) ||
      log.content.toLowerCase().includes(lowerQuery) ||
      log.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  filterLogs(filters) {
    return this.data.logs.filter(log => {
      if (filters.status && log.status !== filters.status) return false;
      if (filters.tags && !filters.tags.some(tag => log.tags.includes(tag))) return false;
      if (filters.priority && log.priority !== filters.priority) return false;
      return true;
    });
  }

  getStatistics() {
    const total = this.data.logs.length;
    const byStatus = this.data.logs.reduce((acc, log) => {
      acc[log.status] = (acc[log.status] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      completed: byStatus['已完成'] || 0,
      inProgress: byStatus['进行中'] || 0,
      paused: byStatus['暂停'] || 0,
      blocked: byStatus['阻塞'] || 0
    };
  }
}
```

---

## 🔍 搜索与筛选规范

```javascript
// ✅ 推荐：防抖优化搜索
class SearchManager {
  constructor(callback, delay = 300) {
    this.callback = callback;
    this.delay = delay;
    this.timeoutId = null;
  }

  search(query) {
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      this.callback(query);
    }, this.delay);
  }
}

// 使用
const searchManager = new SearchManager((query) => {
  const results = dataManager.searchLogs(query);
  renderResults(results);
});

searchInput.addEventListener('input', (e) => {
  searchManager.search(e.target.value);
});
```

---

## 🎨 DOM 操作规范

```javascript
// ✅ 推荐：事件委托
document.querySelector('.logs-container').addEventListener('click', (e) => {
  const deleteBtn = e.target.closest('.delete-btn');
  if (deleteBtn) {
    const logId = deleteBtn.dataset.id;
    deleteLog(logId);
  }

  const editBtn = e.target.closest('.edit-btn');
  if (editBtn) {
    const logId = editBtn.dataset.id;
    editLog(logId);
  }
});

// ❌ 避免：为每个元素单独绑定
deleteButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const logId = btn.dataset.id;
    deleteLog(logId);
  });
});
```

---

## 💬 注释规范

### JSDoc 风格

```javascript
// ✅ 推荐：JSDoc 注释
/**
 * 添加日志
 * @param {Object} log - 日志对象
 * @param {string} log.title - 日志标题
 * @param {string} log.content - 日志内容
 * @param {string[]} log.tags - 标签数组
 * @param {string} [log.status='进行中'] - 状态
 * @returns {Object} 新添加的日志对象
 */
function addLog(log) {
  // ...
}
```

---

## 📐 代码格式

### 基本规则

| 规则 | 示例 |
|------|------|
| **每行 ≤ 120 字符** | 超出时换行 |
| **保留字与括号加空格** | `if (condition)` |
| **括号内无空格** | `func(a, b)` |
| **使用单引号** | `const name = 'John';` |

---

## 🧪 测试建议

```javascript
// 简单的功能测试示例
function testDataManager() {
  console.log('测试 DataManager...');

  const manager = new DataManager();
  const log = manager.addLog({
    title: '测试日志',
    content: '测试内容',
    tags: ['测试'],
    status: '进行中'
  });

  if (log && log.id) {
    console.log('✓ 添加日志测试通过');
  } else {
    console.error('✗ 添加日志测试失败');
  }

  const found = manager.searchLogs('测试');
  if (found.length === 1) {
    console.log('✓ 搜索测试通过');
  } else {
    console.error('✗ 搜索测试失败');
  }
}
```

---

## 📋 代码审查清单

提交代码前，请确认：

- [ ] 函数不超过 50 行
- [ ] 圈复杂度不超过 15
- [ ] 函数参数不超过 5 个
- [ ] 文件 API 使用前进行功能检测
- [ ] 文件操作有错误处理
- [ ] 数据结构统一
- [ ] 搜索有防抖优化
- [ ] 事件处理使用委托模式
- [ ] 注释清晰有效

---

## 🔄 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| v1.0 | 2026-02-27 | 初始版本 |
| | | 参考 Hango 代码规范 |
| | | File System Access API 规范 |
| | | 数据管理最佳实践 |

---

**维护者**: 项目日志系统开发团队
**反馈**: 如有问题或建议，请提交 Issue 或 PR

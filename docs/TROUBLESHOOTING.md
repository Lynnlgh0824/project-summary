# 项目日志系统踩坑记录

## 踩坑记录 001: API 服务端口不匹配

**日期**: 2026-05-06
**严重程度**: 高
**状态**: ✅ 已修复

---

## 问题描述

用户反馈 `http://localhost:8090/project-log.html` 无法获取数据，点击"🤖 智能生成"按钮后没有响应。

## 根本原因

### 架构设计问题

项目日志系统存在**双服务架构**：

| 服务 | 端口 | 职责 |
|------|------|------|
| Python http.server | 8090 | 提供静态文件（HTML/CSS/JS/JSON） |
| Node.js auto-log-server.js | 3003 | 提供 API 服务（Git 变更检测） |

### 配置不一致

[project-log.html:3336](project-log.html#L3336) 使用**相对路径**调用 API：

```javascript
// 修复前
const response = await fetch('/api/auto-generate-log', {...});

// 修复后
const response = await fetch('http://localhost:3003/api/auto-generate-log', {...});
```

当页面从 `http://localhost:8090` 加载时，相对路径 `/api/auto-generate-log` 会被解析为 `http://localhost:8090/api/auto-generate-log`，但该路径在 Python 服务器上不存在（返回 404）。

## 为什么之前能工作

1. **浏览器缓存**: HTML/JS 被缓存，旧的 API 地址（指向 Python 服务器）可能正常工作过
2. **localStorage 降级**: 当 API 请求失败时，页面使用 localStorage 中的缓存数据，用户看到"有数据"
3. **历史数据生成**: `generateProjectHistory()` 函数会生成历史日志到 localStorage，即使 JSON 加载失败也有数据显示

## 为什么自测没发现

### 1. 浏览器缓存掩盖问题

- HTML 页面加载后，数据优先从 `localStorage` 读取
- API 请求失败时，页面静默降级到缓存数据
- 用户看起来"有数据"，误以为一切正常

### 2. 测试不完整

- 自测时只检查了"查看日志"功能（日记数据来自 localStorage/JSON）
- 没有测试"🤖 智能生成"这个**依赖 API 的功能**
- **教训**: 每个功能都需要独立测试，不能假设其他功能正常就代表全部正常

### 3. 异步初始化问题

初始化的 `filterByDate` 是 async 函数但没有被 await：

```javascript
// 修复前
window.addEventListener('DOMContentLoaded', () => {
    ...
    filterByDate('all', ...);  // 没有 await，异步执行可能被忽略
});

// 修复后
window.addEventListener('DOMContentLoaded', async () => {
    ...
    await filterByDate('all', ...);  // 正确等待异步完成
});
```

### 4. 缺少 API 健康检查

- 页面没有显示 API 连接状态
- 用户无法感知后端服务是否在线
- **教训**: 前端应显示后端服务状态，便于排查

## 修复方案

### 已执行的修复

1. **安装 Node.js 依赖**：
   ```bash
   npm install express cors --save
   ```

2. **修改 auto-log-server.js，同时托管静态文件**：
   ```javascript
   app.use(express.static(__dirname));
   ```

3. **统一服务端口**：现在只需启动 `node auto-log-server.js`，访问 `http://localhost:3003/project-log.html`

4. **修复异步初始化**：
   ```javascript
   window.addEventListener('DOMContentLoaded', async () => {
       ...
       await filterByDate('all', ...);
   });
   ```

### 长期改进（建议）

- [ ] 添加 API 健康状态指示器
- [ ] 添加启动检查脚本，验证所有依赖服务正常运行
- [ ] 分离"日记数据"和"项目日志"的数据源说明

## 教训总结

### 1. 架构设计

- **统一服务优于多服务**: 对于简单项目，优先选择统一服务，减少端口管理的复杂度
- **明确依赖关系**: 文档中应明确说明需要启动哪些服务，以及启动顺序

### 2. 测试覆盖

- **每个功能独立测试**: 不能假设"核心功能正常"就代表"所有功能正常"
- **边界条件测试**: 测试服务停止、网络断开等异常情况
- **缓存清除测试**: 测试时清除浏览器缓存，避免缓存掩盖问题

### 3. 可观测性

- **状态指示**: 前端应显示后端服务状态
- **错误提示**: API 失败时应有明确的用户提示
- **日志记录**: 前后端都应有详细的日志输出

### 4. 异步编程

- **await 不可省略**: async 函数调用时必须 await，否则可能执行顺序混乱
- **错误处理**: async 函数应有 try-catch 包裹

## 相关文件

- [project-log.html](project-log.html) - 主页面
- [auto-log-server.js](auto-log-server.js) - API 服务器（已更新为同时托管静态文件）
- [AUTO-LOG-SYSTEM.md](AUTO-LOG-SYSTEM.md) - 系统使用指南

## 下次改进计划

- [ ] 添加 API 健康状态指示器
- [ ] 更新启动脚本，一次启动所有必需服务
- [ ] 添加启动检查脚本，验证所有依赖服务正常运行

---

## 踩坑记录 002: 重复的 `<script>` 标签导致 JavaScript 不执行

**日期**: 2026-05-07
**严重程度**: 高
**状态**: ✅ 已修复

### 问题描述

页面显示"暂无日记记录"，即使 `diary-data.json` 文件正常可访问。

### 根本原因

[project-log.html:1072-1073](project-log.html#L1072) 有**两个连续的 `<script>` 标签**：

```html
</div>

<script>

<script>
    const STORAGE_KEY = ...
```

浏览器只解析第一个 `<script>` 标签，第二个 `<script>` 标签及其内容被当作 HTML 文本处理，导致所有 JavaScript 函数（`loadDiaryData`、`filterByDate` 等）都没有被定义。

### 诊断方法

1. 用 Playwright 检查函数是否存在：
   ```javascript
   page.evaluate(() => typeof loadDiaryData === 'function')  // 返回 false
   ```

2. 提取 JavaScript 检查语法：
   ```javascript
   new Function(script)  // 抛出 "Unexpected token '<'"
   ```

### 修复

删除多余的 `<script>` 标签。

### 预防措施

- HTML 编辑后用浏览器开发者工具检查 JavaScript 是否正确加载
- 使用 Playwright/Puppeteer 进行自动化测试验证页面功能
- 代码合并前检查是否有语法错误

---

## 踩坑记录 003: HTML 内容被转义导致格式失效

**日期**: 2026-05-07
**严重程度**: 高
**状态**: ✅ 已修复

### 问题描述

日志内容里的 HTML 代码（如 `<div style="...">`）没有被解析，直接以纯文本形式展示在页面上，所有格式控制标签、换行、样式都失效，导致日志内容变成了一长串杂乱的代码文本。

### 根本原因

在渲染日记内容时，对已经生成 HTML 的字符串又进行了 `escapeHtml()` 转义：

```javascript
// 修复前 - 错误 ❌
${escapeHtml(cleanDiaryContent(entry.fullContent))}

// cleanDiaryContent 函数已经返回 HTML 字符串
// escapeHtml 会把所有 < > 转义成 &lt; &gt;
// 导致 HTML 标签显示为原始文本
```

### 诊断方法

1. **检查 innerHTML vs textContent**：
   ```javascript
   // 用 Playwright 检查
   page.evaluate(() => {
       const d = document.querySelector('.diary-detail');
       return {
           innerHTML: d.innerHTML.substring(0, 200),  // 应该是 <div>...
           textContent: d.textContent.substring(0, 200)  // 如果看到 &lt; 就是被转义了
       };
   });
   ```

2. **直接看截图**：
   - 如果显示 `&lt;div style=...&gt;` 就是被转义了
   - 如果格式层级清晰说明正常

### 修复

移除多余的 `escapeHtml()` 调用：

```javascript
// 修复后 - 正确 ✅
${cleanDiaryContent(entry.fullContent)}
```

### 教训总结

| 问题 | 教训 |
|------|------|
| **理解偏差** | 用户说"排版错乱"，实际是 HTML 没解析，需要追问具体表现 |
| **过早下结论** | 多次说"测试通过"，但截图暴露了真实问题 |
| **依赖缓存** | 浏览器缓存导致测试结果失真 |
| **修复不彻底** | 第一次只优化了格式，没发现 HTML 转义这个根因 |

### 改善方法

1. **明确问题现象** - 要求提供具体截图或错误表现
2. **分步验证** - 修复 → 检查 DOM → 截图 → 确认
3. **主动同步** - 发现问题及时告知，不要等用户追问
4. **测试隔离** - 用无头浏览器 + 清除缓存测试
5. **检查数据流** - 确认函数返回值是否已经是目标格式

---

**记录人**: Claude Code
**审核人**: 待定
**下次 Review**: 2026-05-13

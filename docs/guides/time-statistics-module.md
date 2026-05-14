# 时间统计模块

## 概述

时间统计是 project-log.html 的核心功能之一，用于记录用户每天各时段的工作内容，并在日报卡片中可视化展示。整个模块涵盖**数据生成 → 校验过滤 → 异常检测 → UI展示**的完整链路。

---

## 一、数据结构

每条时间统计记录（timeStat）的格式：

```json
{
  "start": "10:00",
  "end": "11:00",
  "period": "早上",
  "task": "【project-summary】分析数据问题"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| start | string | 开始时间，HH:MM 格式 |
| end | string | 结束时间，HH:MM 格式 |
| period | string | 时段标签，由 `getPeriodLabel()` 自动计算 |
| task | string | 任务描述，有项目时用 `【项目名】` 标注 |

存储位置：`diary-data.json` 中每个日记条目的 `timeStats` 数组。

---

## 二、核心规则（TIME_RULES）

配置定义在 `project-log.html:1081`：

```javascript
const TIME_RULES = {
    sleepWindow: { start: '01:00', end: '09:00' },
    periodColors: {
        '早上': '#ff9800',
        '下午': '#4CAF50',
        '晚上': '#607d8b'
    },
    periodRanges: [
        { start: '00:00', end: '12:00', label: '早上' },
        { start: '12:00', end: '19:00', label: '下午' },
        { start: '19:00', end: '24:00', label: '晚上' }
    ]
};
```

### 2.1 睡眠窗口

- 定义：`01:00 - 09:00`
- 用途：校验异常时间戳，落入此区间的记录标记为异常
- 判定逻辑：`isInSleepWindow(time)` 检查分钟数是否在 [60, 540) 区间内

### 2.2 时段划分与颜色

| 时段 | 时间范围 | 颜色 | 用途 |
|------|----------|------|------|
| 早上 | 00:00-12:00 | `#ff9800`（橙色） | 时段标签 + UI颜色 |
| 下午 | 12:00-19:00 | `#4CAF50`（绿色） | 时段标签 + UI颜色 |
| 晚上 | 19:00-24:00 | `#607d8b`（灰蓝） | 时段标签 + UI颜色 |

### 2.3 只显示到当前时间

核心原则：**未来时间不属于当前，禁止展示**。

- 今天：只展示到当前小时之前的内容
- 历史日期：原样返回，不过滤
- 实现：`filterTimeStatsByNow(timeStats, dateStr)`

```
示例：当前 11:30
  ✅ 09:00-10:00 → 显示
  ✅ 10:00-11:00 → 显示
  ❌ 11:00-12:00 → 过滤（当前分钟 >= 30）
  ❌ 12:00-13:00 → 过滤（小时 > 当前）
```

过滤逻辑的细节（`project-log.html:1104-1123`）：

```javascript
function filterTimeStatsByNow(timeStats, dateStr) {
    // 历史日期不过滤
    if (dateStr !== today) return timeStats;

    return timeStats.filter(t => {
        const statHour = parseInt(t.start.split(':')[0]);
        if (statHour > currentHour) return false;          // 未来整小时
        if (statHour === currentHour && currentMinute < 30) return true;  // 当前小时，分钟<30
        if (statHour === currentHour && currentMinute >= 30) return false; // 当前小时，分钟>=30
        return true;  // 过去的全部显示
    });
}
```

---

## 三、三重校验体系

### 3.1 单条校验 `validateTimeStat(stat)`

位置：`project-log.html:1144`

| 检查项 | 条件 | 级别 |
|--------|------|------|
| 睡眠异常 | start 和 end 同时在睡眠窗口内 | error |
| 时段不匹配 | period 字段与 getPeriodLabel(start) 不一致 | warning |

### 3.2 整天校验 `validateDayTimeStats(timeStats)`

位置：`project-log.html:1164`

| 检查项 | 条件 | 说明 |
|--------|------|------|
| 首条异常 | 第一条 start 在睡眠窗口内 | 可能是时间戳偏移错误 |
| 时间重叠 | curr.start < prev.end | 连续性被破坏 |
| 大间隙 | 间隔 > 120分钟 | 提示有2小时+空档 |
| 末条异常 | 最后一条涉及睡眠窗口 | 可能是跨天任务 |

校验结果结构：

```javascript
{
    anomalies: [{ index, stat, issue, suggest }],  // 异常
    suggestions: [{ index, stat, msg }]              // 建议
}
```

### 3.3 UI 异常展示

异常条目在 UI 中以红色边框 + 红色图标标记：

```css
background: #ffebee;
border-left: 3px solid #f44336;
```

页面顶部还会显示异常汇总面板（橙色背景），列出所有异常条目的时间和问题描述。

---

## 四、数据生成流程

### 4.1 Session 文件提取（自动生成）

工具：`auto_extract_session.js`

```
Session文件 → 解析文件名提取时间戳 → 按小时分组 → 提取任务摘要 → 生成 timeStats
```

流程：

1. 扫描 `~/.hermes/sessions/` 目录
2. 文件名格式：`session_YYYYMMDD_HHMMSS_*.json` 或 `session_cron_*_YYYYMMDD_HHMMSS`
3. 按小时分组，每小时内合并任务描述
4. 任务描述提取自用户消息（过滤心跳、去重、截断80字符）
5. 无有效任务的小时标记为「会话工作（仅心跳）」

### 4.2 手动录入（日记来源）

日记条目（`source: "diary"`）的 timeStats 由日报生成时手动/半自动填写。

### 4.3 数据来源标识

| source | 含义 | 特征 |
|--------|------|------|
| session | 自动提取 | 来自 hermes session 文件 |
| diary | 日记录入 | 来自 Get笔记/手动记录 |

---

## 五、Bug 修复记录

### 5.1 时间偏移 +10h（2026-05-06/07）

**问题**：5月6日的 timeStats 全部偏移了10小时，本应是 09:00-23:00 的活动被记录为 00:00-14:00。

**错误数据**：
```
❌ 00:00-01:00 配置飞书连接
❌ 01:00-02:00 调试 MiniMax
❌ 02:00-03:00 配置会话记忆
```

**正确数据**：
```
✅ 09:00-10:00 微信对话 - 追问昨日工作
✅ 10:00-11:00 飞书日历提醒检查 + AI新闻搜索
✅ 11:00-12:00 日历跨天提醒检查 + 补发机制问题排查
```

**根因**：Session 文件的时间戳提取逻辑在解析 cron 类型文件名时，时间字段偏移了10小时。

**修复方案**：
- 修正 `diary-data.json` 中 05-06 的 timeStats
- 为 05-03 ~ 05-07 补充完整的 timeStats 数据
- 在校验系统中添加「首条异常检测」，对落入睡眠窗口的首条记录自动告警

### 5.2 未来时间显示问题（2026-05-07）

**问题**：当天 11:00 查看时，12:00-13:00 的任务已经被记录并显示。

**修复**：实现 `filterTimeStatsByNow()` 函数，对当天数据做时间过滤，历史日期原样返回。

### 5.3 待办统计错误（2026-05-07）

**问题**：待办统计显示 46 条，实际只有 5 条待处理。

**修复**：区分已完成（`[x]`）和待处理（`[ ]`）的计数逻辑。

---

## 六、最终效果

### 6.1 展示流程

```
diary-data.json
    ↓ 读取 timeStats
filterTimeStatsByNow()   ← 过滤未来时间（仅当天生效）
    ↓ 过滤后的数据
validateDayTimeStats()   ← 整天校验（异常+建议）
    ↓ 校验结果
validateTimeStat()       ← 单条校验（每条独立检查）
    ↓ 渲染 HTML
异常面板 + 时间条目列表
```

### 6.2 UI 组件

**时间条目**：每个 timeStat 渲染为一行，包含：
- 时间范围（`10:00-11:00`），颜色由 period 决定
- 时段标签（`早上`/`下午`/`晚上`），带颜色背景
- 任务描述

**异常面板**：当存在异常时，在时间列表顶部显示橙色警告框：
- 异常数量
- 每条异常的时间、任务、问题描述

**异常条目样式**：红色左边框 + 红色图标，视觉突出

### 6.3 用时分析视图（额外维度）

`📊 用时分析` 视图从日志 items 中提取 `— HH:MM HH:MM 完成` 格式的任务用时，按项目分组统计。这是一个独立于 timeStats 的分析维度，基于不同的数据格式。

---

## 七、关键代码位置

| 功能 | 文件 | 行号 |
|------|------|------|
| TIME_RULES 配置 | project-log.html | 1081-1096 |
| timeToMinutes() | project-log.html | 1099-1102 |
| filterTimeStatsByNow() | project-log.html | 1104-1123 |
| isInSleepWindow() | project-log.html | 1126-1131 |
| getPeriodLabel() | project-log.html | 1133-1142 |
| validateTimeStat() | project-log.html | 1144-1162 |
| validateDayTimeStats() | project-log.html | 1164-1218 |
| 时间统计 UI 渲染 | project-log.html | 2003-2048 |
| 用时分析 parseTimeLog() | project-log.html | 4255-4279 |
| Session 提取工具 | auto_extract_session.js | 1-143 |

## 八、相关技能文件

| 文件 | 用途 |
|------|------|
| `~/.hermes/skills/时间管理/时间戳校验规则/SKILL.md` | 校验规则详细规范 |
| `~/.hermes/skills/productivity/session-record/SKILL.md` | 会话记录格式规范 |

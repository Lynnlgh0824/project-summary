# 时间统计模块文档

## 概述

本文档记录了项目日志系统中时间统计模块的规则、发现的bug及修复过程。

---

## 一、时间统计规则

### 1. 时段定义（已统一）

| 时段 | 时间范围 | 颜色 |
|------|----------|------|
| 早上 | 00:00-12:00 | #ff9800 |
| 下午 | 12:00-19:00 | #4CAF50 |
| 晚上 | 19:00-24:00 | #607d8b |

### 2. 数据来源

- **5月有session文件**：从 `~/.hermes/sessions/` 自动提取
- **4月及更早**：基于 `fullContent` 和 `git log` 推断

### 3. 文件名解析规则

```
session_YYYYMMDD_HHMMSS_[sessionId].json    # 普通session
session_cron_[jobId]_YYYYMMDD_HHMMSS.json   # Cron session
```

---

## 二、发现的Bug

### Bug 1：时段定义不一致

**问题**：
```javascript
// periodColors 有7种颜色
periodColors: {
    '深夜', '早晨', '上午', '中午', '下午', '傍晚', '晚上'
}

// 但 periodRanges 只有6个时段
periodRanges: [
    { start: '00:00', end: '01:00', label: '深夜' },
    { start: '09:00', end: '12:00', label: '上午' },
    { start: '12:00', end: '13:00', label: '中午' },
    { start: '13:00', end: '18:00', label: '下午' },
    { start: '18:00', end: '23:00', label: '傍晚' },
    { start: '23:00', end: '24:00', label: '深夜' }
]
```

**影响**：
- "早晨"和"晚上"没有定义，导致 `getPeriodLabel()` 返回默认值
- 21:00-23:00 时间段被错误标记为"傍晚"

### Bug 2：睡眠窗口与时段重叠

**问题**：
- 睡眠窗口：01:00-09:00
- 时段定义：00:00-01:00 是深夜，09:00-12:00 是上午
- 01:00-09:00 这段时间没有定义

**影响**：
- `isInSleepWindow("07:30")` 返回 `true`
- `getPeriodLabel("07:30")` 返回 `"深夜"`（默认）
- 校验函数会报错"时段应为「深夜」"

### Bug 3：过滤未来时间逻辑错误

**问题**：
```javascript
return timeStats.filter(t => {
    const statHour = parseInt(t.start.split(':')[0]);
    if (statHour > currentHour) return false;
    if (statHour === currentHour && currentMinute < 30) return true;
    if (statHour === currentHour && currentMinute >= 30) return false;
    return true;
});
```

**影响**：
- 现在是 10:20，`10:45` 的条目也会被保留（应该被过滤）

---

## 三、修复过程

### Step 1：统一时段定义

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

### Step 2：更新数据文件

1. `project-log.html` - 更新代码
2. `diary-data.json` - 更新所有 `period` 字段

### Step 3：创建自动提取脚本

文件：`auto_extract_session.js`

核心逻辑：
- 从文件名提取时间戳
- 按小时合并重复session
- 过滤心跳消息
- 自动判定时段

---

## 四、最终效果

### 数据统计

| 月份 | 日期数 | 数据质量 |
|------|--------|----------|
| 1月 | 14天 | 基于git提交推断 |
| 2月 | 10天 | 基于git提交推断 |
| 3月 | 7天 | 基于fullContent推断 |
| 4月 | 11天 | 基于fullContent推断 |
| 5月 | 7天 | 精确（有session文件） |

### 5月6日示例

```
09:00-10:00 [早上]: 微信对话 - 追问昨日工作
10:00-11:00 [早上]: 飞书日历提醒检查 + AI新闻搜索
11:00-12:00 [早上]: 日历跨天提醒检查 + 补发机制排查
12:00-13:00 [下午]: 补发机制 + 图片读取问题排查
...
23:00-24:00 [晚上]: 飞书 - 职业规划咨询
```

---

## 五、复用指南

### 为某一天自动提取timeStats

```bash
node auto_extract_session.js 2026-05-06
```

### 手动添加timeStats

```javascript
{
    "start": "HH:MM",
    "end": "HH:MM",
    "period": "早上|下午|晚上",
    "task": "任务描述"
}
```

---

## 六、相关文件

- `project-log.html` - 前端代码（TIME_RULES定义）
- `diary-data.json` - 日志数据（timeStats字段）
- `auto_extract_session.js` - 自动提取脚本
- `~/.hermes/skills/日志系统/Session时间戳提取/SKILL.md` - Hermesskill

---

*文档生成时间：2026-05-07*

# 🤖 项目日志自动生成系统使用指南

**创建时间**: 2026-02-06
**版本**: v1.0
**状态**: ✅ 已实现

---

## 🎯 系统功能

### 核心功能

1. **智能生成今日日志** 🤖
   - 基于Git提交记录自动生成
   - 分析提交类型（修复、功能、优化、文档等）
   - 自动添加对应的标签和图标
   - 预填充项目名称和任务描述

2. **每日自动检查** 📅
   - 每天定时检测所有项目的Git变更
   - 自动生成每日工作报告
   - 统计提交数量和文件修改

3. **API服务器** 🌐
   - 提供REST API接口
   - 支持智能生成请求
   - 提供项目状态查询

---

## 📁 文件结构

```
project summary/
├── project-log.html              # 项目日志系统（已添加智能生成按钮）
├── auto-log-server.js             # API服务器
├── auto-log-server.sh             # 服务器启动脚本
├── auto-daily-log.sh             # 每日报告生成脚本
└── daily-reports/                 # 每日工作报告目录
    └── 2026-02-06.md             # 今日报告
```

---

## 🚀 快速开始

### 步骤1: 启动API服务器

```bash
cd ~/Documents/my_project/project\ summary
./auto-log-server.sh start
```

**预期输出**:
```
🚀 启动项目日志API服务器...
✅ 服务器启动成功 (PID: 12345)
📋 日志文件: /Users/.../auto-log-server.log
🌐 API地址: http://localhost:3003
```

### 步骤2: 打开项目日志系统

```bash
open ~/Documents/my_project/project\ summary/project-log.html
```

### 步骤3: 点击"🤖 智能生成"按钮

- **有Git提交**: 自动生成日志条目
- **无Git提交**: 提示创建空白模板

---

## 📋 API接口说明

### 1. 自动生成日志

**接口**: `POST /api/auto-generate-log`

**请求**:
```json
{
  "today": "2026-02-06"
}
```

**响应**:
```json
{
  "success": true,
  "logs": [
    {
      "id": "1234567890abc",
      "projectId": "project-organization",
      "projectName": "项目组织与管理",
      "date": "2026-02-06",
      "datetime": "2026/2/6 19:50:00",
      "title": "🚀 优化 - 项目组织与管理",
      "tags": [{"name": "🚀 优化", "type": "improvement"}],
      "items": [
        "✅ 优化控制面板布局",
        "✅ 修复文件保存问题"
      ],
      "code": null
    }
  ],
  "projects": ["项目组织与管理", "英语学习TTS系统"],
  "count": 2
}
```

### 2. 获取项目状态

**接口**: `GET /api/project-status`

**响应**:
```json
{
  "today": "2026-02-06",
  "status": {
    "project-organization": {
      "name": "项目组织与管理",
      "hasChanges": true,
      "commits": 3,
      "files": 5
    },
    "english-learning-tts": {
      "name": "英语学习TTS系统",
      "hasChanges": false,
      "commits": 0,
      "files": 0
    }
  }
}
```

### 3. 健康检查

**接口**: `GET /api/health`

**响应**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-06T19:50:00.000Z",
  "projects": 6
}
```

---

## ⏰ 定时任务配置

### 方案1: 每天自动生成报告

**编辑crontab**:
```bash
crontab -e
```

**添加以下行**（每天18点执行）:
```bash
0 18 * * * /Users/yuzhoudeshyin/Documents/my_project/project\ summary/auto-daily-log.sh >> /Users/yuzhoudeshyin/Documents/my_project/project\ summary/cron.log 2>&1
```

**说明**:
- 每天晚上6点自动检测Git变更
- 生成每日工作报告
- 保存到 `daily-reports/` 目录

### 方案2: 每天自动启动API服务器

**添加到crontab**（每天早上9点启动）:
```bash
0 9 * * * /Users/yuzhoudeshyin/Documents/my_project/project\ summary/auto-log-server.sh start >> /Users/yuzhoudeshengyin/Documents/my_project/project\ summary/cron.log 2>&1
```

### 方案3: 每天晚上停止API服务器

**添加到crontab**（每天晚上11点停止）:
```bash
0 23 * * * /Users/yuzhoudeshyin/Documents/my_project/project\ summary/auto-log-server.sh stop >> /Users/yuzhoudeshyin/Documents/my_project/project\ summary/cron.log 2>&1
```

---

## 📊 工作流程

### 每日工作流程

```
早上9点
  ↓
启动API服务器 (cron自动)
  ↓
日常工作 (Git提交)
  ↓
晚上6点
  ↓
生成每日报告 (cron自动)
  ↓
打开 project-log.html
  ↓
点击"🤖 智能生成"
  ↓
自动填充今日工作
  ↓
确认保存
```

---

## 🛠️ 服务器管理命令

### 启动服务器
```bash
./auto-log-server.sh start
```

### 停止服务器
```bash
./auto-log-server.sh stop
```

### 重启服务器
```bash
./auto-log-server.sh restart
```

### 查看状态
```bash
./auto-log-server.sh status
```

### 查看日志
```bash
./auto-log-server.sh logs
```

---

## 📝 提交类型识别

系统会自动识别以下类型的提交：

| 提交信息关键词 | 类型 | 标签 | 颜色 |
|-------------|------|------|------|
| 修复、fix、bug、问题 | 🔧 修复 | fix | 红色 |
| 添加、新增、feat、功能 | ✨ 新功能 | feature | 绿色 |
| 优化、改进、improve | 🚀 优化 | improvement | 蓝色 |
| 文档、doc、readme | 📚 文档 | docs | 紫色 |
| 测试、test、spec | 🧪 测试 | test | 橙色 |
| 其他 | 📝 其他 | other | 灰色 |

---

## 📚 相关文档

- [project-log.html](project-log.html) - 项目日志系统
- [README.md](README.md) - 项目总结使用说明
- [daily-reports/](daily-reports/) - 每日工作报告目录

---

## ⚠️ 注意事项

1. **Git仓库要求**
   - 项目必须是Git仓库
   - 提交信息要清晰明确
   - 避免模糊的提交信息

2. **服务器运行**
   - API服务器需要保持运行
   - 使用 `./auto-log-server.sh status` 检查状态
   - 查看日志排查问题

3. **数据备份**
   - 定期备份 `project-log-data.json`
   - 使用"导出报告"功能保存Markdown
   - 重要日志建议手动备份

---

## 🎯 最佳实践

### Git提交规范

```bash
# 好的提交信息
git commit -m "✨ 添加用户登录功能"
git commit -m "🔧 修复页面加载错误"
git commit -m "🚀 优化数据库查询性能"
git commit -m "📚 更新API文档"

# 避免的提交信息
git commit -m "update"
git commit -m "fix bug"
git commit -m "..."
```

### 每日工作流程

1. **开始工作前**: 确保API服务器运行
2. **工作中**: 正常Git提交，使用规范的提交信息
3. **工作结束时**: 点击"智能生成"自动创建日志
4. **确认保存**: 检查生成的日志内容并保存

---

**系统版本**: v1.0
**最后更新**: 2026-02-06
**维护者**: Claude Code

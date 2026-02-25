# 项目总体记忆

> **项目名称**: Project Summary (项目总结管理系统)
> **最后更新**: 2026-02-25
> **维护者**: Claude Code

---

## 📋 项目概述

Project Summary 是一个多项目管理元项目，用于统一管理和追踪多个独立项目的开发进度、文档和标准化工作。

### 核心功能
- **多项目追踪**: 管理 5 个独立项目的状态
- **标准化工具**: 统一项目结构和文档规范
- **项目日志系统**: HTML 格式的项目日志查看器
- **AI 辅助**: Claude Code 集成和记忆系统

### 管理的项目
1. **Chiengmai** - 清迈活动策划管理系统
2. **aisaasvideo** - VideoFly AI 视频生成平台
3. **english-learning** - 英语学习平台
4. **project-summary** - 本项目
5. **clawdbot-railway-template** - OpenClaw Railway 部署模板

---

## 🎯 项目目标

1. 统一所有项目的文档结构
2. 实现项目边界控制
3. 提供统一的项目日志查看
4. 维护项目间的最佳实践

---

## 🏗️ 系统架构

### 目录结构
```
project-summary/
├── config/           # 配置文件
├── daily-reports/    # 每日报告
├── docs/            # 文档
├── learnings/       # 学习笔记
├── memory/          # 记忆系统（本目录）
└── src/             # 源代码
```

### 核心组件
- **项目日志系统** (project-log.html): 可视化项目日志
- **Todo 检查器** (check-todos.html): 追踪任务状态
- **记忆系统**: AI Agent 记忆管理

---

## 💡 核心概念

### 项目边界控制
每个项目都是独立的，有严格的边界：
- **CLAUDE.md**: 定义项目范围和规则
- **Memory Scope**: 限制 AI 上下文在单个项目内
- **Architecture Rules**: 防止意外修改项目结构

### 标准化规范
所有项目遵循统一的规范：
- **tests/** - 统一测试目录结构
- **docs/** - 统一文档结构
- **memory/** - 统一记忆系统
- **.gitignore** - 统一忽略规则
- **.env.example** - 统一环境变量模板

---

## 📊 当前状态

- **版本**: v1.0.0
- **管理项目数**: 5 个
- **标准化完成度**: 100%
- **文档完整性**: 100%

---

## 🔗 相关资源

- **项目日志**: [项目日志系统.html](../项目日志系统.html)
- **文档**: [docs/](../docs/)
- **学习笔记**: [learnings/](../learnings/)

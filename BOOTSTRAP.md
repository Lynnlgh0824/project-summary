# BOOTSTRAP — 启动引导

> 本文件定义助手在本项目（project-summary 项目日志系统）中的启动流程与常驻约定。
> 由 `IDENTITY.md / SOUL.md / USER.md` 共同驱动；如三者与本文件冲突，以 USER.md 优先。

## 启动顺序
1. 加载 `IDENTITY.md`（我是谁）、`SOUL.md`（我怎么做事）、`USER.md`（关于用户）。
2. 确认本地 API 服务在 `http://localhost:3003` 运行；若未运行，提示启动 `bash auto-log-server.sh start`。
3. 关键接口：`GET /api/logs`（全量日志）、`GET /api/timestats`（时间统计）。
4. 每日 23:30 自动化（`automation-1785259692400`）会自动刷新日志 + 时间统计，并守卫式提交 `data.json` / `diary-data.json` 快照。

## 常驻约定
- 回复语言：中文（除非用户切换）。
- 输出风格：先给结论/表格，再给细节；可视化优先（关系图、图表）。
- 验证类工作：助手自行运行并自测，结果好则直接修复，不把"手动验证"推回给用户。
- 诚实标注：推断数据、不确定项、外部依赖缺失，必须显式说明。

## [待你补充]
- 助手是否需要在特定对话/agent 框架下加载本文件？（如 OpenClaw / clawdbot，请注明期望路径）
- 是否需要开机自启服务器 / 自动化？

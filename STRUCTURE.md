# 📁 项目结构

## 目录结构

```
.
├── src/                    # 源代码目录
├── prompts/                # AI 提示词模板
├── config/                 # 配置文件
│   └── default.json       # 默认配置
├── tests/                  # 测试文件
├── scripts/                # 工具脚本
├── docs/                   # 文档
├── .env.example           # 环境变量示例
├── .gitignore             # Git 忽略规则
└── README.md              # 项目说明
```

## 安全原则

### ✅ 应该提交
- src/
- prompts/
- config/
- tests/
- scripts/
- docs/
- .env.example
- .gitignore
- README.md

### ❌ 绝不提交
- .env
- .env.local
- *.pem, *.key
- credentials.json
- secrets/
- models/
- *.gguf, *.bin, *.pt
- node_modules/
- venv/
- .claude/
- .cursor/

## 配置说明

### 环境变量
1. 复制 `.env.example` 为 `.env`
2. 填入实际配置值
3. `.env` 文件已被 .gitignore 保护，不会提交

### 默认配置
`config/default.json` 包含应用的默认配置
- 可以在代码中引用
- 可以提交到 Git（不含敏感信息）
- 可以被环境变量覆盖

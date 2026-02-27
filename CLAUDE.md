# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Identity

**Project Name:** Project Summary (项目日志管理系统)

This is an **independent project**.

Claude must **NEVER** reference files, code, or context from other projects.

Claude must **ONLY** operate within this directory (`/Users/yuzhoudeshengyin/Documents/my_project/project-summary/`).

---

## Architecture Rules

Claude MUST **NOT**:
- Modify folder structure without permission
- Rename files without permission
- Move files without permission
- Delete files without permission

Claude MUST:
- Preserve existing structure
- Follow established patterns
- Extend code without breaking structure

---

## Memory Scope

Claude memory is **LIMITED** to this project directory.

Do **NOT** assume context from:
- Other folders in `/Users/yuzhoudeshengyin/Documents/my_project/`
- Other repositories
- Other projects

---

## Coding Rules

Before coding, Claude must:
1. Read `README.md`
2. Read architecture
3. Follow existing patterns

---

## Workflow Rules

⚠️ **CRITICAL**: Every task MUST follow this workflow:

### Step 1: Understand (Required)
- Rephrase the requirement in your own words
- Identify constraints and boundaries
- Check related docs (memory/, docs/)
- **Output**: "我理解您的需求是..." (confirm understanding)

### Step 2: Design (Required)
- Analyze possible solutions
- Identify risks and dependencies
- Create execution plan
- **Output**: Show complete plan with rationale

### Step 3: Confirm (Required)
- Present the plan to user
- Explain why this approach
- List potential risks
- **WAIT**: Do NOT execute until user approves

### Step 4: Execute (After Approval)
- Follow the approved plan
- Verify each step
- Update relevant docs

### ⛔ Forbidden
- ❌ Execute without showing plan
- ❌ Assume understanding
- ❌ Skip risk assessment

### ✅ Required
- ✅ Rephrase requirements
- ✅ Show complete plan
- ✅ Wait for approval
- ✅ Consider long-term impact

**See**: `docs/WORKFLOW.md` for detailed guide

---

## Safety Rule

If unsure, Claude must **ASK** instead of modifying.

---

## Git Rule

Claude must **NEVER**:
- Expose secrets
- Commit `.env`
- Commit private keys

---

## Project Overview

Project Summary is a lightweight, browser-based project log management and experience summarization tool. It helps developers systematically record project experiences, track work progress, and maintain knowledge bases without requiring a server.

## Tech Stack

- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript (ES6+)
- **Storage**: LocalStorage + JSON files
- **File System**: File System Access API for automatic saving
- **Server** (optional): Node.js for automation scripts
- **Deployment**: Pure static, no server required

## Project Structure

```
project-summary/
├── project-log.html              # Main project log system ⭐
├── check-todos.html              # Todo recovery tool
├── 项目日志系统.html                 # Chinese version
├── data.json                      # Project data file
├── auto-daily-log.sh             # Auto log shell script
├── auto-log-server.js            # Auto log Node.js service
├── auto-log-server.sh            # Service startup script
├── fix-and-add-log.js            # Fix and add log script
├── config/
│   └── default.json              # Default configuration
├── learnings/                    # Learning resources
│   └── ai-agent-memory-system.md
├── daily-reports/                # Daily report archives
├── docs/                         # Documentation
└── scripts/                      # Utility scripts
```

## Core Features

### 1. Project Log Management
- Multi-project support
- Tag-based categorization (new features, bug fixes, optimization, etc.)
- Code snippet recording
- Automatic backup

### 2. Data Management
- JSON export/import
- Version control compatible
- Cross-device migration support

### 3. Todo List System
- Project-based grouping
- Priority settings
- Status tracking
- Due date reminders

### 4. Automation
- Daily log automation scripts
- Git change capture
- Configurable project detection

## Development Workflow

### For HTML/JS Files:

```bash
# 1. Open the HTML file directly in browser
open project-log.html

# 2. Or use a local server (recommended)
python3 -m http.server 8000
# Then visit http://localhost:8000/project-log.html
```

### For Automation Scripts:

```bash
# Run auto log service
node auto-log-server.js

# Or use shell script
./auto-log-server.sh

# Run daily log automation
./auto-daily-log.sh
```

## Key Technical Details

### File System Access API

The project uses the modern File System Access API for automatic file saving:

```javascript
// First time: User selects file location
const fileHandle = await window.showSaveFilePicker({
    suggestedName: 'project-log-data.json',
    types: [{
        description: 'JSON Data',
        accept: {'application/json': ['.json']},
    }],
});

// Subsequent saves: Automatic, no user prompt
const writable = await fileHandle.createWritable();
await writable.write(JSON.stringify(data));
await writable.close();
```

### Data Structure

```json
{
  "version": "1.0",
  "exportTime": "2026-02-25T...",
  "logs": [
    {
      "id": "unique-id",
      "projectId": "project-identifier",
      "projectName": "Project Name",
      "date": "2026-02-25",
      "datetime": "2026/2/25 12:00:00",
      "title": "✨ New Feature - 2026-02-25",
      "tags": [{"name": "✨ 新功能", "type": "feature"}],
      "items": ["Completed task 1", "Completed task 2"],
      "code": null
    }
  ],
  "projects": [
    {"id": "project-id", "name": "Project Name", "startDate": "2026-02-25"}
  ]
}
```

### LocalStorage Keys

- `project_logs` - Main log data
- `project_list` - Project list
- `project_todos` - Todo items

## Tag System

Supported tags for categorizing log entries:

| Tag | Type | Description |
|-----|------|-------------|
| ✨ 新功能 | feature | New features |
| 🐛 Bug修复 | fix | Bug fixes |
| ⚡ 性能优化 | perf | Performance improvements |
| ♻️ 代码重构 | refactor | Code refactoring |
| 📝 文档更新 | docs | Documentation updates |
| 🎨 样式调整 | style | Style changes |
| ✅ 测试相关 | test | Testing related |
- 🔧 构建/工具 | chore | Build/tool changes |

## Browser Compatibility

Required features:
- **File System Access API**: Chrome 86+, Edge 86+
- **LocalStorage**: All modern browsers
- **ES6+**: Modern JavaScript support

## Configuration

Configuration is stored in `config/default.json`:

```json
{
  "app": {
    "name": "Project Summary",
    "version": "1.0.0"
  },
  "storage": {
    "fileName": "project-log-data.json"
  }
}
```

## Data Backup

### Automatic Backup

Every save operation creates an automatic backup:
- Backup naming: `project-log-data.json.backup.YYYYMMDDHHMMSS`
- Located in same directory as main data file
- Can be restored via import function

### Manual Backup

Use the export function in the UI:
1. Open `project-log.html`
2. Click "导出备份" (Export Backup)
3. Save the JSON file to a safe location

## Important Notes

- **No Server Required**: Pure static HTML/JS, runs directly in browser
- **Data Privacy**: All data stored locally, not uploaded to cloud
- **Zero Learning Curve**: Intuitive interface, easy to use
- **Cross-Platform**: Works on any modern browser

## Getting Started

1. Open `project-log.html` in your browser
2. Click "添加日志" to add your first entry
3. Select save location when prompted (first time only)
4. All subsequent saves will be automatic

## Automation Setup

For automatic logging with Git integration:

```bash
# 1. Make scripts executable
chmod +x auto-daily-log.sh auto-log-server.sh

# 2. Configure projects in config/default.json

# 3. Run automation service
node auto-log-server.js

# The service will:
# - Detect Git changes in your projects
# - Generate log entries automatically
# - Save to the data file
```

## Documentation Files

- `README.md` - Project overview and usage guide
- `PROJECT_RULES.md` - Development rules and conventions
- `PROJECT_CONTEXT.md` - Project background and architecture
- `PROJECT_STRUCTURE.md` - Detailed project structure
- `CHANGELOG.md` - Version history and changes

## Troubleshooting

### Data Not Saving?

1. Check browser console for errors
2. Ensure File System Access API is supported
3. Verify file permissions
4. Try exporting backup manually

### Lost Data?

1. Check for backup files (`*.backup.*`)
2. Use import function to restore from backup
3. Check browser LocalStorage for cached data

---

**Last Updated**: 2026-02-25
**Maintainer**: Project Team

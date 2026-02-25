// ==================== 快速启动功能 ====================
// 在 renderProjectResources 函数开头添加以下代码

// 1. 在项目数据中添加 projectPath 字段（为每个项目添加）
// 2. 添加以下两个函数（在 renderProjectResources 之前）

// 生成项目启动模板
function generateProjectStartTemplate(project) {
    const data = projectData[project.id];
    if (!data || !data.projectPath) return null;

    const projectName = project.name.replace(/^[^\s]+\s*/, ''); // 移除 emoji

    return `You are resuming ${projectName} as its long-term engineering assistant.

This is a persistent project. Your job is to fully restore context and continue development safely and consistently.

Follow these steps EXACTLY and in order:

--------------------------------------------------
STEP 1 — LOAD PROJECT RULES
--------------------------------------------------

Read and internalize:
- CLAUDE.md
- README.md

You MUST follow them strictly.

--------------------------------------------------
STEP 2 — LOAD LONG-TERM MEMORY
--------------------------------------------------

Read ALL files in memory/
Especially:
- memory/project-memory.md
- memory/progress.md
- memory/decisions.md
- memory/bugs.md (if exists)

--------------------------------------------------
STEP 3 — LOAD ARCHITECTURE AND PRODUCT CONTEXT
--------------------------------------------------

Read ALL files in docs/
Especially:
- docs/architecture.md
- docs/product.md
- docs/api.md (if exists)

--------------------------------------------------
STEP 4 — ANALYZE CURRENT CODEBASE
--------------------------------------------------

Scan and understand:
- src/
- modules
- configs
- system design
- structure and patterns

--------------------------------------------------
STEP 5 — RESTORE FULL CONTEXT STATE
--------------------------------------------------

Build an internal mental model including:
- project purpose
- architecture
- module responsibilities
- completed features
- pending features
- known issues
- constraints

--------------------------------------------------
STEP 6 — ENTER STRICT DEVELOPMENT MODE
--------------------------------------------------

DO NOT:
- break architecture
- rename files without permission
- move files without permission
- delete files without permission
- introduce unrelated refactors

ALWAYS:
- follow existing patterns
- extend safely
- preserve structure
- ask before major changes

--------------------------------------------------
STEP 7 — CONFIRM CONTEXT RESTORED
--------------------------------------------------

Output a concise summary:
- project purpose
- architecture summary
- completed parts
- pending tasks
- risks or warnings

Then say: "Project context fully restored. Ready for instructions."

--------------------------------------------------
STEP 8 — WAIT FOR NEXT INSTRUCTION
--------------------------------------------------

Do NOT modify anything yet.
Wait for explicit user instruction.`;
}

// 复制启动模板到剪贴板
function copyProjectStart(projectId) {
    const project = getProjects().find(p => p.id === projectId);
    if (!project) return;

    const template = generateProjectStartTemplate(project);
    if (!template) {
        alert('❌ 该项目未配置启动模板');
        return;
    }

    navigator.clipboard.writeText(template).then(() => {
        alert(`✅ 已复制 ${project.name} 启动模板`);
    }).catch(() => {
        // 降级方案
        const textarea = document.createElement('textarea');
        textarea.value = template;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert(`✅ 已复制 ${project.name} 启动模板`);
    });
}

// 3. 在 renderProjectResources 函数开头添加快速启动区域
function renderProjectResources() {
    const container = document.getElementById('resourcesContent');
    const projectId = currentProjectFilter;

    let html = '';

    // ===== 新增：快速启动中心 =====
    html += '<section style="margin-bottom: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 30px;">';
    html += '<h2 style="margin: 0 0 24px 0; font-size: 22px; font-weight: 700; color: white;">🚀 快速启动中心</h2>';
    html += '<p style="margin: 0 0 20px 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">点击复制项目启动模板，快速恢复项目上下文</p>';

    if (!projectId) {
        // 显示所有项目
        const allProjects = getProjects().filter(p => {
            const data = projectData[p.id];
            return data && data.projectPath;
        });

        html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">';

        allProjects.forEach(project => {
            html += `
                <div style="background: rgba(255, 255, 255, 0.95); border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.3s;" onclick="copyProjectStart('${project.id}')" onmouseover="this.style.transform='translateY(-4px)';" onmouseout="this.style.transform='translateY(0)';">
                    <div style="font-size: 28px; margin-bottom: 8px;">${project.name.split(' ')[0] || '📁'}</div>
                    <div style="font-size: 15px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px;">${project.name.substring(project.name.indexOf(' ') + 1) || project.name}</div>
                    <div style="font-size: 12px; color: #666; margin-bottom: 12px;">${projectData[project.id].summary?.description || '项目启动'}</div>
                    <div style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600;">📋 复制启动模板</div>
                </div>
            `;
        });

        html += '</div>';
    } else {
        // 单个项目
        const data = projectData[projectId];
        if (data && data.projectPath) {
            const project = getProjects().find(p => p.id === projectId);
            html += `
                <div style="background: rgba(255, 255, 255, 0.95); border-radius: 12px; padding: 24px;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <div style="font-size: 32px; margin-bottom: 8px;">${project.name.split(' ')[0] || '📁'}</div>
                            <div style="font-size: 20px; font-weight: 700; color: #1a1a1a;">${project.name.substring(project.name.indexOf(' ') + 1) || project.name}</div>
                            <div style="font-size: 14px; color: #666;">${data.summary?.description || '项目启动'}</div>
                        </div>
                        <button onclick="copyProjectStart('${projectId}')" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 14px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer;">📋 复制启动模板</button>
                    </div>
                </div>
            `;
        }
    }

    html += '</section>';
    // ===== 快速启动中心结束 =====

    // 原有的"快速访问"代码继续...
    html += '<section style="margin-bottom: 50px;">';
    html += '<h2 style="margin: 0 0 24px 0; font-size: 22px; font-weight: 700;">🔗 快速访问</h2>';
    // ... 其余代码保持不变
}

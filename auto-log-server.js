#!/usr/bin/env node
/**
 * 项目日志自动生成API服务器（v2）
 * - 以 data.json 为"真相源"（服务端持久化）
 * - 监控 6 个 git 项目，生成日志
 * - 新增：覆盖度/告警、热力图、日报聚合、月报导出、手动记一笔
 */

const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3003;
const DATA_FILE = path.join(__dirname, 'data.json');
const DIARY_FILE = path.join(__dirname, 'diary-data.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// 项目注册表：键统一使用 data.json 中的规范 projectId
const REGISTRY = {
    'project-summary': {
        name: '项目组织与管理',
        path: '/Users/yuzhoudeshengyin/Documents/my_project/project-summary',
        git: true
    },
    'english-learning': {
        name: '英语学习TTS系统',
        path: '/Users/yuzhoudeshengyin/Documents/my_project/english-learning',
        git: true
    },
    'chiangmai': {
        name: '清迈活动策划',
        path: '/Users/yuzhoudeshengyin/Documents/my_project/Chiangmai',
        git: true
    },
    'aisaasvideo': {
        name: 'AI SaaS视频项目',
        path: '/Users/yuzhoudeshengyin/Documents/my_project/aisaasvideo',
        git: true
    },
    'clawdbot-railway-template': {
        name: 'Clawdbot Railway模板',
        path: '/Users/yuzhoudeshengyin/Documents/my_project/clawdbot-railway-template',
        git: true
    },
    'skills': {
        name: '技能开发与学习',
        path: '/Users/yuzhoudeshengyin/Documents/my_project/skills',
        git: true
    }
};

// ============ 数据层：以 data.json 为真相源 ============
let cache = null;        // 内存缓存
let cacheTime = 0;
const CACHE_TTL = 2000;  // 2s

function loadData() {
    const now = Date.now();
    if (cache && now - cacheTime < CACHE_TTL) return cache;
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        cache = JSON.parse(raw);
        cacheTime = now;
    } catch (e) {
        cache = { logs: [], projects: [], syncInfo: {} };
        cacheTime = now;
    }
    if (!cache.logs) cache.logs = [];
    if (!cache.projects) cache.projects = [];
    if (!cache.syncInfo) cache.syncInfo = {};
    return cache;
}

function saveData(data) {
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, DATA_FILE);
    cache = data;
    cacheTime = Date.now();
}

// diary-data.json 加载（带缓存）：时间统计 timeStats 的真相源
let diaryCache = null;
let diaryCacheTime = 0;
function loadDiaryData() {
    const now = Date.now();
    if (diaryCache && now - diaryCacheTime < CACHE_TTL) return diaryCache;
    try {
        const raw = fs.readFileSync(DIARY_FILE, 'utf-8');
        const d = JSON.parse(raw);
        diaryCache = Array.isArray(d) ? d : (d.entries || []);
        diaryCacheTime = now;
    } catch (e) {
        diaryCache = [];
        diaryCacheTime = now;
    }
    return diaryCache;
}

// 在 YYYY-MM-DD 字符串上偏移天数（避免本地时区导致 toISOString 回退一天）
function shiftDate(dateStr, deltaDays) {
    const d = new Date(dateStr + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + deltaDays);
    return d.toISOString().split('T')[0];
}
function daysBetween(a, b) {
    return Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 86400000);
}

// ============ Git 变更检测 ============
function checkGitChanges(projectPath, today) {
    try {
        try {
            execSync('git rev-parse --git-dir', { cwd: projectPath, stdio: 'ignore' });
        } catch (e) {
            return null; // 不是Git仓库
        }

        const baseDate = new Date(today + 'T00:00:00');
        baseDate.setDate(baseDate.getDate() - 1);
        const yesterdayStr = baseDate.toISOString().split('T')[0];

        const cmd = `git log --since="${yesterdayStr} 00:00:00" --until="${today} 23:59:59" --pretty=format:"%h|%s|%ai" --reverse`;
        const output = execSync(cmd, { cwd: projectPath, encoding: 'utf-8' });

        if (!output.trim()) return null;

        const commits = output.trim().split('\n').map(line => {
            const [hash, msg, time] = line.split('|');
            return { hash, msg, time };
        });

        const filesCmd = `git diff --stat --since="${yesterdayStr} 00:00:00" --until="${today} 23:59:59"`;
        let filesChanged = [];
        try {
            const filesOutput = execSync(filesCmd, { cwd: projectPath, encoding: 'utf-8' });
            filesChanged = filesOutput.trim().split('\n');
        } catch (e) { /* ignore */ }

        return { commits, filesChanged };
    } catch (error) {
        console.error(`检查Git变更失败: ${projectPath}`, error.message);
        return null;
    }
}

function getGitLastCommitDate(projectPath) {
    try {
        const out = execSync('git log -1 --pretty=format:%ad --date=short', { cwd: projectPath, encoding: 'utf-8' });
        return out.trim() || null;
    } catch (e) {
        return null;
    }
}

function analyzeCommitType(msg) {
    if (/修复|fix|bug|问题|error/i.test(msg)) return 'fix';
    if (/添加|新增|feat|功能|create|implement/i.test(msg)) return 'feature';
    if (/优化|改进|improve|重构|refactor/i.test(msg)) return 'improvement';
    if (/文档|doc|readme|说明|guide/i.test(msg)) return 'docs';
    if (/测试|test|spec/i.test(msg)) return 'test';
    return 'other';
}

function generateLogEntry(projectId, changes, today) {
    if (!changes || changes.commits.length === 0) return null;
    const project = REGISTRY[projectId];
    const firstCommit = changes.commits[0];
    const type = analyzeCommitType(firstCommit.msg);
    const tagMap = {
        fix: { name: '🔧 修复', type: 'fix' },
        feature: { name: '✨ 新功能', type: 'feature' },
        improvement: { name: '🚀 优化', type: 'improvement' },
        docs: { name: '📚 文档', type: 'docs' },
        test: { name: '🧪 测试', type: 'test' },
        other: { name: '📝 其他', type: 'other' }
    };
    return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        projectId: projectId,
        projectName: project ? project.name : projectId,
        date: today,
        datetime: new Date().toLocaleString('zh-CN'),
        title: `${tagMap[type].name} - ${project ? project.name : projectId}`,
        tags: [tagMap[type]],
        items: changes.commits.map(c => `✅ ${c.msg}`),
        code: null,
        manual: false
    };
}

// ============ API: 自动生成日志 ============
app.post('/api/auto-generate-log', async (req, res) => {
    try {
        const { today } = req.body;
        const generatedLogs = [];
        const projectsWithChanges = [];
        for (const [projectId, project] of Object.entries(REGISTRY)) {
            const changes = checkGitChanges(project.path, today);
            if (changes && changes.commits.length > 0) {
                const logEntry = generateLogEntry(projectId, changes, today);
                if (logEntry) {
                    generatedLogs.push(logEntry);
                    projectsWithChanges.push(project.name);
                }
            }
        }
        res.json({ success: true, logs: generatedLogs, projects: projectsWithChanges, count: generatedLogs.length });
    } catch (error) {
        console.error('生成日志失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ API: 项目状态 ============
app.get('/api/project-status', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const status = {};
    for (const [projectId, project] of Object.entries(REGISTRY)) {
        const changes = checkGitChanges(project.path, today);
        status[projectId] = {
            name: project.name,
            hasChanges: changes !== null && changes.commits.length > 0,
            commits: changes ? changes.commits.length : 0,
            files: changes ? changes.filesChanged.length : 0
        };
    }
    res.json({ today, status });
});

// ============ API: 健康检查 ============
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), projects: Object.keys(REGISTRY).length });
});

// ============ API: 读取全部日志（真相源） ============
app.get('/api/logs', (req, res) => {
    const data = loadData();
    // 返回全部日志：首页需要完整数据；787 条约 800KB，载荷可接受
    const logs = data.logs;
    res.json({ success: true, logs, projects: data.projects, total: data.logs.length });
});

// ============ API: 时间统计（timeStats） ============
app.get('/api/timestats', (req, res) => {
    const entries = loadDiaryData();
    const byDate = {};
    let entryCount = 0;
    entries.forEach(e => {
        if (Array.isArray(e.timeStats) && e.timeStats.length) {
            (byDate[e.date] = byDate[e.date] || []).push(...e.timeStats);
            entryCount++;
        }
    });
    const dates = Object.keys(byDate).sort();
    res.json({ success: true, dates, data: byDate, days: dates.length, entryCount });
});

// ============ API: 手动记一笔（写入 data.json） ============
app.post('/api/logs', (req, res) => {
    try {
        const { projectId, date, title, content, tags } = req.body || {};
        if (!projectId || !date || !content) {
            return res.status(400).json({ success: false, error: 'projectId / date / content 必填' });
        }
        const data = loadData();
        const entry = {
            id: 'manual-' + Date.now().toString() + Math.random().toString(36).substr(2, 5),
            projectId,
            projectName: (REGISTRY[projectId] && REGISTRY[projectId].name) || projectId,
            date,
            datetime: new Date().toLocaleString('zh-CN'),
            title: title || `📝 手动记录 - ${(REGISTRY[projectId] && REGISTRY[projectId].name) || projectId}`,
            tags: (tags || []).map(t => ({ name: t, type: 'manual' })),
            items: [content],
            code: null,
            manual: true
        };
        data.logs.push(entry);
        data.logs.sort((a, b) => (a.date < b.date ? 1 : -1));
        saveData(data);
        res.json({ success: true, entry, total: data.logs.length });
    } catch (error) {
        console.error('手动记一笔失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ API: 覆盖度 / 告警 ============
app.get('/api/coverage', (req, res) => {
    const data = loadData();
    const today = new Date().toISOString().split('T')[0];

    // 以注册表项目为主，并补充日志中出现但不在注册表的项目（如个人日记等）
    const projectIds = new Set(Object.keys(REGISTRY));
    data.logs.forEach(l => projectIds.add(l.projectId));

    const result = [];
    for (const pid of projectIds) {
        const logs = data.logs.filter(l => l.projectId === pid);
        const dates = [...new Set(logs.map(l => l.date))].sort();
        const lastActivity = dates.length ? dates[dates.length - 1] : null;
        const daysSince = lastActivity
            ? daysBetween(today, lastActivity)
            : null;

        // 滚动 90 天覆盖率
        let covered = 0;
        for (let i = 0; i < 90; i++) {
            const ds = shiftDate(today, -i);
            if (dates.includes(ds)) covered++;
        }
        const coverage = Math.round((covered / 90) * 100);

        const reg = REGISTRY[pid];
        const gitLastCommit = reg && reg.git ? getGitLastCommitDate(reg.path) : null;

        result.push({
            projectId: pid,
            name: (reg && reg.name) || pid,
            git: !!(reg && reg.git),
            logCount: logs.length,
            lastActivity,
            daysSince,
            coverage,
            gitLastCommit,
            alert: daysSince !== null && daysSince >= 14,
            stale: daysSince !== null && daysSince >= 30
        });
    }
    result.sort((a, b) => (b.daysSince ?? -1) - (a.daysSince ?? -1));
    const alerts = result.filter(r => r.alert);
    res.json({ success: true, today, projects: result, alertCount: alerts.length, monitored: Object.keys(REGISTRY).length });
});

// ============ API: 热力图（按日日志数） ============
app.get('/api/heatmap', (req, res) => {
    const days = parseInt(req.query.days || '180', 10);
    const data = loadData();
    const today = new Date().toISOString().split('T')[0];
    const map = {};
    let max = 0;
    for (let i = 0; i < days; i++) {
        const ds = shiftDate(today, -i);
        const c = data.logs.filter(l => l.date === ds).length;
        map[ds] = c;
        if (c > max) max = c;
    }
    res.json({ success: true, days, map, max });
});

// ============ API: 日报聚合（启发式，预留 LLM 升级） ============
app.get('/api/summary', (req, res) => {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const data = loadData();
    const dayLogs = data.logs.filter(l => l.date === date);
    if (dayLogs.length === 0) {
        return res.json({ success: true, date, hasData: false, summary: `📭 ${date} 暂无日志记录。` });
    }
    const byProject = {};
    dayLogs.forEach(l => {
        byProject[l.projectId] = byProject[l.projectId] || { name: l.projectName, items: [] };
        (l.items || []).forEach(it => byProject[l.projectId].items.push(it));
    });
    let text = `📅 ${date} 工作日报（共 ${dayLogs.length} 条记录）\n\n`;
    for (const pid in byProject) {
        const p = byProject[pid];
        text += `【${p.name}】\n`;
        p.items.slice(0, 12).forEach(it => { text += `  • ${it}\n`; });
        if (p.items.length > 12) text += `  • …（另有 ${p.items.length - 12} 项）\n`;
        text += '\n';
    }
    res.json({ success: true, date, hasData: true, count: dayLogs.length, summary: text, byProject });
});

// ============ API: 月报导出（Markdown） ============
app.get('/api/monthly-report', (req, res) => {
    const month = req.query.month || new Date().toISOString().slice(0, 7); // YYYY-MM
    const data = loadData();
    const monthLogs = data.logs.filter(l => (l.date || '').startsWith(month));
    const byProject = {};
    const tagCount = {};
    monthLogs.forEach(l => {
        byProject[l.projectId] = byProject[l.projectId] || { name: l.projectName, count: 0, items: [] };
        byProject[l.projectId].count++;
        (l.items || []).forEach(it => byProject[l.projectId].items.push(it));
        (l.tags || []).forEach(t => { const n = t.name || t; tagCount[n] = (tagCount[n] || 0) + 1; });
    });
    let md = `# 📊 项目月报 ${month}\n\n`;
    md += `- 日志总数：**${monthLogs.length}** 条\n`;
    md += `- 涉及项目：**${Object.keys(byProject).length}** 个\n`;
    md += `- 生成时间：${new Date().toLocaleString('zh-CN')}\n\n`;
    md += `## 一、各项目投入\n\n`;
    Object.entries(byProject).sort((a, b) => b[1].count - a[1].count).forEach(([pid, p]) => {
        md += `### ${p.name}（${p.count} 条）\n`;
        p.items.slice(0, 8).forEach(it => { md += `- ${it}\n`; });
        if (p.items.length > 8) md += `- …（共 ${p.items.length} 项）\n`;
        md += '\n';
    });
    md += `## 二、标签分布\n\n`;
    Object.entries(tagCount).sort((a, b) => b[1] - a[1]).forEach(([t, c]) => { md += `- ${t}：${c}\n`; });
    md += '\n---\n*由项目日志系统自动生成*\n';
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="monthly-report-${month}.md"`);
    res.send(md);
});

// ============ 启动 ============
app.listen(PORT, () => {
    console.log('========================================');
    console.log('项目日志API服务器 v2');
    console.log('========================================');
    console.log(`✅ 服务器已启动: http://localhost:${PORT}`);
    console.log(`📊 监控项目数量: ${Object.keys(REGISTRY).length}`);
    console.log('');
    console.log('API端点:');
    console.log(`  POST /api/auto-generate-log - 自动生成日志`);
    console.log(`  GET  /api/project-status    - 获取项目状态`);
    console.log(`  GET  /api/health            - 健康检查`);
    console.log(`  GET  /api/logs              - 读取日志(真相源)`);
    console.log(`  POST /api/logs              - 手动记一笔(持久化)`);
    console.log(`  GET  /api/coverage          - 覆盖度/告警`);
    console.log(`  GET  /api/heatmap           - 投入热力图`);
    console.log(`  GET  /api/summary           - 日报聚合`);
    console.log(`  GET  /api/monthly-report    - 月报导出`);
    console.log('========================================');
});

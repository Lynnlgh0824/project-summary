#!/usr/bin/env node
/**
 * Session 时间戳自动提取工具 v3
 * - 支持 Claude Code session 文件 (YYYYMMDD_HHMMSS_*.jsonl)
 * - 支持 Hermes cron session 文件 (session_cron_*_YYYYMMDD_HHMMSS.json)
 * - 按小时合并
 * - 去重心跳
 * - 提取有效任务
 * - 排除睡眠窗口（01:00-09:00）的 cron 任务
 * - 标记可疑时间段
 */

const fs = require('fs');
const path = require('path');

const SESSIONS_DIR = '/Users/yuzhoudeshengyin/.hermes/sessions';
const DIARY_FILE = path.join(__dirname, 'diary-data.json');

// 时段规则
const periodRanges = [
    { start: '00:00', end: '12:00', label: '早上' },
    { start: '12:00', end: '19:00', label: '下午' },
    { start: '19:00', end: '24:00', label: '晚上' }
];

// 睡眠窗口
const SLEEP_START = '01:00';
const SLEEP_END = '09:00';

// 项目关键词映射（从消息内容中检测）
const PROJECT_KEYWORDS = [
    { keywords: ['project-summary', 'project-log', 'data.json', 'diary-data'], name: 'project-summary' },
    { keywords: ['wx-insights', 'wx-cli', '微信群'], name: 'wx-insights' },
    { keywords: ['hermes', 'cron', '定时任务', '飞书', 'weixin'], name: 'hermes-agent' },
    { keywords: ['obsidian', 'get笔记', 'get笔记', '音频转写'], name: 'obsidian' },
    { keywords: ['简历', '面试', 'job', 'career'], name: '职业发展' },
    { keywords: ['天涯智囊团'], name: '天涯智囊团' },
];

// 从任务摘要中提取项目名称
function extractProjectFromTask(task) {
    if (!task) return null;
    for (const { keywords, name } of PROJECT_KEYWORDS) {
        for (const kw of keywords) {
            if (task.includes(kw)) {
                return name;
            }
        }
    }
    return null;
}

function timeToMins(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function isInSleepWindow(time) {
    const mins = timeToMins(time);
    const sleepStartMins = timeToMins(SLEEP_START);
    const sleepEndMins = timeToMins(SLEEP_END);
    return mins >= sleepStartMins && mins < sleepEndMins;
}

function getPeriod(time) {
    const mins = timeToMins(time);
    for (const p of periodRanges) {
        if (mins >= timeToMins(p.start) && mins < timeToMins(p.end)) {
            return p.label;
        }
    }
    return '晚上';
}

// 从文件名提取日期时间
// 支持两种格式：
// 1. Claude Code session: YYYYMMDD_HHMMSS_*.jsonl
// 2. Hermes cron session: session_cron_*_YYYYMMDD_HHMMSS.json
function parseFilename(filename) {
    // 格式1: YYYYMMDD_HHMMSS_*.jsonl (Claude Code session)
    let match = filename.match(/^(\d{8})_(\d{6})_[a-zA-Z0-9]+\.jsonl$/);
    if (match) {
        const date = match[1], time = match[2];
        return {
            date: `${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`,
            time: `${time.slice(0,2)}:${time.slice(2,4)}`,
            type: 'user'  // 用户主动开始的会话
        };
    }

    // 格式2: session_cron_*_YYYYMMDD_HHMMSS.json
    match = filename.match(/session_cron_[^_]+_(\d{8})_(\d{6})\.json$/);
    if (match) {
        const date = match[1], time = match[2];
        return {
            date: `${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`,
            time: `${time.slice(0,2)}:${time.slice(2,4)}`,
            type: 'cron'  // 自动定时任务
        };
    }

    return null;
}

// 提取任务摘要
// 支持两种文件格式：
// 1. .json 文件 (Hermes cron): { messages: [...] }
// 2. .jsonl 文件 (Claude Code): 每行一个 JSON 对象
function extractTaskSummary(filepath) {
    try {
        const isJsonl = filepath.endsWith('.jsonl');
        let messages = [];

        if (isJsonl) {
            // 解析 jsonl 文件
            const content = fs.readFileSync(filepath, 'utf8');
            const lines = content.split('\n').filter(l => l.trim());

            for (const line of lines) {
                try {
                    const obj = JSON.parse(line);
                    if (obj.role === 'user' || obj.role === 'assistant') {
                        messages.push(obj);
                    }
                } catch (e) {
                    // 跳过无效行
                }
            }
        } else {
            // 解析普通 json 文件
            const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
            messages = data.messages || [];
        }

        // 提取用户消息
        const userMsgs = messages
            .filter(m => m.role === 'user')
            .map(m => {
                const content = m.content;
                // 处理不同格式的内容
                if (typeof content === 'string') {
                    return content;
                } else if (Array.isArray(content)) {
                    // 处理 blocks 格式 (Hermes)
                    return content
                        .filter(b => b.type === 'text' || b.type === 'untyped')
                        .map(b => b.content || '')
                        .join('');
                }
                return '';
            })
            .filter(c => {
                if (!c || c.length < 5) return false;
                // 过滤系统消息
                if (c.startsWith('[SYSTEM') || c.startsWith('[心跳')) return false;
                // 过滤纯链接
                if (c.startsWith('http') && c.length < 50) return false;
                return true;
            })
            .map(c => {
                // 清理文本
                return c
                    .replace(/\n+/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
            })
            .filter(c => c.length > 10 && c.length < 200);

        if (userMsgs.length === 0) return null; // 仅心跳

        // 去重（相似消息也去重）
        const unique = [];
        for (const msg of userMsgs) {
            const short = msg.slice(0, 50);  // 用前50字符判断相似
            if (!unique.some(u => u.slice(0, 50) === short)) {
                unique.push(msg);
            }
        }

        return unique.slice(0, 3).join(' | ');
    } catch (e) {
        console.error(`提取任务摘要失败: ${filepath}`, e.message);
        return null;
    }
}

function extractForDate(targetDate, silent = false) {
    if (!silent) console.log(`\n=== 提取 ${targetDate} ===\n`);

    const files = fs.readdirSync(SESSIONS_DIR)
        .filter(f => (f.endsWith('.json') && !f.startsWith('request_dump')) || f.endsWith('.jsonl'))
        .map(f => ({ name: f, path: path.join(SESSIONS_DIR, f), parsed: parseFilename(f) }))
        .filter(f => f.parsed && f.parsed.date === targetDate)
        .sort((a, b) => a.parsed.time.localeCompare(b.parsed.time));

    console.log(`找到 ${files.length} 个session文件\n`);

    // 分类统计
    const userSessions = files.filter(f => f.parsed.type === 'user');
    const cronSessions = files.filter(f => f.parsed.type === 'cron');
    console.log(`  - 用户会话: ${userSessions.length} 个`);
    console.log(`  - Cron任务: ${cronSessions.length} 个\n`);

    // 按小时分组
    const byHour = {};
    files.forEach(f => {
        const hour = f.parsed.time.split(':')[0];
        if (!byHour[hour]) byHour[hour] = [];
        byHour[hour].push(f);
    });

    // 合并每个小时
    const timeStats = [];
    let suspiciousCount = 0;

    Object.keys(byHour).sort().forEach(hour => {
        const hourFiles = byHour[hour];
        const time = `${hour}:00`;
        const period = getPeriod(time);

        // 检查是否有 cron 任务在睡眠窗口（00:00-09:00 整个范围都算）
        const isSleepHour = parseInt(hour) < 9;
        const hasCronInSleep = hourFiles.some(f =>
            f.parsed.type === 'cron' && isSleepHour
        );
        const isUserSession = hourFiles.some(f => f.parsed.type === 'user');

        // 提取所有有效任务（只从用户会话中提取，排除仅心跳的）
        const userFiles = hourFiles.filter(f => f.parsed.type === 'user');
        const tasks = userFiles
            .map(f => extractTaskSummary(f.path))
            .filter(t => t !== null);

        // 去重
        const uniqueTasks = [...new Set(tasks)];

        // 提取项目名称（从任务内容中检测）
        const projects = new Set();
        uniqueTasks.forEach(t => {
            const project = extractProjectFromTask(t);
            if (project) projects.add(project);
        });

        let task;
        let taskSource = '';
        let projectTag = '';

        if (uniqueTasks.length === 0) {
            if (isUserSession) {
                task = '会话工作';
                taskSource = ' [用户]';
            } else {
                task = '会话工作（仅心跳）';
                taskSource = ' [Cron]';
            }
        } else if (uniqueTasks.length === 1) {
            task = uniqueTasks[0];
            taskSource = isUserSession ? ' [用户]' : ' [Cron]';
        } else {
            task = uniqueTasks.slice(0, 2).join(' | ');
            taskSource = isUserSession ? ' [用户]' : ' [Cron]';
        }

        // 添加项目标注
        if (projects.size > 0) {
            projectTag = ' 【' + [...projects].slice(0, 2).join(', ') + '】';
        }

        // 截断过长的任务描述
        if (task.length > 80) task = task.slice(0, 77) + '...';

        const entry = {
            start: time,
            end: `${String(parseInt(hour) + 1).padStart(2, '0')}:00`,
            period,
            task: projectTag + task
        };

        // 添加警告标记
        if (hasCronInSleep) {
            entry._warning = 'Cron任务在睡眠窗口(01:00-09:00)，已排除';
            suspiciousCount++;
        }

        timeStats.push(entry);

        // 输出日志
        let warning = '';
        if (hasCronInSleep) {
            warning = ' ⚠️ [已排除Cron]';
        } else if (isUserSession) {
            warning = ' ✅';
        }
        if (!silent) console.log(`${time}-${String(parseInt(hour)+1).padStart(2,'0')}:00 [${period}]${projectTag}${taskSource}${warning}: ${task}`);
    });

    // 过滤掉睡眠窗口的 cron 任务
    const filteredStats = timeStats.filter(t => !t._warning);

    // 清理临时字段
    filteredStats.forEach(t => delete t._warning);
    timeStats.forEach(t => delete t._warning);

    if (!silent) {
        console.log('\n--- 统计摘要 ---');
        console.log(`总时间段: ${timeStats.length} 个；可疑(Cron in sleep): ${suspiciousCount} 个；有效(已过滤): ${filteredStats.length} 个`);
        console.log('\n--- JSON (已过滤) ---\n');
        console.log(JSON.stringify(filteredStats, null, 2));
    }

    return filteredStats;
}

// 将某天的 timeStats 落盘到 diary-data.json（按 date 匹配，优先 source=session 条目，否则新建）
function writeTimeStats(targetDate, stats) {
    let entries = [];
    try {
        entries = JSON.parse(fs.readFileSync(DIARY_FILE, 'utf8'));
        if (!Array.isArray(entries)) entries = (entries && entries.entries) || [];
    } catch (e) {
        entries = [];
    }

    let idx = entries.findIndex(e => e.date === targetDate && e.source === 'session');
    if (idx === -1) idx = entries.findIndex(e => e.date === targetDate);

    if (idx === -1) {
        entries.push({
            date: targetDate, source: 'session', day: '', week: '',
            todos: [], logSummary: [], fullContent: '',
            timeStats: stats, timeStatsSource: 'session'
        });
        console.log(`[写入] 新建 ${targetDate} session 条目，timeStats ${stats.length} 条`);
    } else {
        entries[idx].timeStats = stats;
        entries[idx].timeStatsSource = 'session';
        console.log(`[写入] 更新 ${targetDate} 条目，timeStats ${stats.length} 条`);
    }

    const tmp = DIARY_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(entries, null, 2), 'utf8');
    fs.renameSync(tmp, DIARY_FILE);
    return true;
}

// 批处理：对所有含 session 的日期执行提取并落盘
function extractAll() {
    const dates = [...new Set(fs.readdirSync(SESSIONS_DIR)
        .map(f => parseFilename(f))
        .filter(p => p)
        .map(p => p.date))].sort();
    console.log(`批处理模式：发现 ${dates.length} 个含 session 的日期`);
    let written = 0;
    dates.forEach(d => {
        const stats = extractForDate(d, true);
        if (stats && stats.length) {
            writeTimeStats(d, stats);
            written++;
        }
    });
    console.log(`\n=== 批处理完成：写入 ${written}/${dates.length} 天的时间统计 ===`);
}

const args = process.argv.slice(2);
if (args[0] === '--all') {
    extractAll();
} else {
    const date = args[0] || '2026-05-06';
    const stats = extractForDate(date);
    if (stats && stats.length) {
        writeTimeStats(date, stats);
    } else {
        console.log(`[跳过] ${date} 无有效时间段`);
    }
}

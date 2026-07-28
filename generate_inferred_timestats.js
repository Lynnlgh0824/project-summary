#!/usr/bin/env node
/**
 * 推断式时间统计生成器（generate_inferred_timestats.js）
 * - 仅处理 2026-05-03 之前、且无 session 真实时间统计的日记条目
 * - 从 fullContent 的要点（bullet）中推断任务，按小时块填充
 * - 每条标记 inferred:true，UI 中以「推断」徽章区分，避免与精确提取混淆
 * - 依据 time-statistics-module 设计文档："4月及更早：基于 fullContent 和 git log 推断"
 */
const fs = require('fs');
const path = require('path');

const DIARY_FILE = path.join(__dirname, 'diary-data.json');
const CUTOFF = '2026-05-03'; // 仅处理此日期之前的日记（之后由 session 精确提取）

function periodOf(start) {
    const h = parseInt(start.split(':')[0], 10);
    if (h < 12) return '早上';
    if (h < 19) return '下午';
    return '晚上';
}

// 从日记全文抽取实质性任务要点
function extractTasks(fullContent) {
    if (!fullContent) return [];
    const tasks = [];
    for (const raw of fullContent.split('\n')) {
        const line = raw.trim();
        if (!line) continue;
        if (line.startsWith('#')) continue;       // 标题
        if (line.startsWith('---')) continue;     // 分隔线
        if (/^[-*]\s*\[[ xX]\]/.test(line)) continue; // 待办清单跳过
        const m = line.match(/^[-*]\s+(.*)$/);
        if (!m) continue;
        let t = m[1].trim();
        t = t.replace(/^>\s*\[!.*?\][+-]?\s*/, '').trim(); // 去 obsidian callout
        t = t.replace(/\*\*/g, '').trim();
        if (t.length < 4) continue;
        if (/^https?:\/\//.test(t)) continue;      // 纯链接跳过
        if (/^[0-9]+\s*分钟|^[0-9]{1,2}:[0-9]{2}\b/.test(t)) continue; // 时长/时间行跳过
        tasks.push(t);
    }
    return tasks;
}

function main() {
    let entries = JSON.parse(fs.readFileSync(DIARY_FILE, 'utf8'));
    if (!Array.isArray(entries)) entries = entries.entries || [];

    let added = 0;
    entries.forEach(e => {
        if (e.date >= CUTOFF) return;                       // 仅处理 5-03 之前
        if (Array.isArray(e.timeStats) && e.timeStats.length) return; // 已有则跳过
        const tasks = extractTasks(e.fullContent).slice(0, 10);
        if (tasks.length < 2) return;                      // 至少 2 条才推断，避免单点噪音

        let hour = 9;
        const stats = tasks.map(t => {
            const start = String(hour).padStart(2, '0') + ':00';
            const end = String(Math.min(hour + 1, 23)).padStart(2, '0') + ':00';
            hour = Math.min(hour + 1, 22);
            return { start, end, period: periodOf(start), task: t, inferred: true };
        });
        e.timeStats = stats;
        e.timeStatsSource = 'inferred';
        added++;
    });

    const tmp = DIARY_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(entries, null, 2), 'utf8');
    fs.renameSync(tmp, DIARY_FILE);
    console.log(`推断式时间统计：为 ${added} 天（${CUTOFF} 之前）生成 inferred timeStats`);
}

main();

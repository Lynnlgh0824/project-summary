#!/usr/bin/env node
/**
 * 将项目日志系统的工作日志同步到对应项目的目录结构
 *
 * 使用方法：
 * 1. 在浏览器控制台运行 export-logs-to-projects.js
 * 2. 将输出的 JSON 保存到 /tmp/project_logs.json
 * 3. 运行此脚本: node sync-logs.js
 */

const fs = require('fs');
const path = require('path');

// 项目配置
const PROJECTS = {
    'project-organization': {
        name: '🗂️ 项目管理汇总',
        path: '/Users/yuzhoudeshengyin/Documents/my_project/project-summary/',
        memoryDir: 'memory/'
    },
    'english-learning-tts': {
        name: '🎧 英语朗读学习',
        path: '/Users/yuzhoudeshengyin/Documents/my_project/english-learning/',
        memoryDir: 'docs/'  // 这个项目使用 docs/ 作为 memory
    },
    'chiang-mai-activities': {
        name: '🏝️ 清迈活动平台',
        path: '/Users/yuzhoudeshengyin/Documents/my_project/Chiengmai/',
        memoryDir: 'public/data/'
    },
    'aisaas-video': {
        name: '🎥 AI SaaS 视频',
        path: '/Users/yuzhoudeshengyin/Desktop/AI相关项目/',
        memoryDir: 'memory/'
    },
    'clawdbot-railway': {
        name: '🤖 Clawdbot',
        path: '/Users/yuzhoudeshengyin/Documents/my_project/clawdbot-railway/',
        memoryDir: 'memory/'
    },
    'skills-development': {
        name: '⚡ 技能开发与学习',
        path: '/Users/yuzhoudeshengyin/Documents/my_project/skills/',
        memoryDir: 'docs/'
    },
    'planning-system': {
        name: '📋 Planning 系统',
        path: '/Users/yuzhoudeshengyin/Documents/my_project/',
        memoryDir: 'memory/'
    }
};

// 日志文件路径
const LOG_DATA_PATH = '/tmp/project_logs.json';

console.log('📤 开始同步工作日志到项目目录...\n');

// 检查日志文件
if (!fs.existsSync(LOG_DATA_PATH)) {
    console.log('❌ 未找到日志文件: ' + LOG_DATA_PATH);
    console.log('\n请先导出日志：');
    console.log('1. 打开 项目日志系统.html');
    console.log('2. 按 F12 打开控制台');
    console.log('3. 运行: console.log(localStorage.getItem("project_logs"))');
    console.log('4. 复制输出的 JSON 并保存到: ' + LOG_DATA_PATH);
    process.exit(1);
}

// 读取日志数据
let logsData;
try {
    const logsJson = fs.readFileSync(LOG_DATA_PATH, 'utf8');
    logsData = JSON.parse(logsJson);
    console.log(`✅ 读取到 ${logsData.length} 条日志\n`);
} catch (err) {
    console.log('❌ 无法解析日志文件: ' + err.message);
    process.exit(1);
}

// 按项目分组日志
const logsByProject = {};
logsData.forEach(log => {
    if (!logsByProject[log.projectId]) {
        logsByProject[log.projectId] = [];
    }
    logsByProject[log.projectId].push(log);
});

// 处理每个项目
Object.keys(PROJECTS).forEach(projectId => {
    const project = PROJECTS[projectId];
    const logs = logsByProject[projectId] || [];

    console.log(`📁 ${project.name}`);
    console.log(`   路径: ${project.path}`);
    console.log(`   日志: ${logs.length} 条`);

    if (logs.length === 0) {
        console.log('   ⚠️ 没有日志，跳过\n');
        return;
    }

    // 创建目录
    const memoryPath = path.join(project.path, project.memoryDir);
    if (!fs.existsSync(memoryPath)) {
        fs.mkdirSync(memoryPath, { recursive: true });
        console.log(`   ✅ 创建目录: ${project.memoryDir}`);
    }

    // 按日期分组
    const logsByDate = {};
    logs.forEach(log => {
        if (!logsByDate[log.date]) {
            logsByDate[log.date] = [];
        }
        logsByDate[log.date].push(log);
    });

    // 生成工作日志内容
    let content = `# ${project.name} - 工作日志\n\n`;
    content += `> 最后更新: ${new Date().toLocaleString('zh-CN')}\n`;
    content += `> 总日志数: ${logs.length}\n\n`;
    content += `---\n\n`;

    // 按日期排序（最新的在前）
    const sortedDates = Object.keys(logsByDate).sort().reverse();

    sortedDates.forEach(date => {
        content += `## ${date}\n\n`;
        logsByDate[date].forEach(log => {
            const time = log.timestamp ? new Date(log.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '';
            content += `### ${time || '全天'}\n\n`;
            content += `${log.content}\n\n`;
            content += `---\n\n`;
        });
    });

    // 写入文件
    const logFile = path.join(memoryPath, 'work-log.md');

    // 备份现有文件
    if (fs.existsSync(logFile)) {
        const backupPath = logFile + '.backup.' + Date.now();
        fs.copyFileSync(logFile, backupPath);
        console.log(`   ✅ 已备份现有文件`);
    }

    fs.writeFileSync(logFile, content, 'utf8');
    console.log(`   ✅ 已写入: ${project.memoryDir}work-log.md\n`);
});

console.log('✅ 同步完成！\n');
console.log('项目目录结构：');
console.log('project-name/');
console.log('├── PROJECT_START.md');
console.log('├── CLAUDE.md');
console.log('├── memory/');
console.log('│   └── work-log.md  ← 工作日志已同步');
console.log('├── docs/');
console.log('└── src/');

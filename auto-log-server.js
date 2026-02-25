#!/usr/bin/env node
/**
 * 项目日志自动生成API服务器
 * 提供Git变更检测和智能日志生成功能
 */

const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 项目配置
const PROJECTS = {
    'project-organization': {
        name: '项目组织与管理',
        path: '/Users/yuzhoudeshengyin/Documents/my_project/project summary'
    },
    'english-learning-tts': {
        name: '英语学习TTS系统',
        path: '/Users/yuzhoudeshengyin/Documents/my_project/english-learning'
    },
    'chiang-mai-activities': {
        name: '清迈活动策划',
        path: '/Users/yuzhoudeshengyin/Documents/my_project/Chiengmai'
    },
    'aisaas-video': {
        name: 'AI SaaS视频项目',
        path: '/Users/yuzhoudeshengyin/Documents/my_project/aisaasvideo'
    },
    'clawdbot-railway': {
        name: 'Clawdbot Railway模板',
        path: '/Users/yuzhoudeshengyin/Documents/my_project/clawdbot-railway-template'
    },
    'skills-development': {
        name: '技能开发与学习',
        path: '/Users/yuzhoudeshingyin/Documents/my_project/skills'
    }
};

// 检测Git变更
function checkGitChanges(projectPath, today) {
    try {
        const projectDir = projectPath;

        // 检查是否是Git仓库
        try {
            execSync('git rev-parse --git-dir', { cwd: projectDir, stdio: 'ignore' });
        } catch (e) {
            return null; // 不是Git仓库
        }

        // 获取今天的提交
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const cmd = `git log --since="${yesterdayStr} 00:00:00" --until="${today} 23:59:59" --pretty=format:"%h|%s|%ai" --reverse`;
        const output = execSync(cmd, { cwd: projectDir, encoding: 'utf-8' });

        if (!output.trim()) {
            return null; // 没有提交
        }

        const commits = output.trim().split('\n').map(line => {
            const [hash, msg, time] = line.split('|');
            return { hash, msg, time };
        });

        // 获取修改的文件统计
        const filesCmd = `git diff --stat --since="${yesterdayStr} 00:00:00" --until="${today} 23:59:59"`;
        let filesChanged = [];
        try {
            const filesOutput = execSync(filesCmd, { cwd: projectDir, encoding: 'utf-8' });
            filesChanged = filesOutput.trim().split('\n');
        } catch (e) {
            // 可能没有文件变更
        }

        return { commits, filesChanged };
    } catch (error) {
        console.error(`检查Git变更失败: ${projectPath}`, error.message);
        return null;
    }
}

// 分析提交类型
function analyzeCommitType(msg) {
    if (/修复|fix|bug|问题|error/i.test(msg)) return 'fix';
    if (/添加|新增|feat|功能|create|implement/i.test(msg)) return 'feature';
    if (/优化|改进|improve|优化|重构|refactor/i.test(msg)) return 'improvement';
    if (/文档|doc|readme|说明|guide/i.test(msg)) return 'docs';
    if (/测试|test|spec/i.test(msg)) return 'test';
    return 'other';
}

// 生成日志条目
function generateLogEntry(projectId, changes, today) {
    if (!changes || changes.commits.length === 0) {
        return null;
    }

    const project = PROJECTS[projectId];
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
        projectName: project.name,
        date: today,
        datetime: new Date().toLocaleString('zh-CN'),
        title: `${tagMap[type].name} - ${project.name}`,
        tags: [tagMap[type]],
        items: changes.commits.map(c => `✅ ${c.msg}`),
        code: null
    };
}

// API: 自动生成日志
app.post('/api/auto-generate-log', async (req, res) => {
    try {
        const { today } = req.body;
        const generatedLogs = [];
        const projectsWithChanges = [];

        // 遍历所有项目
        for (const [projectId, project] of Object.entries(PROJECTS)) {
            const changes = checkGitChanges(project.path, today);

            if (changes && changes.commits.length > 0) {
                const logEntry = generateLogEntry(projectId, changes, today);
                if (logEntry) {
                    generatedLogs.push(logEntry);
                    projectsWithChanges.push(project.name);
                }
            }
        }

        res.json({
            success: true,
            logs: generatedLogs,
            projects: projectsWithChanges,
            count: generatedLogs.length
        });
    } catch (error) {
        console.error('生成日志失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API: 获取项目状态
app.get('/api/project-status', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const status = {};

    for (const [projectId, project] of Object.entries(PROJECTS)) {
        const changes = checkGitChanges(project.path, today);
        status[projectId] = {
            name: project.name,
            hasChanges: changes !== null && changes.commits.length > 0,
            commits: changes ? changes.commits.length : 0,
            files: changes ? changes.filesChanged.length : 0
        };
    }

    res.json({
        today,
        status
    });
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        projects: Object.keys(PROJECTS).length
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log('========================================');
    console.log('项目日志API服务器');
    console.log('========================================');
    console.log(`✅ 服务器已启动: http://localhost:${PORT}`);
    console.log(`📊 监控项目数量: ${Object.keys(PROJECTS).length}`);
    console.log('');
    console.log('API端点:');
    console.log(`  POST /api/auto-generate-log - 自动生成日志`);
    console.log(`  GET  /api/project-status    - 获取项目状态`);
    console.log(`  GET  /api/health            - 健康检查`);
    console.log('========================================');
});

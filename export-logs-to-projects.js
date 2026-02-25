// 在项目日志系统页面的浏览器控制台运行此脚本
// 将工作日志导出并整理到对应项目的目录结构

(function exportLogsToProjects() {
    console.log('📤 开始导出工作日志到项目结构...\n');

    // 读取所有数据
    const logs = JSON.parse(localStorage.getItem('project_logs') || '[]');
    const projects = JSON.parse(localStorage.getItem('project_list') || '[]');

    if (logs.length === 0) {
        console.log('❌ 没有找到工作日志');
        return;
    }

    if (projects.length === 0) {
        console.log('❌ 没有找到项目列表');
        return;
    }

    console.log(`📊 找到 ${logs.length} 条日志, ${projects.length} 个项目\n`);

    // 项目路径配置
    const projectPaths = {
        'project-organization': {
            name: '🗂️ 项目管理汇总',
            path: '/Users/yuzhoudeshengyin/Documents/my_project/project-summary/'
        },
        'english-learning-tts': {
            name: '🎧 英语朗读学习',
            path: '/Users/yuzhoudeshengyin/Documents/my_project/english-learning/'
        },
        'chiang-mai-activities': {
            name: '🏝️ 清迈活动平台',
            path: '/Users/yuzhoudeshengyin/Documents/my_project/Chiengmai/'
        },
        'aisaas-video': {
            name: '🎥 AI SaaS 视频',
            path: '/Users/yuzhoudeshengyin/Desktop/AI相关项目/'
        },
        'clawdbot-railway': {
            name: '🤖 Clawdbot',
            path: '/Users/yuzhoudeshengyin/Documents/my_project/clawdbot-railway/'
        },
        'skills-development': {
            name: '⚡ 技能开发与学习',
            path: '/Users/yuzhoudeshengyin/Documents/my_project/skills/'
        },
        'planning-system': {
            name: '📋 Planning 系统',
            path: '/Users/yuzhoudeshengyin/Documents/my_project/'
        }
    };

    // 按项目分组日志
    const logsByProject = {};
    const stats = {};

    projects.forEach(project => {
        logsByProject[project.id] = [];
        stats[project.id] = { total: 0, withContent: 0 };
    });

    logs.forEach(log => {
        if (logsByProject[log.projectId]) {
            logsByProject[log.projectId].push(log);
            stats[log.projectId].total++;
            if (log.content && log.content.trim()) {
                stats[log.projectId].withContent++;
            }
        }
    });

    // 显示统计
    console.log('📈 日志分布统计：\n');
    Object.entries(stats).forEach(([projectId, stat]) => {
        const project = projects.find(p => p.id === projectId);
        const projectName = project ? project.name : projectId;
        console.log(`  ${projectName}: ${stat.withContent}/${stat.total} 条有内容`);
    });

    // 生成导出数据
    const exportData = {
        exportDate: new Date().toISOString(),
        projects: {}
    };

    Object.entries(logsByProject).forEach(([projectId, projectLogs]) => {
        if (projectLogs.length === 0) return;

        const project = projects.find(p => p.id === projectId);
        const projectConfig = projectPaths[projectId];

        if (!projectConfig) {
            console.log(`⚠️ 跳过未知项目: ${projectId}`);
            return;
        }

        // 按日期分组
        const logsByDate = {};
        projectLogs.forEach(log => {
            if (!logsByDate[log.date]) {
                logsByDate[log.date] = [];
            }
            logsByDate[log.date].push(log);
        });

        // 生成日志内容
        let logContent = `# ${projectConfig.name} - 工作日志\n\n`;
        logContent += `> 导出时间: ${new Date().toLocaleString('zh-CN')}\n`;
        logContent += `> 总日志数: ${projectLogs.length}\n\n`;
        logContent += `---\n\n`;

        // 按日期排序（最新的在前）
        const sortedDates = Object.keys(logsByDate).sort().reverse();

        sortedDates.forEach(date => {
            const dateLogs = logsByDate[date];
            logContent += `## ${date}\n\n`;

            dateLogs.forEach(log => {
                const time = log.timestamp ? log.timestamp.split('T')[1].substring(0, 5) : '';
                logContent += `### ${time || '全天'}\n\n`;
                logContent += `${log.content}\n\n`;
                logContent += `---\n\n`;
            });
        });

        exportData.projects[projectId] = {
            name: projectConfig.name,
            path: projectConfig.path,
            logCount: projectLogs.length,
            content: logContent,
            files: {
                memoryLog: `memory/work-log.md`,
                dailyLogs: []
            }
        };

        console.log(`\n✅ ${projectConfig.name}`);
        console.log(`   路径: ${projectConfig.path}`);
        console.log(`   日志: ${projectLogs.length} 条`);
    });

    // 保存到全局变量
    window.exportedLogsData = exportData;

    // 创建下载函数
    window.downloadProjectLogs = function(projectId) {
        const project = exportData.projects[projectId];
        if (!project) {
            console.log(`❌ 未找到项目: ${projectId}`);
            return;
        }

        // 创建文件
        const blob = new Blob([project.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectId}-work-log.md`;
        a.click();
        URL.revokeObjectURL(url);

        console.log(`✅ 已下载: ${projectId}-work-log.md`);
        console.log(`\n📝 请手动将文件移动到:`);
        console.log(`   ${project.path}memory/work-log.md`);
    };

    // 下载所有项目
    window.downloadAllLogs = function() {
        Object.keys(exportData.projects).forEach(projectId => {
            window.downloadProjectLogs(projectId);
        });
    };

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ 日志导出完成！\n');
    console.log('使用方法：');
    console.log('  1. downloadProjectLogs("project-id") - 下载单个项目日志');
    console.log('  2. downloadAllLogs() - 下载所有项目日志\n');
    console.log('示例：');
    Object.keys(exportData.projects).forEach(projectId => {
        const project = exportData.projects[projectId];
        console.log(`  downloadProjectLogs("${projectId}")`);
        console.log(`  → ${project.path}memory/work-log.md`);
    });

    return exportData;
})();

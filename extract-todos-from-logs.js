// 在项目日志系统页面的浏览器控制台中运行此脚本
// 按 F12 打开控制台，粘贴并运行

(function extractTodosFromLogs() {
    console.log('🔍 开始从工作日志中提取待办事项...\n');

    // 读取日志
    const logs = JSON.parse(localStorage.getItem('project_logs') || '[]');

    if (logs.length === 0) {
        console.log('❌ 没有找到工作日志');
        return;
    }

    console.log(`📊 找到 ${logs.length} 条工作日志\n`);

    // 待办关键词（按优先级排序）
    const todoKeywords = [
        // 高优先级 - 明确的待办标记
        { keyword: '待办', priority: 'high' },
        { keyword: 'TODO', priority: 'high' },
        { keyword: 'todo', priority: 'high' },
        { keyword: '待完成', priority: 'high' },
        { keyword: '未完成', priority: 'high' },

        // 中优先级 - 计划/继续的任务
        { keyword: '需要', priority: 'medium' },
        { keyword: '继续', priority: 'medium' },
        { keyword: '还要', priority: 'medium' },
        { keyword: '记得', priority: 'medium' },
        { keyword: '别忘了', priority: 'medium' },

        // 中优先级 - 技术任务
        { keyword: 'fix', priority: 'medium' },
        { keyword: '修复', priority: 'medium' },
        { keyword: '添加', priority: 'medium' },
        { keyword: '优化', priority: 'medium' },
        { keyword: '实现', priority: 'medium' },
        { keyword: '完成', priority: 'medium' }
    ];

    // 项目名称映射
    const projectNames = {
        'project-organization': '🗂️ 项目管理汇总',
        'english-learning-tts': '🎧 英语朗读学习',
        'chiang-mai-activities': '🏝️ 清迈活动平台',
        'aisaas-video': '🎥 AI SaaS 视频',
        'clawdbot-railway': '🤖 Clawdbot',
        'skills-development': '⚡ 技能开发与学习',
        'planning-system': '📋 Planning 系统'
    };

    // 提取待办
    const extractedTodos = [];
    const logStats = {};

    logs.forEach(log => {
        const projectName = projectNames[log.projectId] || log.projectId;

        if (!logStats[projectName]) {
            logStats[projectName] = { totalLogs: 0, todosFound: 0 };
        }
        logStats[projectName].totalLogs++;

        const lines = log.content.split('\n');
        lines.forEach(line => {
            const trimmedLine = line.trim();

            // 跳过空行和注释
            if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('#')) {
                return;
            }

            // 检查是否包含待办关键词
            let matchedKeyword = null;
            let matchedPriority = 'low';

            for (const kw of todoKeywords) {
                if (trimmedLine.toLowerCase().includes(kw.keyword.toLowerCase())) {
                    if (!matchedKeyword || kw.priority === 'high' ||
                        (kw.priority === 'medium' && matchedPriority === 'low')) {
                        matchedKeyword = kw.keyword;
                        matchedPriority = kw.priority;
                    }
                }
            }

            if (matchedKeyword) {
                let text = trimmedLine;

                // 移除常见的标记符号
                text = text.replace(/^[-*•+]\s*/, '');
                text = text.replace(/^(\d+)[.、]\s*/, '');
                text = text.replace(/^(待办|TODO|todo|待做|fix|Fix):\s*/i, '');
                text = text.replace(/^\[[ x]\]\s*/, '');
                text = text.trim();

                // 过滤掉太短的内容
                if (text.length >= 3) {
                    extractedTodos.push({
                        projectId: log.projectId,
                        project: projectName,
                        text: text,
                        date: log.date,
                        time: log.timestamp || '',
                        keyword: matchedKeyword,
                        priority: matchedPriority
                    });

                    logStats[projectName].todosFound++;
                }
            }
        });
    });

    // 显示结果
    console.log('📈 日志统计：\n');
    Object.entries(logStats).forEach(([project, stats]) => {
        console.log(`  ${project}: ${stats.totalLogs} 条日志, 找到 ${stats.todosFound} 个待办`);
    });

    console.log(`\n✅ 共提取到 ${extractedTodos.length} 个待办事项：\n`);

    // 按项目分组显示
    const groupedByProject = {};
    extractedTodos.forEach(todo => {
        if (!groupedByProject[todo.project]) {
            groupedByProject[todo.project] = [];
        }
        groupedByProject[todo.project].push(todo);
    });

    Object.entries(groupedByProject).forEach(([project, todos]) => {
        console.log(`\n${project} (${todos.length} 个待办)：`);
        console.log('─'.repeat(60));

        todos.forEach((todo, index) => {
            const priorityIcon = todo.priority === 'high' ? '🔴' : todo.priority === 'medium' ? '🟡' : '⚪';
            console.log(`${index + 1}. ${priorityIcon} ${todo.text}`);
            console.log(`   📅 ${todo.date} ${todo.time}`);
            console.log(`   🔑 关键词: "${todo.keyword}"`);
            console.log('');
        });
    });

    // 保存到全局变量供后续使用
    window.extractedTodosData = extractedTodos;

    // 恢复到 localStorage
    console.log('─'.repeat(60));
    console.log('\n💡 是否要恢复这些待办事项到系统？');
    console.log('   运行: restoreTodos()');

    // 创建恢复函数
    window.restoreTodos = function() {
        const todos = JSON.parse(localStorage.getItem('project_todos') || '{}');
        let restoredCount = 0;

        extractedTodos.forEach(todo => {
            if (!todos[todo.projectId]) {
                todos[todo.projectId] = [];
            }

            todos[todo.projectId].push({
                id: `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                text: todo.text,
                priority: todo.priority === 'high' ? 'high' : todo.priority === 'medium' ? 'medium' : 'low',
                status: 'pending',
                dueDate: null,
                createdAt: new Date().toISOString(),
                source: 'log-extract',
                originalDate: todo.date
            });

            restoredCount++;
        });

        localStorage.setItem('project_todos', JSON.stringify(todos));
        console.log(`\n✅ 成功恢复 ${restoredCount} 个待办事项！`);
        console.log('📝 请刷新页面查看待办清单。');
    };

    return extractedTodos;
})();

/* 直接在浏览器控制台运行此代码来恢复待办清单 */

(async function recoverTodos() {
    console.log('🔍 开始恢复待办清单...\n');

    // 检查所有可能的数据源
    const sources = [];

    // 1. localStorage - 当前键
    let data = localStorage.getItem('project_todos');
    if (data) {
        sources.push({ name: 'localStorage (project_todos)', data: JSON.parse(data) });
    }

    // 2. localStorage - 其他可能的键
    const altKeys = ['todos', 'todo_list', 'tasks', 'myTodos', 'todoData'];
    for (const key of altKeys) {
        data = localStorage.getItem(key);
        if (data) {
            try {
                sources.push({ name: `localStorage (${key})`, data: JSON.parse(data) });
            } catch(e) {}
        }
    }

    // 3. sessionStorage
    for (const key of ['project_todos', 'todos', 'todo_list', 'tasks']) {
        data = sessionStorage.getItem(key);
        if (data) {
            try {
                sources.push({ name: `sessionStorage (${key})`, data: JSON.parse(data) });
            } catch(e) {}
        }
    }

    // 4. 检查 IndexedDB
    try {
        const dbs = await indexedDB.databases();
        for (const db of dbs) {
            if (db.name && (db.name.includes('todo') || db.name.includes('project') || db.name.includes('log'))) {
                console.log(`📦 找到数据库: ${db.name}`);
                // 可以尝试读取，但需要知道具体的 store 结构
            }
        }
    } catch(e) {
        console.log('无法检查 IndexedDB');
    }

    // 显示结果
    console.log(`\n找到 ${sources.length} 个可能的数据源:\n`);

    if (sources.length === 0) {
        console.log('❌ 没有找到任何待办清单数据');
        console.log('\n💡 可能的原因:');
        console.log('   - 浏览器缓存被清空');
        console.log('   - 使用了隐私/无痕模式');
        console.log('   - 数据从未保存到 localStorage');
        console.log('\n💡 建议:');
        console.log('   1. 检查是否有备份文件');
        console.log('   2. 从今日日志中提取待办事项');
    } else {
        sources.forEach((source, index) => {
            const count = typeof source.data === 'object' ?
                Object.values(source.data).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0) :
                Array.isArray(source.data) ? source.data.length : 1;

            console.log(`${index + 1}. ${source.name} - ${count} 个待办`);

            // 自动恢复到正确的位置
            if (source.name.includes('project_todos')) {
                console.log('   ✅ 数据已在正确位置');
            } else {
                localStorage.setItem('project_todos', JSON.stringify(source.data));
                console.log('   ✅ 已恢复到 localStorage');
            }
        });

        console.log('\n✅ 恢复完成！请刷新页面查看待办清单。');
    }

    // 返回数据供手动检查
    return sources;
})();

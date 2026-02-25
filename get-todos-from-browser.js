// 在浏览器控制台运行这个脚本来恢复待办清单
// 打开 项目日志系统.html，按 F12 打开控制台，粘贴并运行此代码

(function() {
    const TODOS_KEY = 'project_todos';
    const PROJECTS_KEY = 'project_list';

    console.log('=== 🔍 开始恢复待办清单 ===\n');

    // 1. 检查当前 localStorage
    console.log('1️⃣ 检查 localStorage...');
    const todos = localStorage.getItem(TODOS_KEY);
    const projects = localStorage.getItem(PROJECTS_KEY);

    if (todos) {
        console.log('✅ 找到待办数据:');
        console.log(JSON.parse(todos));
    } else {
        console.log('❌ localStorage 中没有待办数据');
    }

    // 2. 检查所有可能的键
    console.log('\n2️⃣ 检查所有 localStorage 键...');
    const allKeys = Object.keys(localStorage);
    console.log('所有键:', allKeys);

    const possibleTodoKeys = allKeys.filter(key =>
        key.toLowerCase().includes('todo') ||
        key.toLowerCase().includes('task') ||
        key.toLowerCase().includes('project')
    );
    console.log('可能相关的键:', possibleTodoKeys);

    // 3. 尝试从 sessionStorage 恢复
    console.log('\n3️⃣ 检查 sessionStorage...');
    const sessionTodos = sessionStorage.getItem(TODOS_KEY);
    if (sessionTodos) {
        console.log('✅ sessionStorage 中找到数据:');
        console.log(JSON.parse(sessionTodos));
        // 自动恢复到 localStorage
        localStorage.setItem(TODOS_KEY, sessionTodos);
        console.log('✅ 已恢复到 localStorage');
    }

    // 4. 检查 IndexedDB
    console.log('\n4️⃣ 检查 IndexedDB...');
    const request = indexedDB.databases();
    request.then(databases => {
        console.log('IndexedDB 数据库:', databases);

        // 尝试打开可能的数据库
        databases.forEach(db => {
            if (db.name.includes('todo') || db.name.includes('project')) {
                console.log('找到可能相关的数据库:', db.name);
            }
        });
    });

    // 5. 显示当前日期的日志
    console.log('\n5️⃣ 显示今天的工作日志（可能包含待办事项）...');
    const logs = JSON.parse(localStorage.getItem('project_logs') || '[]');
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(log => log.date === today);

    if (todayLogs.length > 0) {
        console.log(`✅ 找到 ${todayLogs.length} 条今日日志:`);
        todayLogs.forEach((log, index) => {
            console.log(`\n日志 ${index + 1}:`);
            console.log(`项目: ${log.projectId}`);
            console.log(`内容: ${log.content}`);
        });
    } else {
        console.log('❌ 没有今日日志');
    }

    // 6. 尝试从缓存恢复（如果有自动保存的文件句柄）
    console.log('\n6️⃣ 检查文件系统访问权限...');
    if (window.showOpenFilePicker) {
        console.log('✅ 浏览器支持文件系统访问');
        console.log('提示: 可以尝试使用"导入数据"功能从之前的备份文件恢复');
    }

    console.log('\n=== ✅ 检查完成 ===');
    console.log('\n💡 提示: 如果找到数据，请复制并手动保存');
})();

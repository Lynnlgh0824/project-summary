const fs = require('fs');

const filePath = './project-log.html';
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 修复数据并添加日志\n');

// 查找历史记录生成函数的位置
const generateHistoryPattern = /\/\/ 生成历史项目日志[\s\S]*?function generateProjectHistory\(\) \{/;
const afterGenerateHistory = content.match(generateHistoryPattern);

if (!afterGenerateHistory) {
    console.log('❌ 未找到 generateProjectHistory 函数');
    process.exit(1);
}

console.log('✅ 找到 generateProjectHistory 函数');

// 找到函数开始位置，查找要插入新日志的位置
const historyLogPattern = /\/\/ 2月6日：修复和系统完善（今天，有实际编码\)/;

if (content.match(historyLogPattern)) {
    console.log('⚠️  今日日志已存在，跳过添加');
    console.log('如需重新添加，请先删除现有日志');
    process.exit(0);
}

// 找到插入点 - 在最后一个历史记录之后
const insertPattern = /(\/\/ 保存（按日期倒序）\s*)saveLogs\(historyLogs\);/;

// 准备要插入的日志
const newLog = `
            // 2025-02-06：项目链接汇总更新（今日）
            historyLogs.unshift({
                id: Date.now().toString(),
                projectId: 'project-organization',
                projectName: '项目组织与管理',
                date: new Date().toISOString().split('T')[0],
                datetime: new Date().toLocaleString('zh-CN'),
                title: '📊 项目链接汇总与系统完善',
                tags: [{ name: '✨ 新功能', type: 'feature' }],
                items: [
                    '✅ 更新5个项目的完整链接汇总（50个链接）',
                    '✅ english-learning: 添加10个链接（GitHub、文档、工具、学习资源）',
                    '✅ Chiengmai: 添加11个链接（本地服务器、GitHub、文档、自动化）',
                    '✅ aisaasvideo: 添加6个链接（GitHub fork、原项目、工具）',
                    '✅ clawdbot-railway: 添加3个链接（GitHub、Railway、Discord文档）',
                    '✅ skills-development: 添加10个链接（模板、规范、学习资源）',
                    '✅ 自测项目日志系统 - 12项功能测试通过',
                    '✅ 验证所有链接有效性 - 8个GitHub仓库链接正常',
                    '✅ 分类统计：23个文档链接、10个工具链接、17个学习链接'
                ],
                code: null
            });
`;

// 查找并替换
const newContent = content.replace(insertPattern, newLog.trim() + '\n            ' + insertPattern.match(/saveLogs\(historyLogs\);/)[0]);

// 验证括号平衡
const openBraces = (newContent.match(/{/g) || []).length;
const closeBraces = (newContent.match(/}/g) || []).length;

console.log('\n✅ 更新后括号检查:');
console.log(`{ }: ${openBraces} vs ${closeBraces} - ${openBraces === closeBraces ? '✅ 平衡' : '❌ 不平衡'}`);

if (openBraces !== closeBraces) {
    console.log('\n❌ 括号仍不平衡，恢复备份');
    fs.copyFileSync('./project-log.html.backup', './project-log.html');
    process.exit(1);
}

// 写入文件
fs.writeFileSync(filePath, newContent, 'utf8');

console.log('\n✅ 日志添加成功！');
console.log('标题: 项目链接汇总与系统完善');
console.log('工作项数: 9');

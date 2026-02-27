// 在项目日志系统页面的浏览器控制台运行此脚本
// 生成昨天和今天的所有项目总结并添加到日志中

(function generateDailySummaries() {
    console.log('📝 开始生成项目总结...\n');

    // 获取现有数据
    const projects = JSON.parse(localStorage.getItem('project_list') || '[]');
    const logs = JSON.parse(localStorage.getItem('project_logs') || '[]');

    // 今天和昨天的日期
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    console.log(`📅 生成日期: ${yesterday} 和 ${today}\n`);

    // 项目总结模板
    const summaries = {
        'project-organization': {
            name: '🗂️ 项目管理汇总',
            yesterday: {
                title: '项目日志系统功能完善',
                content: `**主要工作：**
- 完善项目文档结构（CLAUDE.md, PROJECT_RULES.md）
- 添加项目文档系统（docs/, memory/, tests/）
- 创建待办清单恢复工具
  * check-todos.html - 待办数据检查工具
  * restore-todos.html - 智能恢复工具
  * console-recover.js - 控制台恢复脚本
- 添加快速启动脚本生成器
  * quick-start.sh - Shell脚本
  * 项目路径配置系统
- 创建变更日志系统

**技术实现：**
- localStorage数据恢复机制
- 浏览器控制台脚本
- HTML恢复界面工具

**问题解决：**
- 待办清单数据丢失问题
- 项目启动模板标准化`
            },
            today: {
                title: 'Git提交和代码整理',
                content: `**主要工作：**
- 提交所有项目到Git仓库
  * 项目管理汇总：32个文件
  * 英语朗读学习：46个文件
  * 清迈活动平台：18个文件
  * 技能开发与学习：9个文件（新初始化）
- 完善项目启动脚本功能
  * 为每个项目配置专属路径
  * 自动替换项目文件名称
- 创建日志同步工具
  * sync-logs.js - Node.js脚本
  * export-logs-to-projects.js - 浏览器脚本

**技术实现：**
- Git批量提交和版本控制
- 项目路径动态配置
- 自动化脚本工具链

**待办事项：**
- [ ] 待办清单数据恢复中
- [ ] 测试各项目启动脚本`
            }
        },
        'english-learning-tts': {
            name: '🎧 英语朗读学习',
            yesterday: {
                title: 'TTS系统架构优化',
                content: `**主要工作：**
- 完善项目文档结构
  * CLAUDE.md - AI协作规范
  * PROJECT_RULES.md - 开发规则
  * docs/ - 技术文档目录
  * memory/ - 项目记忆目录
  * tests/ - 测试文档目录
- 创建测试和验证工具
  * automated-e2e-test.js - E2E自动化测试
  * validate-content.sh - 内容验证脚本
  * USER-AUTOMATION-TEST-GUIDE.md - 测试指南
- 添加学习记录生成工具
  * convert-md-to-html.py - MD转HTML
  * generate-english-learning-html.sh
  * generate-tennis-html.sh

**新增学习内容：**
- 初学者网球课程（2026-02-24）
- YouTube英语学习方法（2026-02-26）

**技术实现：**
- Git hooks（pre-commit验证）
- package.json配置管理
- 自动化测试框架`
            },
            today: {
                title: '项目文档完善和提交',
                content: `**主要工作：**
- 提交46个文件到Git
  * 项目规范文档
  * 测试工具和脚本
  * 学习记录生成工具
  * 技术文档和指南
- 设置pre-commit hooks
  * 自动验证学习记录内容
  * 检查标题一致性
  * 验证Markdown语法

**文档完善：**
- CONTENT-VALIDATION-GUIDE.md
- QUICK-REF-CHECK.md
- USER-AUTOMATION-TEST-GUIDE.md
- API文档和架构文档

**技术亮点：**
- 自动化内容验证
- Git hooks集成
- 完整的测试工具链`
            }
        },
        'chiang-mai-activities': {
            name: '🏝️ 清迈活动平台',
            yesterday: {
                title: '项目文档重组',
                content: `**主要工作：**
- 重组项目文档结构
  * 移除旧的 __tests__ 目录
  * 创建新的 tests/ 目录
  * 统一文档组织方式
- 添加项目规范文档
  * PROJECT_CONTEXT.md
  * PROJECT_RULES.md
  * PROJECT_STRUCTURE.md
- 完善记忆系统
  * memory/decisions.md - 技术决策
  * memory/mistakes.md - 错误总结
  * memory/progress.md - 进度追踪

**文档体系：**
- 用户指南（部署、快速开始、故障排除）
- 产品文档
- API文档
- 决策记录`
            },
            today: {
                title: '代码整理和Git提交',
                content: `**主要工作：**
- 提交18个文件到Git
  * 5个文件删除（旧测试）
  * 13个新文件（文档）
- 完善项目总结文档
- 更新CLAUDE.md协作规范

**Pre-commit检查：**
- 自动检测注释代码
- console.log检查
- 代码质量验证

**项目状态：**
- 文档结构完善
- 测试体系重组
- Git hooks正常工作`
            }
        },
        'skills-development': {
            name: '⚡ 技能开发与学习',
            yesterday: {
                title: '项目初始化',
                content: `**项目创建：**
- 创建技能开发与学习项目目录
- 添加B站音频下载工具
  * bilibili-audio.js
  * package.json配置
  * README文档
- 添加夸克网盘下载工具
  * quark-download.py

**工具功能：**
- B站视频音频批量下载
- 自动转换为MP3格式
- 音频质量调节
- 夸克网盘资源下载`
            },
            today: {
                title: 'Git仓库初始化',
                content: `**主要工作：**
- 初始化Git仓库
- 提交9个文件
  * README.md
  * bili-audio-downloader/
  * kuake-audio-downloader/

**项目目的：**
- 学习实用技能工具开发
- 探索自动化下载方案
- 集成第三方工具（yt-dlp, ffmpeg）

**技术栈：**
- Node.js (B站工具)
- Python (夸克工具)
- Shell脚本集成`
            }
        }
    };

    // 生成日志条目
    const newLogs = [];

    projects.forEach(project => {
        const summary = summaries[project.id];
        if (!summary) return;

        // 昨天的日志
        if (summary.yesterday) {
            newLogs.push({
                id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                projectId: project.id,
                date: yesterday,
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                content: `## ${summary.yesterday.title}\n\n${summary.yesterday.content}`,
                createdAt: new Date(Date.now() - 86400000).toISOString()
            });
        }

        // 今天的日志
        if (summary.today) {
            newLogs.push({
                id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                projectId: project.id,
                date: today,
                timestamp: new Date().toISOString(),
                content: `## ${summary.today.title}\n\n${summary.today.content}`,
                createdAt: new Date().toISOString()
            });
        }
    });

    // 添加到日志
    const updatedLogs = [...logs, ...newLogs];
    localStorage.setItem('project_logs', JSON.stringify(updatedLogs));

    // 显示结果
    console.log('✅ 已生成项目总结：\n');
    newLogs.forEach(log => {
        const project = projects.find(p => p.id === log.projectId);
        console.log(`📁 ${project.name}`);
        console.log(`   📅 ${log.date}`);
        console.log(`   📝 ${log.content.split('\n')[0].substring(3)}`); // 提取标题
        console.log('');
    });

    console.log(`\n📊 总计添加 ${newLogs.length} 条总结日志`);
    console.log('📝 请刷新页面查看最新日志。');

    // 返回新日志
    return newLogs;
})();

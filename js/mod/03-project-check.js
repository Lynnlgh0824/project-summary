        // ==================== 项目检查功能 ====================

        // 运行项目检查
        async function runProjectCheck() {
            const container = document.getElementById('checkResults');
            container.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 40px; margin-bottom: 15px;">🔍</div>
                    <p>正在检查项目文件...</p>
                </div>
            `;

            const results = {
                workflow: { name: '工作流程文档', status: 'unknown', items: [] },
                planning: { name: '规划文件', status: 'unknown', items: [] },
                projects: { name: '项目配置', status: 'unknown', items: [] },
                scripts: { name: '管理脚本', status: 'unknown', items: [] }
            };

            // 检查工作流程文档
            try {
                const workflowFiles = [
                    { path: '~/WORKFLOW.md', desc: 'AI 助手工作流程规范' },
                    { path: '~/PROJECTS-CONFIG.md', desc: '项目配置指南' },
                    { path: '~/PROJECTS.md', desc: '项目端口配置' },
                    { path: '~/PROJECT-CHECKLIST.md', desc: '项目配置清单' }
                ];

                for (const file of workflowFiles) {
                    results.workflow.items.push({
                        file: file.path,
                        desc: file.desc,
                        exists: await checkFileExists(file.path)
                    });
                }
                results.workflow.status = results.workflow.items.every(i => i.exists) ? 'ok' : 'warning';
            } catch (e) {
                results.workflow.status = 'error';
            }

            // 检查规划文件
            try {
                const planningFiles = [
                    { path: '~/task_plan.md', desc: '任务计划' },
                    { path: '~/findings.md', desc: '研究发现' },
                    { path: '~/progress.md', desc: '进度日志' }
                ];

                for (const file of planningFiles) {
                    results.planning.items.push({
                        file: file.path,
                        desc: file.desc,
                        exists: await checkFileExists(file.path)
                    });
                }
                results.planning.status = results.planning.items.every(i => i.exists) ? 'ok' : 'warning';
            } catch (e) {
                results.planning.status = 'error';
            }

            // 检查管理脚本
            try {
                const scriptFiles = [
                    { path: '~/projects.sh', desc: '统一启动脚本' },
                    { path: '~/test-projects.sh', desc: '自动化测试脚本' },
                    { path: '~/QUICKSTART.sh', desc: '快速启动别名' }
                ];

                for (const file of scriptFiles) {
                    results.scripts.items.push({
                        file: file.path,
                        desc: file.desc,
                        exists: await checkFileExists(file.path)
                    });
                }
                results.scripts.status = results.scripts.items.every(i => i.exists) ? 'ok' : 'warning';
            } catch (e) {
                results.scripts.status = 'error';
            }

            // 检查项目目录
            try {
                const projectDirs = [
                    { path: '~/Documents/my_project/aisaasvideo', name: 'VideoFly', port: 3000 },
                    { path: '~/Documents/my_project/Chiengmai', name: 'Chiengmai', port: 4000 },
                    { path: '~/Documents/my_project/clawdbot-railway-template', name: 'clawdbot', port: 8080 }
                ];

                for (const proj of projectDirs) {
                    results.projects.items.push({
                        name: proj.name,
                        path: proj.path,
                        port: proj.port,
                        exists: await checkFileExists(proj.path)
                    });
                }
                results.projects.status = results.projects.items.every(i => i.exists) ? 'ok' : 'warning';
            } catch (e) {
                results.projects.status = 'error';
            }

            // 渲染结果
            renderCheckResults(results);
        }

        // 检查文件是否存在（模拟）
        async function checkFileExists(path) {
            // 注意：浏览器无法直接访问文件系统
            // 这里返回一个模拟结果，实际使用时需要后端支持
            return new Promise(resolve => {
                // 基于文件名返回模拟结果
                const knownFiles = [
                    '~/WORKFLOW.md',
                    '~/PROJECTS-CONFIG.md',
                    '~/PROJECTS.md',
                    '~/PROJECT-CHECKLIST.md',
                    '~/task_plan.md',
                    '~/findings.md',
                    '~/progress.md',
                    '~/projects.sh',
                    '~/test-projects.sh',
                    '~/QUICKSTART.sh',
                    '~/Documents/my_project/aisaasvideo',
                    '~/Documents/my_project/Chiengmai',
                    '~/Documents/my_project/clawdbot-railway-template'
                ];
                setTimeout(() => {
                    resolve(knownFiles.includes(path));
                }, 100);
            });
        }

        // 渲染检查结果
        function renderCheckResults(results) {
            const container = document.getElementById('checkResults');

            const statusIcons = {
                ok: '✅',
                warning: '⚠️',
                error: '❌',
                unknown: '❓'
            };

            const statusColors = {
                ok: '#5a5a5a',
                warning: '#8a8a8a',
                error: '#7a7a7a',
                unknown: '#6b7280'
            };

            let html = '<div style="display: flex; flex-direction: column; gap: 20px;">';

            // 工作流程文档
            html += renderCheckSection('workflow', results.workflow, statusIcons, statusColors);

            // 规划文件
            html += renderCheckSection('planning', results.planning, statusIcons, statusColors);

            // 项目目录
            html += renderCheckSection('projects', results.projects, statusIcons, statusColors);

            // 管理脚本
            html += renderCheckSection('scripts', results.scripts, statusIcons, statusColors);

            html += '</div>';

            // 添加说明
            html += `
                <div style="margin-top: 30px; padding: 15px; background: #f0f0f0; border-radius: 8px; border-left: 4px solid #5a5a5a;">
                    <p style="margin: 0; font-size: 13px; color: #6a6a6a;">
                        💡 <strong>提示：</strong>此检查基于已知文件列表。要使 AI 助手每次执行任务前自动检查，
                        请在 ~/WORKFLOW.md 中定义工作流程规范。
                    </p>
                </div>
            `;

            container.innerHTML = html;
        }

        // 渲染检查部分
        function renderCheckSection(key, data, statusIcons, statusColors) {
            const icon = statusIcons[data.status] || statusIcons.unknown;
            const color = statusColors[data.status] || statusColors.unknown;

            let html = `
                <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                    <div style="padding: 15px 20px; background: linear-gradient(135deg, ${color}15, ${color}08); border-bottom: 1px solid ${color}20; display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 20px;">${icon}</span>
                        <span style="font-weight: 600; color: ${color};">${data.name}</span>
                        <span style="margin-left: auto; font-size: 12px; color: #6a6a6a;">
                            ${data.items.filter(i => i.exists || i.exists === undefined).length}/${data.items.length} 存在
                        </span>
                    </div>
                    <div style="padding: 15px 20px;">
            `;

            if (key === 'projects') {
                // 项目目录格式
                data.items.forEach(item => {
                    const exists = item.exists;
                    html += `
                        <div style="padding: 10px; margin-bottom: 8px; background: ${exists ? '#f0f0f0' : '#f5f5f5'}; border-radius: 6px; border-left: 3px solid ${exists ? '#5a5a5a' : '#7a7a7a'}; display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 16px;">${exists ? '✅' : '❌'}</span>
                            <div style="flex: 1;">
                                <div style="font-weight: 500; color: ${exists ? '#4a4a4a' : '#5a5a5a'};">${item.name}</div>
                                <div style="font-size: 12px; color: #6a6a6a;">${item.path} · 端口 ${item.port}</div>
                            </div>
                        </div>
                    `;
                });
            } else {
                // 文件格式
                data.items.forEach(item => {
                    const exists = item.exists;
                    html += `
                        <div style="padding: 10px; margin-bottom: 8px; background: ${exists ? '#f0f0f0' : '#f5f5f5'}; border-radius: 6px; border-left: 3px solid ${exists ? '#5a5a5a' : '#7a7a7a'}; display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 16px;">${exists ? '✅' : '❌'}</span>
                            <div style="flex: 1;">
                                <div style="font-weight: 500; color: ${exists ? '#4a4a4a' : '#5a5a5a'};">${item.desc}</div>
                                <div style="font-size: 12px; color: #6a6a6a;">${item.file}</div>
                            </div>
                            ${exists ? `<a href="#" onclick="event.preventDefault(); window.open('file://${item.file.replace('~', '/Users/yuzhoudeshengyin')}')" style="padding: 5px 12px; background: #5a5a5a; color: white; border-radius: 4px; font-size: 12px; text-decoration: none;">查看</a>` : ''}
                        </div>
                    `;
                });
            }

            html += `
                    </div>
                </div>
            `;

            return html;
        }

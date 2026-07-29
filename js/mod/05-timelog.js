        // ==================== 任务用时分析 ====================
        function parseTimeLog(logs) {
            const taskPattern = /—\s*(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+完成/;
            const results = [];

            logs.forEach(log => {
                log.items.forEach(item => {
                    const match = item.match(taskPattern);
                    if (match) {
                        const taskName = item.replace(taskPattern, '').replace(/^[\s✅⏳🔄🔲]+/, '').trim();
                        const start = parseTime(match[1]);
                        const end = parseTime(match[2]);
                        const duration = end >= start ? end - start : (24 * 60 - start) + end;
                        results.push({
                            projectId: log.projectId,
                            projectName: log.projectName,
                            taskName: taskName,
                            startTime: match[1],
                            endTime: match[2],
                            duration: duration
                        });
                    }
                });
            });
            return results;
        }

        function parseTime(timeStr) {
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + m;
        }

        function formatDuration(minutes) {
            const h = Math.floor(minutes / 60);
            const m = minutes % 60;
            if (h > 0 && m > 0) return `${h}h${m}m`;
            if (h > 0) return `${h}h`;
            return `${m}m`;
        }

        function renderTimeLogContent() {
            const container = document.getElementById('timelogContent');
            const logs = getLogs();
            const tasks = parseTimeLog(logs);

            // 按项目汇总
            const byProject = {};
            tasks.forEach(t => {
                if (!byProject[t.projectName]) byProject[t.projectName] = { total: 0, tasks: [] };
                byProject[t.projectName].total += t.duration;
                byProject[t.projectName].tasks.push(t);
            });

            // 总用时
            const totalMinutes = tasks.reduce((sum, t) => sum + t.duration, 0);

            let html = `
                <div style="margin-bottom: 20px;">
                    <h2 style="margin-bottom: 5px;">📊 任务用时分析</h2>
                    <p style="color: #888; font-size: 13px; margin-top: 0;">从日志 items 中提取「— HH:mm HH:mm 完成」格式的任务用时</p>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 25px;">
                    <div class="stat-card">
                        <div class="stat-value">${tasks.length}</div>
                        <div class="stat-label">任务总数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${formatDuration(totalMinutes)}</div>
                        <div class="stat-label">累计用时</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${tasks.length > 0 ? formatDuration(Math.round(totalMinutes / tasks.length)) : '0m'}</div>
                        <div class="stat-label">平均用时</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${Object.keys(byProject).length}</div>
                        <div class="stat-label">涉及项目</div>
                    </div>
                </div>
            `;

            if (tasks.length === 0) {
                html += `
                    <div class="empty-state" style="padding: 40px; text-align: center; color: #999;">
                        <div style="font-size: 48px; margin-bottom: 15px;">📝</div>
                        <p>暂无用时记录</p>
                        <p style="font-size: 13px;">在日志 items 中使用以下格式记录任务用时：<br>
                        <code style="background: #f0f0f0; padding: 3px 8px; border-radius: 4px;">✅ 任务名称 — 10:30 16:00 完成</code></p>
                    </div>
                `;
            } else {
                // 按项目展示
                Object.entries(byProject)
                    .sort((a, b) => b[1].total - a[1].total)
                    .forEach(([projectName, data]) => {
                        const barWidth = Math.round((data.total / totalMinutes) * 100);
                        html += `
                            <div style="background: #f8f9fa; border-radius: 10px; padding: 15px; margin-bottom: 12px; border: 1px solid #e9ecef;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <span style="font-weight: 600; font-size: 14px;">${projectName}</span>
                                    <span style="font-size: 13px; color: #666;">${formatDuration(data.total)}</span>
                                </div>
                                <div style="background: #e9ecef; border-radius: 4px; height: 8px; overflow: hidden;">
                                    <div style="background: #3a3a3a; height: 100%; width: ${barWidth}%; border-radius: 4px; transition: width 0.3s;"></div>
                                </div>
                                <div style="font-size: 12px; color: #888; margin-top: 6px;">${data.tasks.length} 个任务</div>
                            </div>
                        `;
                    });
            }

            container.innerHTML = html;
        }

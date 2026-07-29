        // ==================== 数据统计图表 ====================
        function renderStatsContent() {
            const container = document.getElementById('statsContent');
            const logs = getLogs();
            const projects = getProjects();

            const today = new Date();
            const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            const thisWeekStart = new Date(today);
            thisWeekStart.setDate(today.getDate() - today.getDay() + 1);
            const thisWeekStartStr = thisWeekStart.toISOString().split('T')[0];

            const monthLogs = logs.filter(l => l.date >= thisMonthStart);
            const weekLogs = logs.filter(l => l.date >= thisWeekStartStr);

            // 按项目统计
            const monthByProject = {};
            const weekByProject = {};

            monthLogs.forEach(l => {
                monthByProject[l.projectName] = (monthByProject[l.projectName] || 0) + 1;
            });
            weekLogs.forEach(l => {
                weekByProject[l.projectName] = (weekByProject[l.projectName] || 0) + 1;
            });

            const allProjectNames = [...new Set([...Object.keys(monthByProject), ...Object.keys(weekByProject)])];
            const maxMonth = Math.max(...Object.values(monthByProject), 1);
            const maxWeek = Math.max(...Object.values(weekByProject), 1);

            // 月度趋势
            const monthTrend = {};
            logs.forEach(l => {
                const week = getWeekLabel(l.date);
                monthTrend[week] = (monthTrend[week] || 0) + 1;
            });
            const weeks = Object.keys(monthTrend).sort().slice(-8);
            const maxTrend = Math.max(...weeks.map(w => monthTrend[w]), 1);

            // 环形图数据
            const totalMonthLogs = monthLogs.length || 1;

            let html = `
                <div style="margin-bottom: 20px;">
                    <h2 style="margin-bottom: 5px;">📈 数据统计</h2>
                    <p style="color: #888; font-size: 13px; margin-top: 0;">本月: ${thisMonthStart.slice(0, 7)} | 本周: ${thisWeekStartStr} ~ ${today.toISOString().split('T')[0]}</p>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 25px;">
                    <div class="stat-card">
                        <div class="stat-value">${logs.length}</div>
                        <div class="stat-label">总日志</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${monthLogs.length}</div>
                        <div class="stat-label">本月</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${weekLogs.length}</div>
                        <div class="stat-label">本周</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${projects.length}</div>
                        <div class="stat-label">项目数</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <!-- 本月各项目柱状图 -->
                    <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; border: 1px solid #e9ecef;">
                        <h4 style="margin: 0 0 15px 0; font-size: 14px;">📅 本月各项目日志数</h4>
                        ${allProjectNames.map(name => {
                            const count = monthByProject[name] || 0;
                            const pct = Math.round((count / maxMonth) * 100);
                            return `
                                <div style="margin-bottom: 10px;">
                                    <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                                        <span>${name}</span><span style="color: #666;">${count}</span>
                                    </div>
                                    <div style="background: #e9ecef; border-radius: 4px; height: 10px;">
                                        <div style="background: #3a3a3a; height: 100%; width: ${pct}%; border-radius: 4px; transition: width 0.3s;"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <!-- 本周各项目柱状图 -->
                    <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; border: 1px solid #e9ecef;">
                        <h4 style="margin: 0 0 15px 0; font-size: 14px;">📅 本周各项目日志数</h4>
                        ${allProjectNames.map(name => {
                            const count = weekByProject[name] || 0;
                            const pct = Math.round((count / maxWeek) * 100);
                            return `
                                <div style="margin-bottom: 10px;">
                                    <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                                        <span>${name}</span><span style="color: #666;">${count}</span>
                                    </div>
                                    <div style="background: #e9ecef; border-radius: 4px; height: 10px;">
                                        <div style="background: #5a5a5a; height: 100%; width: ${pct}%; border-radius: 4px; transition: width 0.3s;"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- 本月趋势折线图（CSS） -->
                <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; border: 1px solid #e9ecef; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 15px 0; font-size: 14px;">📈 月度趋势（最近 ${weeks.length} 周）</h4>
                    <div style="display: flex; align-items: flex-end; gap: 8px; height: 100px;">
                        ${weeks.map(week => {
                            const count = monthTrend[week];
                            const h = Math.max(Math.round((count / maxTrend) * 80), 4);
                            return `
                                <div style="flex: 1; text-align: center;">
                                    <div style="background: #3a3a3a; border-radius: 4px 4px 0 0; height: ${h}px; transition: height 0.3s;" title="${week}: ${count}条"></div>
                                    <div style="font-size: 10px; color: #888; margin-top: 4px; transform: rotate(-45deg); white-space: nowrap; transform-origin: top left;">${week}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- 本月占比环形图（CSS） -->
                <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; border: 1px solid #e9ecef;">
                    <h4 style="margin: 0 0 15px 0; font-size: 14px;">🥧 本月各项目占比</h4>
                    <div style="display: flex; align-items: center; gap: 30px; flex-wrap: wrap;">
                        <div style="position: relative; width: 120px; height: 120px; flex-shrink: 0;">
                            <svg viewBox="0 0 36 36" style="width: 120px; height: 120px; transform: rotate(-90deg);">
                                ${buildDonutSegments(Object.entries(monthByProject), totalMonthLogs)}
                            </svg>
                        </div>
                        <div style="flex: 1; min-width: 150px;">
                            ${Object.entries(monthByProject)
                                .sort((a, b) => b[1] - a[1])
                                .map(([name, count], i) => {
                                    const pct = Math.round((count / totalMonthLogs) * 100);
                                    const colors = ['#3a3a3a','#5a5a5a','#7a7a7a','#9a9a9a','#b0b0b0','#c8c8c8'];
                                    return `
                                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px;">
                                            <span style="display: inline-block; width: 12px; height: 12px; background: ${colors[i % colors.length]}; border-radius: 3px;"></span>
                                            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${name}</span>
                                            <span style="color: #666;">${count} (${pct}%)</span>
                                        </div>
                                    `;
                                }).join('')}
                        </div>
                    </div>
                </div>
            `;

            container.innerHTML = html;
        }

        function buildDonutSegments(data, total) {
            const colors = ['#3a3a3a','#5a5a5a','#7a7a7a','#9a9a9a','#b0b0b0','#c8c8c8'];
            let cumulative = 0;
            return data.map(([name, count], i) => {
                const pct = count / total;
                const dasharray = (pct * 100).toFixed(1) + ' ' + (100 - pct * 100).toFixed(1);
                const dashoffset = (cumulative * 100).toFixed(1);
                cumulative += pct;
                return `<circle cx="18" cy="18" r="14" fill="none" stroke="${colors[i % colors.length]}" stroke-width="4" stroke-dasharray="${dasharray}" stroke-dashoffset="${dashoffset}" />`;
            }).join('');
        }

        function getWeekLabel(dateStr) {
            const d = new Date(dateStr);
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            const day = d.getDate();
            const week = Math.ceil(day / 7);
            return `${year}-${month.toString().padStart(2,'0')}W${week}`;
        }

        // ============ 时间统计视图（5月大迭代补全：工时/时段统计） ============
        const TIME_RULES = {
            sleepWindow: { start: '01:00', end: '09:00' },
            periodColors: { '早上': '#ff9800', '下午': '#4CAF50', '晚上': '#607d8b' },
            periodRanges: [
                { start: '00:00', end: '12:00', label: '早上' },
                { start: '12:00', end: '19:00', label: '下午' },
                { start: '19:00', end: '24:00', label: '晚上' }
            ]
        };

        function timeToMinutes(t) {
            const [h, m] = (t || '0:0').split(':').map(Number);
            return (h || 0) * 60 + (m || 0);
        }

        function isInSleepWindow(time) {
            const mins = timeToMinutes(time);
            const s = timeToMinutes(TIME_RULES.sleepWindow.start);
            const e = timeToMinutes(TIME_RULES.sleepWindow.end);
            return mins >= s && mins < e;
        }

        function getPeriodLabel(start) {
            const mins = timeToMinutes(start);
            for (const p of TIME_RULES.periodRanges) {
                if (mins >= timeToMinutes(p.start) && mins < timeToMinutes(p.end)) return p.label;
            }
            return '晚上';
        }

        // 只显示到当前时间（仅当天生效，历史日期原样返回）
        function filterTimeStatsByNow(timeStats, dateStr) {
            const now = new Date();
            const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
            if (dateStr !== today) return timeStats;
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            return timeStats.filter(t => {
                const statHour = parseInt((t.start || '0:0').split(':')[0], 10);
                if (statHour > currentHour) return false;
                if (statHour === currentHour && currentMinute < 30) return true;
                if (statHour === currentHour && currentMinute >= 30) return false;
                return true;
            });
        }

        // 单条校验：睡眠异常(error) / 时段不匹配(warning)
        function validateTimeStat(stat) {
            const issues = [];
            if (isInSleepWindow(stat.start) && isInSleepWindow(stat.end)) {
                issues.push({ level: 'error', msg: '起止时间均在睡眠窗口(01:00-09:00)，可能是时间戳偏移错误' });
            }
            if (stat.period && stat.period !== getPeriodLabel(stat.start)) {
                issues.push({ level: 'warning', msg: '时段应为「' + getPeriodLabel(stat.start) + '」而非「' + stat.period + '」' });
            }
            return issues;
        }

        // 整天校验：首条异常 / 时间重叠 / 大间隙(>120min) / 末条异常
        function validateDayTimeStats(timeStats) {
            const anomalies = [];
            const suggestions = [];
            if (!timeStats || !timeStats.length) return { anomalies, suggestions };
            if (isInSleepWindow(timeStats[0].start)) {
                anomalies.push({ index: 0, stat: timeStats[0], issue: '首条记录开始时间在睡眠窗口内，可能是时间戳偏移错误', suggest: '检查时间提取逻辑或手动修正' });
            }
            for (let i = 1; i < timeStats.length; i++) {
                const prev = timeStats[i - 1], cur = timeStats[i];
                const prevEnd = timeToMinutes(prev.end);
                const curStart = timeToMinutes(cur.start);
                if (curStart < prevEnd) {
                    anomalies.push({ index: i, stat: cur, issue: '时间重叠：当前开始(' + cur.start + ')早于上一条结束(' + prev.end + ')', suggest: '检查是否有重复记录' });
                } else if (curStart - prevEnd > 120) {
                    suggestions.push({ index: i, stat: cur, msg: '与上一条间隔 ' + (curStart - prevEnd) + ' 分钟（>120），存在空档' });
                }
            }
            const last = timeStats[timeStats.length - 1];
            if (isInSleepWindow(last.start)) {
                anomalies.push({ index: timeStats.length - 1, stat: last, issue: '末条记录涉及睡眠窗口，可能是跨天任务', suggest: '确认是否跨天' });
            }
            return { anomalies, suggestions };
        }

        async function renderTimeStatContent() {
            const root = document.getElementById('timestatContent');
            if (!root) return;
            root.innerHTML = '<div style="padding:24px;color:#999;">⏳ 正在从服务器加载时间统计数据…</div>';
            try {
                const resp = await fetch('/api/timestats');
                const data = await resp.json();
                const byDate = data.data || {};
                const dates = (data.dates || []).slice().sort().reverse(); // 最新在前
                if (!dates.length) {
                    root.innerHTML = '<div style="padding:24px;color:#999;">暂无时间统计数据。请先运行 <code>node auto_extract_session.js --all</code> 提取 session 时间统计。</div>';
                    return;
                }
                let totalEntries = 0, inferredDays = 0;
                let totalSleepEntries = 0, sleepDaysCount = 0;
                dates.forEach(d => {
                    const arr = byDate[d] || [];
                    totalEntries += arr.length;
                    if (arr.some(s => s.inferred)) inferredDays++;
                    const se = arr.filter(s => s && (isInSleepWindow(s.start) || isInSleepWindow(s.end))).length;
                    totalSleepEntries += se;
                    if (se > 0) sleepDaysCount++;
                });

                // ---- 月度聚合 & 覆盖率 & 空白档期 & 睡眠时段分析 ----
                const monthMap = {};
                dates.forEach(d => {
                    const m = d.slice(0, 7);
                    const arr = byDate[d] || [];
                    if (!monthMap[m]) monthMap[m] = { days: 0, entries: 0, inferredDays: 0 };
                    monthMap[m].days++;
                    monthMap[m].entries += arr.length;
                    if (arr.some(s => s.inferred)) monthMap[m].inferredDays++;
                });
                const months = Object.keys(monthMap).sort();
                const sortedAsc = dates.slice().sort();
                const minD = new Date(sortedAsc[0] + 'T00:00:00');
                const maxD = new Date(sortedAsc[sortedAsc.length - 1] + 'T00:00:00');
                const spanDays = Math.max(1, Math.round((maxD - minD) / 86400000) + 1);
                const coveragePct = Math.round(dates.length / spanDays * 100);
                const gaps = [];
                for (let i = 0; i < sortedAsc.length - 1; i++) {
                    const a = new Date(sortedAsc[i] + 'T00:00:00');
                    const b = new Date(sortedAsc[i + 1] + 'T00:00:00');
                    const gap = Math.round((b - a) / 86400000) - 1;
                    if (gap > 0) gaps.push({ from: sortedAsc[i], to: sortedAsc[i + 1], days: gap });
                }
                let aggHtml = '<div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:14px 16px;margin-bottom:18px;">';
                aggHtml += '<div style="font-weight:600;color:#333;margin-bottom:10px;">📊 月度聚合 &amp; 覆盖率（共 ' + dates.length + ' 天 / 跨度 ' + spanDays + ' 天 / 整体覆盖 ' + coveragePct + '%）</div>';
                aggHtml += '<div style="display:flex;gap:18px;flex-wrap:wrap;font-size:12px;color:#666;margin-bottom:8px;">';
                aggHtml += '<span>🌙 睡眠时段条目：' + totalSleepEntries + ' 条（' + sleepDaysCount + ' 天含睡眠时段记录）</span>';
                aggHtml += '<span>🕳 空白档期：' + (gaps.length ? gaps.length + ' 段' : '无') + '</span>';
                aggHtml += '</div>';
                aggHtml += '<table style="width:100%;border-collapse:collapse;font-size:13px;">';
                aggHtml += '<thead><tr style="color:#888;text-align:left;"><th style="padding:4px 8px;">月份</th><th>有数据天</th><th>条目</th><th>推断天</th><th>覆盖率</th><th style="width:32%;">月度覆盖条</th></tr></thead><tbody>';
                months.forEach(m => {
                    const mm = monthMap[m];
                    const parts = m.split('-');
                    const y = Number(parts[0]), mo = Number(parts[1]);
                    const totalDaysMonth = new Date(y, mo, 0).getDate();
                    const cov = Math.round(mm.days / totalDaysMonth * 100);
                    aggHtml += '<tr style="border-top:1px solid #eee;">' +
                        '<td style="padding:4px 8px;font-weight:600;">' + m + '</td>' +
                        '<td>' + mm.days + '</td><td>' + mm.entries + '</td><td>' + mm.inferredDays + '</td>' +
                        '<td>' + cov + '%</td>' +
                        '<td><div style="background:#eee;border-radius:4px;height:8px;width:100%;"><div style="background:#4caf50;height:8px;border-radius:4px;width:' + cov + '%;"></div></div></td>' +
                        '</tr>';
                });
                aggHtml += '</tbody></table>';
                if (gaps.length) {
                    aggHtml += '<div style="margin-top:10px;font-size:12px;color:#e65100;">🕳 空白档期（连续无数据）：' + gaps.map(g => escapeHtml(g.from + '→' + g.to + ' (' + g.days + '天)')).join('；') + '</div>';
                }
                // 时段分布饼图（早上/下午/晚上）
                const periodCount = { '早上': 0, '下午': 0, '晚上': 0 };
                Object.keys(byDate).forEach(d => (byDate[d] || []).forEach(s => {
                    if (periodCount.hasOwnProperty(s.period)) periodCount[s.period]++;
                }));
                const pieTotal = periodCount['早上'] + periodCount['下午'] + periodCount['晚上'];
                let pieAcc = 0; const pieSegs = [];
                ['早上', '下午', '晚上'].forEach(p => {
                    const c = periodCount[p]; if (!c) return;
                    const pct = c / pieTotal * 100;
                    const color = TIME_RULES.periodColors[p] || '#999';
                    pieSegs.push(color + ' ' + pieAcc.toFixed(2) + '% ' + (pieAcc + pct).toFixed(2) + '%');
                    pieAcc += pct;
                });
                const pieGrad = pieSegs.length ? 'conic-gradient(' + pieSegs.join(',') + ')' : '#eee';
                aggHtml += '<div style="display:flex;gap:20px;align-items:center;margin-top:12px;flex-wrap:wrap;">';
                aggHtml += '<div style="width:120px;height:120px;border-radius:50%;background:' + pieGrad + ';flex:none;box-shadow:0 1px 4px rgba(0,0,0,.1);"></div>';
                aggHtml += '<div style="font-size:13px;color:#555;line-height:1.9;">';
                ['早上', '下午', '晚上'].forEach(p => {
                    const c = periodCount[p]; const pct = pieTotal ? Math.round(c / pieTotal * 100) : 0;
                    const color = TIME_RULES.periodColors[p] || '#999';
                    aggHtml += '<div><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:' + color + ';margin-right:6px;"></span>' + p + '：' + c + ' 条（' + pct + '%）</div>';
                });
                aggHtml += '</div></div>';
                aggHtml += '</div>';

                const wrap = document.createElement('div');
                wrap.style.padding = '20px 24px';
                wrap.innerHTML =
                    '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;">' +
                        card(dates.length, '有数据天数') +
                        card(totalEntries, '时间条目') +
                        card(inferredDays, '推断天数') +
                    '</div>' +
                    aggHtml +
                    '<div style="margin-bottom:16px;">' +
                        '<label style="font-size:13px;color:#666;margin-right:8px;">选择日期：</label>' +
                        '<select id="tsDateSel" style="padding:6px 10px;border-radius:6px;border:1px solid #ccc;min-width:160px;">' +
                            dates.map(d => '<option value="' + d + '">' + d + '</option>').join('') +
                        '</select>' +
                        '<span style="font-size:12px;color:#999;margin-left:10px;">标注「推断」的条目由日记全文推断，非精确时间戳</span>' +
                    '</div>' +
                    '<div id="tsDetail"></div>';
                root.innerHTML = '';
                root.appendChild(wrap);

                const sel = wrap.querySelector('#tsDateSel');
                function renderDetail(date) {
                    const stats = byDate[date] || [];
                    const filtered = filterTimeStatsByNow(stats, date);
                    const { anomalies, suggestions } = validateDayTimeStats(stats);
                    const detail = wrap.querySelector('#tsDetail');
                    const parts = [];

                    if (anomalies.length) {
                        parts.push('<div style="background:#fff3e0;border-left:4px solid #ff9800;padding:12px 16px;border-radius:8px;margin:8px 0;">' +
                            '<div style="font-weight:600;color:#e65100;margin-bottom:6px;">⚠️ 异常面板（' + anomalies.length + ' 条异常）</div>' +
                            anomalies.map(a => '<div style="font-size:13px;color:#555;margin:4px 0;">• ' + escapeHtml(a.stat.start + '-' + a.stat.end + ' ' + a.issue) + '</div>').join('') +
                            '</div>');
                    }
                    if (suggestions.length) {
                        parts.push('<div style="background:#e3f2fd;padding:10px 16px;border-radius:8px;margin:8px 0;font-size:13px;color:#1565c0;">💡 ' + suggestions.length + ' 条建议（如空档提示）</div>');
                    }

                    parts.push('<div style="margin-top:10px;">');
                    if (!filtered.length) {
                        parts.push('<div style="color:#999;font-size:13px;">（当天无可见时间条目）</div>');
                    }
                    filtered.forEach(t => {
                        const issues = validateTimeStat(t);
                        const isErr = issues.some(i => i.level === 'error');
                        const color = TIME_RULES.periodColors[t.period] || '#888';
                        const border = isErr ? 'border-left:3px solid #f44336;background:#ffebee;' : 'border:1px solid #eee;';
                        parts.push('<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;margin:6px 0;border-radius:8px;' + border + '">' +
                            '<span style="font-variant-numeric:tabular-nums;font-weight:600;min-width:120px;">' + escapeHtml(t.start + '-' + t.end) + '</span>' +
                            '<span style="padding:2px 10px;border-radius:12px;color:#fff;font-size:12px;background:' + color + ';">' + escapeHtml(t.period || '') + '</span>' +
                            '<span style="flex:1;word-break:break-all;">' + escapeHtml(t.task || '') + '</span>' +
                            (t.inferred ? '<span style="font-size:11px;color:#999;border:1px solid #ccc;border-radius:4px;padding:1px 6px;">推断</span>' : '') +
                            (issues.length ? '<span style="color:#f44336;font-size:12px;">⚠️ ' + escapeHtml(issues.map(i => i.msg).join('；')) + '</span>' : '') +
                            '</div>');
                    });
                    parts.push('</div>');
                    detail.innerHTML = parts.join('');
                }

                sel.addEventListener('change', e => renderDetail(e.target.value));
                renderDetail(sel.value);
            } catch (e) {
                root.innerHTML = '<div style="padding:24px;color:#c62828;">加载失败：' + escapeHtml(e.message || String(e)) + '</div>';
            }

            function card(value, label) {
                return '<div class="stat-card" style="min-width:110px;"><div class="stat-value">' + value + '</div><div class="stat-label">' + label + '</div></div>';
            }
        }

        window.addEventListener('DOMContentLoaded', async () => {
            // 优先从服务器同步真实日志，确保首页直接有数据
            await autoSyncFromServer();

            initProjects();
            document.getElementById('logDate').value = new Date().toISOString().split('T')[0];

            // 仅当服务器同步失败时才回退到内置演示历史，避免重复/旧数据
            if (!window.__serverSynced) {
                generateProjectHistory();
            }

            // 渲染项目列表
            renderProjectList();

            // 渲染备份管理面板
            document.getElementById('backupPanel').innerHTML = renderBackupPanel();

            // 渲染快速入口
            renderQuickAccess();

            // 更新项目选择器
            updateProjectSelector();

            renderAll();

            // 渲染待办清单（默认tab）
            renderTodosContent();

            // 显示欢迎引导（如果是首次使用）
            const logs = getLogs();
            if (logs.length > 0 && !localStorage.getItem('guide_dismissed')) {
                const g = document.getElementById('welcomeGuide');
                if (g) g.style.display = 'block';
            }

            // 监听项目选择
            document.getElementById('projectSelect').addEventListener('change', (e) => {
                document.getElementById('otherProjectGroup').style.display =
                    e.target.value === 'other' ? 'block' : 'none';
            });

            // 每日自动填充日志功能
            checkAndAutoFillDailyLogs();

            // 每小时检查一次是否需要自动填充
            setInterval(checkAndAutoFillDailyLogs, 60 * 60 * 1000);

            // 滚动切换标签页功能已禁用（不好用）
            // 如需启用，可取消注释以下代码：
            // const mainContainer = document.querySelector('.main');
            // if (mainContainer) {
            //     mainContainer.addEventListener('scroll', handleTabScroll);
            // }
        });

        // 检查并自动填充每日日志
        function checkAndAutoFillDailyLogs() {
            const today = new Date().toISOString().split('T')[0];
            const logs = getLogs();
            const projects = getProjects();

            // 检查每个项目今天是否已有日志
            const projectLogStatus = {};
            projects.forEach(project => {
                const hasTodayLog = logs.some(log =>
                    log.projectId === project.id && log.date === today
                );
                projectLogStatus[project.id] = hasTodayLog;
            });

            // 如果所有项目都没有今天的日志，自动创建（零点任务）
            const allEmpty = Object.values(projectLogStatus).every(status => !status);
            if (allEmpty) {
                // 检查是否已自动创建过
                const autoCreatedKey = 'autoCreated_' + today;
                if (!localStorage.getItem(autoCreatedKey)) {
                    // 直接自动创建今日日志
                    autoFillTodayLogs();
                    localStorage.setItem(autoCreatedKey, 'true');
                    console.log('✅ 零点自动任务：已创建今日日志');
                }
            }

            // 补充日志提醒功能已禁用
            // 如果部分项目有日志，检查是否需要补充其他项目
            // const someHasLogs = Object.values(projectLogStatus).some(status => status);
            // if (someHasLogs && !allEmpty) {
            //     // 找出没有今天日志的项目
            //     const missingProjects = projects.filter(p => !projectLogStatus[p.id]);
            //     if (missingProjects.length > 0 && !sessionStorage.getItem('autoFillSupplement_' + today)) {
            //         showSupplementPrompt(missingProjects);
            //         sessionStorage.setItem('autoFillSupplement_' + today, 'true');
            //     }
            // }
        }

        // 显示自动填充提示
        function showAutoFillPrompt(projects) {
            const today = new Date().toISOString().split('T')[0];
            const todayStr = new Date().toLocaleDateString('zh-CN', {
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });

            let html = `
                <div id="autoFillPrompt" style="position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px;">
                    <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 20px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); border: 2px solid #dee2e6;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                            <span style="font-size: 32px;">📝</span>
                            <div>
                                <h4 style="margin: 0; font-size: 16px; font-weight: 700; color: #1a1a1a;">今日工作日志</h4>
                                <p style="margin: 4px 0 0 0; font-size: 13px; color: #666;">${todayStr}</p>
                            </div>
                        </div>
                        <p style="margin: 0 0 16px 0; font-size: 14px; color: #495057; line-height: 1.6;">
                            还没有记录今天的工作内容，是否要快速添加日志？
                        </p>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button onclick="autoFillTodayLogs()" style="flex: 1; padding: 10px 16px; background: #3a3a3a; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#4a4a4a';" onmouseout="this.style.background='#3a3a3a';">
                                ✨ 自动填充
                            </button>
                            <button onclick="document.getElementById('autoFillPrompt').remove(); showAddForm();" style="flex: 1; padding: 10px 16px; background: white; color: #3a3a3a; border: 2px solid #3a3a3a; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#f8f9fa';" onmouseout="this.style.background='white';">
                                📝 手动添加
                            </button>
                            <button onclick="document.getElementById('autoFillPrompt').remove();" style="padding: 10px 16px; background: transparent; color: #8a8a8a; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.color='#5a5a5a';" onmouseout="this.style.color='#8a8a8a';">
                                稍后再说
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', html);
        }

        // 显示补充提示
        function showSupplementPrompt(missingProjects) {
            const projectNames = missingProjects.map(p => p.name.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').trim()).join('、');

            let html = `
                <div id="supplementPrompt" style="position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px;">
                    <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%); padding: 20px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); border: 2px solid #ffc107;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                            <span style="font-size: 32px;">💡</span>
                            <div>
                                <h4 style="margin: 0; font-size: 16px; font-weight: 700; color: #856404;">补充日志提醒</h4>
                            </div>
                        </div>
                        <p style="margin: 0 0 16px 0; font-size: 14px; color: #856404; line-height: 1.6;">
                            以下项目还没有今天的日志记录：<br>
                            <strong>${projectNames}</strong>
                        </p>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="document.getElementById('supplementPrompt').remove(); autoFillMissingProjects();" style="flex: 1; padding: 10px 16px; background: #856404; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                                📝 补充日志
                            </button>
                            <button onclick="document.getElementById('supplementPrompt').remove();" style="padding: 10px 16px; background: transparent; color: #856404; border: 1px solid #856404; border-radius: 8px; font-size: 14px; cursor: pointer;">
                                忽略
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', html);
        }

        // 自动填充今天的日志
        function autoFillTodayLogs() {
            const today = new Date().toISOString().split('T')[0];
            const projects = getProjects();
            const logs = getLogs();

            // 为每个项目创建一条日志
            projects.forEach(project => {
                // 检查是否已有今天日志
                const hasTodayLog = logs.some(log =>
                    log.projectId === project.id && log.date === today
                );

                if (!hasTodayLog) {
                    const data = projectData[project.id];
                    const log = {
                        id: Date.now().toString() + '_' + project.id,
                        projectId: project.id,
                        projectName: project.name,
                        date: today,
                        datetime: new Date().toLocaleString('zh-CN'),
                        title: `📝 ${project.name} - 工作记录`,
                        tags: [{ name: '📝 日志', type: 'documentation' }],
                        items: [
                            '✅ 继续推进项目开发',
                            '📝 记录今日工作内容',
                            '🔍 待补充具体工作项...'
                        ],
                        code: null
                    };
                    logs.unshift(log);
                }
            });

            saveLogs(logs);
            renderAll();

            // 移除提示
            const prompt = document.getElementById('autoFillPrompt');
            if (prompt) prompt.remove();

            // 显示成功提示
            showNotification('✅ 已为所有项目创建今日日志，请补充具体内容');
        }

        // 自动填充缺失项目的日志
        function autoFillMissingProjects() {
            const today = new Date().toISOString().split('T')[0];
            const projects = getProjects();
            const logs = getLogs();

            let filledCount = 0;
            projects.forEach(project => {
                const hasTodayLog = logs.some(log =>
                    log.projectId === project.id && log.date === today
                );

                if (!hasTodayLog) {
                    const log = {
                        id: Date.now().toString() + '_' + project.id,
                        projectId: project.id,
                        projectName: project.name,
                        date: today,
                        datetime: new Date().toLocaleString('zh-CN'),
                        title: `📝 ${project.name} - 工作记录`,
                        tags: [{ name: '📝 日志', type: 'documentation' }],
                        items: [
                            '✅ 继续推进项目开发',
                            '📝 记录今日工作内容',
                            '🔍 待补充具体工作项...'
                        ],
                        code: null
                    };
                    logs.unshift(log);
                    filledCount++;
                }
            });

            saveLogs(logs);
            renderAll();

            showNotification(`✅ 已为 ${filledCount} 个项目补充日志`);
        }

        // 显示通知
        function showNotification(message) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                background: #3a3a3a;
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                font-size: 14px;
                animation: slideIn 0.3s ease;
            `;
            notification.textContent = message;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        function initProjects() {
            // 仅在 localStorage 为空时写入默认项目列表，避免覆盖用户自定义项目
            const existing = localStorage.getItem(PROJECTS_KEY);
            if (!existing || JSON.parse(existing).length === 0) {
                localStorage.setItem(PROJECTS_KEY, JSON.stringify(defaultProjects));
            }
        }

        function getProjects() {
            try {
                return JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]');
            } catch (e) {
                console.error('项目数据损坏，使用默认列表:', e);
                return [...defaultProjects];
            }
        }

        function getLogs() {
            try {
                var logs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            } catch (e) {
                console.error('日志数据损坏:', e);
                return [];
            }

            // 名称迁移：仅在首次需要时执行，之后跳过
            if (!localStorage.getItem('nameMigrated_v2')) {
                const nameMap = {
                    '🗂️ 项目组织与管理': '🗂️ 项目管理汇总',
                    '项目组织与管理': '🗂️ 项目管理汇总',
                    '🎧 英语学习 TTS 系统': '🎧 英语朗读学习',
                    '英语学习 TTS 系统': '🎧 英语朗读学习',
                    '🎧 英语学习': '🎧 英语朗读学习',
                    '英语学习': '🎧 英语朗读学习',
                    '🏝️ 清迈活动探索': '🏝️ 清迈活动平台',
                    '清迈活动探索': '🏝️ 清迈活动平台',
                    '🏝️ 清迈活动策划': '🏝️ 清迈活动平台',
                    '清迈活动策划': '🏝️ 清迈活动平台',
                    '🎥 AI SaaS 视频项目': '🎥 AI SaaS 视频',
                    'AI SaaS 视频项目': '🎥 AI SaaS 视频',
                    '🤖 Clawdbot Railway 模板': '🤖 Clawdbot',
                    'Clawdbot Railway 模板': '🤖 Clawdbot'
                };

                let updated = false;
                logs.forEach(log => {
                    if (nameMap[log.projectName]) {
                        log.projectName = nameMap[log.projectName];
                        updated = true;
                    }
                });

                if (updated) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
                }
                localStorage.setItem('nameMigrated_v2', 'true');
            }

            return logs;
        }

        function getTodos() {
            return JSON.parse(localStorage.getItem(TODOS_KEY) || '{}');
        }

        function saveTodos(todos) {
            localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
            // 自动保存到本地文件（包含日志和待办）
            autoSaveToFile(getLogs());
        }

        function saveLogs(logs) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
            // 自动保存到本地文件（包含日志和待办）
            autoSaveToFile(logs);
        }

        async function autoSaveToFile(logs) {
            const data = {
                version: '1.0',
                exportTime: new Date().toISOString(),
                logs: logs,
                projects: getProjects(),
                todos: getTodos() // 同时保存待办清单
            };

            // 如果已有文件句柄，直接写入（静默保存）
            if (fileHandle) {
                try {
                    const writable = await fileHandle.createWritable();
                    await writable.write(JSON.stringify(data, null, 2));
                    await writable.close();
                    console.log('✅ 数据已自动保存到本地文件');
                    // 在页面显示保存成功提示
                    showSaveNotification();
                    return;
                } catch (err) {
                    console.error('保存失败:', err);
                    fileHandle = null; // 重置文件句柄
                }
            }

            // 首次保存，静默请求用户选择文件位置（不阻塞）
            requestFileSavePermission(data);
        }

        function showSaveNotification() {
            // 在页面顶部显示保存成功提示
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #3a3a3a;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-size: 14px;
                animation: slideIn 0.3s ease-out;
            `;
            notification.textContent = '✅ 已自动保存到本地文件';
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        }

        async function requestFileSavePermission(data) {
            // 延迟执行，不阻塞当前操作
            setTimeout(async () => {
                try {
                    fileHandle = await window.showSaveFilePicker({
                        suggestedName: `project-data-${new Date().toISOString().split('T')[0]}.json`,
                        types: [{
                            description: 'JSON 文件',
                            accept: {'application/json': ['.json']},
                        }],
                    });

                    const writable = await fileHandle.createWritable();
                    await writable.write(JSON.stringify(data, null, 2));
                    await writable.close();
                    console.log('✅ 数据已保存，后续将自动更新此文件');
                } catch (err) {
                    // 用户取消了选择文件，这是正常的
                    if (err.name !== 'AbortError') {
                        console.error('保存文件失败:', err);
                    }
                }
            }, 100);
        }

        // 导出所有数据为JSON文件（可靠备份）
        function exportAllData() {
            const data = {
                version: '1.0',
                exportTime: new Date().toISOString(),
                logs: getLogs(),
                projects: getProjects(),
                todos: getTodos()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `project-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert(`✅ 数据已导出！\n日志: ${data.logs.length} 条\n待办: ${Object.values(data.todos).flat().length} 项\n请妥善保存此文件！`);
        }

        // 导入所有数据（使用隐藏的文件input）
        let importFileInput = null;
        function importAllData() {
            if (!importFileInput) {
                importFileInput = document.createElement('input');
                importFileInput.type = 'file';
                importFileInput.accept = '.json,application/json';
                importFileInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        try {
                            const data = JSON.parse(evt.target.result);
                            if (data.logs && Array.isArray(data.logs)) {
                                localStorage.setItem(STORAGE_KEY, JSON.stringify(data.logs));
                                if (data.projects && Array.isArray(data.projects)) {
                                    localStorage.setItem(PROJECTS_KEY, JSON.stringify(data.projects));
                                }
                                if (data.todos && typeof data.todos === 'object') {
                                    localStorage.setItem(TODOS_KEY, JSON.stringify(data.todos));
                                }
                                alert(`✅ 导入成功！\n日志: ${data.logs.length} 条\n待办: ${Object.values(data.todos || {}).flat().length} 项`);
                                renderAll();
                            } else {
                                alert('❌ 文件格式不正确');
                            }
                        } catch (err) {
                            alert('❌ 解析文件失败: ' + err.message);
                        }
                    };
                    reader.readAsText(file);
                };
            }
            importFileInput.click();
        }

        async function loadDataFile() {
            try {
                // 让用户选择数据文件
                const [handle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'JSON 文件',
                        accept: {'application/json': ['.json']},
                    }],
                    multiple: false,
                });

                // 保存文件句柄，用于后续自动保存
                fileHandle = handle;

                // 读取文件内容
                const file = await handle.getFile();
                const text = await file.text();
                const data = JSON.parse(text);

                // 加载数据到 localStorage
                if (data.logs && Array.isArray(data.logs)) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.logs));
                    if (data.projects && Array.isArray(data.projects)) {
                        localStorage.setItem(PROJECTS_KEY, JSON.stringify(data.projects));
                    }
                    // 同时加载待办清单
                    if (data.todos && typeof data.todos === 'object') {
                        localStorage.setItem(TODOS_KEY, JSON.stringify(data.todos));
                        const todoCount = Object.values(data.todos).flat().length;
                        alert(`✅ 已加载 ${data.logs.length} 条日志和 ${todoCount} 个待办事项！\n后续保存将自动更新此文件。`);
                    } else {
                        alert(`✅ 已加载 ${data.logs.length} 条日志！\n后续保存将自动更新此文件。`);
                    }
                    renderAll();
                } else {
                    alert('❌ 文件格式不正确');
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    alert('❌ 打开文件失败：' + err.message);
                }
            }
        }

        // 智能生成今日日志（基于Git变更）
        async function autoGenerateTodayLog() {
            const today = new Date().toISOString().split('T')[0];
            const logs = getLogs();

            // 检查今天是否已有日志
            const hasTodayLog = logs.some(log => log.date === today);

            if (hasTodayLog) {
                alert('今天已经创建过日志了！\n\n你可以：\n1. 在现有日志基础上添加内容\n2. 或手动创建新的日志条目');
                return;
            }

            // 调用后端脚本获取Git变更
            try {
                const response = await fetch('/api/auto-generate-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ today: today })
                });

                if (response.ok) {
                    const data = await response.json();

                    if (data.logs && data.logs.length > 0) {
                        // 添加生成的日志
                        data.logs.forEach(log => {
                            logs.unshift(log);
                        });
                        saveLogs(logs);
                        renderAll();

                        alert(`✅ 已自动生成 ${data.logs.length} 条日志！\n\n基于以下项目的Git变更：\n${data.projects.join('\n')}`);
                    } else {
                        // 没有Git变更，显示提示
                        const result = confirm('🤖 智能生成今日日志\n\n今天没有检测到Git提交记录。\n\n是否要创建一个空白日志模板？');
                        if (result) {
                            showAddForm();
                        }
                    }
                } else {
                    throw new Error('API请求失败');
                }
            } catch (error) {
                // API不可用，提供手动引导
                const result = confirm('🤖 智能生成今日日志\n\n自动检测功能需要后端API支持。\n\n点击"确定"查看手动创建指南，或"取消"直接创建日志。');
                if (result) {
                    window.open('daily-reports/' + today + '.md', '_blank');
                } else {
                    showAddForm();
                }
            }
        }

        function showAddForm() {
            document.getElementById('addForm').classList.add('active');
        }

        function hideAddForm() {
            document.getElementById('addForm').classList.remove('active');
        }

        function saveLogForm() {
            const projects = getProjects();
            const projectSelect = document.getElementById('projectSelect').value;
            let projectName;

            let projectId;
            if (projectSelect === 'other') {
                projectName = document.getElementById('otherProjectName').value.trim();
                if (!projectName) {
                    alert('请输入项目名称');
                    return;
                }
                projectId = 'other-' + Date.now();
            } else {
                projectId = projectSelect;
                const project = projects.find(p => p.id === projectSelect);
                projectName = project.name;
            }

            const date = document.getElementById('logDate').value;
            const type = document.getElementById('logType').value;
            const items = document.getElementById('logItems').value.split('\n').filter(i => i.trim());
            const code = document.getElementById('logCode').value.trim();

            if (items.length === 0) {
                alert('请填写项目总结日志');
                return;
            }

            const typeTags = {
                'feature': { name: '✨ 新功能', type: 'feature' },
                'fix': { name: '🔧 修复', type: 'fix' },
                'improvement': { name: '🚀 优化', type: 'improvement' },
                'learning': { name: '📚 学习', type: 'learning' }
            };

            const log = {
                id: Date.now().toString(),
                projectId: projectId,
                projectName: projectName,
                date: date,
                datetime: new Date().toLocaleString('zh-CN'),
                title: `${typeTags[type].name} - ${date}`,
                tags: [{ ...typeTags[type] }],
                items: items,
                code: code || null
            };

            const logs = getLogs();
            logs.unshift(log);
            saveLogs(logs);

            alert('✅ 日志已保存！');
            hideAddForm();
            renderAll();
        }

        function renderAll() {
            const logs = getLogs();

            // 根据当前筛选的项目过滤日志
            let filteredLogs = logs;
            if (currentProjectFilter !== null) {
                filteredLogs = logs.filter(log => log.projectId === currentProjectFilter);
                console.log(`🔍 项目筛选: ${currentProjectFilter}, 过滤后日志数: ${filteredLogs.length}/${logs.length}`);
            }

            renderStats(logs); // 统计显示全部数据
            renderTable(filteredLogs); // 表格显示筛选后的数据
        }

        function renderStats(logs) {
            const projects = getProjects();
            const dates = [...new Set(logs.map(l => l.date.split('T')[0]))];

            document.getElementById('stats').innerHTML = `
                <div class="stat-card">
                    <div class="stat-value">${logs.length}</div>
                    <div class="stat-label">总日志数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${dates.length}</div>
                    <div class="stat-label">活跃天数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${projects.length}</div>
                    <div class="stat-label">项目数</div>
                </div>
            `;
        }

        function renderTable(logs) {
            const container = document.getElementById('logTable');

            console.log(`📋 渲染日志表格: ${logs.length} 条记录, 当前项目筛选: ${currentProjectFilter}`);

            if (logs.length === 0) {
                const message = currentProjectFilter
                    ? `📁 该项目暂无日志记录<br><button class="btn btn-primary" onclick="showAddForm()">添加第一条日志</button>`
                    : '<div class="empty-state">暂无日志记录<br><button class="btn btn-primary" onclick="showAddForm()">添加第一条日志</button></div>';
                container.innerHTML = message;
                return;
            }

            const tagClass = {
                'feature': 'tag-feature',
                'fix': 'tag-fix',
                'improvement': 'tag-improvement',
                'learning': 'tag-learning'
            };

            container.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th style="width: 200px;">项目名称</th>
                            <th style="width: 150px;">日期</th>
                            <th>项目总结日志</th>
                            <th style="width: 100px;">类型</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs.map(log => `
                            <tr ${log.isAutoGenerated ? 'style="background: rgba(100, 100, 100, 0.05);"' : ''}>
                                <td>
                                    <span class="project-name">${log.projectName}</span>
                                    ${log.isAutoGenerated ? '<span style="display: inline-block; margin-left: 6px; padding: 2px 6px; font-size: 11px; background: rgba(100, 100, 100, 0.15); color: #3a3a3a; border-radius: 4px;">自动生成</span>' : ''}
                                </td>
                                <td><span class="log-date">${log.date}</span></td>
                                <td class="log-summary" ${log.isAutoGenerated ? 'style="opacity: 0.75;"' : ''}>
                                    ${log.items.map(item => `<div>${escapeHtml(item)}</div>`).join('')}
                                    ${log.code ? `<pre style="margin-top: 10px; background: #1a1a1a; color: #b0b0b0; padding: 10px; border-radius: 4px; overflow-x: auto;">${escapeHtml(log.code)}</pre>` : ''}
                                </td>
                                <td>
                                    ${log.tags.map(tag => `<span class="tag ${tagClass[tag.type]}">${tag.name}</span>`).join('')}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        // 生成项目启动模板
        function generateProjectStartTemplate(project) {
            const data = projectData[project.id];
            if (!data) return 'ERROR: Project not found';

            const projectName = project.name.replace(/^[^\s]+\s*/, '');

            // 获取项目路径配置，如果未配置则使用默认值
            const paths = data.paths || {
                claude: 'CLAUDE.md',
                readme: 'README.md',
                memory: 'memory/',
                docs: 'docs/',
                src: 'src/'
            };

            return `You are resuming ${projectName} as its long-term engineering assistant.

This is a persistent project. Your job is to fully restore context and continue development safely and consistently.

Follow these steps EXACTLY and in order:

--------------------------------------------------
STEP 1 — LOAD PROJECT RULES
--------------------------------------------------

Read and internalize:

- ${paths.claude}
- ${paths.readme}

These define your behavioral and structural constraints.

You MUST follow them strictly.


--------------------------------------------------
STEP 2 — LOAD LONG-TERM MEMORY
--------------------------------------------------

Read ALL files in:

${paths.memory}

Especially:

- ${paths.memory}project-memory.md
- ${paths.memory}progress.md
- ${paths.memory}decisions.md
- ${paths.memory}bugs.md (if exists)

These contain long-term project knowledge.


--------------------------------------------------
STEP 3 — LOAD ARCHITECTURE AND PRODUCT CONTEXT
--------------------------------------------------

Read ALL files in:

${paths.docs}

Especially:

- ${paths.docs}architecture.md
- ${paths.docs}product.md
- ${paths.docs}api.md (if exists)


--------------------------------------------------
STEP 4 — ANALYZE CURRENT CODEBASE
--------------------------------------------------

Scan and understand:

- ${paths.src}
- modules
- configs
- system design
- structure and patterns


Understand:

- what is implemented
- what is incomplete
- how components interact


--------------------------------------------------
STEP 5 — RESTORE FULL CONTEXT STATE
--------------------------------------------------

Build an internal mental model including:

- project purpose
- architecture
- module responsibilities
- completed features
- pending features
- known issues
- constraints


--------------------------------------------------
STEP 6 — ENTER STRICT DEVELOPMENT MODE
--------------------------------------------------

You MUST follow these rules:

DO NOT:

- break architecture
- rename files without permission
- move files without permission
- delete files without permission
- introduce unrelated refactors
- ⚠️ commit to git without EXPLICIT permission
- ⚠️ push to remote without EXPLICIT permission
- ⚠️ run git commands without confirmation

ALWAYS:

- follow existing patterns
- extend safely
- preserve structure
- ask before major changes
- ⚠️ follow design system and coding standards
- ⚠️ maintain consistency with existing UI/UX
- ⚠️ write clean, documented code


--------------------------------------------------
STEP 7 — CONFIRM CONTEXT RESTORED
--------------------------------------------------

Output a concise summary:

- project purpose
- architecture summary
- completed parts
- pending tasks
- risks or warnings

Then say:

"Project context fully restored. Ready for instructions."


--------------------------------------------------
STEP 8 — WAIT FOR NEXT INSTRUCTION
--------------------------------------------------

Do NOT modify anything yet.

Wait for explicit user instruction.`;
        }

        // 显示项目启动脚本模态框
        function showProjectStartModal() {
            const projects = getProjects();
            const currentProjectId = currentProjectFilter;

            // 获取当前项目或第一个项目
            let selectedProject = currentProjectId
                ? projects.find(p => p.id === currentProjectId)
                : projects[0];

            if (!selectedProject) {
                alert('❌ 没有可用项目');
                return;
            }

            const data = projectData[selectedProject.id];
            const projectName = selectedProject.name.replace(/^[^\s]+\s*/, '');
            const projectPath = data?.projectPath || '';

            // 生成启动脚本
            const startScript = `You are resuming ${projectName} as its long-term engineering assistant.

This is a persistent project. Your job is to fully restore context and continue development safely and consistently.

Follow these steps EXACTLY and in order:

--------------------------------------------------
STEP 1 — LOAD PROJECT RULES
--------------------------------------------------
Read and internalize:
- CLAUDE.md
- README.md

You MUST follow them strictly.

--------------------------------------------------
STEP 2 — LOAD LONG-TERM MEMORY
--------------------------------------------------
Read ALL files in memory/
Especially:
- memory/project-memory.md
- memory/progress.md
- memory/decisions.md
- memory/bugs.md (if exists)

--------------------------------------------------
STEP 3 — LOAD ARCHITECTURE AND PRODUCT CONTEXT
--------------------------------------------------
Read ALL files in docs/
Especially:
- docs/architecture.md
- docs/product.md
- docs/api.md (if exists)

--------------------------------------------------
STEP 4 — ANALYZE CURRENT CODEBASE
--------------------------------------------------
Scan and understand:
- src/
- modules
- configs
- system design
- structure and patterns

--------------------------------------------------
STEP 5 — RESTORE FULL CONTEXT STATE
--------------------------------------------------
Build an internal mental model including:
- project purpose
- architecture
- module responsibilities
- completed features
- pending features
- known issues
- constraints

--------------------------------------------------
STEP 6 — ENTER STRICT DEVELOPMENT MODE
--------------------------------------------------

You MUST follow these rules:

DO NOT:

- break architecture
- rename files without permission
- move files without permission
- delete files without permission
- introduce unrelated refactors
- ⚠️ commit to git without EXPLICIT permission
- ⚠️ push to remote without EXPLICIT permission
- ⚠️ run git commands without confirmation

ALWAYS:

- follow existing patterns
- extend safely
- preserve structure
- ask before major changes
- ⚠️ follow design system and coding standards
- ⚠️ maintain consistency with existing UI/UX
- ⚠️ write clean, documented code


--------------------------------------------------
STEP 7 — CONFIRM CONTEXT RESTORED
--------------------------------------------------

Output a concise summary:

- project purpose
- architecture summary
- completed parts
- pending tasks
- risks or warnings

Then say:

"Project context fully restored. Ready for instructions."


--------------------------------------------------
STEP 8 — WAIT FOR NEXT INSTRUCTION
--------------------------------------------------

Do NOT modify anything yet.
Wait for explicit user instruction.`;

            // 创建项目选择器
            let projectOptions = projects.map(p => {
                const selected = p.id === selectedProject.id ? 'selected' : '';
                return `<option value="${p.id}" ${selected}>${p.name}</option>`;
            }).join('');

            const modalHtml = `
                <div id="projectStartModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;">
                    <div style="background: white; border-radius: 16px; padding: 30px; max-width: 700px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                            <div>
                                <h2 style="margin: 0; font-size: 24px; font-weight: 700;">📋 项目启动脚本</h2>
                                <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">复制到 Claude Code 快速恢复项目上下文</p>
                            </div>
                            <button onclick="document.getElementById('projectStartModal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">×</button>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">选择项目</label>
                            <select id="projectStartSelect" onchange="updateProjectStartPreview()" style="width: 100%; padding: 10px; border: 2px solid #e8e8e8; border-radius: 8px; font-size: 14px; background: white;">
                                ${projectOptions}
                            </select>
                        </div>

                        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                            <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">📋 执行步骤预览</h3>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
                                <div style="background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #52c41a;">
                                    <div style="font-size: 12px; color: #999; margin-bottom: 4px;">STEP 1</div>
                                    <div style="font-size: 13px; font-weight: 600;">加载项目规则</div>
                                </div>
                                <div style="background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #1890ff;">
                                    <div style="font-size: 12px; color: #999; margin-bottom: 4px;">STEP 2</div>
                                    <div style="font-size: 13px; font-weight: 600;">加载长期记忆</div>
                                </div>
                                <div style="background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #722ed1;">
                                    <div style="font-size: 12px; color: #999; margin-bottom: 4px;">STEP 3</div>
                                    <div style="font-size: 13px; font-weight: 600;">加载架构文档</div>
                                </div>
                                <div style="background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #fa8c16;">
                                    <div style="font-size: 12px; color: #999; margin-bottom: 4px;">STEP 4</div>
                                    <div style="font-size: 13px; font-weight: 600;">分析代码库</div>
                                </div>
                                <div style="background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #eb2f96;">
                                    <div style="font-size: 12px; color: #999; margin-bottom: 4px;">STEP 5</div>
                                    <div style="font-size: 13px; font-weight: 600;">恢复上下文</div>
                                </div>
                                <div style="background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #13c2c2;">
                                    <div style="font-size: 12px; color: #999; margin-bottom: 4px;">STEP 6</div>
                                    <div style="font-size: 13px; font-weight: 600;">开发模式</div>
                                </div>
                                <div style="background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #52c41a;">
                                    <div style="font-size: 12px; color: #999; margin-bottom: 4px;">STEP 7</div>
                                    <div style="font-size: 13px; font-weight: 600;">确认恢复</div>
                                </div>
                                <div style="background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #999;">
                                    <div style="font-size: 12px; color: #999; margin-bottom: 4px;">STEP 8</div>
                                    <div style="font-size: 13px; font-weight: 600;">等待指令</div>
                                </div>
                            </div>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">启动脚本内容</label>
                            <div id="startScriptPreview" style="background: #1a1a1a; color: #52c41a; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 12px; line-height: 1.6; max-height: 200px; overflow-y: auto; white-space: pre-wrap;">${startScript}</div>
                        </div>

                        <div style="display: flex; gap: 12px;">
                            <button onclick="copyProjectStartScript()" style="flex: 1; padding: 14px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer;">📋 复制启动脚本</button>
                            <button onclick="document.getElementById('projectStartModal').remove()" style="padding: 14px 24px; background: white; color: #3a3a3a; border: 2px solid #e8e8e8; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer;">关闭</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

        // 更新启动脚本预览
        function updateProjectStartPreview() {
            const select = document.getElementById('projectStartSelect');
            if (!select) return;

            const projectId = select.value;
            const project = getProjects().find(p => p.id === projectId);
            if (!project) return;

            const data = projectData[projectId];
            const projectName = project.name.replace(/^[^\s]+\s*/, '');

            // 获取项目路径配置
            const paths = data?.paths || {
                claude: 'CLAUDE.md',
                readme: 'README.md',
                memory: 'memory/',
                docs: 'docs/',
                src: 'src/'
            };

            const startScript = `You are resuming ${projectName} as its long-term engineering assistant.

This is a persistent project. Your job is to fully restore context and continue development safely and consistently.

Follow these steps EXACTLY and in order:

--------------------------------------------------
STEP 1 — LOAD PROJECT RULES
--------------------------------------------------

Read and internalize:

- ${paths.claude}
- ${paths.readme}

These define your behavioral and structural constraints.

You MUST follow them strictly.


--------------------------------------------------
STEP 2 — LOAD LONG-TERM MEMORY
--------------------------------------------------

Read ALL files in:

${paths.memory}

Especially:

- ${paths.memory}project-memory.md
- ${paths.memory}progress.md
- ${paths.memory}decisions.md
- ${paths.memory}bugs.md (if exists)

These contain long-term project knowledge.


--------------------------------------------------
STEP 3 — LOAD ARCHITECTURE AND PRODUCT CONTEXT
--------------------------------------------------

Read ALL files in:

${paths.docs}

Especially:

- ${paths.docs}architecture.md
- ${paths.docs}product.md
- ${paths.docs}api.md (if exists)


--------------------------------------------------
STEP 4 — ANALYZE CURRENT CODEBASE
--------------------------------------------------

Scan and understand:

- ${paths.src}
- modules
- configs
- system design
- structure and patterns


Understand:

- what is implemented
- what is incomplete
- how components interact


--------------------------------------------------
STEP 5 — RESTORE FULL CONTEXT STATE
--------------------------------------------------

Build an internal mental model including:

- project purpose
- architecture
- module responsibilities
- completed features
- pending features
- known issues
- constraints


--------------------------------------------------
STEP 6 — ENTER STRICT DEVELOPMENT MODE
--------------------------------------------------

You MUST follow these rules:

DO NOT:

- break architecture
- rename files without permission
- move files without permission
- delete files without permission
- introduce unrelated refactors
- ⚠️ commit to git without EXPLICIT permission
- ⚠️ push to remote without EXPLICIT permission
- ⚠️ run git commands without confirmation

ALWAYS:

- follow existing patterns
- extend safely
- preserve structure
- ask before major changes
- ⚠️ follow design system and coding standards
- ⚠️ maintain consistency with existing UI/UX
- ⚠️ write clean, documented code


--------------------------------------------------
STEP 7 — CONFIRM CONTEXT RESTORED
--------------------------------------------------

Output a concise summary:

- project purpose
- architecture summary
- completed parts
- pending tasks
- risks or warnings

Then say:

"Project context fully restored. Ready for instructions."


--------------------------------------------------
STEP 8 — WAIT FOR NEXT INSTRUCTION
--------------------------------------------------

Do NOT modify anything yet.

Wait for explicit user instruction.`;

            const preview = document.getElementById('startScriptPreview');
            if (preview) {
                preview.textContent = startScript;
            }
        }

        // 复制启动脚本
        function copyProjectStartScript() {
            const select = document.getElementById('projectStartSelect');
            const projectId = select.value;
            const project = getProjects().find(p => p.id === projectId);
            const data = projectData[projectId];
            const projectName = project.name.replace(/^[^\s]+\s*/, '');

            const startScript = generateProjectStartTemplate(project);

            if (!startScript) {
                alert('❌ 该项目未配置启动模板');
                return;
            }

            navigator.clipboard.writeText(startScript).then(() => {
                // 显示成功提示
                showNotification(`✅ 已复制 ${project.name} 启动脚本`);
                document.getElementById('projectStartModal').remove();
            }).catch(() => {
                // 降级方案
                const textarea = document.createElement('textarea');
                textarea.value = startScript;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                showNotification(`✅ 已复制 ${project.name} 启动脚本`);
                document.getElementById('projectStartModal').remove();
            });
        }

        // 刷新所有数据
        function refreshAllData() {
            // 显示刷新提示
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #3a3a3a;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-size: 14px;
                animation: slideIn 0.3s ease-out;
            `;
            notification.textContent = '🔄 正在刷新数据...';
            document.body.appendChild(notification);

            // 重新初始化项目数据
            initProjects();

            // 重新渲染所有内容
            renderProjectList();
            updateProjectSelector();
            renderAll();

            // 重新渲染当前标签页内容
            const activeTabBtn = document.querySelector('.tab-btn.active');
            if (activeTabBtn) {
                const tabText = activeTabBtn.textContent;
                if (tabText.includes('📚 项目总结')) {
                    renderSummaryContent();
                } else if (tabText.includes('📁 项目资源')) {
                    renderProjectResources();
                } else if (tabText.includes('✅ 待办清单')) {
                    renderTodosContent();
                }
            }

            // 更新提示
            setTimeout(() => {
                notification.textContent = '✅ 数据已刷新！';
                setTimeout(() => {
                    notification.style.animation = 'slideOut 0.3s ease-out';
                    setTimeout(() => notification.remove(), 300);
                }, 1500);
            }, 500);
        }

        function dismissWelcomeGuide() {
            const g = document.getElementById('welcomeGuide');
            if (g) g.style.display = 'none';
            localStorage.setItem('guide_dismissed', 'true');
        }

        // 复制到剪贴板
        function copyToClipboard(text) {
            // 处理 ~ 路径
            const fullPath = text.replace('~', '/Users/yuzhoudeshengyin');

            // 使用现代API复制
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(fullPath).then(() => {
                    showNotification('✅ 路径已复制到剪贴板');
                }).catch(err => {
                    // 降级方案
                    fallbackCopy(fullPath);
                });
            } else {
                fallbackCopy(fullPath);
            }
        }

        // 降级复制方案
        function fallbackCopy(text) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showNotification('✅ 路径已复制到剪贴板');
            } catch (err) {
                showNotification('❌ 复制失败，请手动复制');
            }
            document.body.removeChild(textArea);
        }

        // 显示通知
        function showNotification(message) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                background: #3a3a3a;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                animation: slideIn 0.3s ease-out;
                font-size: 14px;
            `;
            notification.textContent = message;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

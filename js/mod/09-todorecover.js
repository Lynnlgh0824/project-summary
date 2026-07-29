        // ==================== 待办恢复面板（收敛 check-todos / recover-todos-enhanced / restore-todos 三页） ====================
        function renderTodoRecoverContent() {
            const container = document.getElementById('todorecoverContent');
            if (!container) return;
            container.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:18px; max-width:880px;">
                    <div style="background:#f8f9fa; border:1px solid #e9ecef; border-radius:10px; padding:18px;">
                        <h3 style="margin:0 0 6px; font-size:16px;">🔧 待办恢复 / 备份</h3>
                        <p style="margin:0; color:#666; font-size:13px;">以下工具整合了原「待办数据恢复 / 增强恢复 / 智能恢复」三个独立页面，全部在应用内完成。</p>
                    </div>

                    <!-- A. 候选键扫描 -->
                    <div style="background:#fff; border:1px solid #e9ecef; border-radius:10px; padding:18px;">
                        <h4 style="margin:0 0 8px; font-size:14px;">🔍 扫描其他可能的待办存储</h4>
                        <p style="margin:0 0 10px; color:#666; font-size:12px;">检查 localStorage 与 sessionStorage 中常见键名，发现后可一键恢复到当前待办清单。</p>
                        <button class="btn btn-primary" onclick="trScanStorage()" style="font-size:12px; padding:6px 14px;">开始扫描</button>
                        <div id="trScanResult" style="margin-top:12px; white-space:pre-wrap; font-family:monospace; font-size:12px;"></div>
                    </div>

                    <!-- B. 从日志提取 -->
                    <div style="background:#fff; border:1px solid #e9ecef; border-radius:10px; padding:18px;">
                        <h4 style="margin:0 0 8px; font-size:14px;">📝 从工作日志提取待办</h4>
                        <p style="margin:0 0 10px; color:#666; font-size:12px;">扫描全部日志中含「待办 / 需要 / 继续 / 修复 / 添加」等关键词的条目，勾选后写入对应项目。</p>
                        <button class="btn btn-primary" onclick="trExtractFromLogs()" style="font-size:12px; padding:6px 14px;">从全部日志提取</button>
                        <div id="trExtractResult" style="margin-top:12px;"></div>
                    </div>

                    <!-- C. 手动粘贴恢复 -->
                    <div style="background:#fff; border:1px solid #e9ecef; border-radius:10px; padding:18px;">
                        <h4 style="margin:0 0 8px; font-size:14px;">✏️ 手动粘贴文本恢复</h4>
                        <p style="margin:0 0 10px; color:#666; font-size:12px;">把含待办的文字（每行一条或整段日志）粘贴到下方，自动抽取关键词条目。</p>
                        <textarea id="trManualInput" rows="5" style="width:100%; box-sizing:border-box; border:1px solid #ced4da; border-radius:6px; padding:8px; font-size:13px;" placeholder="例如：&#10;- 待办：修复登录页崩溃&#10;需要给后台加导出按钮&#10;TODO 编写单元测试"></textarea>
                        <div style="margin-top:8px;">
                            <button class="btn btn-primary" onclick="trManualExtract()" style="font-size:12px; padding:6px 14px;">抽取待办</button>
                        </div>
                        <div id="trManualResult" style="margin-top:12px;"></div>
                    </div>

                    <!-- D. 导入/导出/清空 -->
                    <div style="background:#fff; border:1px solid #e9ecef; border-radius:10px; padding:18px;">
                        <h4 style="margin:0 0 8px; font-size:14px;">💾 数据导入 / 导出 / 清空</h4>
                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            <button class="btn btn-success" onclick="exportAllData()">导出全部备份</button>
                            <button class="btn btn-primary" onclick="importAllData()">导入备份</button>
                            <button class="btn btn-danger" onclick="trClearTodos()">清空当前待办</button>
                        </div>
                    </div>
                </div>
            `;
        }

        // A. 候选键扫描（localStorage + sessionStorage）
        function trScanStorage() {
            const out = document.getElementById('trScanResult');
            const possibleKeys = ['project_todos','todos','todo_list','my_todos','tasks','project_tasks','todoData'];
            let found = [];
            const scan = (store, label) => {
                for (const key of possibleKeys) {
                    let raw;
                    try { raw = store.getItem(key); } catch(e) { continue; }
                    if (!raw || key === TODOS_KEY) continue;
                    try {
                        const parsed = JSON.parse(raw);
                        const count = typeof parsed === 'object'
                            ? Object.values(parsed).reduce((s, a) => s + (Array.isArray(a) ? a.length : 0), 0)
                            : (Array.isArray(parsed) ? parsed.length : 1);
                        found.push({ key, label, raw, count });
                    } catch(e) {}
                }
            };
            scan(localStorage, 'localStorage');
            try { scan(sessionStorage, 'sessionStorage'); } catch(e) {}
            if (found.length === 0) {
                out.textContent = '❌ 未在浏览器中找到其它待办清单数据。\n建议改用「从工作日志提取」或「手动粘贴恢复」。';
                return;
            }
            let html = `✅ 扫描到 ${found.length} 处候选数据：\n\n`;
            found.forEach((f, i) => {
                html += `<div style="margin:8px 0; padding:8px; border:1px solid #e9ecef; border-radius:6px;">
                    <div>📦 <b>${f.label}[${f.key}]</b> · ${f.count} 项</div>
                    <button onclick="trRestoreKey(${i})" style="margin-top:6px; background:#3a3a3a;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:12px;">恢复到当前待办</button>
                </div>`;
            });
            out.innerHTML = html;
            window.__trFound = found;
        }

        function trRestoreKey(i) {
            const f = (window.__trFound || [])[i];
            if (!f) return;
            if (!confirm(`确定将 ${f.label}[${f.key}] 的 ${f.count} 项待办恢复到当前清单吗？`)) return;
            localStorage.setItem(TODOS_KEY, f.raw);
            saveTodos(getTodos());
            alert('✅ 已恢复，请切换到「待办清单」查看。');
            trScanStorage();
        }

        // 通用关键词抽取
        function trExtractTodosFromText(text, sourceProjectId, sourceProjectName, sourceDate) {
            const todoKeywords = ['待办','待做','未完成','TODO','todo','待完成','需要','还需','继续','跟进','处理','解决','修复','优化','添加','实现','记得','别忘了','remind'];
            const lines = (text || '').split('\n');
            const out = [];
            lines.forEach(line => {
                const t = line.trim();
                if (!t || t.startsWith('//') || t.startsWith('#')) return;
                const has = todoKeywords.some(k => t.toLowerCase().includes(k.toLowerCase()));
                if (!has) return;
                let txt = t.replace(/^[-*•+]\s*/, '').replace(/^(\d+)[.、]\s*/, '')
                          .replace(/^(待办|TODO|todo|待做|fix):\s*/i, '').replace(/^\[[ x]\]\s*/, '').trim();
                if (txt.length > 1) out.push({ projectId: sourceProjectId, project: sourceProjectName, text: txt, date: sourceDate });
            });
            return out;
        }

        // B. 从全部日志提取
        function trExtractFromLogs() {
            const out = document.getElementById('trExtractResult');
            const logs = getLogs() || [];
            const projects = getProjects() || [];
            if (logs.length === 0) { out.innerHTML = '<div style="color:#c0392b;font-size:13px;">❌ 没有工作日志</div>'; return; }
            const all = [];
            logs.forEach(log => {
                const pn = (projects.find(p => p.id === log.projectId) || {}).name || log.projectName || '未知项目';
                const content = (log.items || []).join('\n');
                trExtractTodosFromText(content, log.projectId, pn, log.date).forEach(t => all.push(t));
            });
            if (all.length === 0) { out.innerHTML = '<div style="color:#c0392b;font-size:13px;">❌ 未在日志中找到待办关键词</div>'; return; }
            window.__trExtracted = all;
            let html = `<div style="color:#27ae60;font-size:13px;margin-bottom:8px;">✅ 提取到 ${all.length} 个待办：</div>`;
            all.forEach((t, i) => {
                html += `<div style="display:flex;gap:8px;align-items:flex-start;padding:4px 0;font-size:13px;">
                    <input type="checkbox" id="tre_${i}" checked>
                    <label for="tre_${i}" style="flex:1;cursor:pointer;">[${escapeHtml(t.project)}] ${escapeHtml(t.text)} <span style="color:#999;font-size:12px;">${t.date||''}</span></label>
                </div>`;
            });
            html += `<button onclick="trApplyExtracted()" style="margin-top:10px;background:#3a3a3a;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-size:12px;">应用选中项</button>`;
            out.innerHTML = html;
        }

        function trApplyExtracted() {
            const all = window.__trExtracted || [];
            if (!all.length) { alert('请先提取'); return; }
            const todos = getTodos();
            let added = 0;
            all.forEach((t, i) => {
                const cb = document.getElementById('tre_' + i);
                if (cb && cb.checked) {
                    const pid = t.projectId || 'default';
                    if (!todos[pid]) todos[pid] = [];
                    todos[pid].push({ id: 'tr_' + Date.now() + '_' + i, text: t.text, status: 'pending', priority: 'medium', created: t.date || null });
                    added++;
                }
            });
            saveTodos(todos);
            alert(`✅ 已写入 ${added} 个待办，请切换到「待办清单」查看。`);
            trExtractFromLogs();
        }

        // C. 手动粘贴
        function trManualExtract() {
            const ta = document.getElementById('trManualInput');
            const out = document.getElementById('trManualResult');
            const text = (ta && ta.value) || '';
            if (!text.trim()) { out.innerHTML = '<div style="color:#c0392b;font-size:13px;">❌ 请先粘贴文本</div>'; return; }
            const all = trExtractTodosFromText(text, 'default', '手动粘贴', new Date().toISOString().split('T')[0]);
            if (!all.length) { out.innerHTML = '<div style="color:#c0392b;font-size:13px;">❌ 未找到待办关键词</div>'; return; }
            window.__trManual = all;
            let html = `<div style="color:#27ae60;font-size:13px;margin-bottom:8px;">✅ 抽取到 ${all.length} 个待办：</div>`;
            all.forEach((t, i) => {
                html += `<div style="display:flex;gap:8px;align-items:center;padding:4px 0;font-size:13px;">
                    <input type="checkbox" id="trm_${i}" checked>
                    <label for="trm_${i}" style="flex:1;cursor:pointer;">${escapeHtml(t.text)}</label>
                </div>`;
            });
            html += `<button onclick="trApplyManual()" style="margin-top:10px;background:#3a3a3a;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-size:12px;">应用选中项</button>`;
            out.innerHTML = html;
        }

        function trApplyManual() {
            const all = window.__trManual || [];
            if (!all.length) { alert('请先抽取'); return; }
            const todos = getTodos();
            if (!todos['default']) todos['default'] = [];
            let added = 0;
            all.forEach((t, i) => {
                const cb = document.getElementById('trm_' + i);
                if (cb && cb.checked) {
                    todos['default'].push({ id: 'trm_' + Date.now() + '_' + i, text: t.text, status: 'pending', priority: 'medium', created: t.date || null });
                    added++;
                }
            });
            saveTodos(todos);
            alert(`✅ 已写入 ${added} 个待办。`);
            trManualExtract();
        }

        // D. 清空
        function trClearTodos() {
            if (!confirm('确定清空当前全部待办清单吗？此操作不可撤销（建议先导出备份）。')) return;
            localStorage.removeItem(TODOS_KEY);
            saveTodos({});
            alert('✅ 已清空待办清单');
        }

        // 初始化时执行每日备份
        takeDailyBackup();

        // DOMContentLoaded 末尾添加拖拽初始化
        const originalInit = window.addEventListener;
        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(initDragSort, 100);
        });

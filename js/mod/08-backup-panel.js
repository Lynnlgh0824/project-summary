        // ==================== 备份管理面板 ====================
        function renderBackupPanel() {
            const backups = getBackupList();
            return `
                <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; border: 1px solid #e9ecef; margin-top: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h4 style="margin: 0; font-size: 14px;">💾 数据备份（最近 ${backups.length} 天）</h4>
                        <button class="btn btn-primary" onclick="takeDailyBackup(); alert('✅ 手动备份完成');" style="font-size: 12px; padding: 5px 12px;">立即备份</button>
                    </div>
                    ${backups.length === 0
                        ? '<p style="color: #999; font-size: 13px; margin: 0;">暂无备份记录</p>'
                        : `<div style="max-height: 200px; overflow-y: auto;">
                            ${backups.map(date => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e9ecef; font-size: 13px;">
                                    <span>📅 ${date}</span>
                                    <button onclick="restoreBackup('${date}')" style="background: #3a3a3a; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">回滚</button>
                                </div>
                            `).join('')}
                           </div>`
                    }
                </div>
            `;
        }

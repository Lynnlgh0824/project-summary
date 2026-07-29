        // ==================== 定期备份 + 30天回滚 ====================
        const BACKUP_PREFIX = 'backup_';
        const BACKUP_DAYS = 30;
        const BACKUP_KEYS = ['backup_logs', 'backup_projects', 'backup_todos'];

        function takeDailyBackup() {
            const today = new Date().toISOString().split('T')[0];
            const backupKey = BACKUP_PREFIX + today;

            if (localStorage.getItem(backupKey + '_logs')) return;

            const logs = getLogs();
            const projects = getProjects();
            const todos = getTodos();

            localStorage.setItem(backupKey + '_logs', JSON.stringify(logs));
            localStorage.setItem(backupKey + '_projects', JSON.stringify(projects));
            localStorage.setItem(backupKey + '_todos', JSON.stringify(todos));

            cleanupOldBackups();
        }

        function cleanupOldBackups() {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - BACKUP_DAYS);
            const cutoffStr = cutoff.toISOString().split('T')[0];

            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(BACKUP_PREFIX) && key.endsWith('_logs')) {
                    const date = key.replace(BACKUP_PREFIX, '').replace('_logs', '');
                    if (date < cutoffStr) {
                        localStorage.removeItem(BACKUP_PREFIX + date + '_logs');
                        localStorage.removeItem(BACKUP_PREFIX + date + '_projects');
                        localStorage.removeItem(BACKUP_PREFIX + date + '_todos');
                    }
                }
            });
        }

        function getBackupList() {
            const backups = [];
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(BACKUP_PREFIX) && key.endsWith('_logs')) {
                    const date = key.replace(BACKUP_PREFIX, '').replace('_logs', '');
                    backups.push(date);
                }
            });
            return backups.sort().reverse();
        }

        function restoreBackup(date) {
            if (!confirm(`确定要回滚到 ${date} 的备份吗？当前数据将被覆盖。`)) return;

            const logs = JSON.parse(localStorage.getItem(BACKUP_PREFIX + date + '_logs') || '[]');
            const projects = JSON.parse(localStorage.getItem(BACKUP_PREFIX + date + '_projects') || '[]');
            const todos = JSON.parse(localStorage.getItem(BACKUP_PREFIX + date + '_todos') || '{}');

            localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
            localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
            localStorage.setItem(TODOS_KEY, JSON.stringify(todos));

            alert(`✅ 已回滚到 ${date} 的备份`);
            renderAll();
            renderProjectList();
            renderQuickAccess();
            updateProjectSelector();
        }

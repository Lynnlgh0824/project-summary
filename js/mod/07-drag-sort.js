        // ==================== 项目拖拽排序 ====================
        function initDragSort() {
            const projectList = document.getElementById('projectList');
            if (!projectList) return;

            projectList.addEventListener('dragover', (e) => {
                e.preventDefault();
                const dragging = document.querySelector('.drag-over');
                if (dragging) dragging.classList.remove('drag-over');

                const after = getDragAfterElement(projectList, e.clientY);
                if (after == null) {
                    projectList.appendChild(document.querySelector('.dragging'));
                } else {
                    projectList.insertBefore(document.querySelector('.dragging'), after);
                }
            });
        }

        function getDragAfterElement(container, y) {
            const draggable = [...container.querySelectorAll('.project-item:not(.dragging)')];
            return draggable.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                }
                return closest;
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }

        function onProjectDragStart(e, projectId) {
            e.target.classList.add('dragging');
            e.dataTransfer.setData('text/plain', projectId);
        }

        function onProjectDragEnd(e) {
            e.target.classList.remove('dragging');
            saveProjectOrder();
        }

        function saveProjectOrder() {
            const items = document.querySelectorAll('#projectList .project-item');
            const ordered = [...items].map(item => {
                const nameEl = item.querySelector('.project-name');
                if (!nameEl) return null;
                return nameEl.textContent.replace('📂 ', '');
            }).filter(Boolean);

            const projects = getProjects();
            const orderedProjects = ordered.map(name => {
                return projects.find(p => p.name === name);
            }).filter(Boolean);

            if (orderedProjects.length === projects.length) {
                localStorage.setItem(PROJECTS_KEY, JSON.stringify(orderedProjects));
                updateProjectSelector();
                renderQuickAccess();
            }
        }

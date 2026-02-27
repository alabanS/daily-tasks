// Модуль задач
const tasksModule = (function() {
    const STORAGE_KEY = 'daily_tasks';
    let currentEditId = null;
    let currentFilter = 'all';
    let selectedPriority = 'medium';

    // Получение задач из localStorage
    function getTasks() {
        const tasksJson = localStorage.getItem(STORAGE_KEY);
        return tasksJson ? JSON.parse(tasksJson) : [];
    }

    // Сохранение задач в localStorage
    function saveTasks(tasks) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        updateStats(tasks);
        
        if (currentFilter === 'date') {
            // Если фильтр по дате, нужно получить выбранную дату из календаря
        } else {
            filterTasks(currentFilter);
        }
        
        if (typeof calendarModule !== 'undefined' && calendarModule.refreshCalendar) {
            calendarModule.refreshCalendar();
        }
    }

    // Обновление статистики
    function updateStats(tasks) {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;
        
        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
        
        const progressPercent = total === 0 ? 0 : (completed / total) * 100;
        document.getElementById('progressFill').style.width = `${progressPercent}%`;
    }

    // Форматирование даты и времени
    function formatDateTime(dateTimeStr) {
        if (!dateTimeStr) return 'Дата не указана';
        
        const date = new Date(dateTimeStr);
        return date.toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Экранирование HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Отображение задач
    function displayTasks(tasks) {
        const container = document.getElementById('tasksList');

        if (tasks.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Задач пока нет</p><p style="font-size: 0.9em;">Нажмите + чтобы добавить задачу</p></div>';
            return;
        }

        let html = '';
        tasks.forEach(task => {
            const priorityLabels = {
                high: '🔴 Высокий',
                medium: '🟡 Средний',
                low: '🟢 Низкий'
            };

            // Подзадачи
            let subtasksHTML = '';
            if (task.subtasks && task.subtasks.length > 0) {
                subtasksHTML = '<div class="task-subtasks">';
                task.subtasks.forEach(subtask => {
                    subtasksHTML += `
                        <div class="subtask-item ${subtask.completed ? 'completed' : ''}">
                            <input type="checkbox" class="subtask-checkbox" ${subtask.completed ? 'checked' : ''} 
                                   onchange="tasksModule.toggleSubtaskComplete(${task.id}, '${subtask.id}')">
                            <span class="subtask-title">${escapeHtml(subtask.title)}</span>
                            ${subtask.deadline ? `<span class="subtask-deadline">⏰ ${formatDateTime(subtask.deadline)}</span>` : ''}
                        </div>
                    `;
                });
                subtasksHTML += '</div>';
            }

            html += `
                <li class="task-item ${task.completed ? 'completed' : ''}">
                    <div class="task-main">
                        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="tasksModule.toggleTaskComplete(${task.id})">
                        
                        <div class="task-content">
                            <div class="task-header">
                                <span class="task-title ${task.completed ? 'completed' : ''}">${escapeHtml(task.title)}</span>
                                <span class="priority-badge ${task.priority}">${priorityLabels[task.priority]}</span>
                            </div>
                            
                            ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                            
                            <div class="task-meta">
                                <span>📅 ${formatDateTime(task.dateTime)}</span>
                                <span>➕ ${task.createdAt}</span>
                                ${task.completedAt ? `<span>✅ Выполнено: ${task.completedAt}</span>` : ''}
                            </div>
                        </div>
                        
                        <div class="task-actions">
                            <button class="action-btn edit-btn" onclick="tasksModule.openEditModal(${task.id})" title="Редактировать">✏️</button>
                            <button class="action-btn delete-btn" onclick="tasksModule.deleteTask(${task.id})" title="Удалить">🗑️</button>
                        </div>
                    </div>
                    
                    ${subtasksHTML}
                </li>
            `;
        });

        container.innerHTML = html;
    }

    // Переключение формы добавления задачи
    function toggleForm() {
        const form = document.getElementById('taskForm');
        form.classList.toggle('active');
        
        if (form.classList.contains('active')) {
            document.getElementById('taskTitle').focus();
            selectedPriority = 'medium';
            updatePriorityUI();
            setDefaultDateTime();
            document.getElementById('subtasksContainer').innerHTML = '';
        }
    }

    // Установка текущей даты и времени в поля ввода
    function setDefaultDateTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        const defaultDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        
        const taskDateTime = document.getElementById('taskDateTime');
        if (taskDateTime && !taskDateTime.value) {
            taskDateTime.value = defaultDateTime;
        }
    }

    // Выбор приоритета
    function selectPriority(priority) {
        selectedPriority = priority;
        updatePriorityUI();
    }

    // Обновление UI приоритета
    function updatePriorityUI() {
        document.querySelectorAll('.priority-option').forEach(opt => {
            opt.classList.remove('selected');
            if (opt.dataset.priority === selectedPriority) {
                opt.classList.add('selected');
            }
        });
    }

    // Добавление поля подзадачи (для формы создания)
    function addSubtaskField() {
        const container = document.getElementById('subtasksContainer');
        const subtaskId = Date.now() + Math.random();
        
        const subtaskHTML = `
            <div class="subtask-item" id="subtask-${subtaskId}">
                <input type="text" placeholder="Название подзадачи" class="subtask-title-input">
                <input type="datetime-local" class="subtask-deadline-input">
                <button class="remove-subtask" onclick="tasksModule.removeSubtaskField('${subtaskId}')" type="button">✕</button>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', subtaskHTML);
    }

    // Удаление поля подзадачи (для формы создания)
    function removeSubtaskField(id) {
        document.getElementById(`subtask-${id}`).remove();
    }

    // Добавление поля подзадачи в режиме редактирования
    function addEditSubtaskField(subtaskData = null) {
        const container = document.getElementById('editSubtasksContainer');
        const subtaskId = subtaskData ? subtaskData.id : Date.now() + Math.random();
        
        const value = subtaskData ? escapeHtml(subtaskData.title) : '';
        const deadlineValue = subtaskData && subtaskData.deadline ? subtaskData.deadline : '';
        const checked = subtaskData && subtaskData.completed ? 'checked' : '';
        
        const subtaskHTML = `
            <div class="subtask-item" id="edit-subtask-${subtaskId}">
                <input type="text" placeholder="Название подзадачи" class="subtask-title-input" value="${value}">
                <input type="datetime-local" class="subtask-deadline-input" value="${deadlineValue}">
                <label style="display: flex; align-items: center; gap: 3px; font-size: 0.8em;">
                    <input type="checkbox" class="subtask-checkbox-edit" ${checked}> Готово
                </label>
                <button class="remove-subtask" onclick="tasksModule.removeEditSubtaskField('${subtaskId}')" type="button">✕</button>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', subtaskHTML);
    }

    // Удаление поля подзадачи в режиме редактирования
    function removeEditSubtaskField(id) {
        document.getElementById(`edit-subtask-${id}`).remove();
    }

    // Добавление задачи
    function addTask() {
        const titleInput = document.getElementById('taskTitle');
        const descInput = document.getElementById('taskDescription');
        const dateTimeInput = document.getElementById('taskDateTime');
        
        const title = titleInput.value.trim();
        const description = descInput.value.trim();
        const dateTime = dateTimeInput.value || new Date().toISOString().slice(0, 16);

        if (!title) {
            alert('Введите название задачи!');
            return;
        }

        // Собираем подзадачи
        const subtasks = [];
        document.querySelectorAll('#subtasksContainer .subtask-item').forEach(item => {
            const titleInput = item.querySelector('.subtask-title-input');
            const deadlineInput = item.querySelector('.subtask-deadline-input');
            
            if (titleInput.value.trim()) {
                subtasks.push({
                    id: Date.now() + Math.random(),
                    title: titleInput.value.trim(),
                    deadline: deadlineInput.value,
                    completed: false
                });
            }
        });

        const newTask = {
            id: Date.now(),
            title: title,
            description: description,
            dateTime: dateTime,
            priority: selectedPriority,
            completed: false,
            createdAt: new Date().toLocaleString('ru-RU'),
            completedAt: null,
            subtasks: subtasks
        };

        const tasks = getTasks();
        tasks.unshift(newTask);
        saveTasks(tasks);

        titleInput.value = '';
        descInput.value = '';
        dateTimeInput.value = '';
        selectedPriority = 'medium';
        updatePriorityUI();
        document.getElementById('subtasksContainer').innerHTML = '';
        
        toggleForm();
    }

    // Переключение статуса задачи
    function toggleTaskComplete(id) {
        const tasks = getTasks();
        const task = tasks.find(t => t.id === id);
        
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toLocaleString('ru-RU') : null;
            saveTasks(tasks);
        }
    }

    // Переключение статуса подзадачи
    function toggleSubtaskComplete(taskId, subtaskId) {
        const tasks = getTasks();
        const task = tasks.find(t => t.id === taskId);
        
        if (task && task.subtasks) {
            // Ищем подзадачу по ID (теперь ID могут быть строками или числами)
            const subtask = task.subtasks.find(s => String(s.id) === String(subtaskId));
            
            if (subtask) {
                subtask.completed = !subtask.completed;
                
                // Проверяем, все ли подзадачи выполнены
                const allCompleted = task.subtasks.every(s => s.completed);
                if (allCompleted && !task.completed) {
                    task.completed = true;
                    task.completedAt = new Date().toLocaleString('ru-RU');
                } else if (!allCompleted && task.completed) {
                    task.completed = false;
                    task.completedAt = null;
                }
                
                saveTasks(tasks);
            }
        }
    }

    // Удаление задачи
    function deleteTask(id) {
        if (confirm('Удалить задачу?')) {
            const tasks = getTasks();
            const filteredTasks = tasks.filter(task => task.id !== id);
            saveTasks(filteredTasks);
        }
    }

    // Открытие модального окна редактирования
    function openEditModal(id) {
        const tasks = getTasks();
        const task = tasks.find(t => t.id === id);
        
        if (task) {
            currentEditId = id;
            document.getElementById('editTitle').value = task.title;
            document.getElementById('editDescription').value = task.description || '';
            
            if (task.dateTime) {
                document.getElementById('editDateTime').value = task.dateTime;
            } else {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                document.getElementById('editDateTime').value = `${year}-${month}-${day}T${hours}:${minutes}`;
            }
            
            document.getElementById('editPriority').value = task.priority;
            
            // Загружаем подзадачи для редактирования
            const container = document.getElementById('editSubtasksContainer');
            container.innerHTML = '';
            
            if (task.subtasks && task.subtasks.length > 0) {
                task.subtasks.forEach(subtask => {
                    addEditSubtaskField(subtask);
                });
            }
            
            document.getElementById('editModal').classList.add('active');
        }
    }

    // Закрытие модального окна
    function closeModal() {
        document.getElementById('editModal').classList.remove('active');
        document.getElementById('editSubtasksContainer').innerHTML = '';
        currentEditId = null;
    }

    // Сохранение изменений
    function saveEdit() {
        if (!currentEditId) return;

        const newTitle = document.getElementById('editTitle').value.trim();
        const newDescription = document.getElementById('editDescription').value.trim();
        const newDateTime = document.getElementById('editDateTime').value;
        const newPriority = document.getElementById('editPriority').value;

        if (!newTitle) {
            alert('Введите название задачи!');
            return;
        }

        // Собираем подзадачи из формы редактирования
        const subtasks = [];
        document.querySelectorAll('#editSubtasksContainer .subtask-item').forEach(item => {
            const titleInput = item.querySelector('.subtask-title-input');
            const deadlineInput = item.querySelector('.subtask-deadline-input');
            const checkboxInput = item.querySelector('.subtask-checkbox-edit');
            
            if (titleInput.value.trim()) {
                // Извлекаем ID из элемента
                const id = item.id.replace('edit-subtask-', '');
                
                subtasks.push({
                    id: id, // Сохраняем существующий ID
                    title: titleInput.value.trim(),
                    deadline: deadlineInput.value,
                    completed: checkboxInput ? checkboxInput.checked : false
                });
            }
        });

        const tasks = getTasks();
        const index = tasks.findIndex(t => t.id === currentEditId);
        
        if (index !== -1) {
            tasks[index].title = newTitle;
            tasks[index].description = newDescription;
            tasks[index].dateTime = newDateTime;
            tasks[index].priority = newPriority;
            tasks[index].subtasks = subtasks; // Обновляем подзадачи
            
            saveTasks(tasks);
        }

        closeModal();
    }

    // Фильтрация задач
    function filterTasks(filter) {
        currentFilter = filter;
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`filter${filter.charAt(0).toUpperCase() + filter.slice(1)}`).classList.add('active');
        
        const tasks = getTasks();
        let filteredTasks = tasks;
        
        if (filter === 'pending') {
            filteredTasks = tasks.filter(t => !t.completed);
        } else if (filter === 'completed') {
            filteredTasks = tasks.filter(t => t.completed);
        }
        
        displayTasks(filteredTasks);
    }

    // Фильтрация по дате
    function filterTasksByDate(date) {
        currentFilter = 'date';
        const tasks = getTasks();
        const dateStr = date.toISOString().split('T')[0];
        
        const filteredTasks = tasks.filter(task => {
            if (!task.dateTime) return false;
            const taskDate = new Date(task.dateTime).toISOString().split('T')[0];
            return taskDate === dateStr;
        });
        
        displayTasks(filteredTasks);
    }

    // Загрузка всех задач
    function loadTasks() {
        const tasks = getTasks();
        updateStats(tasks);
        displayTasks(tasks);
    }

    // Инициализация
    function init() {
        loadTasks();
        setDefaultDateTime();
        updatePriorityUI();
        
        // Установка текущей даты
        document.getElementById('currentDate').textContent = new Date().toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    // Публичные методы
    return {
        getTasks,
        init,
        toggleForm,
        selectPriority,
        addSubtaskField,
        removeSubtaskField,
        addEditSubtaskField,
        removeEditSubtaskField,
        addTask,
        toggleTaskComplete,
        toggleSubtaskComplete,
        deleteTask,
        openEditModal,
        closeModal,
        saveEdit,
        filterTasks,
        filterTasksByDate
    };
})();
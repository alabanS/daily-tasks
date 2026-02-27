// Главный модуль приложения
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация всех модулей
    tasksModule.init();
    calendarModule.init();
    
    // Обработчики клавиш
    document.getElementById('taskTitle').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.getElementById('taskDescription').focus();
        }
    });

    document.getElementById('taskDescription').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.getElementById('taskDateTime').focus();
        }
    });
});

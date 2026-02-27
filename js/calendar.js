// Модуль календаря
const calendarModule = (function() {
    let currentCalendarDate = new Date();
    let selectedCalendarDate = new Date();

    // Инициализация
    function init() {
        renderCalendar();
    }

    // Переключение календаря
    function toggleCalendar() {
        const calendar = document.getElementById('miniCalendar');
        calendar.classList.toggle('active');
        if (calendar.classList.contains('active')) {
            renderCalendar();
        }
    }

    // Отрисовка календаря
    function renderCalendar() {
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();
        
        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                           'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        document.getElementById('calendarMonth').textContent = monthNames[month] + ' ' + year;
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        let startDay = firstDay.getDay();
        startDay = startDay === 0 ? 6 : startDay - 1;
        
        const totalDays = lastDay.getDate();
        
        let calendarHTML = '';
        
        // Пустые ячейки
        for (let i = 0; i < startDay; i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }
        
        // Дни месяца
        const today = new Date();
        const tasks = tasksModule.getTasks();
        
        for (let day = 1; day <= totalDays; day++) {
            const currentDate = new Date(year, month, day);
            const dateStr = currentDate.toISOString().split('T')[0];
            
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            const isSelected = selectedCalendarDate.getDate() === day && 
                              selectedCalendarDate.getMonth() === month && 
                              selectedCalendarDate.getFullYear() === year;
            
            // Проверяем, есть ли задачи на этот день
            const hasTasks = tasks.some(task => {
                if (!task.dateTime) return false;
                const taskDate = new Date(task.dateTime).toISOString().split('T')[0];
                return taskDate === dateStr;
            });
            
            let dayClass = 'calendar-day';
            if (isToday) dayClass += ' today';
            if (isSelected) dayClass += ' selected';
            if (hasTasks) dayClass += ' has-tasks';
            
            calendarHTML += `<div class="${dayClass}" onclick="calendarModule.selectDate(${year}, ${month}, ${day})">${day}</div>`;
        }
        
        document.getElementById('calendarDays').innerHTML = calendarHTML;
    }

    // Смена месяца
    function changeMonth(delta) {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
        renderCalendar();
    }

    // Выбор даты
    function selectDate(year, month, day) {
        selectedCalendarDate = new Date(year, month, day);
        document.getElementById('currentDate').textContent = selectedCalendarDate.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        renderCalendar();
        tasksModule.filterTasksByDate(selectedCalendarDate);
    }

    // Обновление календаря (для внешнего вызова)
    function refreshCalendar() {
        renderCalendar();
    }

    // Публичные методы
    return {
        init,
        toggleCalendar,
        changeMonth,
        selectDate,
        refreshCalendar
    };
})();
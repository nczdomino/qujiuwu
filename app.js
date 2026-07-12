// ==================== GLOBAL VARIABLES ====================
let employees = [];
let schedules = {};
let currentWeek = 0;
let selectedEmployee = null;
let selectedPosition = '前台/服务区';
let currentPositionFilter = 'all';
let currentLanguage = 'ja';

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 鍛治町酒場 神田店 勤務表システム起動");
    
    const savedLanguage = localStorage.getItem('appLanguage');
    if (savedLanguage) {
        currentLanguage = savedLanguage;
    }
    
    initApp();
    loadEmployees();
    loadSchedules();
    setupEventListeners();
    
    console.log("✅ アプリ初期化完了");
});

function initApp() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const scheduleDateInput = document.getElementById('scheduleDate');
    if (scheduleDateInput) {
        scheduleDateInput.value = todayStr;
        scheduleDateInput.min = todayStr;
    }
    
    initWeekdaysSelector();
    updateCurrentDate();
    updateLanguage();
    setInterval(updateCurrentDate, 60000);
    initDragDrop();
}

// ==================== LANGUAGE FUNCTIONS ====================
function updateLanguage() {
    document.querySelectorAll('[data-lang]').forEach(element => {
        const jaElement = element.querySelector('[data-lang="ja"]');
        const zhElement = element.querySelector('[data-lang="zh"]');
        
        if (jaElement && zhElement) {
            if (currentLanguage === 'ja') {
                jaElement.style.display = 'inline';
                zhElement.style.display = 'none';
            } else {
                jaElement.style.display = 'none';
                zhElement.style.display = 'inline';
            }
        } else if (element.hasAttribute('data-lang')) {
            const lang = element.getAttribute('data-lang');
            element.style.display = lang === currentLanguage ? 'inline' : 'none';
        }
    });
    
    const languageBtn = document.getElementById('languageSwitch');
    const currentLangSpan = document.getElementById('currentLanguage');
    if (currentLanguage === 'ja') {
        currentLangSpan.textContent = '日本語';
        languageBtn.title = 'Switch to Chinese';
    } else {
        currentLangSpan.textContent = '中文';
        languageBtn.title = 'Switch to Japanese';
    }
    
    updateCurrentDate();
    
    const searchInput = document.getElementById('employeeSearch');
    if (searchInput) {
        searchInput.placeholder = currentLanguage === 'ja' ? 'スタッフを検索...' : '搜索员工...';
    }
    
    updatePrintDate();
    renderEmployeeCards();
    renderWeeklySchedule();
}

function updateCurrentDate() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        if (currentLanguage === 'ja') {
            currentDateElement.textContent = now.toLocaleDateString('ja-JP', options);
        } else {
            currentDateElement.textContent = now.toLocaleDateString('zh-CN', options);
        }
    }
}

function updatePrintDate() {
    const today = new Date();
    const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        weekday: 'long'
    };
    
    const printDateElement = document.getElementById('printDate');
    if (printDateElement) {
        if (currentLanguage === 'ja') {
            printDateElement.textContent = today.toLocaleDateString('ja-JP', options);
        } else {
            printDateElement.textContent = today.toLocaleDateString('zh-CN', options);
        }
    }
}

// ==================== MODAL FUNCTIONS ====================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`Modal ${modalId} not found`);
        return;
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        const firstInput = modal.querySelector('input:not([type="hidden"]), select, button:not(.modal-close)');
        if (firstInput && firstInput.type !== 'hidden') {
            firstInput.focus();
        }
    }, 100);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    if (modalId === 'employeeModal') {
        selectedEmployee = null;
    }
}

// ==================== MESSAGE FUNCTIONS ====================
function showMessage(message, type = 'info') {
    let translatedMessage = message;
    if (currentLanguage === 'ja') {
        const messageMap = {
            'Schedule added successfully': 'スケジュールを追加しました',
            'Schedule updated successfully': 'スケジュールを更新しました',
            'Employee added successfully': 'スタッフを追加しました',
            'Please enter employee name': '名前を入力してください',
            'Please select an employee': 'スタッフを選択してください',
            'Please select a date': '日付を選択してください',
            'Please enter work time': '勤務時間を入力してください',
            'Database connection error': 'データベース接続エラー',
            'Error loading employees': 'スタッフデータの読み込みエラー',
            'Error loading schedules': 'スケジュールデータの読み込みエラー',
            'Delete failed:': '削除に失敗:',
            'Update failed:': '更新に失敗:',
            'Add failed:': '追加に失敗:',
            'Setting failed:': '設定に失敗:',
            'Refresh error:': '更新エラー:',
            'An error occurred, please refresh the page and try again': 'エラーが発生しました。ページを更新して再試行してください',
            'Same position': '同じ職種です',
            'Position changed successfully': '職種を変更しました'
        };
        translatedMessage = messageMap[message] || message;
    } else {
        const messageMap = {
            'Schedule added successfully': '排班添加成功',
            'Schedule updated successfully': '排班更新成功',
            'Employee added successfully': '员工添加成功',
            'Please enter employee name': '请输入员工姓名',
            'Please select an employee': '请选择员工',
            'Please select a date': '请选择日期',
            'Please enter work time': '请输入工作时间',
            'Database connection error': '数据库连接错误',
            'Error loading employees': '加载员工数据错误',
            'Error loading schedules': '加载排班数据错误',
            'Delete failed:': '删除失败:',
            'Update failed:': '更新失败:',
            'Add failed:': '添加失败:',
            'Setting failed:': '设置失败:',
            'Refresh error:': '刷新错误:',
            'An error occurred, please refresh the page and try again': '发生错误，请刷新页面重试',
            'Same position': '职位相同',
            'Position changed successfully': '职位已更改'
        };
        translatedMessage = messageMap[message] || message;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    
    let icon = 'fa-info-circle';
    switch(type) {
        case 'success': icon = 'fa-check-circle'; break;
        case 'error': icon = 'fa-exclamation-circle'; break;
        case 'warning': icon = 'fa-exclamation-triangle'; break;
        default: icon = 'fa-info-circle';
    }
    
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${icon}"></i>
            <span>${translatedMessage}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// ==================== TIME VALIDATION FUNCTIONS ====================
function validateTimeRange(startTime, endTime) {
    if (!startTime || !endTime) {
        showMessage(currentLanguage === 'ja' ? '開始時間と終了時間を入力してください' : '请输入开始和结束时间', 'warning');
        return false;
    }
    
    const startParts = startTime.split(':').map(Number);
    const endParts = endTime.split(':').map(Number);
    
    if (startParts.length !== 2 || endParts.length !== 2 ||
        isNaN(startParts[0]) || isNaN(startParts[1]) ||
        isNaN(endParts[0]) || isNaN(endParts[1])) {
        showMessage(currentLanguage === 'ja' ? '無効な時間形式です' : '无效的时间格式', 'warning');
        return false;
    }
    
    if (startParts[0] < 0 || startParts[0] > 23 || startParts[1] < 0 || startParts[1] > 59 ||
        endParts[0] < 0 || endParts[0] > 23 || endParts[1] < 0 || endParts[1] > 59) {
        showMessage(currentLanguage === 'ja' ? '時間は00:00から23:59の間で入力してください' : '时间必须在00:00到23:59之间', 'warning');
        return false;
    }
    
    const startTotalMinutes = startParts[0] * 60 + startParts[1];
    const endTotalMinutes = endParts[0] * 60 + endParts[1];
    
    if (startTotalMinutes === endTotalMinutes) {
        showMessage(currentLanguage === 'ja' ? '開始時間と終了時間を同じにできません' : '开始和结束时间不能相同', 'warning');
        return false;
    }
    
    let workMinutes;
    if (endTotalMinutes <= startTotalMinutes) {
        workMinutes = (24 * 60 - startTotalMinutes) + endTotalMinutes;
    } else {
        workMinutes = endTotalMinutes - startTotalMinutes;
    }
    
    if (workMinutes < 15) {
        showMessage(currentLanguage === 'ja' ? 'シフトは最低15分以上必要です' : '班次必须至少15分钟', 'warning');
        return false;
    }
    
    if (workMinutes > 24 * 60) {
        showMessage(currentLanguage === 'ja' ? 'シフトは24時間を超えることはできません' : '班次不能超过24小时', 'warning');
        return false;
    }
    
    return true;
}

function roundHours(value, decimals = 1) {
    if (typeof value !== 'number' || !isFinite(value)) return 0;
    const factor = Math.pow(10, decimals);
    let rounded = Math.round((value + Number.EPSILON) * factor) / factor;
    if (Object.is(rounded, -0)) rounded = 0;
    return rounded;
}

function calculateShiftHours(startTime, endTime) {
    if (!startTime || !endTime) {
        return 0;
    }
    
    const startParts = startTime.split(':').map(Number);
    const endParts = endTime.split(':').map(Number);
    
    if (startParts.length !== 2 || endParts.length !== 2 ||
        isNaN(startParts[0]) || isNaN(startParts[1]) ||
        isNaN(endParts[0]) || isNaN(endParts[1])) {
        return 0;
    }
    
    const startTotalMinutes = startParts[0] * 60 + startParts[1];
    const endTotalMinutes = endParts[0] * 60 + endParts[1];
    
    let workMinutes;
    if (endTotalMinutes <= startTotalMinutes) {
        workMinutes = (24 * 60 - startTotalMinutes) + endTotalMinutes;
    } else {
        workMinutes = endTotalMinutes - startTotalMinutes;
    }
    
    const workHours = workMinutes / 60;
    return roundHours(workHours, 2);
}

// ==================== VIEW MANAGEMENT ====================
function switchView(viewName) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const viewElement = document.getElementById(viewName + 'View');
    if (viewElement) {
        viewElement.classList.add('active');
    }
    
    const navBtn = document.querySelector(`.nav-btn[data-view="${viewName}"]`);
    if (navBtn) navBtn.classList.add('active');
    
    switch(viewName) {
        case 'weekly':
            renderWeeklySchedule();
            break;
        case 'schedule':
            updateScheduleEmployeeSelect();
            break;
        case 'employees':
            renderEmployeeCards();
            break;
    }
    
    localStorage.setItem('lastView', viewName);
}
// ==================== EMPLOYEE MANAGEMENT ====================
function loadEmployees() {
    if (!window.database) {
        console.error("Database not initialized");
        return;
    }
    
    const employeesRef = window.database.ref('employees');
    
    employeesRef.on('value', (snapshot) => {
        employees = [];
        const data = snapshot.val();
        
        if (data) {
            Object.keys(data).forEach(key => {
                employees.push({
                    id: key,
                    name: data[key].name,
                    position: data[key].position || '前台/服务区',
                    createdAt: data[key].createdAt
                });
            });
        }
        
        renderEmployeeCards();
        updateAllEmployeeSelects();
        renderWeeklySchedule();
    }, (error) => {
        console.error("Error loading employees:", error);
        showMessage(`${currentLanguage === 'ja' ? 'スタッフデータの読み込みエラー' : '加载员工数据错误'}: ${error.code || error.message || error}`, "error");
    });
}

function renderEmployeeCards() {
    const container = document.getElementById('employeeCards');
    if (!container) return;
    
    const searchInput = document.getElementById('employeeSearch');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    let filteredEmployees = employees;
    
    if (searchTerm) {
        filteredEmployees = filteredEmployees.filter(emp => 
            emp.name.toLowerCase().includes(searchTerm)
        );
    }
    
    if (currentPositionFilter !== 'all') {
        filteredEmployees = filteredEmployees.filter(emp => 
            emp.position === currentPositionFilter
        );
    }
    
    if (filteredEmployees.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>${searchTerm || currentPositionFilter !== 'all' ? 
                    (currentLanguage === 'ja' ? '該当するスタッフがありません' : '没有找到员工') : 
                    (currentLanguage === 'ja' ? 'スタッフがまだ登録されていません' : '还没有员工')}</p>
                <small>${currentLanguage === 'ja' ? '+ボタンをクリックしてスタッフを追加' : '点击+按钮添加员工'}</small>
            </div>
        `;
        return;
    }
    
    const frontDeskEmployees = filteredEmployees.filter(emp => emp.position === '前台/服务区');
    const kitchenEmployees = filteredEmployees.filter(emp => emp.position === '厨房区');
    const rakkaEmployees = filteredEmployees.filter(emp => emp.position === '拉客');
    
    let html = '';
    
    if (frontDeskEmployees.length > 0) {
        const title = currentLanguage === 'ja' ? 'フロント/サービス' : '前台/服务';
        html += `
            <div class="position-group" data-position="前台/服务区" data-drop-label="${currentLanguage === 'ja' ? 'フロントに移動' : '移动到前台'}">
                <h3 class="position-title" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: var(--info);">
                    <i class="fas fa-door-open"></i> ${title}
                    <span class="position-count" style="font-size: 12px; background: var(--info-light); color: var(--info); padding: 2px 8px; border-radius: 12px;">${frontDeskEmployees.length}</span>
                </h3>
                <div class="position-cards">
                    ${frontDeskEmployees.map(emp => generateEmployeeCard(emp)).join('')}
                </div>
            </div>
        `;
    }
    
    if (kitchenEmployees.length > 0) {
        const title = currentLanguage === 'ja' ? '厨房' : '厨房';
        html += `
            <div class="position-group" data-position="厨房区" data-drop-label="${currentLanguage === 'ja' ? '厨房に移動' : '移动到厨房'}">
                <h3 class="position-title" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: var(--warning);">
                    <i class="fas fa-utensils"></i> ${title}
                    <span class="position-count" style="font-size: 12px; background: var(--warning-light); color: var(--warning); padding: 2px 8px; border-radius: 12px;">${kitchenEmployees.length}</span>
                </h3>
                <div class="position-cards">
                    ${kitchenEmployees.map(emp => generateEmployeeCard(emp)).join('')}
                </div>
            </div>
        `;
    }
    
    if (rakkaEmployees.length > 0) {
        const title = currentLanguage === 'ja' ? 'ラッカ' : '拉客';
        html += `
            <div class="position-group" data-position="拉客" data-drop-label="${currentLanguage === 'ja' ? 'ラッカに移動' : '移动到拉客'}">
                <h3 class="position-title" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: var(--secondary);">
                    <i class="fas fa-handshake"></i> ${title}
                    <span class="position-count" style="font-size: 12px; background: var(--secondary-light); color: var(--secondary); padding: 2px 8px; border-radius: 12px;">${rakkaEmployees.length}</span>
                </h3>
                <div class="position-cards">
                    ${rakkaEmployees.map(emp => generateEmployeeCard(emp)).join('')}
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    refreshDragDrop();
}

function getDayHeadcount(dateString) {
    const result = { front: 0, kitchen: 0, rakka: 0 };
    if (!schedules || typeof schedules !== 'object') return result;
    
    Object.values(schedules).forEach(s => {
        if (s && s.date === dateString && !s.isDayOff) {
            if (s.employeePosition === '厨房区') {
                result.kitchen++;
            } else if (s.employeePosition === '拉客') {
                result.rakka++;
            } else {
                result.front++;
            }
        }
    });
    
    return result;
}

function getWeekPattern(employeeId, weekOffset = 0) {
    const { startDate } = getWeekDates(weekOffset);
    const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    const weekSchedule = getEmployeeSchedulesForWeek(employeeId, startDate, endDate);
    const days = generateWeekDays(startDate);
    const dayLetters = currentLanguage === 'ja' 
        ? ['月', '火', '水', '木', '金', '土', '日']
        : ['一', '二', '三', '四', '五', '六', '日'];
    
    return days.map((day, index) => {
        const schedule = weekSchedule.find(s => s.date === day.dateString);
        let status = 'none';
        let timeLabel = '';
        if (schedule) {
            status = schedule.isDayOff ? 'rest' : 'work';
            if (!schedule.isDayOff && schedule.startTime && schedule.endTime) {
                timeLabel = `${schedule.startTime.substring(0,5)}-${schedule.endTime.substring(0,5)}`;
            }
        }
        return { letter: dayLetters[index], status, timeLabel, dateString: day.dateString };
    });
}

function generateWeekPatternHtml(employeeId, weekOffset = 0) {
    const pattern = getWeekPattern(employeeId, weekOffset);
    return `
        <div class="week-pattern-strip">
            ${pattern.map(day => `
                <div class="week-pattern-dot ${day.status}" title="${day.letter}${day.timeLabel ? ' ' + day.timeLabel : ''}">
                    <span>${day.letter}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function generateEmployeeCard(employee) {
    const weeklyHours = calculateWeeklyHours(employee.id);
    const monthlyHours = calculateMonthlyHours(employee.id);
    const weekSchedule = getThisWeekSchedule(employee.id);
    
    let positionDisplay = '';
    let positionClass = '';
    if (employee.position === '厨房区') {
        positionDisplay = currentLanguage === 'ja' ? '厨房' : '厨房';
        positionClass = 'kitchen';
    } else if (employee.position === '拉客') {
        positionDisplay = currentLanguage === 'ja' ? 'ラッカ' : '拉客';
        positionClass = 'rakka';
    } else {
        positionDisplay = currentLanguage === 'ja' ? 'フロント' : '前台';
        positionClass = 'front-desk';
    }
    
    return `
        <div class="employee-card" draggable="true" data-employee-id="${employee.id}">
            <div class="employee-card-top" onclick="showEmployeeDetail('${employee.id}')">
                <div class="employee-avatar">
                    ${employee.name.charAt(0)}
                </div>
                <div class="employee-info">
                    <div class="employee-name">${employee.name}</div>
                    <div class="employee-position ${positionClass}">
                        <i class="fas ${employee.position === '厨房区' ? 'fa-utensils' : employee.position === '拉客' ? 'fa-handshake' : 'fa-door-open'}"></i>
                        ${positionDisplay}
                    </div>
                    <div class="employee-stats">
                        <div class="stat-item">
                            <i class="fas fa-clock" style="color: var(--primary);"></i>
                            <span style="color: var(--gray-600);">
                                ${currentLanguage === 'ja' ? '今週:' : '本周:'}
                            </span>
                            <span class="stat-value">${weeklyHours}h</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-calendar-alt" style="color: var(--primary);"></i>
                            <span style="color: var(--gray-600);">
                                ${currentLanguage === 'ja' ? '今月:' : '本月:'}
                            </span>
                            <span class="stat-value">${monthlyHours}h</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-calendar-check" style="color: var(--primary);"></i>
                            <span style="color: var(--gray-600);">
                                ${weekSchedule.workDays} ${currentLanguage === 'ja' ? '勤務' : '班'}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="employee-arrow">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
            ${generateWeekPatternHtml(employee.id, 0)}
            <div class="employee-card-actions">
                <button type="button" class="card-action-btn" onclick="quickAddScheduleFor('${employee.id}')">
                    <i class="fas fa-calendar-plus"></i>
                    <span>${currentLanguage === 'ja' ? 'クイック登録' : '快速排班'}</span>
                </button>
                <button type="button" class="card-action-btn" onclick="copyScheduleAsText('${employee.id}')">
                    <i class="fas fa-copy"></i>
                    <span>${currentLanguage === 'ja' ? 'コピー' : '复制'}</span>
                </button>
                <button type="button" class="card-action-btn position-edit" onclick="editEmployeePosition('${employee.id}')">
                    <i class="fas fa-user-edit"></i>
                    <span>${currentLanguage === 'ja' ? '職種変更' : '更改职位'}</span>
                </button>
            </div>
        </div>
    `;
}

function searchEmployees() {
    renderEmployeeCards();
}

function filterEmployees(position) {
    currentPositionFilter = position;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const filterBtn = document.querySelector(`.filter-btn[data-position="${position}"]`);
    
    if (filterBtn) {
        filterBtn.classList.add('active');
    }
    
    renderEmployeeCards();
}

function showEmployeeDetail(employeeId) {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;
    
    selectedEmployee = employeeId;
    
    const modalEmployeeName = document.getElementById('modalEmployeeName');
    const modalEmployeePosition = document.getElementById('modalEmployeePosition');
    const modalWeekHours = document.getElementById('modalWeekHours');
    const modalMonthHours = document.getElementById('modalMonthHours');
    
    if (modalEmployeeName) modalEmployeeName.textContent = employee.name;
    if (modalEmployeePosition) {
        let posDisplay = '';
        if (employee.position === '厨房区') {
            posDisplay = currentLanguage === 'ja' ? '厨房' : '厨房';
        } else if (employee.position === '拉客') {
            posDisplay = currentLanguage === 'ja' ? 'ラッカ' : '拉客';
        } else {
            posDisplay = currentLanguage === 'ja' ? 'フロント' : '前台';
        }
        modalEmployeePosition.textContent = posDisplay;
    }
    
    const weeklyHours = calculateWeeklyHours(employeeId);
    const monthlyHours = calculateMonthlyHours(employeeId);
    
    if (modalWeekHours) modalWeekHours.textContent = `${weeklyHours} ${currentLanguage === 'ja' ? '時間' : '小时'}`;
    if (modalMonthHours) modalMonthHours.textContent = `${monthlyHours} ${currentLanguage === 'ja' ? '時間' : '小时'}`;
    
    showEmployeeWeekSchedule(employeeId);
    
    openModal('employeeModal');
}

function showEmployeeWeekSchedule(employeeId) {
    const container = document.getElementById('employeeWeekDays');
    if (!container) return;
    
    const { startDate } = getWeekDates(0);
    const weekSchedule = getEmployeeSchedulesForWeek(employeeId, startDate, 
        new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000));
    
    const days = generateWeekDays(startDate);
    
    const dayNames = currentLanguage === 'ja' 
        ? ['月', '火', '水', '木', '金', '土', '日']
        : ['一', '二', '三', '四', '五', '六', '日'];
    
    container.innerHTML = days.map((day, index) => {
        const schedule = weekSchedule.find(s => s.date === day.dateString);
        let status = 'none';
        let timeText = '';
        
        if (schedule) {
            status = schedule.isDayOff ? 'rest' : 'work';
            timeText = schedule.isDayOff ? `
                <div style="font-size: 11px; margin-top: 4px; font-weight: 600; color: var(--warning);">
                    ${currentLanguage === 'ja' ? '休み' : '休息'}
                </div>
            ` : `
                <div style="font-size: 11px; margin-top: 4px; font-weight: 600; color: var(--success);">
                    ${schedule.startTime.substring(0, 5)}-${schedule.endTime.substring(0, 5)}
                    ${getShiftTypeLabel(schedule.startTime) ? ` <span style="color: ${getShiftType(schedule.startTime) === '早班' ? '#1d4ed8' : '#b45309'}; font-weight:700;">${getShiftTypeLabel(schedule.startTime)}</span>` : ''}
                    <span style="color: ${(schedule.status || 'present') === 'early_leave' ? '#b91c1c' : '#065f46'}; font-weight:700; margin-left:4px;">${getStatusLabel(schedule.status || 'present')}</span>
                </div>
            `;
        }
        
        return `
            <div class="week-day ${status}">
                <div style="font-weight: 600; color: var(--gray-700);">${dayNames[index]}</div>
                <div style="font-size: 11px; color: var(--gray-500);">${day.date}</div>
                ${timeText}
            </div>
        `;
    }).join('');
}

function quickAddScheduleFor(employeeId) {
    switchView('schedule');
    setTimeout(() => {
        const select = document.getElementById('scheduleEmployee');
        if (select) select.value = employeeId;
        const dateInput = document.getElementById('scheduleDate');
        if (dateInput) dateInput.focus();
    }, 60);
}

function showAddEmployee() {
    const nameInput = document.getElementById('newEmployeeName');
    if (nameInput) {
        nameInput.value = '';
    }
    
    selectedPosition = '前台/服务区';
    document.querySelectorAll('.position-option').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const frontDeskBtn = document.querySelector('.position-option[data-position="前台/服务区"]');
    if (frontDeskBtn) {
        frontDeskBtn.classList.add('active');
    }
    
    openModal('addEmployeeModal');
}

function selectPosition(button) {
    selectedPosition = button.dataset.position;
    document.querySelectorAll('.position-option').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
}

function addEmployee() {
    const nameInput = document.getElementById('newEmployeeName');
    const name = nameInput ? nameInput.value.trim() : '';
    
    if (!name) {
        showMessage(currentLanguage === 'ja' ? '名前を入力してください' : '请输入员工姓名', 'warning');
        if (nameInput) nameInput.focus();
        return;
    }
    
    if (employees.some(e => e.name.toLowerCase() === name.toLowerCase())) {
        showMessage(currentLanguage === 'ja' ? `"${name}" は既に存在します` : `"${name}" 已存在`, 'warning');
        if (nameInput) nameInput.focus();
        return;
    }
    
    if (!window.database) {
        showMessage(currentLanguage === 'ja' ? "データベース接続エラー" : "数据库连接错误", "error");
        return;
    }
    
    window.database.ref('employees').push({
        name: name,
        position: selectedPosition,
        createdAt: Date.now()
    })
    .then(() => {
        closeModal('addEmployeeModal');
        showMessage(currentLanguage === 'ja' ? `スタッフ ${name} を追加しました` : `员工 ${name} 添加成功`, 'success');
        if (nameInput) nameInput.value = '';
    })
    .catch(error => {
        showMessage((currentLanguage === 'ja' ? '追加失敗: ' : '添加失败: ') + error.message, 'error');
    });
}

function deleteCurrentEmployee() {
    if (!selectedEmployee) return;
    
    const employee = employees.find(e => e.id === selectedEmployee);
    if (!employee) return;
    
    const confirmMessage = currentLanguage === 'ja' 
        ? `スタッフ "${employee.name}" を削除しますか？\nこのスタッフのすべてのスケジュールも削除されます！`
        : `确定要删除员工 "${employee.name}" 吗？\n该员工的所有排班记录也将被删除！`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    if (!window.database) {
        showMessage(currentLanguage === 'ja' ? "データベース接続エラー" : "数据库连接错误", "error");
        return;
    }
    
    window.database.ref(`employees/${selectedEmployee}`).remove()
    .then(() => {
        const schedulesRef = window.database.ref('schedules');
        schedulesRef.once('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                Object.keys(data).forEach(scheduleId => {
                    if (data[scheduleId].employeeId === selectedEmployee) {
                        window.database.ref(`schedules/${scheduleId}`).remove();
                    }
                });
            }
        });
        
        closeModal('employeeModal');
        showMessage(currentLanguage === 'ja' ? `スタッフ ${employee.name} を削除しました` : `员工 ${employee.name} 删除成功`, 'success');
        selectedEmployee = null;
    })
    .catch(error => {
        showMessage((currentLanguage === 'ja' ? '削除失敗: ' : '删除失败: ') + error.message, 'error');
    });
}

function updateAllEmployeeSelects() {
    updateScheduleEmployeeSelect();
    updateQuickWeekEmployeeSelect();
    updateRestDaysEmployeeSelect();
}

function updateScheduleEmployeeSelect() {
    const select = document.getElementById('scheduleEmployee');
    if (!select) return;
    
    select.innerHTML = `<option value="">${currentLanguage === 'ja' ? 'スタッフを選択' : '选择员工'}</option>`;
    
    employees.sort((a, b) => a.name.localeCompare(b.name)).forEach(emp => {
        let posDisplay = '';
        if (emp.position === '厨房区') {
            posDisplay = currentLanguage === 'ja' ? '厨房' : '厨房';
        } else if (emp.position === '拉客') {
            posDisplay = currentLanguage === 'ja' ? 'ラッカ' : '拉客';
        } else {
            posDisplay = currentLanguage === 'ja' ? 'フロント' : '前台';
        }
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = `${emp.name} (${posDisplay})`;
        select.appendChild(option);
    });
}

function updateQuickWeekEmployeeSelect() {
    const select = document.getElementById('quickWeekEmployee');
    if (!select) return;
    
    select.innerHTML = `<option value="">${currentLanguage === 'ja' ? 'スタッフを選択' : '选择员工'}</option>`;
    
    employees.sort((a, b) => a.name.localeCompare(b.name)).forEach(emp => {
        let posDisplay = '';
        if (emp.position === '厨房区') {
            posDisplay = currentLanguage === 'ja' ? '厨房' : '厨房';
        } else if (emp.position === '拉客') {
            posDisplay = currentLanguage === 'ja' ? 'ラッカ' : '拉客';
        } else {
            posDisplay = currentLanguage === 'ja' ? 'フロント' : '前台';
        }
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = `${emp.name} (${posDisplay})`;
        select.appendChild(option);
    });
}

function updateRestDaysEmployeeSelect() {
    const select = document.getElementById('restDaysEmployee');
    if (!select) return;
    
    select.innerHTML = `<option value="">${currentLanguage === 'ja' ? 'スタッフを選択' : '选择员工'}</option>`;
    
    employees.sort((a, b) => a.name.localeCompare(b.name)).forEach(emp => {
        let posDisplay = '';
        if (emp.position === '厨房区') {
            posDisplay = currentLanguage === 'ja' ? '厨房' : '厨房';
        } else if (emp.position === '拉客') {
            posDisplay = currentLanguage === 'ja' ? 'ラッカ' : '拉客';
        } else {
            posDisplay = currentLanguage === 'ja' ? 'フロント' : '前台';
        }
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = `${emp.name} (${posDisplay})`;
        select.appendChild(option);
    });
}
// ==================== SCHEDULE MANAGEMENT ====================
function loadSchedules() {
    if (!window.database) {
        console.error("Database not initialized");
        return;
    }
    
    const schedulesRef = window.database.ref('schedules');
    
    schedulesRef.on('value', (snapshot) => {
        schedules = snapshot.val() || {};
        renderWeeklySchedule();
        renderEmployeeCards();
    }, (error) => {
        console.error("Error loading schedules:", error);
        showMessage(`${currentLanguage === 'ja' ? 'スケジュールデータの読み込みエラー' : '加载排班数据错误'}: ${error.code || error.message || error}`, "error");
    });
}

function selectScheduleType(type) {
    const scope = document.getElementById('scheduleTypeSelector');
    if (!scope) return;
    scope.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const typeBtn = scope.querySelector(`.type-btn[data-type="${type}"]`);
    if (typeBtn) {
        typeBtn.classList.add('active');
    }
}

function setTimePreset(start, end) {
    const startInput = document.getElementById('scheduleStart');
    const endInput = document.getElementById('scheduleEnd');
    
    if (startInput) startInput.value = start;
    if (endInput) endInput.value = end;
    
    const hours = calculateShiftHours(start, end);
    const message = currentLanguage === 'ja' 
        ? `時間設定: ${start} - ${end} (${hours}時間)`
        : `时间设置: ${start} - ${end} (${hours}小时)`;
    showMessage(message, 'info');
}

function setQuickTimePreset(start, end) {
    const startInput = document.getElementById('quickWeekStart');
    const endInput = document.getElementById('quickWeekEnd');
    
    if (startInput) startInput.value = start;
    if (endInput) endInput.value = end;
    
    const hours = calculateShiftHours(start, end);
    const shiftType = getShiftType(start);
    const shiftLabel = shiftType === '早班' ? (currentLanguage === 'ja' ? '早班' : '早班') : (currentLanguage === 'ja' ? '晚班' : '晚班');
    const message = currentLanguage === 'ja' 
        ? `${shiftLabel}設定: ${start} - ${end} (${hours}時間)`
        : `${shiftLabel}设置: ${start} - ${end} (${hours}小时)`;
    showMessage(message, 'info');
}

function addSchedule() {
    const employeeId = document.getElementById('scheduleEmployee')?.value;
    const date = document.getElementById('scheduleDate')?.value;
    const startTime = document.getElementById('scheduleStart')?.value;
    const endTime = document.getElementById('scheduleEnd')?.value;
    const typeBtn = document.querySelector('#scheduleTypeSelector .type-btn.active');
    const type = typeBtn ? typeBtn.dataset.type : 'work';
    
    if (!employeeId) {
        showMessage(currentLanguage === 'ja' ? 'スタッフを選択してください' : '请选择员工', 'warning');
        return;
    }
    
    if (!date) {
        showMessage(currentLanguage === 'ja' ? '日付を選択してください' : '请选择日期', 'warning');
        return;
    }
    
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) {
        showMessage(currentLanguage === 'ja' ? 'スタッフが見つかりません' : '员工未找到', 'error');
        return;
    }
    
    if (type === 'work') {
        if (!startTime || !endTime) {
            showMessage(currentLanguage === 'ja' ? '勤務時間を入力してください' : '请输入工作时间', 'warning');
            return;
        }
        
        if (!validateTimeRange(startTime, endTime)) {
            return;
        }
    }
    
    const existingSchedule = findScheduleByEmployeeAndDate(employeeId, date);
    
    const scheduleData = {
        employeeId: employeeId,
        employeeName: employee.name,
        employeePosition: employee.position,
        date: date,
        isDayOff: type === 'rest',
        updatedAt: Date.now()
    };
    
    if (type === 'work') {
        scheduleData.startTime = startTime;
        scheduleData.endTime = endTime;
        scheduleData.status = 'present';
    } else {
        scheduleData.startTime = '00:00';
        scheduleData.endTime = '00:00';
        scheduleData.notes = currentLanguage === 'ja' ? '休み' : '休息';
        scheduleData.status = 'holiday';
    }
    
    if (!window.database) {
        showMessage(currentLanguage === 'ja' ? "データベース接続エラー" : "数据库连接错误", "error");
        return;
    }
    
    if (existingSchedule) {
        const scheduleId = existingSchedule.id;
        window.database.ref(`schedules/${scheduleId}`).update(scheduleData)
        .then(() => {
            resetScheduleForm();
            showMessage(currentLanguage === 'ja' ? 'スケジュールを更新しました' : '排班更新成功', 'success');
            renderWeeklySchedule();
        })
        .catch(error => {
            showMessage((currentLanguage === 'ja' ? '更新失敗: ' : '更新失败: ') + error.message, 'error');
        });
    } else {
        scheduleData.createdAt = Date.now();
        
        window.database.ref('schedules').push().set(scheduleData)
        .then(() => {
            resetScheduleForm();
            showMessage(currentLanguage === 'ja' ? 'スケジュールを追加しました' : '排班添加成功', 'success');
            renderWeeklySchedule();
        })
        .catch(error => {
            showMessage((currentLanguage === 'ja' ? '追加失敗: ' : '添加失败: ') + error.message, 'error');
        });
    }
}

function resetScheduleForm() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('scheduleDate');
    const startInput = document.getElementById('scheduleStart');
    const endInput = document.getElementById('scheduleEnd');
    
    if (dateInput) dateInput.value = today;
    if (startInput) startInput.value = '08:00';
    if (endInput) endInput.value = '17:00';
    
    selectScheduleType('work');
}

function findScheduleByEmployeeAndDate(employeeId, date) {
    if (!schedules || typeof schedules !== 'object') return null;
    
    const scheduleEntry = Object.entries(schedules).find(([id, schedule]) => 
        schedule && schedule.employeeId === employeeId && schedule.date === date
    );
    
    if (scheduleEntry) {
        return { id: scheduleEntry[0], ...scheduleEntry[1] };
    }
    return null;
}

// ==================== WEEKDAY SELECTOR ====================
function initWeekdaysSelector() {
    const today = new Date();
    const currentDay = today.getDay();
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
    const weekdays = [
        { id: 1, label: '月', default: true },
        { id: 2, label: '火', default: true },
        { id: 3, label: '水', default: true },
        { id: 4, label: '木', default: true },
        { id: 5, label: '金', default: true },
        { id: 6, label: '土', default: false },
        { id: 0, label: '日', default: false }
    ];
    
    const container = document.getElementById('weekdaysSelector');
    if (!container) return;
    
    let html = '';
    weekdays.forEach((day, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        
        const month = date.getMonth() + 1;
        const dayNum = date.getDate();
        
        html += `
            <button type="button" class="weekday-btn ${day.default ? 'active' : ''}" 
                    data-day="${day.id}" data-date="${date.toISOString().split('T')[0]}"
                    onclick="toggleWeekday(this)">
                <div style="font-weight: 600; font-size: 14px; color: var(--gray-700);">${day.label}</div>
                <div style="font-size: 12px; color: var(--gray-500); margin-top: 4px;">${month}/${dayNum}</div>
            </button>
        `;
    });
    
    container.innerHTML = html;
}

function toggleWeekday(button) {
    button.classList.toggle('active');
}

function setAllWeekdays() {
    const buttons = document.querySelectorAll('#weekdaysSelector .weekday-btn');
    if (buttons.length === 0) return;
    
    buttons.forEach(btn => {
        btn.classList.add('active');
        btn.classList.remove('rest');
    });
}

function clearWeekdays() {
    const buttons = document.querySelectorAll('#weekdaysSelector .weekday-btn');
    if (buttons.length === 0) return;
    
    buttons.forEach(btn => {
        btn.classList.remove('active', 'rest');
    });
}

// ==================== QUICK WEEK SCHEDULE ====================
function showQuickWeekModal() {
    const startInput = document.getElementById('quickWeekStart');
    const endInput = document.getElementById('quickWeekEnd');
    
    if (startInput) startInput.value = '08:00';
    if (endInput) endInput.value = '17:00';
    
    updateWeekdaysSelector();
    updateQuickWeekEmployeeSelect();
    openModal('quickWeekModal');
}

function updateWeekdaysSelector() {
    const today = new Date();
    const currentDay = today.getDay();
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
    const weekdays = [
        { id: 1, label: '月', default: true },
        { id: 2, label: '火', default: true },
        { id: 3, label: '水', default: true },
        { id: 4, label: '木', default: true },
        { id: 5, label: '金', default: true },
        { id: 6, label: '土', default: false },
        { id: 0, label: '日', default: false }
    ];
    
    const container = document.getElementById('weekdaysSelector');
    if (!container) return;
    
    const dayNames = currentLanguage === 'ja' 
        ? ['月', '火', '水', '木', '金', '土', '日']
        : ['一', '二', '三', '四', '五', '六', '日'];
    
    let html = '';
    weekdays.forEach((day, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        
        const month = date.getMonth() + 1;
        const dayNum = date.getDate();
        
        const dateString = date.toISOString().split('T')[0];
        const hasSchedule = checkExistingSchedule(dateString);
        
        html += `
            <button type="button" class="weekday-btn ${day.default ? 'active' : ''} ${hasSchedule === 'rest' ? 'rest' : ''}" 
                    data-day="${day.id}" data-date="${dateString}"
                    onclick="toggleWeekday(this)">
                <div style="font-weight: 600; font-size: 14px; color: ${hasSchedule === 'rest' ? 'var(--warning)' : 'var(--gray-700)'};">${dayNames[index]}</div>
                <div style="font-size: 12px; color: var(--gray-500); margin-top: 4px;">${month}/${dayNum}</div>
                ${hasSchedule ? `
                    <div style="font-size: 10px; margin-top: 2px; color: ${hasSchedule === 'rest' ? 'var(--warning)' : 'var(--success)'}; font-weight: 500;">
                        ${hasSchedule === 'rest' ? (currentLanguage === 'ja' ? '休' : '休') : (currentLanguage === 'ja' ? '予定' : '已排')}
                    </div>
                ` : ''}
            </button>
        `;
    });
    
    container.innerHTML = html;
}

function checkExistingSchedule(dateString) {
    if (!schedules || typeof schedules !== 'object') return '';
    
    const schedulesForDate = Object.values(schedules).filter(s => s && s.date === dateString);
    if (schedulesForDate.length > 0) {
        const employeeId = document.getElementById('quickWeekEmployee')?.value;
        if (employeeId) {
            const employeeSchedule = schedulesForDate.find(s => s.employeeId === employeeId);
            if (employeeSchedule) {
                return employeeSchedule.isDayOff ? 'rest' : 'work';
            }
        }
        return 'work';
    }
    return '';
}

function applyQuickWeekSchedule() {
    const employeeId = document.getElementById('quickWeekEmployee')?.value;
    const startTime = document.getElementById('quickWeekStart')?.value;
    const endTime = document.getElementById('quickWeekEnd')?.value;
    
    if (!employeeId) {
        showMessage(currentLanguage === 'ja' ? 'スタッフを選択してください' : '请选择员工', 'warning');
        return;
    }
    
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;
    
    const selectedDays = [];
    const selectedDates = [];
    const restDays = [];
    
    document.querySelectorAll('#weekdaysSelector .weekday-btn.active').forEach(btn => {
        const day = parseInt(btn.dataset.day);
        const dateString = btn.dataset.date;
        const isRestDay = btn.classList.contains('rest');
        
        selectedDays.push(day);
        selectedDates.push(dateString);
        
        if (isRestDay) {
            restDays.push(dateString);
        }
    });
    
    if (selectedDays.length === 0) {
        showMessage(currentLanguage === 'ja' ? '少なくとも1つの勤務日を選択してください' : '请至少选择一个工作日', 'warning');
        return;
    }
    
    if (!window.database) {
        showMessage(currentLanguage === 'ja' ? "データベース接続エラー" : "数据库连接错误", "error");
        return;
    }
    
    const promises = [];
    
    selectedDates.forEach(dateString => {
        const isRestDay = restDays.includes(dateString);
        
        const scheduleData = {
            employeeId: employeeId,
            employeeName: employee.name,
            employeePosition: employee.position,
            date: dateString,
            isDayOff: isRestDay,
            updatedAt: Date.now()
        };
        
        if (!isRestDay) {
            if (!startTime || !endTime) {
                showMessage(currentLanguage === 'ja' ? '勤務時間を入力してください' : '请输入工作时间', 'warning');
                return;
            }
            
            if (!validateTimeRange(startTime, endTime)) {
                return;
            }
            
            scheduleData.startTime = startTime;
            scheduleData.endTime = endTime;
            scheduleData.status = 'present';
        } else {
            scheduleData.startTime = '00:00';
            scheduleData.endTime = '00:00';
            scheduleData.notes = currentLanguage === 'ja' ? '休み' : '休息';
            scheduleData.status = 'holiday';
        }
        
        const existingSchedule = findScheduleByEmployeeAndDate(employeeId, dateString);
        
        if (existingSchedule) {
            promises.push(
                window.database.ref(`schedules/${existingSchedule.id}`).update(scheduleData)
            );
        } else {
            scheduleData.createdAt = Date.now();
            promises.push(
                window.database.ref('schedules').push().set(scheduleData)
            );
        }
    });
    
    Promise.all(promises)
    .then(() => {
        closeModal('quickWeekModal');
        const workDays = selectedDays.length - restDays.length;
        const message = currentLanguage === 'ja' 
            ? `${workDays}勤務日、${restDays.length}休日を設定しました`
            : `设置${workDays}个工作日，${restDays.length}个休息日`;
        showMessage(message, 'success');
        renderWeeklySchedule();
    })
    .catch(error => {
        showMessage((currentLanguage === 'ja' ? '設定失敗: ' : '设置失败: ') + error.message, 'error');
    });
}

// ==================== REST DAYS MANAGEMENT ====================
function showSetRestDaysModal() {
    updateRestDaysSelector();
    updateRestDaysEmployeeSelect();
    openModal('setRestDaysModal');
}

function updateRestDaysSelector() {
    const today = new Date();
    const currentDay = today.getDay();
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
    const weekdays = [
        { id: 1, label: 'Mon', default: false },
        { id: 2, label: 'Tue', default: false },
        { id: 3, label: 'Wed', default: false },
        { id: 4, label: 'Thu', default: false },
        { id: 5, label: 'Fri', default: false },
        { id: 6, label: 'Sat', default: false },
        { id: 0, label: 'Sun', default: false }
    ];
    
    const container = document.getElementById('restDaysSelector');
    if (!container) return;
    
    const dayNames = currentLanguage === 'ja' 
        ? ['月', '火', '水', '木', '金', '土', '日']
        : ['一', '二', '三', '四', '五', '六', '日'];
    
    let html = '';
    weekdays.forEach((day, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        
        const month = date.getMonth() + 1;
        const dayNum = date.getDate();
        
        html += `
            <button type="button" class="weekday-btn" 
                    data-day="${day.id}" data-date="${date.toISOString().split('T')[0]}"
                    onclick="toggleRestDay(this)">
                <div style="font-weight: 600; font-size: 14px; color: var(--gray-700);">${dayNames[index]}</div>
                <div style="font-size: 12px; color: var(--gray-500); margin-top: 4px;">${month}/${dayNum}</div>
            </button>
        `;
    });
    
    container.innerHTML = html;
}

function toggleRestDay(button) {
    button.classList.toggle('active');
    button.classList.toggle('rest');
}

function clearRestDays() {
    document.querySelectorAll('#restDaysSelector .weekday-btn').forEach(btn => {
        btn.classList.remove('active', 'rest');
    });
}

function applyRestDays() {
    const employeeId = document.getElementById('restDaysEmployee')?.value;
    
    if (!employeeId) {
        showMessage(currentLanguage === 'ja' ? 'スタッフを選択してください' : '请选择员工', 'warning');
        return;
    }
    
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;
    
    const selectedDates = [];
    
    document.querySelectorAll('#restDaysSelector .weekday-btn.active').forEach(btn => {
        selectedDates.push(btn.dataset.date);
    });
    
    if (selectedDates.length === 0) {
        showMessage(currentLanguage === 'ja' ? '少なくとも1つの休日を選択してください' : '请至少选择一个休息日', 'warning');
        return;
    }
    
    if (!window.database) {
        showMessage(currentLanguage === 'ja' ? "データベース接続エラー" : "数据库连接错误", "error");
        return;
    }
    
    const promises = [];
    
    selectedDates.forEach(dateString => {
        const scheduleData = {
            employeeId: employeeId,
            employeeName: employee.name,
            employeePosition: employee.position,
            date: dateString,
            isDayOff: true,
            startTime: '00:00',
            endTime: '00:00',
            notes: currentLanguage === 'ja' ? '休み' : '休息',
            status: 'holiday',
            updatedAt: Date.now()
        };
        
        const existingSchedule = findScheduleByEmployeeAndDate(employeeId, dateString);
        
        if (existingSchedule) {
            promises.push(
                window.database.ref(`schedules/${existingSchedule.id}`).update(scheduleData)
            );
        } else {
            scheduleData.createdAt = Date.now();
            promises.push(
                window.database.ref('schedules').push().set(scheduleData)
            );
        }
    });
    
    Promise.all(promises)
    .then(() => {
        closeModal('setRestDaysModal');
        const message = currentLanguage === 'ja' 
            ? `${selectedDates.length}休日を設定しました`
            : `设置${selectedDates.length}个休息日`;
        showMessage(message, 'success');
        renderWeeklySchedule();
    })
    .catch(error => {
        showMessage((currentLanguage === 'ja' ? '設定失敗: ' : '设置失败: ') + error.message, 'error');
    });
}
// ==================== WEEKLY VIEW ====================
function buildWeeklyRowHtml(employee, days, schedulesByEmployee) {
    const employeeSchedules = schedulesByEmployee[employee.id] || {};
    const weeklyHours = calculateWeeklyHours(employee.id);
    
    let positionDisplay = '';
    if (employee.position === '厨房区') {
        positionDisplay = currentLanguage === 'ja' ? '厨房' : '厨房';
    } else if (employee.position === '拉客') {
        positionDisplay = currentLanguage === 'ja' ? 'ラッカ' : '拉客';
    } else {
        positionDisplay = currentLanguage === 'ja' ? 'フロント' : '前台';
    }
    
    return `
        <div class="week-row">
            <div class="week-cell">
                <div style="font-weight: 700; font-size: 0.85rem; color: var(--dark); margin-bottom: 3px;">${employee.name}</div>
                <div style="font-size: 0.75rem; color: var(--gray-500); margin-bottom: 4px;">${positionDisplay}</div>
                <div class="week-cell-hours" style="font-size: 0.7rem; color: var(--primary); font-weight: 600;">
                    <i class="fas fa-clock" style="font-size: 0.65rem; margin-right: 3px;"></i>
                    ${weeklyHours}h
                </div>
            </div>
            ${days.map(day => {
                const schedule = employeeSchedules[day.dateString];
                let scheduleClass = 'empty';
                let scheduleText = '';
                
                if (schedule) {
                    if (schedule.isDayOff) {
                        scheduleClass = 'rest';
                        scheduleText = currentLanguage === 'ja' ? '休' : '休';
                    } else {
                        scheduleClass = 'work';
                        const shiftType = getShiftTypeLabel(schedule.startTime);
                        const shiftClass = getShiftTypeClass(schedule.startTime);
                        const statusLabel = getStatusLabel(schedule.status || 'present');
                        const statusClass = getStatusClass(schedule.status || 'present');
                        const timeStr = `${schedule.startTime ? schedule.startTime.substring(0,5) : ''}-${schedule.endTime ? schedule.endTime.substring(0,5) : ''}`;
                        scheduleText = `
                            <div class="compact-time">
                                <span style="font-weight:700; font-size:0.9rem;">${timeStr}</span>
                                ${shiftType ? `<span class="shift-badge ${shiftClass}">${shiftType}</span>` : ''}
                                <span class="status-badge ${statusClass}">${statusLabel}</span>
                            </div>
                        `;
                    }
                }
                
                const title = schedule ? (schedule.isDayOff ? 
                    (currentLanguage === 'ja' ? '休み' : '休息') : 
                    `${schedule.startTime || ''}-${schedule.endTime || ''}`) : 
                    (currentLanguage === 'ja' ? 'クリックで追加' : '点击添加');
                
                return `
                    <div class="week-cell">
                        <div class="day-schedule-item ${scheduleClass}" 
                             onclick="editDaySchedule('${employee.id}', '${day.dateString}')"
                             title="${title}">
                            ${scheduleText || (currentLanguage === 'ja' ? '追加' : '加')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderWeeklySchedule() {
    const container = document.getElementById('weeklySchedule');
    if (!container) return;
    
    const { startDate, endDate } = getWeekDates(currentWeek);
    const weekSchedule = getWeekSchedules(startDate, endDate);
    const days = generateWeekDays(startDate);
    
    const schedulesByEmployee = {};
    weekSchedule.forEach(schedule => {
        if (schedule && schedule.employeeId) {
            if (!schedulesByEmployee[schedule.employeeId]) {
                schedulesByEmployee[schedule.employeeId] = {};
            }
            schedulesByEmployee[schedule.employeeId][schedule.date] = schedule;
        }
    });
    
    const dayNames = currentLanguage === 'ja' 
        ? ['月', '火', '水', '木', '金', '土', '日']
        : ['一', '二', '三', '四', '五', '六', '日'];
    
    const todayString = new Date().toISOString().split('T')[0];
    
    let html = `
        <div class="week-header">
            <div class="week-header-cell">${currentLanguage === 'ja' ? 'スタッフ' : '员工'}</div>
            ${days.map((day, index) => {
                const date = new Date(day.dateString);
                const month = date.getMonth() + 1;
                const dayNum = date.getDate();
                const headcount = getDayHeadcount(day.dateString);
                const isToday = day.dateString === todayString;
                return `
                    <div class="week-header-cell ${isToday ? 'today' : ''}">
                        <div class="week-header-day">${dayNames[index]}</div>
                        <div class="week-header-date">${month}/${dayNum}</div>
                        <div class="week-header-count" title="${currentLanguage === 'ja' ? 'フロント / 厨房 / ラッカ 出勤人数' : '前台 / 厨房 / 拉客 出勤人数'}">
                            ${headcount.front > 0 ? `<span class="count-pill front">${headcount.front}</span>` : ''}
                            ${headcount.kitchen > 0 ? `<span class="count-pill kitchen">${headcount.kitchen}</span>` : ''}
                            ${headcount.rakka > 0 ? `<span class="count-pill rakka">${headcount.rakka}</span>` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    const frontDeskEmployees = employees.filter(e => e.position === '前台/服务区');
    const kitchenEmployees = employees.filter(e => e.position === '厨房区');
    const rakkaEmployees = employees.filter(e => e.position === '拉客');
    
    if (frontDeskEmployees.length > 0) {
        const title = currentLanguage === 'ja' ? 'フロント / サービス' : '前台 / 服务';
        html += `
            <div class="week-position-header front-desk">
                <div class="week-position-header-label">
                    <i class="fas fa-door-open"></i> ${title}
                    <span class="week-position-count">${frontDeskEmployees.length}</span>
                </div>
            </div>
        `;
        frontDeskEmployees.forEach(employee => {
            html += buildWeeklyRowHtml(employee, days, schedulesByEmployee);
        });
    }
    
    if (kitchenEmployees.length > 0) {
        const title = currentLanguage === 'ja' ? '厨房' : '厨房';
        html += `
            <div class="week-position-header kitchen">
                <div class="week-position-header-label">
                    <i class="fas fa-utensils"></i> ${title}
                    <span class="week-position-count">${kitchenEmployees.length}</span>
                </div>
            </div>
        `;
        kitchenEmployees.forEach(employee => {
            html += buildWeeklyRowHtml(employee, days, schedulesByEmployee);
        });
    }
    
    if (rakkaEmployees.length > 0) {
        const title = currentLanguage === 'ja' ? 'ラッカ' : '拉客';
        html += `
            <div class="week-position-header rakka">
                <div class="week-position-header-label">
                    <i class="fas fa-handshake"></i> ${title}
                    <span class="week-position-count">${rakkaEmployees.length}</span>
                </div>
            </div>
        `;
        rakkaEmployees.forEach(employee => {
            html += buildWeeklyRowHtml(employee, days, schedulesByEmployee);
        });
    }
    
    if (employees.length === 0) {
        html = `<div class="empty-state"><p>${currentLanguage === 'ja' ? 'スケジュールデータがありません' : '没有排班数据'}</p></div>`;
    }
    
    container.innerHTML = html;
    
    const weekRange = document.getElementById('weekRange');
    if (weekRange) {
        const startStr = formatDate(startDate);
        const endStr = formatDate(endDate);
        weekRange.textContent = `${startStr} - ${endStr}`;
    }
}

function changeWeek(direction) {
    currentWeek += direction;
    renderWeeklySchedule();
}

function editDaySchedule(employeeId, date) {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;
    
    const schedule = findScheduleByEmployeeAndDate(employeeId, date);
    
    const container = document.getElementById('editScheduleContent');
    if (!container) return;
    
    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString(currentLanguage === 'ja' ? 'ja-JP' : 'zh-CN', { weekday: 'long' });
    
    container.innerHTML = `
        <div class="edit-schedule-form">
            <div class="form-group">
                <label>${currentLanguage === 'ja' ? 'スタッフ' : '员工'}</label>
                <div class="employee-display">
                    <div class="employee-avatar-small">${employee.name.charAt(0)}</div>
                    <div>
                        <div style="font-weight: 700; color: var(--dark);">${employee.name}</div>
                        <div style="font-size: 14px; color: var(--gray-500);">
                            ${currentLanguage === 'ja' ? 
                                (employee.position === '厨房区' ? '厨房' : employee.position === '拉客' ? 'ラッカ' : 'フロント') : 
                                (employee.position === '厨房区' ? '厨房' : employee.position === '拉客' ? '拉客' : '前台')}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label>${currentLanguage === 'ja' ? '日付' : '日期'}</label>
                <div class="date-display">
                    <div style="font-weight: 700; color: var(--dark);">${formatDate(date)}</div>
                    <div style="font-size: 14px; color: var(--gray-500);">${dayName}</div>
                </div>
            </div>
            
            <div class="form-group">
                <label>${currentLanguage === 'ja' ? '種類' : '类型'}</label>
                <div class="type-selector" id="editTypeSelector">
                    <button type="button" class="type-btn ${!schedule || !schedule.isDayOff ? 'active' : ''}" data-type="work"
                            onclick="setEditScheduleType('work')">
                        <i class="fas fa-briefcase"></i>
                        <span>${currentLanguage === 'ja' ? '勤務' : '工作'}</span>
                    </button>
                    <button type="button" class="type-btn ${schedule && schedule.isDayOff ? 'active' : ''}" data-type="rest"
                            onclick="setEditScheduleType('rest')">
                        <i class="fas fa-umbrella-beach"></i>
                        <span>${currentLanguage === 'ja' ? '休み' : '休息'}</span>
                    </button>
                </div>
            </div>
            
            <div class="time-group" id="editTimeGroup" style="display: ${!schedule || !schedule.isDayOff ? 'grid' : 'none'}">
                <div class="form-group">
                    <label>${currentLanguage === 'ja' ? '開始時間' : '开始时间'}</label>
                    <input type="time" id="editStartTime" class="input-field" 
                           value="${schedule && !schedule.isDayOff && schedule.startTime ? schedule.startTime : '08:00'}">
                </div>
                <div class="form-group">
                    <label>${currentLanguage === 'ja' ? '終了時間' : '结束时间'}</label>
                    <input type="time" id="editEndTime" class="input-field" 
                           value="${schedule && !schedule.isDayOff && schedule.endTime ? schedule.endTime : '17:00'}">
                </div>
            </div>
            
            <div class="action-buttons">
                <button type="button" class="btn-primary" onclick="saveDaySchedule('${employeeId}', '${date}')">
                    <i class="fas fa-save"></i> ${currentLanguage === 'ja' ? '保存' : '保存'}
                </button>
                ${schedule ? `
                    <button type="button" class="btn-danger" onclick="deleteDaySchedule('${employeeId}', '${date}')">
                        <i class="fas fa-trash"></i> ${currentLanguage === 'ja' ? '削除' : '删除'}
                    </button>
                ` : ''}
                <button type="button" class="btn-secondary" onclick="closeModal('editModal')">
                    ${currentLanguage === 'ja' ? 'キャンセル' : '取消'}
                </button>
            </div>
        </div>
    `;
    
    openModal('editModal');
}

function editEmployeeSchedule() {
    if (!selectedEmployee) return;
    
    switchView('weekly');
    closeModal('employeeModal');
    
    setTimeout(() => {
        const employee = employees.find(e => e.id === selectedEmployee);
        if (!employee) return;
        
        const employeeRows = document.querySelectorAll('.week-row');
        employeeRows.forEach(row => {
            const nameCell = row.querySelector('.week-cell:first-child');
            if (nameCell && nameCell.textContent.includes(employee.name)) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                row.style.background = 'var(--primary-light)';
                setTimeout(() => {
                    row.style.background = '';
                }, 3000);
            }
        });
    }, 300);
}

function setEditScheduleType(type) {
    const timeGroup = document.getElementById('editTimeGroup');
    const scope = document.getElementById('editTypeSelector');
    if (!scope) return;
    
    const workBtn = scope.querySelector('.type-btn[data-type="work"]');
    const restBtn = scope.querySelector('.type-btn[data-type="rest"]');
    
    if (!workBtn || !restBtn) return;
    
    if (type === 'work') {
        workBtn.classList.add('active');
        restBtn.classList.remove('active');
        if (timeGroup) timeGroup.style.display = 'grid';
    } else {
        restBtn.classList.add('active');
        workBtn.classList.remove('active');
        if (timeGroup) timeGroup.style.display = 'none';
    }
}

function saveDaySchedule(employeeId, date) {
    const typeBtn = document.querySelector('#editTypeSelector .type-btn.active');
    const type = typeBtn ? typeBtn.dataset.type : 'work';
    const employee = employees.find(e => e.id === employeeId);
    
    if (!employee) return;
    
    const scheduleData = {
        employeeId: employeeId,
        employeeName: employee.name,
        employeePosition: employee.position,
        date: date,
        isDayOff: type === 'rest',
        updatedAt: Date.now()
    };
    
    if (type === 'work') {
        const startTime = document.getElementById('editStartTime')?.value;
        const endTime = document.getElementById('editEndTime')?.value;
        
        if (!startTime || !endTime) {
            showMessage(currentLanguage === 'ja' ? '勤務時間を入力してください' : '请输入工作时间', 'warning');
            return;
        }
        
        if (!validateTimeRange(startTime, endTime)) {
            return;
        }
        
        scheduleData.startTime = startTime;
        scheduleData.endTime = endTime;
        scheduleData.status = 'present';
    } else {
        scheduleData.startTime = '00:00';
        scheduleData.endTime = '00:00';
        scheduleData.notes = currentLanguage === 'ja' ? '休み' : '休息';
        scheduleData.status = 'holiday';
    }
    
    if (!window.database) {
        showMessage(currentLanguage === 'ja' ? "データベース接続エラー" : "数据库连接错误", "error");
        return;
    }
    
    const existingSchedule = findScheduleByEmployeeAndDate(employeeId, date);
    
    if (existingSchedule) {
        window.database.ref(`schedules/${existingSchedule.id}`).update(scheduleData)
        .then(() => {
            closeModal('editModal');
            showMessage(currentLanguage === 'ja' ? 'スケジュールを更新しました' : '排班更新成功', 'success');
            renderWeeklySchedule();
        })
        .catch(error => {
            showMessage((currentLanguage === 'ja' ? '更新失敗: ' : '更新失败: ') + error.message, 'error');
        });
    } else {
        scheduleData.createdAt = Date.now();
        
        window.database.ref('schedules').push().set(scheduleData)
        .then(() => {
            closeModal('editModal');
            showMessage(currentLanguage === 'ja' ? 'スケジュールを追加しました' : '排班添加成功', 'success');
            renderWeeklySchedule();
        })
        .catch(error => {
            showMessage((currentLanguage === 'ja' ? '追加失敗: ' : '添加失败: ') + error.message, 'error');
        });
    }
}

function deleteDaySchedule(employeeId, date) {
    const confirmMessage = currentLanguage === 'ja' 
        ? 'このスケジュールを削除しますか？'
        : '确定要删除这个排班吗？';
    
    if (!confirm(confirmMessage)) return;
    
    const schedule = findScheduleByEmployeeAndDate(employeeId, date);
    if (!schedule) return;
    
    if (!window.database) {
        showMessage(currentLanguage === 'ja' ? "データベース接続エラー" : "数据库连接错误", "error");
        return;
    }
    
    window.database.ref(`schedules/${schedule.id}`).remove()
    .then(() => {
        closeModal('editModal');
        showMessage(currentLanguage === 'ja' ? 'スケジュールを削除しました' : '排班删除成功', 'success');
        renderWeeklySchedule();
    })
    .catch(error => {
        showMessage((currentLanguage === 'ja' ? '削除失敗: ' : '删除失败: ') + error.message, 'error');
    });
}

// ==================== UTILITY FUNCTIONS ====================
function getWeekDates(weekOffset = 0) {
    const today = new Date();
    const currentDay = today.getDay();
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    monday.setDate(monday.getDate() + (weekOffset * 7));
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return {
        startDate: monday,
        endDate: sunday,
        startString: monday.toISOString().split('T')[0],
        endString: sunday.toISOString().split('T')[0]
    };
}

function generateWeekDays(startDate) {
    const days = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        days.push({
            name: dayNames[i],
            date: `${date.getMonth() + 1}/${date.getDate()}`,
            dateString: date.toISOString().split('T')[0],
            dayIndex: i
        });
    }
    
    return days;
}

function getWeekSchedules(startDate, endDate) {
    const weekSchedules = [];
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    if (!schedules || typeof schedules !== 'object') return weekSchedules;
    
    Object.values(schedules).forEach(schedule => {
        if (schedule && schedule.date >= startStr && schedule.date <= endStr) {
            weekSchedules.push(schedule);
        }
    });
    
    return weekSchedules;
}

function getEmployeeSchedulesForWeek(employeeId, startDate, endDate) {
    const employeeSchedules = [];
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    if (!schedules || typeof schedules !== 'object') return employeeSchedules;
    
    Object.values(schedules).forEach(schedule => {
        if (schedule && schedule.employeeId === employeeId && 
            schedule.date >= startStr && 
            schedule.date <= endStr) {
            employeeSchedules.push(schedule);
        }
    });
    
    return employeeSchedules;
}

function calculateWeeklyHours(employeeId) {
    const { startDate, endDate } = getWeekDates(currentWeek);
    const weekSchedules = getEmployeeSchedulesForWeek(employeeId, startDate, endDate);
    
    let totalHours = 0;
    weekSchedules.forEach(schedule => {
        if (!schedule.isDayOff && schedule.startTime && schedule.endTime) {
            totalHours += calculateShiftHours(schedule.startTime, schedule.endTime);
        }
    });
    
    return roundHours(totalHours, 1);
}

function calculateMonthlyHours(employeeId) {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const firstStr = firstDay.toISOString().split('T')[0];
    const lastStr = lastDay.toISOString().split('T')[0];
    
    let totalHours = 0;
    
    if (!schedules || typeof schedules !== 'object') return totalHours;
    
    Object.values(schedules).forEach(schedule => {
        if (schedule && schedule.employeeId === employeeId && 
            schedule.date >= firstStr && 
            schedule.date <= lastStr &&
            !schedule.isDayOff) {
            totalHours += calculateShiftHours(schedule.startTime, schedule.endTime);
        }
    });
    
    return roundHours(totalHours, 1);
}

function getThisWeekSchedule(employeeId) {
    const { startDate } = getWeekDates(0);
    const weekSchedule = getEmployeeSchedulesForWeek(employeeId, startDate, 
        new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000));
    
    const workDays = weekSchedule.filter(s => !s.isDayOff).length;
    const restDays = weekSchedule.filter(s => s.isDayOff).length;
    
    return {
        workDays: workDays,
        restDays: restDays,
        totalShifts: weekSchedule.length
    };
}

function formatDate(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
}

function refreshData() {
    if (!window.database) {
        showMessage(currentLanguage === 'ja' ? "データベース接続エラー" : "数据库连接错误", "error");
        return;
    }
    
    window.database.ref('.info/connected').once('value').then(snap => {
        if (snap.val() === true) {
            showMessage(currentLanguage === 'ja' ? 'データ同期完了' : '数据同步完成', 'success');
            loadEmployees();
            loadSchedules();
        } else {
            showMessage(currentLanguage === 'ja' ? 'サーバーに接続できません' : '无法连接服务器', 'error');
        }
    }).catch(error => {
        showMessage(currentLanguage === 'ja' ? '更新エラー: ' : '刷新错误: ' + error.message, 'error');
    });
}
// ==================== COPY TEXT FUNCTION ====================
function copyScheduleAsText(employeeIdParam) {
    const employeeId = employeeIdParam || selectedEmployee;
    
    if (!employeeId) {
        showMessage(currentLanguage === 'ja' ? 'スタッフを選択してください' : '请先选择员工', 'warning');
        return;
    }
    
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;
    
    const { startDate, endDate } = getWeekDates(currentWeek);
    const weekSchedule = getEmployeeSchedulesForWeek(employeeId, startDate, endDate);
    const weeklyHours = calculateWeeklyHours(employeeId);
    const monthlyHours = calculateMonthlyHours(employeeId);
    const days = generateWeekDays(startDate);
    
    let text = `【${employee.name} ${currentLanguage === 'ja' ? 'スケジュール' : '排班表'}】\n`;
    let posDisplay = '';
    if (employee.position === '厨房区') {
        posDisplay = currentLanguage === 'ja' ? '厨房' : '厨房';
    } else if (employee.position === '拉客') {
        posDisplay = currentLanguage === 'ja' ? 'ラッカ' : '拉客';
    } else {
        posDisplay = currentLanguage === 'ja' ? 'フロント' : '前台';
    }
    text += `${currentLanguage === 'ja' ? '職種:' : '职位:'} ${posDisplay}\n`;
    text += `${currentLanguage === 'ja' ? '日付:' : '日期:'} ${formatDate(startDate)} ${currentLanguage === 'ja' ? '〜' : '至'} ${formatDate(endDate)}\n`;
    text += `${currentLanguage === 'ja' ? '今週:' : '本周:'} ${weeklyHours}${currentLanguage === 'ja' ? '時間' : '小时'} | ${currentLanguage === 'ja' ? '今月:' : '本月:'} ${monthlyHours}${currentLanguage === 'ja' ? '時間' : '小时'}\n\n`;
    text += `📅 ${currentLanguage === 'ja' ? '今週のスケジュール:' : '本周排班:'}\n`;
    
    const dayNames = currentLanguage === 'ja' 
        ? ['月', '火', '水', '木', '金', '土', '日']
        : ['一', '二', '三', '四', '五', '六', '日'];
    
    days.forEach((day, index) => {
        const schedule = weekSchedule.find(s => s.date === day.dateString);
        let scheduleText = '';
        if (schedule) {
            if (schedule.isDayOff) {
                scheduleText = '🏖️ ' + (currentLanguage === 'ja' ? '休み' : '休息');
            } else {
                const shiftType = getShiftTypeLabel(schedule.startTime);
                const statusLabel = getStatusLabel(schedule.status || 'present');
                scheduleText = `🕐 ${schedule.startTime ? schedule.startTime.substring(0,5) : ''}-${schedule.endTime ? schedule.endTime.substring(0,5) : ''}`;
                if (shiftType) scheduleText += ` [${shiftType}]`;
                if (statusLabel) scheduleText += ` (${statusLabel})`;
            }
        } else {
            scheduleText = '📭 ' + (currentLanguage === 'ja' ? 'なし' : '无');
        }
        text += `${dayNames[index]} (${day.date}): ${scheduleText}\n`;
    });
    
    text += `\n📍 ${currentLanguage === 'ja' ? '勤務エリア:' : '工作区域:'} ${posDisplay}\n`;
    text += `📊 ${currentLanguage === 'ja' ? '今週:' : '本周:'} ${weekSchedule.filter(s => !s.isDayOff).length}${currentLanguage === 'ja' ? '勤務日' : '工作日'}, ${weekSchedule.filter(s => s.isDayOff).length}${currentLanguage === 'ja' ? '休日' : '休息日'}\n`;
    text += `\n⏰ ${currentLanguage === 'ja' ? '生成日時:' : '生成时间:'} ${new Date().toLocaleString(currentLanguage === 'ja' ? 'ja-JP' : 'zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })}`;
    
    navigator.clipboard.writeText(text)
        .then(() => {
            showMessage(currentLanguage === 'ja' ? 'クリップボードにコピーしました' : '已复制到剪贴板', 'success');
            const modal = document.getElementById('employeeModal');
            if (modal && modal.style.display === 'flex') closeModal('employeeModal');
        })
        .catch(err => {
            console.error('Copy failed:', err);
            
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                showMessage(currentLanguage === 'ja' ? 'クリップボードにコピーしました' : '已复制到剪贴板', 'success');
            } catch (err) {
                showMessage(currentLanguage === 'ja' ? 'コピーに失敗しました' : '复制失败', 'error');
            }
            document.body.removeChild(textarea);
            
            const modal2 = document.getElementById('employeeModal');
            if (modal2 && modal2.style.display === 'flex') closeModal('employeeModal');
        });
}

// ==================== PRINT SYSTEM ====================
function setPrintPageSize(size) {
    let styleTag = document.getElementById('dynamicPrintPageStyle');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamicPrintPageStyle';
        document.head.appendChild(styleTag);
    }
    styleTag.textContent = `@page { size: ${size}; margin: 12mm; }`;
}

function triggerPrint() {
    document.body.classList.add('is-printing');
    setTimeout(() => {
        window.print();
    }, 60);
}

function endPrintMode() {
    document.body.classList.remove('is-printing');
}

window.addEventListener('afterprint', endPrintMode);

function buildPrintDayRow(day, schedule, dayNames) {
    let statusClass = 'none';
    let statusText = currentLanguage === 'ja' ? 'なし' : '无';
    let timeDisplay = '—';
    let hoursDisplay = '';

    if (schedule) {
        if (schedule.isDayOff) {
            statusClass = 'rest';
            statusText = currentLanguage === 'ja' ? '休み' : '休息';
        } else {
            statusClass = 'work';
            statusText = currentLanguage === 'ja' ? '勤務' : '工作';
            const start = schedule.startTime ? schedule.startTime.substring(0, 5) : '';
            const end = schedule.endTime ? schedule.endTime.substring(0, 5) : '';
            timeDisplay = `${start} - ${end}`;
            hoursDisplay = `${calculateShiftHours(schedule.startTime, schedule.endTime)}h`;
            const shiftType = getShiftTypeLabel(schedule.startTime);
            if (shiftType) timeDisplay += ` ${shiftType}`;
            const statusLabel = getStatusLabel(schedule.status || 'present');
            if (statusLabel) timeDisplay += ` ${statusLabel}`;
        }
    }

    return `
        <div class="print-day-row ${statusClass}">
            <div class="print-day-date">
                <div class="print-day-name">${dayNames[day.dayIndex]}</div>
                <div class="print-day-num">${day.date}</div>
            </div>
            <div class="print-day-status">${statusText}</div>
            <div class="print-day-time">${timeDisplay}</div>
            <div class="print-day-hours">${hoursDisplay}</div>
        </div>
    `;
}

function printEmployeeSchedule() {
    if (!selectedEmployee) {
        showMessage(currentLanguage === 'ja' ? 'スタッフを選択してください' : '请先选择员工', 'warning');
        return;
    }

    const employee = employees.find(e => e.id === selectedEmployee);
    if (!employee) return;

    const { startDate, endDate } = getWeekDates(currentWeek);
    const weekSchedule = getEmployeeSchedulesForWeek(selectedEmployee, startDate, endDate);
    const weeklyHours = calculateWeeklyHours(selectedEmployee);
    const monthlyHours = calculateMonthlyHours(selectedEmployee);
    const days = generateWeekDays(startDate);

    let posDisplay = '';
    if (employee.position === '厨房区') {
        posDisplay = currentLanguage === 'ja' ? '厨房' : '厨房';
    } else if (employee.position === '拉客') {
        posDisplay = currentLanguage === 'ja' ? 'ラッカ' : '拉客';
    } else {
        posDisplay = currentLanguage === 'ja' ? 'フロント' : '前台';
    }

    const dayNames = currentLanguage === 'ja'
        ? ['月', '火', '水', '木', '金', '土', '日']
        : ['一', '二', '三', '四', '五', '六', '日'];

    const workDaysCount = weekSchedule.filter(s => !s.isDayOff).length;
    const restDaysCount = weekSchedule.filter(s => s.isDayOff).length;

    const html = `
        <div class="print-sheet">
            <div class="print-sheet-header">
                <div class="print-company">鍛治町酒場 神田店</div>
                <div class="print-employee-name">${employee.name}</div>
                <div class="print-sub">${posDisplay} ・ ${formatDate(startDate)} - ${formatDate(endDate)}</div>
            </div>

            <div class="print-summary-row">
                <div class="print-summary-box">
                    <div class="num">${weeklyHours}h</div>
                    <div class="lbl">${currentLanguage === 'ja' ? '今週時間' : '本周工时'}</div>
                </div>
                <div class="print-summary-box">
                    <div class="num">${monthlyHours}h</div>
                    <div class="lbl">${currentLanguage === 'ja' ? '今月時間' : '本月工时'}</div>
                </div>
                <div class="print-summary-box">
                    <div class="num">${workDaysCount}</div>
                    <div class="lbl">${currentLanguage === 'ja' ? '勤務日' : '工作日'}</div>
                </div>
                <div class="print-summary-box">
                    <div class="num">${restDaysCount}</div>
                    <div class="lbl">${currentLanguage === 'ja' ? '休日' : '休息日'}</div>
                </div>
            </div>

            <div class="print-day-list">
                ${days.map(day => buildPrintDayRow(day, weekSchedule.find(s => s.date === day.dateString), dayNames)).join('')}
            </div>

            <div class="print-footer">
                ${currentLanguage === 'ja' ? '印刷日:' : '打印日期:'} ${new Date().toLocaleDateString(currentLanguage === 'ja' ? 'ja-JP' : 'zh-CN')}
            </div>
        </div>
    `;

    const container = document.getElementById('printOutput');
    if (!container) {
        showMessage(currentLanguage === 'ja' ? 'エラーが発生しました、ページを更新して再試行してください' : '发生错误，请刷新页面重试', 'error');
        return;
    }

    container.innerHTML = html;
    setPrintPageSize('portrait');
    triggerPrint();
}

function printAllSchedule() {
    const { startDate, endDate } = getWeekDates(currentWeek);
    const weekSchedule = getWeekSchedules(startDate, endDate);
    const days = generateWeekDays(startDate);

    const dayNames = currentLanguage === 'ja'
        ? ['月', '火', '水', '木', '金', '土', '日']
        : ['一', '二', '三', '四', '五', '六', '日'];

    const schedulesByEmployee = {};
    weekSchedule.forEach(schedule => {
        if (schedule && schedule.employeeId) {
            if (!schedulesByEmployee[schedule.employeeId]) {
                schedulesByEmployee[schedule.employeeId] = {};
            }
            schedulesByEmployee[schedule.employeeId][schedule.date] = schedule;
        }
    });

    function renderPrintGroup(groupLabel, groupEmployees) {
        if (groupEmployees.length === 0) return '';
        let groupHtml = `<div class="print-group-title">${groupLabel}</div>`;
        groupEmployees.forEach(employee => {
            const employeeSchedules = schedulesByEmployee[employee.id] || {};
            const weeklyHours = calculateWeeklyHours(employee.id);
            groupHtml += `
                <div class="print-all-row">
                    <div class="print-all-name">
                        <div>${employee.name}</div>
                        <div class="print-all-hours">${weeklyHours}h</div>
                    </div>
                    <div class="print-all-days">
                        ${days.map(day => {
                            const schedule = employeeSchedules[day.dateString];
                            let cls = 'none';
                            let content = '-';
                            if (schedule) {
                                if (schedule.isDayOff) {
                                    cls = 'rest';
                                    content = currentLanguage === 'ja' ? '休' : '休';
                                } else {
                                    cls = 'work';
                                    const start = schedule.startTime ? schedule.startTime.substring(0, 5) : '';
                                    const end = schedule.endTime ? schedule.endTime.substring(0, 5) : '';
                                    content = `${start}<br>${end}`;
                                    const shiftType = getShiftTypeLabel(schedule.startTime);
                                    if (shiftType) content += `<br><small>${shiftType}</small>`;
                                }
                            }
                            return `<div class="print-all-cell ${cls}">${content}</div>`;
                        }).join('')}
                    </div>
                </div>
            `;
        });
        return groupHtml;
    }

    const frontDeskEmployees = employees.filter(e => e.position === '前台/服务区');
    const kitchenEmployees = employees.filter(e => e.position === '厨房区');
    const rakkaEmployees = employees.filter(e => e.position === '拉客');

    const html = `
        <div class="print-sheet print-sheet-all">
            <div class="print-sheet-header">
                <div class="print-company">鍛治町酒場 神田店</div>
                <div class="print-sub">${currentLanguage === 'ja' ? '週間勤務表' : '每周排班表'} ・ ${formatDate(startDate)} - ${formatDate(endDate)}</div>
            </div>
            <div class="print-all-header">
                <div class="print-all-name">${currentLanguage === 'ja' ? 'スタッフ' : '员工'}</div>
                <div class="print-all-days">
                    ${days.map((day, i) => `<div class="print-all-cell head">${dayNames[i]}<br>${day.date}</div>`).join('')}
                </div>
            </div>
            ${renderPrintGroup(currentLanguage === 'ja' ? 'フロント / サービス' : '前台 / 服务', frontDeskEmployees)}
            ${renderPrintGroup(currentLanguage === 'ja' ? '厨房' : '厨房', kitchenEmployees)}
            ${renderPrintGroup(currentLanguage === 'ja' ? 'ラッカ' : '拉客', rakkaEmployees)}
            <div class="print-footer">
                ${currentLanguage === 'ja' ? '印刷日:' : '打印日期:'} ${new Date().toLocaleDateString(currentLanguage === 'ja' ? 'ja-JP' : 'zh-CN')}
            </div>
        </div>
    `;

    const container = document.getElementById('printOutput');
    if (!container) return;
    container.innerHTML = html;
    setPrintPageSize('landscape');
    triggerPrint();
}

// ==================== SHARE WEEKLY SCHEDULE ====================
function shareWeeklySchedule() {
    const { startDate, endDate } = getWeekDates(currentWeek);
    const days = generateWeekDays(startDate);

    const dayNames = currentLanguage === 'ja'
        ? ['月', '火', '水', '木', '金', '土', '日']
        : ['一', '二', '三', '四', '五', '六', '日'];

    const frontLabel = currentLanguage === 'ja' ? '🚪 フロント/サービス' : '🚪 前台/服务';
    const kitchenLabel = currentLanguage === 'ja' ? '🍳 厨房' : '🍳 厨房';
    const rakkaLabel = currentLanguage === 'ja' ? '🤝 ラッカ' : '🤝 拉客';

    function groupText(label, groupEmployees) {
        if (groupEmployees.length === 0) return '';
        let t = `${label}\n`;
        groupEmployees.forEach(emp => {
            const hrs = calculateWeeklyHours(emp.id);
            const pattern = getWeekPattern(emp.id, currentWeek);
            const patternText = pattern.map(d => {
                if (d.status === 'work') return `${d.letter}✓`;
                if (d.status === 'rest') return `${d.letter}休`;
                return `${d.letter}-`;
            }).join(' ');
            t += `・${emp.name} (${hrs}h): ${patternText}\n`;
        });
        return t + '\n';
    }

    const frontDeskEmployees = employees.filter(e => e.position === '前台/服务区');
    const kitchenEmployees = employees.filter(e => e.position === '厨房区');
    const rakkaEmployees = employees.filter(e => e.position === '拉客');

    let text = `📅 鍛治町酒場 神田店\n`;
    text += `${currentLanguage === 'ja' ? '週間シフト' : '每周排班'}: ${formatDate(startDate)} - ${formatDate(endDate)}\n\n`;
    text += groupText(frontLabel, frontDeskEmployees);
    text += groupText(kitchenLabel, kitchenEmployees);
    text += groupText(rakkaLabel, rakkaEmployees);

    text += `${currentLanguage === 'ja' ? '📊 日別の人数' : '📊 每日人数'}\n`;
    days.forEach((day, index) => {
        const headcount = getDayHeadcount(day.dateString);
        let parts = [];
        if (headcount.front > 0) parts.push(`🚪${headcount.front}`);
        if (headcount.kitchen > 0) parts.push(`🍳${headcount.kitchen}`);
        if (headcount.rakka > 0) parts.push(`🤝${headcount.rakka}`);
        text += `${dayNames[index]} (${day.date}): ${parts.join(' ') || '0'}\n`;
    });

    if (navigator.share) {
        navigator.share({
            title: currentLanguage === 'ja' ? '週間シフト' : '每周排班',
            text: text
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(text)
            .then(() => {
                showMessage(currentLanguage === 'ja' ? 'クリップボードにコピーしました' : '已复制到剪贴板', 'success');
            })
            .catch(() => {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    showMessage(currentLanguage === 'ja' ? 'クリップボードにコピーしました' : '已复制到剪贴板', 'success');
                } catch (err) {
                    showMessage(currentLanguage === 'ja' ? 'コピーに失敗しました' : '复制失败', 'error');
                }
                document.body.removeChild(textarea);
            });
    }
}

// ==================== SETUP EVENT LISTENERS ====================
function setupEventListeners() {
    const languageSwitchBtn = document.getElementById('languageSwitch');
    if (languageSwitchBtn) {
        languageSwitchBtn.addEventListener('click', function() {
            currentLanguage = currentLanguage === 'ja' ? 'zh' : 'ja';
            updateLanguage();
            localStorage.setItem('appLanguage', currentLanguage);
        });
    }
    
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });
    
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey || event.metaKey) {
            switch(event.key.toLowerCase()) {
                case 'e':
                    if (selectedEmployee) {
                        editEmployeeSchedule();
                        event.preventDefault();
                    }
                    break;
                case 'p':
                    if (selectedEmployee) {
                        printEmployeeSchedule();
                        event.preventDefault();
                    }
                    break;
                case 'c':
                    if (selectedEmployee) {
                        copyScheduleAsText();
                        event.preventDefault();
                    }
                    break;
                case 's':
                    refreshData();
                    event.preventDefault();
                    break;
            }
        }
        
        if (event.key === 'Escape') {
            const openModal = document.querySelector('.modal[style*="display: flex"]');
            if (openModal) {
                closeModal(openModal.id);
            }
        }
    });
    
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.type = 'text';
            setTimeout(() => {
                this.type = 'date';
            }, 100);
        });
    });
    
    window.addEventListener('beforeunload', function(e) {
        const activeView = document.querySelector('.view.active');
        if (activeView) {
            const lastView = activeView.id.replace('View', '');
            localStorage.setItem('lastView', lastView);
        }
        localStorage.setItem('appLanguage', currentLanguage);
    });
    
    const savedView = localStorage.getItem('lastView');
    if (savedView) {
        setTimeout(() => switchView(savedView), 100);
    }
}

// ==================== QUICK ACTIONS ====================
function showTodaySchedule() {
    const today = new Date().toISOString().split('T')[0];
    const todaySchedules = Object.values(schedules).filter(s => s && s.date === today);
    
    const container = document.getElementById('todayList');
    if (!container) return;
    
    if (todaySchedules.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-day"></i>
                <p>${currentLanguage === 'ja' ? '今日のシフトはありません' : '今天没有排班'}</p>
                <small>${currentLanguage === 'ja' ? '「シフト登録」ページで追加' : '在"排班"页面添加'}</small>
            </div>
        `;
    } else {
        const frontDeskSchedules = todaySchedules.filter(s => s.employeePosition === '前台/服务区');
        const kitchenSchedules = todaySchedules.filter(s => s.employeePosition === '厨房区');
        const rakkaSchedules = todaySchedules.filter(s => s.employeePosition === '拉客');
        
        let html = '';
        
        if (frontDeskSchedules.length > 0) {
            const title = currentLanguage === 'ja' ? 'フロント/サービス' : '前台/服务';
            html += `<h4 style="margin-bottom: 16px; color: #2563eb; font-weight: 700;"><i class="fas fa-door-open"></i> ${title}</h4>`;
            html += frontDeskSchedules.map(schedule => createTodayItem(schedule)).join('');
        }
        
        if (kitchenSchedules.length > 0) {
            const title = currentLanguage === 'ja' ? '厨房' : '厨房';
            html += `<h4 style="margin-top: 24px; margin-bottom: 16px; color: #f59e0b; font-weight: 700;"><i class="fas fa-utensils"></i> ${title}</h4>`;
            html += kitchenSchedules.map(schedule => createTodayItem(schedule)).join('');
        }
        
        if (rakkaSchedules.length > 0) {
            const title = currentLanguage === 'ja' ? 'ラッカ' : '拉客';
            html += `<h4 style="margin-top: 24px; margin-bottom: 16px; color: #0d9488; font-weight: 700;"><i class="fas fa-handshake"></i> ${title}</h4>`;
            html += rakkaSchedules.map(schedule => createTodayItem(schedule)).join('');
        }
        
        container.innerHTML = html;
    }
    
    openModal('todayModal');
}

function createTodayItem(schedule) {
    let posDisplay = '';
    if (schedule.employeePosition === '厨房区') {
        posDisplay = currentLanguage === 'ja' ? '厨房' : '厨房';
    } else if (schedule.employeePosition === '拉客') {
        posDisplay = currentLanguage === 'ja' ? 'ラッカ' : '拉客';
    } else {
        posDisplay = currentLanguage === 'ja' ? 'フロント' : '前台';
    }
    
    let statusText = '';
    let statusClass = '';
    if (schedule.isDayOff) {
        statusText = currentLanguage === 'ja' ? '休み' : '休息';
        statusClass = 'rest';
    } else {
        const statusLabel = getStatusLabel(schedule.status || 'present');
        const shiftType = getShiftTypeLabel(schedule.startTime);
        const shiftClass = getShiftTypeClass(schedule.startTime);
        const statusClassText = getStatusClass(schedule.status || 'present');
        statusText = `${schedule.startTime ? schedule.startTime.substring(0, 5) : ''} - ${schedule.endTime ? schedule.endTime.substring(0, 5) : ''}`;
        if (shiftType) statusText += ` <span style="color:${shiftClass === 'morning' ? '#1d4ed8' : '#b45309'};font-weight:700;">${shiftType}</span>`;
        if (statusLabel) statusText += ` <span style="color:${statusClassText === 'early-leave' ? '#b91c1c' : '#065f46'};font-weight:700;">${statusLabel}</span>`;
        statusClass = 'work';
    }
    
    return `
        <div class="today-item ${statusClass}">
            <div>
                <div style="font-weight: 700; color: var(--dark);">${schedule.employeeName}</div>
                <div style="font-size: 13px; color: var(--gray-500); font-weight: 500;">${posDisplay}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: 700; color: ${schedule.isDayOff ? 'var(--warning)' : 'var(--success)'};">
                    ${statusText}
                </div>
                ${!schedule.isDayOff ? `
                    <div style="font-size: 12px; color: var(--gray-500); font-weight: 500;">
                        ${currentLanguage === 'ja' ? '時間:' : '时间:'} ${calculateShiftHours(schedule.startTime, schedule.endTime)}h
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function showStats() {
    const container = document.getElementById('statsGrid');
    if (!container) return;
    
    let totalWeekHours = 0;
    employees.forEach(employee => {
        totalWeekHours += calculateWeeklyHours(employee.id);
    });
    totalWeekHours = roundHours(totalWeekHours, 1);
    
    const totalEmployees = employees.length;
    const totalSchedules = Object.keys(schedules).length;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayShifts = Object.values(schedules).filter(s => s && s.date === todayStr && !s.isDayOff).length;
    const monthHours = roundHours(employees.reduce((sum, emp) => sum + calculateMonthlyHours(emp.id), 0), 1);
    const frontDeskCount = employees.filter(e => e.position === '前台/服务区').length;
    const kitchenCount = employees.filter(e => e.position === '厨房区').length;
    const rakkaCount = employees.filter(e => e.position === '拉客').length;
    const avgWeekHours = roundHours(totalWeekHours / (employees.length || 1), 1);
    
    container.innerHTML = `
        <div class="stat-card">
            <h4>${totalEmployees}</h4>
            <p>${currentLanguage === 'ja' ? 'スタッフ数' : '员工总数'}</p>
        </div>
        <div class="stat-card">
            <h4>${totalSchedules}</h4>
            <p>${currentLanguage === 'ja' ? '総スケジュール' : '总排班数'}</p>
        </div>
        <div class="stat-card">
            <h4>${todayShifts}</h4>
            <p>${currentLanguage === 'ja' ? '今日のシフト' : '今日班次'}</p>
        </div>
        <div class="stat-card">
            <h4>${totalWeekHours}h</h4>
            <p>${currentLanguage === 'ja' ? '今週の時間' : '本周工时'}</p>
        </div>
        <div class="stat-card">
            <h4>${monthHours}h</h4>
            <p>${currentLanguage === 'ja' ? '今月の時間' : '本月工时'}</p>
        </div>
        <div class="stat-card">
            <h4>${frontDeskCount}</h4>
            <p>${currentLanguage === 'ja' ? 'フロント' : '前台'}</p>
        </div>
        <div class="stat-card">
            <h4>${kitchenCount}</h4>
            <p>${currentLanguage === 'ja' ? '厨房' : '厨房'}</p>
        </div>
        <div class="stat-card">
            <h4>${rakkaCount}</h4>
            <p>${currentLanguage === 'ja' ? 'ラッカ' : '拉客'}</p>
        </div>
        <div class="stat-card">
            <h4>${avgWeekHours}h</h4>
            <p>${currentLanguage === 'ja' ? '平均週時間' : '平均周工时'}</p>
        </div>
    `;
    
    openModal('statsModal');
}

// ==================== NEW FEATURES ====================

// ---------- 1. Sửa vị trí nhân viên ----------
function editEmployeePosition(employeeId) {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) {
        showMessage(currentLanguage === 'ja' ? 'スタッフが見つかりません' : '找不到员工', 'error');
        return;
    }

    document.getElementById('editPositionEmployeeId').value = employeeId;
    document.getElementById('editPositionName').textContent = employee.name;
    
    let currentPos = '';
    if (employee.position === '厨房区') {
        currentPos = currentLanguage === 'ja' ? '厨房' : '厨房';
    } else if (employee.position === '拉客') {
        currentPos = currentLanguage === 'ja' ? 'ラッカ' : '拉客';
    } else {
        currentPos = currentLanguage === 'ja' ? 'フロント' : '前台';
    }
    document.getElementById('editPositionCurrent').textContent = currentPos;

    document.querySelectorAll('#editPositionOptions .position-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.position === employee.position) {
            btn.classList.add('active');
        }
    });

    openModal('editPositionModal');
}

function selectEditPosition(button) {
    document.querySelectorAll('#editPositionOptions .position-option').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
}

function updateEmployeePosition() {
    const employeeId = document.getElementById('editPositionEmployeeId').value;
    const activeBtn = document.querySelector('#editPositionOptions .position-option.active');

    if (!activeBtn) {
        showMessage(currentLanguage === 'ja' ? '職種を選択してください' : '请选择职位', 'warning');
        return;
    }

    const newPosition = activeBtn.dataset.position;
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    if (newPosition === employee.position) {
        showMessage('Same position', 'info');
        closeModal('editPositionModal');
        return;
    }

    window.database.ref(`employees/${employeeId}/position`).set(newPosition)
        .then(() => {
            closeModal('editPositionModal');
            let posDisplay = '';
            if (newPosition === '厨房区') {
                posDisplay = currentLanguage === 'ja' ? '厨房' : '厨房';
            } else if (newPosition === '拉客') {
                posDisplay = currentLanguage === 'ja' ? 'ラッカ' : '拉客';
            } else {
                posDisplay = currentLanguage === 'ja' ? 'フロント' : '前台';
            }
            const msg = currentLanguage === 'ja'
                ? `${employee.name} の職種を ${posDisplay} に変更しました`
                : `已将 ${employee.name} 的职位更改为 ${posDisplay}`;
            showMessage(msg, 'success');
            renderEmployeeCards();
            renderWeeklySchedule();
            if (selectedEmployee === employeeId) {
                showEmployeeDetail(employeeId);
            }
        })
        .catch(error => {
            showMessage((currentLanguage === 'ja' ? '更新失敗: ' : '更新失败: ') + error.message, 'error');
        });
}

// ---------- 2. Đánh dấu 早退 (về sớm) ----------
function toggleScheduleStatus(employeeId, date) {
    const schedule = findScheduleByEmployeeAndDate(employeeId, date);
    if (!schedule) {
        showMessage(currentLanguage === 'ja' ? 'シフトが見つかりません' : '找不到排班', 'warning');
        return;
    }

    if (schedule.isDayOff) {
        showMessage(currentLanguage === 'ja' ? '休みの日は変更できません' : '休息日不能更改', 'warning');
        return;
    }

    const currentStatus = schedule.status || 'present';
    const newStatus = currentStatus === 'early_leave' ? 'present' : 'early_leave';

    window.database.ref(`schedules/${schedule.id}/status`).set(newStatus)
        .then(() => {
            const msg = currentLanguage === 'ja'
                ? (newStatus === 'early_leave' ? '早退 に設定しました' : '早退 を解除しました')
                : (newStatus === 'early_leave' ? '已设为早退' : '已取消早退');
            showMessage(msg, 'success');
            renderWeeklySchedule();
            if (selectedEmployee === employeeId) {
                showEmployeeWeekSchedule(employeeId);
            }
        })
        .catch(error => {
            showMessage((currentLanguage === 'ja' ? '更新失敗: ' : '更新失败: ') + error.message, 'error');
        });
}

// ---------- 3. Phân loại ca (早班 / 晚班) ----------
function getShiftType(startTime) {
    if (!startTime) return '';
    const parts = startTime.split(':');
    if (parts.length < 2) return '';
    const hour = parseInt(parts[0]);
    if (isNaN(hour)) return '';
    return hour < 17 ? '早班' : '晚班';
}

function getShiftTypeLabel(startTime, lang = currentLanguage) {
    const type = getShiftType(startTime);
    if (!type) return '';
    if (lang === 'ja') {
        return type === '早班' ? '朝' : '夜';
    }
    return type;
}

function getShiftTypeClass(startTime) {
    const type = getShiftType(startTime);
    if (!type) return '';
    if (type === '早班') return 'morning';
    if (type === '晚班') return 'evening';
    return 'night';
}

function getStatusLabel(status, lang = currentLanguage) {
    const labels = {
        'present': { ja: '出勤', zh: '出勤' },
        'early_leave': { ja: '早退', zh: '早退' },
        'absent': { ja: '欠勤', zh: '缺勤' },
        'holiday': { ja: '休暇', zh: '休假' }
    };
    const def = { ja: '出勤', zh: '出勤' };
    return (labels[status] || def)[lang] || def.ja;
}

function getStatusClass(status) {
    if (!status) return 'present';
    const map = {
        'present': 'present',
        'early_leave': 'early-leave',
        'holiday': 'holiday',
        'absent': 'absent'
    };
    return map[status] || 'present';
}

// ---------- 4. Copy lịch của 1 nhân viên sang tuần sau ----------
function copyScheduleToNextWeek(employeeId) {
    if (!employeeId) {
        showMessage(currentLanguage === 'ja' ? 'スタッフを選択してください' : '请选择员工', 'warning');
        return;
    }

    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    const { startDate } = getWeekDates(0);
    const weekSchedule = getEmployeeSchedulesForWeek(employeeId, startDate,
        new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000));

    if (weekSchedule.length === 0) {
        const msg = currentLanguage === 'ja' ? '今週のシフトがありません' : '本周没有排班';
        showMessage(msg, 'warning');
        return;
    }

    const nextWeekStart = new Date(startDate);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);

    const promises = [];
    let skippedCount = 0;

    weekSchedule.forEach(schedule => {
        const dateObj = new Date(schedule.date);
        const dayOfWeek = dateObj.getDay();
        const newDate = new Date(nextWeekStart);
        newDate.setDate(nextWeekStart.getDate() + dayOfWeek);
        const dateString = newDate.toISOString().split('T')[0];

        const existing = findScheduleByEmployeeAndDate(employeeId, dateString);
        if (existing) {
            skippedCount++;
            return;
        }

        const scheduleData = {
            employeeId: employeeId,
            employeeName: employee.name,
            employeePosition: employee.position,
            date: dateString,
            isDayOff: schedule.isDayOff || false,
            startTime: schedule.startTime || '00:00',
            endTime: schedule.endTime || '00:00',
            notes: schedule.notes || '',
            status: schedule.status || 'present',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        promises.push(window.database.ref('schedules').push().set(scheduleData));
    });

    if (promises.length === 0) {
        const msg = currentLanguage === 'ja'
            ? '来週のシフトは既に設定されています'
            : '下周的排班已存在';
        showMessage(msg, 'info');
        return;
    }

    Promise.all(promises)
        .then(() => {
            const msg = currentLanguage === 'ja'
                ? `${promises.length}件のシフトを来週にコピーしました${skippedCount > 0 ? ` (${skippedCount}件スキップ)` : ''}`
                : `已复制 ${promises.length} 个班次到下周${skippedCount > 0 ? ` (跳过 ${skippedCount} 个)` : ''}`;
            showMessage(msg, 'success');
            renderWeeklySchedule();
            if (selectedEmployee === employeeId) {
                showEmployeeWeekSchedule(employeeId);
            }
        })
        .catch(error => {
            showMessage((currentLanguage === 'ja' ? 'コピー失敗: ' : '复制失败: ') + error.message, 'error');
        });
}

// ---------- 5. Copy toàn bộ lịch tuần (tất cả nhân viên) ----------
function copyAllSchedulesToNextWeek() {
    const confirmMsg = currentLanguage === 'ja'
        ? '全スタッフの今週のシフトを来週にコピーしますか？\n（既存のシフトはスキップされます）'
        : '确定要将所有员工的本周排班复制到下周吗？\n（已存在的排班将被跳过）';

    if (!confirm(confirmMsg)) return;

    const { startDate } = getWeekDates(0);
    const weekSchedule = getWeekSchedules(startDate,
        new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000));

    if (weekSchedule.length === 0) {
        const msg = currentLanguage === 'ja' ? '今週のシフトがありません' : '本周没有排班';
        showMessage(msg, 'warning');
        return;
    }

    const employeeSchedules = {};
    weekSchedule.forEach(schedule => {
        if (!employeeSchedules[schedule.employeeId]) {
            employeeSchedules[schedule.employeeId] = [];
        }
        employeeSchedules[schedule.employeeId].push(schedule);
    });

    const nextWeekStart = new Date(startDate);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);

    const allPromises = [];
    let totalCopied = 0;
    let totalSkipped = 0;

    for (const [employeeId, schedules] of Object.entries(employeeSchedules)) {
        const employee = employees.find(e => e.id === employeeId);
        if (!employee) continue;

        schedules.forEach(schedule => {
            const dateObj = new Date(schedule.date);
            const dayOfWeek = dateObj.getDay();
            const newDate = new Date(nextWeekStart);
            newDate.setDate(nextWeekStart.getDate() + dayOfWeek);
            const dateString = newDate.toISOString().split('T')[0];

            const existing = findScheduleByEmployeeAndDate(employeeId, dateString);
            if (existing) {
                totalSkipped++;
                return;
            }

            const scheduleData = {
                employeeId: employeeId,
                employeeName: employee.name,
                employeePosition: employee.position,
                date: dateString,
                isDayOff: schedule.isDayOff || false,
                startTime: schedule.startTime || '00:00',
                endTime: schedule.endTime || '00:00',
                notes: schedule.notes || '',
                status: schedule.status || 'present',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            allPromises.push(window.database.ref('schedules').push().set(scheduleData));
            totalCopied++;
        });
    }

    if (allPromises.length === 0) {
        const msg = currentLanguage === 'ja'
            ? '来週のシフトは全て既に設定されています'
            : '下周的排班已全部存在';
        showMessage(msg, 'info');
        return;
    }

    Promise.all(allPromises)
        .then(() => {
            const msg = currentLanguage === 'ja'
                ? `${totalCopied}件のシフトを来週にコピーしました${totalSkipped > 0 ? ` (${totalSkipped}件スキップ)` : ''}`
                : `已复制 ${totalCopied} 个班次到下周${totalSkipped > 0 ? ` (跳过 ${totalSkipped} 个)` : ''}`;
            showMessage(msg, 'success');
            renderWeeklySchedule();
        })
        .catch(error => {
            showMessage((currentLanguage === 'ja' ? 'コピー失敗: ' : '复制失败: ') + error.message, 'error');
        });
}

// ---------- 6. Mở modal chọn ngày để đánh dấu 早退 ----------
function openEarlyLeaveModal(employeeId) {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('earlyLeaveEmployeeId').value = employeeId;
    document.getElementById('earlyLeaveDate').value = today;
    document.getElementById('earlyLeaveDate').min = today;

    const schedule = findScheduleByEmployeeAndDate(employeeId, today);
    const statusEl = document.getElementById('earlyLeaveCurrentStatus');
    if (schedule && !schedule.isDayOff) {
        const status = schedule.status || 'present';
        const label = getStatusLabel(status);
        statusEl.textContent = currentLanguage === 'ja' ? `現在: ${label}` : `当前: ${label}`;
        statusEl.style.color = status === 'early_leave' ? 'var(--warning)' : 'var(--success)';
    } else {
        statusEl.textContent = currentLanguage === 'ja' ? 'シフトなし / 休み' : '无排班 / 休息';
        statusEl.style.color = 'var(--gray-500)';
    }

    openModal('earlyLeaveModal');
}

function applyEarlyLeave() {
    const employeeId = document.getElementById('earlyLeaveEmployeeId').value;
    const date = document.getElementById('earlyLeaveDate').value;

    if (!date) {
        showMessage(currentLanguage === 'ja' ? '日付を選択してください' : '请选择日期', 'warning');
        return;
    }

    toggleScheduleStatus(employeeId, date);
    closeModal('earlyLeaveModal');
}

// ==================== DRAG & DROP ====================
let dragData = null;
let dropTargetElement = null;

function initDragDrop() {
    document.addEventListener('dragstart', function(e) {
        const card = e.target.closest('.employee-card');
        if (!card) return;
        
        const employeeId = card.dataset.employeeId;
        const employee = employees.find(emp => emp.id === employeeId);
        if (!employee) return;
        
        dragData = {
            employeeId: employeeId,
            position: employee.position,
            name: employee.name
        };
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', employeeId);
        
        card.style.opacity = '0.5';
        card.style.transform = 'scale(0.95)';
        
        const dragHint = document.createElement('div');
        dragHint.id = 'dragHint';
        dragHint.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary);
            color: white;
            padding: 12px 24px;
            border-radius: var(--border-radius);
            font-weight: 600;
            font-size: 0.9rem;
            z-index: 9999;
            box-shadow: var(--shadow-lg);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        dragHint.textContent = currentLanguage === 'ja' 
            ? `👆 ${employee.name} をドラッグ中... 新しい職種にドロップ`
            : `👆 正在拖动 ${employee.name}... 拖到新职位释放`;
        document.body.appendChild(dragHint);
        
        setTimeout(() => {
            const hint = document.getElementById('dragHint');
            if (hint) hint.style.opacity = '1';
        }, 50);
    });
    
    document.addEventListener('dragend', function(e) {
        const card = e.target.closest('.employee-card');
        if (card) {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
        }
        
        const hint = document.getElementById('dragHint');
        if (hint) hint.remove();
        
        document.querySelectorAll('.position-drop-zone').forEach(el => {
            el.classList.remove('drag-over', 'position-drop-zone');
        });
        
        dragData = null;
        dropTargetElement = null;
    });
    
    document.addEventListener('dragover', function(e) {
        const positionGroup = e.target.closest('.position-group');
        if (!positionGroup || !dragData) return;
        
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        document.querySelectorAll('.position-group').forEach(g => {
            g.classList.remove('drag-over');
        });
        positionGroup.classList.add('drag-over');
        dropTargetElement = positionGroup;
    });
    
    document.addEventListener('dragleave', function(e) {
        const positionGroup = e.target.closest('.position-group');
        if (positionGroup) {
            positionGroup.classList.remove('drag-over');
        }
    });
    
    document.addEventListener('drop', function(e) {
        const positionGroup = e.target.closest('.position-group');
        if (!positionGroup || !dragData) return;
        
        e.preventDefault();
        
        const newPosition = positionGroup.dataset.position;
        const employeeId = dragData.employeeId;
        const oldPosition = dragData.position;
        
        document.querySelectorAll('.position-group').forEach(g => {
            g.classList.remove('drag-over');
        });
        
        const hint = document.getElementById('dragHint');
        if (hint) hint.remove();
        
        if (newPosition === oldPosition) {
            showMessage('Same position', 'info');
            dragData = null;
            return;
        }
        
        const confirmMsg = currentLanguage === 'ja'
            ? `${dragData.name} を ${getPositionDisplayName(oldPosition)} から ${getPositionDisplayName(newPosition)} に移動しますか？`
            : `确定将 ${dragData.name} 从 ${getPositionDisplayName(oldPosition)} 移动到 ${getPositionDisplayName(newPosition)} 吗？`;
        
        if (!confirm(confirmMsg)) {
            dragData = null;
            return;
        }
        
        window.database.ref(`employees/${employeeId}/position`).set(newPosition)
            .then(() => {
                const msg = currentLanguage === 'ja'
                    ? `${dragData.name} を ${getPositionDisplayName(newPosition)} に移動しました`
                    : `已将 ${dragData.name} 移动到 ${getPositionDisplayName(newPosition)}`;
                showMessage(msg, 'success');
                renderEmployeeCards();
                renderWeeklySchedule();
                
                if (selectedEmployee === employeeId) {
                    showEmployeeDetail(employeeId);
                }
            })
            .catch(error => {
                showMessage((currentLanguage === 'ja' ? '移動失敗: ' : '移动失败: ') + error.message, 'error');
            });
        
        dragData = null;
    });
}

function getPositionDisplayName(position) {
    if (position === '厨房区') {
        return currentLanguage === 'ja' ? '厨房' : '厨房';
    } else if (position === '拉客') {
        return currentLanguage === 'ja' ? 'ラッカ' : '拉客';
    } else {
        return currentLanguage === 'ja' ? 'フロント' : '前台';
    }
}

function refreshDragDrop() {
    document.querySelectorAll('.employee-card').forEach(card => {
        const nameEl = card.querySelector('.employee-name');
        if (nameEl) {
            const employee = employees.find(emp => emp.name === nameEl.textContent.trim());
            if (employee) {
                card.dataset.employeeId = employee.id;
            }
        }
        card.draggable = true;
        card.style.cursor = 'grab';
    });
    
    document.querySelectorAll('.position-group').forEach(group => {
        const title = group.querySelector('.position-title');
        if (title) {
            const text = title.textContent.trim();
            if (text.includes('フロント') || text.includes('前台')) {
                group.dataset.position = '前台/服务区';
            } else if (text.includes('厨房')) {
                group.dataset.position = '厨房区';
            } else if (text.includes('ラッカ') || text.includes('拉客')) {
                group.dataset.position = '拉客';
            }
        }
    });
}

// ==================== ERROR HANDLING ====================
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('JavaScript Error:', msg, '\nURL:', url, '\nLine:', lineNo, '\nColumn:', columnNo, '\nError object:', error);
    showMessage(currentLanguage === 'ja' ? 'エラーが発生しました、ページを更新して再試行してください' : '发生错误，请刷新页面重试', 'error');
    return false;
};

console.log("✅ 鍛治町酒場 神田店 勤務表システム完全起動");

// ==================== FIREBASE INIT ====================
const firebaseConfig = {
    apiKey: "AIzaSyB6C3s4EAPEx0GBLnBXAz4aYJfoCBEyofc",
    authDomain: "employee-schedule-893f5.firebaseapp.com",
    databaseURL: "https://employee-schedule-893f5-default-rtdb.firebaseio.com",
    projectId: "employee-schedule-893f5",
    storageBucket: "employee-schedule-893f5.firebasestorage.app",
    messagingSenderId: "377051530021",
    appId: "1:377051530021:web:e3341a1a7bcdc89ad810cc"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
window.database = database;

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
    if (savedLanguage) currentLanguage = savedLanguage;
    initApp();
    loadEmployees();
    loadSchedules();
    setupEventListeners();
    database.ref('.info/connected').on('value', (snap) => {
        const status = document.getElementById('connectionStatus');
        if (snap.val() === true) {
            status.innerHTML = '<i class="fas fa-wifi"></i><span data-lang="ja">接続済み</span><span data-lang="zh" style="display:none">已连接</span>';
            status.className = 'connection-status connected';
        } else {
            status.innerHTML = '<i class="fas fa-wifi-slash"></i><span data-lang="ja">接続切れ</span><span data-lang="zh" style="display:none">未连接</span>';
            status.className = 'connection-status disconnected';
        }
    });
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
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        currentDateElement.textContent = currentLanguage === 'ja' ?
            now.toLocaleDateString('ja-JP', options) :
            now.toLocaleDateString('zh-CN', options);
    }
}

function updatePrintDate() {
    const today = new Date();
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' };
    const printDateElement = document.getElementById('printDate');
    if (printDateElement) {
        printDateElement.textContent = currentLanguage === 'ja' ?
            today.toLocaleDateString('ja-JP', options) :
            today.toLocaleDateString('zh-CN', options);
    }
}

// ==================== MODAL FUNCTIONS ====================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) { console.error("Modal not found:", modalId); return; }
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
        const firstInput = modal.querySelector('input:not([type="hidden"]), select, button:not(.modal-close)');
        if (firstInput && firstInput.type !== 'hidden') firstInput.focus();
    }, 100);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    if (modalId === 'employeeModal') selectedEmployee = null;
}

// ==================== MESSAGE FUNCTIONS ====================
function showMessage(message, type = 'info') {
    const map = {
        'ja': {
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
            'Start time and end time cannot be the same': '開始時間と終了時間を同じにできません',
            'Shift must be at least 15 minutes': 'シフトは最低15分以上必要です',
            'Shift cannot exceed 24 hours': 'シフトは24時間を超えることはできません',
            'No schedule data': 'スケジュールデータがありません',
            'No employees registered yet': 'スタッフがまだ登録されていません',
            'No matching employees found': '該当するスタッフがありません',
            'Today\'s schedule': '今日のシフト',
            'No schedule for today': '今日のシフトはありません',
            'Work': '勤務',
            'Rest': '休み',
            'Hours': '時間',
            'Weekly schedule printed successfully': '週間勤務表を印刷しました',
            'Employee schedule printed successfully': 'スタッフの勤務表を印刷しました',
        },
        'zh': {
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
            'Start time and end time cannot be the same': '开始和结束时间不能相同',
            'Shift must be at least 15 minutes': '班次必须至少15分钟',
            'Shift cannot exceed 24 hours': '班次不能超过24小时',
            'No schedule data': '没有排班数据',
            'No employees registered yet': '还没有员工',
            'No matching employees found': '没有找到员工',
            'Today\'s schedule': '今日排班',
            'No schedule for today': '今天没有排班',
            'Work': '工作',
            'Rest': '休息',
            'Hours': '小时',
            'Weekly schedule printed successfully': '每周排班表打印成功',
            'Employee schedule printed successfully': '员工排班表打印成功',
        }
    };
    const dict = map[currentLanguage] || map['ja'];
    let translated = dict[message] || message;

    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    else if (type === 'error') icon = 'fa-exclamation-circle';
    else if (type === 'warning') icon = 'fa-exclamation-triangle';
    toast.innerHTML = `<div class="toast-content"><i class="fas ${icon}"></i><span>${translated}</span></div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { if (toast.parentNode) document.body.removeChild(toast); }, 300);
    }, 3000);
}

// ==================== TIME VALIDATION ====================
function validateTimeRange(startTime, endTime) {
    if (!startTime || !endTime) {
        showMessage(currentLanguage === 'ja' ? '開始時間と終了時間を入力してください' :
            '请输入开始和结束时间', 'warning');
        return false;
    }
    const s = startTime.split(':').map(Number);
    const e = endTime.split(':').map(Number);
    if (s.length !== 2 || e.length !== 2 || isNaN(s[0]) || isNaN(s[1]) || isNaN(e[0]) || isNaN(e[1])) {
        showMessage(currentLanguage === 'ja' ? '無効な時間形式です' : '无效的时间格式', 'warning');
        return false;
    }
    if (s[0] < 0 || s[0] > 23 || s[1] < 0 || s[1] > 59 || e[0] < 0 || e[0] > 23 || e[1] < 0 || e[1] > 59) {
        showMessage(currentLanguage === 'ja' ? '時間は00:00から23:59の間で入力してください' :
            '时间必须在00:00到23:59之间', 'warning');
        return false;
    }
    const sm = s[0] * 60 + s[1], em = e[0] * 60 + e[1];
    if (sm === em) {
        showMessage(currentLanguage === 'ja' ? '開始時間と終了時間を同じにできません' :
            '开始和结束时间不能相同', 'warning');
        return false;
    }
    let minutes = em <= sm ? (24 * 60 - sm) + em : em - sm;
    if (minutes < 15) {
        showMessage(currentLanguage === 'ja' ? 'シフトは最低15分以上必要です' :
            '班次必须至少15分钟', 'warning');
        return false;
    }
    if (minutes > 24 * 60) {
        showMessage(currentLanguage === 'ja' ? 'シフトは24時間を超えることはできません' :
            '班次不能超过24小时', 'warning');
        return false;
    }
    return true;
}

function roundHours(value, decimals = 1) {
    if (typeof value !== 'number' || !isFinite(value)) return 0;
    const factor = Math.pow(10, decimals);
    let r = Math.round((value + Number.EPSILON) * factor) / factor;
    if (Object.is(r, -0)) r = 0;
    return r;
}

function calculateShiftHours(startTime, endTime) {
    if (!startTime || !endTime) return 0;
    const s = startTime.split(':').map(Number);
    const e = endTime.split(':').map(Number);
    if (s.length !== 2 || e.length !== 2 || isNaN(s[0]) || isNaN(s[1]) || isNaN(e[0]) || isNaN(e[1])) return 0;
    const sm = s[0] * 60 + s[1], em = e[0] * 60 + e[1];
    let minutes = em <= sm ? (24 * 60 - sm) + em : em - sm;
    return roundHours(minutes / 60, 2);
}

// ==================== VIEW MANAGEMENT ====================
function switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const viewEl = document.getElementById(viewName + 'View');
    if (viewEl) viewEl.classList.add('active');
    const btn = document.querySelector(`.nav-btn[data-view="${viewName}"]`);
    if (btn) btn.classList.add('active');
    if (viewName === 'weekly') renderWeeklySchedule();
    else if (viewName === 'schedule') updateScheduleEmployeeSelect();
    else if (viewName === 'employees') renderEmployeeCards();
    localStorage.setItem('lastView', viewName);
}

// ==================== EMPLOYEE MANAGEMENT ====================
function loadEmployees() {
    if (!database) return;
    database.ref('employees').on('value', (snap) => {
        employees = [];
        const data = snap.val();
        if (data) {
            Object.keys(data).forEach(key => {
                employees.push({ id: key, name: data[key].name, position: data[key].position || '前台/服务区',
                    createdAt: data[key].createdAt });
            });
        }
        renderEmployeeCards();
        updateAllEmployeeSelects();
        renderWeeklySchedule();
    }, (error) => { console.error("Error loading employees:", error);
        showMessage("Error loading employees", "error"); });
}

function renderEmployeeCards() {
    const container = document.getElementById('employeeCards');
    if (!container) return;
    const searchInput = document.getElementById('employeeSearch');
    const term = searchInput ? searchInput.value.toLowerCase() : '';
    let filtered = employees;
    if (term) filtered = filtered.filter(e => e.name.toLowerCase().includes(term));
    if (currentPositionFilter !== 'all') filtered = filtered.filter(e => e.position === currentPositionFilter);
    if (filtered.length === 0) {
        container.innerHTML =
            `<div class="empty-state"><i class="fas fa-users"></i><p>${term || currentPositionFilter!=='all' ? (currentLanguage==='ja'?'該当するスタッフがありません':'没有找到员工') : (currentLanguage==='ja'?'スタッフがまだ登録されていません':'还没有员工')}</p><small>${currentLanguage==='ja'?'+ボタンをクリックしてスタッフを追加':'点击+按钮添加员工'}</small></div>`;
        return;
    }
    const front = filtered.filter(e => e.position === '前台/服务区');
    const kitchen = filtered.filter(e => e.position === '厨房区');
    let html = '';
    if (front.length > 0) {
        html +=
            `<div class="position-group"><h3 class="position-title" style="display:flex;align-items:center;gap:8px;margin-bottom:12px;color:var(--info);"><i class="fas fa-door-open"></i> ${currentLanguage==='ja'?'ホール':'前台'} <span class="position-count" style="font-size:12px;background:var(--info-light);color:var(--info);padding:2px 8px;border-radius:12px;">${front.length}</span></h3><div class="position-cards">${front.map(e=>generateEmployeeCard(e)).join('')}</div></div>`;
    }
    if (kitchen.length > 0) {
        html +=
            `<div class="position-group"><h3 class="position-title" style="display:flex;align-items:center;gap:8px;margin-bottom:12px;color:var(--warning);"><i class="fas fa-utensils"></i> ${currentLanguage==='ja'?'厨房':'厨房'} <span class="position-count" style="font-size:12px;background:var(--warning-light);color:var(--warning);padding:2px 8px;border-radius:12px;">${kitchen.length}</span></h3><div class="position-cards">${kitchen.map(e=>generateEmployeeCard(e)).join('')}</div></div>`;
    }
    container.innerHTML = html;
}

function getWeekPattern(employeeId, weekOffset = 0) {
    const { startDate } = getWeekDates(weekOffset);
    const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    const weekSchedule = getEmployeeSchedulesForWeek(employeeId, startDate, endDate);
    const days = generateWeekDays(startDate);
    const letters = currentLanguage === 'ja' ? ['月', '火', '水', '木', '金', '土', '日'] :
        ['一', '二', '三', '四', '五', '六', '日'];
    return days.map((day, i) => {
        const s = weekSchedule.find(w => w.date === day.dateString);
        let status = 'none', timeLabel = '';
        if (s) {
            status = s.isDayOff ? 'rest' : 'work';
            if (!s.isDayOff && s.startTime && s.endTime) timeLabel = s.startTime.substring(0, 5) + '-' + s
                .endTime.substring(0, 5);
        }
        return { letter: letters[i], status, timeLabel, dateString: day.dateString };
    });
}

function generateWeekPatternHtml(employeeId, weekOffset = 0) {
    const pattern = getWeekPattern(employeeId, weekOffset);
    return `<div class="week-pattern-strip">${pattern.map(d=>`<div class="week-pattern-dot ${d.status}" title="${d.letter}${d.timeLabel?' '+d.timeLabel:''}"><span>${d.letter}</span></div>`).join('')}</div>`;
}

function generateEmployeeCard(employee) {
    const weekly = calculateWeeklyHours(employee.id);
    const monthly = calculateMonthlyHours(employee.id);
    const ws = getThisWeekSchedule(employee.id);
    const posDisplay = currentLanguage === 'ja' ? (employee.position === '厨房区' ? '厨房' : 'ホール') :
        (employee.position === '厨房区' ? '厨房' : '前台');
    return `
    <div class="employee-card" onclick="showEmployeeDetail('${employee.id}')">
      <div class="employee-card-top">
        <div class="employee-avatar">${employee.name.charAt(0)}</div>
        <div class="employee-info">
          <div class="employee-name">${employee.name}</div>
          <div class="employee-position ${employee.position==='厨房区'?'kitchen':'front-desk'}"><i class="fas ${employee.position==='厨房区'?'fa-utensils':'fa-door-open'}"></i> ${posDisplay}</div>
          <div class="employee-stats">
            <div class="stat-item"><i class="fas fa-clock" style="color:var(--primary);"></i><span style="color:var(--gray-600);">${currentLanguage==='ja'?'今週:':'本周:'}</span><span class="stat-value">${weekly}h</span></div>
            <div class="stat-item"><i class="fas fa-calendar-alt" style="color:var(--primary);"></i><span style="color:var(--gray-600);">${currentLanguage==='ja'?'今月:':'本月:'}</span><span class="stat-value">${monthly}h</span></div>
            <div class="stat-item"><i class="fas fa-calendar-check" style="color:var(--primary);"></i><span style="color:var(--gray-600);">${ws.workDays} ${currentLanguage==='ja'?'勤務':'班'}</span></div>
          </div>
        </div>
        <div class="employee-arrow"><i class="fas fa-chevron-right"></i></div>
      </div>
      ${generateWeekPatternHtml(employee.id,0)}
    </div>`;
}

function searchEmployees() { renderEmployeeCards(); }

function filterEmployees(position) {
    currentPositionFilter = position;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.filter-btn[data-position="${position}"]`);
    if (btn) btn.classList.add('active');
    renderEmployeeCards();
}

function showEmployeeDetail(employeeId) {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;
    selectedEmployee = employeeId;
    document.getElementById('modalEmployeeName').textContent = emp.name;
    document.getElementById('modalEmployeePosition').textContent = currentLanguage === 'ja' ?
        (emp.position === '厨房区' ? '厨房' : 'ホール') :
        (emp.position === '厨房区' ? '厨房' : '前台');
    const weekly = calculateWeeklyHours(employeeId);
    const monthly = calculateMonthlyHours(employeeId);
    document.getElementById('modalWeekHours').textContent = `${weekly} ${currentLanguage==='ja'?'時間':'小时'}`;
    document.getElementById('modalMonthHours').textContent = `${monthly} ${currentLanguage==='ja'?'時間':'小时'}`;
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
    const dayNames = currentLanguage === 'ja' ? ['月','火','水','木','金','土','日'] :
        ['一','二','三','四','五','六','日'];
    container.innerHTML = days.map((day, index) => {
        const s = weekSchedule.find(w => w.date === day.dateString);
        let status = 'none', timeText = '';
        if (s) {
            status = s.isDayOff ? 'rest' : 'work';
            timeText = s.isDayOff ?
                `<div style="font-size:11px;margin-top:4px;font-weight:600;color:var(--warning);">${currentLanguage==='ja'?'休み':'休息'}</div>` :
                `<div style="font-size:11px;margin-top:4px;font-weight:600;color:var(--success);">${s.startTime.substring(0,5)}-${s.endTime.substring(0,5)}</div>`;
        }
        return `<div class="week-day ${status}"><div style="font-weight:600;color:var(--gray-700);">${dayNames[index]}</div><div style="font-size:11px;color:var(--gray-500);">${day.date}</div>${timeText}</div>`;
    }).join('');
}

function showAddEmployee() {
    document.getElementById('newEmployeeName').value = '';
    selectedPosition = '前台/服务区';
    document.querySelectorAll('.position-option').forEach(b => b.classList.remove('active'));
    const front = document.querySelector('.position-option[data-position="前台/服务区"]');
    if (front) front.classList.add('active');
    openModal('addEmployeeModal');
}

function selectPosition(button) {
    selectedPosition = button.dataset.position;
    document.querySelectorAll('.position-option').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
}

function addEmployee() {
    const nameInput = document.getElementById('newEmployeeName');
    const name = nameInput.value.trim();
    if (!name) {
        showMessage(currentLanguage === 'ja' ? '名前を入力してください' : '请输入员工姓名', 'warning');
        nameInput.focus();
        return;
    }
    if (employees.some(e => e.name.toLowerCase() === name.toLowerCase())) {
        showMessage(currentLanguage === 'ja' ? `"${name}" は既に存在します` : `"${name}" 已存在`, 'warning');
        nameInput.focus();
        return;
    }
    if (!database) {
        showMessage(currentLanguage === 'ja' ? "データベース接続エラー" : "数据库连接错误", "error");
        return;
    }
    database.ref('employees').push({
        name: name,
        position: selectedPosition,
        createdAt: Date.now()
    }).then(() => {
        closeModal('addEmployeeModal');
        showMessage(currentLanguage === 'ja' ? `スタッフ ${name} を追加しました` : `员工 ${name} 添加成功`, 'success');
        nameInput.value = '';
    }).catch(error => {
        showMessage(currentLanguage === 'ja' ? '追加失敗: ' : '添加失败: ' + error.message, 'error');
    });
}

function deleteCurrentEmployee() {
    if (!selectedEmployee) return;
    const emp = employees.find(e => e.id === selectedEmployee);
    if (!emp) return;
    const confirmMsg = currentLanguage === 'ja' ?
        `スタッフ "${emp.name}" を削除しますか？\nこのスタッフのすべてのスケジュールも削除されます！` :
        `确定要删除员工 "${emp.name}" 吗？\n该员工的所有排班记录也将被删除！`;
    if (!confirm(confirmMsg)) return;
    if (!database) {
        showMessage(currentLanguage === 'ja' ? "データベース接続エラー" : "数据库连接错误", "error");
        return;
    }
    database.ref(`employees/${selectedEmployee}`).remove()
        .then(() => {
            const schedulesRef = database.ref('schedules');
            schedulesRef.once('value', (snap) => {
                const data = snap.val();
                if (data) {
                    Object.keys(data).forEach(sid => {
                        if (data[sid].employeeId === selectedEmployee) {
                            database.ref(`schedules/${sid}`).remove();
                        }
                    });
                }
            });
            closeModal('employeeModal');
            showMessage(currentLanguage === 'ja' ? `スタッフ ${emp.name} を削除しました` : `员工 ${emp.name} 删除成功`, 'success');
            selectedEmployee = null;
        }).catch(error => {
            showMessage(currentLanguage === 'ja' ? '削除失敗: ' : '删除失败: ' + error.message, 'error');
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
    select.innerHTML = `<option value="">${currentLanguage==='ja'?'スタッフを選択':'选择员工'}</option>`;
    employees.sort((a,b) => a.name.localeCompare(b.name)).forEach(emp => {
        const pos = currentLanguage==='ja' ? (emp.position==='厨房区'?'厨房':'ホール') :
            (emp.position==='厨房区'?'厨房':'前台');
        const opt = document.createElement('option');
        opt.value = emp.id;
        opt.textContent = `${emp.name} (${pos})`;
        select.appendChild(opt);
    });
}

function updateQuickWeekEmployeeSelect() {
    const select = document.getElementById('quickWeekEmployee');
    if (!select) return;
    select.innerHTML = `<option value="">${currentLanguage==='ja'?'スタッフを選択':'选择员工'}</option>`;
    employees.sort((a,b) => a.name.localeCompare(b.name)).forEach(emp => {
        const pos = currentLanguage==='ja' ? (emp.position==='厨房区'?'厨房':'ホール') :
            (emp.position==='厨房区'?'厨房':'前台');
        const opt = document.createElement('option');
        opt.value = emp.id;
        opt.textContent = `${emp.name} (${pos})`;
        select.appendChild(opt);
    });
}

function updateRestDaysEmployeeSelect() {
    const select = document.getElementById('restDaysEmployee');
    if (!select) return;
    select.innerHTML = `<option value="">${currentLanguage==='ja'?'スタッフを選択':'选择员工'}</option>`;
    employees.sort((a,b) => a.name.localeCompare(b.name)).forEach(emp => {
        const pos = currentLanguage==='ja' ? (emp.position==='厨房区'?'厨房':'ホール') :
            (emp.position==='厨房区'?'厨房':'前台');
        const opt = document.createElement('option');
        opt.value = emp.id;
        opt.textContent = `${emp.name} (${pos})`;
        select.appendChild(opt);
    });
}

// ==================== SCHEDULE MANAGEMENT ====================
function loadSchedules() {
    if (!database) return;
    database.ref('schedules').on('value', (snap) => {
        schedules = snap.val() || {};
        renderWeeklySchedule();
        renderEmployeeCards();
    }, (error) => { console.error("Error loading schedules:", error);
        showMessage("Error loading schedules", "error"); });
}

function selectScheduleType(type) {
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.type-btn[data-type="${type}"]`);
    if (btn) btn.classList.add('active');
}

function setTimePreset(start, end) {
    document.getElementById('scheduleStart').value = start;
    document.getElementById('scheduleEnd').value = end;
    const hours = calculateShiftHours(start, end);
    showMessage(currentLanguage==='ja'?`時間設定: ${start} - ${end} (${hours}時間)`:
        `时间设置: ${start} - ${end} (${hours}小时)`, 'info');
}

function setQuickTimePreset(start, end) {
    document.getElementById('quickWeekStart').value = start;
    document.getElementById('quickWeekEnd').value = end;
    const hours = calculateShiftHours(start, end);
    showMessage(currentLanguage==='ja'?`時間設定: ${start} - ${end} (${hours}時間)`:
        `时间设置: ${start} - ${end} (${hours}小时)`, 'info');
}

function addSchedule() {
    const employeeId = document.getElementById('scheduleEmployee').value;
    const date = document.getElementById('scheduleDate').value;
    const startTime = document.getElementById('scheduleStart').value;
    const endTime = document.getElementById('scheduleEnd').value;
    const typeBtn = document.querySelector('.type-btn.active');
    const type = typeBtn ? typeBtn.dataset.type : 'work';
    if (!employeeId) {
        showMessage(currentLanguage==='ja'?'スタッフを選択してください':'请选择员工', 'warning');
        return;
    }
    if (!date) {
        showMessage(currentLanguage==='ja'?'日付を選択してください':'请选择日期', 'warning');
        return;
    }
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) {
        showMessage(currentLanguage==='ja'?'スタッフが見つかりません':'员工未找到', 'error');
        return;
    }
    if (type === 'work' && (!startTime || !endTime)) {
        showMessage(currentLanguage==='ja'?'勤務時間を入力してください':'请输入工作时间', 'warning');
        return;
    }
    if (type === 'work' && !validateTimeRange(startTime, endTime)) return;

    const scheduleData = {
        employeeId, employeeName: emp.name, employeePosition: emp.position,
        date, isDayOff: type === 'rest', updatedAt: Date.now()
    };
    if (type === 'work') {
        scheduleData.startTime = startTime;
        scheduleData.endTime = endTime;
    } else {
        scheduleData.startTime = '00:00';
        scheduleData.endTime = '00:00';
        scheduleData.notes = currentLanguage==='ja'?'休み':'休息';
    }

    if (!database) {
        showMessage(currentLanguage==='ja'?"データベース接続エラー":"数据库连接错误", "error");
        return;
    }
    const existing = findScheduleByEmployeeAndDate(employeeId, date);
    if (existing) {
        database.ref(`schedules/${existing.id}`).update(scheduleData)
            .then(() => { resetScheduleForm();
                showMessage(currentLanguage==='ja'?'スケジュールを更新しました':'排班更新成功', 'success');
                renderWeeklySchedule(); })
            .catch(error => showMessage(currentLanguage==='ja'?'更新失敗: ':'更新失败: '+error.message, 'error'));
    } else {
        scheduleData.createdAt = Date.now();
        database.ref('schedules').push().set(scheduleData)
            .then(() => { resetScheduleForm();
                showMessage(currentLanguage==='ja'?'スケジュールを追加しました':'排班添加成功', 'success');
                renderWeeklySchedule(); })
            .catch(error => showMessage(currentLanguage==='ja'?'追加失敗: ':'添加失败: '+error.message, 'error'));
    }
}

function resetScheduleForm() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('scheduleDate').value = today;
    document.getElementById('scheduleStart').value = '08:00';
    document.getElementById('scheduleEnd').value = '17:00';
    selectScheduleType('work');
}

function findScheduleByEmployeeAndDate(employeeId, date) {
    if (!schedules || typeof schedules !== 'object') return null;
    const entry = Object.entries(schedules).find(([id, s]) => s && s.employeeId === employeeId && s.date === date);
    return entry ? { id: entry[0], ...entry[1] } : null;
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
        const month = date.getMonth() + 1, dayNum = date.getDate();
        html += `<button type="button" class="weekday-btn ${day.default?'active':''}" data-day="${day.id}" data-date="${date.toISOString().split('T')[0]}" onclick="toggleWeekday(this)"><div style="font-weight:600;font-size:14px;color:var(--gray-700);">${day.label}</div><div style="font-size:12px;color:var(--gray-500);margin-top:4px;">${month}/${dayNum}</div></button>`;
    });
    container.innerHTML = html;
}

function toggleWeekday(button) { button.classList.toggle('active'); }

function setAllWeekdays() {
    document.querySelectorAll('#weekdaysSelector .weekday-btn').forEach(b => {
        b.classList.add('active');
        b.classList.remove('rest');
    });
}

function clearWeekdays() {
    document.querySelectorAll('#weekdaysSelector .weekday-btn').forEach(b => {
        b.classList.remove('active', 'rest');
    });
}

// ==================== QUICK WEEK SCHEDULE ====================
function showQuickWeekModal() {
    document.getElementById('quickWeekStart').value = '08:00';
    document.getElementById('quickWeekEnd').value = '17:00';
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
    const dayNames = currentLanguage==='ja'?['月','火','水','木','金','土','日']:
        ['一','二','三','四','五','六','日'];
    let html = '';
    weekdays.forEach((day, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        const month = date.getMonth() + 1, dayNum = date.getDate();
        const dateString = date.toISOString().split('T')[0];
        const has = checkExistingSchedule(dateString);
        html += `<button type="button" class="weekday-btn ${day.default?'active':''} ${has==='rest'?'rest':''}" data-day="${day.id}" data-date="${dateString}" onclick="toggleWeekday(this)"><div style="font-weight:600;font-size:14px;color:${has==='rest'?'var(--warning)':'var(--gray-700)'};">${dayNames[index]}</div><div style="font-size:12px;color:var(--gray-500);margin-top:4px;">${month}/${dayNum}</div>${has?`<div style="font-size:10px;margin-top:2px;color:${has==='rest'?'var(--warning)':'var(--success)'};font-weight:500;">${has==='rest'?(currentLanguage==='ja'?'休':'休'):(currentLanguage==='ja'?'予定':'已排')}</div>`:''}</button>`;
    });
    container.innerHTML = html;
}

function checkExistingSchedule(dateString) {
    if (!schedules || typeof schedules !== 'object') return '';
    const list = Object.values(schedules).filter(s => s && s.date === dateString);
    if (list.length === 0) return '';
    const empId = document.getElementById('quickWeekEmployee')?.value;
    if (empId) {
        const found = list.find(s => s.employeeId === empId);
        if (found) return found.isDayOff ? 'rest' : 'work';
    }
    return 'work';
}

function applyQuickWeekSchedule() {
    const employeeId = document.getElementById('quickWeekEmployee').value;
    const startTime = document.getElementById('quickWeekStart').value;
    const endTime = document.getElementById('quickWeekEnd').value;
    if (!employeeId) {
        showMessage(currentLanguage==='ja'?'スタッフを選択してください':'请选择员工', 'warning');
        return;
    }
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;
    const selectedDays = [], selectedDates = [], restDays = [];
    document.querySelectorAll('#weekdaysSelector .weekday-btn.active').forEach(btn => {
        const day = parseInt(btn.dataset.day);
        const dateString = btn.dataset.date;
        const isRestDay = btn.classList.contains('rest');
        selectedDays.push(day);
        selectedDates.push(dateString);
        if (isRestDay) restDays.push(dateString);
    });
    if (selectedDates.length === 0) {
        showMessage(currentLanguage==='ja'?'少なくとも1つの勤務日を選択してください':'请至少选择一个工作日', 'warning');
        return;
    }
    if (!database) {
        showMessage(currentLanguage==='ja'?"データベース接続エラー":"数据库连接错误", "error");
        return;
    }
    const promises = [];
    selectedDates.forEach(dateString => {
        const isRestDay = restDays.includes(dateString);
        const scheduleData = {
            employeeId, employeeName: emp.name, employeePosition: emp.position,
            date: dateString, isDayOff: isRestDay, updatedAt: Date.now()
        };
        if (!isRestDay) {
            if (!startTime || !endTime) {
                showMessage(currentLanguage==='ja'?'勤務時間を入力してください':'请输入工作时间', 'warning');
                return;
            }
            if (!validateTimeRange(startTime, endTime)) return;
            scheduleData.startTime = startTime;
            scheduleData.endTime = endTime;
        } else {
            scheduleData.startTime = '00:00';
            scheduleData.endTime = '00:00';
            scheduleData.notes = currentLanguage==='ja'?'休み':'休息';
        }
        const existing = findScheduleByEmployeeAndDate(employeeId, dateString);
        if (existing) {
            promises.push(database.ref(`schedules/${existing.id}`).update(scheduleData));
        } else {
            scheduleData.createdAt = Date.now();
            promises.push(database.ref('schedules').push().set(scheduleData));
        }
    });
    Promise.all(promises).then(() => {
        closeModal('quickWeekModal');
        const workDays = selectedDays.length - restDays.length;
        showMessage(currentLanguage==='ja'?`${workDays}勤務日、${restDays.length}休日を設定しました`:
            `设置${workDays}个工作日，${restDays.length}个休息日`, 'success');
        renderWeeklySchedule();
    }).catch(error => {
        showMessage(currentLanguage==='ja'?'設定失敗: ':'设置失败: '+error.message, 'error');
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
    const dayNames = currentLanguage==='ja'?['月','火','水','木','金','土','日']:
        ['一','二','三','四','五','六','日'];
    let html = '';
    weekdays.forEach((day, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        const month = date.getMonth() + 1, dayNum = date.getDate();
        html += `<button type="button" class="weekday-btn" data-day="${day.id}" data-date="${date.toISOString().split('T')[0]}" onclick="toggleRestDay(this)"><div style="font-weight:600;font-size:14px;color:var(--gray-700);">${dayNames[index]}</div><div style="font-size:12px;color:var(--gray-500);margin-top:4px;">${month}/${dayNum}</div></button>`;
    });
    container.innerHTML = html;
}

function toggleRestDay(button) { button.classList.toggle('active'); button.classList.toggle('rest'); }

function clearRestDays() {
    document.querySelectorAll('#restDaysSelector .weekday-btn').forEach(b => b.classList.remove('active','rest'));
}

function applyRestDays() {
    const employeeId = document.getElementById('restDaysEmployee').value;
    if (!employeeId) {
        showMessage(currentLanguage==='ja'?'スタッフを選択してください':'请选择员工', 'warning');
        return;
    }
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;
    const selectedDates = [];
    document.querySelectorAll('#restDaysSelector .weekday-btn.active').forEach(btn => {
        selectedDates.push(btn.dataset.date);
    });
    if (selectedDates.length === 0) {
        showMessage(currentLanguage==='ja'?'少なくとも1つの休日を選択してください':'请至少选择一个休息日', 'warning');
        return;
    }
    if (!database) {
        showMessage(currentLanguage==='ja'?"データベース接続エラー":"数据库连接错误", "error");
        return;
    }
    const promises = [];
    selectedDates.forEach(dateString => {
        const scheduleData = {
            employeeId, employeeName: emp.name, employeePosition: emp.position,
            date: dateString, isDayOff: true, startTime: '00:00', endTime: '00:00',
            notes: currentLanguage==='ja'?'休み':'休息', updatedAt: Date.now()
        };
        const existing = findScheduleByEmployeeAndDate(employeeId, dateString);
        if (existing) {
            promises.push(database.ref(`schedules/${existing.id}`).update(scheduleData));
        } else {
            scheduleData.createdAt = Date.now();
            promises.push(database.ref('schedules').push().set(scheduleData));
        }
    });
    Promise.all(promises).then(() => {
        closeModal('setRestDaysModal');
        showMessage(currentLanguage==='ja'?`${selectedDates.length}休日を設定しました`:
            `设置${selectedDates.length}个休息日`, 'success');
        renderWeeklySchedule();
    }).catch(error => {
        showMessage(currentLanguage==='ja'?'設定失敗: ':'设置失败: '+error.message, 'error');
    });
}

// ==================== WEEKLY VIEW ====================
function renderWeeklySchedule() {
    const container = document.getElementById('weeklySchedule');
    if (!container) return;
    const { startDate, endDate } = getWeekDates(currentWeek);
    const weekSchedule = getWeekSchedules(startDate, endDate);
    const days = generateWeekDays(startDate);
    const schedulesByEmployee = {};
    
    // --- Đếm số lượng Front / Kitchen mỗi ngày ---
    const dayCounts = {};
    days.forEach(day => {
        dayCounts[day.dateString] = { front: 0, kitchen: 0 };
    });
    weekSchedule.forEach(s => {
        if (s && s.employeeId && s.date && !s.isDayOff) {
            const emp = employees.find(e => e.id === s.employeeId);
            if (emp) {
                if (emp.position === '前台/服务区') dayCounts[s.date].front++;
                else if (emp.position === '厨房区') dayCounts[s.date].kitchen++;
            }
        }
        if (s && s.employeeId) {
            if (!schedulesByEmployee[s.employeeId]) schedulesByEmployee[s.employeeId] = {};
            schedulesByEmployee[s.employeeId][s.date] = s;
        }
    });

    const dayNames = currentLanguage==='ja'?['月','火','水','木','金','土','日']:
        ['一','二','三','四','五','六','日'];
    let html = `<div class="week-header"><div class="week-header-cell">${currentLanguage==='ja'?'スタッフ':'员工'}</div>`;
    
    days.forEach((day, i) => {
        const date = new Date(day.dateString);
        const month = date.getMonth()+1, dayNum = date.getDate();
        const counts = dayCounts[day.dateString] || { front: 0, kitchen: 0 };
        let countDisplay = '';
        if (counts.front > 0 || counts.kitchen > 0) {
            const frontLabel = currentLanguage === 'ja' ? 'F' : '前';
            const kitchenLabel = currentLanguage === 'ja' ? 'K' : '厨';
            countDisplay = `<div class="day-count"><span class="front-count">${frontLabel}${counts.front}</span><span class="kitchen-count">${kitchenLabel}${counts.kitchen}</span></div>`;
        }
        html += `<div class="week-header-cell">
            <div style="font-weight:700;color:var(--dark);font-size:0.7rem;">${dayNames[i]}</div>
            <div style="font-size:0.65rem;color:var(--gray-500);margin-top:1px;">${month}/${dayNum}</div>
            ${countDisplay}
        </div>`;
    });
    html += `</div>`;

    // --- Xây dựng rows theo nhóm ---
    const frontDesk = employees.filter(e => e.position === '前台/服务区');
    const kitchen = employees.filter(e => e.position === '厨房区');

    function buildRow(emp) {
        const sched = schedulesByEmployee[emp.id] || {};
        const weekly = calculateWeeklyHours(emp.id);
        const posDisplay = currentLanguage==='ja'?(emp.position==='厨房区'?'厨房':'ホール'):
            (emp.position==='厨房区'?'厨房':'前台');
        let row = `<div class="week-row"><div class="week-cell"><div style="font-weight:700;font-size:0.8rem;color:var(--dark);margin-bottom:2px;">${emp.name}</div><div style="font-size:0.7rem;color:var(--gray-500);margin-bottom:4px;">${posDisplay}</div><div style="font-size:0.65rem;color:var(--primary);font-weight:600;"><i class="fas fa-clock" style="font-size:0.6rem;margin-right:2px;"></i>${weekly}h</div></div>`;
        days.forEach(day => {
            const sc = sched[day.dateString];
            let cls = 'empty', txt = '';
            if (sc) {
                if (sc.isDayOff) { cls = 'rest'; txt = currentLanguage==='ja'?'休':'休'; }
                else { cls = 'work'; txt = `<div class="compact-time"><span>${sc.startTime?sc.startTime.substring(0,5):''}</span><span>${sc.endTime?sc.endTime.substring(0,5):''}</span></div>`; }
            }
            const title = sc ? (sc.isDayOff ? (currentLanguage==='ja'?'休み':'休息') : `${sc.startTime||''}-${sc.endTime||''}`) :
                (currentLanguage==='ja'?'クリックで追加':'点击添加');
            row += `<div class="week-cell"><div class="day-schedule-item ${cls}" onclick="editDaySchedule('${emp.id}','${day.dateString}')" title="${title}">${txt||(currentLanguage==='ja'?'追加':'加')}</div></div>`;
        });
        row += `</div>`;
        return row;
    }

    if (frontDesk.length > 0) {
        html += `<div class="week-position-header front-desk"><i class="fas fa-door-open"></i> ${currentLanguage==='ja'?'ホール':'前台'} <span class="week-position-count">${frontDesk.length}</span></div>`;
        frontDesk.forEach(emp => html += buildRow(emp));
    }
    if (kitchen.length > 0) {
        html += `<div class="week-position-header kitchen"><i class="fas fa-utensils"></i> ${currentLanguage==='ja'?'厨房':'厨房'} <span class="week-position-count">${kitchen.length}</span></div>`;
        kitchen.forEach(emp => html += buildRow(emp));
    }
    if (employees.length === 0) {
        html = `<div class="empty-state"><p>${currentLanguage==='ja'?'スケジュールデータがありません':'没有排班数据'}</p></div>`;
    }
    container.innerHTML = html;
    const weekRange = document.getElementById('weekRange');
    if (weekRange) weekRange.textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function changeWeek(direction) { currentWeek += direction; renderWeeklySchedule(); }

function editDaySchedule(employeeId, date) {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;
    const schedule = findScheduleByEmployeeAndDate(employeeId, date);
    const container = document.getElementById('editScheduleContent');
    if (!container) return;
    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString(currentLanguage==='ja'?'ja-JP':'zh-CN', { weekday: 'long' });
    container.innerHTML = `
    <div class="edit-schedule-form">
      <div class="form-group"><label>${currentLanguage==='ja'?'スタッフ':'员工'}</label><div class="employee-display"><div class="employee-avatar-small">${emp.name.charAt(0)}</div><div><div style="font-weight:700;color:var(--dark);">${emp.name}</div><div style="font-size:14px;color:var(--gray-500);">${currentLanguage==='ja'?(emp.position==='厨房区'?'厨房':'ホール'):(emp.position==='厨房区'?'厨房':'前台')}</div></div></div></div>
      <div class="form-group"><label>${currentLanguage==='ja'?'日付':'日期'}</label><div class="date-display"><div style="font-weight:700;color:var(--dark);">${formatDate(date)}</div><div style="font-size:14px;color:var(--gray-500);">${dayName}</div></div></div>
      <div class="form-group"><label>${currentLanguage==='ja'?'種類':'类型'}</label><div class="type-selector">
        <button type="button" class="type-btn ${!schedule||!schedule.isDayOff?'active':''}" onclick="setEditScheduleType('work')"><i class="fas fa-briefcase"></i><span>${currentLanguage==='ja'?'勤務':'工作'}</span></button>
        <button type="button" class="type-btn ${schedule&&schedule.isDayOff?'active':''}" onclick="setEditScheduleType('rest')"><i class="fas fa-umbrella-beach"></i><span>${currentLanguage==='ja'?'休み':'休息'}</span></button>
      </div></div>
      <div class="time-group" id="editTimeGroup" style="display:${!schedule||!schedule.isDayOff?'grid':'none'}">
        <div class="form-group"><label>${currentLanguage==='ja'?'開始時間':'开始时间'}</label><input type="time" id="editStartTime" class="input-field" value="${schedule&&!schedule.isDayOff&&schedule.startTime?schedule.startTime:'08:00'}"></div>
        <div class="form-group"><label>${currentLanguage==='ja'?'終了時間':'结束时间'}</label><input type="time" id="editEndTime" class="input-field" value="${schedule&&!schedule.isDayOff&&schedule.endTime?schedule.endTime:'17:00'}"></div>
      </div>
      <div class="action-buttons">
        <button type="button" class="btn-primary" onclick="saveDaySchedule('${employeeId}','${date}')"><i class="fas fa-save"></i> ${currentLanguage==='ja'?'保存':'保存'}</button>
        ${schedule?`<button type="button" class="btn-danger" onclick="deleteDaySchedule('${employeeId}','${date}')"><i class="fas fa-trash"></i> ${currentLanguage==='ja'?'削除':'删除'}</button>`:''}
        <button type="button" class="btn-secondary" onclick="closeModal('editModal')">${currentLanguage==='ja'?'キャンセル':'取消'}</button>
      </div>
    </div>`;
    openModal('editModal');
}

function editEmployeeSchedule() {
    if (!selectedEmployee) return;
    switchView('weekly');
    closeModal('employeeModal');
    setTimeout(() => {
        const emp = employees.find(e => e.id === selectedEmployee);
        if (!emp) return;
        const rows = document.querySelectorAll('.week-row');
        rows.forEach(row => {
            const nameCell = row.querySelector('.week-cell:first-child');
            if (nameCell && nameCell.textContent.includes(emp.name)) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                row.style.background = 'var(--primary-light)';
                setTimeout(() => { row.style.background = ''; }, 3000);
            }
        });
    }, 300);
}

function setEditScheduleType(type) {
    const timeGroup = document.getElementById('editTimeGroup');
    const btns = document.querySelectorAll('#editScheduleContent .type-btn');
    if (btns.length === 2) {
        if (type === 'work') { btns[0].classList.add('active'); btns[1].classList.remove('active'); if (timeGroup) timeGroup
                .style.display = 'grid'; } else { btns[1].classList.add('active'); btns[0].classList.remove('active'); if (
                timeGroup) timeGroup.style.display = 'none'; }
    }
}

function saveDaySchedule(employeeId, date) {
    const typeBtn = document.querySelector('#editScheduleContent .type-btn.active');
    const type = typeBtn ? typeBtn.dataset.type : 'work';
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;
    const scheduleData = {
        employeeId, employeeName: emp.name, employeePosition: emp.position,
        date, isDayOff: type === 'rest', updatedAt: Date.now()
    };
    if (type === 'work') {
        const startTime = document.getElementById('editStartTime').value;
        const endTime = document.getElementById('editEndTime').value;
        if (!startTime || !endTime) {
            showMessage(currentLanguage==='ja'?'勤務時間を入力してください':'请输入工作时间', 'warning');
            return;
        }
        if (!validateTimeRange(startTime, endTime)) return;
        scheduleData.startTime = startTime;
        scheduleData.endTime = endTime;
    } else {
        scheduleData.startTime = '00:00';
        scheduleData.endTime = '00:00';
        scheduleData.notes = currentLanguage==='ja'?'休み':'休息';
    }
    if (!database) {
        showMessage(currentLanguage==='ja'?"データベース接続エラー":"数据库连接错误", "error");
        return;
    }
    const existing = findScheduleByEmployeeAndDate(employeeId, date);
    if (existing) {
        database.ref(`schedules/${existing.id}`).update(scheduleData)
            .then(() => { closeModal('editModal');
                showMessage(currentLanguage==='ja'?'スケジュールを更新しました':'排班更新成功', 'success');
                renderWeeklySchedule(); })
            .catch(error => showMessage(currentLanguage==='ja'?'更新失敗: ':'更新失败: '+error.message, 'error'));
    } else {
        scheduleData.createdAt = Date.now();
        database.ref('schedules').push().set(scheduleData)
            .then(() => { closeModal('editModal');
                showMessage(currentLanguage==='ja'?'スケジュールを追加しました':'排班添加成功', 'success');
                renderWeeklySchedule(); })
            .catch(error => showMessage(currentLanguage==='ja'?'追加失敗: ':'添加失败: '+error.message, 'error'));
    }
}

function deleteDaySchedule(employeeId, date) {
    const confirmMsg = currentLanguage==='ja'?'このスケジュールを削除しますか？':'确定要删除这个排班吗？';
    if (!confirm(confirmMsg)) return;
    const sched = findScheduleByEmployeeAndDate(employeeId, date);
    if (!sched) return;
    if (!database) {
        showMessage(currentLanguage==='ja'?"データベース接続エラー":"数据库连接错误", "error");
        return;
    }
    database.ref(`schedules/${sched.id}`).remove()
        .then(() => { closeModal('editModal');
            showMessage(currentLanguage==='ja'?'スケジュールを削除しました':'排班删除成功', 'success');
            renderWeeklySchedule(); })
        .catch(error => showMessage(currentLanguage==='ja'?'削除失敗: ':'删除失败: '+error.message, 'error'));
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
    return { startDate: monday, endDate: sunday,
        startString: monday.toISOString().split('T')[0],
        endString: sunday.toISOString().split('T')[0] };
}

function generateWeekDays(startDate) {
    const days = [];
    const names = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        days.push({ name: names[i], date: `${date.getMonth()+1}/${date.getDate()}`,
            dateString: date.toISOString().split('T')[0], dayIndex: i });
    }
    return days;
}

function getWeekSchedules(startDate, endDate) {
    const result = [];
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    if (!schedules || typeof schedules !== 'object') return result;
    Object.values(schedules).forEach(s => {
        if (s && s.date >= startStr && s.date <= endStr) result.push(s);
    });
    return result;
}

function getEmployeeSchedulesForWeek(employeeId, startDate, endDate) {
    const result = [];
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    if (!schedules || typeof schedules !== 'object') return result;
    Object.values(schedules).forEach(s => {
        if (s && s.employeeId === employeeId && s.date >= startStr && s.date <= endStr) result.push(s);
    });
    return result;
}

function calculateWeeklyHours(employeeId) {
    const { startDate, endDate } = getWeekDates(currentWeek);
    const list = getEmployeeSchedulesForWeek(employeeId, startDate, endDate);
    let total = 0;
    list.forEach(s => { if (!s.isDayOff && s.startTime && s.endTime) total += calculateShiftHours(s.startTime, s.endTime); });
    return roundHours(total, 1);
}

function calculateMonthlyHours(employeeId) {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const firstStr = first.toISOString().split('T')[0];
    const lastStr = last.toISOString().split('T')[0];
    let total = 0;
    if (!schedules || typeof schedules !== 'object') return total;
    Object.values(schedules).forEach(s => {
        if (s && s.employeeId === employeeId && s.date >= firstStr && s.date <= lastStr && !s.isDayOff) {
            total += calculateShiftHours(s.startTime, s.endTime);
        }
    });
    return roundHours(total, 1);
}

function getThisWeekSchedule(employeeId) {
    const { startDate } = getWeekDates(0);
    const list = getEmployeeSchedulesForWeek(employeeId, startDate,
        new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000));
    const work = list.filter(s => !s.isDayOff).length;
    const rest = list.filter(s => s.isDayOff).length;
    return { workDays: work, restDays: rest, totalShifts: list.length };
}

function formatDate(date) {
    if (typeof date === 'string') date = new Date(date);
    return `${date.getMonth()+1}/${date.getDate()}`;
}

function refreshData() {
    if (!database) {
        showMessage(currentLanguage==='ja'?"データベース接続エラー":"数据库连接错误", "error");
        return;
    }
    database.ref('.info/connected').once('value').then(snap => {
        if (snap.val() === true) {
            showMessage(currentLanguage==='ja'?'データ同期完了':'数据同步完成', 'success');
            loadEmployees();
            loadSchedules();
        } else {
            showMessage(currentLanguage==='ja'?'サーバーに接続できません':'无法连接服务器', 'error');
        }
    }).catch(error => showMessage(currentLanguage==='ja'?'更新エラー: ':'刷新错误: '+error.message, 'error'));
}

// ==================== COPY TEXT FUNCTION ====================
function copyScheduleAsText() {
    if (!selectedEmployee) {
        showMessage(currentLanguage==='ja'?'スタッフを選択してください':'请先选择员工', 'warning');
        return;
    }
    const emp = employees.find(e => e.id === selectedEmployee);
    if (!emp) return;
    const { startDate, endDate } = getWeekDates(currentWeek);
    const list = getEmployeeSchedulesForWeek(selectedEmployee, startDate, endDate);
    const weekly = calculateWeeklyHours(selectedEmployee);
    const monthly = calculateMonthlyHours(selectedEmployee);
    const days = generateWeekDays(startDate);
    const dayNames = currentLanguage==='ja'?['月','火','水','木','金','土','日']:
        ['一','二','三','四','五','六','日'];
    let text = `【${emp.name} ${currentLanguage==='ja'?'スケジュール':'排班表'}】\n`;
    text += `${currentLanguage==='ja'?'職種:':'职位:'} ${currentLanguage==='ja'?(emp.position==='厨房区'?'厨房':'ホール'):(emp.position==='厨房区'?'厨房':'前台')}\n`;
    text += `${currentLanguage==='ja'?'日付:':'日期:'} ${formatDate(startDate)} ${currentLanguage==='ja'?'〜':'至'} ${formatDate(endDate)}\n`;
    text += `${currentLanguage==='ja'?'今週:':'本周:'} ${weekly}${currentLanguage==='ja'?'時間':'小时'} | ${currentLanguage==='ja'?'今月:':'本月:'} ${monthly}${currentLanguage==='ja'?'時間':'小时'}\n\n📅 ${currentLanguage==='ja'?'今週のスケジュール:':'本周排班:'}\n`;
    days.forEach((day, i) => {
        const s = list.find(w => w.date === day.dateString);
        const txt = s ? (s.isDayOff ? `🏖️ ${currentLanguage==='ja'?'休み':'休息'}` : `🕐 ${s.startTime?s.startTime.substring(0,5):''}-${s.endTime?s.endTime.substring(0,5):''}`) :
            `📭 ${currentLanguage==='ja'?'なし':'无'}`;
        text += `${dayNames[i]} (${day.date}): ${txt}\n`;
    });
    text += `\n📍 ${currentLanguage==='ja'?'勤務エリア:':'工作区域:'} ${emp.position==='厨房区'?(currentLanguage==='ja'?'厨房 👨‍🍳':'厨房 👨‍🍳'):(currentLanguage==='ja'?'ホール 💁':'前台 💁')}\n`;
    text += `📊 ${currentLanguage==='ja'?'今週:':'本周:'} ${list.filter(s=>!s.isDayOff).length}${currentLanguage==='ja'?'勤務日':'工作日'}, ${list.filter(s=>s.isDayOff).length}${currentLanguage==='ja'?'休日':'休息日'}\n`;
    text += `\n⏰ ${currentLanguage==='ja'?'生成日時:':'生成时间:'} ${new Date().toLocaleString(currentLanguage==='ja'?'ja-JP':'zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}`;
    navigator.clipboard.writeText(text).then(() => {
        showMessage(currentLanguage==='ja'?'クリップボードにコピーしました':'已复制到剪贴板', 'success');
        closeModal('employeeModal');
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy');
            showMessage(currentLanguage==='ja'?'クリップボードにコピーしました':'已复制到剪贴板', 'success'); } catch (e) { showMessage(
                currentLanguage==='ja'?'コピーに失敗しました':'复制失败', 'error'); }
        document.body.removeChild(ta);
        closeModal('employeeModal');
    });
}

// ==================== PRINT FUNCTIONS ====================
function printEmployeeSchedule() {
    if (!selectedEmployee) {
        showMessage(currentLanguage==='ja'?'スタッフを選択してください':'请先选择员工', 'warning');
        return;
    }
    const emp = employees.find(e => e.id === selectedEmployee);
    if (!emp) return;
    const { startDate, endDate } = getWeekDates(currentWeek);
    const list = getEmployeeSchedulesForWeek(selectedEmployee, startDate, endDate);
    const weekly = calculateWeeklyHours(selectedEmployee);
    const monthly = calculateMonthlyHours(selectedEmployee);
    const days = generateWeekDays(startDate);
    const dayNames = currentLanguage==='ja'?['月','火','水','木','金','土','日']:
        ['一','二','三','四','五','六','日'];

    const printContent = `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"><title>${emp.name} ${currentLanguage==='ja'?'スケジュール':'排班表'}</title>
    <style>
      body { font-family: 'Microsoft YaHei','Meiryo',sans-serif; margin:0; padding:15px; background:white; color:#333; font-size:12px; }
      .print-header { text-align:center; margin-bottom:15px; padding-bottom:10px; border-bottom:2px solid #2563eb; }
      .company-name { font-size:18px; color:#2563eb; font-weight:bold; margin-bottom:5px; }
      .employee-name { font-size:16px; font-weight:bold; margin:5px 0; }
      .info-row { display:flex; justify-content:space-between; margin:8px 0; padding:4px 0; border-bottom:1px solid #eee; }
      .info-label { color:#666; font-weight:500; }
      .info-value { font-weight:bold; color:#2563eb; }
      .schedule-table { width:100%; border-collapse:collapse; margin-top:15px; font-size:10px; }
      .schedule-table th { background:#e6f0ff; padding:8px 3px; text-align:center; border:1px solid #ddd; font-weight:bold; }
      .schedule-table td { padding:6px 2px; text-align:center; border:1px solid #ddd; vertical-align:middle; height:50px; }
      .work-day { background:#d1fae5; color:#065f46; }
      .rest-day { background:#fef3c7; color:#92400e; }
      .empty-day { background:#f8fafc; color:#94a3b8; }
      .time-display { font-size:8px; line-height:1.2; }
      .footer { margin-top:20px; text-align:center; color:#666; font-size:10px; border-top:1px solid #eee; padding-top:10px; }
      @media print { @page { margin:0.5cm; size:auto; } body { padding:10px; } .schedule-table { font-size:9px; } .schedule-table td { padding:4px 1px; height:45px; } }
      @media (max-width:600px) { .schedule-table { font-size:8px; } .schedule-table th,.schedule-table td { padding:3px 1px; } .work-day,.rest-day,.empty-day { font-size:7px; } }
    </style>
    </head><body class="single-employee-print">
    <div class="print-header"><div class="company-name">鍛治町酒場 神田店</div><div class="employee-name">${emp.name}</div>
    <div style="color:#666;font-size:11px;">${currentLanguage==='ja'?'職種:':'职位:'} ${currentLanguage==='ja'?(emp.position==='厨房区'?'厨房':'ホール'):(emp.position==='厨房区'?'厨房':'前台')}</div>
    <div style="color:#666;font-size:11px;margin-top:5px;">${currentLanguage==='ja'?'期間:':'期间:'} ${formatDate(startDate)} - ${formatDate(endDate)}</div></div>
    <div style="display:flex;justify-content:space-around;margin-bottom:15px;"><div style="text-align:center;"><div style="font-size:14px;color:#2563eb;font-weight:bold;">${weekly}</div><div style="font-size:10px;color:#666;">${currentLanguage==='ja'?'今週時間':'本周工时'}</div></div><div style="text-align:center;"><div style="font-size:14px;color:#2563eb;font-weight:bold;">${monthly}</div><div style="font-size:10px;color:#666;">${currentLanguage==='ja'?'今月時間':'本月工时'}</div></div></div>
    <table class="schedule-table"><thead><tr><th style="width:12%;">${currentLanguage==='ja'?'曜日':'星期'}</th><th style="width:15%;">${currentLanguage==='ja'?'日付':'日期'}</th><th style="width:15%;">${currentLanguage==='ja'?'状態':'状态'}</th><th style="width:30%;">${currentLanguage==='ja'?'時間':'时间'}</th><th style="width:15%;">${currentLanguage==='ja'?'時間数':'小时数'}</th></tr></thead><tbody>
    ${days.map(day => {
        const s = list.find(w => w.date === day.dateString);
        let cls='empty-day', status='', timeDisplay='', hours='';
        if (s) {
            if (s.isDayOff) { cls='rest-day'; status=currentLanguage==='ja'?'休み':'休息'; }
            else { cls='work-day'; status=currentLanguage==='ja'?'勤務':'工作'; timeDisplay=`${s.startTime?s.startTime.substring(0,5):''}<br>${s.endTime?s.endTime.substring(0,5):''}`; hours=calculateShiftHours(s.startTime,s.endTime)+'h'; }
        } else { status=currentLanguage==='ja'?'なし':'无'; }
        const dateParts = day.date.split('/');
        const month = dateParts[0], dayNum = dateParts[1];
        return `<tr><td>${dayNames[day.dayIndex]}</td><td>${month}/${dayNum}</td><td class="${cls}">${status}</td><td>${timeDisplay}</td><td>${hours}</td></tr>`;
    }).join('')}
    </tbody></table>
    <div class="footer">${currentLanguage==='ja'?'印刷日:':'打印日期:'} ${new Date().toLocaleDateString(currentLanguage==='ja'?'ja-JP':'zh-CN')}</div>
    </body></html>`;
    try {
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(printContent);
            win.document.close();
            setTimeout(() => { win.print();
                setTimeout(() => win.close(), 500); }, 500);
            showMessage(currentLanguage==='ja'?'印刷プレビューを開いています...':'正在打开打印预览...', 'info');
            closeModal('employeeModal');
        }
    } catch (e) { showMessage(currentLanguage==='ja'?'印刷エラー: ':'打印错误: '+e.message, 'error'); }
}

function printAllSchedule() {
    const { startDate, endDate } = getWeekDates(currentWeek);
    const weekSchedule = getWeekSchedules(startDate, endDate);
    const days = generateWeekDays(startDate);
    const dayNames = currentLanguage==='ja'?['月','火','水','木','金','土','日']:
        ['一','二','三','四','五','六','日'];

    const schedulesByEmployee = {};
    weekSchedule.forEach(s => {
        if (s && s.employeeId) {
            if (!schedulesByEmployee[s.employeeId]) schedulesByEmployee[s.employeeId] = {};
            schedulesByEmployee[s.employeeId][s.date] = s;
        }
    });

    function renderGroup(label, groupEmployees) {
        if (groupEmployees.length === 0) return '';
        let html = `<tr class="position-band-row"><td colspan="${days.length+1}" style="background:#e6f0ff;color:#1e40af;font-weight:bold;text-align:left;padding-left:6px;font-size:9px;">${label}</td></tr>`;
        groupEmployees.forEach(emp => {
            const sched = schedulesByEmployee[emp.id] || {};
            const weekly = calculateWeeklyHours(emp.id);
            const posDisplay = currentLanguage==='ja'?(emp.position==='厨房区'?'厨房':'ホール'):
                (emp.position==='厨房区'?'厨房':'前台');
            html += `<tr><td style="text-align:left;padding-left:5px;font-weight:bold;font-size:9px;"><div>${emp.name}</div><div style="font-size:7px;color:#666;">${posDisplay}</div><div style="font-size:7px;color:#2563eb;font-weight:bold;">${weekly}h</div></td>`;
            days.forEach(day => {
                const sc = sched[day.dateString];
                let cls = 'empty-cell', content = '<div style="font-size:7px;color:#cbd5e1;">-</div>';
                if (sc) {
                    if (sc.isDayOff) { cls = 'rest-cell'; content =
                            `<div style="font-size:8px;font-weight:bold;">${currentLanguage==='ja'?'休':'休'}</div>`; } else {
                        cls = 'work-cell';
                        const hours = calculateShiftHours(sc.startTime, sc.endTime);
                        content =
                            `<div class="time-display"><div>${sc.startTime?sc.startTime.substring(0,5):''}</div><div>${sc.endTime?sc.endTime.substring(0,5):''}</div><div style="font-weight:bold;">${hours}h</div></div>`;
                    }
                }
                html += `<td class="${cls}">${content}</td>`;
            });
            html += `</tr>`;
        });
        return html;
    }

    const front = employees.filter(e => e.position === '前台/服务区');
    const kitchen = employees.filter(e => e.position === '厨房区');

    const printContent = `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"><title>${currentLanguage==='ja'?'週間勤務表':'每周排班表'}</title>
    <style>
      body { font-family: 'Microsoft YaHei','Meiryo',sans-serif; margin:10px; font-size:10px; background:white; }
      .print-header { text-align:center; margin-bottom:15px; padding-bottom:10px; border-bottom:2px solid #2563eb; }
      .company-name { font-size:16px; color:#2563eb; font-weight:bold; margin-bottom:5px; }
      .schedule-table { width:100%; border-collapse:collapse; margin-top:15px; }
      .schedule-table th { background:#e6f0ff; padding:6px 3px; text-align:center; border:1px solid #ddd; font-weight:bold; font-size:9px; }
      .schedule-table td { padding:6px 3px; text-align:center; border:1px solid #ddd; vertical-align:top; font-size:8px; }
      .work-cell { background:#d1fae5; color:#065f46; }
      .rest-cell { background:#fef3c7; color:#92400e; }
      .empty-cell { background:#f8fafc; color:#94a3b8; }
      .time-display { font-size:7px; line-height:1.1; }
      .position-band-row td { background:#e6f0ff !important; color:#1e40af !important; font-weight:bold; text-align:left; padding-left:6px; font-size:9px; }
      @media print { @page { margin:0.3cm; size:landscape; } body { padding:5px; } }
      @media (max-width:600px) { .schedule-table th,.schedule-table td { padding:4px 2px; font-size:7px; } .work-cell,.rest-cell,.empty-cell { font-size:6px; } .time-display { font-size:6px; } }
    </style>
    </head><body>
    <div class="print-header"><div class="company-name">鍛治町酒場 神田店</div><div style="color:#666;font-size:11px;">${currentLanguage==='ja'?'期間:':'期间:'} ${formatDate(startDate)} - ${formatDate(endDate)}</div></div>
    <table class="schedule-table"><thead><tr><th style="width:100px;min-width:80px;">${currentLanguage==='ja'?'スタッフ':'员工'}</th>`;
    days.forEach((day,i) => {
        const date = new Date(day.dateString);
        const month = date.getMonth()+1, dayNum = date.getDate();
        printContent += `<th style="min-width:50px;"><div style="font-weight:bold;font-size:9px;">${dayNames[i]}</div><div style="font-size:8px;color:#666;">${month}/${dayNum}</div></th>`;
    });
    printContent += `</tr></thead><tbody>`;
    printContent += renderGroup(currentLanguage==='ja'?'ホール':'前台', front);
    printContent += renderGroup(currentLanguage==='ja'?'厨房':'厨房', kitchen);
    printContent += `</tbody></table>
    <div style="text-align:center;margin-top:20px;color:#999;font-size:9px;">${currentLanguage==='ja'?'印刷日:':'打印日期:'} ${new Date().toLocaleDateString(currentLanguage==='ja'?'ja-JP':'zh-CN')}</div>
    </body></html>`;

    const win = window.open('', '_blank');
    if (win) {
        win.document.write(printContent);
        win.document.close();
        setTimeout(() => { win.print();
            setTimeout(() => win.close(), 500); }, 500);
        showMessage(currentLanguage==='ja'?'週間勤務表を印刷しました':'每周排班表打印成功', 'success');
    }
}

// ==================== QUICK ACTIONS ====================
function showTodaySchedule() {
    const today = new Date().toISOString().split('T')[0];
    const todaySchedules = Object.values(schedules).filter(s => s && s.date === today);
    const container = document.getElementById('todayList');
    if (!container) return;
    if (todaySchedules.length === 0) {
        container.innerHTML =
            `<div class="empty-state"><i class="fas fa-calendar-day"></i><p>${currentLanguage==='ja'?'今日のシフトはありません':'今天没有排班'}</p><small>${currentLanguage==='ja'?'「シフト登録」ページで追加':'在"排班"页面添加'}</small></div>`;
        openModal('todayModal');
        return;
    }
    const front = todaySchedules.filter(s => s.employeePosition === '前台/服务区');
    const kitchen = todaySchedules.filter(s => s.employeePosition === '厨房区');
    let html = '';
    if (front.length > 0) {
        html += `<h4 style="margin-bottom:16px;color:#2563eb;font-weight:700;"><i class="fas fa-door-open"></i> ${currentLanguage==='ja'?'ホール':'前台'}</h4>`;
        html += front.map(s => createTodayItem(s)).join('');
    }
    if (kitchen.length > 0) {
        html += `<h4 style="margin-top:24px;margin-bottom:16px;color:#f59e0b;font-weight:700;"><i class="fas fa-utensils"></i> ${currentLanguage==='ja'?'厨房':'厨房'}</h4>`;
        html += kitchen.map(s => createTodayItem(s)).join('');
    }
    container.innerHTML = html;
    openModal('todayModal');
}

function createTodayItem(schedule) {
    const pos = currentLanguage==='ja'?(schedule.employeePosition==='厨房区'?'厨房':'ホール'):
        (schedule.employeePosition==='厨房区'?'厨房':'前台');
    return `<div class="today-item ${schedule.isDayOff?'rest':'work'}"><div><div style="font-weight:700;color:var(--dark);">${schedule.employeeName}</div><div style="font-size:13px;color:var(--gray-500);font-weight:500;">${pos}</div></div><div style="text-align:right;"><div style="font-weight:700;color:${schedule.isDayOff?'var(--warning)':'var(--success)'};">${schedule.isDayOff?(currentLanguage==='ja'?'休み':'休息'):`${schedule.startTime?schedule.startTime.substring(0,5):''} - ${schedule.endTime?schedule.endTime.substring(0,5):''}`}</div>${!schedule.isDayOff?`<div style="font-size:12px;color:var(--gray-500);font-weight:500;">${currentLanguage==='ja'?'時間:':'时间:'} ${calculateShiftHours(schedule.startTime,schedule.endTime)}h</div>`:''}</div></div>`;
}

function showStats() {
    const container = document.getElementById('statsGrid');
    if (!container) return;
    let totalWeekHours = 0;
    employees.forEach(emp => { totalWeekHours += calculateWeeklyHours(emp.id); });
    totalWeekHours = roundHours(totalWeekHours, 1);
    const totalEmployees = employees.length;
    const totalSchedules = Object.keys(schedules).length;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayShifts = Object.values(schedules).filter(s => s && s.date === todayStr && !s.isDayOff).length;
    const monthHours = roundHours(employees.reduce((sum, emp) => sum + calculateMonthlyHours(emp.id), 0), 1);
    const frontCount = employees.filter(e => e.position === '前台/服务区').length;
    const kitchenCount = employees.filter(e => e.position === '厨房区').length;
    const avgWeek = roundHours(totalWeekHours / (employees.length || 1), 1);
    container.innerHTML = `
    <div class="stat-card"><h4>${totalEmployees}</h4><p>${currentLanguage==='ja'?'スタッフ数':'员工总数'}</p></div>
    <div class="stat-card"><h4>${totalSchedules}</h4><p>${currentLanguage==='ja'?'総スケジュール':'总排班数'}</p></div>
    <div class="stat-card"><h4>${todayShifts}</h4><p>${currentLanguage==='ja'?'今日のシフト':'今日班次'}</p></div>
    <div class="stat-card"><h4>${totalWeekHours}h</h4><p>${currentLanguage==='ja'?'今週の時間':'本周工时'}</p></div>
    <div class="stat-card"><h4>${monthHours}h</h4><p>${currentLanguage==='ja'?'今月の時間':'本月工时'}</p></div>
    <div class="stat-card"><h4>${frontCount}</h4><p>${currentLanguage==='ja'?'ホール':'前台'}</p></div>
    <div class="stat-card"><h4>${kitchenCount}</h4><p>${currentLanguage==='ja'?'厨房':'厨房'}</p></div>
    <div class="stat-card"><h4>${avgWeek}h</h4><p>${currentLanguage==='ja'?'平均週時間':'平均周工时'}</p></div>
    `;
    openModal('statsModal');
}

// ==================== SETUP EVENT LISTENERS ====================
function setupEventListeners() {
    const langBtn = document.getElementById('languageSwitch');
    if (langBtn) {
        langBtn.addEventListener('click', function() {
            currentLanguage = currentLanguage === 'ja' ? 'zh' : 'ja';
            updateLanguage();
            localStorage.setItem('appLanguage', currentLanguage);
        });
    }
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) closeModal(e.target.id);
    });
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key.toLowerCase()) {
                case 'e': if (selectedEmployee) { editEmployeeSchedule(); e.preventDefault(); } break;
                case 'p': if (selectedEmployee) { printEmployeeSchedule(); e.preventDefault(); } break;
                case 'c': if (selectedEmployee) { copyScheduleAsText(); e.preventDefault(); } break;
                case 's': refreshData(); e.preventDefault(); break;
            }
        }
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal[style*="display: flex"]');
            if (openModal) closeModal(openModal.id);
        }
    });
    window.addEventListener('beforeunload', function() {
        const active = document.querySelector('.view.active');
        if (active) localStorage.setItem('lastView', active.id.replace('View',''));
        localStorage.setItem('appLanguage', currentLanguage);
    });
    const savedView = localStorage.getItem('lastView');
    if (savedView) setTimeout(() => switchView(savedView), 100);
}

// ==================== ERROR HANDLING ====================
window.onerror = function(msg, url, line, col, error) {
    console.error('JavaScript Error:', msg, '\nURL:', url, '\nLine:', line, '\nColumn:', col, '\nError:', error);
    showMessage(currentLanguage==='ja'?'エラーが発生しました、ページを更新して再試行してください':'发生错误，请刷新页面重试', 'error');
    return false;
};

// ==================== LOADING SCREEN HIDE ====================
setTimeout(() => {
    const loading = document.getElementById('loadingScreen');
    if (loading) loading.style.display = 'none';
}, 500);

console.log("✅ 鍛治町酒場 神田店 勤務表システム完全起動");

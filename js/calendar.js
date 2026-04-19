/* Extracted from app.js */
var CALENDAR_EVENTS = [
  // 第一学期 (2025年9月-2026年1月)
  {title:'老生返校报到',date:'2025-09-01',endDate:'2025-09-02',category:'teaching',description:'在校生返校注册报到'},
  {title:'新生报到',date:'2025-09-03',endDate:'2025-09-04',category:'teaching',description:'2025级新生入学报到'},
  {title:'开学典礼',date:'2025-09-05',category:'activity',description:'2025-2026学年开学典礼'},
  {title:'正式上课',date:'2025-09-08',category:'teaching',description:'第一学期正式开始上课'},
  {title:'教师节',date:'2025-09-10',category:'holiday',description:'教师节'},
  {title:'社团招新',date:'2025-09-15',endDate:'2025-09-30',category:'activity',description:'各学生社团纳新活动'},
  {title:'国庆节放假',date:'2025-10-01',endDate:'2025-10-07',category:'holiday',description:'国庆节假期'},
  {title:'调休补课',date:'2025-10-08',category:'teaching',description:'调休补周三的课',isAdjusted:true,adjustmentNote:'补9月28日（周日）的课'},
  {title:'校运动会',date:'2025-10-18',endDate:'2025-10-19',category:'activity',description:'校秋季田径运动会'},
  {title:'期中考试',date:'2025-11-01',endDate:'2025-11-15',category:'teaching',description:'第一学期期中考试'},
  {title:'元旦晚会',date:'2025-12-28',category:'activity',description:'跨年元旦晚会'},
  {title:'元旦放假',date:'2026-01-01',category:'holiday',description:'元旦假期'},
  {title:'期末考试',date:'2026-01-05',endDate:'2026-01-16',category:'teaching',description:'第一学期期末考试'},
  {title:'放寒假',date:'2026-01-17',category:'teaching',description:'寒假开始'},
  // 第二学期 (2026年2月-7月)
  {title:'学生返校报到',date:'2026-02-21',endDate:'2026-02-22',category:'teaching',description:'在校生返校注册报到'},
  {title:'正式上课',date:'2026-02-23',category:'teaching',description:'第二学期正式开始上课'},
  {title:'妇女节',date:'2026-03-08',category:'holiday',description:'国际妇女节'},
  {title:'植树节',date:'2026-03-12',category:'activity',description:'义务植树活动'},
  {title:'清明节放假',date:'2026-04-04',endDate:'2026-04-06',category:'holiday',description:'清明节假期'},
  {title:'科技文化节',date:'2026-04-13',endDate:'2026-04-18',category:'activity',description:'校园科技文化节'},
  {title:'期中考试',date:'2026-04-20',endDate:'2026-04-30',category:'teaching',description:'第二学期期中考试'},
  {title:'劳动节放假',date:'2026-05-01',endDate:'2026-05-05',category:'holiday',description:'劳动节假期'},
  {title:'端午节放假',date:'2026-05-31',endDate:'2026-06-02',category:'holiday',description:'端午节假期'},
  {title:'四六级考试',date:'2026-06-13',category:'competition',description:'全国大学英语四六级考试'},
  {title:'期末考试',date:'2026-06-22',endDate:'2026-07-04',category:'teaching',description:'第二学期期末考试'},
  {title:'放暑假',date:'2026-07-06',category:'teaching',description:'暑假开始'}
];

/* 事件类别配置 */
var CAL_CATEGORIES = {
  teaching:    {label:'教学安排', color:'#16a34a', icon:svgIcon('check-circle',16)},
  holiday:     {label:'节假日',   color:'#dc2626', icon:svgIcon('alert',16)},
  activity:    {label:'校园活动', color:'#2563eb', icon:svgIcon('bell',16)},
  competition: {label:'竞赛相关', color:'#d97706', icon:svgIcon('calendar',16)}
};

/* 日历状态 */
var calState = {
  semester: 1,       // 1=第一学期, 2=第二学期
  year: 2025,
  month: 9,          // 当前显示月份
  viewMode: 'calendar', // 'calendar' 或 'list'
  filterCategory: null  // null=全部, 或 'teaching'/'holiday'/'activity'/'competition'
};

/* 星期名称 */
var CAL_WEEKDAYS = ['日','一','二','三','四','五','六'];

/* 判断日期字符串是否在事件范围内 */
function calDateInRange(dateStr, event) {
  var d = dateStr;
  var s = event.date;
  var e = event.endDate || event.date;
  return d >= s && d <= e;
}

/* 获取某天的事件列表 */
function calGetEventsForDate(dateStr) {
  var filtered = CALENDAR_EVENTS.filter(function(ev) {
    if (calState.filterCategory && ev.category !== calState.filterCategory) return false;
    return calDateInRange(dateStr, ev);
  });
  return filtered;
}

/* 获取某天的事件类别（用于显示彩色点） */
function calGetCategoriesForDate(dateStr) {
  var cats = {};
  CALENDAR_EVENTS.forEach(function(ev) {
    if (calState.filterCategory && ev.category !== calState.filterCategory) return;
    if (calDateInRange(dateStr, ev)) {
      cats[ev.category] = true;
    }
  });
  return Object.keys(cats);
}

/* 格式化日期为 YYYY-MM-DD */
function calFormatDate(y, m, d) {
  return y + '-' + (m < 10 ? '0' + m : m) + '-' + (d < 10 ? '0' + d : d);
}

/* 获取月份天数 */
function calDaysInMonth(y, m) {
  return new Date(y, m, 0).getDate();
}

/* 获取月份第一天是星期几 (0=日) */
function calFirstDayOfMonth(y, m) {
  return new Date(y, m - 1, 1).getDay();
}

/* 中文星期 */
function calChineseWeekday(dateStr) {
  var d = new Date(dateStr);
  return '周' + CAL_WEEKDAYS[d.getDay()];
}

/* 渲染日历主函数 */
function renderCalendar() {
  var container = document.getElementById('academicContent');
  if (!container) return;

  // 根据当前学期确定默认月份
  if (calState.semester === 1) {
    // 第一学期: 2025年9月 - 2026年1月
    if (calState.year !== 2025 || (calState.month < 9 && calState.year === 2025) || (calState.month > 1 && calState.year === 2026)) {
      calState.year = 2025;
      calState.month = 9;
    }
  } else {
    // 第二学期: 2026年2月 - 2026年7月
    if (calState.year !== 2026 || calState.month < 2 || calState.month > 7) {
      calState.year = 2026;
      calState.month = 2;
    }
  }

  var html = '<div class="cal-container">';

  // 头部：标题 + 学期切换
  html += '<div class="cal-header">';
  html += '<div class="cal-title">2025-2026学年</div>';
  html += '<div class="cal-semester-tabs">';
  html += '<button class="cal-semester-tab' + (calState.semester === 1 ? ' active' : '') + '" onclick="calSwitchSemester(1)">第一学期</button>';
  html += '<button class="cal-semester-tab' + (calState.semester === 2 ? ' active' : '') + '" onclick="calSwitchSemester(2)">第二学期</button>';
  html += '</div>';
  html += '</div>';

  // 视图切换按钮
  html += '<div class="cal-view-toggle">';
  html += '<button class="cal-view-btn' + (calState.viewMode === 'calendar' ? ' active' : '') + '" onclick="calSwitchView(\'calendar\')">日历视图</button>';
  html += '<button class="cal-view-btn' + (calState.viewMode === 'list' ? ' active' : '') + '" onclick="calSwitchView(\'list\')">列表视图</button>';
  html += '</div>';

  // 月份导航
  html += '<div class="cal-month-nav" style="margin-bottom:12px">';
  html += '<button class="cal-month-btn" onclick="calPrevMonth()">&#8249;</button>';
  html += '<span class="cal-month-label">' + calState.year + '年' + calState.month + '月</span>';
  html += '<button class="cal-month-btn" onclick="calNextMonth()">&#8250;</button>';
  html += '</div>';

  // 日历网格或列表视图
  if (calState.viewMode === 'calendar') {
    html += renderCalGrid();
  } else {
    html += renderCalListView();
  }

  // 图例
  html += renderCalLegend();

  // 近期事项
  html += renderCalUpcoming();

  html += '</div>';

  container.innerHTML = html;

  // 淡入动画
  var wrapper = container.querySelector('.cal-grid-wrapper');
  if (wrapper) {
    wrapper.classList.add('cal-fade-enter');
    requestAnimationFrame(function() {
      wrapper.classList.add('cal-fade-active');
    });
  }
}

/* 渲染日历网格 */
function renderCalGrid() {
  var y = calState.year, m = calState.month;
  var daysInMonth = calDaysInMonth(y, m);
  var firstDay = calFirstDayOfMonth(y, m);
  var today = new Date();
  var todayStr = calFormatDate(today.getFullYear(), today.getMonth() + 1, today.getDate());

  var html = '<div class="cal-grid-wrapper"><div class="cal-grid">';

  // 星期标题行
  CAL_WEEKDAYS.forEach(function(wd) {
    html += '<div class="cal-weekday">' + wd + '</div>';
  });

  // 上月补齐
  var prevMonth = m === 1 ? 12 : m - 1;
  var prevYear = m === 1 ? y - 1 : y;
  var prevDays = calDaysInMonth(prevYear, prevMonth);
  for (var i = firstDay - 1; i >= 0; i--) {
    var pd = prevDays - i;
    var pDateStr = calFormatDate(prevYear, prevMonth, pd);
    var pCats = calGetCategoriesForDate(pDateStr);
    html += '<div class="cal-cell other-month' + (pCats.length ? ' has-events' : '') + '" onclick="calCellClick(\'' + pDateStr + '\')">';
    html += '<span class="cal-date">' + pd + '</span>';
    if (pCats.length) {
      html += '<div class="cal-dots">';
      pCats.forEach(function(c) { html += '<span class="cal-dot" style="background:' + CAL_CATEGORIES[c].color + '"></span>'; });
      html += '</div>';
    }
    html += '</div>';
  }

  // 当月日期
  for (var d = 1; d <= daysInMonth; d++) {
    var dateStr = calFormatDate(y, m, d);
    var cats = calGetCategoriesForDate(dateStr);
    var isToday = dateStr === todayStr;
    html += '<div class="cal-cell' + (isToday ? ' today' : '') + (cats.length ? ' has-events' : '') + '" onclick="calCellClick(\'' + dateStr + '\')">';
    html += '<span class="cal-date">' + d + '</span>';
    if (cats.length) {
      html += '<div class="cal-dots">';
      cats.forEach(function(c) { html += '<span class="cal-dot" style="background:' + CAL_CATEGORIES[c].color + '"></span>'; });
      html += '</div>';
    }
    html += '</div>';
  }

  // 下月补齐
  var totalCells = firstDay + daysInMonth;
  var remaining = (7 - totalCells % 7) % 7;
  var nextMonth = m === 12 ? 1 : m + 1;
  var nextYear = m === 12 ? y + 1 : y;
  for (var j = 1; j <= remaining; j++) {
    var nDateStr = calFormatDate(nextYear, nextMonth, j);
    var nCats = calGetCategoriesForDate(nDateStr);
    html += '<div class="cal-cell other-month' + (nCats.length ? ' has-events' : '') + '" onclick="calCellClick(\'' + nDateStr + '\')">';
    html += '<span class="cal-date">' + j + '</span>';
    if (nCats.length) {
      html += '<div class="cal-dots">';
      nCats.forEach(function(c) { html += '<span class="cal-dot" style="background:' + CAL_CATEGORIES[c].color + '"></span>'; });
      html += '</div>';
    }
    html += '</div>';
  }

  html += '</div></div>';
  return html;
}

/* 渲染列表视图 */
function renderCalListView() {
  var y = calState.year, m = calState.month;
  var daysInMonth = calDaysInMonth(y, m);
  var html = '<div class="cal-event-list">';

  var hasEvents = false;
  for (var d = 1; d <= daysInMonth; d++) {
    var dateStr = calFormatDate(y, m, d);
    var events = calGetEventsForDate(dateStr);
    if (events.length === 0) continue;
    hasEvents = true;

    events.forEach(function(ev) {
      var cat = CAL_CATEGORIES[ev.category] || CAL_CATEGORIES.teaching;
      var dateObj = new Date(dateStr);
      html += '<div class="cal-event-list-item">';
      html += '<div class="cal-event-list-date">';
      html += '<div class="cal-event-list-day">' + dateObj.getDate() + '</div>';
      html += '<div class="cal-event-list-month">' + (dateObj.getMonth() + 1) + '月</div>';
      html += '</div>';
      html += '<div class="cal-event-list-info">';
      html += '<div class="cal-event-list-title">' + esc(ev.title) + '</div>';
      html += '<div class="cal-event-list-desc">' + esc(ev.description) + '</div>';
      html += '<span class="cal-event-list-category" style="background:' + cat.color + '18;color:' + cat.color + '">' + cat.label + '</span>';
      html += '</div></div>';
    });
  }

  if (!hasEvents) {
    html += '<div class="cal-upcoming-empty">本月暂无安排</div>';
  }

  html += '</div>';
  return html;
}

/* 渲染图例 */
function renderCalLegend() {
  var html = '<div class="cal-legend">';
  Object.keys(CAL_CATEGORIES).forEach(function(key) {
    var cat = CAL_CATEGORIES[key];
    var isActive = !calState.filterCategory || calState.filterCategory === key;
    var isFiltered = calState.filterCategory && calState.filterCategory !== key;
    html += '<div class="cal-legend-item' + (calState.filterCategory === key ? ' active' : '') + (isFiltered ? ' inactive' : '') + '" onclick="calToggleFilter(\'' + key + '\')">';
    html += '<span class="cal-legend-dot" style="background:' + cat.color + '"></span>';
    html += '<span>' + cat.icon + ' ' + cat.label + '</span>';
    html += '</div>';
  });
  html += '</div>';
  return html;
}

/* 渲染近期事项（未来7天） */
function renderCalUpcoming() {
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var upcoming = [];

  for (var i = 0; i <= 7; i++) {
    var d = new Date(today);
    d.setDate(d.getDate() + i);
    var dateStr = calFormatDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
    var events = calGetEventsForDate(dateStr);
    events.forEach(function(ev) {
      upcoming.push({event: ev, date: dateStr, dateObj: d});
    });
  }

  var html = '<div class="cal-upcoming">';
  html += '<div class="cal-upcoming-title">'+svgIcon('calendar',18)+' 近期事项</div>';

  if (upcoming.length === 0) {
    html += '<div class="cal-upcoming-empty">未来7天暂无安排</div>';
  } else {
    upcoming.forEach(function(item) {
      var cat = CAL_CATEGORIES[item.event.category] || CAL_CATEGORIES.teaching;
      var dateLabel = (item.dateObj.getMonth() + 1) + '月' + item.dateObj.getDate() + '日 ' + calChineseWeekday(item.date);
      html += '<div class="cal-upcoming-item">';
      html += '<span class="cal-upcoming-dot" style="background:' + cat.color + '"></span>';
      html += '<div class="cal-upcoming-info">';
      html += '<div class="cal-upcoming-title-text">' + esc(item.event.title) + '</div>';
      html += '<div class="cal-upcoming-date-text">' + dateLabel + ' - ' + esc(item.event.description) + '</div>';
      html += '</div></div>';
    });
  }

  html += '</div>';
  return html;
}

/* 切换学期 */
function calSwitchSemester(sem) {
  calState.semester = sem;
  if (sem === 1) {
    calState.year = 2025;
    calState.month = 9;
  } else {
    calState.year = 2026;
    calState.month = 2;
  }
  renderCalendar();
}

/* 上一月 */
function calPrevMonth() {
  calState.month--;
  if (calState.month < 1) {
    calState.month = 12;
    calState.year--;
  }
  renderCalendar();
}

/* 下一月 */
function calNextMonth() {
  calState.month++;
  if (calState.month > 12) {
    calState.month = 1;
    calState.year++;
  }
  renderCalendar();
}

/* 切换视图模式 */
function calSwitchView(mode) {
  calState.viewMode = mode;
  renderCalendar();
}

/* 切换类别筛选 */
function calToggleFilter(category) {
  if (calState.filterCategory === category) {
    calState.filterCategory = null; // 取消筛选
  } else {
    calState.filterCategory = category;
  }
  renderCalendar();
}

/* 点击日期单元格 - 显示事件详情弹窗 */
function calCellClick(dateStr) {
  var events = calGetEventsForDate(dateStr);
  if (events.length === 0) return;

  var dateObj = new Date(dateStr);
  var dateLabel = (dateObj.getMonth() + 1) + '月' + dateObj.getDate() + '日 ' + calChineseWeekday(dateStr);

  var html = '<div class="cal-popup-overlay" id="calPopupOverlay" onclick="calClosePopup(event)">';
  html += '<div class="cal-popup">';
  html += '<button class="cal-popup-close" onclick="calClosePopup()">&times;</button>';
  html += '<div class="cal-popup-date">' + dateLabel + '</div>';

  events.forEach(function(ev) {
    var cat = CAL_CATEGORIES[ev.category] || CAL_CATEGORIES.teaching;
    html += '<div class="cal-popup-event">';
    html += '<span class="cal-popup-event-dot" style="background:' + cat.color + '"></span>';
    html += '<div>';
    html += '<div class="cal-popup-event-title">' + esc(ev.title) + '</div>';
    html += '<div class="cal-popup-event-desc">' + esc(ev.description) + '</div>';
    if (ev.endDate && ev.endDate !== ev.date) {
      html += '<div class="cal-popup-event-desc">' + ev.date + ' ~ ' + ev.endDate + '</div>';
    }
    if (ev.isAdjusted && ev.adjustmentNote) {
      html += '<div class="cal-popup-event-desc" style="color:var(--accent)">' + esc(ev.adjustmentNote) + '</div>';
    }
    if (ev.category === 'competition') {
      html += '<button class="cal-popup-event-btn" onclick="calClosePopup();navigate(\'competition\')">查看竞赛</button>';
    }
    html += '</div></div>';
  });

  html += '</div></div>';

  // 移除旧弹窗
  var old = document.getElementById('calPopupOverlay');
  if (old) old.remove();

  // 插入弹窗
  document.body.insertAdjacentHTML('beforeend', html);

  // 触发动画
  requestAnimationFrame(function() {
    var overlay = document.getElementById('calPopupOverlay');
    if (overlay) overlay.classList.add('show');
  });
}

/* 关闭弹窗 */
function calClosePopup(e) {
  if (e && e.target && !e.target.classList.contains('cal-popup-overlay')) return;
  var overlay = document.getElementById('calPopupOverlay');
  if (overlay) {
    overlay.classList.remove('show');
    setTimeout(function() { overlay.remove(); }, 200);
  }
}

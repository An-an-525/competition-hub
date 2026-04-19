/* Admin Review System v2 */

async function renderAdminV2() {
  var container = document.getElementById('adminContent') || document.getElementById('page-admin');
  if (!container) return;
  if (!isAdmin()) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">无权限访问</div>';
    return;
  }

  container.innerHTML = '<div style="max-width:900px;margin:0 auto;padding:20px">';
  container.innerHTML += '<h3 style="margin-bottom:20px">审核管理</h3>';

  // 统计卡片
  container.innerHTML += '<div id="adminStats" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:24px"></div>';

  // 筛选栏
  container.innerHTML += '<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">';
  container.innerHTML += '<select id="adminFilterStatus" onchange="loadAdminApplications()" style="padding:8px 12px;border-radius:8px;border:1px solid var(--border-subtle);background:var(--bg-card);color:var(--text-primary);font-size:13px"><option value="">全部状态</option><option value="submitted">待审核</option><option value="under_review">审核中</option><option value="approved">已通过</option><option value="rejected">已驳回</option><option value="request_changes">需补充</option></select>';
  container.innerHTML += '<select id="adminFilterType" onchange="loadAdminApplications()" style="padding:8px 12px;border-radius:8px;border:1px solid var(--border-subtle);background:var(--bg-card);color:var(--text-primary);font-size:13px"><option value="">全部类型</option><option value="individual">个人</option><option value="team">团队</option></select>';
  container.innerHTML += '<input type="text" id="adminSearchName" placeholder="搜索竞赛名..." oninput="loadAdminApplications()" style="flex:1;padding:8px 12px;border-radius:8px;border:1px solid var(--border-subtle);background:var(--bg-card);color:var(--text-primary);font-size:13px;min-width:150px">';
  container.innerHTML += '</div>';

  // 报名列表
  container.innerHTML += '<div id="adminAppList"></div>';
  container.innerHTML += '</div>';

  loadAdminStats();
  loadAdminApplications();
}

async function loadAdminStats() {
  var el = document.getElementById('adminStats');
  if (!el) return;

  var counts = { total: 0, pending: 0, approved: 0, rejected: 0 };
  var statuses = ['submitted', 'under_review', 'approved', 'rejected', 'request_changes'];

  for (var i = 0; i < statuses.length; i++) {
    var res = await fetch(HUB_URL + '/rest/v1/applications?status=eq.' + statuses[i] + '&select=id', { headers: HUB_HEADERS });
    if (res.ok) {
      var data = await res.json();
      counts.total += data.length;
      if (statuses[i] === 'submitted' || statuses[i] === 'under_review') counts.pending += data.length;
      if (statuses[i] === 'approved') counts.approved += data.length;
      if (statuses[i] === 'rejected') counts.rejected += data.length;
    }
  }

  el.innerHTML = '<div class="card" style="padding:16px;text-align:center"><div style="font-size:24px;font-weight:800;color:var(--text-primary)">' + counts.total + '</div><div style="font-size:12px;color:var(--text-muted)">总报名</div></div>' +
    '<div class="card" style="padding:16px;text-align:center"><div style="font-size:24px;font-weight:800;color:#FFC84A">' + counts.pending + '</div><div style="font-size:12px;color:var(--text-muted)">待审核</div></div>' +
    '<div class="card" style="padding:16px;text-align:center"><div style="font-size:24px;font-weight:800;color:#2ecc71">' + counts.approved + '</div><div style="font-size:12px;color:var(--text-muted)">已通过</div></div>' +
    '<div class="card" style="padding:16px;text-align:center"><div style="font-size:24px;font-weight:800;color:#e74c3c">' + counts.rejected + '</div><div style="font-size:12px;color:var(--text-muted)">已驳回</div></div>';
}

async function loadAdminApplications() {
  var el = document.getElementById('adminAppList');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted)">加载中...</div>';

  var statusFilter = document.getElementById('adminFilterStatus').value;
  var typeFilter = document.getElementById('adminFilterType').value;
  var searchName = document.getElementById('adminSearchName').value.trim();

  var url = HUB_URL + '/rest/v1/applications?select=*,competitions(name,level,category),profiles!applications_applicant_user_id_fkey(name,student_id,college)&order=created_at.desc&limit=50';

  var res = await fetch(url, { headers: HUB_HEADERS });
  if (!res.ok) { el.innerHTML = '<p style="color:#e74c3c">加载失败</p>'; return; }
  var apps = await res.json();

  // 客户端筛选
  if (statusFilter) apps = apps.filter(function(a) { return a.status === statusFilter; });
  if (typeFilter) apps = apps.filter(function(a) { return a.type === typeFilter; });
  if (searchName) apps = apps.filter(function(a) { return (a.competitions || {}).name && a.competitions.name.indexOf(searchName) >= 0; });

  if (apps.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">暂无报名记录</div>';
    return;
  }

  var html = '';
  apps.forEach(function(app) {
    var comp = app.competitions || {};
    var profile = app.profiles || {};
    var statusBg = { draft: 'rgba(255,255,255,0.06)', submitted: 'rgba(255,200,74,0.1)', under_review: 'rgba(6,182,212,0.1)', approved: 'rgba(46,204,113,0.1)', rejected: 'rgba(231,76,60,0.1)', request_changes: 'rgba(251,191,36,0.1)' };
    var statusColor = { draft: 'var(--text-muted)', submitted: '#FFC84A', under_review: '#06b6d4', approved: '#2ecc71', rejected: '#e74c3c', request_changes: '#f59e0b' };
    var statusText = { draft: '草稿', submitted: '待审核', under_review: '审核中', approved: '已通过', rejected: '已驳回', request_changes: '需补充' };

    html += '<div class="card" style="padding:16px;margin-bottom:8px;cursor:pointer" onclick="showAdminAppDetail(\'' + app.id + '\')">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
    html += '<div style="flex:1;min-width:0">';
    html += '<div style="font-weight:600;font-size:14px">' + esc(comp.name || '未知竞赛') + '</div>';
    html += '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">' + esc(profile.name || '') + ' | ' + esc(profile.student_id || '') + ' | ' + esc(profile.college || '') + '</div>';
    html += '<div style="font-size:11px;color:var(--text-muted);margin-top:2px">' + (app.type === 'team' ? '团队' : '个人') + ' · ' + new Date(app.created_at).toLocaleDateString() + '</div>';
    html += '</div>';
    html += '<span style="font-size:12px;padding:4px 10px;border-radius:999px;background:' + (statusBg[app.status] || '') + ';color:' + (statusColor[app.status] || '') + ';white-space:nowrap">' + (statusText[app.status] || app.status) + '</span>';
    html += '</div></div>';
  });
  el.innerHTML = html;
}

async function showAdminAppDetail(applicationId) {
  // 获取报名
  var res = await fetch(HUB_URL + '/rest/v1/applications?id=eq.' + applicationId + '&select=*,competitions(name,level,category),profiles!applications_applicant_user_id_fkey(name,student_id,college)', { headers: HUB_HEADERS });
  var apps = await res.json();
  var app = apps[0];
  if (!app) return;

  // 获取审核记录
  var revRes = await fetch(HUB_URL + '/rest/v1/application_reviews?application_id=eq.' + applicationId + '&select=*,profiles!application_reviews_reviewer_user_id_fkey(name)&order=created_at.desc', { headers: HUB_HEADERS });
  var reviews = await revRes.json();

  // 获取材料
  var filesRes = await fetch(HUB_URL + '/rest/v1/application_files?application_id=eq.' + applicationId + '&status=eq.uploaded&order=uploaded_at.desc', { headers: HUB_HEADERS });
  var files = await filesRes.json();

  var comp = app.competitions || {};
  var profile = app.profiles || {};

  var html = '<div style="max-width:600px;margin:0 auto;padding:20px">';
  html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">';
  html += '<button onclick="renderAdminV2()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:18px">&larr;</button>';
  html += '<h3 style="flex:1">' + esc(comp.name || '报名详情') + '</h3>';
  html += '</div>';

  // 申请人信息
  html += '<div class="card" style="padding:16px;margin-bottom:12px">';
  html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:var(--accent)">申请人信息</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">';
  html += '<div><span style="color:var(--text-muted)">姓名：</span>' + esc(profile.name || '') + '</div>';
  html += '<div><span style="color:var(--text-muted)">学号：</span>' + esc(profile.student_id || '') + '</div>';
  html += '<div><span style="color:var(--text-muted)">学院：</span>' + esc(profile.college || '') + '</div>';
  html += '<div><span style="color:var(--text-muted)">类型：</span>' + (app.type === 'team' ? '团队' : '个人') + '</div>';
  html += '</div></div>';

  // 表单数据
  var data = app.data || {};
  if (Object.keys(data).length > 0) {
    html += '<div class="card" style="padding:16px;margin-bottom:12px">';
    html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:var(--accent)">报名信息</div>';
    Object.keys(data).forEach(function(key) {
      if (data[key]) {
        html += '<div style="font-size:13px;margin-bottom:6px"><span style="color:var(--text-muted)">' + esc(key) + '：</span>' + esc(data[key]) + '</div>';
      }
    });
    html += '</div>';
  }

  // 材料
  if (files.length > 0) {
    html += '<div class="card" style="padding:16px;margin-bottom:12px">';
    html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:var(--accent)">提交材料</div>';
    files.forEach(function(f) {
      html += '<div style="font-size:12px;padding:6px 0;border-bottom:1px solid var(--border-subtle)">' + esc(f.file_name) + ' <span style="color:var(--text-muted)">(' + (f.file_size / 1024).toFixed(1) + 'KB)</span></div>';
    });
    html += '</div>';
  }

  // 审核记录
  if (reviews.length > 0) {
    html += '<div class="card" style="padding:16px;margin-bottom:12px">';
    html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:var(--accent)">审核记录</div>';
    reviews.forEach(function(r) {
      var actionText = { approve: '通过', reject: '驳回', request_changes: '要求补充' };
      var actionColor = { approve: '#2ecc71', reject: '#e74c3c', request_changes: '#f59e0b' };
      html += '<div style="font-size:12px;margin-bottom:8px;padding:8px;border-radius:6px;background:var(--bg-secondary)">';
      html += '<div style="display:flex;justify-content:space-between"><span style="color:' + (actionColor[r.action] || '') + ';font-weight:500">' + (actionText[r.action] || r.action) + '</span><span style="color:var(--text-muted)">' + (r.profiles ? esc(r.profiles.name) : '') + ' · ' + new Date(r.created_at).toLocaleString() + '</span></div>';
      if (r.comment) html += '<div style="margin-top:4px;color:var(--text-secondary)">' + esc(r.comment) + '</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  // 审核操作
  if (app.status === 'submitted' || app.status === 'under_review' || app.status === 'request_changes') {
    html += '<div style="margin-top:16px">';
    html += '<textarea id="reviewComment" placeholder="审核意见（可选）" rows="2" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border-subtle);background:var(--bg-card);color:var(--text-primary);font-family:inherit;margin-bottom:12px"></textarea>';
    html += '<div style="display:flex;gap:8px">';
    html += '<button class="btn-primary" style="flex:1" onclick="reviewApplication(\'' + applicationId + '\',\'approve\')">通过</button>';
    html += '<button style="flex:1;padding:10px;border-radius:8px;border:1px solid rgba(251,191,36,0.3);background:rgba(251,191,36,0.08);color:#f59e0b;cursor:pointer;font-weight:500" onclick="reviewApplication(\'' + applicationId + '\',\'request_changes\')">要求补充</button>';
    html += '<button style="flex:1;padding:10px;border-radius:8px;border:1px solid rgba(231,76,60,0.3);background:rgba(231,76,60,0.08);color:#e74c3c;cursor:pointer;font-weight:500" onclick="reviewApplication(\'' + applicationId + '\',\'reject\')">驳回</button>';
    html += '</div></div>';
  }

  html += '</div>';
  showCompModal(html);
}

async function reviewApplication(applicationId, action) {
  var comment = document.getElementById('reviewComment');
  var commentText = comment ? comment.value.trim() : '';

  if (action === 'reject' && !commentText) {
    showCopyToast('驳回时请填写原因', 'error');
    return;
  }

  var user = getCurrentUser();
  var newStatus = { approve: 'approved', reject: 'rejected', request_changes: 'request_changes' };

  // 写入审核记录
  var revRes = await fetch(HUB_URL + '/rest/v1/application_reviews', {
    method: 'POST',
    headers: HUB_HEADERS,
    body: JSON.stringify({
      application_id: applicationId,
      reviewer_user_id: user.id,
      action: action,
      comment: commentText
    })
  });

  if (!revRes.ok) { showCopyToast('审核操作失败', 'error'); return; }

  // 更新报名状态
  var appRes = await fetch(HUB_URL + '/rest/v1/applications?id=eq.' + applicationId, {
    method: 'PATCH',
    headers: HUB_HEADERS,
    body: JSON.stringify({ status: newStatus[action] })
  });

  if (appRes.ok) {
    showCopyToast('审核完成：' + { approve: '已通过', reject: '已驳回', request_changes: '已要求补充' }[action], 'success');
    showAdminAppDetail(applicationId);
  } else {
    showCopyToast('状态更新失败', 'error');
  }
}

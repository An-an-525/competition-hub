/* Registration System v2 - Applications, Reviews, Files */

// ==========================================
// 0. 防重复提交锁
// ==========================================

var _submitLock = false;

// ==========================================
// 1. 报名入口
// ==========================================

function startApplication(compId) {
  if (!isLoggedIn()) {
    showConfirm('报名需要先登录，是否前往登录？', function() { navigate('auth'); });
    return;
  }
  // 检查是否已有草稿
  checkExistingDraft(compId);
}

// ==========================================
// 2. 检查已有报名
// ==========================================

async function checkExistingDraft(compId) {
  var user = getCurrentUser();
  var res = await fetch(HUB_URL + '/rest/v1/applications?competition_id=eq.' + compId + '&applicant_user_id=eq.' + user.id + '&select=id,status,type,created_at', { headers: HUB_HEADERS });
  if (!res.ok) { showCopyToast('查询失败', 'error'); return; }
  var existing = await res.json();
  if (existing.length > 0) {
    var app = existing[0];
    if (app.status === 'draft') {
      showConfirm('你有未完成的报名，是否继续编辑？', function() { showApplicationForm(compId, app.id); });
    } else {
      showCopyToast('你已报名此竞赛（' + getStatusText(app.status) + '）', 'info');
    }
    return;
  }
  // 选择报名类型
  showApplicationTypeSelector(compId);
}

// ==========================================
// 3. 报名类型选择（个人/团队）
// ==========================================

function showApplicationTypeSelector(compId) {
  var html = '<div style="max-width:500px;margin:0 auto;padding:20px">';
  html += '<h3 style="margin-bottom:20px">选择报名方式</h3>';
  html += '<div style="display:flex;gap:12px">';
  html += '<div class="card" style="flex:1;padding:24px;text-align:center;cursor:pointer" onclick="createApplication(\'' + compId + '\',\'individual\')">';
  html += '<div style="font-size:32px;margin-bottom:12px">' + svgIcon('user', 40) + '</div>';
  html += '<div style="font-weight:600;font-size:16px">个人报名</div>';
  html += '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">以个人身份参赛</div>';
  html += '</div>';
  html += '<div class="card" style="flex:1;padding:24px;text-align:center;cursor:pointer" onclick="createApplication(\'' + compId + '\',\'team\')">';
  html += '<div style="font-size:32px;margin-bottom:12px">' + svgIcon('users', 40) + '</div>';
  html += '<div style="font-weight:600;font-size:16px">团队报名</div>';
  html += '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">组建或加入团队</div>';
  html += '</div>';
  html += '</div></div>';
  showCompModal(html);
}

// ==========================================
// 4. 创建报名记录
// ==========================================

async function createApplication(compId, type) {
  if (_submitLock) { showCopyToast('请勿重复提交', 'warning'); return; }
  _submitLock = true;
  try {
    var user = getCurrentUser();
    var res = await fetch(HUB_URL + '/rest/v1/applications', {
      method: 'POST',
      headers: HUB_HEADERS,
      body: JSON.stringify({
        competition_id: compId,
        applicant_user_id: user.id,
        type: type,
        status: 'draft',
        data: {}
      })
    });
    if (!res.ok) { showCopyToast('创建报名失败', 'error'); return; }
    var app = await res.json();
    showCopyToast('报名已创建，请填写信息', 'success');
    showApplicationForm(compId, app.id);
  } finally {
    _submitLock = false;
  }
}

// ==========================================
// 5. 报名表单（核心）
// ==========================================

async function showApplicationForm(compId, applicationId) {
  var user = getCurrentUser();

  // 获取报名记录
  var appRes = await fetch(HUB_URL + '/rest/v1/applications?id=eq.' + applicationId, { headers: HUB_HEADERS });
  var appData = (await appRes.json())[0];

  // 获取表单定义
  var formRes = await fetch(HUB_URL + '/rest/v1/application_forms?competition_id=eq.' + compId, { headers: HUB_HEADERS });
  var formData = (await formRes.json())[0];
  var schema = formData ? formData.schema : getDefaultSchema();

  // 获取竞赛信息
  var comps = await fetchCompetitions();
  var comp = comps.find(function(c) { return c.id === compId; });

  // 获取材料要求
  var reqRes = await fetch(HUB_URL + '/rest/v1/form_requirements?competition_id=eq.' + compId + '&order=sort_order', { headers: HUB_HEADERS });
  var requirements = await reqRes.json();

  // 获取已有材料
  var filesRes = await fetch(HUB_URL + '/rest/v1/application_files?application_id=eq.' + applicationId + '&status=eq.uploaded', { headers: HUB_HEADERS });
  var files = await filesRes.json();

  // 渲染表单
  var html = '<div style="max-width:600px;margin:0 auto;padding:20px">';
  html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">';
  html += '<button onclick="startApplication(\'' + compId + '\')" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:18px">&larr;</button>';
  html += '<h3>' + esc(comp ? comp.name : '竞赛报名') + '</h3>';
  html += '<span style="font-size:12px;padding:4px 10px;border-radius:999px;background:' + getStatusBg(appData.status) + ';color:' + getStatusColor(appData.status) + '">' + getStatusText(appData.status) + '</span>';
  html += '</div>';

  // 表单字段
  html += '<div id="appFormFields">';
  schema.forEach(function(field) {
    var val = appData.data[field.key] || '';
    html += '<div style="margin-bottom:16px">';
    html += '<label style="display:block;font-size:13px;font-weight:500;margin-bottom:6px;color:var(--text-secondary)">' + esc(field.label) + (field.required ? ' <span style="color:#ef4444">*</span>' : '') + '</label>';
    if (field.type === 'textarea') {
      html += '<textarea class="form-input" data-key="' + field.key + '" placeholder="' + esc(field.placeholder || '') + '" rows="3" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border-subtle);background:var(--bg-card);color:var(--text-primary);font-family:inherit;resize:vertical">' + esc(val) + '</textarea>';
    } else if (field.type === 'select') {
      html += '<select class="form-input" data-key="' + field.key + '" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border-subtle);background:var(--bg-card);color:var(--text-primary)">';
      html += '<option value="">请选择</option>';
      (field.options || []).forEach(function(opt) {
        html += '<option value="' + esc(opt) + '"' + (val === opt ? ' selected' : '') + '>' + esc(opt) + '</option>';
      });
      html += '</select>';
    } else {
      html += '<input type="' + (field.type === 'number' ? 'number' : 'text') + '" class="form-input" data-key="' + field.key + '" value="' + esc(val) + '" placeholder="' + esc(field.placeholder || '') + '" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border-subtle);background:var(--bg-card);color:var(--text-primary)">';
    }
    html += '</div>';
  });
  html += '</div>';

  // 材料上传区域
  if (requirements.length > 0) {
    html += '<div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border-subtle)">';
    html += '<h4 style="margin-bottom:12px;font-size:14px">材料上传</h4>';
    requirements.forEach(function(req) {
      var reqFiles = files.filter(function(f) { return f.requirement_key === req.key; });
      html += '<div style="margin-bottom:12px;padding:12px;border-radius:8px;border:1px solid var(--border-subtle);background:var(--bg-card)">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center">';
      html += '<div><div style="font-size:13px;font-weight:500">' + esc(req.label) + (req.required ? ' <span style="color:#ef4444">*</span>' : '') + '</div>';
      html += '<div style="font-size:11px;color:var(--text-muted)">' + (req.allow_multi ? '允许多文件' : '单个文件') + '</div></div>';
      html += '<label style="padding:6px 14px;border-radius:8px;background:var(--accent);color:#111;font-size:12px;font-weight:500;cursor:pointer">';
      html += '上传<input type="file" style="display:none" onchange="handleFileUpload(\'' + applicationId + '\',\'' + req.key + '\',this,' + req.allow_multi + ')"' + (appData.status !== 'draft' && appData.status !== 'request_changes' ? ' disabled' : '') + '></label>';
      html += '</div>';
      if (reqFiles.length > 0) {
        html += '<div style="margin-top:8px">';
        reqFiles.forEach(function(f) {
          html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;border-radius:4px;background:rgba(255,200,74,0.05);margin-bottom:4px;font-size:12px">';
          html += '<span style="color:var(--text-secondary)">' + esc(f.file_name) + '</span>';
          html += '<span style="color:var(--text-muted)">v' + f.version + '</span>';
          html += '</div>';
        });
        html += '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
  }

  // 操作按钮
  html += '<div style="margin-top:24px;display:flex;gap:12px">';
  if (appData.status === 'draft' || appData.status === 'request_changes') {
    html += '<button class="btn-secondary" style="flex:1" onclick="saveDraft(\'' + applicationId + '\',\'' + compId + '\')">保存草稿</button>';
    html += '<button class="btn-primary" style="flex:1" onclick="submitApplication(\'' + applicationId + '\',\'' + compId + '\')">提交报名</button>';
  }
  if (appData.status === 'submitted' || appData.status === 'under_review') {
    html += '<div style="flex:1;text-align:center;padding:12px;border-radius:8px;background:rgba(255,200,74,0.08);font-size:13px;color:var(--accent)">已提交，等待审核中...</div>';
  }
  if (appData.status === 'approved') {
    html += '<div style="flex:1;text-align:center;padding:12px;border-radius:8px;background:rgba(46,204,113,0.1);font-size:13px;color:#2ecc71">报名已通过 ✓</div>';
  }
  if (appData.status === 'rejected') {
    html += '<div style="flex:1;text-align:center;padding:12px;border-radius:8px;background:rgba(231,76,60,0.1);font-size:13px;color:#e74c3c">报名已被驳回</div>';
  }
  html += '</div></div>';

  showCompModal(html);
}

// ==========================================
// 6. 保存草稿
// ==========================================

async function saveDraft(applicationId, compId) {
  if (_submitLock) { showCopyToast('请勿重复提交', 'warning'); return; }
  _submitLock = true;
  try {
    var data = collectFormData();
    var res = await fetch(HUB_URL + '/rest/v1/applications?id=eq.' + applicationId, {
      method: 'PATCH',
      headers: HUB_HEADERS,
      body: JSON.stringify({ data: data })
    });
    if (res.ok) {
      showCopyToast('草稿已保存', 'success');
    } else {
      showCopyToast('保存失败', 'error');
    }
  } finally {
    _submitLock = false;
  }
}

// ==========================================
// 7. 提交报名
// ==========================================

async function submitApplication(applicationId, compId) {
  if (_submitLock) { showCopyToast('请勿重复提交', 'warning'); return; }
  _submitLock = true;
  try {
    var data = collectFormData();
    // 验证必填字段
    var formRes = await fetch(HUB_URL + '/rest/v1/application_forms?competition_id=eq.' + compId, { headers: HUB_HEADERS });
    var formData = (await formRes.json())[0];
    if (formData) {
      var missing = formData.schema.filter(function(f) { return f.required && !data[f.key]; });
      if (missing.length > 0) {
        showCopyToast('请填写必填项：' + missing.map(function(f) { return f.label; }).join('、'), 'error');
        return;
      }
    }
    showConfirm('确认提交报名？提交后将无法修改。', async function() {
      var res = await fetch(HUB_URL + '/rest/v1/applications?id=eq.' + applicationId, {
        method: 'PATCH',
        headers: HUB_HEADERS,
        body: JSON.stringify({
          data: data,
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
      });
      if (res.ok) {
        showCopyToast('报名已提交！', 'success');
        showApplicationForm(compId, applicationId);
      } else {
        showCopyToast('提交失败', 'error');
      }
    });
  } finally {
    _submitLock = false;
  }
}

// ==========================================
// 8. 文件上传（模拟，实际需要 Supabase Storage）
// ==========================================

async function handleFileUpload(applicationId, requirementKey, input, allowMulti) {
  if (_submitLock) { showCopyToast('请勿重复提交', 'warning'); return; }
  _submitLock = true;
  try {
    var user = getCurrentUser();
    if (!input.files || input.files.length === 0) return;

    for (var i = 0; i < input.files.length; i++) {
      var file = input.files[i];
      // 模拟上传（实际应使用 Supabase Storage）
      // 这里将文件信息存入数据库，file_path 存储文件名
      var res = await fetch(HUB_URL + '/rest/v1/application_files', {
        method: 'POST',
        headers: HUB_HEADERS,
        body: JSON.stringify({
          application_id: applicationId,
          requirement_key: requirementKey,
          file_path: 'uploads/' + applicationId + '/' + file.name,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          version: 1,
          uploaded_by: user.id
        })
      });
      if (res.ok) {
        showCopyToast(file.name + ' 上传成功', 'success');
      }
    }
    // 刷新表单
    var compId = document.querySelector('[data-comp-id]');
    if (compId) {
      showApplicationForm(compId.getAttribute('data-comp-id'), applicationId);
    }
  } finally {
    _submitLock = false;
  }
}

// ==========================================
// 9. 辅助函数
// ==========================================

function collectFormData() {
  var data = {};
  document.querySelectorAll('#appFormFields .form-input').forEach(function(el) {
    data[el.getAttribute('data-key')] = el.value;
  });
  return data;
}

function getDefaultSchema() {
  return [
    { key: 'real_name', label: '真实姓名', type: 'text', required: true, placeholder: '请输入真实姓名' },
    { key: 'student_id', label: '学号', type: 'text', required: true, placeholder: '请输入学号' },
    { key: 'college', label: '学院', type: 'text', required: true, placeholder: '请输入所在学院' },
    { key: 'phone', label: '联系电话', type: 'text', required: true, placeholder: '请输入手机号' },
    { key: 'experience', label: '相关经历', type: 'textarea', required: false, placeholder: '请简要描述相关经历' }
  ];
}

function getStatusText(status) {
  var map = { draft: '草稿', submitted: '已提交', under_review: '审核中', approved: '已通过', rejected: '已驳回', cancelled: '已取消', request_changes: '需补充' };
  return map[status] || status;
}

function getStatusBg(status) {
  var map = { draft: 'rgba(255,255,255,0.06)', submitted: 'rgba(255,200,74,0.1)', under_review: 'rgba(6,182,212,0.1)', approved: 'rgba(46,204,113,0.1)', rejected: 'rgba(231,76,60,0.1)', request_changes: 'rgba(251,191,36,0.1)' };
  return map[status] || 'rgba(255,255,255,0.06)';
}

function getStatusColor(status) {
  var map = { draft: 'var(--text-muted)', submitted: '#FFC84A', under_review: '#06b6d4', approved: '#2ecc71', rejected: '#e74c3c', request_changes: '#f59e0b' };
  return map[status] || 'var(--text-muted)';
}

// ==========================================
// 10. 我的报名页面增强
// ==========================================

async function renderMyApplications() {
  var container = document.getElementById('myregistrationsContent') || document.getElementById('profileContent');
  if (!container) return;
  if (!isLoggedIn()) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)"><p>请先登录查看报名记录</p><button class="btn-primary" style="margin-top:16px" onclick="navigate(\'auth\')">去登录</button></div>';
    return;
  }
  var user = getCurrentUser();
  container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">加载中...</div>';

  var res = await fetch(HUB_URL + '/rest/v1/applications?applicant_user_id=eq.' + user.id + '&select=*,competitions(name,level,category)&order=created_at.desc', { headers: HUB_HEADERS });
  if (!res.ok) { container.innerHTML = '<p style="text-align:center;color:#e74c3c">加载失败</p>'; return; }
  var apps = await res.json();

  if (apps.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)"><div style="font-size:32px;margin-bottom:12px">' + svgIcon('clipboard', 40) + '</div><p>暂无报名记录</p><button class="btn-primary" style="margin-top:16px" onclick="navigate(\'competition\')">浏览竞赛</button></div>';
    return;
  }

  var html = '<div style="max-width:600px;margin:0 auto;padding:20px">';
  html += '<h3 style="margin-bottom:20px">我的报名 (' + apps.length + ')</h3>';
  apps.forEach(function(app) {
    var comp = app.competitions || {};
    html += '<div class="card" style="padding:16px;margin-bottom:10px;cursor:pointer" onclick="showApplicationForm(\'' + app.competition_id + '\',\'' + app.id + '\')">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
    html += '<div style="flex:1;min-width:0">';
    html += '<div style="font-weight:600;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(comp.name || '未知竞赛') + '</div>';
    html += '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">' + esc(comp.level || '') + ' · ' + esc(comp.category || '') + ' · ' + (app.type === 'team' ? '团队' : '个人') + '</div>';
    html += '<div style="font-size:11px;color:var(--text-muted);margin-top:2px">' + new Date(app.created_at).toLocaleDateString() + '</div>';
    html += '</div>';
    html += '<span style="font-size:12px;padding:4px 10px;border-radius:999px;background:' + getStatusBg(app.status) + ';color:' + getStatusColor(app.status) + ';white-space:nowrap">' + getStatusText(app.status) + '</span>';
    html += '</div></div>';
  });
  html += '</div>';
  container.innerHTML = html;
}

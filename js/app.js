/* ============================================
   app.js — Entry Point + Override Layer
   ============================================
   This file is the LAST script loaded.
   It contains:
   1. Original renderProfile (from old registration system)
   2. exportAllData / clearAllData (data management)
   3. navigate() override (auth/admin/myregistrations guard)
   4. renderCompAll() override (use Hub data)
   5. renderProfile() override (login-required guard)
   6. DOMContentLoaded initialization
   ============================================ */

/* --- Original renderProfile (registration list) --- */
async function renderProfile(){var container=document.getElementById('profileContent');container.innerHTML='<div style="text-align:center;padding:40px;color:var(--text-muted)"><div class="loading-spinner" style="width:24px;height:24px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 12px"></div>加载中...</div>';var regs=await getRegistrations();window._cachedRegs=regs;var chatCount=getLS('ai_messages',[]).length;var html='<div style="max-width:600px;margin:0 auto"><h3 style="margin-bottom:20px">我的报名</h3>';if(regs.length===0){html+='<div style="text-align:center;padding:40px 20px;color:var(--text-muted)"><div style="margin-bottom:12px">'+svgIcon('clipboard',48)+'</div><p>暂无报名记录</p><p style="font-size:13px;margin-top:8px">前往学科竞赛页面，点击竞赛卡片上的"报名"按钮即可报名</p><button class="auth-submit" style="margin-top:16px" onclick="navigate(\'competition\')">浏览竞赛</button></div>'}else{html+='<div style="font-size:13px;color:var(--text-muted);margin-bottom:12px">共 '+regs.length+' 条报名记录（云端同步）</div>';regs.forEach(function(r,i){var d=new Date(r.registeredAt);var dateStr=d.getFullYear()+'-'+(d.getMonth()+1<10?'0':'')+(d.getMonth()+1)+'-'+(d.getDate()<10?'0':'')+d.getDate()+' '+(d.getHours()<10?'0':'')+d.getHours()+':'+(d.getMinutes()<10?'0':'')+d.getMinutes();html+='<div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div style="flex:1;min-width:0"><div style="font-weight:600;font-size:15px;margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(r.compName)+'</div><div style="font-size:13px;color:var(--text-secondary)">'+esc(r.name)+' | '+esc(r.college)+'</div><div style="font-size:12px;color:var(--text-muted);margin-top:4px">'+dateStr+'</div></div><div style="display:flex;align-items:center;gap:8px;flex-shrink:0;margin-left:12px"><span style="font-size:12px;padding:4px 10px;border-radius:20px;background:rgba(46,204,113,0.1);color:#2ecc71">'+esc(r.status)+'</span><button style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:13px;padding:4px 8px;border-radius:4px" onclick="removeRegistration('+i+')" title="取消报名">'+svgIcon('x',14)+'</button></div></div></div>'});html+='</div>'}html+='<div style="margin-top:16px;font-size:12px;color:var(--text-muted);text-align:center">AI对话 '+chatCount+' 条 · 数据存储在云端</div></div>';container.innerHTML=html}

/* --- Data Management --- */
function exportAllData(){var data={};for(var i=0;i<localStorage.length;i++){var key=localStorage.key(i);if(key.indexOf('app_')===0){try{data[key]=JSON.parse(localStorage.getItem(key))}catch(e){data[key]=localStorage.getItem(key)}}}var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download='competition-hub-backup-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);showCopyToast('数据已导出')}
function clearAllData(){showConfirm('确定要清除所有数据吗？<br><small style="color:var(--text-muted)">报名数据存储在云端，不受影响</small>',function(){var keys=[];for(var i=0;i<localStorage.length;i++){var key=localStorage.key(i);if(key.indexOf('app_')===0)keys.push(key)}keys.forEach(function(k){localStorage.removeItem(k)});showCopyToast('所有数据已清除','success');setTimeout(function(){location.reload()},1000)})}

/* --- Override navigate() for auth/admin/myregistrations guard --- */
_origNavigate = navigate;
navigate = function(page, tab) {
  updateMobileNav(page);
  if (page === 'auth' || page === 'admin' || page === 'myregistrations') {
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); p.classList.remove('fading-out'); });
    document.querySelectorAll('.nav-link').forEach(function(l) { l.classList.remove('active'); });
    var target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    app.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (page === 'auth') {}
    if (page === 'admin') renderAdmin();
    if (page === 'myregistrations') renderMyRegistrations();
    return;
  }
  _origNavigate(page, tab);
};

/* --- Override renderCompAll to use Hub data --- */
_origRenderCompAll = renderCompAll;
renderCompAll = function(container) {
  renderCompHub(container);
};

/* --- Override renderProfile to show login prompt or settings --- */
_origRenderProfile = renderProfile;
renderProfile = function() {
  var container = document.getElementById('profileContent');
  if (!isLoggedIn()) {
    container.innerHTML = '<div class="login-required"><h3>请先登录</h3><p>登录后管理你的竞赛报名和个人信息</p><button class="btn-primary" onclick="navigate(\'auth\')">去登录</button></div>';
    return;
  }
  var user = getCurrentUser();
  var chatCount = getLS('ai_messages', []).length;
  var html = '<div style="max-width:600px;margin:0 auto">';
  html += '<div class="profile-header"><div class="profile-avatar">' + esc(user.name.charAt(0)) + '</div><div class="profile-name">' + esc(user.name) + '</div><div class="profile-meta">' + esc(user.studentId) + ' | ' + esc(user.college) + (user.role === 'admin' ? ' | 管理员' : '') + '</div></div>';
  html += '<div class="settings-group"><div class="settings-item" onclick="navigate(\'myregistrations\')"><div class="si-icon" style="background:var(--surface-gold-subtle);color:var(--accent)">' + svgIcon('clipboard', 18) + '</div><div class="si-label">我的报名</div><div class="si-arrow">&#8250;</div></div>';
  if (user.role === 'admin') html += '<div class="settings-item" onclick="navigate(\'admin\')"><div class="si-icon" style="background:rgba(46,204,113,0.1);color:#2ecc71">' + svgIcon('gear', 18) + '</div><div class="si-label">管理面板</div><div class="si-arrow">&#8250;</div></div>';
  html += '<div class="settings-item" onclick="navigate(\'ai\')"><div class="si-icon" style="background:rgba(52,152,219,0.1);color:#3498db">' + svgIcon('robot', 18) + '</div><div class="si-label">AI问答</div><div class="si-arrow">&#8250;</div></div>';
  html += '</div>';
  html += '<div class="settings-group-title">数据管理</div><div class="settings-group"><div class="settings-item" onclick="exportAllData()"><div class="si-icon" style="background:rgba(46,204,113,0.1);color:#2ecc71">' + svgIcon('download', 18) + '</div><div class="si-label">导出数据</div><div class="si-arrow">&#8250;</div></div>';
  html += '<div class="settings-item danger" onclick="clearAllData()"><div class="si-icon" style="background:rgba(231,76,60,0.1);color:#e74c3c">' + svgIcon('trash', 18) + '</div><div class="si-label">清除本地数据</div><div class="si-arrow">&#8250;</div></div>';
  html += '</div>';
  html += '<div style="margin-top:24px"><button class="btn-secondary" style="width:100%" onclick="doLogout()">退出登录</button></div>';
  html += '</div>';
  container.innerHTML = html;
};

/* --- DOMContentLoaded Initialization --- */
document.addEventListener('DOMContentLoaded', function() {
  updateNavAuth();
  initGSAPAnimations();
  initScrollProgress();
  initRevealAnimations();
  renderFeaturedCompetitions();
  if (typeof initDotGrid === 'function') initDotGrid();
  if (typeof initCardTilt === 'function') initCardTilt();
  if (typeof initParticleSystem === 'function') initParticleSystem();
});

/* Extracted from app.js */
/* ===== 竞赛报名系统（Supabase 云数据库） ===== */
var SUPABASE_URL='https://fdbbcibmqaogsbasoqly.supabase.co';
var SUPABASE_KEY='sb_publishable_Vc1DwX3BjKjbeRq-tdvQqQ_m8Cm-6mZ';
var SUPABASE_REST=SUPABASE_URL+'/rest/v1/registrations';
function supabaseHeaders(){return{'apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Content-Type':'application/json','Prefer':'return=representation'}}
async function getRegistrations(){try{var res=await fetch(SUPABASE_REST+'?select=*&order=created_at.desc',supabaseHeaders());if(!res.ok)return[];var data=await res.json();return data.map(function(r){return{id:r.id,compName:r.comp_name,name:r.name,studentId:r.student_id,college:r.college,phone:r.phone||'',email:r.email||'',note:r.note||'',status:r.status||'已报名',registeredAt:r.created_at}})}catch(e){console.error('获取报名数据失败:',e);return[]}}
async function saveRegistration(reg){try{var res=await fetch(SUPABASE_REST,{method:'POST',headers:supabaseHeaders(),body:JSON.stringify({comp_name:reg.compName,name:reg.name,student_id:reg.studentId,college:reg.college,phone:reg.phone,email:reg.email,note:reg.note,status:reg.status||'已报名'})});return res.ok}catch(e){console.error('保存报名失败:',e);return false}}
async function deleteRegistration(id){try{var res=await fetch(SUPABASE_REST+'?id=eq.'+id,{method:'DELETE',headers:{'apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY}});return res.ok}catch(e){return false}}
async function removeRegistration(idx){hapticFeedback();var regs=window._cachedRegs||[];if(regs[idx]&&regs[idx].id){var ok=await deleteRegistration(regs[idx].id);if(ok){showCopyToast('已取消报名','success');renderProfile()}else{showCopyToast('取消失败，请重试','warning')}}}
async function checkDuplicateRegistration(compName,studentId){try{var res=await fetch(SUPABASE_REST+'?select=id&comp_name=eq.'+encodeURIComponent(compName)+'&student_id=eq.'+encodeURIComponent(studentId),supabaseHeaders());if(!res.ok)return false;var data=await res.json();return data.length>0}catch(e){return false}}
function showRegForm(compName){navigate('profile');setTimeout(function(){var container=document.getElementById('profileContent');container.innerHTML='<div style="max-width:500px;margin:0 auto"><h3 style="margin-bottom:16px">报名：'+esc(compName)+'</h3><div class="settings-group"><div class="auth-field" style="margin-bottom:12px"><label>姓名 *</label><input type="text" id="regName" placeholder="请输入真实姓名" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-primary);color:var(--text-primary)" /></div><div class="auth-field" style="margin-bottom:12px"><label>学号/工号 *</label><input type="text" id="regStudentId" placeholder="请输入学号或工号" inputmode="numeric" pattern="[0-9]*" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-primary);color:var(--text-primary)" /></div><div class="auth-field" style="margin-bottom:12px"><label>学院/单位 *</label><input type="text" id="regCollege" placeholder="请输入所在学院或单位" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-primary);color:var(--text-primary)" /></div><div class="auth-field" style="margin-bottom:12px"><label>联系电话</label><input type="tel" id="regPhone" placeholder="选填" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-primary);color:var(--text-primary)" /></div><div class="auth-field" style="margin-bottom:12px"><label>邮箱</label><input type="email" id="regEmail" placeholder="选填" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-primary);color:var(--text-primary)" /></div><div class="auth-field" style="margin-bottom:16px"><label>备注</label><textarea id="regNote" placeholder="如有队友信息或其他需要说明的内容，请在此填写" rows="3" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-primary);color:var(--text-primary);resize:vertical"></textarea></div><div id="regFormError" style="color:#e74c3c;font-size:13px;margin-bottom:12px;display:none"></div><div style="display:flex;gap:10px"><button class="auth-submit" style="flex:1" onclick="submitRegistration(\''+compName.replace(/'/g,"\\'")+'\')">确认报名</button><button class="auth-submit" style="flex:0 0 auto;background:var(--bg-hover);color:var(--text-secondary)" onclick="renderProfile()">取消</button></div></div></div>'},50)}
async function submitRegistration(compName){var name=document.getElementById('regName').value.trim();var studentId=document.getElementById('regStudentId').value.trim();var college=document.getElementById('regCollege').value.trim();var phone=document.getElementById('regPhone').value.trim();var email=document.getElementById('regEmail').value.trim();var note=document.getElementById('regNote').value.trim();var errEl=document.getElementById('regFormError');if(!name){errEl.textContent='请输入姓名';errEl.style.display='block';return}if(!studentId){errEl.textContent='请输入学号/工号';errEl.style.display='block';return}if(!college){errEl.textContent='请输入学院/单位';errEl.style.display='block';return}var dup=await checkDuplicateRegistration(compName,studentId);if(dup){errEl.textContent='你已经报名过该竞赛';errEl.style.display='block';return}var ok=await saveRegistration({compName:compName,name:name,studentId:studentId,college:college,phone:phone,email:email,note:note,status:'已报名'});if(ok){showCopyToast('报名成功！已报名：'+compName,'success');renderProfile()}else{errEl.textContent='报名失败，请检查网络后重试';errEl.style.display='block'}}

async function showRegFormForComp(compId){
  if(!isLoggedIn()){navigate('auth');return}
  var user=getCurrentUser();
  var comps=await fetchCompetitions();var comp=comps.find(function(x){return x.id===compId});if(!comp)return;
  var html='<div style="max-width:500px;margin:0 auto"><h3 style="margin-bottom:16px">报名：'+esc(comp.name)+'</h3>';
  if(comp.is_team){
    html+='<div style="margin-bottom:16px"><p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">这是一个团队赛（'+esc(comp.team_min||'?')+'-'+esc(comp.team_max||'?')+'人），请选择操作：</p>';
    html+='<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn-primary btn-sm" onclick="showCreateTeamForm('+compId+')">创建新队伍</button><button class="btn-secondary btn-sm" onclick="showJoinTeamList('+compId+')">加入已有队伍</button></div></div>';
  }
  html+='<div class="card" style="padding:20px;margin-top:12px"><h4 style="font-size:14px;margin-bottom:16px;color:var(--text-primary)">报名信息</h4>';
  html+='<div class="auth-field"><label>姓名</label><input type="text" value="'+esc(user.name)+'" disabled style="opacity:0.7" /></div>';
  html+='<div class="auth-field"><label>学号</label><input type="text" value="'+esc(user.studentId)+'" disabled style="opacity:0.7" /></div>';
  html+='<div class="auth-field"><label>学院</label><input type="text" value="'+esc(user.college)+'" disabled style="opacity:0.7" /></div>';
  html+='<div class="auth-field"><label>联系电话</label><input type="tel" id="regPhone" placeholder="选填" /></div>';
  html+='<div class="auth-field"><label>邮箱</label><input type="email" id="regEmail" placeholder="选填" /></div>';
  html+='<div class="auth-field"><label>指导老师</label><input type="text" id="regTeacher" placeholder="选填" /></div>';
  html+='<div class="auth-field"><label>备注</label><textarea id="regNote" rows="3" placeholder="选填"></textarea></div>';
  html+='<div class="auth-error" id="hubRegError"></div>';
  html+='<div class="reg-submit-sticky"><button class="btn-primary" style="width:100%" onclick="submitHubRegistration('+compId+',null)" id="hubRegBtn">提交报名</button></div>';
  html+='</div></div>';
  showCompModal(html);
}
async function submitHubRegistration(compId,teamId){
  hapticFeedback();
  var user=getCurrentUser();if(!user)return;
  var phone=document.getElementById('regPhone')?document.getElementById('regPhone').value.trim():'';
  var email=document.getElementById('regEmail')?document.getElementById('regEmail').value.trim():'';
  var teacher=document.getElementById('regTeacher')?document.getElementById('regTeacher').value.trim():'';
  var note=document.getElementById('regNote')?document.getElementById('regNote').value.trim():'';
  var errEl=document.getElementById('hubRegError');
  var btn=document.getElementById('hubRegBtn');
  if(errEl)errEl.classList.remove('show');
  btn.disabled=true;btn.textContent='提交中...';
  try{
    var payload={user_id:user.id,competition_id:compId,status:'pending',note:note};
    if(teamId)payload.team_id=teamId;
    var res=await fetch(HUB_URL+'/rest/v1/registrations',{method:'POST',headers:HUB_HEADERS,body:JSON.stringify(payload)});
    if(!res.ok){
      var errData={};try{errData=await res.json()}catch(e){}
      if(errData.message&&errData.message.indexOf('duplicate')>=0&&(errEl)){errEl.textContent='你已经报名过该竞赛';errEl.classList.add('show');btn.disabled=false;btn.textContent='提交报名';return}
      if(errEl){errEl.textContent='报名失败，请重试';errEl.classList.add('show');btn.disabled=false;btn.textContent='提交报名'}return;
    }
    showCopyToast('报名成功！','success');
    document.body.style.overflow='';
    var overlay=document.querySelector('.search-modal-overlay, div[style*="position:fixed"][style*="inset:0"]');
    if(overlay)overlay.remove();
    else{var modals=document.querySelectorAll('div[style*="position:fixed"]');modals.forEach(function(m){if(m.style.zIndex==='1000'||m.style.zIndex==='10000')m.remove()})}
    _cachedCompetitions=null;navigate('myregistrations');
  }catch(e){if(errEl){errEl.textContent='网络错误，请重试';errEl.classList.add('show')}btn.disabled=false;btn.textContent='提交报名'}
}

/* --- Team System --- */
async function showCreateTeamForm(compId){
  var user=getCurrentUser();if(!user)return;
  var comps=await fetchCompetitions();var comp=comps.find(function(x){return x.id===compId});
  var html='<div style="max-width:400px"><h3 style="margin-bottom:16px">创建队伍</h3>';
  if(comp)html+='<p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">竞赛：'+esc(comp.name)+'（'+esc(comp.team_min||'?')+'-'+esc(comp.team_max||'?')+'人）</p>';
  html+='<div class="auth-field"><label>队伍名称 *</label><input type="text" id="teamNameInput" placeholder="请输入队伍名称" /></div>';
  html+='<div class="auth-error" id="createTeamError"></div>';
  html+='<button class="btn-primary" style="width:100%;margin-top:8px" onclick="doCreateTeam('+compId+')">创建并报名</button></div>';
  showCompModal(html);
}
async function doCreateTeam(compId){
  var user=getCurrentUser();if(!user)return;
  var name=document.getElementById('teamNameInput').value.trim();
  var errEl=document.getElementById('createTeamError');
  if(!name){errEl.textContent='请输入队伍名称';errEl.classList.add('show');return}
  var comps=await fetchCompetitions();var comp=comps.find(function(x){return x.id===compId});
  try{
    var res=await fetch(HUB_URL+'/rest/v1/teams',{method:'POST',headers:HUB_HEADERS,body:JSON.stringify({competition_id:compId,name:name,captain_id:user.id,max_members:comp?comp.team_max:5,status:'forming'})});
    if(!res.ok){errEl.textContent='创建队伍失败';errEl.classList.add('show');return}
    var teamData=await res.json();var team=teamData[0];
    await fetch(HUB_URL+'/rest/v1/team_members',{method:'POST',headers:HUB_HEADERS,body:JSON.stringify({team_id:team.id,user_id:user.id,role:'captain',status:'approved'})});
    showCopyToast('队伍创建成功！','success');
    document.body.style.overflow='';
    var modals=document.querySelectorAll('div[style*="position:fixed"]');modals.forEach(function(m){if(m.style.zIndex==='1000'||m.style.zIndex==='10000')m.remove()});
    submitHubRegistration(compId,team.id);
  }catch(e){errEl.textContent='网络错误';errEl.classList.add('show')}
}
async function showJoinTeamList(compId){
  var user=getCurrentUser();if(!user)return;
  var html='<div style="max-width:500px"><h3 style="margin-bottom:16px">加入队伍</h3><div id="joinTeamListContent" class="loading-overlay"><div class="loading-spinner" style="width:24px;height:24px"></div><p style="margin-top:8px">加载中...</p></div></div>';
  showCompModal(html);
  try{
    var res=await fetch(HUB_URL+'/rest/v1/teams?competition_id=eq.'+compId+'&status=eq.forming&select=*,team_members(*)',{headers:HUB_HEADERS});
    if(!res.ok){document.getElementById('joinTeamListContent').innerHTML='<div class="empty-state"><p>加载失败</p></div>';return}
    var teams=await res.json();
    var content=document.getElementById('joinTeamListContent');if(!content)return;
    if(teams.length===0){content.innerHTML='<div class="empty-state"><div class="empty-state-icon">'+svgIcon('users',40)+'</div><p>暂无可加入的队伍</p><p>你可以创建一个新队伍</p></div>';return}
    var listHtml='';
    teams.forEach(function(t){
      var members=t.team_members||[];
      var memberCount=members.length;
      listHtml+='<div class="team-card"><h4>'+esc(t.name)+'</h4><div class="team-meta">'+memberCount+' / '+esc(t.max_members||'?')+' 人</div>';
      listHtml+='<div style="display:flex;gap:8px;align-items:center"><button class="btn-primary btn-sm" onclick="requestJoinTeam('+t.id+','+compId+')">申请加入</button></div></div>';
    });
    content.innerHTML=listHtml;
  }catch(e){var c2=document.getElementById('joinTeamListContent');if(c2)c2.innerHTML='<div class="empty-state"><p>加载失败</p></div>'}
}
async function requestJoinTeam(teamId,compId){
  var user=getCurrentUser();if(!user)return;
  try{
    var res=await fetch(HUB_URL+'/rest/v1/team_members',{method:'POST',headers:HUB_HEADERS,body:JSON.stringify({team_id:teamId,user_id:user.id,role:'member',status:'pending'})});
    if(!res.ok){showCopyToast('申请失败，可能已申请过','warning');return}
    showCopyToast('已发送入队申请，请等待队长审核','success');
    document.body.style.overflow='';
    var modals=document.querySelectorAll('div[style*="position:fixed"]');modals.forEach(function(m){if(m.style.zIndex==='1000'||m.style.zIndex==='10000')m.remove()});
  }catch(e){showCopyToast('网络错误','warning')}
}

/* --- My Registrations Page --- */
async function renderMyRegistrations(){
  var container=document.getElementById('myRegsContent');
  if(!isLoggedIn()){container.innerHTML='<div class="login-required"><h3>请先登录</h3><p>登录后查看你的报名记录</p><button class="btn-primary" onclick="navigate(\'auth\')">去登录</button></div>';return}
  var user=getCurrentUser();
  /* 骨架屏加载占位 - 我的报名 */
  container.innerHTML='<div style="max-width:600px;margin:0 auto"><h2 class="content-page-title"><span class="gold">我的报名</span></h2><div class="skeleton-row"><div class="skeleton skeleton-avatar"></div><div class="skeleton-content"><div class="skeleton skeleton-line" style="width:70%"></div><div class="skeleton skeleton-line" style="width:50%"></div></div></div><div class="skeleton-row"><div class="skeleton skeleton-avatar"></div><div class="skeleton-content"><div class="skeleton skeleton-line" style="width:65%"></div><div class="skeleton skeleton-line" style="width:55%"></div></div></div><div class="skeleton-row"><div class="skeleton skeleton-avatar"></div><div class="skeleton-content"><div class="skeleton skeleton-line" style="width:75%"></div><div class="skeleton skeleton-line" style="width:45%"></div></div></div></div>';
  try{
    var res=await fetch(HUB_URL+'/rest/v1/registrations?user_id=eq.'+user.id+'&select=*,competitions(name,status,level,category,is_team)&order=created_at.desc',{headers:HUB_HEADERS});
    if(!res.ok){container.innerHTML='<div class="empty-state"><p>加载失败</p></div>';return}
    var regs=await res.json();
    if(regs.length===0){
      container.innerHTML='<div style="max-width:600px;margin:0 auto"><h2 class="content-page-title"><span class="gold">我的报名</span></h2><div class="empty-state"><div class="empty-state-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="14" y2="16"/></svg></div><p>暂无报名记录</p><p style="font-size:13px;margin-top:8px">前往学科竞赛页面报名</p><button class="btn-primary btn-sm" style="margin-top:16px" onclick="navigate(\'competition\')">浏览竞赛</button></div></div>';return;
    }
    var html='<div style="max-width:600px;margin:0 auto"><h2 class="content-page-title"><span class="gold">我的报名</span></h2><div style="font-size:13px;color:var(--text-muted);margin-bottom:16px">共 '+regs.length+' 条报名记录</div>';
    regs.forEach(function(r){
      var comp=r.competitions||{};
      html+='<div class="my-reg-card">';
      html+='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><div class="reg-title">'+esc(comp.name||'未知竞赛')+'</div>'+getRegStatusBadge(r.status)+'</div>';
      html+='<div class="reg-info">'+esc(user.name)+' | '+esc(user.college)+'</div>';
      if(r.reject_reason)html+='<div style="font-size:12px;color:#e74c3c;margin-top:4px">拒绝原因：'+esc(r.reject_reason)+'</div>';
      html+='<div class="reg-time">报名时间：'+formatTimeAgo(r.created_at)+'</div>';
      html+='<div class="reg-actions">';
      if(r.status==='pending')html+='<button class="btn-reject" onclick="cancelMyReg('+r.id+')">取消报名</button>';
      html+='</div></div>';
    });
    html+='</div>';
    container.innerHTML=html;
  }catch(e){container.innerHTML='<div class="empty-state"><p>加载失败：'+esc(e.message)+'</p></div>'}
}
async function cancelMyReg(regId){
  showConfirm('确定要取消该报名吗？',async function(){
    try{
      var res=await fetch(HUB_URL+'/rest/v1/registrations?id=eq.'+regId,{method:'PATCH',headers:HUB_HEADERS,body:JSON.stringify({status:'cancelled'})});
      if(res.ok){showCopyToast('已取消报名','success');renderMyRegistrations()}
      else showCopyToast('操作失败','warning');
    }catch(e){showCopyToast('网络错误','warning')}
  });
}

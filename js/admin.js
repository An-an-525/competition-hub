/* Extracted from app.js */
async function renderAdmin(){
  var container=document.getElementById('adminContent');
  if(!isAdmin()){container.innerHTML='<div class="login-required"><h3>无权限</h3><p>仅管理员可访问此页面</p><button class="btn-primary" onclick="navigate(\'home\')">返回首页</button></div>';return}
  container.innerHTML='<div class="loading-overlay"><div class="loading-spinner" style="width:32px;height:32px"></div><p style="margin-top:12px">加载管理数据...</p></div>';
  try{
    var regsRes=await fetch(HUB_URL+'/rest/v1/registrations?select=*,profiles!registrations_user_id_fkey(name,student_id,college),competitions(name,level,category)&order=created_at.desc',{headers:HUB_HEADERS});
    var compsRes=await fetch(HUB_URL+'/rest/v1/competitions?select=id,name',{headers:HUB_HEADERS});
    if(!regsRes.ok||!compsRes.ok){container.innerHTML='<div class="empty-state"><p>加载失败</p></div>';return}
    var regs=await regsRes.json();
    var comps=await compsRes.json();
    var total=regs.length;
    var pending=regs.filter(function(r){return r.status==='pending'}).length;
    var approved=regs.filter(function(r){return r.status==='approved'}).length;
    var colleges={};regs.forEach(function(r){var c=r.profiles?r.profiles.college:'未知';colleges[c]=(colleges[c]||0)+1});
    var html='<div style="max-width:800px;margin:0 auto"><h2 class="content-page-title"><span class="gold">管理面板</span></h2>';
    html+='<div class="admin-stat-grid"><div class="admin-stat-card"><div class="admin-stat-value">'+total+'</div><div class="admin-stat-label">总报名数</div></div><div class="admin-stat-card"><div class="admin-stat-value" style="color:#f39c12">'+pending+'</div><div class="admin-stat-label">待审核</div></div><div class="admin-stat-card"><div class="admin-stat-value" style="color:#2ecc71">'+approved+'</div><div class="admin-stat-label">已通过</div></div></div>';
    html+='<div class="admin-filter-bar"><select id="adminFilterComp" onchange="applyAdminFilters()"><option value="">全部竞赛</option>';
    comps.forEach(function(c){html+='<option value="'+c.id+'">'+esc(c.name)+'</option>'});
    html+='</select><select id="adminFilterStatus" onchange="applyAdminFilters()"><option value="">全部状态</option><option value="pending">待审核</option><option value="approved">已通过</option><option value="rejected">已拒绝</option><option value="cancelled">已取消</option></select><input type="text" id="adminSearchInput" placeholder="搜索学号/姓名..." oninput="applyAdminFilters()" /></div>';
    html+='<div id="adminRegList">';
    if(regs.length===0){
      html+='<div class="empty-state"><div class="empty-state-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="14" y2="16"/></svg></div><p>暂无报名记录</p></div>';
    }else{
      regs.forEach(function(r){
        var profile=r.profiles||{};var comp=r.competitions||{};
        html+='<div class="admin-reg-item" data-comp-id="'+(r.competition_id||'')+'" data-status="'+(r.status||'')+'" data-search="'+esc((profile.student_id||'')+''+(profile.name||'')).toLowerCase()+'">';
        html+='<div class="reg-header"><div class="reg-comp">'+esc(comp.name||'未知竞赛')+'</div>'+getRegStatusBadge(r.status)+'</div>';
        html+='<div class="reg-student">'+esc(profile.name||'未知')+' | '+esc(profile.student_id||'')+' | '+esc(profile.college||'')+'</div>';
        html+='<div class="reg-detail">报名时间：'+formatTimeAgo(r.created_at)+'</div>';
        if(r.note)html+='<div class="reg-detail" style="margin-top:4px">备注：'+esc(r.note)+'</div>';
        if(r.reject_reason)html+='<div class="reg-detail" style="margin-top:4px;color:#e74c3c">拒绝原因：'+esc(r.reject_reason)+'</div>';
        if(r.status==='pending'){
          html+='<div class="reg-actions"><button class="btn-approve" onclick="adminApprove('+r.id+')">通过</button><button class="btn-reject" onclick="toggleRejectForm('+r.id+')">拒绝</button></div>';
          html+='<div id="rejectForm-'+r.id+'" style="display:none"><textarea class="reject-reason-input" id="rejectReason-'+r.id+'" placeholder="请输入拒绝原因..."></textarea><div style="margin-top:8px;display:flex;gap:8px"><button class="btn-reject" onclick="adminReject('+r.id+')">确认拒绝</button><button class="btn-secondary btn-sm" onclick="document.getElementById(\'rejectForm-'+r.id+'\').style.display=\'none\'">取消</button></div></div>';
        }
        html+='</div>';
      });
    }
    html+='</div></div>';
    container.innerHTML=html;
  }catch(e){container.innerHTML='<div class="empty-state"><p>加载失败</p></div>'}
}
function applyAdminFilters(){
  var compId=document.getElementById('adminFilterComp')?document.getElementById('adminFilterComp').value:'';
  var status=document.getElementById('adminFilterStatus')?document.getElementById('adminFilterStatus').value:'';
  var q=document.getElementById('adminSearchInput')?document.getElementById('adminSearchInput').value.toLowerCase():'';
  document.querySelectorAll('.admin-reg-item').forEach(function(item){
    var itemComp=item.getAttribute('data-comp-id')||'';
    var itemStatus=item.getAttribute('data-status')||'';
    var itemSearch=item.getAttribute('data-search')||'';
    var matchComp=(!compId||itemComp===compId);
    var matchStatus=(!status||itemStatus===status);
    var matchQ=(!q||itemSearch.indexOf(q)>=0);
    item.style.display=(matchComp&&matchStatus&&matchQ)?'':'none';
  });
}
function toggleRejectForm(regId){
  var form=document.getElementById('rejectForm-'+regId);
  if(form)form.style.display=form.style.display==='none'?'block':'none';
}
async function adminApprove(regId){
  hapticFeedback();
  var user=getCurrentUser();if(!user)return;
  try{
    var res=await fetch(HUB_URL+'/rest/v1/registrations?id=eq.'+regId,{method:'PATCH',headers:HUB_HEADERS,body:JSON.stringify({status:'approved',reviewed_by:user.id,reviewed_at:new Date().toISOString()})});
    if(res.ok){showCopyToast('已通过','success');renderAdmin()}
    else showCopyToast('操作失败','warning');
  }catch(e){showCopyToast('网络错误','warning')}
}
async function adminReject(regId){
  hapticFeedback();
  var user=getCurrentUser();if(!user)return;
  var reasonEl=document.getElementById('rejectReason-'+regId);
  var reason=reasonEl?reasonEl.value.trim():'';
  try{
    var payload={status:'rejected',reviewed_by:user.id,reviewed_at:new Date().toISOString()};
    if(reason)payload.reject_reason=reason;
    var res=await fetch(HUB_URL+'/rest/v1/registrations?id=eq.'+regId,{method:'PATCH',headers:HUB_HEADERS,body:JSON.stringify(payload)});
    if(res.ok){showCopyToast('已拒绝','success');renderAdmin()}
    else showCopyToast('操作失败','warning');
  }catch(e){showCopyToast('网络错误','warning')}
}

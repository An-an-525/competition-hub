/* Extracted from app.js */
var HUB_URL='https://fdbbcibmqaogsbasoqly.supabase.co';
var HUB_KEY='sb_publishable_Vc1DwX3BjKjbeRq-tdvQqQ_m8Cm-6mZ';
var HUB_HEADERS={'apikey':HUB_KEY,'Authorization':'Bearer '+HUB_KEY,'Content-Type':'application/json','Prefer':'return=representation'};
var _cachedCompetitions=null;
var _cachedRegCounts={};
var _notifPollTimer=null;
var _cacheTimestamp = 0;
var _CACHE_TTL = 5 * 60 * 1000; // 5分钟

async function fetchCompetitions(){
  // 先返回缓存（如果有）
  if(_cachedCompetitions) return _cachedCompetitions;

  // 尝试从 localStorage 读取
  try {
    var cached = localStorage.getItem('hub_competitions');
    if(cached) {
      var parsed = JSON.parse(cached);
      if(parsed.data && parsed.ts && (Date.now() - parsed.ts < _CACHE_TTL)) {
        _cachedCompetitions = parsed.data;
        return parsed.data;
      }
      // 缓存过期但有数据，先返回旧数据，后台刷新
      if(parsed.data) {
        _cachedCompetitions = parsed.data;
        _refreshCompetitionsInBackground();
        return parsed.data;
      }
    }
  } catch(e) {}

  // 无缓存，正常请求
  return await _fetchCompetitionsFromServer();
}

async function _fetchCompetitionsFromServer(){
  try{
    var res=await fetch(HUB_URL+'/rest/v1/competitions?order=sort_order.desc,created_at.desc',{headers:HUB_HEADERS});
    if(!res.ok)throw new Error('HTTP '+res.status);
    var data=await res.json();
    if(data&&data.length>0){
      _cachedCompetitions=data;
      // 存入 localStorage
      try { localStorage.setItem('hub_competitions', JSON.stringify({data:data, ts:Date.now()})); } catch(e){}
      return data;
    }
  }catch(e){console.warn('Supabase竞赛数据获取失败，使用本地数据:',e.message)}
  // Fallback to local CSUST_DATA
  if(typeof CSUST_DATA!=='undefined'&&CSUST_DATA.competitions&&CSUST_DATA.competitions.length>0){
    _cachedCompetitions=CSUST_DATA.competitions.map(function(c,i){
      return{id:c.id||(1000+i),name:c.name,level:c.level||'校级',category:c.category||'',organizer:c.organizer||'',description:c.description||c.detail||'',requirements:c.requirements||'',reg_start:null,reg_end:null,comp_date:c.time||'',is_team:c.isTeam||false,team_min:c.teamMin||1,team_max:c.teamMax||5,status:'open',sort_order:100-i};
    });
    return _cachedCompetitions;
  }
  return[];
}

function _refreshCompetitionsInBackground(){
  _fetchCompetitionsFromServer().then(function(data){
    if(data && data.length > 0) {
      // 静默刷新成功，更新页面（如果当前在竞赛页面）
      var hubList = document.getElementById('hubCompList');
      if(hubList) renderCompHub(document.getElementById('competitionContent'));
    }
  });
}
async function fetchRegCounts(){
  try{
    var res=await fetch(HUB_URL+'/rest/v1/registrations?select=competition_id,status',{headers:HUB_HEADERS});
    if(!res.ok)return{};
    var regs=await res.json();
    var counts={};
    regs.forEach(function(r){counts[r.competition_id]=(counts[r.competition_id]||0)+1});
    _cachedRegCounts=counts;return counts;
  }catch(e){return{}}
}
function getStatusBadge(status){
  var map={open:['报名中','status-open'],upcoming:['即将开放','status-upcoming'],closed:['已关闭','status-closed'],ended:['已结束','status-ended']};
  var s=map[status]||[status||'未知','status-ended'];
  return'<span class="status-badge '+s[1]+'">'+esc(s[0])+'</span>';
}
function getRegStatusBadge(status){
  var map={pending:['待审核','status-pending'],approved:['已通过','status-approved'],rejected:['已拒绝','status-rejected'],cancelled:['已取消','status-cancelled']};
  var s=map[status]||[status||'未知','status-ended'];
  return'<span class="status-badge '+s[1]+'">'+esc(s[0])+'</span>';
}
function getTeamStatusBadge(status){
  var map={forming:['组队中','status-forming'],submitted:['已提交','status-submitted'],approved:['已通过','status-approved'],rejected:['已拒绝','status-rejected']};
  var s=map[status]||[status||'未知','status-ended'];
  return'<span class="status-badge '+s[1]+'">'+esc(s[0])+'</span>';
}
function formatDate(d){
  if(!d)return'';
  var dt=new Date(d);
  // 检查日期是否有效
  if(isNaN(dt.getTime()))return d; // 返回原始值而非格式化
  return dt.getFullYear()+'-'+(dt.getMonth()+1<10?'0':'')+(dt.getMonth()+1)+'-'+(dt.getDate()<10?'0':'')+dt.getDate();
}

/* --- Competition Display (Hub) --- */
/* --- Render Featured Competitions on Homepage --- */
async function renderFeaturedCompetitions(){
  var row=document.getElementById('featuredCompsRow');
  if(!row)return;
  try{
    var comps=await fetchCompetitions();
    if(!comps||comps.length===0){
      row.style.display='none';
      return;
    }
    var featured=comps.slice(0,4);
    var html='';
    featured.forEach(function(c){
      var levelClass=getLevelClass(c.level);
      var levelLabel=c.level||'校级';
      html+='<div class="featured-comp-card" onclick="navigate(\'competition\')">';
      html+='<div class="featured-comp-header '+levelClass+'">';
      html+='<div class="featured-comp-name">'+esc(c.name)+'</div>';
      html+='</div>';
      html+='<div class="featured-comp-body">';
      html+='<div class="featured-comp-level">'+esc(levelLabel)+'</div>';
      if(c.organizer)html+='<div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">'+esc(c.organizer)+'</div>';
      html+='<button class="featured-comp-btn" onclick="event.stopPropagation();showHubCompDetail('+c.id+')">查看详情 &#8250;</button>';
      html+='</div></div>';
    });
    row.innerHTML=html;
  }catch(e){
    row.style.display='none';
  }
}

/* --- Competition Hub Helper Functions --- */
function getLevelClass(level){
  if(!level)return 'level-c';
  var l=level.toLowerCase();
  if(l.indexOf('a')>=0||l.indexOf('国家级')>=0||l.indexOf('国际')>=0)return 'level-a';
  if(l.indexOf('b')>=0||l.indexOf('省级')>=0)return 'level-b';
  return 'level-c';
}
function getCategoryIconClass(category){
  if(!category)return 'cat-default';
  var c=category.toLowerCase();
  if(c.indexOf('数学')>=0||c.indexOf('建模')>=0)return 'cat-math';
  if(c.indexOf('结构')>=0||c.indexOf('土木')>=0||c.indexOf('建筑')>=0)return 'cat-structure';
  if(c.indexOf('英语')>=0||c.indexOf('演讲')>=0||c.indexOf('外')>=0)return 'cat-english';
  if(c.indexOf('创业')>=0||c.indexOf('互联网')>=0||c.indexOf('创新')>=0)return 'cat-startup';
  return 'cat-default';
}
function getCategoryIconSvg(category){
  if(!category)return svgIcon('trophy',20);
  var c=category.toLowerCase();
  if(c.indexOf('数学')>=0||c.indexOf('建模')>=0)return svgIcon('calculator',20);
  if(c.indexOf('结构')>=0||c.indexOf('土木')>=0||c.indexOf('建筑')>=0)return svgIcon('building',20);
  if(c.indexOf('英语')>=0||c.indexOf('演讲')>=0||c.indexOf('外')>=0)return svgIcon('message',20);
  if(c.indexOf('创业')>=0||c.indexOf('互联网')>=0||c.indexOf('创新')>=0)return svgIcon('rocket',20);
  return svgIcon('trophy',20);
}

async function renderCompHub(container){
  /* 骨架屏加载占位 */
  var skeletonHtml='<div class="skeleton-card"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-line" style="width:80%"></div><div class="skeleton skeleton-line" style="width:60%"></div><div class="skeleton skeleton-line" style="width:90%"></div></div>';
  skeletonHtml+='<div class="skeleton-card"><div class="skeleton skeleton-title" style="width:70%"></div><div class="skeleton skeleton-line" style="width:75%"></div><div class="skeleton skeleton-line" style="width:55%"></div><div class="skeleton skeleton-line" style="width:85%"></div></div>';
  skeletonHtml+='<div class="skeleton-card"><div class="skeleton skeleton-title" style="width:65%"></div><div class="skeleton skeleton-line" style="width:90%"></div><div class="skeleton skeleton-line" style="width:70%"></div><div class="skeleton skeleton-line" style="width:60%"></div></div>';
  container.innerHTML=skeletonHtml;
  var comps=await fetchCompetitions();
  var counts=await fetchRegCounts();
  var categories=['全部'];comps.forEach(function(c){if(categories.indexOf(c.category)<0)categories.push(c.category)});
  var statuses=['全部','open','upcoming','closed','ended'];
  var statusLabels={'全部':'全部','open':'报名中','upcoming':'即将开放','closed':'已关闭','ended':'已结束'};
  var html='<div style="margin-bottom:12px"><input type="text" class="form-input" id="hubSearchInput" placeholder="搜索竞赛名称..." oninput="applyHubFilters()"/></div>';
  html+='<div style="margin-bottom:8px"><div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">分类</div><div class="club-filter-bar" id="hubCatFilter">';
  categories.forEach(function(c,i){html+='<button class="club-filter-btn'+(i===0?' active':'')+'" onclick="filterHubBy(\'cat\',\''+esc(c)+'\')">'+esc(c)+'</button>'});
  html+='</div></div><div style="margin-bottom:12px"><div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">状态</div><div class="club-filter-bar" id="hubStatusFilter">';
  statuses.forEach(function(s,i){html+='<button class="club-filter-btn'+(i===0?' active':'')+'" onclick="filterHubBy(\'status\',\''+s+'\')">'+esc(statusLabels[s])+'</button>'});
  html+='</div></div>';
  // 排序下拉 + 已选条件
  html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">';
  html+='<select id="hubSortSelect" onchange="applyHubFilters()" style="padding:6px 12px;border:1px solid var(--border);border-radius:8px;background:var(--panel-bg);color:var(--text-primary);font-size:13px">';
  html+='<option value="default">默认排序</option>';
  html+='<option value="deadline">按截止时间</option>';
  html+='<option value="name">按名称</option>';
  html+='</select>';
  html+='<div id="hubActiveFilters" style="font-size:12px;color:var(--text-muted)"></div>';
  html+='<button id="hubClearFilters" style="display:none;font-size:12px;color:var(--accent);background:none;border:none;cursor:pointer;text-decoration:underline" onclick="clearHubFilters()">清除筛选</button>';
  html+='</div>';
  html+='<div id="hubCompList" class="knowledge-list"><div id="hubCompCount" style="font-size:12px;color:var(--text-muted);margin-bottom:8px">共 '+comps.length+' 项竞赛</div>';
  comps.forEach(function(c,idx){
    var regCount=counts[c.id]||0;
    var levelClass=getLevelClass(c.level);
    var catClass=getCategoryIconClass(c.category);
    var catIconSvg=getCategoryIconSvg(c.category);
    var isFeatured=idx===0;
    html+='<div class="comp-hub-card hub-card'+(isFeatured?' hub-card-featured':'')+'" data-name="'+esc((c.name||'').toLowerCase())+'" data-category="'+esc(c.category||'')+'" data-status="'+esc(c.status||'')+'" data-level="'+esc(c.level||'')+'" data-reg-end="'+esc(c.reg_end||'')+'" onclick="showHubCompDetail('+c.id+')">';
    html+='<div class="comp-card-gradient '+levelClass+'"></div>';
    html+='<div class="comp-card-category-icon '+catClass+'">'+catIconSvg+'</div>';
    html+='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><h4 style="flex:1">'+esc(c.name)+'</h4><div style="display:flex;gap:4px;align-items:center;flex-shrink:0">'+getFavoriteButtonHtml(String(c.id))+getReminderButtonHtml(String(c.id), c.name, c.reg_end || '')+'</div>'+getStatusBadge(c.status)+'</div>';
    html+='<div class="comp-hub-meta">';
    if(c.level)html+='<span class="tag-pill">'+esc(c.level)+'</span>';
    if(c.category)html+='<span class="tag-pill" style="background:var(--surface-gold-subtle);color:var(--gold)">'+esc(c.category)+'</span>';
    html+='</div>';
    if(c.description)html+='<div class="comp-hub-info" style="margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(c.description)+'</div>';
    html+='<div class="comp-hub-info">';
    if(c.organizer)html+='<div>主办：'+esc(c.organizer)+'</div>';
    if(c.comp_date)html+='<div>比赛：'+esc(formatDate(c.comp_date))+'</div>';
    if(c.reg_start)html+='<div>报名：'+esc(formatDate(c.reg_start))+' ~ '+(c.reg_end?esc(formatDate(c.reg_end)):'待定')+'</div>';
    html+='</div>';
    html+='<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px"><div class="reg-count"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'+regCount+'人已报名</div>';
    if(c.status==='open')html+='<button class="btn-primary btn-sm" onclick="event.stopPropagation();startApplication('+c.id+')">立即报名</button>';
    html+='</div>';
  });
  html+='</div>';
  html+='<div id="hubPagination"></div>';
  container.innerHTML=html;
  // 初始化分页和筛选
  _hubPage = 1;
  applyHubFilters();
}
function filterHubBy(type,val){
  var filterId=type==='cat'?'hubCatFilter':'hubStatusFilter';
  document.querySelectorAll('#'+filterId+' .club-filter-btn').forEach(function(b){b.classList.toggle('active',b.textContent===val)});
  _hubPage = 1;
  applyHubFilters();
}
function applyHubFilters(){
  var activeCat=document.querySelector('#hubCatFilter .club-filter-btn.active');
  var activeStatus=document.querySelector('#hubStatusFilter .club-filter-btn.active');
  var cat=activeCat?activeCat.textContent:'全部';
  var status=activeStatus?activeStatus.textContent:'全部';
  var statusMap={'全部':'','报名中':'open','即将开放':'upcoming','已关闭':'closed','已结束':'ended'};
  var statusVal=statusMap[status]||'';
  var q=document.getElementById('hubSearchInput')?document.getElementById('hubSearchInput').value.toLowerCase():'';
  var visibleCount=0;
  var sortSelect=document.getElementById('hubSortSelect');
  var sortVal=sortSelect?sortSelect.value:'default';
  // 收集可见卡片并排序
  var visibleCards=[];
  document.querySelectorAll('.hub-card').forEach(function(card){
    var name=card.getAttribute('data-name')||'';
    var cardCat=card.getAttribute('data-category')||'';
    var cardStatus=card.getAttribute('data-status')||'';
    var matchCat=(cat==='全部'||cardCat===cat);
    var matchStatus=(!statusVal||cardStatus===statusVal);
    var matchQ=(!q||name.indexOf(q)>=0);
    if(matchCat&&matchStatus&&matchQ){
      card.style.display='';
      visibleCards.push(card);
      visibleCount++;
    }else{
      card.style.display='none';
    }
  });
  // 排序
  if(sortVal==='deadline'){
    visibleCards.sort(function(a,b){
      var da=a.getAttribute('data-reg-end')||'';
      var db=b.getAttribute('data-reg-end')||'';
      if(!da&&db)return 1;if(da&&!db)return -1;return da.localeCompare(db);
    });
  }else if(sortVal==='name'){
    visibleCards.sort(function(a,b){
      return(a.getAttribute('data-name')||'').localeCompare(b.getAttribute('data-name')||'');
    });
  }
  // 重新排列DOM
  var list=document.getElementById('hubCompList');
  if(list){
    visibleCards.forEach(function(card){list.appendChild(card)});
  }
  // 分页
  var pages=Math.ceil(visibleCount/_hubPageSize);
  visibleCards.forEach(function(card,idx){
    if(pages>1){
      card.style.display=(idx>=(_hubPage-1)*_hubPageSize&&idx<_hubPage*_hubPageSize)?'':'none';
    }
  });
  // 更新分页UI
  var pagEl=document.getElementById('hubPagination');
  if(pagEl)pagEl.innerHTML=renderHubPagination(visibleCount,visibleCount);
  // 更新已选条件
  updateHubActiveFilters(cat,statusVal,q);
  var countEl=document.getElementById('hubCompCount');
  if(countEl)countEl.textContent='显示 '+visibleCount+' 项竞赛';
}

var _hubPage = 1;
var _hubPageSize = 8;

function renderHubPagination(total, visible) {
  var pages = Math.ceil(visible / _hubPageSize);
  if(pages <= 1) return '';
  var html = '<div style="display:flex;justify-content:center;gap:8px;margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">';
  html += '<button class="btn-secondary btn-sm" onclick="hubGoPage(' + (_hubPage-1) + ')"' + (_hubPage<=1?' disabled':'') + '>上一页</button>';
  for(var i=1;i<=pages;i++){
    html += '<button class="btn-sm ' + (i===_hubPage?'btn-primary':'btn-secondary') + '" style="min-width:36px" onclick="hubGoPage('+i+')">'+i+'</button>';
  }
  html += '<button class="btn-secondary btn-sm" onclick="hubGoPage(' + (_hubPage+1) + ')"' + (_hubPage>=pages?' disabled':'') + '>下一页</button>';
  html += '</div>';
  return html;
}

function hubGoPage(p) {
  _hubPage = p;
  applyHubFilters();
}

function updateHubActiveFilters(cat,statusVal,q){
  var el=document.getElementById('hubActiveFilters');
  var clearBtn=document.getElementById('hubClearFilters');
  if(!el)return;
  var tags=[];
  if(cat&&cat!=='全部')tags.push('分类:'+cat);
  if(statusVal){
    var sm={'open':'报名中','upcoming':'即将开放','closed':'已关闭','ended':'已结束'};
    tags.push('状态:'+(sm[statusVal]||statusVal));
  }
  if(q)tags.push('搜索:'+q);
  if(tags.length>0){
    el.textContent='已选: '+tags.join(' / ');
    if(clearBtn)clearBtn.style.display='';
  }else{
    el.textContent='';
    if(clearBtn)clearBtn.style.display='none';
  }
}

function clearHubFilters(){
  _hubPage=1;
  document.querySelectorAll('#hubCatFilter .club-filter-btn').forEach(function(b,i){b.classList.toggle('active',i===0)});
  document.querySelectorAll('#hubStatusFilter .club-filter-btn').forEach(function(b,i){b.classList.toggle('active',i===0)});
  var si=document.getElementById('hubSearchInput');if(si)si.value='';
  var ss=document.getElementById('hubSortSelect');if(ss)ss.value='default';
  applyHubFilters();
}

/* --- Competition Detail Modal --- */
async function showHubCompDetail(compId){
  var comps=await fetchCompetitions();var c=comps.find(function(x){return x.id===compId});if(!c)return;
  var counts=await fetchRegCounts();var regCount=counts[compId]||0;
  var user=getCurrentUser();
  var html='<div style="max-height:70vh;overflow-y:auto;padding-right:8px">';
  html+='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:12px"><h3 style="font-size:18px;color:var(--text-primary);flex:1">'+esc(c.name)+'</h3>'+getStatusBadge(c.status)+'</div>';
  html+='<div style="display:flex;gap:8px;margin:8px 0">'+getFavoriteButtonHtml(String(compId))+getReminderButtonHtml(String(compId), c.name, c.reg_end || '')+'</div>';
  html+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:16px">';
  if(c.level)html+='<span class="tag-pill">'+esc(c.level)+'</span>';
  if(c.category)html+='<span class="tag-pill" style="background:var(--surface-gold-subtle);color:var(--gold)">'+esc(c.category)+'</span>';
  if(c.is_team)html+='<span class="tag-pill" style="background:rgba(52,152,219,0.12);color:#3498db">团队赛 ('+esc(c.team_min||'?')+'-'+esc(c.team_max||'?')+'人)</span>';
  else html+='<span class="tag-pill" style="background:rgba(46,204,113,0.12);color:#2ecc71">个人赛</span>';
  html+='</div>';
  html+='<div class="info-row"><div class="info-label">主办单位</div><div class="info-value" style="max-width:70%">'+esc(c.organizer||'')+'</div></div>';
  if(c.reg_start)html+='<div class="info-row"><div class="info-label">报名时间</div><div class="info-value">'+esc(formatDate(c.reg_start))+' ~ '+(c.reg_end?esc(formatDate(c.reg_end)):'待定')+'</div></div>';
  if(c.comp_date)html+='<div class="info-row"><div class="info-label">比赛时间</div><div class="info-value">'+esc(formatDate(c.comp_date))+'</div></div>';
  if(c.location)html+='<div class="info-row"><div class="info-label">比赛地点</div><div class="info-value">'+esc(c.location)+'</div></div>';
  if(c.max_registrations)html+='<div class="info-row"><div class="info-label">名额限制</div><div class="info-value">'+esc(c.max_registrations)+'人</div></div>';
  html+='<div class="info-row"><div class="info-label">已报名</div><div class="info-value" style="color:var(--accent)">'+regCount+'人</div></div>';
  if(c.requirements)html+='<div style="margin-top:16px"><h4 style="font-size:14px;color:var(--text-primary);margin-bottom:8px">参赛要求</h4><p style="font-size:13px;color:var(--text-secondary);line-height:1.8">'+esc(c.requirements)+'</p></div>';
  if(c.description)html+='<div style="margin-top:12px"><h4 style="font-size:14px;color:var(--text-primary);margin-bottom:8px">竞赛介绍</h4><p style="font-size:13px;color:var(--text-secondary);line-height:1.8">'+esc(c.description)+'</p></div>';
  html+='<div style="margin-top:20px">';
  if(c.status==='open'){
    if(!user){html+='<button class="btn-primary" onclick="document.body.style.overflow=\'\';this.closest(\'div[style]\').parentElement.remove();navigate(\'auth\')">登录后报名</button>'}
    else{html+='<button class="btn-primary" onclick="document.body.style.overflow=\'\';this.closest(\'div[style]\').parentElement.remove();startApplication('+c.id+')">立即报名</button>'}
  }else{
    html+='<button class="btn-primary" disabled>当前不可报名</button>';
  }
  html+='</div></div>';
  showCompModal(html);
}

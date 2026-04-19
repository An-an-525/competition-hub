/* Extracted from app.js */
function getCompLevelTag(level){
  if(level.indexOf('A类')>=0)return'<span class="tag-pill" style="background:rgba(231,76,60,0.12);color:#e74c3c">A类</span>';
  if(level.indexOf('B+')>=0)return'<span class="tag-pill" style="background:rgba(243,156,18,0.12);color:#f39c12">B+类</span>';
  if(level.indexOf('B-')>=0)return'<span class="tag-pill" style="background:rgba(52,152,219,0.12);color:#3498db">B-类</span>';
  if(level.indexOf('C')>=0)return'<span class="tag-pill" style="background:rgba(149,165,166,0.12);color:#95a5a6">C类</span>';
  if(level.indexOf('省级')>=0)return'<span class="tag-pill" style="background:rgba(46,204,113,0.12);color:#2ecc71">省级</span>';
  return'<span class="tag-pill">'+esc(level)+'</span>';
}
function getCompCategoryColor(cat){
  var colors={'理工类':'rgba(52,152,219,0.12);color:#3498db','创新创业类':'rgba(231,76,60,0.12);color:#e74c3c','公共安全类':'rgba(155,89,182,0.12);color:#9b59b6','文科类':'rgba(46,204,113,0.12);color:#2ecc71','艺术体育类':'rgba(243,156,18,0.12);color:#f39c12','综合类':'rgba(149,165,166,0.12);color:#95a5a6'};
  var c=colors[cat]||'rgba(149,165,166,0.12);color:#95a5a6';
  return'<span class="tag-pill" style="background:'+c+'">'+esc(cat)+'</span>';
}
function getCSUSTLevel(status){
  if(!status)return'';
  if(status.indexOf('A类')>=0)return'A类';
  if(status.indexOf('B+')>=0)return'B+类';
  if(status.indexOf('B-')>=0)return'B-类';
  if(status.indexOf('C级')>=0)return'C级';
  return'';
}
function switchCompetitionTab(tab){
  var tabs=document.querySelectorAll('#competitionTabs .tab-btn');
  var tabMap={all:0,calendar:1,achievements:2,guide:3,security:4};
  tabs.forEach(function(t){t.classList.remove('active')});
  if(tabMap[tab]!==undefined&&tabs[tabMap[tab]])tabs[tabMap[tab]].classList.add('active');
  var container=document.getElementById('competitionContent');
  if(tab==='all')renderCompAll(container);
  else if(tab==='calendar')renderCompCalendar(container);
  else if(tab==='achievements')renderCompAchievements(container);
  else if(tab==='guide')renderCompGuide(container);
  else if(tab==='security')renderCompSecurity(container);
}
function renderCompAll(container){
  var categories=['全部','理工类','创新创业类','公共安全类','文科类','艺术体育类','综合类'];
  var levels=['全部','A类','B+类','B-类','C级'];
  var html='<div style="margin-bottom:12px"><input type="text" class="form-input" id="compSearchInput" placeholder="搜索竞赛名称..." oninput="filterCompetitions()"/></div>';
  html+='<div style="margin-bottom:8px"><div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">分类筛选</div><div class="club-filter-bar" id="compCatFilter">';
  categories.forEach(function(c,i){html+='<button class="club-filter-btn'+(i===0?' active':'')+'" onclick="filterCompByCategory(\''+c+'\')">'+esc(c)+'</button>'});
  html+='</div></div><div style="margin-bottom:12px"><div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">级别筛选</div><div class="club-filter-bar" id="compLevelFilter">';
  levels.forEach(function(l,i){html+='<button class="club-filter-btn'+(i===0?' active':'')+'" onclick="filterCompByLevel(\''+l+'\')">'+esc(l)+'</button>'});
  html+='</div></div><div id="compList" class="knowledge-list"><div id="compCount" style="font-size:12px;color:var(--text-muted);margin-bottom:8px">共 '+CSUST_DATA.competitions.length+' 项竞赛</div>';
  CSUST_DATA.competitions.forEach(function(c,idx){
    var csustLvl=getCSUSTLevel(c.csust_status);
    html+='<div class="knowledge-card comp-card" data-name="'+esc(c.name.toLowerCase())+'" data-category="'+esc(c.category)+'" data-csust-level="'+esc(csustLvl)+'">';
    html+='<h4>'+esc(c.name)+'</h4>';
    html+='<div style="margin:8px 0;display:flex;flex-wrap:wrap;gap:4px">';
    html+=getCompCategoryColor(c.category);
    if(c.ministry_recognized)html+='<span class="tag-pill" style="background:rgba(217,119,6,0.12);color:var(--accent)">教育部认可</span>';
    if(csustLvl)html+=getCompLevelTag(csustLvl);
    html+='</div>';
    html+='<div class="info-row"><div class="info-label">主办单位</div><div class="info-value" style="max-width:70%">'+esc(c.organizer)+'</div></div>';
    html+='<div class="info-row"><div class="info-label">比赛时间</div><div class="info-value">'+esc(c.competition_period)+'</div></div>';
    // 截止日期高亮
    if(c.registration_period){
      html+='<div class="info-row"><div class="info-label">报名截止</div><div class="info-value" style="color:'+(c.registration_period.indexOf('待定')>=0?'var(--text-muted)':'#ef4444')+'">'+esc(c.registration_period)+'</div></div>';
    }
    if(c.csust_status)html+='<div class="info-row"><div class="info-label">长理参赛</div><div class="info-value" style="color:var(--accent)">'+esc(c.csust_status)+'</div></div>';
    html+='<div style="margin-top:10px"><button class="btn-secondary btn-sm" onclick="showCompDetail('+idx+')">查看详情</button>';
    if(c.official_website)html+=' <a href="'+esc(c.official_website)+'" target="_blank" class="btn-secondary btn-sm" style="text-decoration:none;margin-left:6px">官网</a>';
    html+='</div></div>';
  });
  html+='</div>';
  container.innerHTML=html;
}

function filterCompetitions(){
  applyCompFilters();
}
function filterCompByCategory(cat){
  document.querySelectorAll('#compCatFilter .club-filter-btn').forEach(function(b){b.classList.toggle('active',b.textContent===cat)});
  applyCompFilters();
}
function filterCompByLevel(lvl){
  document.querySelectorAll('#compLevelFilter .club-filter-btn').forEach(function(b){b.classList.toggle('active',b.textContent===lvl)});
  applyCompFilters();
}
function applyCompFilters(){
  var activeCat=document.querySelector('#compCatFilter .club-filter-btn.active');
  var activeLvl=document.querySelector('#compLevelFilter .club-filter-btn.active');
  var cat=activeCat?activeCat.textContent:'全部';
  var lvl=activeLvl?activeLvl.textContent:'全部';
  var q=document.getElementById('compSearchInput')?document.getElementById('compSearchInput').value.toLowerCase():'';
  var visibleCount=0;
  document.querySelectorAll('.comp-card').forEach(function(card){
    var name=card.getAttribute('data-name');
    var category=card.getAttribute('data-category');
    var csustLvl=card.getAttribute('data-csust-level');
    var matchCat=(cat==='全部'||category===cat);
    var matchLvl=(lvl==='全部'||csustLvl===lvl);
    var matchQ=(!q||name.indexOf(q)>=0);
    card.style.display=(matchCat&&matchLvl&&matchQ)?'':'none';
    if(matchCat&&matchLvl&&matchQ)visibleCount++;
  });
  var countEl=document.getElementById('compCount');
  if(countEl)countEl.textContent='显示 '+visibleCount+' / '+CSUST_DATA.competitions.length+' 项';
}
function showCompDetail(idx){
  var c=CSUST_DATA.competitions[idx];
  if(!c)return;
  var html='<div style="max-height:70vh;overflow-y:auto;padding-right:8px">';
  html+='<h3 style="font-size:18px;color:var(--text-primary);margin-bottom:12px">'+esc(c.name)+'</h3>';
  html+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:16px">';
  html+=getCompCategoryColor(c.category);
  if(c.ministry_recognized)html+='<span class="tag-pill" style="background:rgba(217,119,6,0.12);color:var(--accent)">教育部认可</span>';
  html+='</div>';
  html+='<div class="info-row"><div class="info-label">主办单位</div><div class="info-value" style="max-width:70%">'+esc(c.organizer)+'</div></div>';
  html+='<div class="info-row"><div class="info-label">级别</div><div class="info-value">'+esc(c.level)+'</div></div>';
  html+='<div class="info-row"><div class="info-label">报名时间</div><div class="info-value">'+esc(c.registration_period)+'</div></div>';
  html+='<div class="info-row"><div class="info-label">比赛时间</div><div class="info-value">'+esc(c.competition_period)+'</div></div>';
  html+='<div class="info-row"><div class="info-label">奖项设置</div><div class="info-value" style="max-width:70%">'+esc(c.awards)+'</div></div>';
  if(c.csust_status)html+='<div class="info-row"><div class="info-label">长理参赛</div><div class="info-value" style="color:var(--accent);max-width:70%">'+esc(c.csust_status)+'</div></div>';
  html+='<div style="margin-top:16px"><h4 style="font-size:14px;color:var(--text-primary);margin-bottom:8px">竞赛介绍</h4><p style="font-size:13px;color:var(--text-secondary);line-height:1.8">'+esc(c.description)+'</p></div>';
  if(c.official_website)html+='<div style="margin-top:12px"><a href="'+esc(c.official_website)+'" target="_blank" class="btn-primary btn-sm" style="text-decoration:none;display:inline-block">访问官方网站</a></div>';
    // 报名 CTA
    var regDeadline = c.registration_period || '';
    var hasDeadline = regDeadline.length > 0;
    html += '<div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border-subtle)">';
    html += '<button class="btn-primary" style="width:100%;padding:14px;font-size:15px" onclick="handleCompRegister(\'' + idx + '\')">';
    html += hasDeadline ? '立即报名（截止：' + esc(regDeadline) + '）' : '立即报名';
    html += '</button>';
    if (c.official_website) {
      html += '<p style="font-size:11px;color:var(--text-muted);margin-top:8px;text-align:center">也可前往 <a href="' + esc(c.official_website) + '" target="_blank" style="color:var(--accent)">官方网站</a> 报名</p>';
    }
    html += '</div>';
  html+='</div>';
  showCompModal(html);
}
function handleCompRegister(idx) {
  var c = CSUST_DATA.competitions[idx];
  if (!c) return;
  var user = getCurrentUser();
  if (!user) {
    showConfirm('报名需要先登录，是否前往登录？', function() {
      navigate('auth');
    });
    return;
  }
  if (c.official_website) {
    showConfirm('将跳转到 ' + esc(c.name) + ' 的官方网站进行报名，是否继续？', function() {
      window.open(c.official_website, '_blank');
    });
  } else {
    showCopyToast('该竞赛暂未开放在线报名，请关注官方通知', 'info');
  }
}
function showCompModal(contentHtml){
  var overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);z-index:1000;display:flex;justify-content:center;align-items:center;padding:20px';
  overlay.onclick=function(e){if(e.target===overlay){document.body.removeChild(overlay);document.body.style.overflow=''}};
  var modal=document.createElement('div');
  modal.style.cssText='background:var(--bg-card,#FFFFFF);border:1px solid var(--border-subtle,rgba(0,0,0,0.1));border-radius:20px;padding:28px;max-width:560px;width:100%;box-shadow:0 8px 30px rgba(0,0,0,0.12);position:relative;max-height:85vh;overflow-y:auto';
  var closeBtn=document.createElement('button');
  closeBtn.style.cssText='position:absolute;top:16px;right:16px;background:none;border:1px solid var(--border-subtle,rgba(0,0,0,0.1));color:var(--text-muted,#6B7280);width:36px;height:36px;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center';
  closeBtn.innerHTML=svgIcon('x',18);
  closeBtn.onclick=function(){document.body.removeChild(overlay);document.body.style.overflow=''};
  modal.innerHTML=contentHtml;
  modal.insertBefore(closeBtn,modal.firstChild);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  document.body.style.overflow='hidden';
}
function renderCompCalendar(container){
  var months=['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  var currentMonth=new Date().getMonth();
  var monthNames=['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
  var html='<p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">按月份显示各竞赛的报名和比赛时间，当前月份已高亮。</p>';
  months.forEach(function(m,i){
    var monthComps=[];
    CSUST_DATA.competitions.forEach(function(c){
      var regP=c.registration_period||'';
      var compP=c.competition_period||'';
      var allTime=regP+' '+compP;
      var monthNum=i+1;
      var monthPattern=new RegExp('(^|[^0-9])'+monthNum+'月');
      if(monthPattern.test(allTime)){
        monthComps.push(c);
      }
    });
    var isCurrentMonth=(i===currentMonth);
    html+='<div style="margin-bottom:16px;padding:16px;border-radius:12px;border:1px solid '+(isCurrentMonth?'var(--border-gold-strong)':'var(--border-subtle)')+';background:'+(isCurrentMonth?'var(--surface-gold-subtle)':'var(--bg-card)')+'">';
    html+='<h4 style="font-size:15px;color:var(--text-primary);margin-bottom:10px">'+esc(monthNames[i]);
    if(isCurrentMonth)html+=' <span style="font-size:11px;color:var(--accent);font-weight:400">当前</span>';
    html+=' <span style="font-size:12px;color:var(--text-muted);font-weight:400">('+monthComps.length+'项)</span></h4>';
    if(monthComps.length===0){
      html+='<p style="font-size:13px;color:var(--text-muted)">本月暂无竞赛安排</p>';
    }else{
      monthComps.forEach(function(c){
        var csustLvl=getCSUSTLevel(c.csust_status);
        html+='<div style="padding:8px 0;border-bottom:1px solid var(--border-subtle)">';
        html+='<div style="font-size:14px;color:var(--text-primary);font-weight:500">'+esc(c.name)+'</div>';
        html+='<div style="font-size:12px;color:var(--text-muted);margin-top:2px">报名：'+esc(c.registration_period)+' | 比赛：'+esc(c.competition_period)+'</div>';
        html+='<div style="margin-top:4px">'+getCompCategoryColor(c.category)+(csustLvl?getCompLevelTag(csustLvl):'')+'</div>';
        html+='</div>';
      });
    }
    html+='</div>';
  });
  container.innerHTML=html;
}
function renderCompAchievements(container){
  var html='<p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">长沙理工大学在各学科竞赛中的获奖情况和参赛成绩。</p>';
  var hasAchievement=CSUST_DATA.competitions.filter(function(c){return c.csust_status&&c.csust_status.length>0});
  html+='<div style="margin-bottom:16px;padding:16px;border-radius:12px;background:var(--surface-gold-subtle);border:1px solid var(--border-gold)">';
  html+='<h4 style="color:var(--accent);margin-bottom:8px">竞赛支持概况</h4>';
  html+='<p style="font-size:13px;color:var(--text-secondary)">长沙理工大学共支持 <strong>'+CSUST_DATA.competitions.length+'</strong> 项学科竞赛，其中教育部认可 <strong>'+CSUST_DATA.competitions.filter(function(c){return c.ministry_recognized}).length+'</strong> 项。</p>';
  html+='</div>';
  html+='<div class="knowledge-list">';
  hasAchievement.forEach(function(c,idx){
    var status=c.csust_status;
    var isHighlight=status.indexOf('特等奖')>=0||status.indexOf('金奖')>=0||status.indexOf('一等奖')>=0||status.indexOf('擂主')>=0;
    html+='<div class="knowledge-card" style="'+(isHighlight?'border-left:3px solid var(--accent)':'')+'">';
    html+='<h4>'+esc(c.name)+' '+getCompCategoryColor(c.category)+'</h4>';
    html+='<div style="margin-top:8px;font-size:13px;color:'+(isHighlight?'var(--accent)':'var(--text-secondary)')+';line-height:1.7;font-weight:'+(isHighlight?'600':'400')+'">'+esc(status)+'</div>';
    html+='</div>';
  });
  html+='</div>';
  container.innerHTML=html;
}
function renderCompGuide(container){
  var html='<div class="knowledge-list">';
  html+='<div class="knowledge-card"><h4>新手入门：如何参加学科竞赛</h4><p><strong>第一步：了解竞赛信息</strong><br/>浏览竞赛大全，了解各类竞赛的基本信息、报名时间和比赛时间。<br/><br/><strong>第二步：选择适合的竞赛</strong><br/>根据你的专业方向和兴趣选择竞赛。理工科学生推荐数学建模、电子设计、蓝桥杯等；经管类学生推荐挑战杯、三创赛等。<br/><br/><strong>第三步：组建团队</strong><br/>大部分竞赛需要组队参加（3-5人），建议跨专业组队，发挥各自优势。<br/><br/><strong>第四步：关注校内通知</strong><br/>关注负责学院的官网和通知，及时了解校赛安排和报名信息。<br/><br/><strong>第五步：认真备赛</strong><br/>参加培训、刷历年真题、学习优秀作品，充分准备后参加比赛。</p></div>';
  html+='<div class="knowledge-card"><h4>竞赛分类说明（长沙理工大学支持体系）</h4><p><strong style="color:#e74c3c">A类竞赛（最高级别）</strong><br/>学校给予最大力度支持的竞赛，如中国国际大学生创新大赛（互联网+）、挑战杯等。获奖在保研、评优中具有最高权重。<br/><br/><strong style="color:#f39c12">B+类竞赛</strong><br/>学校重点支持的竞赛，如数学建模、电子设计竞赛、蓝桥杯、智能汽车竞赛等。获奖可获得较高保研加分。<br/><br/><strong style="color:#3498db">B-类竞赛</strong><br/>学校一般支持的竞赛，如信息安全竞赛、ISCC、中国大学生计算机设计大赛等。<br/><br/><strong style="color:#95a5a6">C级竞赛</strong><br/>学校基础支持的竞赛，参与度高，适合入门练手。</p></div>';
  html+='<div class="knowledge-card"><h4>备赛建议</h4><p><strong>1. 及早准备</strong><br/>不要等到报名才开始准备，很多竞赛需要长期积累。建议提前3-6个月开始备赛。<br/><br/><strong>2. 多参加校赛</strong><br/>校赛是很好的练兵机会，通过校赛选拔才能参加省赛和国赛。<br/><br/><strong>3. 学习优秀作品</strong><br/>研究历届获奖作品，了解评委偏好和评分标准。<br/><br/><strong>4. 寻找好导师</strong><br/>好的指导老师能提供专业指导和资源支持，积极联系相关学院的老师。<br/><br/><strong>5. 注重团队合作</strong><br/>选择志同道合、能力互补的队友，良好的团队协作是获奖的关键。<br/><br/><strong>6. 保持心态平衡</strong><br/>竞赛获奖固然重要，但参赛过程中的学习和成长同样宝贵。</p></div>';
  html+='<div class="knowledge-card"><h4>常见问题 FAQ</h4><p><strong>Q：参加竞赛对保研有帮助吗？</strong><br/>非常有帮助！A类和B+类竞赛获奖在保研综合测评中占较大比重，国家级奖项甚至可以加分。<br/><br/><strong>Q：大一可以参加竞赛吗？</strong><br/>可以！很多竞赛对年级没有限制，如数学建模、英语竞赛等。建议大一先从基础竞赛开始。<br/><br/><strong>Q：竞赛获奖有奖金吗？</strong><br/>部分竞赛设有奖金，同时学校也会对获奖学生给予奖励。具体政策请咨询所在学院。<br/><br/><strong>Q：如何找到队友？</strong><br/>可以通过班级群、社团、学院通知等渠道寻找队友，也可以在相关竞赛的QQ群/微信群中组队。<br/><br/><strong>Q：竞赛和学业冲突怎么办？</strong><br/>建议合理规划时间，选择1-2个重点竞赛深入准备，避免贪多嚼不烂。期中期末考试前适当减少备赛时间。</p></div>';
  html+='</div>';
  container.innerHTML=html;
}
function renderCompSecurity(container){
  var securityComps=CSUST_DATA.competitions.filter(function(c){return c.category==='公共安全类'});
  var html='<div style="margin-bottom:16px;padding:16px;border-radius:12px;background:rgba(155,89,182,0.06);border:1px solid rgba(155,89,182,0.2)">';
  html+='<h4 style="color:#9b59b6;margin-bottom:8px">公共安全类竞赛</h4>';
  html+='<p style="font-size:13px;color:var(--text-secondary)">公共安全类竞赛聚焦网络安全、信息安全等领域，是计算机、电子信息相关专业学生展示技术能力的重要平台。长沙理工大学共有 <strong>'+securityComps.length+'</strong> 项公共安全类竞赛。</p>';
  html+='</div>';
  html+='<div class="knowledge-list">';
  securityComps.forEach(function(c,idx){
    var csustLvl=getCSUSTLevel(c.csust_status);
    html+='<div class="knowledge-card">';
    html+='<h4>'+esc(c.name)+'</h4>';
    html+='<div style="margin:8px 0;display:flex;flex-wrap:wrap;gap:4px">';
    if(c.ministry_recognized)html+='<span class="tag-pill" style="background:rgba(217,119,6,0.12);color:var(--accent)">教育部认可</span>';
    if(csustLvl)html+=getCompLevelTag(csustLvl);
    html+='</div>';
    html+='<div class="info-row"><div class="info-label">主办单位</div><div class="info-value" style="max-width:70%">'+esc(c.organizer)+'</div></div>';
    html+='<div class="info-row"><div class="info-label">报名时间</div><div class="info-value">'+esc(c.registration_period)+'</div></div>';
    html+='<div class="info-row"><div class="info-label">比赛时间</div><div class="info-value">'+esc(c.competition_period)+'</div></div>';
    html+='<div class="info-row"><div class="info-label">奖项设置</div><div class="info-value" style="max-width:70%">'+esc(c.awards)+'</div></div>';
    if(c.csust_status)html+='<div class="info-row"><div class="info-label">长理参赛</div><div class="info-value" style="color:var(--accent);max-width:70%">'+esc(c.csust_status)+'</div></div>';
    html+='<div style="margin-top:12px"><h4 style="font-size:14px;color:var(--text-primary);margin-bottom:6px">竞赛介绍</h4><p style="font-size:13px;color:var(--text-secondary);line-height:1.8">'+esc(c.description)+'</p></div>';
    html+='<div style="margin-top:12px"><h4 style="font-size:14px;color:var(--text-primary);margin-bottom:6px">参赛指南</h4>';
    html+='<p style="font-size:13px;color:var(--text-secondary);line-height:1.8">';
    if(c.name.indexOf('信息安全竞赛')>=0){
      html+='<strong>全国大学生信息安全竞赛（CISCN）参赛指南：</strong><br/>1. 关注计算机学院和物电学院的通知<br/>2. 组建1-4人团队<br/>3. 通过ciscn.cn在线报名<br/>4. 分为作品赛和CTF技能赛<br/>5. 建议掌握Web安全、逆向工程、密码学等方向知识<br/>6. 可通过BUUCTF、CTFHub等平台练习';
    }else if(c.name.indexOf('ISCC')>=0){
      html+='<strong>ISCC参赛指南：</strong><br/>1. 关注计算机学院、物电学院、卓工学院通知<br/>2. 通过isclab.org.cn在线报名<br/>3. 采用个人挑战赛和分组对抗赛结合<br/>4. 涵盖网络攻防、密码学、逆向分析等<br/>5. 国内历史最悠久的信息安全竞赛（始于2004年）<br/>6. 适合信息安全初学者入门';
    }else if(c.name.indexOf('强网杯')>=0){
      html+='<strong>强网杯参赛指南：</strong><br/>1. 通过qiangwangbei.com在线报名<br/>2. 采用CTF赛制<br/>3. 涵盖Web安全、逆向工程、密码学、Pwn、移动安全等<br/>4. 国家网信办指导的权威赛事<br/>5. 建议有一定CTF基础后再参加<br/>6. 可通过各高校CTF训练平台练习';
    }
    html+='</p></div>';
    if(c.official_website)html+='<div style="margin-top:12px"><a href="'+esc(c.official_website)+'" target="_blank" class="btn-primary btn-sm" style="text-decoration:none;display:inline-block">访问官方网站</a></div>';
    html+='</div>';
  });
  html+='</div>';
  container.innerHTML=html;
}

/* === 收藏竞赛（本地存储） === */
function getFavorites() {
  return JSON.parse(getLS('app_favorites', '[]'));
}
function saveFavorites(list) {
  setLS('app_favorites', JSON.stringify(list));
}
function toggleFavorite(compId) {
  var favs = getFavorites();
  var idx = favs.indexOf(compId);
  if (idx >= 0) {
    favs.splice(idx, 1);
    showCopyToast('已取消收藏', 'info');
  } else {
    favs.push(compId);
    showCopyToast('已收藏，可在个人中心查看', 'success');
  }
  saveFavorites(favs);
  // 刷新当前竞赛列表
  if (typeof renderCompHub === 'function') renderCompHub();
  if (typeof renderFeaturedCompetitions === 'function') renderFeaturedCompetitions();
}
function isFavorited(compId) {
  return getFavorites().indexOf(compId) >= 0;
}
function getFavoriteButtonHtml(compId) {
  var fav = isFavorited(compId);
  return '<button onclick="event.stopPropagation();toggleFavorite(\'' + compId + '\')" style="background:none;border:none;cursor:pointer;padding:6px;border-radius:50%;transition:all 0.2s ease;color:' + (fav ? '#FFC84A' : 'var(--text-muted)') + '" title="' + (fav ? '取消收藏' : '收藏') + '">' + (fav ? '&#9733;' : '&#9734;') + '</button>';
}

/* === DDL 提醒（本地存储） === */
function getReminders() {
  return JSON.parse(getLS('app_reminders', '[]'));
}
function saveReminders(list) {
  setLS('app_reminders', JSON.stringify(list));
}
function toggleReminder(compId, compName, deadline) {
  var reminders = getReminders();
  var idx = reminders.findIndex(function(r) { return r.id === compId; });
  if (idx >= 0) {
    reminders.splice(idx, 1);
    showCopyToast('已取消提醒', 'info');
  } else {
    reminders.push({ id: compId, name: compName, deadline: deadline, addedAt: Date.now() });
    showCopyToast('已加入提醒，截止前会通知你', 'success');
  }
  saveReminders(reminders);
}
function isReminded(compId) {
  return getReminders().some(function(r) { return r.id === compId; });
}
function getReminderButtonHtml(compId, compName, deadline) {
  var on = isReminded(compId);
  return '<button onclick="event.stopPropagation();toggleReminder(\'' + compId + '\',\'' + esc(compName).replace(/'/g, "\\'") + '\',\'' + esc(deadline || '').replace(/'/g, "\\'") + '\')" style="background:none;border:none;cursor:pointer;padding:6px;border-radius:50%;transition:all 0.2s ease;font-size:14px;color:' + (on ? '#FFC84A' : 'var(--text-muted)') + '" title="' + (on ? '取消提醒' : '订阅截止提醒') + '">' + (on ? '&#128276;' : '&#128274;') + '</button>';
}

function showFavoritesList() {
  var favs = getFavorites();
  var container = document.getElementById('profileContent');
  if (favs.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)"><div style="font-size:32px;margin-bottom:12px">&#9734;</div><p>暂无收藏</p><p style="font-size:13px;margin-top:8px">浏览竞赛时点击 ☆ 即可收藏</p><button class="btn-secondary" style="margin-top:16px" onclick="renderProfile()">返回个人中心</button></div>';
    return;
  }
  var html = '<div style="max-width:600px;margin:0 auto"><div style="display:flex;align-items:center;gap:12px;margin-bottom:20px"><button onclick="renderProfile()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:18px">&larr;</button><h3>我的收藏 (' + favs.length + ')</h3></div>';
  // 需要从 CSUST_DATA 或 Hub 数据中获取竞赛信息
  html += '<div id="favList"></div></div>';
  container.innerHTML = html;
  // 异步加载竞赛详情
  if (typeof fetchCompetitions === 'function') {
    fetchCompetitions().then(function(comps) {
      var list = document.getElementById('favList');
      if (!list) return;
      var inner = '';
      favs.forEach(function(fid) {
        var comp = comps.find(function(c) { return String(c.id) === String(fid); });
        if (comp) {
          inner += '<div class="card" style="padding:16px;margin-bottom:10px;cursor:pointer" onclick="navigate(\'competition\');setTimeout(function(){showHubCompDetail(\'' + fid + '\')},200)"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-weight:600;font-size:15px">' + esc(comp.name) + '</div><div style="font-size:12px;color:var(--text-muted);margin-top:4px">' + esc(comp.level || '') + ' · ' + esc(comp.category || '') + '</div></div><button onclick="event.stopPropagation();toggleFavorite(\'' + fid + '\');showFavoritesList()" style="background:none;border:none;color:#FFC84A;cursor:pointer;font-size:18px" title="取消收藏">&#9733;</button></div></div>';
        } else {
          // 从 CSUST_DATA fallback
          if (typeof CSUST_DATA !== 'undefined' && CSUST_DATA.competitions) {
            var c2 = CSUST_DATA.competitions.find(function(c) { return String(c.id) === String(fid); });
            if (c2) {
              inner += '<div class="card" style="padding:16px;margin-bottom:10px;cursor:pointer" onclick="navigate(\'competition\');setTimeout(function(){showCompDetail(' + CSUST_DATA.competitions.indexOf(c2) + ')},200)"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-weight:600;font-size:15px">' + esc(c2.name) + '</div><div style="font-size:12px;color:var(--text-muted);margin-top:4px">' + esc(c2.level || '') + '</div></div><button onclick="event.stopPropagation();toggleFavorite(\'' + fid + '\');showFavoritesList()" style="background:none;border:none;color:#FFC84A;cursor:pointer;font-size:18px" title="取消收藏">&#9733;</button></div></div>';
            }
          }
        }
      });
      list.innerHTML = inner || '<p style="text-align:center;color:var(--text-muted);padding:20px">收藏的竞赛暂无详细信息</p>';
    });
  }
}

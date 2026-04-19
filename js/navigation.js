/* Extracted from app.js */

function navigate(page,tab){
  var activePage=document.querySelector('.page.active');
  if(activePage&&activePage.id!=='page-'+page){
    activePage.style.transition='opacity 0.25s ease';
    activePage.style.opacity='0';
    var pageRef=page,tabRef=tab;
    setTimeout(function(){
      activePage.classList.remove('active');
      activePage.style.opacity='';
      activePage.style.transition='';
      document.querySelectorAll('.nav-link').forEach(function(l){l.classList.remove('active')});
      var target=document.getElementById('page-'+pageRef);
      if(target){
        target.classList.add('active');
        target.style.opacity='0';
        target.style.transition='opacity 0.25s ease';
        requestAnimationFrame(function(){
          target.style.opacity='1';
        });
      }
      document.querySelectorAll('.nav-link[data-page="'+pageRef+'"]').forEach(function(l){l.classList.add('active')});
      app.currentPage=pageRef;
      window.scrollTo({top:0,behavior:'smooth'});
      handlePageInit(pageRef,tabRef);
    },250);
  } else {
    document.querySelectorAll('.nav-link').forEach(function(l){l.classList.remove('active')});
    var target2=document.getElementById('page-'+page);
    if(target2){target2.classList.add('active')}
    document.querySelectorAll('.nav-link[data-page="'+page+'"]').forEach(function(l){l.classList.add('active')});
    app.currentPage=page;
    window.scrollTo({top:0,behavior:'smooth'});
    handlePageInit(page,tab);
  }
}
function handlePageInit(page,tab){
  if(page==='home')refreshQuote();
  if(page==='academic'){if(tab)switchAcademicTab(tab);else switchAcademicTab('majors')}
  if(page==='campus'){if(tab)switchCampusTab(tab);else switchCampusTab('overview')}
  if(page==='admission'){if(tab)switchAdmissionTab(tab);else switchAdmissionTab('policy')}
  if(page==='news'){if(tab)switchNewsTab(tab);else switchNewsTab('notices')}
  if(page==='competition'){if(tab)switchCompetitionTab(tab);else switchCompetitionTab('all')}
  if(page==='toolbox'){if(tab)switchToolboxTab(tab);else document.getElementById('toolboxContent').innerHTML=''}
  if(page==='profile')renderProfile();
  if(page==='ai')updateAIView();
}
function toggleNavGroup(btn){var dropdown=btn.nextElementSibling;var isOpen=dropdown.classList.contains('show');closeAllNavGroups();if(!isOpen)dropdown.classList.add('show');btn.classList.toggle('active',!isOpen)}
function closeAllNavGroups(){document.querySelectorAll('.nav-dropdown').forEach(function(d){d.classList.remove('show')});document.querySelectorAll('.nav-group-trigger,.nav-dropdown-trigger').forEach(function(t){t.classList.remove('active')})}
function toggleMobileMenu(){document.body.style.overflow='hidden';document.getElementById('mobileMenu').classList.toggle('open');document.getElementById('hamburgerBtn').classList.toggle('open')}
function closeMobileMenu(){document.body.style.overflow='';document.getElementById('mobileMenu').classList.remove('open');document.getElementById('hamburgerBtn').classList.remove('open')}
document.addEventListener('click',function(e){if(!e.target.closest('.nav-group'))closeAllNavGroups()});
function refreshQuote(){if(typeof QUOTES==='undefined'||!QUOTES.length)return;var q=QUOTES[Math.floor(Math.random()*QUOTES.length)];var textEl=document.getElementById('quoteText');var authorEl=document.getElementById('quoteAuthor');if(textEl)textEl.textContent=q.text;if(authorEl)authorEl.textContent='—— '+q.author}

function toggleTheme(){var html=document.documentElement;var isLight=html.getAttribute('data-theme')==='light';html.setAttribute('data-theme',isLight?'dark':'light');html.setAttribute('data-user-theme',isLight?'dark':'light');setLS('theme',isLight?'dark':'light');var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=isLight?'#07070a':'#fafaf8';var sunIcon=document.getElementById('themeIconSun');var moonIcon=document.getElementById('themeIconMoon');if(sunIcon&&moonIcon){sunIcon.style.display=isLight?'none':'';moonIcon.style.display=isLight?'':'none'}}
document.addEventListener('keydown',function(e){if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();openGlobalSearch()}if(e.key==='Escape'){hideContactModal();hideLegalModal();closeGlobalSearch()}});

var _origNavigate=navigate;
/* 页面标题映射（移动端返回导航栏） */
var PAGE_TITLES={home:'首页',academic:'学业助手',campus:'校园生活',admission:'招生咨询',news:'校园资讯',competition:'学科竞赛',toolbox:'工具箱',profile:'个人中心',ai:'AI问答',auth:'登录注册',admin:'管理面板',myregistrations:'我的报名'};
/* 更新移动端底部标签栏和返回导航栏 */
function updateMobileNav(page){
  /* 底部标签栏激活状态 */
  var tabMap={home:'home',competition:'competition',toolbox:'toolbox',profile:'profile'};
  var activeTab=tabMap[page]||'';
  document.querySelectorAll('.bottom-tab-item').forEach(function(item){
    item.classList.toggle('active',item.getAttribute('data-tab')===activeTab);
  });
  /* 返回导航栏 */
  var backNav=document.getElementById('backNav');
  var backNavTitle=document.getElementById('backNavTitle');
  var shell=document.getElementById('main-content');
  if(page==='home'){
    backNav.style.display='none';
    shell.classList.remove('on-sub-page');
  }else{
    backNav.style.display='';
    backNavTitle.textContent=PAGE_TITLES[page]||'';
    shell.classList.add('on-sub-page');
  }
}
/* 回到顶部按钮：滚动监听 */
function initBackToTop(){
  var btn=document.getElementById('backToTop');
  if(!btn)return;
  var ticking=false;
  window.addEventListener('scroll',function(){
    if(!ticking){requestAnimationFrame(function(){ticking=false;if(window.scrollY>300){btn.classList.add('visible')}else{btn.classList.remove('visible')}});ticking=true}
  },{passive:true});
}
/* 触觉反馈：关键操作振动 */
function hapticFeedback(){if(navigator.vibrate)try{navigator.vibrate(10)}catch(e){}}
/* 密码显示/隐藏切换 */
function togglePwdVisibility(inputId,btn){
  var input=document.getElementById(inputId);if(!input)return;
  var isPassword=input.type==='password';
  input.type=isPassword?'text':'password';
  btn.innerHTML=isPassword?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  btn.setAttribute('aria-label',isPassword?'隐藏密码':'显示密码');
}

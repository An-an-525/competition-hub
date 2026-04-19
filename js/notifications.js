/* Extracted from app.js */

/* --- Notification System --- */
function toggleNotifDropdown(){
  var dd=document.getElementById('notifDropdown');if(dd){dd.classList.toggle('show');if(dd.classList.contains('show'))loadNotifications()}
}
async function loadNotifications(){
  if(!isLoggedIn())return;
  var user=getCurrentUser();
  try{
    var res=await fetch(HUB_URL+'/rest/v1/notifications?user_id=eq.'+user.id+'&order=created_at.desc&limit=20',{headers:HUB_HEADERS});
    if(!res.ok)return;
    var notifs=await res.json();
    renderNotifList(notifs);
    var unread=notifs.filter(function(n){return!n.is_read}).length;
    var badge=document.getElementById('notifBadge');
    if(badge){badge.textContent=unread>99?'99+':unread;badge.style.display=unread>0?'flex':'none'}
  }catch(e){}
}
function renderNotifList(notifs){
  var list=document.getElementById('notifList');if(!list)return;
  if(notifs.length===0){list.innerHTML='<div class="notif-empty">暂无通知</div>';return}
  var html='';
  var icons={system:svgIcon('alert',16),registration:svgIcon('clipboard',16),team:svgIcon('users',16),review:svgIcon('check-circle',16)};
  notifs.forEach(function(n){
    html+='<div class="notif-item'+(n.is_read?'':' unread')+'" onclick="markNotifRead('+n.id+')">';
    html+='<div class="notif-item-icon">'+(icons[n.type]||'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>')+'</div>';
    html+='<div class="notif-item-content"><div class="notif-item-title">'+esc(n.title)+'</div>';
    html+='<div class="notif-item-text">'+esc(n.content)+'</div>';
    html+='<div class="notif-item-time">'+formatTimeAgo(n.created_at)+'</div></div></div>';
  });
  list.innerHTML=html;
}
async function markNotifRead(id){
  try{
    await fetch(HUB_URL+'/rest/v1/notifications?id=eq.'+id,{method:'PATCH',headers:HUB_HEADERS,body:JSON.stringify({is_read:true})});
    loadNotifications();
  }catch(e){}
}
async function markAllNotifsRead(){
  if(!isLoggedIn())return;
  var user=getCurrentUser();
  try{
    await fetch(HUB_URL+'/rest/v1/notifications?user_id=eq.'+user.id+'&is_read=eq.false',{method:'PATCH',headers:HUB_HEADERS,body:JSON.stringify({is_read:true})});
    loadNotifications();showCopyToast('已全部标为已读','success');
  }catch(e){}
}
function startNotifPoll(){stopNotifPoll();if(!isLoggedIn())return;_notifPollTimer=setInterval(function(){loadNotifications()},30000)}
function stopNotifPoll(){if(_notifPollTimer){clearInterval(_notifPollTimer);_notifPollTimer=null}}
function formatTimeAgo(dateStr){
  if(!dateStr)return'';var d=new Date(dateStr);var now=new Date();var diff=Math.floor((now-d)/1000);
  if(diff<60)return'刚刚';if(diff<3600)return Math.floor(diff/60)+'分钟前';
  if(diff<86400)return Math.floor(diff/3600)+'小时前';if(diff<604800)return Math.floor(diff/86400)+'天前';
  return d.getFullYear()+'-'+(d.getMonth()+1<10?'0':'')+(d.getMonth()+1)+'-'+(d.getDate()<10?'0':'')+d.getDate();
}

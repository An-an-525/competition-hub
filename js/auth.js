/* Extracted from app.js */

/* --- Auth System --- */
function switchAuthTab(tab){
  document.querySelectorAll('.auth-tab').forEach(function(t,i){t.classList.toggle('active',(tab==='login'&&i===0)||(tab==='register'&&i===1))});
  document.getElementById('authLoginForm').classList.toggle('active',tab==='login');
  document.getElementById('authRegisterForm').classList.toggle('active',tab==='register');
  document.getElementById('authLoginError').classList.remove('show');
  document.getElementById('authRegError').classList.remove('show');
}
function checkPasswordStrength(pwd){
  var s=0;if(pwd.length>=6)s++;if(pwd.length>=10)s++;if(/[A-Z]/.test(pwd)&&/[a-z]/.test(pwd))s++;if(/[0-9]/.test(pwd)&&/[^A-Za-z0-9]/.test(pwd))s++;
  var labels=['','弱','一般','较强','强'];var cls=['','weak','medium','medium','strong'];
  for(var i=1;i<=4;i++){var bar=document.getElementById('pwdBar'+i);if(bar){bar.className='password-strength-bar'+(i<=s?' '+cls[s]:'')}}
  var txt=document.getElementById('pwdStrengthText');if(txt)txt.textContent=pwd.length>0?'密码强度：'+labels[s]:'';
}
async function hashPassword(pwd){
  // 优先使用 crypto.subtle（HTTPS 环境），否则使用纯 JS 实现
  if(crypto.subtle){
    try{
      var encoder=new TextEncoder();var data=encoder.encode(pwd);
      var hashBuffer=await crypto.subtle.digest('SHA-256',data);
      var hashArray=Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(function(b){return b.toString(16).padStart(2,'0')}).join('');
    }catch(e){}
  }
  // 纯 JS SHA-256 fallback
  return _sha256(pwd);
}
// 纯 JavaScript SHA-256 实现（fallback）
var _sha256=(function(){var K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];function rr(v,a){return(v>>>a)|(v<<(32-a))}return function(msg){var bl=msg.length*8,bytes=[];for(var i=0;i<msg.length;i++){var c=msg.charCodeAt(i);if(c<0x80)bytes.push(c);else if(c<0x800){bytes.push(0xc0|(c>>6));bytes.push(0x80|(c&0x3f))}else if(c<0xd800||c>=0xe000){bytes.push(0xe0|(c>>12));bytes.push(0x80|((c>>6)&0x3f));bytes.push(0x80|(c&0x3f))}else{i++;c=0x10000+(((c&0x3ff)<<10)|(msg.charCodeAt(i)&0x3ff));bytes.push(0xf0|(c>>18));bytes.push(0x80|((c>>12)&0x3f));bytes.push(0x80|((c>>6)&0x3f));bytes.push(0x80|(c&0x3f))}}bytes.push(0x80);while(bytes.length%64!==56)bytes.push(0);for(var i=56;i>=0;i-=8)bytes.push((bl/Math.pow(2,i))&0xff);var h0=0x6a09e667,h1=0xbb67ae85,h2=0x3c6ef372,h3=0xa54ff53a,h4=0x510e527f,h5=0x9b05688c,h6=0x1f83d9ab,h7=0x5be0cd19;for(var off=0;off<bytes.length;off+=64){var w=[];for(var j=0;j<16;j++)w[j]=(bytes[off+j*4]<<24)|(bytes[off+j*4+1]<<16)|(bytes[off+j*4+2]<<8)|bytes[off+j*4+3];for(var j=16;j<64;j++){var s0=rr(w[j-15],7)^rr(w[j-15],18)^(w[j-15]>>>3);var s1=rr(w[j-2],17)^rr(w[j-2],19)^(w[j-2]>>>10);w[j]=(w[j-16]+s0+w[j-7]+s1)|0}var a=h0,b=h1,c=h2,d=h3,e=h4,f=h5,g=h6,hh=h7;for(var j=0;j<64;j++){var S1=rr(e,6)^rr(e,11)^rr(e,25);var ch=(e&f)^(~e&g);var t1=(hh+S1+ch+K[j]+w[j])|0;var S0=rr(a,2)^rr(a,13)^rr(a,22);var maj=(a&b)^(a&c)^(b&c);var t2=(S0+maj)|0;hh=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0}h0=(h0+a)|0;h1=(h1+b)|0;h2=(h2+c)|0;h3=(h3+d)|0;h4=(h4+e)|0;h5=(h5+f)|0;h6=(h6+g)|0;h7=(h7+hh)|0}var hash='',vals=[h0,h1,h2,h3,h4,h5,h6,h7];for(var i=0;i<vals.length;i++)hash+=('00000000'+(vals[i]>>>0).toString(16)).slice(-8);return hash}})();
function getCurrentUser(){
  try{var u=localStorage.getItem('app_user');return u?JSON.parse(u):null}catch(e){return null}
}
function setCurrentUser(u){if(u){localStorage.setItem('app_user',JSON.stringify(u))}else{localStorage.removeItem('app_user')}}
function isLoggedIn(){return!!getCurrentUser()}
function isAdmin(){var u=getCurrentUser();return u&&u.role==='admin'}
function demoLogin(){
  document.getElementById('authLoginStudentId').value='admin';
  document.getElementById('authLoginPassword').value='admin123';
  doLogin();
}
async function doLogin(){
  var sid=document.getElementById('authLoginStudentId').value.trim();
  var pwd=document.getElementById('authLoginPassword').value;
  var errEl=document.getElementById('authLoginError');
  var btn=document.getElementById('authLoginBtn');
  errEl.classList.remove('show');
  if(!sid||!pwd){errEl.textContent='请输入学号和密码';errEl.classList.add('show');return}
  btn.disabled=true;btn.textContent='登录中...';
  try{
    var hash=await hashPassword(pwd);
    var res=await fetch(HUB_URL+'/rest/v1/profiles?student_id=eq.'+encodeURIComponent(sid),{headers:HUB_HEADERS});
    if(!res.ok){errEl.textContent='登录失败，请重试';errEl.classList.add('show');btn.disabled=false;btn.textContent='登录';return}
    var data=await res.json();
    if(data.length===0){errEl.textContent='该学号未注册';errEl.classList.add('show');btn.disabled=false;btn.textContent='登录';return}
    var profile=data[0];
    if(profile.password_hash!==hash){errEl.textContent='密码错误';errEl.classList.add('show');btn.disabled=false;btn.textContent='登录';return}
    setCurrentUser({id:profile.id,studentId:profile.student_id,name:profile.name,college:profile.college,role:profile.role});
    showCopyToast('登录成功，欢迎 '+profile.name,'success');
    // 调用后端 API 获取 JWT token
    try{var loginRes=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({studentId:sid,password:pwd})});if(loginRes.ok){var loginData=await loginRes.json();if(loginData.token){setLS('auth_token',loginData.token)}}}catch(e){console.warn('后端登录接口不可用，使用本地模式:',e.message)}
    updateNavAuth();
    if(profile.role==='admin'){navigate('admin')}else{navigate('home')}
  }catch(e){errEl.textContent='错误：'+e.message;errEl.classList.add('show');btn.disabled=false;btn.textContent='登录'}
}
async function doRegister(){
  var sid=document.getElementById('authRegStudentId').value.trim();
  var name=document.getElementById('authRegName').value.trim();
  var college=document.getElementById('authRegCollege').value.trim();
  var pwd=document.getElementById('authRegPassword').value;
  var pwd2=document.getElementById('authRegPassword2').value;
  var agree=document.getElementById('authAgree').checked;
  var errEl=document.getElementById('authRegError');
  var btn=document.getElementById('authRegBtn');
  errEl.classList.remove('show');
  if(!sid||!name||!college||!pwd){errEl.textContent='请填写所有必填项';errEl.classList.add('show');return}
  if(pwd.length<6){errEl.textContent='密码至少6位';errEl.classList.add('show');return}
  if(pwd!==pwd2){errEl.textContent='两次密码不一致';errEl.classList.add('show');return}
  if(!agree){errEl.textContent='请先同意用户协议和隐私政策';errEl.classList.add('show');return}
  btn.disabled=true;btn.textContent='注册中...';
  try{
    var hash=await hashPassword(pwd);
    var res=await fetch(HUB_URL+'/rest/v1/profiles',{method:'POST',headers:HUB_HEADERS,body:JSON.stringify({student_id:sid,name:name,college:college,password_hash:hash,role:'student'})});
    if(!res.ok){var errData={};try{errData=await res.json()}catch(e){}if(errData.message&&errData.message.indexOf('duplicate')>=0){errEl.textContent='该学号已注册，请直接登录'}else{errEl.textContent='注册失败，请重试'}errEl.classList.add('show');btn.disabled=false;btn.textContent='注册';return}
    var data=await res.json();
    var profile=data[0];
    setCurrentUser({id:profile.id,studentId:profile.student_id,name:profile.name,college:profile.college,role:profile.role||'student'});
    showCopyToast('注册成功，欢迎 '+name,'success');
    updateNavAuth();navigate('home');
  }catch(e){errEl.textContent='错误：'+e.message;errEl.classList.add('show');btn.disabled=false;btn.textContent='注册'}
}
function doLogout(){
  showConfirm('确定要退出登录吗？',function(){
    setCurrentUser(null);updateNavAuth();stopNotifPoll();
    showCopyToast('已退出登录','success');navigate('home');
  });
}
function updateNavAuth(){
  var area=document.getElementById('navAuthArea');
  var bellBtn=document.getElementById('notifBellBtn');
  var mobileAuthBtn=document.getElementById('mobileAuthBtn');
  var mobileLogoutBtn=document.getElementById('mobileLogoutBtn');
  var mobileMyRegsBtn=document.getElementById('mobileMyRegsBtn');
  var mobileAdminBtn=document.getElementById('mobileAdminBtn');
  if(!area)return;
  var user=getCurrentUser();
  if(user){
    var initial=user.name?user.name.charAt(0):'?';
    area.innerHTML='<div style="position:relative"><div class="nav-user-info" onclick="toggleUserDropdown()"><div class="nav-avatar" style="width:30px;height:30px;font-size:12px">'+esc(initial)+'</div><span class="nav-user-name">'+esc(user.name)+'</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></div><div class="nav-user-dropdown" id="userDropdown"><button class="nav-link" onclick="navigate(\'myregistrations\');closeUserDropdown()">我的报名</button>'+(user.role==='admin'?'<button class="nav-link" onclick="navigate(\'admin\');closeUserDropdown()">管理面板</button>':'')+'<button class="nav-link" onclick="navigate(\'profile\');closeUserDropdown()">个人设置</button><button class="nav-link" onclick="doLogout();closeUserDropdown()" style="color:#e74c3c">退出登录</button></div></div>';
    if(bellBtn)bellBtn.style.display='flex';
    if(mobileAuthBtn)mobileAuthBtn.style.display='none';
    if(mobileLogoutBtn)mobileLogoutBtn.style.display='';
    if(mobileMyRegsBtn)mobileMyRegsBtn.style.display='';
    if(mobileAdminBtn)mobileAdminBtn.style.display=user.role==='admin'?'':'none';
    startNotifPoll();
  }else{
    area.innerHTML='<button class="nav-login-btn" onclick="navigate(\'auth\')">登录/注册</button>';
    if(bellBtn)bellBtn.style.display='none';
    if(mobileAuthBtn)mobileAuthBtn.style.display='';
    if(mobileLogoutBtn)mobileLogoutBtn.style.display='none';
    if(mobileMyRegsBtn)mobileMyRegsBtn.style.display='none';
    if(mobileAdminBtn)mobileAdminBtn.style.display='none';
    stopNotifPoll();
  }
}
function toggleUserDropdown(){
  var dd=document.getElementById('userDropdown');if(dd)dd.classList.toggle('show');
}
function closeUserDropdown(){
  var dd=document.getElementById('userDropdown');if(dd)dd.classList.remove('show');
}
document.addEventListener('click',function(e){if(!e.target.closest('.nav-user-info')&&!e.target.closest('#userDropdown'))closeUserDropdown();if(!e.target.closest('#notifBellWrap')){var nd=document.getElementById('notifDropdown');if(nd)nd.classList.remove('show')}});

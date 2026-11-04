/*  GonPreah — the app (app.gonpreah.org).

    One plain script, one global state S, one render(). Every screen is a
    function returning HTML; bind() wires what is on screen after each render.
    Every word a person reads goes through t() (Khmer from km.js and km-app.js).

    Screens (S.view):
      signin · signup            — Google, then a username, name and birth year
      home                       — today: streak, habits, this week's goals, invites
      teams · team · person      — your teams, a team's people and its mix, someone's card
      find · newteam             — search people (adults only see adults), make a team
      me                         — profile, photo, what others see, the tests
      ptest · ptype · gtest · gstr — the personality test and type, GP Strengths and its Top 5
      habitpick                  — choose your habits

    The server decides what anyone may see of anyone (api.js says how); this
    page only draws what it is given. */

/* ---------------- storage, language ---------------- */
function lsGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
function lsSet(k, v){ try { localStorage.setItem(k, v); } catch(e){} }
function lsDel(k){ try { localStorage.removeItem(k); } catch(e){} }
var LANG = lsGet('gpa-lang') === 'en' ? 'en' : 'km';
var KM = (function(){ var o={}; try { if(typeof BUILTIN_KM==='object') Object.assign(o, BUILTIN_KM); } catch(e){} try { if(typeof APP_KM==='object') Object.keys(APP_KM).forEach(function(k){ if(!o[k]) o[k]=APP_KM[k]; }); } catch(e){} return o; })();   // km.js's (partly reviewed) words win over km-app.js
function t(s){ return LANG==='km' ? (KM[s] || s) : s; }
function gpT(s, v){ return String(t(s)).replace(/\{(\w+)\}/g, function(w, n){ return v && Object.prototype.hasOwnProperty.call(v, n) ? String(v[n]) : w; }); }
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function peopleN_(n){ return n===1 ? t('1 person') : gpT('{n} people',{n:n}); }
function firstName_(n){ return String(n||'').trim().split(/\s+/)[0] || ''; }
function gpTap(){ try { if(navigator.vibrate && !matchMedia('(prefers-reduced-motion: reduce)').matches) navigator.vibrate(8); } catch(e){} }

/* ---------------- state ---------------- */
var S = {
  view: 'signin', back: [], me: null, teams: [], today: '', busy: false,
  photos: {}, team: null, person: null, find: { q:'', people:null }, google: null,
  signup: null, ptest: null, gtest: null, habitDraft: null, weekEdit: false
};
var AUTH = (function(){ try { var a=JSON.parse(lsGet('gpa-auth')||'null'); return a && a.uid && a.token ? a : null; } catch(e){ return null; } })();
var JOIN = (function(){ try { return (new URLSearchParams(location.search).get('join')||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6); } catch(e){ return ''; } })();
if(JOIN){ lsSet('gpa-join', JOIN); try { history.replaceState(null, '', location.pathname); } catch(e){} }
else JOIN = (lsGet('gpa-join')||'');

/* ---------------- the server ---------------- */
function api(fn, args){
  return fetch('/.netlify/functions/api', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ fn:fn, args:args||[] }) })
    .then(function(r){ return r.json().catch(function(){ return { ok:false, err:'http'+r.status }; }); })
    .catch(function(){ return { ok:false, err:'offline' }; });
}
/* signed in: the person's id and device token go first */
function call(fn){ var a=[AUTH.uid, AUTH.token].concat([].slice.call(arguments, 1)); return api(fn, a).then(function(d){ if(d && d.err==='auth') signedOut_(); return d; }); }
function signedOut_(){ AUTH=null; lsDel('gpa-auth'); S.me=null; S.view='signin'; render(); }
var msgT=null;
function showMsg(s){ var m=document.getElementById('msg'); if(!m) return; m.textContent=s; m.className='msg show'; clearTimeout(msgT); msgT=setTimeout(function(){ m.className='msg'; }, 2600); }
function failMsg(d){
  var E={ offline:'No connection — try again.', taken:'That username is taken.', username:'Usernames are 3–20 letters, numbers, _ or .',
    too_young:'You need to be 13 or older to use GonPreah.', code:'That code didn’t work — check it with your leader.', adult_only:'Only someone 18 or older can do this.',
    full:'That team is full.', too_many:'You’re in as many teams as you can be.', last_leader:'Make someone else a leader first.', google:'Google sign-in didn’t work — try again.',
    name:'Please write your name.', birthYear:'Please choose the year you were born.', photo:'That photo couldn’t be used.' };
  showMsg(t(E[d && d.err] || 'Something went wrong — try again.'));
}
function adopt_(d){ if(d && d.me) S.me=d.me; if(d && d.teams) S.teams=d.teams; if(d && d.today) S.today=d.today; }

/* ---------------- dates ---------------- */
function todayStr(){ if(S.today) return S.today; var d=new Date(Date.now()+7*3600*1000); return d.toISOString().slice(0,10); }
function addDays(iso, n){ var d=new Date(iso+'T00:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); }
function mondayOf(iso){ var d=new Date(iso+'T00:00:00Z'); return addDays(iso, -((d.getUTCDay()+6)%7)); }

/* ---------------- habits ---------------- */
var HABITS = [
  ['bible','📖','Read the Bible'], ['prayer','🙏','Pray'], ['read','📚','Read a book'], ['english','🔤','Practise English'],
  ['khmer','ក','Practise Khmer'], ['exercise','🏃','Exercise'], ['sleep','😴','Good sleep'], ['water','💧','Drink water'],
  ['journal','✍️','Journal'], ['nophone','📵','Time off my phone'], ['kind','💛','Do something kind'], ['study','🎓','Study']
];
var MAX_HABITS=6;
function habitMeta(h){ var m=HABITS.filter(function(x){ return x[0]===h.id; })[0]; return m ? { icon:m[1], label:t(m[2]) } : { icon:h.icon||'⭐', label:h.label||'' }; }

/* ---------------- faces ---------------- */
function initials_(n){ var p=String(n||'?').trim().split(/\s+/); return ((p[0]||'?')[0]+((p[1]||'')[0]||'')).toUpperCase(); }
function faceHtml(p, size){
  size=size||44;
  var st='width:'+size+'px;height:'+size+'px';
  if(p.hasPhoto && S.photos[p.id]) return '<img class="face" style="'+st+'" src="'+esc(S.photos[p.id])+'" alt="">';
  if(p.type && typeof gpPAvatar==='function') return '<span class="face art" style="'+st+'">'+gpPAvatar(p.type, p.sex||'', size)+'</span>';
  return '<span class="face ini" style="'+st+';font-size:'+Math.round(size*.38)+'px">'+esc(initials_(p.name))+'</span>';
}
/* Photos come one batch at a time, after the card is drawn. */
function loadPhotos_(people){
  var want=(people||[]).filter(function(p){ return p && p.hasPhoto && !S.photos[p.id] && !S.photos['_'+p.id]; }).map(function(p){ return p.id; });
  if(!want.length || !AUTH) return;
  want.forEach(function(id){ S.photos['_'+id]=1; });
  call('photos', want).then(function(d){ if(d && d.ok){ Object.assign(S.photos, d.photos); render(); } });
}

/* ---------------- render ---------------- */
var VIEWS_TABS = { home:'home', teams:'teams', team:'teams', person:'teams', find:'teams', newteam:'teams', me:'me', ptest:'me', ptype:'me', gtest:'me', gstr:'me', habitpick:'home' };
function go(view, keep){ if(!keep) S.back.push(S.view); S.view=view; render(); window.scrollTo(0,0); }
function goBack(fallback){ S.view=S.back.pop()||fallback||'home'; render(); window.scrollTo(0,0); }
function backBtn(label){ return '<button class="linkbtn backLink" data-back>← '+esc(label)+'</button>'; }

function render(){
  var m=document.getElementById('main');
  var logo=document.getElementById('brandLogo'), sl=document.getElementById('splashLogo');
  if(typeof GP_LOGO_WIDE==='string' && logo && !logo.src) logo.src=GP_LOGO_WIDE;
  if(typeof GP_LOGO==='string' && sl && !sl.src) sl.src=GP_LOGO;
  document.documentElement.lang = LANG==='km' ? 'km' : 'en';
  document.getElementById('hbtns').innerHTML='<button class="hbtn" id="langBtn">'+(LANG==='km'?'English':'ខ្មែរ')+'</button>';
  var V=S.view, h='';
  try {
    if(!AUTH || !S.me){ h = V==='signup' ? signupHtml() : signinHtml(); }
    else if(V==='home') h=homeHtml();
    else if(V==='teams') h=teamsHtml();
    else if(V==='team') h=teamHtml();
    else if(V==='person') h=personHtml();
    else if(V==='find') h=findHtml();
    else if(V==='newteam') h=newTeamHtml();
    else if(V==='me') h=meHtml();
    else if(V==='ptest') h=ptestHtml();
    else if(V==='ptype') h=ptypeHtml();
    else if(V==='gtest') h=gtestHtml();
    else if(V==='gstr') h=gstrHtml();
    else if(V==='habitpick') h=habitPickHtml();
    else { S.view='home'; h=homeHtml(); }
    m.innerHTML=h;
    navHtml_();
    bind();
  } catch(e){
    m.innerHTML='<div class="card"><b>'+esc(t('Something went wrong on this screen.'))+'</b><p class="sub" style="margin:6px 0 0">'+esc(String(e && e.message || e))+'</p><button class="btn" id="errHome">'+esc(t('Back to Home'))+'</button></div>';
    var b=document.getElementById('errHome'); if(b) b.onclick=function(){ S.view='home'; S.back=[]; render(); };
  }
  if(window.gpSplashDone) window.gpSplashDone();
}
function navHtml_(){
  var n=document.getElementById('bottomNav');
  if(!AUTH || !S.me){ n.hidden=true; return; }
  n.hidden=false;
  var on=VIEWS_TABS[S.view]||'home';
  n.innerHTML=[['home','🏠','Home'],['teams','👥','Teams'],['me','🙂','Me']].map(function(x){
    return '<button data-tab="'+x[0]+'" class="'+(on===x[0]?'on':'')+'"><span class="ic">'+x[1]+'</span>'+esc(t(x[2]))+'</button>';
  }).join('');
}

/* ---------------- sign in ---------------- */
function signinHtml(){
  return '<div class="gate">'+
    '<h2 style="text-align:center;margin-top:18px">'+esc(t('Welcome to GonPreah'))+'</h2>'+
    '<p class="sub" style="text-align:center">'+esc(t('Find out how God made you, build a plan for your life, and grow together with your team.'))+'</p>'+
    (JOIN ? '<div class="banner">'+esc(gpT('You have a team code: {code}. Sign in to join.',{code:JOIN}))+'</div>' : '')+
    '<div class="card">'+
      '<button class="btn gBtn" id="googleBtn"'+(S.busy?' disabled':'')+'><span class="gG">G</span>'+esc(S.busy?t('Signing in…'):t('Continue with Google'))+'</button>'+
      '<p class="hint" style="text-align:center;margin-top:10px">'+esc(t('New here? The same button makes your account.'))+'</p>'+
    '</div>'+
    '<p class="pFine" style="text-align:center">'+esc(t('GonPreah is for people 13 and older.'))+'</p></div>';
}
var GSI_URL='https://accounts.google.com/gsi/client';
function googleToken_(cb){
  if(typeof window.__gpaGoogle==='function') return window.__gpaGoogle(cb);   // tests stand in for Google
  api('authConfig').then(function(c){
    if(!c || !c.google){ showMsg(t('Google sign-in isn’t set up yet.')); S.busy=false; render(); return; }
    var start=function(){
      try {
        var tc=google.accounts.oauth2.initTokenClient({ client_id:c.google, scope:'openid email profile',
          callback:function(r){ if(r && r.access_token) cb(r.access_token); else { S.busy=false; render(); } },
          error_callback:function(){ S.busy=false; render(); } });
        tc.requestAccessToken();
      } catch(e){ S.busy=false; showMsg(t('Google sign-in didn’t work — try again.')); render(); }
    };
    if(window.google && google.accounts && google.accounts.oauth2) return start();
    var s=document.createElement('script'); s.src=GSI_URL; s.async=true; s.onload=start;
    s.onerror=function(){ S.busy=false; showMsg(t('No connection — try again.')); render(); };
    document.head.appendChild(s);
  });
}
function signIn_(){
  S.busy=true; render();
  googleToken_(function(tok){
    api('loginGoogle',[tok]).then(function(d){
      S.busy=false;
      if(d && d.ok){ afterSignIn_(d); return; }
      if(d && d.err==='new'){ S.google=tok; S.signup={ name:d.name||'', username:'', birthYear:'', code:JOIN, free:null }; S.view='signup'; render(); return; }
      failMsg(d); render();
    });
  });
}
function afterSignIn_(d){
  AUTH={ uid:d.uid, token:d.token }; lsSet('gpa-auth', JSON.stringify(AUTH));
  adopt_(d); S.view='home'; S.back=[];
  if(S.me && S.me.lang && S.me.lang!==LANG){ LANG=S.me.lang; lsSet('gpa-lang', LANG); }
  bootNow_();
}
function signupHtml(){
  var F=S.signup||{}, y=new Date().getFullYear(), years='';
  for(var i=y-13;i>=y-80;i--) years+='<option value="'+i+'"'+(String(F.birthYear)===String(i)?' selected':'')+'>'+i+'</option>';
  return '<h2>'+esc(t('Make your account'))+'</h2>'+
    '<p class="sub">'+esc(t('Pick a username so your friends can find you.'))+'</p>'+
    '<div class="card">'+
      '<label class="f" for="suUser">'+esc(t('Username'))+'</label>'+
      '<div class="atRow"><span>@</span><input type="text" id="suUser" autocomplete="off" autocapitalize="none" maxlength="20" value="'+esc(F.username)+'"></div>'+
      '<div class="hint" id="suUserHint">'+esc(F.free===false?t('That username is taken.'):F.free===true?t('✓ Free'):t('3–20 letters, numbers, _ or .'))+'</div>'+
      '<label class="f" for="suName">'+esc(t('Your name'))+'</label><input type="text" id="suName" maxlength="60" value="'+esc(F.name)+'">'+
      '<label class="f" for="suYear">'+esc(t('The year you were born'))+'</label>'+
      '<select id="suYear"><option value="">'+esc(t('Choose…'))+'</option>'+years+'</select>'+
      '<div class="hint">'+esc(t('Nobody else sees this. Under 18? You won’t show up in searches — you join teams with a code from your leader.'))+'</div>'+
      '<label class="f" for="suCode">'+esc(t('Team code (if you have one)'))+'</label><input type="text" id="suCode" maxlength="6" autocapitalize="characters" value="'+esc(F.code)+'">'+
      '<button class="btn" id="suGo"'+(S.busy?' disabled':'')+'>'+esc(S.busy?t('Saving…'):t('Make my account'))+'</button>'+
      '<button class="linkbtn" id="suCancel">'+esc(t('Cancel'))+'</button>'+
    '</div>';
}
var suTimer=null;
function bindSignup_(){
  var u=document.getElementById('suUser'); if(!u) return;
  var keep=function(){ var F=S.signup; F.username=u.value.trim().toLowerCase(); F.name=document.getElementById('suName').value; F.birthYear=document.getElementById('suYear').value; F.code=document.getElementById('suCode').value; };
  u.oninput=function(){ keep(); S.signup.free=null; var hint=document.getElementById('suUserHint'); hint.textContent=t('3–20 letters, numbers, _ or .');
    clearTimeout(suTimer); suTimer=setTimeout(function(){ if(!S.signup) return; var v=S.signup.username; if(v.length<3) return;
      api('checkUsername',[v]).then(function(d){ if(!S.signup || S.signup.username!==v || !document.getElementById('suUserHint')) return; S.signup.free=!!(d && d.free); hint.textContent = d && d.err==='bad' ? t('3–20 letters, numbers, _ or .') : (d && d.free ? t('✓ Free') : t('That username is taken.')); }); }, 350); };
  ['suName','suYear','suCode'].forEach(function(id){ document.getElementById(id).oninput=keep; document.getElementById(id).onchange=keep; });
  document.getElementById('suCancel').onclick=function(){ S.signup=null; S.google=null; S.view='signin'; render(); };
  document.getElementById('suGo').onclick=function(){
    keep(); clearTimeout(suTimer); var F=S.signup;
    if(!F.birthYear){ showMsg(t('Please choose the year you were born.')); return; }
    S.busy=true; render();
    api('register',[S.google, { username:F.username, name:F.name, birthYear:Number(F.birthYear), code:F.code, lang:LANG }]).then(function(d){
      S.busy=false;
      if(d && d.ok){ lsDel('gpa-join'); JOIN=''; S.signup=null; afterSignIn_(d); if(d.joined) showMsg(gpT('You joined {team}!',{team:d.joined.name})); return; }
      if(d && d.err==='google'){ S.view='signin'; }
      failMsg(d); render();
    });
  };
}

/* ---------------- boot ---------------- */
function bootNow_(){
  if(!AUTH){ render(); return; }
  if(!S.me){ var m=document.getElementById('main'); if(m && typeof GP_LOGO==='string') m.innerHTML='<div class="loadingBox"><div class="loadCoin"><img src="'+GP_LOGO+'" alt=""></div></div>'; }
  call('boot').then(function(d){
    if(d && d.ok){
      adopt_(d);
      if(JOIN){ var c=JOIN; JOIN=''; lsDel('gpa-join'); call('joinTeam', c).then(function(j){ if(j && j.ok){ showMsg(j.already ? gpT('You’re already in {team}.',{team:j.team.name}) : gpT('You joined {team}!',{team:j.team.name})); refresh_(); } else failMsg(j); }); }
    } else if(d && d.err!=='auth' && !S.me){ showMsg(t('No connection — try again.')); }
    render();
  });
}
function refresh_(){ return call('boot').then(function(d){ if(d && d.ok){ adopt_(d); render(); } }); }

/* ---------------- Home ---------------- */
function homeHtml(){
  var me=S.me, st=me.stats||{}, hour=new Date().getHours();
  var hello = hour<12 ? 'Good morning' : hour<18 ? 'Good afternoon' : 'Good evening';
  var h='<div class="heroCard">'+
    '<div class="heroTop">'+faceHtml(me,56)+'<div><div class="heroHi">'+esc(t(hello))+'</div><div class="heroName">'+esc(firstName_(me.name))+'</div></div></div>'+
    '<div class="heroStats">'+
      '<div><b>'+(st.streak||0)+'</b><span>🔥 '+esc(t('day streak'))+'</span></div>'+
      '<div><b>'+(st.week==null?'—':st.week+'%')+'</b><span>🗒️ '+esc(t('this week'))+'</span></div>'+
      '<div><b>'+(S.teams||[]).length+'</b><span>👥 '+esc(t('teams'))+'</span></div>'+
    '</div></div>';
  (me.invites||[]).forEach(function(iv){
    h+='<div class="card inviteCard"><div><b>'+esc(iv.emoji||'✦')+' '+esc(iv.name)+'</b><div class="pmeta">'+esc(gpT('{name} asked you to join',{name:iv.from}))+'</div></div>'+
      '<div class="btnRow" style="margin-top:10px"><button class="btn small" data-invite="'+esc(iv.team)+'|1">'+esc(t('Join'))+'</button><button class="btn small ghost" data-invite="'+esc(iv.team)+'|0">'+esc(t('No thanks'))+'</button></div></div>';
  });
  h+=habitsCardHtml()+weekCardHtml();
  if(!me.personality || !me.gstrengths){
    h+='<h3>✦ '+esc(t('How God made you'))+'</h3>';
    if(!me.personality) h+=entryCardHtml('goPtest','🧭',t('Find your personality type'),t('40 statements · about 7 minutes'));
    if(!me.gstrengths) h+=entryCardHtml('goGtest','💪',t('Find your top 5 strengths'),t('102 quick choices · about 15 minutes'));
  }
  if(!(S.teams||[]).length) h+='<h3>👥 '+esc(t('Your team'))+'</h3>'+entryCardHtml('goTeamsHome','👥',t('Join or start a team'),t('Grow together with your friends, club or group.'));
  return h;
}
function entryCardHtml(id, icon, title, meta){
  return '<button class="card pEntry" id="'+id+'"><span class="pEntryArt"><span class="pQ">'+icon+'</span></span>'+
    '<span style="flex:1"><div style="font-size:15px;font-weight:800">'+esc(title)+'</div><div class="pmeta">'+esc(meta)+'</div></span><span class="chev">›</span></button>';
}
function habitsCardHtml(){
  var me=S.me, list=me.habits||[], d=todayStr(), done=(me.days||{})[d]||{};
  var h='<h3>✅ '+esc(t('Today’s habits'))+'</h3><div class="card">';
  if(!list.length) return h+'<p class="sub" style="margin:0 0 4px">'+esc(t('Pick a few small things to do every day. Your streak grows each day you do at least one.'))+'</p><button class="btn ghost" id="habitPick">'+esc(t('Choose my habits'))+'</button></div>';
  var n=list.filter(function(x){ return done[x.id]; }).length;
  h+='<div class="pmeta" style="margin:0 0 10px">'+esc(gpT('{a} of {b} done today',{a:n,b:list.length}))+'</div><div class="habitGrid">';
  list.forEach(function(x){ var m=habitMeta(x), on=!!done[x.id];
    h+='<button class="habitTile'+(on?' on':'')+'" data-habit="'+esc(x.id)+'" aria-pressed="'+on+'"><span class="hIc">'+esc(m.icon)+'</span><span class="hLb">'+esc(m.label)+'</span>'+(on?'<span class="hOk">✓</span>':'')+'</button>';
  });
  return h+'</div><button class="linkbtn" id="habitPick">'+esc(t('Change my habits'))+'</button></div>';
}
function weekCardHtml(){
  var wk=mondayOf(todayStr()), goals=((S.me.weeks||{})[wk]||[]).slice();
  var h='<h3>🗒️ '+esc(t('This week’s goals'))+'</h3><div class="card">';
  if(S.weekEdit){
    while(goals.length<3) goals.push({ text:'', pct:0 });
    h+='<p class="sub" style="margin:0 0 8px">'+esc(t('Up to three things you want to get done this week.'))+'</p>';
    goals.forEach(function(g,i){ h+='<input type="text" class="wkIn" data-wk="'+i+'" maxlength="120" placeholder="'+esc(gpT('Goal {n}',{n:i+1}))+'" value="'+esc(g.text)+'" style="margin-bottom:8px">'; });
    return h+'<div class="btnRow"><button class="btn small" id="wkSave">'+esc(t('Save'))+'</button><button class="btn small ghost" id="wkCancel">'+esc(t('Cancel'))+'</button></div></div>';
  }
  if(!goals.length) return h+'<p class="sub" style="margin:0 0 4px">'+esc(t('What do you want to get done this week?'))+'</p><button class="btn ghost" id="wkEdit">'+esc(t('Set this week’s goals'))+'</button></div>';
  goals.forEach(function(g,i){
    h+='<div class="wkGoal"><div class="wkTop"><span>'+esc(g.text)+'</span><b>'+g.pct+'%</b></div>'+
      '<input type="range" min="0" max="100" step="5" value="'+g.pct+'" data-wkpct="'+i+'" aria-label="'+esc(g.text)+'" style="--p:'+g.pct+'%"></div>';
  });
  return h+'<button class="linkbtn" id="wkEdit">'+esc(t('Change the goals'))+'</button></div>';
}
function habitPickHtml(){
  var D=S.habitDraft||(S.habitDraft=(S.me.habits||[]).map(function(x){ return Object.assign({},x); }));
  var has=function(id){ return D.some(function(x){ return x.id===id; }); };
  var h=backBtn(t('Home'))+'<h2>'+esc(t('Choose my habits'))+'</h2><p class="sub">'+esc(gpT('Up to {n}. Small is good — you can change them any time.',{n:MAX_HABITS}))+'</p><div class="habitGrid">';
  HABITS.forEach(function(x){ var on=has(x[0]); h+='<button class="habitTile'+(on?' on':'')+'" data-hpick="'+x[0]+'"><span class="hIc">'+esc(x[1])+'</span><span class="hLb">'+esc(t(x[2]))+'</span>'+(on?'<span class="hOk">✓</span>':'')+'</button>'; });
  D.filter(function(x){ return /^c_/.test(x.id); }).forEach(function(x){ h+='<button class="habitTile on" data-hpick="'+esc(x.id)+'"><span class="hIc">'+esc(x.icon||'⭐')+'</span><span class="hLb">'+esc(x.label)+'</span><span class="hOk">✓</span></button>'; });
  h+='</div><div class="card" style="margin-top:12px"><label class="f" for="hOwn">'+esc(t('Add your own'))+'</label><div class="atRow"><input type="text" id="hOwn" maxlength="40" placeholder="'+esc(t('e.g. Call my family'))+'"><button class="btn small" id="hOwnAdd">'+esc(t('Add'))+'</button></div></div>';
  return h+'<button class="btn" id="hSave">'+esc(gpT('Save ({n})',{n:D.length}))+'</button>';
}

/* ---------------- Teams ---------------- */
function teamsHtml(){
  var h='<h2>'+esc(t('Teams'))+'</h2>';
  if(!(S.teams||[]).length) h+='<p class="sub">'+esc(t('A team is your small group, club, class or just two or three friends. See how you each work, and cheer each other on.'))+'</p>';
  (S.teams||[]).forEach(function(tm){
    h+='<button class="card teamRow" data-team="'+esc(tm.id)+'"><span class="teamEmoji">'+esc(tm.emoji)+'</span><span style="flex:1;text-align:left"><b>'+esc(tm.name)+'</b><div class="pmeta">'+esc(peopleN_(tm.size))+(tm.leader?' · '+esc(t('you lead it')):'')+'</div></span><span class="chev">›</span></button>';
  });
  h+='<div class="card"><label class="f" for="joinCode">'+esc(t('Join with a code'))+'</label><div class="atRow"><input type="text" id="joinCode" maxlength="6" autocapitalize="characters" placeholder="ABC123"><button class="btn small" id="joinGo">'+esc(t('Join'))+'</button></div>'+
    '<div class="hint">'+esc(t('Your leader can give you the code, or a link that opens it.'))+'</div></div>';
  if(!S.me.minor) h+='<div class="btnRow"><button class="btn ghost" id="newTeam">＋ '+esc(t('Start a team'))+'</button><button class="btn ghost" id="findPeople">🔍 '+esc(t('Find people'))+'</button></div>';
  return h;
}
function newTeamHtml(){
  var E=['✦','🔥','🌱','⚡','🦁','🌊','⭐','🎯','🙌','📖','🏔️','🌾'];
  var F=S.newTeam||(S.newTeam={ name:'', emoji:'✦', kind:'group' });
  return backBtn(t('Teams'))+'<h2>'+esc(t('Start a team'))+'</h2><div class="card">'+
    '<label class="f" for="ntName">'+esc(t('Team name'))+'</label><input type="text" id="ntName" maxlength="50" value="'+esc(F.name)+'" placeholder="'+esc(t('e.g. Siem Reap Youth'))+'">'+
    '<label class="f">'+esc(t('What kind?'))+'</label><div class="seg"><button data-ntkind="group" class="'+(F.kind==='group'?'on':'')+'">'+esc(t('A group'))+'</button><button data-ntkind="friends" class="'+(F.kind==='friends'?'on':'')+'">'+esc(t('A few friends'))+'</button></div>'+
    '<label class="f">'+esc(t('Pick an emoji'))+'</label><div class="emojiRow">'+E.map(function(e){ return '<button data-ntemoji="'+e+'" class="'+(F.emoji===e?'on':'')+'">'+e+'</button>'; }).join('')+'</div>'+
    '<button class="btn" id="ntGo">'+esc(t('Start the team'))+'</button></div>'+
    '<p class="hint">'+esc(t('You’ll get a code and a link to share. Anyone under 18 joins with the code.'))+'</p>';
}
function personRowHtml(p, extra){
  var bits=[];
  if(p.streak) bits.push('🔥 '+p.streak);
  if(p.week!=null) bits.push('🗒️ '+p.week+'%');
  if(p.type) bits.push(p.type);
  return '<button class="personRow" data-person="'+esc(p.id)+'">'+faceHtml(p,44)+'<span style="flex:1;min-width:0;text-align:left"><b>'+esc(p.name)+'</b>'+(p.leader?' <span class="leadTag">'+esc(t('Leader'))+'</span>':'')+
    '<div class="pmeta">@'+esc(p.username)+(bits.length?' · '+esc(bits.join(' · ')):'')+'</div></span>'+(extra||'<span class="chev">›</span>')+'</button>';
}
function teamHtml(){
  var T=S.team;
  if(!T) return backBtn(t('Teams'))+'<p class="sub">'+esc(t('Loading…'))+'</p>';
  var h=backBtn(t('Teams'))+'<h2>'+esc(T.emoji)+' '+esc(T.name)+'</h2><p class="sub">'+esc(peopleN_(T.people.length))+'</p>';
  if(T.leader){
    var link='https://app.gonpreah.org/?join='+T.code;
    h+='<div class="card codeCard"><div class="pmeta">'+esc(t('Join code'))+'</div><div class="bigCode">'+esc(T.code)+'</div>'+
      '<div class="btnRow"><button class="btn small" id="shareCode" data-link="'+esc(link)+'">'+esc(t('Share the link'))+'</button><button class="btn small ghost" id="newCode">'+esc(t('New code'))+'</button></div>'+
      '<div class="hint">'+esc(t('Anyone with the code can join. Make a new one if it gets passed around.'))+'</div></div>';
  }
  h+=teamMixHtml(T.people);
  h+='<h3>'+esc(t('People'))+'</h3><div class="card list">';
  T.people.slice().sort(function(a,b){ return (b.leader-a.leader) || String(a.name).localeCompare(String(b.name)); }).forEach(function(p){ h+=personRowHtml(p); });
  h+='</div><button class="linkbtn" id="leaveTeam" style="color:var(--bad)">'+esc(t('Leave this team'))+'</button>';
  return h;
}
/* The team's mix: types by group and strengths by group, counted from what people share. */
function teamMixHtml(people){
  var groups={}, gs={}, nType=0, nGs=0;
  people.forEach(function(p){
    if(p.type && typeof gpPGroupOf==='function'){ var g=gpPGroupOf(p.type); groups[g.id]=(groups[g.id]||0)+1; nType++; }
    if(p.strengths && typeof gpGSGroup==='function'){ nGs++; p.strengths.forEach(function(id){ var g=gpGSGroup(id); if(g) gs[g.id]=(gs[g.id]||0)+1; }); }
  });
  if(!nType && !nGs) return '<div class="card"><p class="sub" style="margin:0">'+esc(t('Once people take the personality and strengths tests, you’ll see how your team works together here.'))+'</p></div>';
  var h='<h3>🧩 '+esc(t('How your team works'))+'</h3><div class="card">';
  if(nType){
    h+='<div class="pmeta" style="margin-bottom:6px">'+esc((nType===1?t('Personality — 1 person'):gpT('Personality — {n} people',{n:nType})))+'</div>';
    ['minds','hearts','anchors','movers'].forEach(function(id){ var g=GP_PGROUPS[id], n=groups[id]||0;
      h+='<div class="pBar"><div class="pBarTop"><span style="color:'+g.ink+';font-weight:800">'+esc(t(g.name))+'</span><span><b>'+n+'</b></span></div><div class="pTrack"><div class="pFill" style="left:0;width:'+Math.round(n/nType*100)+'%;background:'+g.color+'"></div></div></div>'; });
  }
  if(nGs){
    var total=nGs*5;
    h+='<div class="pmeta" style="margin:12px 0 6px">'+esc(gpT('Strengths — {n} people’s top 5',{n:nGs}))+'</div>';
    GP_GSGROUPS.forEach(function(g){ var n=gs[g.id]||0;
      h+='<div class="pBar"><div class="pBarTop"><span style="color:'+g.ink+';font-weight:800">'+esc(t(g.name))+'</span><span><b>'+n+'</b></span></div><div class="pTrack"><div class="pFill" style="left:0;width:'+Math.round(n/total*100)+'%;background:'+g.color+'"></div></div></div>'; });
  }
  return h+'</div>';
}
function personHtml(){
  var p=S.person;
  if(!p) return backBtn(t('Back'))+'<p class="sub">'+esc(t('Loading…'))+'</p>';
  var h=backBtn(t('Back'))+'<div class="personHero">'+faceHtml(p,88)+'<h2 style="margin-top:10px">'+esc(p.name)+'</h2><div class="pmeta">@'+esc(p.username)+'</div>'+(p.bio?'<p class="sub" style="margin:8px 0 0">'+esc(p.bio)+'</p>':'')+'</div>';
  var tiles='';
  if(p.streak!=null) tiles+='<div><b>'+p.streak+'</b><span>🔥 '+esc(t('day streak'))+'</span></div>';
  if(p.best) tiles+='<div><b>'+p.best+'</b><span>🏆 '+esc(t('best streak'))+'</span></div>';
  if(p.week!=null) tiles+='<div><b>'+p.week+'%</b><span>🗒️ '+esc(t('this week'))+'</span></div>';
  if(tiles) h+='<div class="card statTiles">'+tiles+'</div>';
  if(p.type && GP_PTYPES[p.type]){ var g=gpPGroupOf(p.type);
    h+='<h3>🧭 '+esc(t('Personality'))+'</h3><button class="card pEntry" id="seePType"><span class="pEntryArt">'+gpPAvatar(p.type,p.sex||'',64)+'</span><span style="flex:1"><div class="pCode" style="color:'+g.ink+'">'+esc(p.type)+'</div><div style="font-size:16px;font-weight:800">'+esc(pTheName(p.type))+'</div><div class="pmeta">'+esc(gpT('How to work well with {name}',{name:firstName_(p.name)}))+'</div></span><span class="chev">›</span></button>'; }
  if(p.strengths && p.strengths.length) h+='<h3>💪 '+esc(t('Strengths'))+'</h3><button class="card pEntry" id="seeGs" style="align-items:flex-start"><span style="flex:1"><div class="sChips">'+p.strengths.map(function(id,i){ return gsChipHtml(id,i+1); }).join('')+'</div></span><span class="chev">›</span></button>';
  if((p.sharedTeams||[]).length) h+='<p class="hint">'+esc(t('In your teams:'))+' '+esc(p.sharedTeams.map(function(x){ return x.emoji+' '+x.name; }).join(', '))+'</p>';
  if(S.team && S.team.leader && !p.leader && p.id!==S.me.id && (S.team.people||[]).some(function(x){ return x.id===p.id; })){
    h+='<div class="card"><div class="pmeta" style="margin-bottom:8px">'+esc(gpT('You lead {team}',{team:S.team.name}))+'</div><div class="btnRow">'+
      (!p.minor?'<button class="btn small ghost" id="makeLeader">'+esc(t('Make a leader'))+'</button>':'')+
      '<button class="btn small ghost" id="removeMember" style="color:var(--bad);border-color:var(--bad)">'+esc(t('Remove from team'))+'</button></div></div>';
  }
  if(!p.minor && p.id!==S.me.id){
    var mine=(S.teams||[]).filter(function(tm){ return tm.leader && !(p.sharedTeams||[]).some(function(x){ return x.id===tm.id; }); });
    if(mine.length) h+='<div class="card"><label class="f">'+esc(t('Ask them to join a team you lead'))+'</label>'+mine.map(function(tm){ return '<button class="btn small ghost" data-inviteto="'+esc(tm.id)+'" style="margin:4px 6px 0 0">'+esc(tm.emoji+' '+tm.name)+'</button>'; }).join('')+'</div>';
  }
  return h;
}
function findHtml(){
  var F=S.find;
  var h=backBtn(t('Teams'))+'<h2>'+esc(t('Find people'))+'</h2>'+
    '<input type="search" id="findQ" placeholder="'+esc(t('Name or @username'))+'" value="'+esc(F.q)+'" autocomplete="off">'+
    '<p class="hint">'+esc(t('Only people 18 and older show up here.'))+'</p><div class="card list" id="findList">';
  if(F.people===null) h+='<p class="sub" style="margin:0">'+esc(t('Type at least two letters.'))+'</p>';
  else if(!F.people.length) h+='<p class="sub" style="margin:0">'+esc(t('Nobody found.'))+'</p>';
  else F.people.forEach(function(p){ h+=personRowHtml(p); });
  return h+'</div>';
}

/* ---------------- Me ---------------- */
function meHtml(){
  var me=S.me, sh=me.share||{};
  var h='<div class="personHero">'+
    '<label class="photoPick" for="photoIn" title="'+esc(t('Change photo'))+'">'+faceHtml(me,96)+'<span class="photoEdit">📷</span></label><input type="file" id="photoIn" accept="image/*" hidden>'+
    '<h2 style="margin-top:10px">'+esc(me.name)+'</h2><div class="pmeta">@'+esc(me.username)+'</div></div>';
  h+='<h3>✦ '+esc(t('How God made you'))+'</h3>';
  if(me.personality && GP_PTYPES[me.personality.type]){ var g=gpPGroupOf(me.personality.type);
    h+='<button class="card pEntry" id="seeMyType"><span class="pEntryArt">'+gpPAvatar(me.personality.type, me.sex||'', 64)+'</span><span style="flex:1"><div class="pCode" style="color:'+g.ink+'">'+esc(me.personality.type)+'</div><div style="font-size:16px;font-weight:800">'+esc(pTheName(me.personality.type))+'</div><div class="pmeta">'+esc(t('Your personality type'))+'</div></span><span class="chev">›</span></button>';
  } else h+=entryCardHtml('goPtest','🧭',t('Find your personality type'),t('40 statements · about 7 minutes'));
  if(me.gstrengths) h+='<button class="card pEntry" id="seeMyGs" style="align-items:flex-start"><span style="flex:1"><div class="sChips">'+me.gstrengths.top.map(function(id,i){ return gsChipHtml(id,i+1); }).join('')+'</div><div class="pmeta" style="margin-top:6px">'+esc(t('Your top 5 strengths'))+'</div></span><span class="chev">›</span></button>';
  else h+=entryCardHtml('goGtest','💪',t('Find your top 5 strengths'),t('102 quick choices · about 15 minutes'));

  h+='<h3>👁 '+esc(t('What others see'))+'</h3><div class="card">'+
    '<p class="sub" style="margin:0 0 8px">'+esc(t('People see your progress, never the details: not your goals, your habits or your answers.'))+'</p>';
  [['type','Your personality type'],['strengths','Your top 5 strengths'],['streak','Your streak'],['week','This week’s %'],['teams','How many teams you’re in']].forEach(function(x){
    h+='<label class="switchRow"><span>'+esc(t(x[1]))+'</span><input type="checkbox" data-share="'+x[0]+'"'+(sh[x[0]]!==false?' checked':'')+'></label>';
  });
  h+=(me.minor?'<div class="hint">🔒 '+esc(t('You’re under 18, so only people in your teams can see you, by your first name.'))+'</div>':'')+'</div>';

  h+='<h3>🙂 '+esc(t('Profile'))+'</h3><div class="card">'+
    '<label class="f" for="pfName">'+esc(t('Your name'))+'</label><input type="text" id="pfName" maxlength="60" value="'+esc(me.name)+'">'+
    (!me.minor?'<label class="f" for="pfBio">'+esc(t('A line about you'))+'</label><input type="text" id="pfBio" maxlength="160" value="'+esc(me.bio||'')+'">':'')+
    '<label class="f">'+esc(t('Language'))+'</label><div class="seg"><button data-lang="km" class="'+(LANG==='km'?'on':'')+'">ខ្មែរ</button><button data-lang="en" class="'+(LANG==='en'?'on':'')+'">English</button></div>'+
    '<label class="f">'+esc(t('Appearance'))+'</label><div class="seg">'+[['auto','Auto'],['light','Light'],['dark','Dark']].map(function(x){ var cur=lsGet('gpa-theme')||'auto'; return '<button data-theme="'+x[0]+'" class="'+(cur===x[0]?'on':'')+'">'+esc(t(x[1]))+'</button>'; }).join('')+'</div>'+
    '<button class="btn" id="pfSave">'+esc(t('Save'))+'</button></div>'+
    '<button class="linkbtn" id="signOut">'+esc(t('Sign out'))+'</button>';
  return h;
}
/* A photo shrunk on the phone to a 256px square JPEG before it goes anywhere. */
function shrinkPhoto_(file, cb){
  var r=new FileReader();
  r.onload=function(){ var img=new Image(); img.onload=function(){
    var s=256, c=document.createElement('canvas'); c.width=s; c.height=s;
    var k=Math.min(img.width, img.height), x=(img.width-k)/2, y=(img.height-k)/2;
    c.getContext('2d').drawImage(img, x, y, k, k, 0, 0, s, s);
    cb(c.toDataURL('image/jpeg', .82));
  }; img.onerror=function(){ cb(null); }; img.src=r.result; };
  r.onerror=function(){ cb(null); }; r.readAsDataURL(file);
}

/* ---------------- personality (the Impact app's screens, for this app) ---------------- */
var P_PAGE=5, P_DRAFT='gpa-ptest';
function pTheName(code){ var ty=GP_PTYPES[code]; return ty ? t(ty.name) : code; }
function pDraft(){ try { return JSON.parse(lsGet(P_DRAFT)||'{}')||{}; } catch(e){ return {}; } }
function pFineHtml(){ return '<p class="pFine">'+esc(t('Uses the same four letters as Myers–Briggs®. This is our own short questionnaire, not the official MBTI® assessment.'))+' '+esc(t('A type describes what comes naturally to you — not what you are able to do.'))+'</p>'; }
function pScaleWord(n){ return t(['Strongly disagree','Disagree','Slightly disagree','Neutral','Slightly agree','Agree','Strongly agree'][n+3]); }
function ptestHtml(){
  var T=S.ptest||(S.ptest={stage:'intro', answers:pDraft(), page:0, sex:S.me.sex||''});
  var h=backBtn(t('Back'));
  if(T.stage==='intro'){
    var started=Object.keys(T.answers).length;
    return h+'<h2>'+esc(t('Personality type'))+'</h2><div class="card">'+
      '<p style="margin:2px 0 10px;font-size:15px;line-height:1.5">'+esc(t('Forty short statements. Answer how you really are — not how you wish you were.'))+'</p>'+
      '<p class="sub" style="margin:0 0 12px">'+esc(t('There are no right answers, and no type is better than another.'))+'</p>'+
      '<label class="f">'+esc(t('Your character'))+'</label><div class="pSexRow">'+
        '<button data-psex="female" class="'+(T.sex==='female'?'on':'')+'">'+gpPAvatar('ENFJ','female',56)+esc(t('Female'))+'</button>'+
        '<button data-psex="male" class="'+(T.sex==='male'?'on':'')+'">'+gpPAvatar('ENFJ','male',56)+esc(t('Male'))+'</button></div>'+
      '<button class="btn" id="pBegin"'+(T.sex?'':' disabled')+'>'+esc(started?gpT('Carry on — {n} of 40 answered',{n:started}):t('Start'))+'</button>'+
      '<button class="linkbtn" id="pKnow">'+esc(t('I already know my type'))+'</button></div>'+pFineHtml();
  }
  if(T.stage==='pick'){
    h+='<h2>'+esc(t('Choose your type'))+'</h2><p class="sub">'+esc(t('Already taken a test like this before? Pick the four letters you got.'))+'</p>';
    ['minds','hearts','anchors','movers'].forEach(function(gid){ var g=GP_PGROUPS[gid];
      h+='<h3 style="color:'+g.ink+'">'+esc(t(g.name))+'</h3><div class="pPick">';
      GP_PTYPE_CODES.filter(function(c){ return gpPGroupOf(c).id===gid; }).forEach(function(c){
        h+='<button data-ppick="'+c+'">'+gpPAvatar(c, T.sex||'female', 64)+'<span class="pCode" style="color:'+g.ink+'">'+c+'</span><span class="pPickName">'+esc(pTheName(c))+'</span></button>'; });
      h+='</div>'; });
    return h+pFineHtml();
  }
  var pages=Math.ceil(GP_PQUESTIONS.length/P_PAGE), page=Math.max(0,Math.min(pages-1,T.page));
  var answered=GP_PQUESTIONS.filter(function(q){ return T.answers[q.id]!==undefined; }).length;
  h+='<div class="pProg"><div class="pTrack"><div style="width:'+Math.round(answered/GP_PQUESTIONS.length*100)+'%"></div></div><div class="pProgTxt">'+esc(gpT('{n} of {total}',{n:answered,total:GP_PQUESTIONS.length}))+'</div></div>';
  var qs=GP_PQUESTIONS.slice(page*P_PAGE, page*P_PAGE+P_PAGE), pageDone=qs.every(function(q){ return T.answers[q.id]!==undefined; });
  qs.forEach(function(q){ var v=T.answers[q.id];
    h+='<div class="pStmt'+(v!==undefined?' done':'')+'" id="pq_'+q.id+'"><div class="pText">'+esc(t(q.text))+'</div><div class="pScale" role="radiogroup" aria-label="'+esc(t(q.text))+'">';
    [3,2,1,0,-1,-2,-3].forEach(function(n){ var side=n>0?'ag':(n<0?'dis':'mid');
      h+='<button class="pDot s'+Math.abs(n)+' '+side+(v===n?' on':'')+'" data-pans="'+q.id+'|'+n+'" role="radio" aria-checked="'+(v===n)+'" aria-label="'+esc(pScaleWord(n))+'"></button>'; });
    h+='</div><div class="pScaleEnds"><span class="ag">'+esc(t('Agree'))+'</span><span class="dis">'+esc(t('Disagree'))+'</span></div></div>';
  });
  var last=page===pages-1;
  return h+'<div style="display:flex;gap:10px;margin:18px 0 6px">'+(page>0?'<button class="btn ghost" id="pPrev" style="flex:1">'+esc(t('Back'))+'</button>':'')+
    (last?'<button class="btn" id="pFinish" style="flex:2"'+(answered===GP_PQUESTIONS.length?'':' disabled')+'>'+esc(t('See my type'))+'</button>'
         :'<button class="btn" id="pNext" style="flex:2"'+(pageDone?'':' disabled')+'>'+esc(t('Next'))+'</button>')+'</div>';
}
function ptypeHtml(){
  var other=S.ptypeOther, mine=!other, P=mine?S.me.personality:other;
  var h=backBtn(t('Back'));
  if(!P || !GP_PTYPES[P.type]) return h+'<p class="sub">'+esc(t('No type chosen yet.'))+'</p>';
  var ty=GP_PTYPES[P.type], g=gpPGroupOf(P.type), sex=mine?(S.me.sex||''):(other.sex||'');
  h+='<div class="pHero" style="background:'+g.tint+'">'+(mine?'':'<div class="pWho">'+esc(gpT('{name}’s type',{name:firstName_(other.name)}))+'</div>')+
    '<div class="pHeroArt">'+gpPAvatar(P.type, sex, 132)+'</div><span class="pGroup" style="color:'+g.ink+'">'+esc(t(g.name))+'</span>'+
    '<div class="pBig" style="color:'+g.ink+'">'+esc(P.type)+'</div><div class="pName">'+esc(pTheName(P.type))+'</div><div class="pTag">'+esc(t(ty.tagline))+'</div></div>';
  if(mine && P.scores){
    h+='<div class="card">';
    GP_PAXES.forEach(function(ax){ var pct=Number(P.scores[ax.id]), first=pct>50, shown=first?pct:100-pct, fill=first?'left:0;width:'+pct+'%':'right:0;width:'+(100-pct)+'%';
      h+='<div class="pBar"><div class="pBarTop"><span>'+esc(t(ax.label))+'</span><span><b>'+shown+'%</b> '+esc(t(first?ax.aName:ax.bName))+'</span></div><div class="pTrack"><div class="pFill" style="'+fill+';background:'+g.color+'"></div></div><div class="pEnds"><span>'+esc(t(ax.aName))+'</span><span>'+esc(t(ax.bName))+'</span></div></div>'; });
    h+='</div>';
  }
  h+='<div class="card"><p style="margin:2px 0;font-size:15px;line-height:1.55">'+esc(t(ty.about))+'</p></div>';
  h+='<h3>'+esc(t('Strengths'))+'</h3><div class="card"><ul class="pList">'+ty.strengths.map(function(x){ return '<li><span class="pMark" style="background:var(--pGood)">✓</span>'+esc(t(x))+'</li>'; }).join('')+'</ul></div>';
  h+='<h3>'+esc(t('Watch out for'))+'</h3><div class="card"><ul class="pList">'+ty.watch.map(function(x){ return '<li><span class="pMark" style="background:var(--pBad)">!</span>'+esc(t(x))+'</li>'; }).join('')+'</ul></div>';
  if(mine){
    var season=P.season||'ordinary', tips=gpPTipsFor(P.type, '', season);
    h+='<h3>🌱 '+esc(t('For you, right now'))+'</h3><div class="card"><label class="f" style="margin-top:2px">'+esc(t('What season are you in?'))+'</label><div class="pSeasons">'+
      GP_PSEASONS.map(function(se){ return '<button data-pseason="'+se.id+'" class="'+(season===se.id?'on':'')+'">'+esc(t(se.name))+'</button>'; }).join('')+'</div>'+
      '<div class="hint" style="margin-bottom:6px">🔒 '+esc(t('only you see this'))+'</div><ul class="pList">'+tips.map(function(tip){ return '<li><span class="pMark" style="background:'+(tip.kind==='season'?g.color:'var(--accent)')+'">'+(tip.kind==='season'?'◷':'★')+'</span>'+esc(t(tip.text))+'</li>'; }).join('')+'</ul></div>';
  }
  h+='<h3>🤝 '+esc(mine?t('How others can work well with you'):gpT('Working with {name}',{name:firstName_(other.name)}))+'</h3><div class="card"><ul class="pList">'+
    ty.workWith.map(function(x){ return '<li><span class="pMark" style="background:'+g.color+'">→</span>'+esc(t(x))+'</li>'; }).join('')+'</ul></div>';
  if(mine) h+='<button class="btn ghost" id="pRetake">'+esc(t('Take the test again'))+'</button>';
  return h+pFineHtml();
}

/* ---------------- strengths ---------------- */
var GS_PAGE=5, GS_DRAFT='gpa-gtest';
function gsDraft(){ try { return JSON.parse(lsGet(GS_DRAFT)||'{}')||{}; } catch(e){ return {}; } }
function gsChipHtml(id, rank){ var s=gpGSById(id), g=gpGSGroup(id); if(!s||!g) return ''; return '<span class="sChip" style="background:'+g.tint+';color:'+g.ink+'">'+(rank?'<b>'+rank+'</b> ':'')+esc(t(s.name))+'</span>'; }
function gsFineHtml(){ return '<p class="pFine">'+esc(t('GP Strengths is our own free questionnaire.'))+' '+esc(gpT('A strength is what comes naturally to you — everyone can grow in all {n}.',{n:GP_GS_IDS.length}))+'</p>'; }
function gsScaleWord(n){ return t(['Much more like the first','A little more like the first','Both equally','A little more like the second','Much more like the second'][n+2]); }
function gtestHtml(){
  var T=S.gtest||(S.gtest={stage:'intro', answers:gsDraft(), page:0}), total=GP_GSPAIRS.length;
  var h=backBtn(t('Back'));
  if(T.stage==='intro'){
    var started=Object.keys(T.answers).length;
    return h+'<h2>'+esc(t('GP Strengths'))+'</h2><div class="card"><p style="margin:2px 0 10px;font-size:15px;line-height:1.5">'+
      esc(gpT('{n} pairs of statements. For each pair, choose which one is more like you — even when both are.',{n:total}))+'</p>'+
      '<p class="sub" style="margin:0 0 12px">'+esc(t('Go with your first answer. Think about what you enjoy and what comes easily.'))+'</p>'+
      '<button class="btn" id="gsBegin">'+esc(started?gpT('Carry on — {n} of {total} answered',{n:started,total:total}):t('Start'))+'</button></div>'+gsFineHtml();
  }
  var pages=Math.ceil(total/GS_PAGE), page=Math.max(0,Math.min(pages-1,T.page));
  var answered=GP_GSPAIRS.filter(function(p,i){ return T.answers['p'+i]!==undefined; }).length;
  h+='<div class="pProg"><div class="pTrack"><div style="width:'+Math.round(answered/total*100)+'%"></div></div><div class="pProgTxt">'+esc(gpT('{n} of {total}',{n:answered,total:total}))+'</div></div>';
  var from=page*GS_PAGE, pageDone=true;
  for(var i=from;i<Math.min(total,from+GS_PAGE);i++){
    var p=GP_GSPAIRS[i], v=T.answers['p'+i]; if(v===undefined) pageDone=false;
    var a=gpGSById(p[0]).statements[p[1]], b=gpGSById(p[2]).statements[p[3]];
    h+='<div class="pStmt gsPair'+(v!==undefined?' done':'')+'" id="gq_'+i+'"><div class="gsAsk">'+esc(t('Which is more like you?'))+'</div><div class="gsOpts"><div class="gsOpt'+(v<0?' lean l':'')+'">'+esc(t(a))+'</div><div class="gsOpt'+(v>0?' lean r':'')+'">'+esc(t(b))+'</div></div><div class="pScale gsScale" role="radiogroup" aria-label="'+esc(t('Which is more like you?'))+'">';
    [-2,-1,0,1,2].forEach(function(n){ var side=n<0?'ag':(n>0?'dis':'mid'); h+='<button class="pDot s'+(n===0?0:Math.abs(n)+1)+' '+side+(v===n?' on':'')+'" data-gsans="'+i+'|'+n+'" role="radio" aria-checked="'+(v===n)+'" aria-label="'+esc(gsScaleWord(n))+'"></button>'; });
    h+='</div><div class="pScaleEnds gsEnds"><span class="ag">← '+esc(t('More like me'))+'</span><span class="dis">'+esc(t('More like me'))+' →</span></div></div>';
  }
  var last=page===pages-1;
  return h+'<div style="display:flex;gap:10px;margin:18px 0 6px">'+(page>0?'<button class="btn ghost" id="gsPrev" style="flex:1">'+esc(t('Back'))+'</button>':'')+
    (last?'<button class="btn" id="gsFinish" style="flex:2"'+(answered===total?'':' disabled')+'>'+esc(t('See my strengths'))+'</button>':'<button class="btn" id="gsNext" style="flex:2"'+(pageDone?'':' disabled')+'>'+esc(t('Next'))+'</button>')+'</div>';
}
function gstrHtml(){
  var other=S.gsOther, mine=!other, G=mine?S.me.gstrengths:other;
  var h=backBtn(t('Back'));
  if(!G || !G.top || !G.top.length) return h+'<p class="sub">'+esc(t('No strengths yet.'))+'</p>';
  var g1=gpGSGroup(G.top[0]);
  h+='<div class="pHero gsHero" style="background:'+g1.tint+'"><div class="pWho">'+esc(mine?t('Your top 5 strengths'):gpT('{name}’s top 5 strengths',{name:firstName_(other.name)}))+'</div><div class="gsHeroList">'+
    G.top.map(function(id,i){ var s=gpGSById(id), g=gpGSGroup(id); return '<div class="gsHeroRow"><span class="gsRank" style="background:'+g.ink+'">'+(i+1)+'</span><span style="flex:1;text-align:left"><b style="color:'+g.ink+'">'+esc(t(s.name))+'</b><span class="gsHeroTag">'+esc(t(s.tagline))+'</span></span></div>'; }).join('')+'</div></div>';
  G.top.forEach(function(id,i){ var s=gpGSById(id), g=gpGSGroup(id);
    h+='<div class="card gsCard" style="border-left-color:'+g.color+'"><div class="gsCardTop"><span class="gsRank" style="background:'+g.ink+'">'+(i+1)+'</span><span><div class="gsName">'+esc(t(s.name))+'</div><div class="gsGroup" style="color:'+g.ink+'">'+esc(t(g.name))+'</div></span></div>'+
      '<p style="margin:8px 0 6px;font-size:15px;line-height:1.55">'+esc(t(s.about))+'</p><ul class="pList">'+
      s.best.map(function(x){ return '<li><span class="pMark" style="background:var(--pGood)">✓</span>'+esc(t(x))+'</li>'; }).join('')+
      s.watch.map(function(x){ return '<li><span class="pMark" style="background:var(--pBad)">!</span>'+esc(t(x))+'</li>'; }).join('')+
      '<li><span class="pMark" style="background:'+g.ink+'">→</span><b>'+esc(mine?t('For the team:'):t('Working together:'))+'</b> '+esc(t(s.give))+'</li></ul></div>'; });
  if(mine) h+='<button class="btn ghost" id="gsRetake">'+esc(t('Take the test again'))+'</button>';
  return h+gsFineHtml();
}

/* ---------------- bind ---------------- */
function $(id){ return document.getElementById(id); }
function on(id, fn){ var e=$(id); if(e) e.onclick=fn; }
function all(sel, fn){ document.querySelectorAll(sel).forEach(function(e){ e.onclick=function(ev){ fn(e, ev); }; }); }
function busyOnce_(fn){ return function(){ if(S.busy) return; S.busy=true; var r=fn.apply(this, arguments); if(r && r.then) r.then(function(){ S.busy=false; }, function(){ S.busy=false; }); else S.busy=false; }; }

function bind(){
  on('langBtn', function(){ setLang_(LANG==='km'?'en':'km'); });
  all('[data-tab]', function(b){ S.back=[]; S.view=b.getAttribute('data-tab'); if(S.view==='teams') refresh_(); render(); window.scrollTo(0,0); });
  all('[data-back]', function(){ goBack(); });
  on('googleBtn', function(){ if(!S.busy) signIn_(); });
  bindSignup_();
  if(!AUTH || !S.me) return;

  /* home */
  on('goPtest', function(){ S.ptest=null; go('ptest'); });
  on('goGtest', function(){ S.gtest=null; go('gtest'); });
  on('goTeamsHome', function(){ S.back=[]; go('teams', true); });
  on('habitPick', function(){ S.habitDraft=null; go('habitpick'); });
  all('[data-habit]', function(b){
    var id=b.getAttribute('data-habit'), d=todayStr(), was=!!((S.me.days||{})[d]||{})[id];
    S.me.days=S.me.days||{}; var m=Object.assign({}, S.me.days[d]||{}); if(was) delete m[id]; else m[id]=true; S.me.days[d]=m;
    gpTap(); render();
    call('tickHabit', d, id, !was).then(function(r){ if(r && r.ok){ S.me=r.me; render(); } else { failMsg(r); refresh_(); } });
  });
  all('[data-invite]', function(b){ var p=b.getAttribute('data-invite').split('|'); call('answerInvite', p[0], p[1]==='1').then(function(d){ if(d && d.ok){ adopt_(d); render(); } else failMsg(d); }); });
  on('wkEdit', function(){ S.weekEdit=true; render(); });
  on('wkCancel', function(){ S.weekEdit=false; render(); });
  on('wkSave', busyOnce_(function(){
    var wk=mondayOf(todayStr()), old=(S.me.weeks||{})[wk]||[];
    var goals=[].map.call(document.querySelectorAll('[data-wk]'), function(el){ var i=Number(el.getAttribute('data-wk')); return { text:el.value.trim(), pct:(old[i] && old[i].text===el.value.trim()) ? old[i].pct : 0 }; }).filter(function(g){ return g.text; });
    return call('saveWeek', wk, goals).then(function(d){ if(d && d.ok){ S.me=d.me; S.weekEdit=false; render(); } else failMsg(d); });
  }));
  document.querySelectorAll('[data-wkpct]').forEach(function(r){
    r.oninput=function(){ r.style.setProperty('--p', r.value+'%'); var b=r.parentNode.querySelector('.wkTop b'); if(b) b.textContent=r.value+'%'; };
    r.onchange=function(){
      var wk=mondayOf(todayStr()), goals=((S.me.weeks||{})[wk]||[]).map(function(g){ return Object.assign({}, g); });
      var i=Number(r.getAttribute('data-wkpct')); if(!goals[i]) return; goals[i].pct=Number(r.value);
      if(goals[i].pct===100 && typeof confettiAt_==='function') confettiAt_(r);
      call('saveWeek', wk, goals).then(function(d){ if(d && d.ok){ S.me=d.me; render(); } else failMsg(d); });
    };
  });
  all('[data-hpick]', function(b){
    var id=b.getAttribute('data-hpick'), D=S.habitDraft, i=D.findIndex(function(x){ return x.id===id; });
    if(i>-1) D.splice(i,1); else if(D.length>=MAX_HABITS){ showMsg(gpT('Up to {n} habits.',{n:MAX_HABITS})); return; } else D.push({ id:id });
    render();
  });
  on('hOwnAdd', function(){ var v=$('hOwn').value.trim(); if(!v) return; if(S.habitDraft.length>=MAX_HABITS){ showMsg(gpT('Up to {n} habits.',{n:MAX_HABITS})); return; }
    S.habitDraft.push({ id:'c_'+Math.random().toString(36).slice(2,10).replace(/[^a-z0-9]/g,'a'), label:v.slice(0,40), icon:'⭐' }); render(); });
  on('hSave', busyOnce_(function(){ return call('saveHabits', S.habitDraft).then(function(d){ if(d && d.ok){ S.me=d.me; S.habitDraft=null; goBack('home'); } else failMsg(d); }); }));

  /* teams */
  all('[data-team]', function(b){ openTeam_(b.getAttribute('data-team')); });
  on('joinGo', busyOnce_(function(){ var c=$('joinCode').value; return call('joinTeam', c).then(function(d){
    if(d && d.ok){ showMsg(d.already?gpT('You’re already in {team}.',{team:d.team.name}):gpT('You joined {team}!',{team:d.team.name})); refresh_().then(function(){ openTeam_(d.team.id); }); } else failMsg(d); }); }));
  on('newTeam', function(){ S.newTeam=null; go('newteam'); });
  on('findPeople', function(){ go('find'); setTimeout(function(){ var q=$('findQ'); if(q) q.focus(); }, 50); });
  all('[data-ntkind]', function(b){ keepNt_(); S.newTeam.kind=b.getAttribute('data-ntkind'); render(); });
  all('[data-ntemoji]', function(b){ keepNt_(); S.newTeam.emoji=b.getAttribute('data-ntemoji'); render(); });
  on('ntGo', busyOnce_(function(){ keepNt_(); return call('createTeam', S.newTeam).then(function(d){ if(d && d.ok){ S.newTeam=null; refresh_().then(function(){ S.back=['teams']; openTeam_(d.team.id, true); }); } else failMsg(d); }); }));
  on('shareCode', function(){ var b=$('shareCode'), link=b.getAttribute('data-link'), text=gpT('Join my team on GonPreah: {link}',{link:link});
    if(navigator.share){ navigator.share({ title:'GonPreah', text:text, url:link }).catch(function(){}); return; }
    try { navigator.clipboard.writeText(link).then(function(){ showMsg(t('Link copied.')); }); } catch(e){ showMsg(link); } });
  on('newCode', busyOnce_(function(){ if(!confirm(t('Make a new code? The old one will stop working.'))) return; return call('teamManage', S.team.id, 'code').then(function(d){ if(d && d.ok){ S.team=d.team; render(); } else failMsg(d); }); }));
  on('leaveTeam', busyOnce_(function(){ if(!confirm(gpT('Leave {team}?',{team:S.team.name}))) return; return call('leaveTeam', S.team.id).then(function(d){ if(d && d.ok){ S.team=null; refresh_(); S.back=[]; S.view='teams'; render(); } else failMsg(d); }); }));
  all('[data-person]', function(b){ openPerson_(b.getAttribute('data-person')); });
  on('makeLeader', busyOnce_(function(){ return call('teamManage', S.team.id, 'lead', S.person.id).then(function(d){ if(d && d.ok){ S.team=d.team; S.person.leader=true; showMsg(t('Done.')); render(); } else failMsg(d); }); }));
  on('removeMember', busyOnce_(function(){ if(!confirm(gpT('Remove {name} from {team}?',{name:S.person.name, team:S.team.name}))) return; return call('teamManage', S.team.id, 'remove', S.person.id).then(function(d){ if(d && d.ok){ S.team=d.team; goBack('team'); } else failMsg(d); }); }));
  all('[data-inviteto]', function(b){ call('inviteToTeam', b.getAttribute('data-inviteto'), S.person.id).then(function(d){ if(d && d.ok) showMsg(t('Invite sent.')); else if(d && d.err==='already') showMsg(t('They’re already in that team.')); else failMsg(d); }); });
  on('seePType', function(){ S.ptypeOther={ name:S.person.name, type:S.person.type, sex:S.person.sex }; go('ptype'); });
  on('seeGs', function(){ S.gsOther={ name:S.person.name, top:S.person.strengths }; go('gstr'); });
  var fq=$('findQ');
  if(fq){ var ft=null; fq.oninput=function(){ var v=fq.value; S.find.q=v; clearTimeout(ft); ft=setTimeout(function(){
    if(v.trim().length<2){ S.find.people=null; drawFind_(); return; }
    call('searchPeople', v).then(function(d){ if(S.find.q!==v) return; S.find.people=(d && d.people)||[]; drawFind_(); loadPhotos_(S.find.people); }); }, 300); }; }

  /* me */
  var pi=$('photoIn');
  if(pi) pi.onchange=function(){ var f=pi.files && pi.files[0]; if(!f) return; shrinkPhoto_(f, function(data){ if(!data){ showMsg(t('That photo couldn’t be used.')); return; }
    call('savePhoto', data).then(function(d){ if(d && d.ok){ S.me=d.me; S.photos[S.me.id]=data; render(); } else failMsg(d); }); }); };
  document.querySelectorAll('[data-share]').forEach(function(c){ c.onchange=function(){ var o={}; o[c.getAttribute('data-share')]=c.checked;
    call('saveProfile', { share:o }).then(function(d){ if(d && d.ok){ S.me=d.me; } else { failMsg(d); render(); } }); }; });
  all('[data-lang]', function(b){ setLang_(b.getAttribute('data-lang')); });
  all('[data-theme]', function(b){ var v=b.getAttribute('data-theme'); if(v==='auto'){ lsDel('gpa-theme'); document.documentElement.removeAttribute('data-theme'); } else { lsSet('gpa-theme', v); document.documentElement.setAttribute('data-theme', v); } render(); });
  on('pfSave', busyOnce_(function(){ var p={ name:$('pfName').value }; if($('pfBio')) p.bio=$('pfBio').value;
    return call('saveProfile', p).then(function(d){ if(d && d.ok){ S.me=d.me; showMsg(t('Saved.')); render(); } else failMsg(d); }); }));
  on('signOut', function(){ if(!confirm(t('Sign out on this phone?'))) return; var a=AUTH; api('signOut',[a.uid,a.token]); signedOut_(); });
  on('seeMyType', function(){ S.ptypeOther=null; go('ptype'); });
  on('seeMyGs', function(){ S.gsOther=null; go('gstr'); });

  bindPTest_(); bindGTest_();
  if(S.view==='team' && S.team) loadPhotos_(S.team.people);
  if(S.view==='person' && S.person) loadPhotos_([S.person]);
  if(S.me && S.me.hasPhoto) loadPhotos_([S.me]);
}
function drawFind_(){ var l=$('findList'); if(!l) return; var F=S.find;
  l.innerHTML = F.people===null ? '<p class="sub" style="margin:0">'+esc(t('Type at least two letters.'))+'</p>' : !F.people.length ? '<p class="sub" style="margin:0">'+esc(t('Nobody found.'))+'</p>' : F.people.map(function(p){ return personRowHtml(p); }).join('');
  l.querySelectorAll('[data-person]').forEach(function(b){ b.onclick=function(){ openPerson_(b.getAttribute('data-person')); }; }); }
function keepNt_(){ var n=$('ntName'); if(n && S.newTeam) S.newTeam.name=n.value; }
function setLang_(l){ LANG=l==='en'?'en':'km'; lsSet('gpa-lang', LANG); render(); if(AUTH && S.me) call('saveProfile', { lang:LANG }); }
function openTeam_(id, keep){ if(!keep) S.back.push(S.view); S.team=null; S.view='team'; render(); window.scrollTo(0,0);
  call('team', id).then(function(d){ if(d && d.ok){ S.team=d.team; render(); } else { failMsg(d); goBack('teams'); } }); }
function openPerson_(id){ S.back.push(S.view); S.person=null; S.view='person'; render(); window.scrollTo(0,0);
  call('person', id).then(function(d){ if(d && d.ok){ S.person=d.person; if(S.team){ var m=(S.team.people||[]).filter(function(x){ return x.id===id; })[0]; if(m) S.person.leader=m.leader; } render(); } else { showMsg(t('That person isn’t available.')); goBack('teams'); } }); }

function bindPTest_(){
  all('[data-psex]', function(b){ S.ptest.sex=b.getAttribute('data-psex'); render(); });
  on('pBegin', function(){ var T=S.ptest; T.stage='q'; var first=GP_PQUESTIONS.findIndex(function(q){ return T.answers[q.id]===undefined; });
    T.page = first<0 ? Math.ceil(GP_PQUESTIONS.length/P_PAGE)-1 : Math.floor(first/P_PAGE); render(); window.scrollTo(0,0); });
  on('pKnow', function(){ S.ptest.stage='pick'; render(); window.scrollTo(0,0); });
  all('[data-ppick]', busyOnce_(function(b){ var c=b.getAttribute('data-ppick');
    return call('savePersonality', { type:c, sex:S.ptest.sex||undefined }).then(function(d){ if(d && d.ok){ S.me=d.me; S.ptest=null; S.ptypeOther=null; S.view='ptype'; render(); window.scrollTo(0,0); } else failMsg(d); }); }));
  all('[data-pans]', function(b){ var p=b.getAttribute('data-pans').split('|'), T=S.ptest; T.answers[p[0]]=Number(p[1]); lsSet(P_DRAFT, JSON.stringify(T.answers)); gpTap(); render();
    var qs=GP_PQUESTIONS.slice(T.page*P_PAGE, T.page*P_PAGE+P_PAGE), next=qs.filter(function(q){ return T.answers[q.id]===undefined; })[0];
    var el=next?$('pq_'+next.id):($('pFinish')||$('pNext')); if(el && el.scrollIntoView) try { el.scrollIntoView({ behavior:'smooth', block:'center' }); } catch(e){} });
  on('pNext', function(){ S.ptest.page++; render(); window.scrollTo(0,0); });
  on('pPrev', function(){ S.ptest.page--; render(); window.scrollTo(0,0); });
  on('pFinish', busyOnce_(function(){ var r=gpPScore(S.ptest.answers); if(!r) return;
    return call('savePersonality', { type:r.type, scores:r.scores, sex:S.ptest.sex||undefined }).then(function(d){ if(d && d.ok){ lsDel(P_DRAFT); S.me=d.me; S.ptest=null; S.ptypeOther=null; S.view='ptype'; render(); window.scrollTo(0,0); } else failMsg(d); }); }));
  all('[data-pseason]', function(b){ call('savePersonality', { season:b.getAttribute('data-pseason') }).then(function(d){ if(d && d.ok){ S.me=d.me; render(); } else failMsg(d); }); });
  on('pRetake', function(){ lsDel(P_DRAFT); S.ptest={ stage:'intro', answers:{}, page:0, sex:S.me.sex||'' }; S.view='ptest'; render(); window.scrollTo(0,0); });
}
function bindGTest_(){
  on('gsBegin', function(){ var T=S.gtest; T.stage='q'; var first=-1; for(var i=0;i<GP_GSPAIRS.length;i++){ if(T.answers['p'+i]===undefined){ first=i; break; } }
    T.page = first<0 ? Math.ceil(GP_GSPAIRS.length/GS_PAGE)-1 : Math.floor(first/GS_PAGE); render(); window.scrollTo(0,0); });
  all('[data-gsans]', function(b){ var p=b.getAttribute('data-gsans').split('|'), T=S.gtest; T.answers['p'+p[0]]=Number(p[1]); lsSet(GS_DRAFT, JSON.stringify(T.answers)); gpTap(); render();
    var from=T.page*GS_PAGE, next=null; for(var i=from;i<Math.min(GP_GSPAIRS.length,from+GS_PAGE);i++){ if(T.answers['p'+i]===undefined){ next=i; break; } }
    var el=next!==null?$('gq_'+next):($('gsFinish')||$('gsNext')); if(el && el.scrollIntoView) try { el.scrollIntoView({ behavior:'smooth', block:'center' }); } catch(e){} });
  on('gsNext', function(){ S.gtest.page++; render(); window.scrollTo(0,0); });
  on('gsPrev', function(){ S.gtest.page--; render(); window.scrollTo(0,0); });
  on('gsFinish', busyOnce_(function(){ if(!gpGSScore(S.gtest.answers)){ showMsg(t('Answer every pair first.')); return; }
    return call('saveStrengths', { answers:S.gtest.answers }).then(function(d){ if(d && d.ok){ lsDel(GS_DRAFT); S.me=d.me; S.gtest=null; S.gsOther=null; S.view='gstr'; render(); window.scrollTo(0,0); } else failMsg(d); }); }));
  on('gsRetake', function(){ lsDel(GS_DRAFT); S.gtest={ stage:'intro', answers:{}, page:0 }; S.view='gtest'; render(); window.scrollTo(0,0); });
}

/* a little burst when a goal reaches 100% (not under reduced motion) */
function confettiAt_(el){
  try {
    if(!el || !el.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var r=el.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top, C=['#1F44FF','#FFB323','#2BB673','#FF5A5F','#9B5DE5'];
    for(var i=0;i<16;i++){ var p=document.createElement('span'); p.className='confettiBit'; p.style.background=C[i%C.length]; p.style.left=cx+'px'; p.style.top=cy+'px'; document.body.appendChild(p);
      var a=Math.random()*Math.PI*2, d=40+Math.random()*60; p.animate([{ transform:'translate(0,0)', opacity:1 },{ transform:'translate('+Math.cos(a)*d+'px,'+(Math.sin(a)*d-30)+'px)', opacity:0 }], { duration:700, easing:'ease-out' }).onfinish=(function(x){ return function(){ x.remove(); }; })(p); }
  } catch(e){}
}

/* ---------------- start ---------------- */
if('serviceWorker' in navigator && !navigator.webdriver) try { navigator.serviceWorker.register('sw.js').catch(function(){}); } catch(e){}
if(AUTH) bootNow_(); else render();

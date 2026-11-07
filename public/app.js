/*  GonPreah — the app (app.gonpreah.org).

    One plain script, one global state S, one render(). Every screen is a
    function returning HTML; bind() wires what is on screen after each render.
    Every word a person reads goes through t() (Khmer from km.js and km-app.js).

    Screens (S.view):
      signin · signup            — a username and password (or Google), then a name and birth year
      home                       — today: my why, today's 3, focus, habits, steps for now, the evening
                                   check-in, the Sunday recap, this week's goals, invites
      focus                      — the focus timer (25 or 50 minutes, phone down)
      share                      — a picture of my week to share (drawn on the phone)
      plan · goal · goaledit     — the life plan: my why, SMART life goals, their steps, tasks
      coach · meet               — 1-on-1s: a coaching (coach + mentee) and one meeting in it
      report · blocked · admin   — report a person or team, the people I've blocked, the admin's reports
      grow · library · learn     — the Learn tab: the Library (library-app.js) and Learn Khmer /
                                   English (learn.js), both copied from the Impact app
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
  signup: null, ptest: null, gtest: null, habitDraft: null, weekEdit: false,
  teamTasks: [], goalId: null, goalDraft: null, whyEdit: false, showDone: false, showReached: false,
  coach: [], coaching: null, meetId: null, meetDraft: null, showEnded: false,
  feed: null, feedMore: false, cheers: [], reportFor: null, blockedPeople: null, admin: null,
  push: null, pushSub: null, pushChecked: false, pushBusy: false, authCfg: null, resetResult: null,
  topEdit: false, checkinEdit: false, checkinMood: 0, focusSetup: { dur: 25, label: '' },
  challenges: [], chNew: null
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
    name:'Please write your name.', birthYear:'Please choose the year you were born.', photo:'That photo couldn’t be used.',
    title:'Write what you want to do.', area:'Choose a part of life.', by:'Choose a month that hasn’t passed yet.', text:'Write something first.',
    not_leader:'Only a leader can do this.', none:'That isn’t here any more.',
    not_admin:'Only the admin can see this.', what:'Choose what is wrong.', suspended:'This account has been suspended.',
    password:'Use at least 8 characters for your password.', login:'That username or password isn’t right.',
    locked:'Too many tries. Wait 15 minutes and try again.', google_only:'This account signs in with Google.', current:'Your current password isn’t right.',
    second_leader:'To coach someone under 18, the team needs a second leader first.', already:'You two already have a coaching.' };
  showMsg(t(E[d && d.err] || 'Something went wrong — try again.'));
}
function adopt_(d){ if(d && d.me) S.me=d.me; if(d && d.teams) S.teams=d.teams; if(d && d.teamTasks) S.teamTasks=d.teamTasks; if(d && d.coach) S.coach=d.coach; if(d && d.cheers) S.cheers=d.cheers; if(d && 'push' in d) S.push=d.push; if(d && d.challenges) S.challenges=d.challenges; if(d && d.today) S.today=d.today; }

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
var VIEWS_TABS = { share:'home', focus:'home', report:'teams', blocked:'me', admin:'me', grow:'grow', library:'grow', learn:'grow', plan:'plan', goal:'plan', goaledit:'plan', coach:'plan', meet:'plan', home:'home', teams:'teams', team:'teams', person:'teams', find:'teams', newteam:'teams', me:'me', ptest:'me', ptype:'me', gtest:'me', gstr:'me', habitpick:'home' };
function go(view, keep){ if(!keep) S.back.push(S.view); S.view=view; render(); window.scrollTo(0,0); }
function goBack(fallback){ S.view=S.back.pop()||fallback||'home'; render(); window.scrollTo(0,0); }
function backBtn(label){ return '<button class="linkbtn backLink" data-back>← '+esc(label)+'</button>'; }

function render(){
  var m=document.getElementById('main');
  var logo=document.getElementById('brandLogo'), sl=document.getElementById('splashLogo');
  if(typeof GP_LOGO==='string' && logo && !logo.src) logo.src=GP_LOGO;   // the GonPreah seal; not the wide YWAM GP mark (Uriah: "leave out ywam stuff")
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
    else if(V==='plan') h=planHtml();
    else if(V==='goal') h=goalHtml();
    else if(V==='goaledit') h=goalEditHtml();
    else if(V==='coach') h=coachHtml();
    else if(V==='meet') h=meetHtml();
    else if(V==='grow') h=growHtml();
    else if(V==='focus') h=focusHtml();
    else if(V==='share') h=shareHtml();
    else if(V==='report') h=reportHtml();
    else if(V==='blocked') h=blockedHtml();
    else if(V==='admin') h=adminHtml();
    else if(V==='library') h=libraryHtml();
    else if(V==='learn') h=khmerHtml_();
    else { S.view='home'; h=homeHtml(); }
    document.body.classList.toggle('libReading', V==='library' && !!S.libBook && S.libStep!=null);
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
  n.innerHTML=[['home','🏠','Home'],['plan','🎯','Plan'],['grow','📚','Learn'],['teams','👥','Teams'],['me','🙂','Me']].map(function(x){
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
      '<label class="f" for="liUser">'+esc(t('Username'))+'</label><div class="atRow"><span>@</span><input type="text" id="liUser" autocomplete="username" autocapitalize="none" maxlength="20"></div>'+
      '<label class="f" for="liPass">'+esc(t('Password'))+'</label><input type="password" id="liPass" autocomplete="current-password" maxlength="128">'+
      '<button class="btn" id="liGo"'+(S.busy?' disabled':'')+'>'+esc(S.busy?t('Signing in…'):t('Sign in'))+'</button>'+
      '<button class="btn ghost" id="liNew" style="margin-top:8px">'+esc(t('New here? Make an account'))+'</button>'+
      (S.authCfg && S.authCfg.google ? '<div class="orLine"><span>'+esc(t('or'))+'</span></div><button class="btn gBtn" id="googleBtn"'+(S.busy?' disabled':'')+'><span class="gG">G</span>'+esc(t('Continue with Google'))+'</button>' : '')+
      '<p class="hint" style="text-align:center;margin-top:10px">'+esc(t('Forgot your password? Ask your team leader to contact the GonPreah admin.'))+'</p>'+
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
      (S.google ? '' : '<label class="f" for="suPass">'+esc(t('Password'))+'</label><input type="password" id="suPass" autocomplete="new-password" maxlength="128" value="'+esc(F.password||'')+'">'+
        '<div class="hint">'+esc(t('At least 8 characters. Write it down somewhere safe — there’s no email to reset it.'))+'</div>'+
        '<label class="f" for="suPass2">'+esc(t('The password again'))+'</label><input type="password" id="suPass2" autocomplete="new-password" maxlength="128" value="'+esc(F.password2||'')+'">')+
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
  var keep=function(){ var F=S.signup; F.username=u.value.trim().toLowerCase(); F.name=document.getElementById('suName').value; F.birthYear=document.getElementById('suYear').value; F.code=document.getElementById('suCode').value;
    if(document.getElementById('suPass')){ F.password=document.getElementById('suPass').value; F.password2=document.getElementById('suPass2').value; } };
  u.oninput=function(){ keep(); S.signup.free=null; var hint=document.getElementById('suUserHint'); hint.textContent=t('3–20 letters, numbers, _ or .');
    clearTimeout(suTimer); suTimer=setTimeout(function(){ if(!S.signup) return; var v=S.signup.username; if(v.length<3) return;
      api('checkUsername',[v]).then(function(d){ if(!S.signup || S.signup.username!==v || !document.getElementById('suUserHint')) return; S.signup.free=!!(d && d.free); hint.textContent = d && d.err==='bad' ? t('3–20 letters, numbers, _ or .') : (d && d.free ? t('✓ Free') : t('That username is taken.')); }); }, 350); };
  ['suName','suYear','suCode','suPass','suPass2'].filter(function(id){ return document.getElementById(id); }).forEach(function(id){ document.getElementById(id).oninput=keep; document.getElementById(id).onchange=keep; });
  document.getElementById('suCancel').onclick=function(){ S.signup=null; S.google=null; S.view='signin'; render(); };
  document.getElementById('suGo').onclick=function(){
    keep(); clearTimeout(suTimer); var F=S.signup;
    if(!F.birthYear){ showMsg(t('Please choose the year you were born.')); return; }
    if(!S.google){ if((F.password||'').length<8){ showMsg(t('Use at least 8 characters for your password.')); return; } if(F.password!==F.password2){ showMsg(t('The two passwords aren’t the same.')); return; } }
    S.busy=true; render();
    var info={ username:F.username, name:F.name, birthYear:Number(F.birthYear), code:F.code, lang:LANG };
    if(!S.google) info.password=F.password;
    (S.google ? api('register',[S.google, info]) : api('registerPassword',[info])).then(function(d){
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
      focusResume_();
      if(JOIN){ var c=JOIN; JOIN=''; lsDel('gpa-join'); call('joinTeam', c).then(function(j){ if(j && j.ok){ showMsg(j.already ? gpT('You’re already in {team}.',{team:j.team.name}) : gpT('You joined {team}!',{team:j.team.name})); refresh_(); } else failMsg(j); }); }
    } else if(d && d.err!=='auth' && !S.me){ showMsg(t('No connection — try again.')); }
    render();
  });
}
/* A fresh copy from the server. It doesn't redraw under someone who is typing — that
   would wipe what they've typed; the next redraw shows it. */
function typing_(){ var e=document.activeElement; return !!(e && /^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName) && e.type!=='checkbox' && e.closest && e.closest('#main')); }
function focusResume_(){ var f=focusState_(); if(!f) return; if(!f.pausedAt && focusLeft_(f)<=0) focusFinish_(f.dur, f.label); else focusEnsureTimer_(); }
function refresh_(){ return call('boot').then(function(d){ if(d && d.ok){ adopt_(d); if(!typing_()) render(); } }); }

/* ---------------- Home ---------------- */
function homeHtml(){
  var me=S.me, st=me.stats||{}, hour=new Date().getHours();
  var hello = hour<12 ? 'Good morning' : hour<18 ? 'Good afternoon' : 'Good evening';
  var h='<div class="heroCard">'+
    '<div class="heroTop">'+faceHtml(me,56)+'<div style="flex:1"><div class="heroHi">'+esc(t(hello))+'</div><div class="heroName">'+esc(firstName_(me.name))+'</div></div><button class="heroShare" id="goShare" aria-label="'+esc(t('Share my week'))+'">📤</button></div>'+
    '<div class="heroStats">'+
      '<div><b>'+(st.streak||0)+'</b><span>🔥 '+esc(t('day streak'))+'</span></div>'+
      '<div><b>'+(st.week==null?'—':st.week+'%')+'</b><span>🗒️ '+esc(t('this week'))+'</span></div>'+
      '<div><b>'+focusShort_((dayOf_(todayStr()).focus)||0)+'</b><span>⏱ '+esc(t('focus today'))+'</span></div>'+
    '</div></div>';
  (me.invites||[]).forEach(function(iv){
    h+='<div class="card inviteCard"><div><b>'+esc(iv.emoji||'✦')+' '+esc(iv.name)+'</b><div class="pmeta">'+esc(gpT('{name} asked you to join',{name:iv.from}))+'</div></div>'+
      '<div class="btnRow" style="margin-top:10px"><button class="btn small" data-invite="'+esc(iv.team)+'|1">'+esc(t('Join'))+'</button><button class="btn small ghost" data-invite="'+esc(iv.team)+'|0">'+esc(t('No thanks'))+'</button></div></div>';
  });
  h+=whyLineHtml()+recapCardHtml()+cheersHtml()+todayCardHtml()+myChallengesHtml()+habitsCardHtml()+checkinCardHtml()+coachHomeHtml()+planHomeHtml()+weekCardHtml();
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
  h+=feedHtml();
  if((S.teams||[]).length) h+='<h3>👥 '+esc(t('Your teams'))+'</h3>';
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
  h+=challengesHtml(T);
  h+=teamTasksHtml(T);
  h+=teamMixHtml(T.people);
  h+='<h3>'+esc(t('People'))+'</h3><div class="card list">';
  T.people.slice().sort(function(a,b){ return (b.leader-a.leader) || String(a.name).localeCompare(String(b.name)); }).forEach(function(p){ h+=personRowHtml(p); });
  h+='</div><button class="linkbtn" id="leaveTeam" style="color:var(--bad)">'+esc(t('Leave this team'))+'</button>';
  if(!T.leader) h+='<button class="linkbtn" id="reportTeam">🚩 '+esc(t('Report this team'))+'</button>';
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
  if(p.focusWeek) tiles+='<div><b>'+focusShort_(p.focusWeek)+'</b><span>⏱ '+esc(t('focus this week'))+'</span></div>';
  if(p.plan){ if(p.plan.goals) tiles+='<div><b>'+p.plan.goals+'</b><span>🎯 '+esc(t('life goals'))+'</span></div>';
    if(p.plan.steps) tiles+='<div><b>'+p.plan.steps+'</b><span>🪜 '+esc(t('steps this month'))+'</span></div>';
    if(p.plan.reached) tiles+='<div><b>'+p.plan.reached+'</b><span>🏆 '+esc(t('goals reached'))+'</span></div>'; }
  if(tiles) h+='<div class="card statTiles">'+tiles+'</div>';
  if(p.type && GP_PTYPES[p.type]){ var g=gpPGroupOf(p.type);
    h+='<h3>🧭 '+esc(t('Personality'))+'</h3><button class="card pEntry" id="seePType"><span class="pEntryArt">'+gpPAvatar(p.type,p.sex||'',64)+'</span><span style="flex:1"><div class="pCode" style="color:'+g.ink+'">'+esc(p.type)+'</div><div style="font-size:16px;font-weight:800">'+esc(pTheName(p.type))+'</div><div class="pmeta">'+esc(gpT('How to work well with {name}',{name:firstName_(p.name)}))+'</div></span><span class="chev">›</span></button>'; }
  if(p.strengths && p.strengths.length) h+='<h3>💪 '+esc(t('Strengths'))+'</h3><button class="card pEntry" id="seeGs" style="align-items:flex-start"><span style="flex:1"><div class="sChips">'+p.strengths.map(function(id,i){ return gsChipHtml(id,i+1); }).join('')+'</div></span><span class="chev">›</span></button>';
  if((p.sharedTeams||[]).length) h+='<p class="hint">'+esc(t('In your teams:'))+' '+esc(p.sharedTeams.map(function(x){ return x.emoji+' '+x.name; }).join(', '))+'</p>';
  if(S.team && S.team.leader && !p.leader && p.id!==S.me.id && (S.team.people||[]).some(function(x){ return x.id===p.id; })){
    h+='<div class="card"><div class="pmeta" style="margin-bottom:8px">'+esc(gpT('You lead {team}',{team:S.team.name}))+'</div><div class="btnRow">'+
      (!p.minor?'<button class="btn small ghost" id="makeLeader">'+esc(t('Make a leader'))+'</button>':'')+
      (p.hasPhoto?'<button class="btn small ghost" id="removePhoto">'+esc(t('Remove their photo'))+'</button>':'')+
      '<button class="btn small ghost" id="removeMember" style="color:var(--bad);border-color:var(--bad)">'+esc(t('Remove from team'))+'</button></div></div>';
  }
  if(p.id!==S.me.id) h+=coachAskHtml_(p);
  if(p.id!==S.me.id) h+='<div class="safeRow"><button class="linkbtn" id="reportPerson">🚩 '+esc(t('Report'))+'</button><button class="linkbtn" id="blockPerson">🚫 '+esc(t('Block'))+'</button></div>';
  if(!p.minor && p.id!==S.me.id){
    var mine=(S.teams||[]).filter(function(tm){ return tm.leader && !(p.sharedTeams||[]).some(function(x){ return x.id===tm.id; }); });
    if(mine.length) h+='<div class="card"><label class="f">'+esc(t('Ask them to join a team you lead'))+'</label>'+mine.map(function(tm){ return '<button class="btn small ghost" data-inviteto="'+esc(tm.id)+'" style="margin:4px 6px 0 0">'+esc(tm.emoji+' '+tm.name)+'</button>'; }).join('')+'</div>';
  }
  return h;
}
/* On someone's card: ask a leader to be my coach, or offer to coach someone in a team I lead. */
function coachAskHtml_(p){
  if((S.coach||[]).some(function(c){ return c.status!=='ended' && c.role!=='leader' && c.other.id===p.id; })) return '';
  var sh=p.sharedTeams||[], ask=null, offer=null;
  sh.forEach(function(x){ if(!ask && x.theyLead && !p.minor && (!S.me.minor || x.leaders>1)) ask=x; if(!offer && x.iLead && !S.me.minor && (!p.minor || x.leaders>1)) offer=x; });
  if(!ask && !offer) return '';
  var h='<div class="card"><label class="f">🤝 '+esc(t('1-on-1s'))+'</label>';
  if(ask) h+='<button class="btn small ghost" data-coachask="'+esc(ask.id)+'|mentee" style="margin:4px 6px 0 0">'+esc(gpT('Ask {name} to be my coach',{name:firstName_(p.name)}))+'</button>';
  if(offer) h+='<button class="btn small ghost" data-coachask="'+esc(offer.id)+'|coach" style="margin:4px 6px 0 0">'+esc(gpT('Offer to coach {name}',{name:firstName_(p.name)}))+'</button>';
  return h+'<div class="hint">'+esc(t('They’ll be asked first. A coach meets with you to talk about how you’re doing and what’s next.'))+'</div></div>';
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
  [['type','Your personality type'],['strengths','Your top 5 strengths'],['streak','Your streak'],['week','This week’s %'],['plan','How many life goals and steps (never the words)'],['focus','My focus time this week (never what I worked on)'],['feed','My moments in my teams’ feed (👏)'],['teams','How many teams you’re in']].forEach(function(x){
    h+='<label class="switchRow"><span>'+esc(t(x[1]))+'</span><input type="checkbox" data-share="'+x[0]+'"'+(sh[x[0]]!==false?' checked':'')+'></label>';
  });
  h+=(me.minor?'<div class="hint">🔒 '+esc(t('You’re under 18, so only people in your teams can see you, by your first name.'))+'</div>':'')+'</div>';

  h+='<h3>🙂 '+esc(t('Profile'))+'</h3><div class="card">'+
    '<label class="f" for="pfName">'+esc(t('Your name'))+'</label><input type="text" id="pfName" maxlength="60" value="'+esc(me.name)+'">'+
    (!me.minor?'<label class="f" for="pfBio">'+esc(t('A line about you'))+'</label><input type="text" id="pfBio" maxlength="160" value="'+esc(me.bio||'')+'">':'')+
    '<label class="f">'+esc(t('Language'))+'</label><div class="seg"><button data-lang="km" class="'+(LANG==='km'?'on':'')+'">ខ្មែរ</button><button data-lang="en" class="'+(LANG==='en'?'on':'')+'">English</button></div>'+
    '<label class="f">'+esc(t('Appearance'))+'</label><div class="seg">'+[['auto','Auto'],['light','Light'],['dark','Dark']].map(function(x){ var cur=lsGet('gpa-theme')||'auto'; return '<button data-theme="'+x[0]+'" class="'+(cur===x[0]?'on':'')+'">'+esc(t(x[1]))+'</button>'; }).join('')+'</div>'+
    '<button class="btn" id="pfSave">'+esc(t('Save'))+'</button></div>'+
    passwordCardHtml_()+
    remindersCardHtml_()+
    (me.blocked?'<button class="linkbtn" id="goBlocked">🚫 '+esc(gpT('People you’ve blocked ({n})',{n:me.blocked}))+'</button>':'')+
    '<button class="linkbtn" id="signOut">'+esc(t('Sign out'))+'</button>';
  if(me.admin) h=entryCardHtml('goAdmin','🛡️',t('Reports'),t('You’re the admin: see what people reported, and act on it.'))+h;
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

/* ---------------- the life plan ---------------- */
/* Six areas of life (the 1-on-1s will use the same six). */
var AREAS = [['faith','🙏','Faith'],['family','🏠','Family & friends'],['study','🎓','Study & work'],['health','💪','Health'],['money','💵','Money'],['serve','🤝','Serving others']];
var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var MAX_LIFE_GOALS = 8;
function areaOf(id){ var a=AREAS.filter(function(x){ return x[0]===id; })[0]||AREAS[0]; return { id:a[0], icon:a[1], name:t(a[2]) }; }
function monthKey(iso){ return iso.slice(0,7); }
function quarterKey(iso){ return iso.slice(0,4)+'-Q'+(Math.floor((Number(iso.slice(5,7))-1)/3)+1); }
function monthLabel(ym){ return t(MONTHS[Number(ym.slice(5,7))-1])+' '+ym.slice(0,4); }
function quarterLabel(q){ var n=Number(q.slice(-1)), y=q.slice(0,4); return t(MONTHS[(n-1)*3])+'–'+t(MONTHS[(n-1)*3+2])+' '+y; }
function addMonths(ym, n){ var y=Number(ym.slice(0,4)), m=Number(ym.slice(5,7))-1+n; y+=Math.floor(m/12); m=((m%12)+12)%12; return y+'-'+(m<9?'0':'')+(m+1); }
function dayLabel(iso){ return Number(iso.slice(8,10))+' '+t(MONTHS[Number(iso.slice(5,7))-1]); }
function planOf(){ var p=(S.me && S.me.plan)||{}; return { why:p.why||'', goals:p.goals||[] }; }
function goalById(id){ return planOf().goals.filter(function(g){ return g.id===id; })[0]||null; }
/* Steps due now: this month's, and this quarter's. */
function isNow_(when){ var d=todayStr(); return when===monthKey(d) || when===quarterKey(d); }
function isPast_(when){ var d=todayStr(); return /Q/.test(when) ? when<quarterKey(d) : when<monthKey(d); }
function goalPct(g){ var s=g.steps||[]; if(g.done) return 100; if(!s.length) return 0; return Math.round(s.filter(function(x){ return x.done; }).length/s.length*100); }
function checkHtml(attr, on, label){ return '<button class="tick'+(on?' on':'')+'" '+attr+' role="checkbox" aria-checked="'+on+'" aria-label="'+esc(label)+'">'+(on?'✓':'')+'</button>'; }

function planHtml(){
  var P=planOf(), active=P.goals.filter(function(g){ return !g.done; }), reached=P.goals.filter(function(g){ return g.done; });
  var h='<h2>'+esc(t('My life plan'))+'</h2><p class="sub">'+esc(t('Small steps toward the person God made you to be.'))+' <span class="lockNote">🔒 '+esc(t('Only you see your plan.'))+'</span></p>';
  h+='<h3>✦ '+esc(t('My why'))+'</h3><div class="card">';
  if(S.whyEdit) h+='<textarea id="whyIn" maxlength="300" rows="3" placeholder="'+esc(t('e.g. To care for people the way Jesus did.'))+'">'+esc(P.why)+'</textarea>'+
    '<div class="btnRow" style="margin-top:8px"><button class="btn small" id="whySave">'+esc(t('Save'))+'</button><button class="btn small ghost" id="whyCancel">'+esc(t('Cancel'))+'</button></div>';
  else if(P.why) h+='<p class="whyText">“'+esc(P.why)+'”</p><button class="linkbtn" id="whyEdit">'+esc(t('Change'))+'</button>';
  else h+='<p class="sub" style="margin:0 0 6px">'+esc(t('What do you think God made you for? Write a sentence or two — you can change it any time.'))+'</p><button class="btn ghost" id="whyEdit">'+esc(t('Write my why'))+'</button>';
  h+='</div>';
  h+='<h3>🎯 '+esc(t('Life goals'))+'</h3>';
  if(!active.length) h+='<div class="card"><p class="sub" style="margin:0">'+esc(t('A life goal is something big you want to reach in the next months or years. Make it clear, something you can measure, and give it a date.'))+'</p></div>';
  active.forEach(function(g){ h+=goalRowHtml(g); });
  if(active.length<MAX_LIFE_GOALS) h+='<button class="btn ghost" id="newGoal">＋ '+esc(t('New life goal'))+'</button>';
  if(reached.length){
    h+='<button class="linkbtn" id="toggleReached">'+esc(gpT('🏆 Goals you reached ({n})',{n:reached.length}))+' '+(S.showReached?'▴':'▾')+'</button>';
    if(S.showReached) reached.forEach(function(g){ h+=goalRowHtml(g); });
  }
  h+=tasksCardHtml();
  h+=coachSectionHtml();
  return h;
}
function goalRowHtml(g){
  var a=areaOf(g.area), pct=goalPct(g), now=(g.steps||[]).filter(function(s){ return isNow_(s.when) && !s.done; }).length;
  var meta=g.done ? gpT('Reached {d}',{d:dayLabel(g.done)}) : gpT('By {m}',{m:monthLabel(g.by)})+(now?' · '+gpT('{n} steps for now',{n:now}):'');
  return '<button class="card goalRow'+(g.done?' reached':'')+'" data-goal="'+esc(g.id)+'"><span class="goalIc">'+(g.done?'🏆':a.icon)+'</span><span style="flex:1;min-width:0;text-align:left">'+
    '<b>'+esc(g.title)+'</b><div class="pmeta">'+esc(a.name)+' · '+esc(meta)+'</div>'+
    '<div class="miniTrack"><div style="width:'+pct+'%"></div></div></span><span class="chev">›</span></button>';
}
function goalHtml(){
  var g=goalById(S.goalId);
  if(!g) return backBtn(t('My life plan'))+'<p class="sub">'+esc(t('That goal isn’t here any more.'))+'</p>';
  var a=areaOf(g.area), d=todayStr();
  var h=backBtn(t('My life plan'))+'<div class="goalHero"><span class="goalIc big">'+(g.done?'🏆':a.icon)+'</span><div class="pmeta">'+esc(a.name)+'</div><h2 style="margin:4px 0">'+esc(g.title)+'</h2>'+
    '<div class="pmeta">'+esc(g.done?gpT('Reached {d}',{d:dayLabel(g.done)}):gpT('By {m}',{m:monthLabel(g.by)}))+'</div>'+
    '<div class="miniTrack big"><div style="width:'+goalPct(g)+'%"></div></div></div>';
  var rows=[['📏',t('How I’ll know I’ve done it'),g.measure],['🤝',t('What will help me'),g.help],['❤️',t('Why it matters to me'),g.why]].filter(function(r){ return r[2]; });
  if(rows.length) h+='<div class="card">'+rows.map(function(r){ return '<div class="smartRow"><span>'+r[0]+'</span><div><div class="pmeta">'+esc(r[1])+'</div>'+esc(r[2])+'</div></div>'; }).join('')+'</div>';
  /* steps: by quarter, then each month in it */
  var steps=g.steps||[], qs={};
  qs[quarterKey(d)]=1;
  steps.forEach(function(s){ qs[/Q/.test(s.when)?s.when:quarterKey(s.when+'-01')]=1; });
  h+='<h3>🪜 '+esc(t('Steps'))+'</h3>';
  if(!steps.length) h+='<p class="sub">'+esc(t('Break your goal into steps: a few bigger ones for each quarter (three months), and small ones for each month.'))+'</p>';
  Object.keys(qs).sort().forEach(function(q){
    var inQ=steps.filter(function(s){ return s.when===q; }), months={};
    steps.forEach(function(s){ if(!/Q/.test(s.when) && quarterKey(s.when+'-01')===q) months[s.when]=1; });
    if(q===quarterKey(d)) months[monthKey(d)]=1;
    var nowQ=q===quarterKey(d), pastQ=q<quarterKey(d);
    h+='<div class="card qCard'+(nowQ?' now':'')+(pastQ?' past':'')+'"><div class="qHead"><b>'+esc(quarterLabel(q))+'</b>'+(nowQ?'<span class="nowTag">'+esc(t('Now'))+'</span>':'')+'</div>';
    inQ.forEach(function(s){ h+=stepRowHtml(g,s); });
    Object.keys(months).sort().forEach(function(m){
      var inM=steps.filter(function(s){ return s.when===m; });
      h+='<div class="mHead">'+esc(monthLabel(m))+(m===monthKey(d)?' · '+esc(t('this month')):'')+'</div>';
      if(!inM.length) h+='<div class="pmeta" style="padding:2px 0 4px">'+esc(t('No steps yet this month.'))+'</div>';
      inM.forEach(function(s){ h+=stepRowHtml(g,s); });
    });
    h+='</div>';
  });
  if(!g.done){
    var opts='<optgroup label="'+esc(t('A month'))+'">', cur=monthKey(d), last=g.by>cur?g.by:cur;
    for(var i=0;i<24;i++){ var m=addMonths(cur,i); if(m>last && i>2) break; opts+='<option value="'+m+'"'+(i===0?' selected':'')+'>'+esc(monthLabel(m))+'</option>'; }
    opts+='</optgroup><optgroup label="'+esc(t('A quarter (three months)'))+'">';
    for(var j=0;j<8;j++){ var q=quarterKey(addMonths(cur,j*3)+'-01'); if(q>quarterKey(last+'-01') && j>1) break; opts+='<option value="'+q+'">'+esc(quarterLabel(q))+'</option>'; }
    opts+='</optgroup>';
    h+='<div class="card"><label class="f" for="stepIn">'+esc(t('Add a step'))+'</label><input type="text" id="stepIn" maxlength="100" placeholder="'+esc(t('e.g. Make a study timetable'))+'">'+
      '<div class="atRow" style="margin-top:8px"><select id="stepWhen" aria-label="'+esc(t('When'))+'">'+opts+'</select><button class="btn small" id="stepAdd">'+esc(t('Add'))+'</button></div></div>';
  }
  h+='<div class="btnRow">'+(g.done?'<button class="btn ghost" id="goalUnreach">'+esc(t('Not reached yet'))+'</button>':'<button class="btn" id="goalReach">🎉 '+esc(t('I reached this goal'))+'</button>')+
    '<button class="btn ghost" id="goalEdit">'+esc(t('Edit'))+'</button></div>';
  return h;
}
function stepRowHtml(g, s){
  var late=!s.done && isPast_(s.when);
  return '<div class="stepRow'+(s.done?' done':'')+'">'+checkHtml('data-step="'+esc(g.id)+'|'+esc(s.id)+'"', !!s.done, s.text)+
    '<span class="stepTx">'+esc(s.text)+(late?' <span class="lateTag">'+esc(t('from before'))+'</span>':'')+'</span>'+
    '<button class="xBtn" data-dropstep="'+esc(g.id)+'|'+esc(s.id)+'" aria-label="'+esc(t('Delete'))+'">×</button></div>';
}
function goalEditHtml(){
  var F=S.goalDraft, d=todayStr();
  var h=backBtn(t('Back'))+'<h2>'+esc(F.id?t('Edit the goal'):t('New life goal'))+'</h2><p class="sub">'+esc(t('A good goal is SMART: Specific, Measurable, Achievable, Relevant and Time-bound.'))+'</p><div class="card">'+
    '<label class="f">'+esc(t('Which part of life?'))+'</label><div class="catChips">'+AREAS.map(function(a){ return '<button class="catChip'+(F.area===a[0]?' on':'')+'" data-garea="'+a[0]+'">'+a[1]+' '+esc(t(a[2]))+'</button>'; }).join('')+'</div>'+
    smartField_('gTitle','S',t('What exactly do you want to do?'),t('e.g. Finish grade 12 with good marks'),F.title,100)+
    smartField_('gMeasure','M',t('How will you know you’ve done it?'),t('e.g. I pass the exam with a B or better'),F.measure,160)+
    smartField_('gHelp','A',t('What or who will help you get there?'),t('e.g. A study group, my teacher, two hours a day'),F.help,160)+
    smartField_('gWhy','R',t('Why does it matter to you?'),t('e.g. So I can study nursing and care for people'),F.why,200)+
    '<label class="f" for="gBy"><span class="smartL">T</span> '+esc(t('By when?'))+'</label><input type="month" id="gBy" min="'+(F.id?'':monthKey(d))+'" value="'+esc(F.by)+'">'+
    '<button class="btn" id="goalSave">'+esc(t('Save'))+'</button>'+
    (F.id?'<button class="linkbtn" id="goalDelete" style="color:var(--bad)">'+esc(t('Delete this goal'))+'</button>':'')+'</div>';
  return h;
}
function smartField_(id, L, label, ph, v, max){
  return '<label class="f" for="'+id+'"><span class="smartL">'+L+'</span> '+esc(label)+'</label><input type="text" id="'+id+'" maxlength="'+max+'" placeholder="'+esc(ph)+'" value="'+esc(v||'')+'">';
}
function keepGoal_(){ var F=S.goalDraft; if(!F || !$('gTitle')) return; F.title=$('gTitle').value; F.measure=$('gMeasure').value; F.help=$('gHelp').value; F.why=$('gWhy').value; F.by=$('gBy').value; }
/* Tasks: what your teams asked of you, then your own. */
function tasksCardHtml(){
  var mine=(S.me.tasks||[]), open=mine.filter(function(k){ return !k.done; }), done=mine.filter(function(k){ return k.done; }), tt=S.teamTasks||[], d=todayStr();
  var h='<h3>✅ '+esc(t('Tasks'))+'</h3><div class="card">';
  tt.forEach(function(k){
    h+='<div class="stepRow">'+checkHtml('data-ttick="'+esc(k.team)+'|'+esc(k.id)+'"', false, k.text)+'<span class="stepTx">'+esc(k.text)+
      '<div class="pmeta">'+esc(k.emoji+' '+k.teamName)+(k.due?' · '+esc(dueLabel_(k.due)):'')+'</div></span></div>';
  });
  open.sort(function(a,b){ return (a.due||'9')<(b.due||'9')?-1:1; }).forEach(function(k){
    h+='<div class="stepRow">'+checkHtml('data-task="'+esc(k.id)+'"', false, k.text)+'<span class="stepTx">'+esc(k.text)+(k.due?'<div class="pmeta'+(k.due<d?' late':'')+'">'+esc(dueLabel_(k.due))+'</div>':'')+'</span>'+
      '<button class="xBtn" data-droptask="'+esc(k.id)+'" aria-label="'+esc(t('Delete'))+'">×</button></div>';
  });
  if(!tt.length && !open.length) h+='<p class="sub" style="margin:0 0 6px">'+esc(t('Nothing to do yet. Add something below.'))+'</p>';
  h+='<div class="atRow" style="margin-top:8px"><input type="text" id="taskIn" maxlength="120" placeholder="'+esc(t('Add a task'))+'"><input type="date" id="taskDue" aria-label="'+esc(t('Due'))+'" min="'+d+'"><button class="btn small" id="taskAdd">'+esc(t('Add'))+'</button></div>';
  if(done.length){
    h+='<button class="linkbtn" id="toggleDone">'+esc(gpT('Done ({n})',{n:done.length}))+' '+(S.showDone?'▴':'▾')+'</button>';
    if(S.showDone) done.forEach(function(k){ h+='<div class="stepRow done">'+checkHtml('data-task="'+esc(k.id)+'"', true, k.text)+'<span class="stepTx">'+esc(k.text)+'</span><button class="xBtn" data-droptask="'+esc(k.id)+'" aria-label="'+esc(t('Delete'))+'">×</button></div>'; });
  }
  return h+'</div>';
}
function dueLabel_(iso){ var d=todayStr(); if(iso===d) return t('Today'); if(iso===addDays(d,1)) return t('Tomorrow'); return (iso<d?t('Was due')+' ':t('Due')+' ')+dayLabel(iso); }
/* Home: this month's and this quarter's steps, and what your teams asked of you. */
function planHomeHtml(){
  var P=planOf(), active=P.goals.filter(function(g){ return !g.done; });
  if(!active.length) return '<h3>🎯 '+esc(t('My life plan'))+'</h3>'+entryCardHtml('goPlan','🎯',t('Make your life plan'),t('Your why, a few big goals, and small steps for each month.'));
  var items=[];
  active.forEach(function(g){ (g.steps||[]).forEach(function(s){ if(!s.done && (isNow_(s.when) || isPast_(s.when))) items.push([g,s]); }); });
  var tt=S.teamTasks||[];
  var h='<h3>🎯 '+esc(t('Steps for now'))+'</h3><div class="card">';
  if(!items.length && !tt.length) h+='<p class="sub" style="margin:0 0 4px">'+esc(t('No steps for this month yet.'))+'</p>';
  items.slice(0,5).forEach(function(x){ h+='<div class="stepRow">'+checkHtml('data-step="'+esc(x[0].id)+'|'+esc(x[1].id)+'"', false, x[1].text)+'<span class="stepTx">'+esc(x[1].text)+'<div class="pmeta">'+esc(areaOf(x[0].area).icon+' '+x[0].title)+'</div></span></div>'; });
  tt.slice(0,3).forEach(function(k){ h+='<div class="stepRow">'+checkHtml('data-ttick="'+esc(k.team)+'|'+esc(k.id)+'"', false, k.text)+'<span class="stepTx">'+esc(k.text)+'<div class="pmeta">'+esc(k.emoji+' '+k.teamName)+(k.due?' · '+esc(dueLabel_(k.due)):'')+'</div></span></div>'; });
  return h+'<button class="linkbtn" id="goPlan">'+esc(t('Open my plan'))+' ›</button></div>';
}
/* A team's tasks: leaders set them; everyone in the team sees them all. */
function teamTasksHtml(T){
  var tasks=T.tasks||[], d=todayStr();
  if(!tasks.length && !T.leader) return '';
  var h='<h3>📋 '+esc(t('Team tasks'))+'</h3><div class="card">';
  if(!tasks.length) h+='<p class="sub" style="margin:0 0 6px">'+esc(t('Give the team something to do — for everyone, or for one person.'))+'</p>';
  tasks.forEach(function(k){
    var meta=(k.who?gpT('For {name}',{name:k.whoName||'?'}):t('For everyone'))+(k.of>1?' · '+gpT('{n} of {total} done',{n:k.n,total:k.of}):(k.n?' · '+t('done'):''))+(k.due?' · '+dueLabel_(k.due):'');
    h+='<div class="stepRow'+(k.mine?' done':'')+'">'+(k.forMe?checkHtml('data-tmtick="'+esc(k.id)+'"', k.mine, k.text):'<span class="tick ghost">'+(k.n?'✓':'')+'</span>')+
      '<span class="stepTx">'+esc(k.text)+'<div class="pmeta">'+esc(meta)+'</div></span>'+(T.leader?'<button class="xBtn" data-tmdrop="'+esc(k.id)+'" aria-label="'+esc(t('Delete'))+'">×</button>':'')+'</div>';
  });
  if(T.leader){
    h+='<label class="f" for="tmIn">'+esc(t('New team task'))+'</label><input type="text" id="tmIn" maxlength="120" placeholder="'+esc(t('e.g. Read Mark 5 before Friday'))+'">'+
      '<div class="atRow" style="margin-top:8px"><select id="tmWho" aria-label="'+esc(t('For'))+'"><option value="">'+esc(t('For everyone'))+'</option>'+
      T.people.filter(function(p){ return p.id!==S.me.id; }).map(function(p){ return '<option value="'+esc(p.id)+'">'+esc(gpT('For {name}',{name:p.name}))+'</option>'; }).join('')+'</select>'+
      '<input type="date" id="tmDue" min="'+d+'" aria-label="'+esc(t('Due'))+'"><button class="btn small" id="tmAdd">'+esc(t('Add'))+'</button></div>'+
      '<div class="hint">'+esc(t('Everyone in the team can see every team task.'))+'</div>';
  }
  return h+'</div>';
}

/* ---------------- 1-on-1s with a coach or mentor ---------------- */
/* S.coach: my coachings (from boot). S.coaching: the one open. S.meetId: the 1-on-1 open.
   The server decides who may read or write (api.js, "1-on-1s"); this only draws it. */
var RATES = [[1,'😟','Hard'],[2,'😕','Not great'],[3,'😐','OK'],[4,'🙂','Good'],[5,'😄','Great']];
function coachRoleLine_(c){
  if(c.role==='mentee') return gpT('{name} is your coach',{name:c.other.name});
  if(c.role==='coach') return gpT('You coach {name}',{name:c.other.name});
  return gpT('{coach} coaches {name}',{coach:c.coachName||'?', name:c.other.name});
}
function coachMeta_(c){
  if(c.status==='asked') return c.askedByMe ? t('Waiting for an answer') : (c.role==='mentee' ? t('Offers to be your coach') : t('Asks you to be their coach'));
  if(c.status==='ended') return t('Ended');
  if(!c.live) return t('Paused');
  if(c.next) return gpT('Next 1-on-1: {d}',{d:dueDay_(c.next)});
  return c.last ? gpT('Last 1-on-1: {d}',{d:dayLabel(c.last)}) : t('No 1-on-1s yet');
}
function dueDay_(iso){ var d=todayStr(); return iso===d ? t('Today') : iso===addDays(d,1) ? t('Tomorrow') : dayLabel(iso); }
function coachRowHtml(c){
  var h='<div class="card coachRow"><button class="coachOpen" data-coach="'+esc(c.id)+'"'+(c.status==='asked'?' disabled':'')+'>'+faceHtml(c.other,44)+
    '<span style="flex:1;min-width:0;text-align:left"><b>'+esc(coachRoleLine_(c))+'</b><div class="pmeta">'+esc(coachMeta_(c))+(c.team?' · '+esc(c.team.emoji+' '+c.team.name):'')+'</div>'+
    (c.myFollow?'<div class="pmeta">'+esc(c.myFollow===1?t('1 follow-up for you'):gpT('{n} follow-ups for you',{n:c.myFollow}))+'</div>':'')+'</span>'+(c.status==='asked'?'':'<span class="chev">›</span>')+'</button>';
  if(c.status==='asked' && !c.askedByMe) h+='<div class="btnRow" style="margin-top:10px"><button class="btn small" data-coachyes="'+esc(c.id)+'|1">'+esc(t('Yes'))+'</button><button class="btn small ghost" data-coachyes="'+esc(c.id)+'|0">'+esc(t('No thanks'))+'</button></div>';
  return h+'</div>';
}
function coachSectionHtml(){
  var list=(S.coach||[]).filter(function(c){ return c.status!=='ended'; }), ended=(S.coach||[]).filter(function(c){ return c.status==='ended'; });
  var h='<h3>🤝 '+esc(t('1-on-1s'))+'</h3>';
  if(!list.length) h+='<div class="card"><p class="sub" style="margin:0">'+esc(t('Meet with a coach or mentor — a leader in one of your teams — to talk about how you’re doing and what’s next. Open a leader’s card in your team to ask them.'))+'</p></div>';
  list.forEach(function(c){ h+=coachRowHtml(c); });
  if(ended.length) h+='<button class="linkbtn" id="toggleEnded">'+esc(gpT('Ended ({n})',{n:ended.length}))+' '+(S.showEnded?'▴':'▾')+'</button>'+(S.showEnded?ended.map(coachRowHtml).join(''):'');
  return h;
}
/* Home: answers waiting from me, and the next 1-on-1. */
function coachHomeHtml(){
  var h='', asks=(S.coach||[]).filter(function(c){ return c.status==='asked' && !c.askedByMe; });
  asks.forEach(function(c){ h+=coachRowHtml(c); });
  var soon=(S.coach||[]).filter(function(c){ return c.status==='active' && c.live && c.role!=='leader' && (c.next || c.myFollow); })
    .sort(function(a,b){ return (a.next||'9')<(b.next||'9')?-1:1; }).slice(0,2);
  soon.forEach(function(c){ h+=coachRowHtml(c); });
  return h ? '<h3>🤝 '+esc(t('1-on-1s'))+'</h3>'+h : '';
}
function coachHtml(){
  var C=S.coaching;
  if(!C) return backBtn(t('Back'))+'<p class="sub">'+esc(t('Loading…'))+'</p>';
  var write=(C.role==='coach'||C.role==='mentee') && C.status==='active' && C.live, other=C.other, team=C.team||{ name:'', emoji:'' };
  var h=backBtn(t('Back'))+'<div class="personHero">'+faceHtml(other,72)+'<h2 style="margin-top:8px">'+esc(coachRoleLine_(C))+'</h2><div class="pmeta">'+esc(team.emoji+' '+team.name)+'</div></div>';
  if(C.minor){
    var msg = C.role==='mentee' ? gpT('Because you’re under 18, the other leaders of {team} can read your 1-on-1s too. That keeps everyone safe.',{team:team.name})
      : C.role==='coach' ? gpT('{name} is under 18, so the other leaders of {team} can read these 1-on-1s too — not your own notes.',{name:other.name, team:team.name})
      : gpT('You can read this because {name} is under 18 and you lead {team}. Only the two of them can write here.',{name:other.name, team:team.name});
    h+='<div class="banner">🔒 '+esc(msg)+'</div>';
  }
  if(C.status==='ended') h+='<div class="banner">'+esc(t('This coaching has ended. You can still read it.'))+'</div>';
  else if(!C.live) h+='<div class="banner">'+esc(t('This coaching is paused: your coach no longer leads the team, or one of you left it.'))+'</div>';
  if(write){
    h+='<div class="card"><label class="f" for="coachNext">'+esc(t('Next 1-on-1'))+'</label><input type="date" id="coachNext" min="'+todayStr()+'" value="'+esc(C.next||'')+'">';
    if(C.role==='mentee') h+='<label class="switchRow"><span>'+esc(t('Let my coach see my life plan'))+'</span><input type="checkbox" id="coachSharePlan"'+(C.sharePlan?' checked':'')+'></label>';
    h+='</div>';
  }
  if(C.plan) h+=menteePlanHtml_(C);
  h+=checkinTrendHtml_(C);
  /* follow-ups still open, from every 1-on-1 */
  var open=[]; (C.meetings||[]).forEach(function(m){ (m.follow||[]).forEach(function(f){ if(!f.done) open.push([m,f]); }); });
  if(open.length){
    h+='<h3>➡️ '+esc(t('Follow-ups'))+'</h3><div class="card">';
    open.forEach(function(x){ h+=followRowHtml_(C, x[0], x[1], write); });
    h+='</div>';
  }
  h+='<h3>🗓️ '+esc(t('1-on-1s'))+'</h3>';
  if(write) h+='<button class="btn" id="meetNew">＋ '+esc(t('Start a 1-on-1'))+'</button>';
  if(!(C.meetings||[]).length) h+='<p class="sub">'+esc(t('No 1-on-1s yet. Start one when you meet — or before, to fill in the check-in.'))+'</p>';
  else h+='<div class="card list">'+C.meetings.map(function(m){ var avg=checkinAvg_(m.checkin);
    return '<button class="personRow" data-meet="'+esc(m.id)+'"><span class="meetDay"><b>'+Number(m.date.slice(8,10))+'</b>'+esc(t(MONTHS[Number(m.date.slice(5,7))-1]))+'</span><span style="flex:1;min-width:0;text-align:left"><b>'+esc(dayLabel(m.date)+' '+m.date.slice(0,4))+'</b>'+
      '<div class="pmeta">'+(avg?esc(gpT('Check-in {n}/5',{n:avg})):esc(t('No check-in')))+((m.follow||[]).length?' · '+esc(m.follow.length===1?t('1 follow-up'):gpT('{n} follow-ups',{n:m.follow.length})):'')+'</div></span><span class="chev">›</span></button>'; }).join('')+'</div>';
  if(C.status!=='ended' && C.role!=='leader') h+='<button class="linkbtn" id="coachEnd" style="color:var(--bad)">'+esc(t('End this coaching'))+'</button>';
  return h;
}
function checkinAvg_(ci){ var v=AREAS.map(function(a){ return (ci||{})[a[0]]; }).filter(Boolean); if(!v.length) return 0; return Math.round(v.reduce(function(x,y){ return x+y; },0)/v.length*10)/10; }
/* The last check-in, area by area, with how it moved since the one before. */
function checkinTrendHtml_(C){
  var ms=(C.meetings||[]).filter(function(m){ return m.checkin && Object.keys(m.checkin).length; });
  if(!ms.length) return '';
  var last=ms[0].checkin, prev=ms[1] ? ms[1].checkin : {};
  var h='<h3>📊 '+esc(t('How life is going'))+'</h3><div class="card"><div class="pmeta" style="margin-bottom:6px">'+esc(gpT('Check-in on {d}',{d:dayLabel(ms[0].date)}))+'</div>';
  AREAS.forEach(function(a){ var v=last[a[0]]; if(!v) return; var p=prev[a[0]], arrow=!p?'':v>p?' ↑':v<p?' ↓':'';
    h+='<div class="pBar"><div class="pBarTop"><span>'+a[1]+' '+esc(t(a[2]))+'</span><span><b>'+RATES[v-1][1]+' '+v+'</b>'+(arrow?'<span class="'+(arrow===' ↑'?'up':'down')+'">'+arrow+'</span>':'')+'</span></div><div class="pTrack"><div class="pFill" style="left:0;width:'+(v*20)+'%;background:var(--accent)"></div></div></div>'; });
  return h+'</div>';
}
function menteePlanHtml_(C){
  var P=C.plan, goals=(P.goals||[]).filter(function(g){ return !g.done; });
  var h='<h3>🎯 '+esc(gpT('{name}’s life plan',{name:firstName_(C.other.name)}))+'</h3><div class="card">'+(P.why?'<p class="whyText">“'+esc(P.why)+'”</p>':'');
  if(!goals.length) h+='<p class="sub" style="margin:0">'+esc(t('No life goals yet.'))+'</p>';
  goals.forEach(function(g){ var now=(g.steps||[]).filter(function(s){ return isNow_(s.when); });
    h+='<div class="smartRow"><span>'+areaOf(g.area).icon+'</span><div style="flex:1"><b>'+esc(g.title)+'</b><div class="pmeta">'+esc(gpT('By {m}',{m:monthLabel(g.by)}))+'</div><div class="miniTrack"><div style="width:'+goalPct(g)+'%"></div></div>'+
      now.map(function(s){ return '<div class="pmeta">'+(s.done?'✓ ':'○ ')+esc(s.text)+'</div>'; }).join('')+'</div></div>'; });
  return h+'</div>';
}
function followRowHtml_(C, m, f, write){
  var forName = f.who==='coach' ? (C.role==='coach'?t('you'):C.role==='mentee'?C.other.name:(C.coachName||'')) : (C.role==='mentee'?t('you'):C.other.name);
  var mineToTick = write;
  return '<div class="stepRow'+(f.done?' done':'')+'">'+(mineToTick?checkHtml('data-follow="'+esc(m.id)+'|'+esc(f.id)+'"', !!f.done, f.text):'<span class="tick ghost">'+(f.done?'✓':'')+'</span>')+
    '<span class="stepTx">'+esc(f.text)+'<div class="pmeta">'+esc(gpT('For {name}',{name:forName}))+'</div></span>'+
    (write?'<button class="xBtn" data-dropfollow="'+esc(m.id)+'|'+esc(f.id)+'" aria-label="'+esc(t('Delete'))+'">×</button>':'')+'</div>';
}
function meetHtml(){
  var C=S.coaching, m=C && (C.meetings||[]).filter(function(x){ return x.id===S.meetId; })[0];
  if(!m) return backBtn(t('Back'))+'<p class="sub">'+esc(t('That isn’t here any more.'))+'</p>';
  var write=(C.role==='coach'||C.role==='mentee') && C.status==='active' && C.live, D=S.meetDraft||(S.meetDraft={ checkin:Object.assign({}, m.checkin||{}) });
  var ro=write?'':' disabled';
  var h=backBtn(t('Back'))+'<h2>'+esc(gpT('1-on-1 · {d}',{d:dayLabel(m.date)+' '+m.date.slice(0,4)}))+'</h2><p class="sub">'+esc(coachRoleLine_(C))+'</p>';
  if(C.minor) h+='<div class="banner">🔒 '+esc(C.role==='mentee'?gpT('The other leaders of {team} can read this too.',{team:(C.team||{}).name||''}):gpT('Other leaders of {team} can read this too — not your own notes.',{team:(C.team||{}).name||''}))+'</div>';
  h+='<h3>📊 '+esc(t('Check-in'))+'</h3><div class="card"><p class="sub" style="margin:0 0 8px">'+esc(C.role==='mentee'?t('How is each part of your life going right now?'):gpT('How is each part of {name}’s life going right now?',{name:firstName_(C.other.name)}))+'</p>';
  AREAS.forEach(function(a){ var v=D.checkin[a[0]];
    h+='<div class="rateRow"><div class="rateLb">'+a[1]+' '+esc(t(a[2]))+'</div><div class="rateBtns" role="radiogroup" aria-label="'+esc(t(a[2]))+'">'+
      RATES.map(function(r){ return '<button class="rateBtn'+(v===r[0]?' on':'')+'" data-rate="'+a[0]+'|'+r[0]+'" role="radio" aria-checked="'+(v===r[0])+'" aria-label="'+esc(t(r[2]))+'"'+ro+'>'+r[1]+'</button>'; }).join('')+'</div></div>'; });
  h+='</div>';
  var box=function(id, label, val, hint){ var k={mGood:'good',mHard:'hard',mNotes:'notes',mPriv:'priv'}[id]; if(D[k]!==undefined) val=D[k]; return '<label class="f" for="'+id+'">'+esc(label)+'</label><textarea id="'+id+'" rows="3" maxlength="1200"'+ro+'>'+esc(val||'')+'</textarea>'+(hint?'<div class="hint">'+esc(hint)+'</div>':''); };
  h+='<div class="card">'+box('mGood', t('What’s going well?'), m.good)+box('mHard', t('What’s hard right now?'), m.hard)+box('mNotes', t('Notes from our talk'), m.notes)+
    (C.role==='coach'?box('mPriv', t('My own notes'), m.priv, '🔒 '+t('Only you see these.')):'')+
    (write?'<button class="btn" id="meetSave">'+esc(t('Save'))+'</button>':'')+'</div>';
  h+='<h3>➡️ '+esc(t('Follow-ups'))+'</h3><div class="card">';
  if(!(m.follow||[]).length) h+='<p class="sub" style="margin:0 0 6px">'+esc(t('What will each of you do before you meet again?'))+'</p>';
  (m.follow||[]).forEach(function(f){ h+=followRowHtml_(C, m, f, write); });
  if(write){
    var me=C.role, coachWho=me==='coach'?t('Me'):C.other.name, menteeWho=me==='mentee'?t('Me'):C.other.name;
    h+='<input type="text" id="fIn" maxlength="140" placeholder="'+esc(t('e.g. Read Psalm 23 each morning'))+'" style="margin-top:8px">'+
      '<div class="atRow" style="margin-top:8px"><select id="fWho" aria-label="'+esc(t('For'))+'"><option value="mentee">'+esc(gpT('For {name}',{name:menteeWho}))+'</option><option value="coach">'+esc(gpT('For {name}',{name:coachWho}))+'</option></select><button class="btn small" id="fAdd">'+esc(t('Add'))+'</button></div>';
  }
  h+='</div>';
  if(write) h+='<button class="linkbtn" id="meetDelete" style="color:var(--bad)">'+esc(t('Delete this 1-on-1'))+'</button>';
  return h;
}
function openCoach_(id, keep){ if(!keep) S.back.push(S.view); S.coaching=null; S.view='coach'; render(); window.scrollTo(0,0);
  call('coaching', id).then(function(d){ if(d && d.ok){ S.coaching=d.coaching; render(); loadPhotos_([S.coaching.other]); } else { failMsg(d); goBack('plan'); } }); }
function coachAct_(act, a, then){ return call('coachAct', S.coaching.id, act, a||{}).then(function(d){ if(d && d.ok){ S.coaching=d.coaching; if(then) then(d); render(); } else failMsg(d); return d; }); }
function keepMeet_(){ var D=S.meetDraft; if(!D || !$('mGood')) return; D.good=$('mGood').value; D.hard=$('mHard').value; D.notes=$('mNotes').value; if($('mPriv')) D.priv=$('mPriv').value; }

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
  all('[data-tab]', function(b){ S.back=[]; S.view=b.getAttribute('data-tab'); if(S.view!=='me') refresh_(); if(S.view==='teams') feedLoad_(); render(); window.scrollTo(0,0); });
  all('[data-back]', function(){ goBack(); });
  on('googleBtn', function(){ if(!S.busy) signIn_(); });
  on('liNew', function(){ S.google=null; S.signup={ name:'', username:'', birthYear:'', code:JOIN, free:null, password:'', password2:'' }; S.view='signup'; render(); });
  var lp=$('liPass'); if(lp) lp.onkeydown=function(e){ if(e.key==='Enter') $('liGo').click(); };
  on('liGo', function(){ if(S.busy) return; var un=$('liUser').value.trim(), pw=$('liPass').value;
    if(!un || !pw){ showMsg(t('That username or password isn’t right.')); return; }
    S.busy=true; render();
    api('loginPassword',[un, pw]).then(function(d){ S.busy=false; if(d && d.ok){ afterSignIn_(d); return; } failMsg(d); render(); var x=$('liUser'); if(x) x.value=un; }); });
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

  /* today */
  on('goWhy', function(){ S.back=[]; if(!planOf().why) S.whyEdit=true; go('plan', true); });
  on('topEdit', function(){ S.topEdit=true; render(); });
  on('topCancel', function(){ S.topEdit=false; render(); });
  on('topSave', busyOnce_(function(){ var old=dayOf_(todayStr()).top||[];
    var items=[].map.call(document.querySelectorAll('[data-topin]'), function(el){ var i=Number(el.getAttribute('data-topin')), v=el.value.trim(); return { text:v, done:!!(old[i] && old[i].text===v && old[i].done) }; }).filter(function(x){ return x.text; });
    if(!items.length){ showMsg(t('Write something first.')); return; }
    return call('saveTop', todayStr(), items).then(function(d){ if(d && d.ok){ S.me=d.me; S.topEdit=false; render(); } else failMsg(d); }); }));
  all('[data-top]', function(b){ var i=Number(b.getAttribute('data-top')), d=todayStr(), top=(dayOf_(d).top||[]).map(function(x){ return Object.assign({},x); });
    if(!top[i]) return; top[i].done=!top[i].done; gpTap(); if(top[i].done) confettiAt_(b);
    S.me.daily=S.me.daily||{}; S.me.daily[d]=Object.assign({}, dayOf_(d), { top:top }); render();
    call('saveTop', d, top).then(function(r){ if(r && r.ok){ S.me=r.me; render(); } else { failMsg(r); refresh_(); } }); });
  all('[data-mood]', function(b){ S.checkinMood=Number(b.getAttribute('data-mood')); var g=$('gratefulIn'), v=g?g.value:''; gpTap(); render(); var g2=$('gratefulIn'); if(g2) g2.value=v; });
  on('checkEdit', function(){ S.checkinEdit=true; S.checkinMood=dayOf_(todayStr()).mood||0; render(); });
  on('checkSave', busyOnce_(function(){ var m=S.checkinMood||dayOf_(todayStr()).mood; if(!m){ showMsg(t('Choose how today was.')); return; }
    return call('saveCheckin', todayStr(), { mood:m, grateful:$('gratefulIn').value }).then(function(d){ if(d && d.ok){ S.me=d.me; S.checkinEdit=false; S.checkinMood=0; showMsg(t('Saved. Sleep well 🌙')); render(); } else failMsg(d); }); }));
  on('goFocus', function(){ go('focus'); focusEnsureTimer_(); });   // a session that ended while away shows its done screen first
  all('[data-fdur]', function(b){ var l=$('focusLabel'); if(l) S.focusSetup.label=l.value; S.focusSetup.dur=Number(b.getAttribute('data-fdur')); render(); });
  all('[data-flabel]', function(b){ S.focusSetup.label=b.getAttribute('data-flabel'); render(); });
  on('focusStart', function(){ var l=$('focusLabel'); S.focusSetup.label=l?l.value.trim():''; gpTap();
    lsSet(FOCUS_KEY, JSON.stringify({ dur:S.focusSetup.dur, start:Date.now(), label:S.focusSetup.label, paused:0, pausedAt:0 })); render(); focusEnsureTimer_(); });
  on('focusPause', function(){ var f=focusState_(); if(!f) return; if(f.pausedAt){ f.paused+=Date.now()-f.pausedAt; f.pausedAt=0; } else f.pausedAt=Date.now(); lsSet(FOCUS_KEY, JSON.stringify(f)); render(); });
  on('focusStop', function(){ var f=focusState_(); if(!f) return; var min=Math.floor(focusElapsed_(f)/60000);
    if(min<5){ if(!confirm(t('Stop now? Less than 5 minutes doesn’t count.'))) return; lsDel(FOCUS_KEY); clearInterval(focusTimer); focusTimer=null; render(); return; }
    if(!confirm(gpT('Stop and count {n} minutes?',{n:min}))) return; focusFinish_(min, f.label); render(); });
  on('focusTick', busyOnce_(function(){ var dn=S.focusDone, d=todayStr(), top=(dayOf_(d).top||[]).map(function(x){ return Object.assign({},x); });
    if(top[dn.topIndex]) top[dn.topIndex].done=true; return call('saveTop', d, top).then(function(r){ if(r && r.ok){ S.me=r.me; dn.topIndex=-1; showMsg(t('Ticked off. 🎉')); render(); } else failMsg(r); }); }));
  on('focusAgain', function(){ S.focusDone=null; render(); });
  on('focusHome', function(){ S.focusDone=null; S.back=[]; S.view='home'; render(); });

  /* share my week */
  on('goShare', function(){ S.shareImg=null; go('share'); drawShareCard_(function(blob, url){ S.shareImg={ blob:blob, url:url }; if(S.view==='share') render(); }); });
  on('shareGo', function(){ var I=S.shareImg; if(!I) return; var link=location.origin+'/', text=gpT('My week on GonPreah 🔥 Grow with me: {link}',{link:link});
    try { var file=new File([I.blob], 'gonpreah-my-week.png', { type:'image/png' });
      if(navigator.canShare && navigator.canShare({ files:[file] })){ navigator.share({ files:[file], text:text }).catch(function(){}); return; }
      if(navigator.share){ navigator.share({ title:'GonPreah', text:text, url:link }).catch(function(){}); return; } } catch(e){}
    showMsg(t('Save the picture, then post it from your gallery.')); });

  /* challenges */
  all('[data-chtick]', function(b){ var p=b.getAttribute('data-chtick').split('|'), on=p[2]==='1'; gpTap(); if(on) confettiAt_(b);
    call('challenge', p[0], 'tick', { id:p[1], date:todayStr(), done:on }).then(function(d){ if(d && d.ok){ if(S.team && S.team.id===p[0]) S.team=d.team; refresh_(); render(); } else failMsg(d); }); });
  all('[data-chjoin]', function(b){ var p=b.getAttribute('data-chjoin').split('|');
    if(p[1]==='0' && !confirm(t('Leave this challenge? Your days so far will be lost.'))) return;
    call('challenge', S.team.id, 'join', { id:p[0], on:p[1]==='1' }).then(function(d){ if(d && d.ok){ S.team=d.team; refresh_(); render(); } else failMsg(d); }); });
  all('[data-chdrop]', function(b){ if(!confirm(t('End this challenge for everyone?'))) return;
    call('challenge', S.team.id, 'drop', { id:b.getAttribute('data-chdrop') }).then(function(d){ if(d && d.ok){ S.team=d.team; refresh_(); render(); } else failMsg(d); }); });
  on('chNewOpen', function(){ S.chNew={ title:'', emoji:'🏁', days:7, tomorrow:false }; render(); });
  on('chCancel', function(){ S.chNew=null; render(); });
  all('[data-chidea]', function(b){ var p=b.getAttribute('data-chidea').split('|'); S.chNew.emoji=p[0]; S.chNew.title=p.slice(1).join('|'); render(); });
  all('[data-chdays]', function(b){ keepChNew_(); S.chNew.days=Number(b.getAttribute('data-chdays')); render(); });
  all('[data-chstart]', function(b){ keepChNew_(); S.chNew.tomorrow=b.getAttribute('data-chstart')==='1'; render(); });
  on('chGo', busyOnce_(function(){ keepChNew_(); var N=S.chNew; if((N.title||'').trim().length<2){ showMsg(t('Write something first.')); return; }
    return call('challenge', S.team.id, 'add', { title:N.title, emoji:N.emoji, days:N.days, start:N.tomorrow?addDays(todayStr(),1):todayStr() }).then(function(d){ if(d && d.ok){ S.team=d.team; S.chNew=null; showMsg(t('Challenge started! 🏁')); refresh_(); render(); } else failMsg(d); }); }));

  /* the life plan */
  on('goPlan', function(){ S.back=[]; go('plan', true); });
  on('whyEdit', function(){ S.whyEdit=true; render(); var w=$('whyIn'); if(w) w.focus(); });
  on('whyCancel', function(){ S.whyEdit=false; render(); });
  on('whySave', busyOnce_(function(){ return call('savePlanWhy', $('whyIn').value).then(function(d){ if(d && d.ok){ S.me=d.me; S.whyEdit=false; render(); } else failMsg(d); }); }));
  on('newGoal', function(){ S.goalDraft={ area:'', title:'', measure:'', help:'', why:'', by:addMonths(monthKey(todayStr()), 12) }; go('goaledit'); });
  on('toggleReached', function(){ S.showReached=!S.showReached; render(); });
  on('toggleDone', function(){ S.showDone=!S.showDone; render(); });
  all('[data-goal]', function(b){ S.goalId=b.getAttribute('data-goal'); go('goal'); });
  all('[data-garea]', function(b){ keepGoal_(); S.goalDraft.area=b.getAttribute('data-garea'); render(); });
  on('goalSave', busyOnce_(function(){ keepGoal_(); var F=S.goalDraft;
    if(!F.area){ showMsg(t('Choose a part of life.')); return; }
    return call('saveGoal', F).then(function(d){ if(d && d.ok){ S.me=d.me; S.goalDraft=null; S.goalId=d.id;
      if(F.id) goBack('goal'); else { S.back=['plan']; S.view='goal'; render(); window.scrollTo(0,0); } } else failMsg(d); }); }));
  on('goalEdit', function(){ var g=goalById(S.goalId); if(!g) return; S.goalDraft={ id:g.id, area:g.area, title:g.title, measure:g.measure, help:g.help, why:g.why, by:g.by }; go('goaledit'); });
  on('goalDelete', busyOnce_(function(){ if(!confirm(t('Delete this goal and all its steps?'))) return;
    return call('goalAct', S.goalDraft.id, 'delete').then(function(d){ if(d && d.ok){ S.me=d.me; S.goalDraft=null; S.goalId=null; S.back=[]; S.view='plan'; render(); window.scrollTo(0,0); } else failMsg(d); }); }));
  on('goalReach', busyOnce_(function(){ var el=$('goalReach'); return call('goalAct', S.goalId, 'reach', { done:true }).then(function(d){ if(d && d.ok){ confettiAt_(el); S.me=d.me; showMsg(t('Well done! Thank God for it.')); render(); } else failMsg(d); }); }));
  on('goalUnreach', busyOnce_(function(){ return call('goalAct', S.goalId, 'reach', { done:false }).then(function(d){ if(d && d.ok){ S.me=d.me; render(); } else failMsg(d); }); }));
  on('stepAdd', busyOnce_(function(){ var v=$('stepIn').value.trim(); if(!v){ showMsg(t('Write something first.')); return; }
    return call('goalAct', S.goalId, 'addStep', { text:v, when:$('stepWhen').value }).then(function(d){ if(d && d.ok){ S.me=d.me; render(); var i=$('stepIn'); if(i) i.focus(); } else failMsg(d); }); }));
  all('[data-step]', function(b){ var p=b.getAttribute('data-step').split('|'), g=goalById(p[0]), s=g && (g.steps||[]).filter(function(x){ return x.id===p[1]; })[0]; if(!s) return;
    var now=!s.done; s.done=now?todayStr():''; gpTap(); if(now) confettiAt_(b); render();
    call('goalAct', p[0], 'tickStep', { id:p[1], done:now }).then(function(d){ if(d && d.ok){ S.me=d.me; render(); } else { failMsg(d); refresh_(); } }); });
  all('[data-dropstep]', function(b){ var p=b.getAttribute('data-dropstep').split('|'); if(!confirm(t('Delete this step?'))) return;
    call('goalAct', p[0], 'dropStep', { id:p[1] }).then(function(d){ if(d && d.ok){ S.me=d.me; render(); } else failMsg(d); }); });
  on('taskAdd', busyOnce_(function(){ var v=$('taskIn').value.trim(); if(!v){ showMsg(t('Write something first.')); return; }
    return call('myTask', 'add', { text:v, due:$('taskDue').value }).then(function(d){ if(d && d.ok){ S.me=d.me; render(); var i=$('taskIn'); if(i) i.focus(); } else failMsg(d); }); }));
  all('[data-task]', function(b){ var id=b.getAttribute('data-task'), k=(S.me.tasks||[]).filter(function(x){ return x.id===id; })[0]; if(!k) return;
    var now=!k.done; k.done=now?todayStr():''; gpTap(); render();
    call('myTask', 'tick', { id:id, done:now }).then(function(d){ if(d && d.ok){ S.me=d.me; render(); } else { failMsg(d); refresh_(); } }); });
  all('[data-droptask]', function(b){ call('myTask', 'drop', { id:b.getAttribute('data-droptask') }).then(function(d){ if(d && d.ok){ S.me=d.me; render(); } else failMsg(d); }); });
  all('[data-ttick]', function(b){ var p=b.getAttribute('data-ttick').split('|'); gpTap();
    S.teamTasks=(S.teamTasks||[]).filter(function(k){ return !(k.team===p[0] && k.id===p[1]); }); confettiAt_(b); render();
    call('teamTask', p[0], 'tick', { id:p[1], done:true }).then(function(d){ if(!(d && d.ok)) failMsg(d); refresh_(); }); });
  all('[data-tmtick]', function(b){ var id=b.getAttribute('data-tmtick'), k=(S.team.tasks||[]).filter(function(x){ return x.id===id; })[0]; if(!k) return; gpTap();
    call('teamTask', S.team.id, 'tick', { id:id, done:!k.mine }).then(function(d){ if(d && d.ok){ S.team=d.team; render(); refresh_(); } else failMsg(d); }); });
  all('[data-tmdrop]', function(b){ if(!confirm(t('Delete this team task?'))) return;
    call('teamTask', S.team.id, 'drop', { id:b.getAttribute('data-tmdrop') }).then(function(d){ if(d && d.ok){ S.team=d.team; render(); } else failMsg(d); }); });
  on('tmAdd', busyOnce_(function(){ var v=$('tmIn').value.trim(); if(!v){ showMsg(t('Write something first.')); return; }
    return call('teamTask', S.team.id, 'add', { text:v, who:$('tmWho').value, due:$('tmDue').value }).then(function(d){ if(d && d.ok){ S.team=d.team; render(); refresh_(); } else failMsg(d); }); }));

  /* 1-on-1s */
  all('[data-coach]', function(b){ openCoach_(b.getAttribute('data-coach')); });
  all('[data-coachyes]', busyOnce_(function(b){ var p=b.getAttribute('data-coachyes').split('|');
    return call('coachAnswer', p[0], p[1]==='1').then(function(d){ if(d && d.ok){ showMsg(p[1]==='1'?t('Done.'):t('Saved.')); refresh_(); } else failMsg(d); }); }));
  all('[data-coachask]', busyOnce_(function(b){ var p=b.getAttribute('data-coachask').split('|');
    return call('coachAsk', S.person.id, p[0], p[1]).then(function(d){ if(d && d.ok){ showMsg(t('Asked. They’ll see it on their Home screen.')); refresh_(); } else failMsg(d); }); }));
  on('toggleEnded', function(){ S.showEnded=!S.showEnded; render(); });
  var cn=$('coachNext'); if(cn) cn.onchange=function(){ coachAct_('next', { date:cn.value }, function(){ refresh_(); showMsg(t('Saved.')); }); };
  var csp=$('coachSharePlan'); if(csp) csp.onchange=function(){ coachAct_('sharePlan', { on:csp.checked }); };
  on('meetNew', busyOnce_(function(){ return coachAct_('new', { date:todayStr() }, function(d){ S.meetId=d.mid; S.meetDraft=null; S.back.push('coach'); S.view='meet'; window.scrollTo(0,0); }); }));
  all('[data-meet]', function(b){ S.meetId=b.getAttribute('data-meet'); S.meetDraft=null; go('meet'); });
  all('[data-rate]', function(b){ var p=b.getAttribute('data-rate').split('|'); keepMeet_(); S.meetDraft.checkin[p[0]]=Number(p[1]); gpTap(); render(); });
  on('meetSave', busyOnce_(function(){ keepMeet_(); var D=S.meetDraft, a={ mid:S.meetId, checkin:D.checkin, good:D.good, hard:D.hard, notes:D.notes }; if(D.priv!==undefined) a.priv=D.priv;
    return coachAct_('save', a, function(){ S.meetDraft=null; showMsg(t('Saved.')); refresh_(); }); }));
  on('fAdd', busyOnce_(function(){ var v=$('fIn').value.trim(); if(!v){ showMsg(t('Write something first.')); return; } keepMeet_();
    return coachAct_('addFollow', { mid:S.meetId, text:v, who:$('fWho').value }, function(){ refresh_(); }); }));
  all('[data-follow]', function(b){ var p=b.getAttribute('data-follow').split('|'), f=null; (S.coaching.meetings||[]).forEach(function(m){ if(m.id===p[0]) (m.follow||[]).forEach(function(x){ if(x.id===p[1]) f=x; }); }); if(!f) return;
    keepMeet_(); gpTap(); coachAct_('tickFollow', { mid:p[0], fid:p[1], done:!f.done }, function(){ refresh_(); }); });
  all('[data-dropfollow]', function(b){ var p=b.getAttribute('data-dropfollow').split('|'); if(!confirm(t('Delete this follow-up?'))) return; keepMeet_(); coachAct_('dropFollow', { mid:p[0], fid:p[1] }); });
  on('meetDelete', busyOnce_(function(){ if(!confirm(t('Delete this 1-on-1?'))) return; return coachAct_('delete', { mid:S.meetId }, function(){ S.meetDraft=null; S.view=S.back.pop()||'coach'; }); }));
  on('coachEnd', busyOnce_(function(){ if(!confirm(t('End this coaching? You can both still read it.'))) return; return coachAct_('end', {}, function(){ refresh_(); }); }));

  /* the feed, report, block, the admin */
  all('[data-clap]', function(b){ var p=b.getAttribute('data-clap').split('|'), x=(S.feed||[]).filter(function(f){ return f.id===p[1]; })[0]; if(!x) return;
    var on=!x.clapped; x.clapped=on; x.claps+=on?1:-1; gpTap(); if(on) confettiAt_(b); render();
    call('clap', p[0], p[1], on).then(function(d){ if(d && d.ok){ x.claps=d.n; render(); } else { failMsg(d); feedLoad_(); } }); });
  on('feedMore', function(){ S.feedMore=true; render(); });
  on('reportPerson', function(){ var p=S.person; S.reportFor={ who:p.id, name:p.name, hasPhoto:p.hasPhoto, bio:p.bio, team:S.team && S.team.id }; go('report'); });
  on('reportTeam', function(){ S.reportFor={ team:S.team.id, name:S.team.name }; go('report'); });
  on('repSend', busyOnce_(function(){ var R=S.reportFor, w=document.querySelector('input[name="repWhat"]:checked');
    if(!w){ showMsg(t('Choose what is wrong.')); return; }
    var a={ what:w.value, reason:$('repWhy').value }; if(R.who) a.who=R.who; if(R.team) a.team=R.team;
    return call('report', a).then(function(d){ if(d && d.ok){ showMsg(t('Thank you. The admin will look at it.')); S.reportFor=null; goBack('teams'); } else failMsg(d); }); }));
  on('blockPerson', busyOnce_(function(){ var p=S.person; if(!confirm(gpT('Block {name}? You won’t see each other in the app — their card, their photo or their moments.',{name:p.name}))) return;
    return call('block', p.id, true).then(function(d){ if(d && d.ok){ S.me=d.me; showMsg(t('Blocked.')); S.feed=null; S.back=[]; S.view='teams'; render(); refresh_(); feedLoad_(); } else failMsg(d); }); }));
  on('goBlocked', function(){ S.blockedPeople=null; go('blocked'); call('blockedList').then(function(d){ if(d && d.ok){ S.blockedPeople=d.people; render(); } }); });
  all('[data-unblock]', function(b){ var id=b.getAttribute('data-unblock'); call('block', id, false).then(function(d){ if(d && d.ok){ S.me=d.me; S.blockedPeople=(S.blockedPeople||[]).filter(function(p){ return p.id!==id; }); S.feed=null; render(); } else failMsg(d); }); });
  on('removePhoto', busyOnce_(function(){ if(!confirm(gpT('Remove {name}’s photo?',{name:S.person.name}))) return;
    return call('teamManage', S.team.id, 'photo', S.person.id).then(function(d){ if(d && d.ok){ S.team=d.team; S.person.hasPhoto=false; delete S.photos[S.person.id]; showMsg(t('Done.')); render(); } else failMsg(d); }); }));
  on('goAdmin', function(){ S.admin=null; go('admin'); adminLoad_(false); });
  all('[data-adminall]', function(b){ adminLoad_(b.getAttribute('data-adminall')==='1'); });
  all('[data-admin]', busyOnce_(function(b){ var p=b.getAttribute('data-admin').split('|');
    var ask={ suspend:'Suspend this account? They will be signed out and hidden from everyone until you lift it.', closeTeam:'Close this team? Everyone will be taken out of it and its code will stop working.' }[p[1]];
    if(ask && !confirm(t(ask))) return;
    return call('adminAct', p[0], p[1]).then(function(d){ if(d && d.ok){ showMsg(t('Done.')); if(S.admin && S.admin.all) adminLoad_(true); else { S.admin={ reports:d.reports, photos:d.photos||{}, all:false }; render(); } } else failMsg(d); }); }));

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
  on('goLibrary', function(){ S.back=[]; libOpen_(); });
  on('goLearn', function(){ S.back=[]; khOpen_(); });
  if(S.view==='library') bindLibrary_();
  bindReminders_();
  on('pwSave', busyOnce_(function(){ var nw=$('pwNew').value, cur=$('pwCur') ? $('pwCur').value : '';
    if(nw.length<8){ showMsg(t('Use at least 8 characters for your password.')); return; }
    return call('setPassword', cur, nw).then(function(d){ if(d && d.ok){ S.me=d.me; showMsg(t('Saved.')); render(); } else failMsg(d); }); }));
  on('arGo', busyOnce_(function(){ var un=$('arUser').value.trim(); if(!un) return;
    if(!confirm(gpT('Reset the password for @{u}? They will be signed out everywhere.',{u:un.replace(/^@/,'')}))) return;
    return call('adminResetPassword', un).then(function(d){ if(d && d.ok){ S.resetResult=d; render(); } else { S.resetResult=null; failMsg(d); } }); }));
  bindKhmer_();
  if(S.view==='team' && S.team) loadPhotos_(S.team.people);
  if(S.view==='teams' && S.feed===null && (S.teams||[]).length && !S.feedAsked){ S.feedAsked=true; feedLoad_(); }
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

/* ---------------- the feed: 👏 for each other ---------------- */
/* Moments from the people in my teams (api.js feed): what happened, never their own words. */
var FEED_LINES = { streak:'{name} reached a {n}-day streak 🔥', goal:'{name} reached a life goal 🏆', type:'{name} found their personality type: {n} 🧭',
  strengths:'{name} found their top 5 strengths 💪', week:'{name} did everything they planned this week ✅', joined:'{name} joined {team} 👋', joinedSome:'{name} joined a new team 👋', focus:'{name} focused for {n} hours this week ⏱', challenge:'{name} finished the challenge {team}', challengeSome:'{name} finished a team challenge 🏁' };
function feedLine_(x){ var k = x.kind==='joined' && !x.team ? 'joinedSome' : x.kind==='challenge' && !x.team ? 'challengeSome' : x.kind; return gpT(FEED_LINES[k]||'{name}',{ name:firstName_(x.who.name), n:x.n, team:x.team||'' }); }
function whenLabel_(iso){ var d=todayStr(); return iso===d ? t('Today') : iso===addDays(d,-1) ? t('Yesterday') : dayLabel(iso); }
function feedLoad_(){ if(!AUTH) return; call('feed').then(function(d){ if(d && d.ok){ S.feed=d.feed; if(S.view==='teams' && !typing_()){ render(); loadPhotos_(S.feed.map(function(x){ return x.who; })); } } }); }
function feedHtml(){
  if(!(S.teams||[]).length) return '';
  var h='<h3>👏 '+esc(t('What your teams are up to'))+'</h3>';
  if(S.feed===null) return h+'<div class="card"><p class="sub" style="margin:0">'+esc(t('Loading…'))+'</p></div>';
  if(!S.feed.length) return h+'<div class="card"><p class="sub" style="margin:0">'+esc(t('Nothing yet. When someone keeps a streak, reaches a goal or takes a test, it shows here — cheer them on!'))+'</p></div>';
  var list=S.feedMore ? S.feed : S.feed.slice(0,8);
  h+='<div class="card list">'+list.map(function(x){
    return '<div class="feedRow">'+faceHtml(x.who,40)+'<span class="feedTx">'+esc(feedLine_(x))+'<div class="pmeta">'+esc(whenLabel_(x.at))+'</div></span>'+
      (x.mine ? '<span class="clapN">'+(x.claps?'👏 '+x.claps:'')+'</span>'
        : '<button class="clapBtn'+(x.clapped?' on':'')+'" data-clap="'+esc(x.who.id)+'|'+esc(x.id)+'" aria-pressed="'+x.clapped+'" aria-label="'+esc(t('Cheer'))+'">👏'+(x.claps?' '+x.claps:'')+'</button>')+'</div>';
  }).join('')+'</div>';
  if(S.feed.length>8 && !S.feedMore) h+='<button class="linkbtn" id="feedMore">'+esc(t('Show more'))+'</button>';
  return h;
}
var CHEER_WHAT = { streak:'your {n}-day streak', goal:'your life goal', type:'your personality type', strengths:'your top 5 strengths', week:'your week', joined:'you joining a team', focus:'your {n} hours of focus', challenge:'you finishing a challenge' };
function cheersHtml(){
  var c=S.cheers||[]; if(!c.length) return '';
  return '<div class="card cheerCard">'+c.slice(0,3).map(function(x){
    var who=(x.names[0]||t('Someone'))+(x.count>1?' '+gpT('and {n} more',{n:x.count-1}):'');
    return '<div class="cheerRow">👏 '+esc(gpT('{who} cheered {what}',{ who:who, what:gpT(CHEER_WHAT[x.kind]||'you',{n:x.n}) }))+'</div>';
  }).join('')+'</div>';
}

/* ---------------- report, block, the admin ---------------- */
var REPORT_WHAT_UI = [['photo','Their photo'],['name','Their name'],['bio','The line about them'],['other','Something else']];
function reportHtml(){
  var R=S.reportFor; if(!R) return backBtn(t('Back'));
  var opts = R.team && !R.who ? [['team','The team’s name or what it’s for'],['other','Something else']] : REPORT_WHAT_UI.filter(function(o){ return (o[0]!=='photo' || R.hasPhoto) && (o[0]!=='bio' || R.bio); });
  var h=backBtn(t('Back'))+'<h2>🚩 '+esc(gpT('Report {name}',{name:R.name}))+'</h2><p class="sub">'+esc(t('Tell us what’s wrong. Only the admin sees reports — the person isn’t told who reported them.'))+'</p><div class="card">'+
    '<label class="f">'+esc(t('What’s wrong?'))+'</label>'+opts.map(function(o){ return '<label class="radioRow"><input type="radio" name="repWhat" value="'+o[0]+'"'+(R.what===o[0]?' checked':'')+'> '+esc(t(o[1]))+'</label>'; }).join('')+
    '<label class="f" for="repWhy">'+esc(t('A few words (if you like)'))+'</label><textarea id="repWhy" rows="3" maxlength="400"></textarea>'+
    '<button class="btn" id="repSend">'+esc(t('Send the report'))+'</button></div>'+
    '<p class="hint">'+esc(t('If someone is in danger, tell a leader or someone you trust now — don’t wait.'))+'</p>';
  return h;
}
function blockedHtml(){
  var h=backBtn(t('Me'))+'<h2>🚫 '+esc(t('People you’ve blocked'))+'</h2><p class="sub">'+esc(t('You and they don’t see each other in the app. Unblock to undo it.'))+'</p>';
  if(S.blockedPeople===null) return h+'<p class="sub">'+esc(t('Loading…'))+'</p>';
  if(!S.blockedPeople.length) return h+'<div class="card"><p class="sub" style="margin:0">'+esc(t('Nobody.'))+'</p></div>';
  return h+'<div class="card list">'+S.blockedPeople.map(function(p){ return '<div class="feedRow"><span class="feedTx"><b>'+esc(p.name)+'</b><div class="pmeta">@'+esc(p.username)+'</div></span><button class="btn small ghost" data-unblock="'+esc(p.id)+'">'+esc(t('Unblock'))+'</button></div>'; }).join('')+'</div>';
}
var REPORT_LABEL = { photo:'Their photo', name:'Their name', bio:'The line about them', team:'A team', other:'Something else' };
function adminHtml(){
  var A=S.admin, h=backBtn(t('Me'))+'<h2>🛡️ '+esc(t('Reports'))+'</h2>';
  if(!A) return h+'<p class="sub">'+esc(t('Loading…'))+'</p>';
  h+=adminResetHtml_();
  h+='<h3>🚩 '+esc(t('What people reported'))+'</h3>';
  h+='<div class="seg" style="margin-bottom:12px"><button data-adminall="0" class="'+(A.all?'':'on')+'">'+esc(t('Waiting'))+'</button><button data-adminall="1" class="'+(A.all?'on':'')+'">'+esc(t('All'))+'</button></div>';
  if(!A.reports.length) return h+'<div class="card"><p class="sub" style="margin:0">'+esc(t('No reports waiting. 🙌'))+'</p></div>';
  A.reports.forEach(function(r){
    var P=r.person, T=r.teamInfo, open=r.status==='open';
    h+='<div class="card adminCard'+(open?'':' muted')+'"><div class="qHead"><b>'+esc(t(REPORT_LABEL[r.what]||r.what))+'</b><span class="pmeta">'+esc(dayLabel(String(r.at).slice(0,10)))+'</span></div>';
    if(P) h+='<div class="feedRow">'+(P.hasPhoto && A.photos[P.id] ? '<img class="face" style="width:64px;height:64px" src="'+esc(A.photos[P.id])+'" alt="">' : '<span class="face ini" style="width:64px;height:64px;font-size:24px">'+esc(initials_(P.name))+'</span>')+
      '<span class="feedTx"><b>'+esc(P.name)+'</b> <span class="pmeta">@'+esc(P.username)+(P.minor?' · '+esc(t('under 18')):'')+(P.suspended?' · '+esc(t('suspended')):'')+'</span>'+(P.bio?'<div class="pmeta">“'+esc(P.bio)+'”</div>':'')+'</span></div>';
    if(T) h+='<div class="pmeta" style="margin-top:6px">'+esc((T.emoji||'')+' '+T.name)+' · '+esc(peopleN_(T.size))+(T.closed?' · '+esc(t('closed')):'')+'</div>';
    if(r.reason) h+='<p class="whyText" style="font-size:14.5px;margin:8px 0">“'+esc(r.reason)+'”</p>';
    h+='<div class="pmeta">'+esc(gpT('Reported by {name}',{name:r.byName}))+'</div>';
    if(!open){ h+='<div class="pmeta">'+esc(r.status==='dismissed'?t('Left as it was'):t('Done'))+'</div>'; if(P && P.suspended) h+='<button class="btn small ghost" data-admin="'+esc(r.id)+'|unsuspend" style="margin-top:8px">'+esc(t('Lift the suspension'))+'</button>'; return h+='</div>'; }
    var b=[];
    if(P && P.hasPhoto) b.push(['photo','Remove the photo']);
    if(P && P.bio) b.push(['bio','Remove the line']);
    if(P) b.push(P.suspended ? ['unsuspend','Lift the suspension'] : ['suspend','Suspend the account']);
    if(T && !T.closed && r.what==='team') b.push(['closeTeam','Close the team']);
    b.push(['dismiss','Leave it as it is']);
    h+='<div class="btnRow" style="flex-wrap:wrap;margin-top:10px">'+b.map(function(x){ return '<button class="btn small '+(x[0]==='dismiss'?'ghost':'ghost danger')+'" data-admin="'+esc(r.id)+'|'+x[0]+'">'+esc(t(x[1]))+'</button>'; }).join('')+'</div></div>';
  });
  return h;
}
function adminResetHtml_(){
  var R=S.resetResult;
  return '<h3>🔑 '+esc(t('Reset a password'))+'</h3><div class="card"><p class="sub" style="margin:0 0 8px">'+esc(t('For someone who forgot theirs: you get a one-time password to give them, and they’re signed out everywhere.'))+'</p>'+
    '<div class="atRow"><span>@</span><input type="text" id="arUser" autocapitalize="none" maxlength="20" placeholder="'+esc(t('Username'))+'"><button class="btn small" id="arGo">'+esc(t('Reset'))+'</button></div>'+
    (R ? '<div class="banner" style="margin-top:10px">'+esc(gpT('One-time password for @{u}:',{u:R.username}))+' <b class="bigPw">'+esc(R.password)+'</b><div class="hint">'+esc(t('Give it to them in person. They can change it on Me.'))+'</div></div>' : '')+'</div>';
}
function adminLoad_(all){ S.admin=S.admin||{ reports:[], photos:{} }; S.admin.all=!!all; call('adminReports', !!all).then(function(d){ if(d && d.ok){ S.admin={ reports:d.reports, photos:d.photos||{}, all:!!all }; render(); } else { failMsg(d); goBack('me'); } }); }

/* ---------------- my password (Me) ---------------- */
function passwordCardHtml_(){
  var has=S.me.hasPassword;
  return '<h3>🔑 '+esc(t('Password'))+'</h3><div class="card">'+
    (has ? '<label class="f" for="pwCur">'+esc(t('Current password'))+'</label><input type="password" id="pwCur" autocomplete="current-password" maxlength="128">'
         : '<p class="sub" style="margin:0 0 4px">'+esc(t('Add a password so you can sign in with your username on any phone.'))+'</p>')+
    '<label class="f" for="pwNew">'+esc(t('New password'))+'</label><input type="password" id="pwNew" autocomplete="new-password" maxlength="128">'+
    '<div class="hint">'+esc(t('At least 8 characters.'))+'</div>'+
    '<button class="btn small" id="pwSave" style="margin-top:8px">'+esc(has?t('Change my password'):t('Add a password'))+'</button></div>';
}

/* ---------------- reminders on the phone (Me) ----------------
   Copied from the Impact app: one reminder a day at the hour you pick, only when there's
   something to do, plus a few right away (a coach asking, a task from a leader). This phone
   subscribes with the app's public key from boot (S.push.key); the server keeps it. iPhones
   only allow it once the app is on the Home Screen. */
function pushSupported_(){ return 'serviceWorker' in navigator && 'PushManager' in window && typeof Notification!=='undefined'; }
function pushNeedsInstall_(){
  var ios=/iPhone|iPad|iPod/.test(navigator.userAgent||'');
  var standalone=window.navigator.standalone===true || !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  return ios && !standalone;
}
function pushKeyBytes_(b64){ var x=String(b64).replace(/-/g,'+').replace(/_/g,'/'); while(x.length%4) x+='='; var raw=atob(x), out=new Uint8Array(raw.length); for(var i=0;i<raw.length;i++) out[i]=raw.charCodeAt(i); return out; }
function pushCheck_(){
  if(S.pushChecked || !pushSupported_()) return; S.pushChecked=true;
  navigator.serviceWorker.ready.then(function(reg){ return reg.pushManager.getSubscription(); }).then(function(sub){ S.pushSub=sub||null; if(S.view==='me' && !typing_()) render(); }).catch(function(){});
}
function remindersCardHtml_(){
  var P=S.push, h='<h3>🔔 '+esc(t('Reminders'))+'</h3><div class="card" id="remCard">';
  if(!P) return '';
  if(!pushSupported_()) return h+'<p class="hint" style="margin:0">'+esc(t('This phone or browser can’t show reminders from the app.'))+'</p></div>';
  if(pushNeedsInstall_()) return h+'<p class="hint" style="margin:0">'+esc(t('On iPhone, add GonPreah to your Home Screen first (Share → Add to Home Screen), open it from there, and turn reminders on here.'))+'</p></div>';
  if(Notification.permission==='denied') return h+'<p class="hint" style="margin:0">'+esc(t('Notifications are blocked for this app in your phone’s settings. Allow them there, then come back.'))+'</p></div>';
  pushCheck_();
  if(!S.pushSub) return h+'<p class="hint" style="margin:0 0 8px">'+esc(t('One reminder a day at a time you choose — only when there’s something to do.'))+'</p>'+
    '<button class="btn" id="remOn"'+(S.pushBusy?' disabled':'')+'>🔔 '+esc(t('Turn on reminders'))+'</button></div>';
  var pr=P.prefs||{}, opts='';
  for(var hr=5; hr<=22; hr++) opts+='<option value="'+hr+'"'+(pr.hour===hr?' selected':'')+'>'+(hr<10?'0':'')+hr+':00</option>';
  var box=function(id, on, label){ return '<label class="switchRow"><span>'+esc(label)+'</span><input type="checkbox" id="'+id+'"'+(on?' checked':'')+'></label>'; };
  return h+'<p class="hint" style="margin:0 0 8px">✓ '+esc(t('Reminders are on for this phone.'))+'</p>'+
    '<label class="f" for="remHour">'+esc(t('Remind me at'))+'</label><select id="remHour">'+opts+'</select>'+
    box('remHabits', pr.habits!==false, t('When today’s habits aren’t ticked'))+
    box('remPlan', pr.plan!==false, t('My life plan’s steps for now (Mondays)'))+
    box('remTeam', pr.team!==false, t('Team tasks due soon'))+
    box('remCoach', pr.coach!==false, t('A 1-on-1 today'))+
    box('remAlerts', pr.alerts!==false, t('Right away: someone asks about coaching, or a leader gives me a task'))+
    '<div class="btnRow" style="margin-top:10px"><button class="btn small ghost" id="remTest">'+esc(t('Send me a test'))+'</button><button class="btn small ghost" id="remOff">'+esc(t('Turn off'))+'</button></div></div>';
}
function remSavePrefs_(){
  var g=function(id){ var el=$(id); return el ? !!el.checked : true; };
  var pr={ hour:Number(($('remHour')||{}).value)||19, habits:g('remHabits'), plan:g('remPlan'), team:g('remTeam'), coach:g('remCoach'), alerts:g('remAlerts') };
  S.push.prefs=pr;
  call('pushSavePrefs', pr).then(function(d){ if(d && d.ok){ S.push.prefs=d.prefs; showMsg(t('Saved.')); } else failMsg(d); });
}
function bindReminders_(){
  on('remOn', function(){
    gpTap(); S.pushBusy=true; render();
    var fail=function(msg){ S.pushBusy=false; render(); showMsg(msg || t('Reminders couldn’t be turned on on this phone.')); };
    Promise.resolve(Notification.permission==='granted' ? 'granted' : Notification.requestPermission()).then(function(perm){
      if(perm!=='granted'){ fail(t('Allow notifications to get reminders.')); return; }
      return navigator.serviceWorker.ready.then(function(reg){ return reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey:pushKeyBytes_(S.push.key) }); })
        .then(function(sub){ var j=sub.toJSON();
          return call('pushSubscribe', { endpoint:j.endpoint, keys:j.keys }, LANG).then(function(d){
            S.pushBusy=false;
            if(d && d.ok){ S.pushSub=sub; if(d.prefs) S.push.prefs=d.prefs; render(); showMsg(t('Reminders are on.')); }
            else { sub.unsubscribe().catch(function(){}); fail(); } }); });
    }).catch(function(){ fail(); });
  });
  ['remHour','remHabits','remPlan','remTeam','remCoach','remAlerts'].forEach(function(id){ var el=$(id); if(el) el.onchange=remSavePrefs_; });
  on('remTest', function(){ var b=$('remTest'); b.disabled=true; call('pushTest').then(function(d){ b.disabled=false; showMsg(d && d.ok ? t('Sent — it should arrive in a moment.') : t('It couldn’t be sent. Try turning reminders off and on again.')); }); });
  on('remOff', function(){ var sub=S.pushSub; if(!sub) return; call('pushUnsubscribe', sub.endpoint); sub.unsubscribe().catch(function(){}); S.pushSub=null; render(); showMsg(t('Reminders are off for this phone.')); });
}

/* ---------------- Today: my why, today's 3, focus, the evening check-in, the recap ----------------
   All private (api.js "Today"): others see only focus minutes this week, behind a switch. */
function dayOf_(d){ return ((S.me && S.me.daily)||{})[d] || {}; }
function focusShort_(min){ min=Math.round(min||0); if(!min) return '0'; var h=Math.floor(min/60), m=min%60; return h ? h+'h'+(m?' '+m+'m':'') : m+'m'; }
function whyLineHtml(){
  var why=planOf().why;
  if(!why) return '<button class="card whyLine empty" id="goWhy">✦ '+esc(t('What did God make you for? Write your why'))+' ›</button>';
  return '<button class="card whyLine" id="goWhy"><span class="pmeta">✦ '+esc(t('My why'))+'</span><span class="whyLineTx">“'+esc(why)+'”</span></button>';
}
function todayCardHtml(){
  var d=todayStr(), D=dayOf_(d), top=D.top||[], h='<h3>☀️ '+esc(t('Today'))+'</h3><div class="card todayCard">';
  if(S.topEdit || !top.length){
    var ph=[t('The most important thing today'), t('Second thing'), t('Third thing')];
    if(!S.topEdit) h+='<p class="sub" style="margin:0 0 8px">'+esc(t('What are the three things that matter most today?'))+'</p>';
    for(var i=0;i<3;i++) h+='<input type="text" class="topIn" data-topin="'+i+'" maxlength="100" placeholder="'+esc(ph[i])+'" value="'+esc((top[i]||{}).text||'')+'" style="margin-bottom:8px">';
    h+='<div class="btnRow"><button class="btn small" id="topSave">'+esc(t('Save'))+'</button>'+(S.topEdit?'<button class="btn small ghost" id="topCancel">'+esc(t('Cancel'))+'</button>':'')+'</div>';
  } else {
    var done=top.filter(function(x){ return x.done; }).length;
    h+='<div class="todayHead"><span class="pmeta">'+esc(gpT('{a} of {b} done',{a:done,b:top.length}))+'</span><button class="linkbtn inline" id="topEdit">'+esc(t('Change'))+'</button></div>';
    top.forEach(function(x,i){ h+='<div class="stepRow'+(x.done?' done':'')+'">'+checkHtml('data-top="'+i+'"', !!x.done, x.text)+'<span class="stepTx">'+esc(x.text)+'</span></div>'; });
    if(done===top.length) h+='<div class="allDone">🎉 '+esc(t('All done today. Well done!'))+'</div>';
  }
  h+='<div class="focusRow"><span>⏱ <b>'+focusShort_(D.focus||0)+'</b> '+esc(t('focused today'))+(D.sessions?' · '+esc(gpT('{n} sessions',{n:D.sessions})):'')+'</span><button class="btn small" id="goFocus">'+esc(focusActive_()?t('Back to focus'):t('Start focus'))+'</button></div>';
  return h+'</div>';
}
var MOODS=[[1,'😢','Hard'],[2,'😕','Not great'],[3,'😐','OK'],[4,'🙂','Good'],[5,'😄','Great']];
function checkinCardHtml(){
  var d=todayStr(), D=dayOf_(d), hour=new Date().getHours();
  if(!D.mood && hour<17 && !S.checkinEdit) return '';
  var h='<h3>🌙 '+esc(t('Tonight'))+'</h3><div class="card">';
  if(D.mood && !S.checkinEdit){
    h+='<div class="checkDone"><span class="bigMood">'+MOODS[D.mood-1][1]+'</span><span style="flex:1">'+(D.grateful?'<span class="pmeta">🙏 '+esc(t('Thankful for'))+'</span><div>'+esc(D.grateful)+'</div>':esc(t('You checked in today.')))+'</span><button class="linkbtn inline" id="checkEdit">'+esc(t('Change'))+'</button></div>';
    return h+'</div>';
  }
  var m=S.checkinMood||D.mood||0;
  h+='<label class="f">'+esc(t('How was today?'))+'</label><div class="rateBtns">'+MOODS.map(function(x){ return '<button class="rateBtn'+(m===x[0]?' on':'')+'" data-mood="'+x[0]+'" aria-label="'+esc(t(x[2]))+'">'+x[1]+'</button>'; }).join('')+'</div>'+
    '<label class="f" for="gratefulIn">'+esc(t('One thing you’re thankful for'))+'</label><input type="text" id="gratefulIn" maxlength="200" value="'+esc(D.grateful||'')+'" placeholder="'+esc(t('e.g. My friend helped me with homework'))+'">'+
    '<div class="hint">🔒 '+esc(t('Only you see this.'))+'</div><button class="btn small" id="checkSave" style="margin-top:8px">'+esc(t('Save'))+'</button></div>';
  return h;
}
/* Sunday: this week so far. Monday: the week just gone. */
function recapCardHtml(){
  var d=todayStr(), dow=new Date(d+'T00:00:00Z').getUTCDay();
  if(dow!==0 && dow!==1) return '';
  var mon = dow===0 ? addDays(d,-6) : addDays(d,-7), days=[];
  for(var i=0;i<7;i++) days.push(addDays(mon,i));
  var me=S.me, habitDays=0, focus=0, topDays=0, moods=[], steps=0, reached=0;
  days.forEach(function(x){ var m=(me.days||{})[x]; if(m && Object.keys(m).some(function(k){ return m[k]; })) habitDays++;
    var D=dayOf_(x); focus+=D.focus||0; if(D.top && D.top.length && D.top.every(function(y){ return y.done; })) topDays++; if(D.mood) moods.push(D.mood); });
  planOf().goals.forEach(function(g){ if(g.done && g.done>=mon && g.done<=days[6]) reached++; (g.steps||[]).forEach(function(st){ if(st.done && st.done>=mon && st.done<=days[6]) steps++; }); });
  if(!habitDays && !focus && !topDays && !moods.length && !steps) return '';
  var avg=moods.length ? Math.round(moods.reduce(function(a,b){ return a+b; },0)/moods.length) : 0;
  var tiles=[[habitDays+'/7','✅ '+t('days with habits')],[focusShort_(focus),'⏱ '+t('focus')],[String(topDays),'☀️ '+t('days all 3 done')],[String(steps),'🪜 '+t('steps done')]];
  if(avg) tiles.push([MOODS[avg-1][1],t('your week, mostly')]);
  if(reached) tiles.push([String(reached),'🏆 '+t('goals reached')]);
  return '<div class="card recapCard"><div class="recapHead">📊 '+esc(dow===0?t('Your week so far'):t('Your week'))+'</div><div class="statTiles recapTiles">'+tiles.map(function(x){ return '<div><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></div>'; }).join('')+'</div>'+
    '<div class="pmeta" style="margin-top:8px">'+esc(dow===0?t('Tomorrow is a fresh start. What will this week be about?'):t('A new week. Set this week’s goals below.'))+'</div></div>';
}

/* ---------------- team challenges ----------------
   A leader starts one (api.js "team challenges"); members join and tick each day. The team
   sees who's in and how many days each has done — never anything else. */
var CH_IDEAS=[['📖','Read a Bible chapter every day'],['🙏','Pray for 10 minutes'],['📵','No phone after 10 pm'],['🏃','Exercise for 20 minutes'],['🔤','Practise English for 15 minutes'],['⏱','Focus for one hour'],['💧','Drink 8 glasses of water'],['💛','Do something kind']];
function chDots_(c){ var h='<div class="chDots">'; for(var i=0;i<c.days;i++){ var d=addDays(c.start,i), done=(c.mine||[]).indexOf(d)>-1, isToday=d===todayStr(); h+='<span class="chDot'+(done?' on':'')+(isToday?' now':'')+(d>todayStr()?' later':'')+'"></span>'; } return h+'</div>'; }
function chStateLine_(c){ return c.state==='soon' ? t('Starts tomorrow') : c.state==='over' ? gpT('Finished · {n} of {d} days',{n:(c.mine||[]).length,d:c.days}) : gpT('Day {n} of {d}',{n:c.dayNo,d:c.days}); }
function chTickBtn_(c, team){ if(c.state!=='on' || !c.joined) return '';
  return '<button class="btn small'+(c.doneToday?' ghost':'')+'" data-chtick="'+esc(team)+'|'+esc(c.id)+'|'+(c.doneToday?0:1)+'">'+esc(c.doneToday?t('✓ Done today'):t('I did it today'))+'</button>'; }
function challengesHtml(T){
  var list=T.challenges||[];
  if(!list.length && !T.leader) return '';
  var h='<h3>🏁 '+esc(t('Challenges'))+'</h3>';
  list.forEach(function(c){
    h+='<div class="card chCard'+(c.state==='over'?' muted':'')+'"><div class="chHead"><span class="chEmoji">'+esc(c.emoji)+'</span><span style="flex:1;min-width:0"><b>'+esc(c.title)+'</b><div class="pmeta">'+esc(chStateLine_(c))+'</div></span>'+
      (T.leader?'<button class="xBtn" data-chdrop="'+esc(c.id)+'" aria-label="'+esc(t('End this challenge'))+'">×</button>':'')+'</div>';
    if(c.joined) h+=chDots_(c);
    h+='<div class="btnRow" style="margin-top:8px">'+(c.joined ? chTickBtn_(c, T.id) : (c.state!=='over'?'<button class="btn small" data-chjoin="'+esc(c.id)+'|1">'+esc(t('Join the challenge'))+'</button>':''))+'</div>';
    if(c.people.length){
      h+='<div class="chPeople">'+c.people.slice(0,8).map(function(p){ var pct=Math.round(p.n/c.days*100);
        return '<div class="chPerson"><span class="chName">'+esc(firstName_(p.name)||'?')+'</span><span class="chBar"><i style="width:'+pct+'%"></i></span><b>'+p.n+'/'+c.days+'</b></div>'; }).join('')+
        (c.people.length>8?'<div class="pmeta">'+esc(gpT('and {n} more',{n:c.people.length-8}))+'</div>':'')+'</div>';
    }
    if(c.joined && c.state!=='over') h+='<button class="linkbtn" data-chjoin="'+esc(c.id)+'|0" style="font-size:12.5px">'+esc(t('Leave the challenge'))+'</button>';
    h+='</div>';
  });
  if(T.leader){
    var N=S.chNew;
    if(!N) h+='<button class="btn ghost" id="chNewOpen">＋ '+esc(t('Start a challenge'))+'</button>';
    else {
      h+='<div class="card"><label class="f">'+esc(t('Pick one, or write your own'))+'</label><div class="catChips">'+CH_IDEAS.map(function(x){ return '<button class="catChip'+(N.title===t(x[1])?' on':'')+'" data-chidea="'+esc(x[0])+'|'+esc(t(x[1]))+'">'+x[0]+' '+esc(t(x[1]))+'</button>'; }).join('')+'</div>'+
        '<label class="f" for="chTitle">'+esc(t('The challenge'))+'</label><input type="text" id="chTitle" maxlength="60" value="'+esc(N.title)+'">'+
        '<label class="f">'+esc(t('How many days?'))+'</label><div class="seg">'+[3,7,14,21,30].map(function(n){ return '<button data-chdays="'+n+'" class="'+(N.days===n?'on':'')+'">'+n+'</button>'; }).join('')+'</div>'+
        '<label class="f">'+esc(t('Starts'))+'</label><div class="seg"><button data-chstart="0" class="'+(!N.tomorrow?'on':'')+'">'+esc(t('Today'))+'</button><button data-chstart="1" class="'+(N.tomorrow?'on':'')+'">'+esc(t('Tomorrow'))+'</button></div>'+
        '<div class="btnRow" style="margin-top:12px"><button class="btn small" id="chGo">🏁 '+esc(t('Start the challenge'))+'</button><button class="btn small ghost" id="chCancel">'+esc(t('Cancel'))+'</button></div>'+
        '<div class="hint">'+esc(t('Everyone in the team sees it and chooses to join. They see who’s in and how many days each has done.'))+'</div></div>';
    }
  }
  return h;
}
function myChallengesHtml(){
  var list=S.challenges||[]; if(!list.length) return '';
  return '<h3>🏁 '+esc(t('Your challenges'))+'</h3><div class="card list">'+list.map(function(c){
    return '<div class="feedRow"><span class="chEmoji">'+esc(c.emoji)+'</span><span class="feedTx"><b>'+esc(c.title)+'</b><div class="pmeta">'+esc(chStateLine_(c))+' · '+esc(c.teamEmoji+' '+c.teamName)+'</div></span>'+chTickBtn_(c, c.team)+'</div>';
  }).join('')+'</div>';
}
function keepChNew_(){ var x=$('chTitle'); if(x && S.chNew) S.chNew.title=x.value; }

/* ---------------- a picture of my week, to share ----------------
   Drawn on the phone (canvas, 1080×1920 like a story), never uploaded by the app: the person
   shares it themselves. First name only, and numbers only — never goals, habits or the why. */
function weekNumbers_(){
  var me=S.me, mon=mondayOf(todayStr()), habitDays=0, top3=0;
  for(var i=0;i<7;i++){ var d=addDays(mon,i); if(d>todayStr()) break; var m=(me.days||{})[d]; if(m && Object.keys(m).some(function(k){ return m[k]; })) habitDays++; var D=dayOf_(d); if(D.top && D.top.length && D.top.every(function(x){ return x.done; })) top3++; }
  return { streak:(me.stats||{}).streak||0, focus:(me.stats||{}).focusWeek||0, habitDays:habitDays, top3:top3 };
}
function drawShareCard_(cb){
  var W=1080, H=1920, c=document.createElement('canvas'); c.width=W; c.height=H; var x=c.getContext('2d'), me=S.me, N=weekNumbers_();
  var go=function(){
    var g=x.createLinearGradient(0,0,W,H); g.addColorStop(0,'#17150F'); g.addColorStop(.55,'#1430B0'); g.addColorStop(1,'#1F44FF'); x.fillStyle=g; x.fillRect(0,0,W,H);
    x.fillStyle='rgba(255,179,35,.16)'; x.beginPath(); x.arc(W-80,260,360,0,Math.PI*2); x.fill();
    var font=function(sz, w, fam){ x.font=(w||'700')+' '+sz+'px '+(fam||"'Kantumruy Pro', system-ui, sans-serif"); };
    x.textAlign='center'; x.fillStyle='#FAF6F0';
    font(64,'400',"'Koulen', system-ui, sans-serif"); x.fillText('កូនព្រះ  GONPREAH', W/2, 210);
    font(46,'500'); x.fillStyle='rgba(250,246,240,.75)'; x.fillText(t('My week'), W/2, 330);
    font(120,'400',"'Koulen', system-ui, sans-serif"); x.fillStyle='#FFFFFF'; x.fillText(firstName_(me.name).toUpperCase(), W/2, 470);
    var tiles=[['🔥', String(N.streak), t('day streak')], ['⏱', focusShort_(N.focus), t('focus this week')], ['✅', N.habitDays+'/7', t('days with habits')], ['☀️', String(N.top3), t('days all 3 done')]];
    tiles.forEach(function(tl, i){ var col=i%2, row=Math.floor(i/2), bx=90+col*470, by=600+row*420, bw=430, bh=380;
      x.fillStyle='rgba(250,246,240,.10)'; if(x.roundRect){ x.beginPath(); x.roundRect(bx,by,bw,bh,40); x.fill(); } else x.fillRect(bx,by,bw,bh);
      font(90,'400'); x.fillStyle='#FFFFFF'; x.fillText(tl[0], bx+bw/2, by+120);
      font(110,'400',"'Koulen', system-ui, sans-serif"); x.fillStyle='#FFB323'; x.fillText(tl[1], bx+bw/2, by+250);
      font(38,'600'); x.fillStyle='rgba(250,246,240,.85)'; x.fillText(tl[2], bx+bw/2, by+320); });
    var y=1490;
    if(me.personality && typeof GP_PTYPES!=='undefined' && GP_PTYPES[me.personality.type] && me.personality.share!==false){
      font(44,'600'); x.fillStyle='rgba(250,246,240,.75)'; x.fillText(t('How God made me'), W/2, y);
      font(72,'400',"'Koulen', system-ui, sans-serif"); x.fillStyle='#FFFFFF'; x.fillText(me.personality.type+' · '+pTheName(me.personality.type), W/2, y+90, W-140); y+=170;
    }
    font(40,'600'); x.fillStyle='#FFB323'; x.fillText(location.host || 'app.gonpreah.org', W/2, H-110);
    c.toBlob(function(b){ cb(b, c.toDataURL('image/png')); }, 'image/png');
  };
  var f=document.fonts; if(f && f.load) Promise.all([f.load("400 64px 'Koulen'"), f.load("400 64px 'Kantumruy Pro'"), f.load("700 40px 'Kantumruy Pro'")]).then(go, go); else go();
}
function shareHtml(){
  var h=backBtn(t('Home'))+'<h2>📤 '+esc(t('Share my week'))+'</h2><p class="sub">'+esc(t('A picture for your story or your friends. Only your first name and your numbers — nothing private.'))+'</p>';
  if(!S.shareImg) return h+'<p class="sub">'+esc(t('Loading…'))+'</p>';
  return h+'<img class="shareImg" src="'+S.shareImg.url+'" alt="">'+
    '<div class="btnRow" style="margin-top:12px"><button class="btn" id="shareGo">📤 '+esc(t('Share'))+'</button><a class="btn ghost" id="shareSave" download="gonpreah-my-week.png" href="'+S.shareImg.url+'">'+esc(t('Save the picture'))+'</a></div>';
}

/* ---------------- the focus timer ----------------
   The phone keeps the session (gpa-focus: {dur, start, label, pausedAt, paused}) so it
   survives the screen locking or the app closing; the minutes go to the server at the end
   (logFocus). Stopping early still counts if it was 5 minutes or more. */
var FOCUS_KEY='gpa-focus', focusTimer=null;
function focusState_(){ try { var f=JSON.parse(lsGet(FOCUS_KEY)||'null'); return f && f.dur && f.start ? f : null; } catch(e){ return null; } }
function focusActive_(){ return !!focusState_(); }
function focusElapsed_(f){ var now=f.pausedAt||Date.now(); return Math.max(0, now-f.start-(f.paused||0)); }
function focusLeft_(f){ return Math.max(0, f.dur*60000-focusElapsed_(f)); }
function mmss_(ms){ var s=Math.ceil(ms/1000), m=Math.floor(s/60); s=s%60; return (m<10?'0':'')+m+':'+(s<10?'0':'')+s; }
function focusHtml(){
  var f=focusState_(), h=backBtn(t('Home'));
  if(S.focusDone){ var dn=S.focusDone;
    return h+'<div class="focusDone"><div class="focusBig">🎉</div><h2>'+esc(gpT('{n} minutes of focus!',{n:dn.min}))+'</h2><p class="sub">'+esc(t('Stand up, drink some water, rest your eyes for 5 minutes.'))+'</p>'+
      (dn.label && dn.topIndex>-1 ? '<button class="btn" id="focusTick">✓ '+esc(gpT('I finished: {x}',{x:dn.label}))+'</button>' : '')+
      '<div class="btnRow" style="margin-top:10px"><button class="btn ghost" id="focusAgain">'+esc(t('Focus again'))+'</button><button class="btn ghost" id="focusHome">'+esc(t('Done'))+'</button></div></div>';
  }
  if(!f){
    var F=S.focusSetup, top=(dayOf_(todayStr()).top||[]).filter(function(x){ return !x.done; });
    h+='<h2>⏱ '+esc(t('Focus'))+'</h2><p class="sub">'+esc(t('One thing, no phone. Put it face down and start.'))+'</p><div class="card">'+
      '<label class="f">'+esc(t('How long?'))+'</label><div class="seg">'+[15,25,50].map(function(m){ return '<button data-fdur="'+m+'" class="'+(F.dur===m?'on':'')+'">'+m+' '+esc(t('min'))+'</button>'; }).join('')+'</div>'+
      '<label class="f" for="focusLabel">'+esc(t('What are you working on?'))+'</label>'+
      (top.length ? '<div class="catChips" style="margin-bottom:8px">'+top.map(function(x){ return '<button class="catChip'+(F.label===x.text?' on':'')+'" data-flabel="'+esc(x.text)+'">'+esc(x.text)+'</button>'; }).join('')+'</div>' : '')+
      '<input type="text" id="focusLabel" maxlength="100" value="'+esc(F.label)+'" placeholder="'+esc(t('e.g. Maths homework'))+'">'+
      '<button class="btn" id="focusStart" style="margin-top:12px">▶ '+esc(t('Start'))+'</button></div>';
    return h;
  }
  var left=focusLeft_(f), pct=1-left/(f.dur*60000), R=110, C=2*Math.PI*R;
  h+='<div class="focusRun"><div class="pmeta">'+esc(f.label||t('Focus'))+'</div>'+
    '<div class="ring"><svg viewBox="0 0 260 260"><circle cx="130" cy="130" r="'+R+'" class="ringBg"/><circle cx="130" cy="130" r="'+R+'" class="ringFg" id="focusArc" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+(C*(1-pct)).toFixed(1)+'"/></svg>'+
    '<div class="ringTx" id="focusLeft">'+mmss_(left)+'</div></div>'+
    '<p class="sub">📵 '+esc(f.pausedAt?t('Paused'):t('Phone down. You’ve got this.'))+'</p>'+
    '<div class="btnRow"><button class="btn ghost" id="focusPause">'+esc(f.pausedAt?t('Resume'):t('Pause'))+'</button><button class="btn ghost" id="focusStop">'+esc(t('Stop'))+'</button></div></div>';
  return h;
}
function focusTick_(){
  var f=focusState_(); if(!f){ clearInterval(focusTimer); focusTimer=null; return; }
  if(!f.pausedAt && focusLeft_(f)<=0){ focusFinish_(f.dur, f.label); return; }
  if(S.view!=='focus') return;
  var el=$('focusLeft'), arc=$('focusArc'); if(!el) return;
  var left=focusLeft_(f), C=2*Math.PI*110; el.textContent=mmss_(left); if(arc) arc.setAttribute('stroke-dashoffset', (C*(left/(f.dur*60000))).toFixed(1));
}
function focusEnsureTimer_(){ if(!focusTimer && focusActive_()) focusTimer=setInterval(focusTick_, 1000); }
function focusFinish_(min, label){
  lsDel(FOCUS_KEY); clearInterval(focusTimer); focusTimer=null;
  var top=dayOf_(todayStr()).top||[], idx=-1; top.forEach(function(x,i){ if(x.text===label && !x.done) idx=i; });
  S.focusDone={ min:min, label:label, topIndex:idx };
  try { if(navigator.vibrate) navigator.vibrate([200,100,200]); } catch(e){}
  if(S.view==='focus'){ render(); var b=document.querySelector('.focusBig'); if(b) confettiAt_(b); }
  else showMsg(gpT('Focus done: {n} minutes 🎉',{n:min}));
  if(AUTH && min>=5) call('logFocus', todayStr(), min).then(function(d){ if(d && d.ok){ S.me=d.me; if(S.view!=='focus') render(); } else failMsg(d); });
}

/* ---------------- the Learn tab ---------------- */
/* Two doors: the Library and Learn Khmer / English. What each knows is on this phone. */
function growHtml(){
  var read=0, total=0, going=null;
  try { read=Object.keys(libRead_()).length; if(typeof GP_LIBRARY!=='undefined'){ total=GP_LIBRARY.books.length; var pr=libProg_(), rd=libRead_(); going=GP_LIBRARY.books.filter(function(b){ return pr[b.id] && !rd[b.id]; })[0]||null; } } catch(e){}
  var G=null, streak=0; try { G=khGame_(); streak=khDayStreak_(); } catch(e){}
  var today=G ? (G.days[khToday_()]||0) : 0;
  var h='<h2>'+esc(t('Learn'))+'</h2><p class="sub">'+esc(t('Grow a little every day: read a great book in ten minutes, and practise Khmer or English.'))+'</p>';
  h+=entryCardHtml('goLibrary','📚',t('Library'), going ? gpT('Continue: {title}',{title:libTitle_(going)}) : (total ? gpT('{n} of {total} books read',{n:read,total:total}) : t('Ten-minute reads of great books on faith, habits, friendships, money and leading.')));
  h+=entryCardHtml('goLearn','🔤',t('Learn Khmer / English'), G && G.xp ? gpT('{xp} XP today · 🔥 {n} days',{xp:today,n:streak}) : t('Flashcards, quizzes, a matching game and grammar — like a language app.'));
  return h;
}
function fmtD(d){ return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }   // learn.js
function gpConfetti(el){ confettiAt_(el); }   // learn.js and library-app.js call it by the Impact app's name

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
/* Start once every script is in (library-app.js and learn.js load after this file and use S). */
function start_(){ if(AUTH) bootNow_(); else render();
  api('authConfig').then(function(c){ S.authCfg=c||{}; if(!AUTH && !typing_()) render(); }); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', start_); else start_();

/*  The Library — copied from the YWAM GP Impact app (teams/03-library-org.js), Nov 2026: the
    shelves you swipe, the covers drawn by us, the book page and the swipe-to-turn reader, Khmer
    or English with the app. The books themselves are in library.js / library-km.js, chosen and
    rewritten for young people in Cambodia ("For you" instead of "For us at YWAM GP").
    Changes for this app: the view is 'library' (from the Grow tab); "read" ticks and where you
    are in a book stay on this phone (gpa-lib-*), nothing goes to a server; the 🎧 player is off
    (LIB_AUDIO_ON=false, as in the Impact app). Fix a bug here and in the Impact app.
    Everything below is the Impact app's own description. */
/* ==================== Library ====================
   Five-minute reads of the books on Craig Groeschel's leadership lists, written
   for YWAM GP in our own words (public/library.js — GP_LIBRARY). Menu → Library.
   The books load only when the Library is opened (libLoad_), so they cost the
   app's start nothing; sw.js keeps a copy for offline reading.

   Laid out the way a book-summary app is: the home is rows you swipe sideways
   (Continue reading, Start here, one per shelf, each with See all), a book page
   with its cover on a tinted panel and Start reading, and a reader that goes one
   key idea per screen (intro, the ideas, a final summary) with a progress bar,
   Back/Next and swiping. Where you are in a book and the "Read" ticks are this
   phone's only (localStorage), nothing is sent anywhere. The summaries are
   English; the screens around them are translated like everything else. */
S.libBook=null; S.libShelf='all'; S.libStep=null; S.libLoading=false; S.libError=false; S.libKmLoading=false; S.libKmError=false;
var LIB_READ_KEY='gpa-lib-read', LIB_PROG_KEY='gpa-lib-progress';
/* Which language the summaries are read in: the app's own unless switched on a book
   page (remembered on this phone). Khmer lives in library-km.js, loaded only when
   it is wanted; until it is there — or if it cannot load — the English shows. */
/* The Library follows the app's language (Oct 2026, Uriah): Khmer app, Khmer
   Library — summaries, titles, authors and covers. No switch of its own. */
function libLang_(){ return LANG==='km' ? 'km' : 'en'; }
function libLoadKm_(){
  if(typeof GP_LIBRARY_KM!=='undefined' || S.libKmLoading) return;
  S.libKmLoading=true; S.libKmError=false;
  var sc=document.createElement('script');
  sc.src='library-km.js';
  sc.setAttribute('data-optional','');
  sc.onload=function(){ S.libKmLoading=false; if(S.view==='library') render(); };
  sc.onerror=function(){ S.libKmLoading=false; S.libKmError=true; sc.remove(); if(S.view==='library') render(); };
  document.head.appendChild(sc);
}
function libText_(b){
  var k=(libLang_()==='km' && typeof GP_LIBRARY_KM!=='undefined') ? GP_LIBRARY_KM[b.id] : null;
  if(!k) return { km:false, vibe:b.vibe, bigIdea:b.bigIdea, insights:b.insights, tryThis:b.tryThis, forUs:b.forUs, oneLine:b.oneLine };
  return { km:true, vibe:k.vibe, bigIdea:k.bigIdea, tryThis:k.tryThis, forUs:k.forUs, oneLine:k.oneLine,
    insights:b.insights.map(function(x, i){ var y=k.insights[i]||{}; return { emoji:x.emoji, title:y.title||x.title, body:y.body||x.body }; }) };
}
/* The name shown for a book: its Khmer name when reading in Khmer and one exists
   (the GP guides have one; published books keep their own English titles). */
function libTitle_(b){
  var k=(libLang_()==='km' && typeof GP_LIBRARY_KM!=='undefined') ? GP_LIBRARY_KM[b.id] : null;
  return (k && k.title) || b.title;
}
function libAuthor_(b){
  var k=(libLang_()==='km' && typeof GP_LIBRARY_KM!=='undefined') ? GP_LIBRARY_KM[b.id] : null;
  return (k && k.author) || b.author;
}
/* Shelves in the order library.js lists them. */
function libShelvesShown_(){ return GP_LIBRARY.shelves; }
/* In Khmer, the Khmer library is fetched the first time it's needed; until it
   arrives everything shows in English, and a failed fetch says so. */
function libKmEnsure_(){
  if(libLang_()!=='km') return '';
  if(typeof GP_LIBRARY_KM==='undefined' && !S.libKmError) libLoadKm_();
  return S.libKmError ? '<p class="hint libKmNote">'+esc(t('The library could not load. Check your connection and try again.'))+'</p>' : '';
}
function libLoad_(){
  if(typeof GP_LIBRARY!=='undefined' || S.libLoading) return;
  S.libLoading=true; S.libError=false;
  var sc=document.createElement('script');
  sc.src='library.js';
  sc.setAttribute('data-optional','');   // a failed load says so on the Library page — never the whole-app error screen
  sc.onload=function(){ S.libLoading=false; if(S.view==='library') render(); };
  sc.onerror=function(){ S.libLoading=false; S.libError=true; sc.remove(); if(S.view==='library') render(); };
  document.head.appendChild(sc);
}
function libStore_(key){
  try { return JSON.parse(localStorage.getItem(key)||'{}')||{}; } catch(e){ return {}; } }
function libSave_(key, v){ try { localStorage.setItem(key, JSON.stringify(v)); } catch(e){} }
function libRead_(){ return libStore_(LIB_READ_KEY); }
function libSetRead_(id, on){
  var r=libRead_(); if(on) r[id]=todayStr(); else delete r[id]; libSave_(LIB_READ_KEY, r);
}
function libProg_(){ return libStore_(LIB_PROG_KEY); }
function libSetProg_(id, step){ var p=libProg_(); if(step>0) p[id]=step; else delete p[id]; libSave_(LIB_PROG_KEY, p); }
function libShelf_(id){ return (GP_LIBRARY.shelves.filter(function(x){ return x.id===id; })[0]) || GP_LIBRARY.shelves[0]; }
function libById_(id){ return GP_LIBRARY.books.filter(function(x){ return x.id===id; })[0]; }
function libPicks_(){ return (GP_LIBRARY.startHere||[]).map(libById_).filter(Boolean); }
/* Covers are drawn here, not fetched: one series look for every book — the
   shelf's colour with a pattern on top, the title in Koulen on paper below —
   so they sit well together and show at once, offline too. The pattern is
   picked by the book's place on its shelf (neighbours never repeat) and nudged
   by a hash of its id, so every cover stays the same from day to day. */
function libHash_(s){ var h=2166136261; for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function libStar_(x, y, r){ return 'M'+x+','+(y-r)+'Q'+x+','+y+' '+(x+r)+','+y+'Q'+x+','+y+' '+x+','+(y+r)+'Q'+x+','+y+' '+(x-r)+','+y+'Q'+x+','+y+' '+x+','+(y-r)+'Z'; }
function libMotif_(b){
  var C=GP_LIBRARY.cover||{}, P=C.paper||'white', A=C.accent||'gold';
  var shelfIdx=GP_LIBRARY.shelves.map(function(x){ return x.id; }).indexOf(b.shelf);
  var onShelf=GP_LIBRARY.books.filter(function(x){ return x.shelf===b.shelf; }).indexOf(b);
  var seed=libHash_(b.id), rnd=function(){ seed=(Math.imul(seed,1103515245)+12345)>>>0; return (seed>>>8)/16777216; };
  var m=(onShelf+shelfIdx*3)%10, o='', k, x, y;
  var c=function(cx,cy,r,a){ return '<circle cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="'+r.toFixed(1)+'" '+a+'/>'; };
  var ring='fill="none" stroke="'+P+'" stroke-opacity=".3" stroke-width="4"';
  if(m===0){ x=22+rnd()*56; y=22+rnd()*46; for(k=1;k<=6;k++) o+=c(x,y,k*11,ring); o+=c(x,y,6,'fill="'+A+'"'); }
  else if(m===1){ x=30+rnd()*40; o+=c(x,92,30,'fill="'+A+'"'); for(k=0;k<9;k++){ var an=Math.PI*(1+k/8); o+='<line x1="'+(x+Math.cos(an)*38).toFixed(1)+'" y1="'+(92+Math.sin(an)*38).toFixed(1)+'" x2="'+(x+Math.cos(an)*70).toFixed(1)+'" y2="'+(92+Math.sin(an)*70).toFixed(1)+'" stroke="'+P+'" stroke-opacity=".4" stroke-width="3" stroke-linecap="round"/>'; } }
  else if(m===2){ var pick=Math.floor(rnd()*30); for(k=0;k<30;k++){ x=12+(k%6)*15.2; y=12+Math.floor(k/6)*16.5; o+= k===pick ? c(x,y,6.5,'fill="'+A+'"') : c(x,y,2.4,'fill="'+P+'" fill-opacity=".38"'); } }
  else if(m===3){ var hot=2+Math.floor(rnd()*8); o+='<g transform="rotate(-35 50 45)">'; for(k=-4;k<14;k++) o+='<rect x="'+(k*12-40)+'" y="-80" width="5" height="250" fill="'+(k===hot?A:P)+'"'+(k===hot?'':' fill-opacity=".2"')+'/>'; o+='</g>'; }
  else if(m===4){ x=rnd()<.5?0:100; var hotA=1+Math.floor(rnd()*5); for(k=1;k<=8;k++) o+=c(x,90,k*13,'fill="none" stroke="'+(k===hotA?A:P)+'"'+(k===hotA?'':' stroke-opacity=".32"')+' stroke-width="5"'); }
  else if(m===5){ x=40+rnd()*20; o+='<path d="'+libStar_(x,46,30)+'" fill="'+A+'"/><path d="'+libStar_(x>50?20:80,18,9)+'" fill="'+P+'" fill-opacity=".7"/><path d="'+libStar_(x>50?84:16,72,6)+'" fill="'+P+'" fill-opacity=".45"/>'; }
  else if(m===6){ y=40+rnd()*10; o+=c(36,y,25,'fill="'+P+'" fill-opacity=".2"')+c(64,y,25,'fill="'+P+'" fill-opacity=".2"')+c(50,y+22,25,'fill="'+P+'" fill-opacity=".14"')+c(50,y+8,6,'fill="'+A+'"'); }
  else if(m===7){ x=18+rnd()*20; o+=c(x,24,9,'fill="'+A+'"')+'<polygon points="-5,92 34,36 74,92" fill="'+P+'" fill-opacity=".22"/><polygon points="34,92 72,24 108,74 108,92" fill="'+P+'" fill-opacity=".34"/>'; }
  else if(m===8){ o+='<path d="M-2,92V74H18V60H38V46H58V32H78V18H102V92Z" fill="'+P+'" fill-opacity=".24"/>'+c(90,9,6,'fill="'+A+'"'); }
  else { var hotW=Math.floor(rnd()*5); for(k=0;k<5;k++){ y=16+k*15; o+='<path d="M-5,'+y+' C20,'+(y-12)+' 30,'+(y+12)+' 50,'+y+' S80,'+(y-12)+' 105,'+y+'" fill="none" stroke="'+(k===hotW?A:P)+'"'+(k===hotW?'':' stroke-opacity=".34"')+' stroke-width="3.5" stroke-linecap="round"/>'; } }
  return '<svg viewBox="0 0 100 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'+o+'</svg>';
}
/* Book covers that nod to each book's own (Oct 2026, Uriah: "like Blinkist —
   somewhat match the original designs, but animated and in the app's colours").
   Each book in library.js has a `cover` — background, title and accent colours
   from the app's palette (GP_LIBRARY.palette), a layout (title at the top or the
   bottom), a type style, and a motif: the one idea its real cover is known for —
   Start with Why's circle, Made to Stick's tape, The Tipping Point's match —
   drawn here as our own simple shapes, never the publisher's art. Motifs live in
   a 100×100 box placed under or over the title. Their moving parts carry cv*
   classes; they move only while the cover is on screen (libLiveCovers_), and
   not at all for someone whose phone asks for less motion. */
function cvA_(cls, extra){ return ' class="cvA '+cls+'"'+(extra?' style="'+extra+'"':''); }
var LIB_MOTIFS={
  rings:function(c){ return '<circle cx="50" cy="50" r="44" fill="none" stroke="'+c.b+'" stroke-width="5"/>'+
    '<circle cx="50" cy="50" r="29" fill="none" stroke="'+c.a+'" stroke-width="7"'+cvA_('cvPulse','animation-delay:-.6s')+'/>'+
    '<circle cx="50" cy="50" r="13" fill="'+c.a+'"'+cvA_('cvPulse')+'/>'; },
  dotsgrow:function(c){ var o=''; for(var i=0;i<7;i++) for(var j=0;j<7;j++){ var k=i+j, r=0.9+k*0.42, hot=(i===5&&j===5);
      o+='<circle cx="'+(8+j*14)+'" cy="'+(8+i*14)+'" r="'+r.toFixed(2)+'" fill="'+(hot?c.a:c.fg)+'"'+(hot?'':' fill-opacity="'+(0.18+k*0.05).toFixed(2)+'"')+cvA_('cvGrow','animation-delay:'+(k*0.12).toFixed(2)+'s')+'/>'; } return o; },
  flywheel:function(c){ var o='<g'+cvA_('cvSpin')+'><circle cx="50" cy="50" r="40" fill="none" stroke="'+c.a+'" stroke-width="7"/>';
    for(var k=0;k<8;k++){ var an=k*Math.PI/4; o+='<line x1="50" y1="50" x2="'+(50+Math.cos(an)*38).toFixed(1)+'" y2="'+(50+Math.sin(an)*38).toFixed(1)+'" stroke="'+c.a+'" stroke-width="3"/>'; }
    return o+'</g><circle cx="50" cy="50" r="8" fill="'+c.b+'"/>'; },
  split:function(c){ return '<path d="M47 8 A42 42 0 0 0 47 92 Z" fill="'+c.fg+'"'+cvA_('cvNudgeL')+'/><path d="M53 8 A42 42 0 0 1 53 92 Z" fill="'+c.a+'"'+cvA_('cvNudgeR')+'/>'; },
  curve:function(c){ return '<path d="M4 88 C 22 86, 28 20, 50 18 S 78 70, 96 66" fill="none" stroke="'+c.b+'" stroke-width="3" stroke-opacity=".45"/>'+
    '<path d="M4 88 C 22 86, 28 20, 50 18 S 78 70, 96 66" fill="none" stroke="'+c.a+'" stroke-width="5" stroke-linecap="round" pathLength="100"'+cvA_('cvDraw')+'/>'+
    '<circle cx="50" cy="18" r="6" fill="'+c.a+'"'+cvA_('cvPulse')+'/>'; },
  four:function(c){ var cols=[c.a, c.b, c.c, c.d]; return [[8,8],[54,8],[8,54],[54,54]].map(function(p,i){
    return '<rect x="'+p[0]+'" y="'+p[1]+'" width="38" height="38" rx="7" fill="'+cols[i]+'"'+(i===0?cvA_('cvPulse'):'')+'/>'; }).join(''); },
  tablets:function(c){ var t=function(x){ return '<path d="M'+x+' 92 V30 a17 17 0 0 1 34 0 V92 Z" fill="'+c.a+'"/>'+[44,56,68,80].map(function(y){ return '<line x1="'+(x+7)+'" y1="'+y+'" x2="'+(x+27)+'" y2="'+y+'" stroke="'+c.bg+'" stroke-width="2.4" stroke-opacity=".5"/>'; }).join(''); };
    return t(12)+t(54)+'<circle cx="50" cy="12" r="5" fill="'+c.fg+'"'+cvA_('cvPulse')+'/>'; },
  gears:function(c){ var g=function(cx,cy,r,n,col,cls){ var o='<g'+cvA_(cls)+'><circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+col+'"/>';
      for(var k=0;k<n;k++){ var an=k*2*Math.PI/n; o+='<rect x="'+(cx-4)+'" y="'+(cy-r-7)+'" width="8" height="10" rx="1.5" fill="'+col+'" transform="rotate('+(an*180/Math.PI).toFixed(1)+' '+cx+' '+cy+')"/>'; }
      return o+'<circle cx="'+cx+'" cy="'+cy+'" r="'+(r*0.35).toFixed(1)+'" fill="'+c.bg+'"/></g>'; };
    return g(36,40,22,9,c.a,'cvSpin')+g(70,70,16,7,c.b,'cvSpinR'); },
  match:function(c){ return '<rect x="47" y="34" width="6" height="62" rx="2" fill="'+c.b+'"/><ellipse cx="50" cy="34" rx="6" ry="8" fill="'+c.fg+'"/>'+
    '<path d="M50 4 C 60 16, 60 24, 50 30 C 40 24, 40 16, 50 4 Z" fill="'+c.a+'"'+cvA_('cvFlick')+'/>'; },
  bignum:function(c, b){ return '<text x="50" y="84" text-anchor="middle" font-family="Koulen, Impact, sans-serif" font-size="92" fill="'+c.a+'"'+cvA_('cvPulse')+'>'+esc(b.cover.text||'')+'</text>'; },
  smile:function(c){ return '<circle cx="50" cy="50" r="40" fill="'+c.a+'"/><circle cx="36" cy="42" r="5" fill="'+c.fg+'"'+cvA_('cvBlink')+'/><circle cx="64" cy="42" r="5" fill="'+c.fg+'"'+cvA_('cvBlink')+'/>'+
    '<path d="M30 58 Q50 78 70 58" fill="none" stroke="'+c.fg+'" stroke-width="5" stroke-linecap="round"/>'; },
  chevrons:function(c){ return [70,48,26].map(function(y,i){ return '<path d="M14 '+(y+16)+' L50 '+y+' L86 '+(y+16)+'" fill="none" stroke="'+(i===2?c.a:c.b)+'" stroke-width="9" stroke-linejoin="round"'+cvA_('cvRise','animation-delay:'+(i*0.3)+'s')+'/>'; }).join(''); },
  bubbles:function(c){ return '<path d="M8 14 h56 a8 8 0 0 1 8 8 v24 a8 8 0 0 1 -8 8 h-38 l-12 10 v-10 h-6 a8 8 0 0 1 -8 -8 v-24 a8 8 0 0 1 8 -8z" fill="'+c.a+'"'+cvA_('cvPulse')+'/>'+
    '<path d="M36 48 h48 a8 8 0 0 1 8 8 v22 a8 8 0 0 1 -8 8 h-4 v10 l-12 -10 h-32 a8 8 0 0 1 -8 -8 v-22 a8 8 0 0 1 8 -8z" fill="'+c.b+'"'+cvA_('cvPulse','animation-delay:-1.6s')+'/>'; },
  pyramid:function(c){ var o='', cols=[c.a,c.b,c.a,c.b,c.a]; for(var i=0;i<5;i++){ var y=10+i*17, w1=10+i*16, w2=w1+16;
      o+='<path d="M'+(50-w1/2)+' '+y+' H'+(50+w1/2)+' L'+(50+w2/2)+' '+(y+15)+' H'+(50-w2/2)+' Z" fill="'+cols[i]+'" fill-opacity="'+(1-i*0.12).toFixed(2)+'"'+cvA_('cvGrow','animation-delay:'+(i*0.18)+'s')+'/>'; } return o; },
  pulse:function(c){ return '<path d="M50 88 C 18 66, 6 48, 10 32 C 14 14, 38 12, 50 30 C 62 12, 86 14, 90 32 C 94 48, 82 66, 50 88 Z" fill="'+c.a+'"'+cvA_('cvPulse')+'/>'+
    '<path d="M8 52 H30 L38 36 L48 66 L56 44 L62 52 H92" fill="none" stroke="'+c.fg+'" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" pathLength="100"'+cvA_('cvDraw')+'/>'; },
  circlesafety:function(c){ var o='<circle cx="50" cy="50" r="36" fill="none" stroke="'+c.a+'" stroke-width="4" stroke-dasharray="3 5"/><g'+cvA_('cvSpin')+'>';
    for(var k=0;k<8;k++){ var an=k*Math.PI/4; o+='<circle cx="'+(50+Math.cos(an)*36).toFixed(1)+'" cy="'+(50+Math.sin(an)*36).toFixed(1)+'" r="6" fill="'+c.a+'"/>'; }
    return o+'</g><circle cx="50" cy="50" r="12" fill="'+c.b+'"/>'; },
  lean:function(c){ return '<g'+cvA_('cvSway','transform-origin:50% 100%')+'><rect x="40" y="30" width="20" height="64" rx="10" fill="'+c.a+'" transform="rotate(14 50 94)"/><circle cx="62" cy="20" r="11" fill="'+c.a+'"/></g>'+
    '<rect x="6" y="94" width="88" height="4" rx="2" fill="'+c.fg+'" fill-opacity=".35"/>'; },
  fence:function(c){ var o=''; [6,22,66,82].forEach(function(x){ o+='<path d="M'+x+' 92 V34 L'+(x+6)+' 26 L'+(x+12)+' 34 V92 Z" fill="'+c.a+'"/>'; });
    o+='<rect x="4" y="46" width="92" height="6" fill="'+c.a+'"/><rect x="4" y="74" width="92" height="6" fill="'+c.a+'"/>';
    return o+'<g'+cvA_('cvGate','transform-origin:0% 50%')+'><rect x="38" y="38" width="24" height="52" rx="3" fill="none" stroke="'+c.b+'" stroke-width="5"/></g>'; },
  spark:function(c){ var o='<g'+cvA_('cvSpin','animation-duration:24s')+'>'; for(var k=0;k<12;k++){ var an=k*Math.PI/6, r1=k%2?18:22, r2=k%2?36:46;
      o+='<line x1="'+(50+Math.cos(an)*r1).toFixed(1)+'" y1="'+(50+Math.sin(an)*r1).toFixed(1)+'" x2="'+(50+Math.cos(an)*r2).toFixed(1)+'" y2="'+(50+Math.sin(an)*r2).toFixed(1)+'" stroke="'+(k%2?c.b:c.a)+'" stroke-width="5" stroke-linecap="round"/>'; }
    return o+'</g><circle cx="50" cy="50" r="11" fill="'+c.a+'"'+cvA_('cvPulse')+'/>'; },
  arrowup:function(c){ return '<path d="M50 6 L90 50 H66 V94 H34 V50 H10 Z" fill="'+c.a+'"'+cvA_('cvBob')+'/>'+
    [62,74,86].map(function(y){ return '<line x1="34" y1="'+y+'" x2="66" y2="'+y+'" stroke="'+c.bg+'" stroke-width="3"/>'; }).join(''); },
  multiply:function(c){ var o='', rows=[[50],[26,50,74],[10,22,34,46,58,70,82,90]]; rows[2]=[8,19,30,41,52,63,74,85,96].slice(0,9);
    rows.forEach(function(row,i){ row.forEach(function(x,j){ o+='<circle cx="'+x+'" cy="'+(18+i*32)+'" r="'+(12-i*3.5)+'" fill="'+(i===0?c.a:c.b)+'"'+cvA_('cvGrow','animation-delay:'+(i*0.35+j*0.05).toFixed(2)+'s')+'/>'; }); });
    return o; },
  venn3:function(c){ return '<g'+cvA_('cvSpin','animation-duration:30s')+'><circle cx="50" cy="34" r="26" fill="'+c.a+'" fill-opacity=".85"/><circle cx="34" cy="62" r="26" fill="'+c.b+'" fill-opacity=".8"/><circle cx="66" cy="62" r="26" fill="'+c.c+'" fill-opacity=".8"/></g>'; },
  fork:function(c){ return '<path d="M50 96 V56 C 50 40, 26 36, 18 10" fill="none" stroke="'+c.b+'" stroke-width="7" stroke-linecap="round"/>'+
    '<path d="M50 96 V56 C 50 40, 74 36, 82 10" fill="none" stroke="'+c.a+'" stroke-width="7" stroke-linecap="round" pathLength="100"'+cvA_('cvDraw')+'/><circle cx="82" cy="10" r="7" fill="'+c.a+'"'+cvA_('cvPulse')+'/>'; },
  rise:function(c){ return [20,50,80].map(function(x,i){ var h=34+i*20, y=96-h; return '<g'+cvA_('cvRise','animation-delay:'+(i*0.4)+'s')+'><path d="M'+x+' '+y+' L'+(x+14)+' '+(y+16)+' H'+(x+6)+' V96 H'+(x-6)+' V'+(y+16)+' H'+(x-14)+' Z" fill="'+(i===2?c.a:c.b)+'"/></g>'; }).join(''); },
  checklist:function(c){ return [16,48,80].map(function(y,i){ return '<rect x="8" y="'+(y-11)+'" width="22" height="22" rx="5" fill="none" stroke="'+c.b+'" stroke-width="4"/>'+
    '<path d="M12 '+y+' l5 6 l10 -12" fill="none" stroke="'+c.a+'" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" pathLength="100"'+cvA_('cvDraw','animation-delay:'+(i*0.5)+'s')+'/>'+
    '<rect x="38" y="'+(y-4)+'" width="'+(54-i*10)+'" height="8" rx="4" fill="'+c.b+'" fill-opacity=".5"/>'; }).join(''); },
  mountain:function(c){ return '<path d="M4 94 L40 30 L56 56 L68 40 L96 94 Z" fill="'+c.a+'"/><path d="M40 30 L48 44 L40 40 L33 43 Z" fill="'+c.bg+'" fill-opacity=".7"/>'+
    '<line x1="40" y1="30" x2="40" y2="8" stroke="'+c.fg+'" stroke-width="2.5"/><path d="M40 8 L56 13 L40 19 Z" fill="'+c.b+'"'+cvA_('cvWave','transform-origin:0% 50%')+'/>'; },
  sprout:function(c){ return '<path d="M30 96 V74 C 18 70, 14 56, 18 44 C 22 26, 40 16, 58 18 C 76 20, 86 34, 84 50 C 82 58, 86 62, 90 68 L80 70 V84 L66 86 V96 Z" fill="'+c.b+'"/>'+
    '<g'+cvA_('cvGrowUp','transform-origin:50% 100%')+'><line x1="56" y1="44" x2="56" y2="18" stroke="'+c.a+'" stroke-width="4"/><path d="M56 26 C 44 24, 40 14, 42 8 C 50 8, 56 16, 56 26 Z" fill="'+c.a+'"/><path d="M56 22 C 66 18, 72 8, 70 2 C 62 2, 56 10, 56 22 Z" fill="'+c.a+'"/></g>'; },
  coins:function(c){ var o=''; for(var i=0;i<5;i++) o+='<ellipse cx="40" cy="'+(88-i*10)+'" rx="26" ry="8" fill="'+c.a+'" stroke="'+c.bg+'" stroke-width="2"/>';
    return o+'<g'+cvA_('cvDrop')+'><ellipse cx="74" cy="22" rx="16" ry="16" fill="'+c.a+'"/><text x="74" y="29" text-anchor="middle" font-size="20" font-weight="900" fill="'+c.bg+'" font-family="Arial, sans-serif">$</text></g>'; },
  apple:function(c){ return '<path d="M50 26 C 36 14, 10 20, 12 50 C 14 78, 34 96, 50 88 C 66 96, 86 78, 88 50 C 90 20, 64 14, 50 26 Z" fill="'+c.b+'"/>'+
    '<path d="M50 26 L50 88 C 66 96, 86 78, 88 50 C 90 20, 64 14, 50 26 Z" fill="'+c.a+'"'+cvA_('cvPulse')+'/>'+
    [40,52,64,76].map(function(y){ return '<line x1="52" y1="'+y+'" x2="'+(80-Math.abs(58-y)*0.5).toFixed(0)+'" y2="'+(y-4)+'" stroke="'+c.bg+'" stroke-width="1.6" stroke-opacity=".7"/>'; }).join('')+
    '<path d="M50 26 C 50 18, 54 10, 60 6" fill="none" stroke="'+c.fg+'" stroke-width="3"/>'; },
  basin:function(c){ return '<path d="M12 50 H88 C 86 76, 70 90, 50 90 C 30 90, 14 76, 12 50 Z" fill="'+c.a+'"/>'+
    '<ellipse cx="50" cy="50" rx="38" ry="7" fill="'+c.b+'"/><ellipse cx="50" cy="50" rx="18" ry="3.5" fill="none" stroke="'+c.a+'" stroke-width="1.5"'+cvA_('cvRipple')+'/>'+
    '<path d="M62 8 C 62 22, 78 22, 78 36 C 78 44, 70 46, 66 42" fill="none" stroke="'+c.a+'" stroke-width="6" stroke-linecap="round" stroke-opacity=".7"/>'+
    '<circle cx="50" cy="30" r="3" fill="'+c.b+'"'+cvA_('cvDrip')+'/>'; },
  hammock:function(c){ var palm=function(x, lean){ var tx=x+lean; return '<path d="M'+x+' 96 Q'+(x+lean*0.2)+' 60 '+tx+' 30" fill="none" stroke="'+c.b+'" stroke-width="5" stroke-linecap="round"/>'+
      [-150,-100,-50,-10,30].map(function(r){ return '<ellipse cx="'+tx+'" cy="30" rx="16" ry="4.5" fill="'+c.b+'" transform="rotate('+r+' '+tx+' 30) translate(14 0)"/>'; }).join(''); };
    return '<circle cx="50" cy="18" r="11" fill="'+c.a+'"'+cvA_('cvPulse')+'/>'+palm(10,6)+palm(90,-6)+
      '<g'+cvA_('cvSway','transform-origin:50% 0%')+'><path d="M15 56 C 32 80, 68 80, 85 56" fill="'+c.a+'" fill-opacity=".9" stroke="'+c.a+'" stroke-width="3"/></g>'+
      '<path d="M0 94 Q12 90 24 94 T48 94 T72 94 T100 94" fill="none" stroke="'+c.b+'" stroke-width="2.5" stroke-opacity=".6"/>'; },
  compass:function(c){ var o='<circle cx="50" cy="50" r="42" fill="none" stroke="'+c.a+'" stroke-width="5"/>';
    for(var k=0;k<4;k++) o+='<line x1="50" y1="12" x2="50" y2="20" stroke="'+c.a+'" stroke-width="4" transform="rotate('+(k*90)+' 50 50)"/>';
    return o+'<g'+cvA_('cvSwing')+'><path d="M50 16 L58 50 L50 84 L42 50 Z" fill="'+c.b+'"/><path d="M50 16 L58 50 H42 Z" fill="'+c.a+'"/></g><circle cx="50" cy="50" r="4" fill="'+c.bg+'"/>'; },
  expo:function(c){ var o=''; for(var i=0;i<8;i++){ var h=6+Math.pow(1.48,i)*3.2; o+='<rect x="'+(6+i*11.5)+'" y="'+(94-h).toFixed(1)+'" width="8" height="'+h.toFixed(1)+'" rx="2" fill="'+(i===7?c.a:c.b)+'"'+cvA_('cvGrowUp','transform-origin:50% 100%;animation-delay:'+(i*0.12).toFixed(2)+'s')+'/>'; }
    return o+'<path d="M8 90 C 50 88, 76 70, 92 10" fill="none" stroke="'+c.a+'" stroke-width="3" stroke-dasharray="4 4"/>'; },
  loop:function(c){ var arc=function(a0,a1,col){ var r=36, x0=50+r*Math.cos(a0), y0=50+r*Math.sin(a0), x1=50+r*Math.cos(a1), y1=50+r*Math.sin(a1);
      return '<path d="M'+x0.toFixed(1)+' '+y0.toFixed(1)+' A'+r+' '+r+' 0 0 1 '+x1.toFixed(1)+' '+y1.toFixed(1)+'" fill="none" stroke="'+col+'" stroke-width="10" stroke-linecap="round"/>'+
        '<circle cx="'+x1.toFixed(1)+'" cy="'+y1.toFixed(1)+'" r="8" fill="'+col+'"/>'; };
    return '<g'+cvA_('cvSpin','animation-duration:18s')+'>'+arc(-1.4,0.5,c.a)+arc(0.75,2.65,c.b)+arc(2.9,4.6,c.c)+'</g>'; },
  depth:function(c){ var o=''; for(var i=0;i<6;i++){ var w=88-i*14; o+='<rect x="'+(50-w/2)+'" y="'+(8+i*14)+'" width="'+w+'" height="6" rx="3" fill="'+c.b+'" fill-opacity="'+(0.25+i*0.13).toFixed(2)+'"/>'; }
    return o+'<circle cx="50" cy="92" r="6" fill="'+c.a+'"'+cvA_('cvSink')+'/>'; },
  cointree:function(c){ return '<ellipse cx="50" cy="86" rx="30" ry="9" fill="'+c.b+'"/><ellipse cx="50" cy="80" rx="30" ry="9" fill="'+c.a+'"/>'+
    '<g'+cvA_('cvGrowUp','transform-origin:50% 100%')+'><path d="M50 78 V30" stroke="'+c.b+'" stroke-width="5"/><circle cx="50" cy="24" r="18" fill="'+c.c+'"/><circle cx="34" cy="38" r="12" fill="'+c.c+'"/><circle cx="66" cy="38" r="12" fill="'+c.c+'"/></g>'; },
  tape:function(c){ return '<g'+cvA_('cvWobble')+'><rect x="-10" y="34" width="120" height="32" fill="'+c.a+'" transform="rotate(-12 50 50)"/>'+
    '<path d="M-10 34 l4 4 l-4 4 l4 4 l-4 4 l4 4 l-4 4 l4 4 l-4 4" fill="none" stroke="'+c.bg+'" stroke-width="1.5" transform="rotate(-12 50 50)"/>'+
    '<line x1="-6" y1="44" x2="106" y2="44" stroke="'+c.bg+'" stroke-opacity=".25" stroke-width="1" transform="rotate(-12 50 50)"/></g>'; },
  cow:function(c){ return '<g'+cvA_('cvBob')+'><rect x="18" y="38" width="58" height="30" rx="14" fill="'+c.a+'"/>'+
    '<rect x="22" y="62" width="7" height="24" rx="3" fill="'+c.a+'"/><rect x="36" y="62" width="7" height="24" rx="3" fill="'+c.a+'"/><rect x="56" y="62" width="7" height="24" rx="3" fill="'+c.a+'"/><rect x="66" y="62" width="7" height="24" rx="3" fill="'+c.a+'"/>'+
    '<ellipse cx="80" cy="36" rx="13" ry="10" fill="'+c.a+'"/><ellipse cx="87" cy="40" rx="7" ry="5" fill="'+c.b+'"/><path d="M73 28 l-4 -8 M85 28 l4 -8" stroke="'+c.a+'" stroke-width="3" stroke-linecap="round"/>'+
    '<circle cx="78" cy="33" r="1.8" fill="'+c.fg+'"/><ellipse cx="36" cy="48" rx="8" ry="6" fill="'+c.b+'"/><ellipse cx="58" cy="54" rx="6" ry="5" fill="'+c.b+'"/>'+
    '<path d="M18 46 C 10 46, 8 56, 6 62" fill="none" stroke="'+c.a+'" stroke-width="3" stroke-linecap="round"/></g>'; },
  switchon:function(c){ return '<rect x="10" y="36" width="80" height="34" rx="17" fill="'+c.b+'"/><g'+cvA_('cvToggle')+'><circle cx="73" cy="53" r="13" fill="'+c.a+'"/></g>'+
    [0,1,2,3,4].map(function(k){ var an=-Math.PI*(0.15+k*0.17); return '<line x1="'+(73+Math.cos(an)*20).toFixed(1)+'" y1="'+(53+Math.sin(an)*20).toFixed(1)+'" x2="'+(73+Math.cos(an)*28).toFixed(1)+'" y2="'+(53+Math.sin(an)*28).toFixed(1)+'" stroke="'+c.a+'" stroke-width="3" stroke-linecap="round"'+cvA_('cvBlink','animation-delay:'+(k*0.1)+'s')+'/>'; }).join(''); },
  map:function(c){ return '<path d="M10 90 C 30 90, 20 64, 40 62 S 70 70, 68 46 S 50 22, 80 14" fill="none" stroke="'+c.b+'" stroke-width="4" stroke-dasharray="2 7" stroke-linecap="round"/>'+
    '<path d="M10 90 C 30 90, 20 64, 40 62 S 70 70, 68 46 S 50 22, 80 14" fill="none" stroke="'+c.a+'" stroke-width="4" stroke-linecap="round" pathLength="100"'+cvA_('cvDraw')+'/>'+
    '<path d="M74 8 L86 20 M86 8 L74 20" stroke="'+c.a+'" stroke-width="5" stroke-linecap="round"/><circle cx="10" cy="90" r="6" fill="'+c.fg+'"/>'; },
  brush:function(c){ return '<path d="M8 70 C 24 40, 40 76, 56 46 S 84 30, 94 22" fill="none" stroke="'+c.a+'" stroke-width="14" stroke-linecap="round" pathLength="100"'+cvA_('cvDraw')+'/>'+
    '<path d="M50 10 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" fill="'+c.b+'"'+cvA_('cvPulse')+'/>'; },
  steps:function(c){ return '<path d="M6 94 V78 H26 V62 H46 V46 H66 V30 H86 V94 Z" fill="'+c.b+'"/><g'+cvA_('cvBob')+'><circle cx="76" cy="10" r="7" fill="'+c.a+'"/><rect x="71" y="17" width="10" height="13" rx="4" fill="'+c.a+'"/></g>'; },
  brokenline:function(c){ return '<g'+cvA_('cvTiltL','transform-origin:100% 50%')+'><rect x="4" y="44" width="40" height="12" rx="3" fill="'+c.a+'"/>'+[12,22,32].map(function(x){ return '<line x1="'+x+'" y1="44" x2="'+x+'" y2="50" stroke="'+c.bg+'" stroke-width="2"/>'; }).join('')+'</g>'+
    '<g'+cvA_('cvTiltR','transform-origin:0% 50%')+'><rect x="56" y="44" width="40" height="12" rx="3" fill="'+c.a+'"/>'+[64,74,84].map(function(x){ return '<line x1="'+x+'" y1="44" x2="'+x+'" y2="50" stroke="'+c.bg+'" stroke-width="2"/>'; }).join('')+'</g>'+
    '<path d="M50 30 l2 8 M50 70 l-2 -8 M42 34 l4 6 M58 66 l-4 -6" stroke="'+c.b+'" stroke-width="3" stroke-linecap="round"'+cvA_('cvBlink')+'/>'; },
  bridge:function(c){ return '<path d="M4 70 Q50 10 96 70" fill="none" stroke="'+c.a+'" stroke-width="7"/><rect x="4" y="68" width="92" height="7" fill="'+c.a+'"/>'+
    [20,35,50,65,80].map(function(x){ var y=70-((1-Math.pow((x-50)/46,2))*60*0.5); return '<line x1="'+x+'" y1="'+y.toFixed(1)+'" x2="'+x+'" y2="68" stroke="'+c.a+'" stroke-width="2.5"/>'; }).join('')+
    '<g'+cvA_('cvMeetL')+'><circle cx="36" cy="54" r="5" fill="'+c.b+'"/><rect x="32" y="59" width="8" height="9" rx="3" fill="'+c.b+'"/></g>'+
    '<g'+cvA_('cvMeetR')+'><circle cx="64" cy="54" r="5" fill="'+c.fg+'"/><rect x="60" y="59" width="8" height="9" rx="3" fill="'+c.fg+'"/></g>'+
    '<path d="M0 86 Q12 82 24 86 T48 86 T72 86 T100 86" fill="none" stroke="'+c.a+'" stroke-width="2.5" stroke-opacity=".5"/>'; },
  angkor:function(c){ var tower=function(x,w,h){ return '<path d="M'+(x-w/2)+' 82 V'+(82-h*0.45)+' Q'+x+' '+(82-h*1.15)+' '+(x+w/2)+' '+(82-h*0.45)+' V82 Z" fill="'+c.b+'"/>'; };
    return '<circle cx="50" cy="40" r="20" fill="'+c.a+'"'+cvA_('cvSunrise')+'/>'+tower(18,12,34)+tower(34,14,44)+tower(50,18,62)+tower(66,14,44)+tower(82,12,34)+
      '<rect x="4" y="80" width="92" height="8" fill="'+c.b+'"/><rect x="0" y="88" width="100" height="10" fill="'+c.b+'" fill-opacity=".45"/>'; },
  /* YWAM classics (Oct 2026) */
  waves:function(c){ var o='<path d="M8 40 C 14 22, 36 20, 40 34 S 30 58, 18 56 S 4 52, 8 40 Z" fill="'+c.b+'" fill-opacity=".3"/><path d="M56 22 C 70 14, 92 22, 90 40 S 76 62, 64 56 S 46 30, 56 22 Z" fill="'+c.b+'" fill-opacity=".3"/>';
    for(var k=0;k<3;k++){ var y=62+k*12; o+='<path d="M-6 '+y+' Q 6 '+(y-9)+' 18 '+y+' T 42 '+y+' T 66 '+y+' T 90 '+y+' T 114 '+y+'" fill="none" stroke="'+c.a+'" stroke-width="'+(6-k*1.5)+'" stroke-linecap="round"'+(k===1?' stroke-opacity=".7"':k===2?' stroke-opacity=".45"':'')+cvA_(k%2?'cvNudgeL':'cvNudgeR','animation-delay:-'+(k*0.8)+'s')+'/>'; }
    return o; },
  edge:function(c){ return '<path d="M-2 98 V54 H38 L42 98 Z" fill="'+c.b+'"/><path d="M66 98 L70 64 H102 V98 Z" fill="'+c.b+'" fill-opacity=".55"/>'+
    '<path d="M36 44 Q 54 14 76 52" fill="none" stroke="'+c.a+'" stroke-width="3" stroke-dasharray="3 6" stroke-linecap="round"/>'+
    '<g'+cvA_('cvBob')+'><circle cx="28" cy="34" r="6" fill="'+c.a+'"/><rect x="23" y="41" width="10" height="13" rx="4" fill="'+c.a+'"/></g>'+
    '<circle cx="84" cy="18" r="9" fill="'+c.a+'" fill-opacity=".5"'+cvA_('cvPulse')+'/>'; },
  crown:function(c){ return '<g'+cvA_('cvBob')+'><path d="M24 54 L28 22 L40 38 L50 16 L60 38 L72 22 L76 54 Z" fill="'+c.a+'"/><rect x="24" y="54" width="52" height="8" rx="2" fill="'+c.a+'"/>'+
    '<circle cx="50" cy="44" r="4" fill="'+c.b+'"/></g>'+
    '<path d="M8 74 Q 26 96 48 80 M92 74 Q 74 96 52 80" fill="none" stroke="'+c.b+'" stroke-width="6" stroke-linecap="round"/>'; },
  openbook:function(c){ var o=''; for(var k=0;k<7;k++){ var an=Math.PI*(0.15+k*0.7/6); o+='<line x1="'+(50-Math.cos(an)*20).toFixed(1)+'" y1="'+(46-Math.sin(an)*20).toFixed(1)+'" x2="'+(50-Math.cos(an)*42).toFixed(1)+'" y2="'+(46-Math.sin(an)*42).toFixed(1)+'" stroke="'+c.a+'" stroke-width="4" stroke-linecap="round"/>'; }
    return '<g'+cvA_('cvPulse')+'>'+o+'</g><path d="M50 58 Q 30 48 8 52 V88 Q 30 84 50 94 Z" fill="'+c.b+'"/><path d="M50 58 Q 70 48 92 52 V88 Q 70 84 50 94 Z" fill="'+c.b+'" fill-opacity=".8"/>'+
      '<path d="M16 62 Q 30 60 42 66 M16 72 Q 30 70 42 76 M58 66 Q 70 60 84 62 M58 76 Q 70 70 84 72" stroke="'+c.bg+'" stroke-width="2" fill="none"/>'; },
  flame:function(c){ return '<circle cx="50" cy="58" r="38" fill="'+c.a+'" fill-opacity=".14"'+cvA_('cvPulse')+'/>'+
    '<g'+cvA_('cvFlick')+'><path d="M50 10 C 64 30, 76 42, 76 62 C 76 78, 64 90, 50 90 C 36 90, 24 78, 24 62 C 24 46, 38 38, 50 10 Z" fill="'+c.a+'"/>'+
    '<path d="M50 46 C 58 58, 64 64, 64 74 C 64 82, 58 88, 50 88 C 42 88, 36 82, 36 74 C 36 64, 44 60, 50 46 Z" fill="'+c.b+'"/></g>'; },
  incense:function(c){ var o=''; for(var k=0;k<3;k++){ var x=34+k*16; o+='<path d="M'+x+' 62 C '+(x-8)+' 50, '+(x+8)+' 40, '+x+' 28 S '+(x-6)+' 12, '+(x+2)+' 4" fill="none" stroke="'+c.a+'" stroke-width="4" stroke-linecap="round"'+(k===1?'':' stroke-opacity=".6"')+cvA_('cvRise','animation-delay:-'+(k*0.9)+'s')+'/>'; }
    return o+'<path d="M18 66 H82 Q 80 90 50 92 Q 20 90 18 66 Z" fill="'+c.b+'"/><rect x="40" y="90" width="20" height="6" rx="2" fill="'+c.b+'"/>'; },
  heart:function(c){ var h=function(x,y,r){ return 'M'+x+' '+(y+r*0.9)+' C '+(x-r*1.6)+' '+(y-r*0.2)+', '+(x-r*0.9)+' '+(y-r*1.4)+', '+x+' '+(y-r*0.55)+' C '+(x+r*0.9)+' '+(y-r*1.4)+', '+(x+r*1.6)+' '+(y-r*0.2)+', '+x+' '+(y+r*0.9)+' Z'; };
    return '<path d="'+h(50,52,34)+'" fill="'+c.a+'"'+cvA_('cvPulse')+'/><path d="'+h(50,56,12)+'" fill="'+c.b+'"/>'; },
  shield:function(c){ return '<g'+cvA_('cvSway')+'><path d="M50 8 L84 20 V48 C 84 70, 68 84, 50 92 C 32 84, 16 70, 16 48 V20 Z" fill="'+c.a+'"/>'+
    '<rect x="45" y="24" width="10" height="52" rx="2" fill="'+c.b+'"/><rect x="30" y="38" width="40" height="10" rx="2" fill="'+c.b+'"/></g>'; },
  globe:function(c){ return '<circle cx="50" cy="50" r="40" fill="'+c.a+'" fill-opacity=".18"/><circle cx="50" cy="50" r="40" fill="none" stroke="'+c.a+'" stroke-width="5"/>'+
    '<g'+cvA_('cvSpin')+'><ellipse cx="50" cy="50" rx="16" ry="40" fill="none" stroke="'+c.a+'" stroke-width="3"/><ellipse cx="50" cy="50" rx="30" ry="40" fill="none" stroke="'+c.a+'" stroke-width="2.5" stroke-opacity=".6"/></g>'+
    '<path d="M12 36 H88 M12 64 H88" stroke="'+c.a+'" stroke-width="2.5" stroke-opacity=".6"/>'+
    '<g'+cvA_('cvGrowUp','transform-origin:50% 100%')+'><path d="M50 50 V30" stroke="'+c.b+'" stroke-width="4" stroke-linecap="round"/><path d="M50 36 C 40 34, 36 26, 38 20 C 46 22, 50 28, 50 36 Z M50 32 C 58 28, 64 22, 64 16 C 56 16, 50 22, 50 32 Z" fill="'+c.b+'"/></g>'; },
  fight:function(c){ var o='', L='FIGHT';
    for(var k=0;k<5;k++){ var x=6+k*18.5, h=26+k*13;
      o+='<g'+cvA_('cvGrowUp','transform-origin:50% 100%;animation-delay:'+(k*0.18).toFixed(2)+'s')+'><rect x="'+x+'" y="'+(94-h)+'" width="14" height="'+h+'" rx="3" fill="'+(k===4?c.b:c.a)+'"/></g>'+
        '<text x="'+(x+7)+'" y="'+(94-h-4)+'" text-anchor="middle" font-family="Koulen, sans-serif" font-size="15" fill="'+c.a+'">'+L[k]+'</text>'; }
    return o; },
  pair:function(c){ var p=function(x,col,d){ return '<g'+cvA_('cvBob','animation-delay:'+d+'s')+'><circle cx="'+x+'" cy="40" r="11" fill="'+col+'"/><path d="M'+(x-16)+' 92 V70 Q '+(x-16)+' 54 '+x+' 54 Q '+(x+16)+' 54 '+(x+16)+' 70 V92 Z" fill="'+col+'"/></g>'; };
    return '<path d="M10 30 Q 50 -6 90 30" fill="none" stroke="'+c.a+'" stroke-width="4" stroke-linecap="round" stroke-opacity=".6"/>'+p(32,c.a,0)+p(68,c.b,-1.5); }
};
function libPal_(){ return GP_LIBRARY.palette || {}; }
function libCol_(k, fallback){ var p=libPal_(); return p[k] || k || fallback; }
/* A book's cover. With a `cover` spec it is the book's own (above); without
   one it falls back to the shelf's patterned series cover. */
function libCoverHtml_(b, big){
  var sp=b.cover, title=libTitle_(b), n=title.length;
  if(!sp || !LIB_MOTIFS[sp.motif]) return libCoverSeries_(b, big, title, n);
  var c={ bg:libCol_(sp.bg), fg:libCol_(sp.fg), a:libCol_(sp.a), b:libCol_(sp.b||sp.fg), c:libCol_(sp.c||sp.a), d:libCol_(sp.d||sp.b||sp.fg) };
  var top = sp.layout!=='bottom';
  var place = top ? 'translate(9,56) scale(.82)' : 'translate(9,10) scale(.82)';
  var km = /[\u1780-\u17FF]/.test(title);
  /* As big as the title allows, but never so big that its longest word has to
     break: 82% of the cover's width over that word, by the type's letter width. */
  var font=sp.font||'sans', perChar = font==='display' ? 0.46 : font==='serif' ? (sp.upper?0.66:0.53) : (sp.upper?0.68:0.57);
  var longest=Math.max.apply(null, title.split(/\s+/).map(function(w){ return w.length; }));
  var byLen = n<=8 ? (font==='display'?28:21) : n<=12 ? (font==='display'?20:15.5) : n<=22 ? (font==='display'?15:12.5) : n<=34 ? 10.5 : 9.2;
  var fs = km ? (n<=7 ? 15 : n<=12 ? 12.5 : n<=18 ? 10.5 : n<=28 ? 9.5 : 8.5) : Math.min(byLen, 82/(longest*perChar));   // Khmer: by length — wide glyphs, no spaces to break on
  return '<div class="libCover cv '+(top?'top':'bottom')+(big?' big':'')+'" style="background:'+c.bg+';color:'+c.fg+'">'+
    '<svg class="cvArt" viewBox="0 0 100 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g transform="'+place+'">'+LIB_MOTIFS[sp.motif](c, b)+'</g></svg>'+
    '<div class="cvText"><div class="libCoverTitle cvT-'+font+(sp.upper?' up':'')+(km?' km':'')+'" style="font-size:'+fs.toFixed(2)+'cqw">'+esc(title)+'</div>'+
    '<div class="libCoverAuthor'+(km?' km':'')+'">'+esc(libAuthor_(b))+'</div></div></div>';
}
/* A title whose longest word is still too wide in the type the phone actually
   has (the cover font may not have loaded yet, or ever, offline) steps down
   until it fits — again once the fonts arrive. */
function libFitTitles_(){
  document.querySelectorAll('.libCover.cv .libCoverTitle').forEach(function(t){
    var m=/([\d.]+)cqw/.exec(t.style.fontSize||''); if(!m) return;
    var fs=Number(m[1]), guard=0;
    while(t.scrollWidth > t.clientWidth+1 && fs>5 && guard++<20){ fs*=0.92; t.style.fontSize=fs.toFixed(2)+'cqw'; }
  });
}
if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if(S && S.view==='library') libFitTitles_(); });
/* Covers move only while they are on screen. */
var _libCoverObs=null;
function libLiveCovers_(){
  var all=document.querySelectorAll('.libCover.cv');
  if(!('IntersectionObserver' in window)){ all.forEach(function(el){ el.classList.add('live'); }); return; }
  if(!_libCoverObs) _libCoverObs=new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.classList.toggle('live', e.isIntersecting); }); }, { rootMargin:'40px' });
  all.forEach(function(el){ _libCoverObs.observe(el); });
}
function libCoverSeries_(b, big, title, n){
  var sh=libShelf_(b.shelf), C=GP_LIBRARY.cover||{}, km=/[\u1780-\u17FF]/.test(title);
  return '<div class="libCover'+(big?' big':'')+'" style="background:'+(C.paper||sh.color)+';color:'+(C.ink||sh.ink)+'">'+
    '<div class="libCoverArt" style="background:linear-gradient(155deg,'+sh.color+','+sh.ink+')">'+libMotif_(b)+'</div>'+
    '<div class="libCoverText"><div class="libCoverRule" style="background:'+sh.color+'"></div>'+
    '<div class="libCoverTitle '+(n<=12?'l1':n<=22?'l2':n<=34?'l3':'l4')+(km?' km':'')+'">'+esc(title)+'</div>'+
    '<div class="libCoverAuthor'+(km?' km':'')+'">'+esc(libAuthor_(b))+'</div></div></div>';
}
function libParas_(txt){ return String(txt||'').split(/\n\s*\n/).map(function(x){ return x.trim() ? '<p>'+esc(x.trim())+'</p>' : ''; }).join(''); }
/* The colour a book's tile, page and reader take: its cover's own, else its shelf's. */
function libTint_(b){ return (b.cover && b.cover.bg) ? libCol_(b.cover.bg) : libShelf_(b.shelf).color; }
function libTileHtml_(b, read, prog){
  var sh=libShelf_(b.shelf), steps=b.insights.length+2, at=prog[b.id];
  return '<button class="libTile" data-libbook="'+esc(b.id)+'" aria-label="'+esc(libTitle_(b)+' — '+libAuthor_(b))+'" style="--libc:'+libTint_(b)+'">'+
    '<span class="libTileArt">'+libCoverHtml_(b)+(read[b.id]?'<span class="libReadTag">✓</span>':'')+'</span>'+
    '<span class="libTileTitle">'+esc(libTitle_(b))+'</span><span class="libTileAuthor">'+esc(libAuthor_(b))+'</span>'+
    '<span class="libTileMeta">⏱ '+esc(gpT('{n} min',{n:b.mins||5}))+' · 💡 '+b.insights.length+'</span>'+
    (at && !read[b.id] ? '<span class="libTileBar"><span style="width:'+Math.round(at/(steps-1)*100)+'%"></span></span>' : '')+'</button>';
}
function libRowHtml_(title, books, read, prog, seeAll){
  return '<div class="libSecHead"><h3>'+title+'</h3>'+(seeAll ? '<button class="linkbtn libSeeAll" data-libshelf="'+esc(seeAll)+'">'+esc(t('See all'))+' ('+books.length+')</button>' : '')+'</div>'+
    '<div class="libRow">'+books.map(function(b){ return libTileHtml_(b, read, prog); }).join('')+'</div>';
}
function libraryHtml(){
  var back='<button class="linkbtn" id="libBack" style="text-align:left;text-decoration:none;padding-left:0">← '+esc(S.libBook ? t('Library') : S.libShelf!=='all' ? t('Library') : t('Learn'))+'</button>';
  if(typeof GP_LIBRARY==='undefined'){
    return back+'<h2>📚 '+esc(t('Library'))+'</h2>'+(S.libError
      ? '<div class="card"><p class="sub" style="margin:0 0 10px">'+esc(t('The library could not load. Check your connection and try again.'))+'</p><button class="btn ghost" id="libRetry">'+esc(t('Try again'))+'</button></div>'
      : '<p class="sub">'+esc(t('Loading…'))+'</p>');
  }
  libKmEnsure_();   // a Khmer app shows the Khmer titles, authors and covers as soon as they arrive
  if(S.libBook){
    var b=libById_(S.libBook);
    if(b) return S.libStep!=null ? libReaderHtml_(b) : back+libBookHtml_(b);
    S.libBook=null; S.libStep=null;
  }
  if(libLang_()==='km' && typeof GP_LIBRARY_KM==='undefined' && !S.libKmError) libLoadKm_();   // so Khmer names show on the shelves
  var read=libRead_(), prog=libProg_(), books=GP_LIBRARY.books, picks=libPicks_();
  if(S.libShelf==='start' && !picks.length) S.libShelf='all';
  var readN=books.filter(function(x){ return read[x.id]; }).length;
  var h=back+'<h2>📚 '+esc(t('Library'))+'</h2>'+
    '<p class="sub">'+esc(t('Ten-minute reads of great books on faith, habits, friendships, money and leading — the big ideas, made for young people in Cambodia.'))+'</p>'+
    '<div class="libProgress"><b>'+readN+'</b> / '+books.length+' '+esc(t('read'))+'<span class="libProgressBar"><span style="width:'+Math.round(readN/Math.max(1,books.length)*100)+'%"></span></span></div>'+
    '<div class="libShelves">'+[{id:'all', name:'All'}].concat(picks.length ? [{id:'start', name:'Start here', emoji:'⭐'}] : [], libShelvesShown_()).map(function(sh){
      return '<button class="libShelfBtn'+(S.libShelf===sh.id?' on':'')+'" data-libshelf="'+esc(sh.id)+'"'+(sh.color&&S.libShelf===sh.id?' style="background:'+sh.color+';border-color:'+sh.color+'"':'')+'>'+(sh.emoji?sh.emoji+' ':'')+esc(t(sh.name))+'</button>';
    }).join('')+'</div>';
  if(S.libShelf==='all'){
    var going=books.filter(function(x){ return prog[x.id] && !read[x.id]; });
    if(going.length) h+=libRowHtml_('📖 '+esc(t('Continue reading')), going, read, prog);
    if(picks.length) h+=libRowHtml_('⭐ '+esc(t('Start here')), picks, read, prog, 'start');
    libShelvesShown_().forEach(function(sh){
      h+=libRowHtml_((sh.emoji?sh.emoji+' ':'')+esc(t(sh.name)), books.filter(function(x){ return x.shelf===sh.id; }), read, prog, sh.id);
    });
  } else {
    var shown = S.libShelf==='start' ? picks : books.filter(function(x){ return x.shelf===S.libShelf; });
    if(S.libShelf==='start') h+='<p class="sub libStartNote">'+esc(gpT('{n} books to start with: hearing God, habits, friendships, money and growing as a leader.',{n:picks.length}))+'</p>';
    h+='<div class="libGrid">'+shown.map(function(b){ return libTileHtml_(b, read, prog); }).join('')+'</div>';
  }
  return h+'<p class="pFine">'+esc(t('Summaries written in our own words — not by the authors or publishers. Love one? Read the whole book.'))+'</p>';
}
function libBookHtml_(b){
  var sh=libShelf_(b.shelf), read=libRead_()[b.id], at=libProg_()[b.id], T=libText_(b);
  var list=GP_LIBRARY.books, i=list.indexOf(b), next=list[(i+1)%list.length];
  var h=libKmEnsure_()+'<div class="libHead'+(T.km?' libKm':'')+'" style="--libc:'+libTint_(b)+';--libink:'+sh.ink+'">'+libCoverHtml_(b, true)+
    '<span class="libShelfTag">'+(sh.emoji||'')+' '+esc(t(sh.name))+'</span>'+(b.original?' <span class="libShelfTag">✨ '+esc(t('Original GP guide'))+'</span>':'')+
    '<h2 class="libTitle">'+esc(libTitle_(b))+'</h2><div class="libAuthor">'+esc(libAuthor_(b))+(b.year?' · '+b.year:'')+'</div>'+
    '<div class="libVibe">'+esc(T.vibe)+'</div>'+
    '<div class="libStats"><span>⏱ '+esc(gpT('{n}-minute read',{n:b.mins||5}))+'</span><span>💡 '+esc(gpT('{n} key ideas',{n:b.insights.length}))+'</span>'+(read?'<span>✓ '+esc(t('Read'))+'</span>':'')+'</div></div>';
  h+='<button class="btn libCta" id="libStart" style="background:'+sh.color+';border-color:'+sh.color+'">'+
    esc(at && !read ? gpT('Continue — key idea {n}',{n:Math.min(at, b.insights.length)}) : read ? t('Read again') : '▶ '+t('Start reading'))+'</button>'+
    (libAudioOk_() ? '<button class="btn ghost libListenCta" id="libListenStart">🎧 '+esc(t('Listen'))+'</button>' : '');
  h+='<div class="libSec'+(T.km?' libKm':'')+'"><h3>'+esc(t('What’s it about?'))+'</h3>'+libParas_(T.bigIdea)+'</div>';
  h+='<div class="libSec'+(T.km?' libKm':'')+'"><h3>'+esc(t('What’s inside'))+'</h3><div class="libInside">'+T.insights.map(function(x, k){
    return '<button class="libInsideItem" data-libstep="'+(k+1)+'"><span class="libInsightNum" style="background:'+sh.color+'">'+(k+1)+'</span><span>'+esc(x.emoji||'')+' '+esc(x.title)+'</span><span class="libInsideGo">›</span></button>';
  }).join('')+'</div></div>';
  h+='<div class="card libForUs'+(T.km?' libKm':'')+'" style="border-left-color:'+sh.color+'"><div class="libKicker">🌏 '+esc(t('For you'))+'</div>'+libParas_(T.forUs)+'</div>';
  h+='<div class="btnRow" style="margin-top:14px">'+
    '<button class="btn ghost" id="libMarkRead" data-libid="'+esc(b.id)+'">'+esc(read ? '✓ '+t('Read') : t('Mark as read'))+'</button>'+
    (next && next!==b ? '<button class="btn ghost" data-libbook="'+esc(next.id)+'">'+esc(t('Next book'))+' →</button>' : '')+'</div>';
  return h+'<p class="pFine">'+esc(b.original ? t('An original guide written for GonPreah — not a published book. Every person is different: use it to start conversations, not to put people in boxes.')
    : t('Summary written in our own words — not by the author or publisher.'))+'</p>';
}
/* The FIGHT book's first page also carries the overview the 1-on-1 check-in shows
   (Oct 2026, Uriah): how the five build (OO_FLOW), then each value — its letter,
   statement, three "I…" behaviours, and the verse and what it isn't under a fold.
   Same OO_VALUES text, so the book and the form never drift apart. */
function fightOverviewHtml_(km){
  return '<div class="fightOv" id="fightOv"><div class="libKicker">'+esc(t('FIGHT at a glance'))+'</div>'+
    '<p class="fightFlow">'+esc(km ? OO_FLOW.km : OO_FLOW.en)+'</p>'+
    OO_VALUES.map(function(v){
      return '<div class="fightVal" data-fightval="'+v.id+'"><div class="fightValHead"><b class="ooLetter">'+v.letter+'</b>'+esc(km ? v.km : v.label)+
        '<span class="fightValAlt">'+esc(km ? v.label : v.km)+'</span></div>'+
        '<p class="fightSay">'+esc(km ? v.sayKm : v.say)+'</p>'+
        '<ul class="fightBeh">'+(km ? v.doesKm : v.does).map(function(x){ return '<li>'+esc(x)+'</li>'; }).join('')+'</ul>'+
        '<details class="ooMore fightMore"><summary>📖 '+esc(t('Verse · what it isn’t'))+'</summary>'+
          '<div class="ooVerse">'+esc(km ? v.verseKm : v.verse)+'</div><div class="ooNot">🚧 '+esc(km ? v.notKm : v.not)+'</div></details></div>';
    }).join('')+'</div>';
}
/* One screen per step: 0 the intro, 1…n the key ideas, n+1 the final summary. */
function libReaderHtml_(b){
  var sh=libShelf_(b.shelf), T=libText_(b), n=b.insights.length, last=n+1, k=Math.max(0, Math.min(last, S.libStep|0));
  var segs=''; for(var j=0;j<=last;j++) segs+='<span'+(j<=k?' class="on"':'')+'></span>';
  var h='<div class="libReader" id="libReader" style="--libc:'+libTint_(b)+';--libink:'+sh.ink+'">'+
    '<div class="libReaderTop"><button class="libReaderClose" id="libClose" aria-label="'+esc(t('Close'))+'">✕</button><div class="libSegs">'+segs+'</div>'+libAudioBtnsHtml_()+'</div>'+
    '<div class="libReaderBook"><span>'+esc(libTitle_(b))+' · '+esc(libAuthor_(b))+'</span></div>'+libKmEnsure_()+
    '<div class="libReaderKicker libTurn-'+(S.libDir||'none')+'">'+esc(k===0 ? t('Intro') : k<=n ? gpT('Key idea {n} of {m}',{n:k, m:n}) : t('Final summary'))+'</div><div class="libReaderBody libTurn-'+(S.libDir||'none')+(T.km?' libKm':'')+'">';
  if(k===0) h+='<h2>'+esc(T.vibe)+'</h2>'+libParas_(T.bigIdea)+(b.overview==='fight' ? fightOverviewHtml_(T.km) : '');
  else if(k<=n){ var x=T.insights[k-1]; h+='<div class="libReaderEmoji">'+esc(x.emoji||'')+'</div><h2>'+esc(x.title)+'</h2>'+libParas_(x.body); }
  else h+='<div class="libOneLine" style="background:'+sh.color+'"><span>'+esc(t('In one line'))+'</span>'+esc(T.oneLine)+'</div>'+
    '<div class="libKicker" style="margin-top:20px">✅ '+esc(t('Try this week'))+'</div><ul class="libTry">'+T.tryThis.map(function(x){ return '<li>'+esc(x)+'</li>'; }).join('')+'</ul>'+
    '<div class="libKicker" style="margin-top:18px">🌏 '+esc(t('For you'))+'</div>'+libParas_(T.forUs);
  /* Turning the page is a swipe (or a tap on the page's edge, where a quiet ‹ › sits);
     the only button is Done, on the last page. The first few books opened show how. */
  h+='</div>'+
    (k>0 ? '<button class="libEdge prev" id="libPrev" aria-label="'+esc(t('Back'))+'"><span>‹</span></button>' : '')+
    (k<last ? '<button class="libEdge next" id="libNext" aria-label="'+esc(t('Next'))+'"><span>›</span></button>' : '')+
    (k===last ? '<div class="libReaderNav"><div class="libReaderNavIn"><button class="btn" id="libFinish" style="background:'+sh.color+';border-color:'+sh.color+'">✓ '+esc(t('Done — mark as read'))+'</button></div></div>' : '')+
    (S.libHint ? '<div class="libSwipeHint" id="libSwipeHint" aria-hidden="true"><span class="libSwipeHand">👆</span><span>'+esc(t('Swipe to turn the page'))+'</span></div>' : '')+
    '</div>';
  return h;
}
/* ---------- The Library, read aloud (Oct 2026, Uriah: "an audio function
   for all the books") ----------
   The phone's own voice (speechSynthesis): nothing to download, works offline,
   free. 🎧 reads the screen that is open — its heading, then each paragraph,
   the one being read lit up — and at the end of a step turns the page by
   itself, like Blinkist's audio, until the final summary. Speed is kept on the
   phone (gp-lib-rate). A Khmer book needs a Khmer voice on the phone; without
   one it says so rather than reading Khmer with an English voice. The screen
   is kept awake while it plays where the phone allows (Wake Lock); a locked
   phone stops the voice — that is the phone, not us. */
var LIBA={ on:false, chunks:[], i:0, token:0, wake:null, key:'' };
var LIB_RATES=[0.8, 1, 1.25, 1.5];
function libSpeechOk_(){ return typeof window!=='undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance!=='undefined'; }
/* Off for now (Oct 2026, Uriah: the phone voices — iPhone's above all — are not
   good enough). The player stays, ready: when the books have recorded audio
   (scripts/record-library-audio.mjs), set this to true and 🎧 comes back,
   playing the recordings first and the phone's voice only where there is none. */
var LIB_AUDIO_ON=false;
function libAudioOk_(){ return LIB_AUDIO_ON && (libSpeechOk_() || typeof Audio!=='undefined'); }
/* Recorded audio (scripts/record-library-audio.mjs, Azure voices): which books have it, per
   language — loaded once when the Library opens; a phone without it falls back to
   its own voice. */
S.libAudioIdx=null; S.libAudioIdxLoading=false;
function libAudioIdxLoad_(){ S.libAudioIdx={ en:{}, km:{} }; }   // GonPreah has no recordings (yet)
function libRecFor_(b, lang){ var r=S.libAudioIdx && S.libAudioIdx[lang] && S.libAudioIdx[lang][b.id]; return (r && r.n===b.insights.length+2) ? r : null; }
function libRecUrl_(b, lang, step, rec){ return '/.netlify/functions/audio?lang='+lang+'&book='+encodeURIComponent(b.id)+'&step='+step+'&v='+encodeURIComponent(rec.v||''); }
/* iPhones only let a page start sound from a tap: the first tap plays a moment of
   silence on our one audio element, and every later play() on it is allowed. */
var LIB_SILENCE='data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
function libAudioEl_(){ if(!LIBA.el && typeof Audio!=='undefined'){ LIBA.el=new Audio(); LIBA.el.preload='auto'; } return LIBA.el; }
function libAudioUnlock_(){ var a=libAudioEl_(); if(!a || LIBA.unlocked) return; LIBA.unlocked=true; try { a.src=LIB_SILENCE; var p=a.play(); if(p && p.catch) p.catch(function(){}); } catch(e){} }
function libRate_(){ var r=Number(lsGet('gpa-lib-rate')); return LIB_RATES.indexOf(r)>-1 ? r : 1; }
function libVoice_(km){
  var vs=[]; try { vs=window.speechSynthesis.getVoices()||[]; } catch(e){}
  var want=km ? /^km/i : /^en/i;
  var list=vs.filter(function(v){ return want.test(v.lang||''); });
  if(!list.length) return null;
  // a natural-sounding one where the phone has it
  return list.filter(function(v){ return /natural|enhanced|premium|google|samantha|daniel|karen/i.test(v.name||''); })[0] || list.filter(function(v){ return v.localService; })[0] || list[0];
}
function libAudioBtnsHtml_(){
  if(!libAudioOk_()) return '';
  return '<button class="libListen'+(LIBA.on?' on':'')+'" id="libListen" aria-pressed="'+(LIBA.on?'true':'false')+'" aria-label="'+esc(LIBA.on ? t('Pause') : t('Listen'))+'">'+(LIBA.on?'⏸':'🎧')+'</button>'+
    (LIBA.on ? '<button class="libRate" id="libRate" aria-label="'+esc(t('Speed'))+'">'+libRate_()+'×</button>' : '');
}
/* What's on the screen, in reading order — each piece remembers its element. */
function libAudioChunks_(){
  var root=document.getElementById('libReader'); if(!root) return [];
  var out=[], kick=root.querySelector('.libReaderKicker');
  if(kick) out.push({ el:null, text:kick.textContent });
  root.querySelectorAll('.libReaderBody h2, .libReaderBody p, .libReaderBody li, .libReaderBody .libOneLine, .libReaderBody .libKicker').forEach(function(el){
    var txt=(el.textContent||'').replace(/[✅🌏]/g,'').trim(); if(!txt) return;
    // long paragraphs in sentence-sized pieces: some phones cut a long utterance short
    var parts=txt.match(/[^.!?។៕]+[.!?។៕]*\s*/g) || [txt], cur='';
    parts.forEach(function(sn){ if((cur+sn).length>220 && cur){ out.push({ el:el, text:cur }); cur=''; } cur+=sn; });
    if(cur.trim()) out.push({ el:el, text:cur });
  });
  return out;
}
function libAudioMark_(el){
  document.querySelectorAll('.libSpeaking').forEach(function(x){ x.classList.remove('libSpeaking'); });
  if(el){ el.classList.add('libSpeaking'); var r=el.getBoundingClientRect(); if(r.top<80 || r.bottom>window.innerHeight-110) el.scrollIntoView({ block:'center', behavior:'smooth' }); }
}
function libAudioKey_(){ return S.libBook+'|'+S.libStep+'|'+libLang_(); }
function libAudioPlay_(from){
  if(!libAudioOk_()) return;
  var b=libById_(S.libBook), T=b ? libText_(b) : null;
  if(!b || S.libStep==null){ libAudioStop_(); return; }
  var rec=libRecFor_(b, T.km ? 'km' : 'en');
  if(rec && libAudioEl_() && !LIBA.noRec) return libRecPlay_(b, T.km ? 'km' : 'en', rec);
  if(!libSpeechOk_()){ libAudioStop_(); showMsg(t('This book has no recording yet, and this phone cannot read aloud.')); return; }
  var voice=libVoice_(T.km);
  if(T.km && !voice){ libAudioStop_(); showMsg(t('This phone has no Khmer voice yet. Switch the app to English to listen, or add a Khmer voice in your phone’s settings.')); return; }
  var token=++LIBA.token;
  try { window.speechSynthesis.cancel(); } catch(e){}
  LIBA.on=true; LIBA.chunks=libAudioChunks_(); LIBA.i=Math.max(0, Math.min(LIBA.chunks.length, from|0)); LIBA.key=libAudioKey_();
  if(!LIBA.wake && navigator.wakeLock && navigator.wakeLock.request) navigator.wakeLock.request('screen').then(function(w){ LIBA.wake=w; }, function(){});
  var next=function(){
    if(token!==LIBA.token || !LIBA.on) return;
    if(LIBA.i>=LIBA.chunks.length){
      // the end of this step: turn the page, or stop at the final summary
      var last=b.insights.length+1;
      if(S.libStep<last){ libGo_(S.libStep+1); } else { libAudioStop_(); render(); }
      return;
    }
    var c=LIBA.chunks[LIBA.i++], u=new SpeechSynthesisUtterance(c.text);
    u.lang=T.km ? 'km-KH' : 'en-US'; if(voice) u.voice=voice; u.rate=libRate_();
    u.onend=function(){ setTimeout(next, 120); };
    u.onerror=function(ev){ if(ev && (ev.error==='interrupted' || ev.error==='canceled')) return; setTimeout(next, 120); };
    libAudioMark_(c.el);
    window.speechSynthesis.speak(u);
  };
  next();
}
/* A recorded screen: fetched whole (iPhones play a fetched file, not a stream
   from a function), the next screen fetched ahead, the paragraph lit by how far
   through the file we are, and the lock screen / headphone buttons wired up. */
function libRecPlay_(b, lang, rec){
  var a=libAudioEl_(), token=++LIBA.token, step=S.libStep, last=b.insights.length+1;
  try { if(libSpeechOk_()) window.speechSynthesis.cancel(); } catch(e){}
  LIBA.on=true; LIBA.rec=true; LIBA.key=libAudioKey_(); LIBA.chunks=libAudioChunks_(); LIBA.i=0;
  LIBA.cache=LIBA.cache||{};
  var get=function(k){ var u=libRecUrl_(b, lang, k, rec); if(!LIBA.cache[u]) LIBA.cache[u]=fetch(u).then(function(r){ if(!r.ok) throw new Error('http '+r.status); return r.blob(); }).catch(function(e){ delete LIBA.cache[u]; throw e; }); return LIBA.cache[u]; };
  if(!LIBA.wake && navigator.wakeLock && navigator.wakeLock.request) navigator.wakeLock.request('screen').then(function(w){ LIBA.wake=w; }, function(){});
  get(step).then(function(blob){
    if(token!==LIBA.token) return;
    if(LIBA.url){ try { URL.revokeObjectURL(LIBA.url); } catch(e){} }
    LIBA.url=URL.createObjectURL(blob); a.src=LIBA.url; a.playbackRate=libRate_();
    a.onended=function(){ if(token!==LIBA.token) return; if(S.libStep<last) libGo_(S.libStep+1); else { libAudioStop_(); render(); } };
    a.ontimeupdate=function(){
      if(token!==LIBA.token || !a.duration) return;
      var total=LIBA.chunks.reduce(function(n,c){ return n+c.text.length; },0)||1, at=a.currentTime/a.duration*total, run=0;
      for(var i=0;i<LIBA.chunks.length;i++){ run+=LIBA.chunks[i].text.length; if(run>=at){ if(LIBA.i!==i+1){ LIBA.i=i+1; libAudioMark_(LIBA.chunks[i].el); } break; } }
    };
    var p=a.play(); if(p && p.catch) p.catch(function(){ if(token!==LIBA.token) return; libAudioStop_(); render(); showMsg(t('Tap 🎧 to start listening.')); });
    if(step<last) get(step+1).catch(function(){});   // the next screen, ready before it is needed
    if(navigator.mediaSession && typeof MediaMetadata!=='undefined'){
      var T=libText_(b);
      try { navigator.mediaSession.metadata=new MediaMetadata({ title: step===0 ? libTitle_(b) : step<=b.insights.length ? T.insights[step-1].title : t('Final summary'), artist: libTitle_(b)+' · '+b.author, album: t('GP Library') }); } catch(e){}
      try { navigator.mediaSession.setActionHandler('pause', function(){ libAudioStop_(); render(); });
        navigator.mediaSession.setActionHandler('play', function(){ LIBA.on=true; LIBA.key=''; render(); });
        navigator.mediaSession.setActionHandler('nexttrack', function(){ if(S.libStep<last) libGo_(S.libStep+1); });
        navigator.mediaSession.setActionHandler('previoustrack', function(){ if(S.libStep>0) libGo_(S.libStep-1); }); } catch(e){}
    }
  }, function(){
    // no file after all (deleted, offline): read this screen with the phone's voice instead
    if(token!==LIBA.token) return; LIBA.noRec=true; libAudioPlay_(0); LIBA.noRec=false;
  });
}
function libAudioStop_(){
  LIBA.on=false; LIBA.rec=false; LIBA.token++;
  if(LIBA.el){ try { LIBA.el.pause(); } catch(e){} }
  try { if(libAudioOk_()) window.speechSynthesis.cancel(); } catch(e){}
  if(LIBA.wake){ try { LIBA.wake.release(); } catch(e){} LIBA.wake=null; }
  document.querySelectorAll('.libSpeaking').forEach(function(x){ x.classList.remove('libSpeaking'); });
}
function libAudioBind_(){
  var ls=document.getElementById('libListen');
  if(ls) ls.onclick=function(){ gpTap(); if(LIBA.on){ libAudioStop_(); render(); } else { libAudioUnlock_(); LIBA.on=true; LIBA.key=''; render(); } };
  var rt=document.getElementById('libRate');
  if(rt) rt.onclick=function(){ gpTap(); var r=libRate_(), n=LIB_RATES[(LIB_RATES.indexOf(r)+1)%LIB_RATES.length]; lsSet('gpa-lib-rate', String(n)); rt.textContent=n+'×';
    if(LIBA.on && LIBA.rec && LIBA.el) LIBA.el.playbackRate=n;
    else if(LIBA.on) libAudioPlay_(Math.max(0, LIBA.i-1)); };   // the same sentence again, at the new speed
  var lst=document.getElementById('libListenStart');
  if(lst) lst.onclick=function(){ gpTap(); libAudioUnlock_(); var id=S.libBook, at=libProg_()[id]; LIBA.on=true; LIBA.key=''; libGo_(at && !libRead_()[id] ? at : 0); };
  if(!LIB_AUDIO_ON) return;
  libAudioIdxLoad_();
  if(!LIBA.on || !document.getElementById('libReader')) return;
  if(LIBA.key===libAudioKey_()){
    // the same screen drawn again (a notification, a tap elsewhere): keep reading, light the new copy
    var fresh=libAudioChunks_();
    if(fresh.length===LIBA.chunks.length){ LIBA.chunks=fresh; var c=LIBA.chunks[LIBA.i-1]; libAudioMark_(c && c.el); }
  } else libAudioPlay_(0);   // a new step, or the book switched language
}
function libGo_(step){
  var b=libById_(S.libBook); if(!b) return;
  var was=S.libStep; S.libStep=Math.max(0, Math.min(b.insights.length+1, step));
  S.libDir = was==null ? 'none' : S.libStep>was ? 'next' : S.libStep<was ? 'prev' : 'none';
  /* "Swipe to turn the page": the first three times a book is opened, never again after a first swipe */
  if(was==null){ var seen=Number(lsGet('gpa-lib-swipehint'))||0; S.libHint = seen<3; if(S.libHint) lsSet('gpa-lib-swipehint', String(seen+1)); }
  else S.libHint=false;
  if(!libRead_()[b.id]) libSetProg_(b.id, S.libStep);
  render(); window.scrollTo(0,0);
}
function bindLibrary_(){
  var lb=document.getElementById('libBack');
  if(lb) lb.onclick=function(){ gpTap(); if(S.libBook){ S.libBook=null; S.libStep=null; render(); } else if(S.libShelf!=='all'){ S.libShelf='all'; render(); } else { S.view='grow'; render(); } window.scrollTo(0,0); };
  var lr=document.getElementById('libRetry');
  if(lr) lr.onclick=function(){ libLoad_(); render(); };
  libLiveCovers_(); libFitTitles_();
  var onChip=document.querySelector('.libShelfBtn.on');   // the chosen shelf's chip in view, without moving the page
  if(onChip && onChip.parentNode) onChip.parentNode.scrollLeft=Math.max(0, onChip.offsetLeft-onChip.parentNode.offsetLeft-24);
  document.querySelectorAll('[data-libshelf]').forEach(function(b){ b.onclick=function(){ gpTap(); S.libShelf=b.getAttribute('data-libshelf'); render(); if(b.classList.contains('libSeeAll')) window.scrollTo(0,0); }; });
  document.querySelectorAll('[data-libbook]').forEach(function(b){ b.onclick=function(){ gpTap(); S.libBook=b.getAttribute('data-libbook'); S.libStep=null; render(); window.scrollTo(0,0); }; });
  document.querySelectorAll('[data-libstep]').forEach(function(b){ b.onclick=function(){ gpTap(); libGo_(+b.getAttribute('data-libstep')); }; });
  libAudioBind_();
  var st=document.getElementById('libStart');
  if(st) st.onclick=function(){ gpTap(); var id=S.libBook, at=libProg_()[id]; libGo_(at && !libRead_()[id] ? at : 0); };
  var mr=document.getElementById('libMarkRead');
  if(mr) mr.onclick=function(){ var id=mr.getAttribute('data-libid'), on=!libRead_()[id]; libSetRead_(id, on); if(on) libSetProg_(id, 0); gpTap(); render(); };
  var cl=document.getElementById('libClose');
  if(cl) cl.onclick=function(){ gpTap(); S.libStep=null; render(); window.scrollTo(0,0); };
  var pv=document.getElementById('libPrev'), nx=document.getElementById('libNext'), fin=document.getElementById('libFinish');
  if(pv) pv.onclick=function(){ gpTap(); libGo_(S.libStep-1); };
  if(nx) nx.onclick=function(){ gpTap(); libGo_(S.libStep+1); };
  if(fin) fin.onclick=function(){ gpTap(); libSetRead_(S.libBook, true); libSetProg_(S.libBook, 0); S.libStep=null; render(); window.scrollTo(0,0); };
  var hint=document.getElementById('libSwipeHint');
  if(hint){ var gone=function(){ S.libHint=false; hint.classList.add('out'); };
    setTimeout(gone, 3600); var rr=document.getElementById('libReader'); if(rr) rr.addEventListener('touchstart', gone, { once:true, passive:true }); }
  var rd=document.getElementById('libReader');
  if(rd){   // swipe left for the next screen, right for the one before
    var x0=null, y0=null;
    rd.addEventListener('touchstart', function(e){ x0=e.touches[0].clientX; y0=e.touches[0].clientY; }, { passive:true });
    rd.addEventListener('touchend', function(e){
      if(x0==null) return;
      var dx=e.changedTouches[0].clientX-x0, dy=e.changedTouches[0].clientY-y0; x0=null;
      if(Math.abs(dx)<60 || Math.abs(dx)<Math.abs(dy)*1.5) return;
      var b=libById_(S.libBook); if(!b) return;
      lsSet('gpa-lib-swipehint','3');   // they know now
      if(dx<0 && S.libStep<b.insights.length+1) libGo_(S.libStep+1);
      else if(dx>0 && S.libStep>0) libGo_(S.libStep-1);
    }, { passive:true });
  }
}
function libBooksRead_(){ return Object.keys(libRead_()).length; }
function libOpen_(){ S.view='library'; S.libBook=null; S.libStep=null; S.libShelf='all'; libLoad_(); render(); window.scrollTo(0,0); }

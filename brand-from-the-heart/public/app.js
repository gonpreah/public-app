/*  Brand From the Heart — the app.
    One page, one state object S (saved on the phone in localStorage "bfh-state" and,
    once the student has a personal link, on the server), one render() that draws the
    current view, and one click handler that reads data-act="…" from what was tapped.

    Views: home · quiz · quizResult · gallery · interview · heart · dirs · studio ·
           pack (the brand package) · cls (class: link, sharing, peer feedback)
    Stages (what "My brand" opens): start → interview → heart → directions → refine → finished */
(function () {
  'use strict';
  const B = window.BFH_BRAND;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = B.esc;
  const QS = window.BFH_QUESTIONS || [], SECTIONS = window.BFH_SECTIONS || [], TOT = window.BFH_TOT || [];
  const BRANDS = window.BFH_BRANDS || [], ARCH = window.BFH_ARCHETYPES || [], QUIZ = window.BFH_QUIZ || [];
  const FONTS = window.BFH_FONTS || [], STYLES = window.BFH_FONT_STYLES || [], PALS = window.BFH_PALETTES || [], MOODS = window.BFH_MOODS || [];

  /* ---------------- state ---------------- */
  const KEY = 'bfh-state';
  const fresh = () => ({ v: 1, lang: 'km', id: null, key: null, cls: null, className: null,
    quiz: { answers: {}, result: null }, answers: {}, likes: [], tot: {}, qi: 0,
    heart: null, dirs: [], pick: null, pkg: null, share: { on: false, keys: [] }, job: null, stage: 'start', checks: {} });
  let S = fresh();
  try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(fresh(), JSON.parse(raw)); } catch (e) {}
  const V = { view: 'home', quizI: 0, follow: null, galFilter: 'all', brand: null, tab: 'mix', role: 'primary', fontStyle: null,
    packLang: null, job: null, toast: null, fb: null, people: null, logos: {}, busy: false, dirOpen: {}, mockLang: null, err: null };

  function persist() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  let saveTimer = null;
  function save(now) {
    persist();
    clearTimeout(saveTimer);
    if (!S.id) return;
    saveTimer = setTimeout(syncUp, now ? 0 : 1200);
  }
  function dataOut() { const d = Object.assign({}, S); delete d.key; delete d.id; delete d.job; return d; }
  async function syncUp() {
    if (!S.id) return;
    try {
      const args = { id: S.id, key: S.key, data: dataOut(), stage: S.stage, prog: progress(), name: S.answers.name || '' };
      if (S.stage === 'finished' && S.pick) args.brief = briefSnapshot();
      await api('save', args);
      V.unsynced = false;
    } catch (e) { V.unsynced = true; }
  }

  /* ---------------- words on screen ---------------- */
  const L = (o) => o ? (o[S.lang] || o.en || '') : '';
  function t(k, vars) {
    const e = (window.BFH_T || {})[k];
    let s = e ? (e[S.lang] || e.en) : k;
    if (vars) for (const v in vars) s = s.split('{' + v + '}').join(vars[v]);
    return s;
  }
  window.BFH_t = t;

  /* ---------------- server ---------------- */
  async function api(fn, args) {
    const r = await fetch('/.netlify/functions/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fn, args: args || {} }) });
    let j = {}; try { j = await r.json(); } catch (e) {}
    if (!r.ok || j.error) { const err = new Error(j.error || 'NET'); err.code = j.error || 'NET'; throw err; }
    return j;
  }
  async function ensureAccount() {
    if (S.id) return true;
    try {
      const r = await api('start', { name: S.answers.name || '', code: S.pendingClass || undefined });
      S.id = r.id; S.key = r.key; S.cls = r.cls || null;
      if (r.cls) { try { const c = await api('classInfo', { code: r.cls }); S.className = c.name; } catch (e) {} }
      delete S.pendingClass;
      save(true);
      return true;
    } catch (e) { return false; }
  }
  const myLink = () => S.id ? location.origin + location.pathname.replace(/[^/]*$/, '') + '#me=' + S.id + '.' + S.key : '';

  /* ---------------- progress & stage ---------------- */
  const askable = () => QS;
  function answered(q) {
    if (q.type === 'tot') return TOT.every(p => S.tot[p.id]);
    const a = S.answers[q.id];
    if (Array.isArray(a)) return a.filter(x => String(x || '').trim()).length > 0;
    return a != null && String(a).trim() !== '';
  }
  function progress() {
    let p = 0;
    if (S.quiz.result) p += 5;
    const qs = askable(); p += Math.round(45 * qs.filter(answered).length / Math.max(1, qs.length));
    if (S.heart && S.heart.confirmed) p += 10;
    if (S.dirs.length) p += 10;
    if (S.pick) p += 10;
    if (S.pkg) p += 20;
    return Math.min(100, p);
  }
  function setStage(st) {
    const order = ['start', 'interview', 'heart', 'directions', 'refine', 'finished'];
    if (order.indexOf(st) > order.indexOf(S.stage)) S.stage = st;
  }
  function resumeView() {
    if (V.job && V.job.status !== 'done' && V.job.status !== 'error') return V.job.kind === 'heart' ? 'heart' : ['package', 'plan', 'check'].includes(V.job.kind) ? 'pack' : V.job.kind === 'tidy' ? 'interview' : 'dirs';
    if (S.pkg || S.stage === 'finished') return 'pack';
    if (S.pick) return 'studio';
    if (S.dirs.length) return 'dirs';
    if (S.heart) return 'heart';
    if (S.stage === 'interview' || Object.keys(S.answers).length) return 'interview';
    return S.quiz.result ? 'interview' : 'quiz';
  }

  /* ---------------- the brand as chosen (mix and match + tuning) ---------------- */
  function dirKey() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function choose(i) {
    const d = S.dirs[i];
    S.pick = { pal: i, font: i, words: i, colors: Object.assign({}, d.colors), fontId: d.fontId, tag: 0, custom: null, tune: { warm: 0, bold: 0, modern: 0, playful: 0 } };
    setStage('refine');
  }
  function audience() {
    const a = S.answers;
    return [a.person, a.struggle ? (S.lang === 'km' ? 'ពួកគេជួបការលំបាក៖ ' : 'They struggle with: ') + a.struggle : ''].filter(Boolean).join(' ').slice(0, 500);
  }
  function brandFrom(d, extra) {
    const font = B.fontById(d.fontId);
    return Object.assign({
      title: S.answers.name || t('yourName'), colors: d.colors, font, tagline: (d.taglines || [])[0] || { en: '', km: '' }, taglines: d.taglines,
      personality: d.personality, mission: d.mission, bio: d.bio, whyIPost: d.whyIPost, pillars: d.pillars, captions: d.captions, hashtags: d.hashtags,
      voiceDo: d.voiceDo, voiceDont: d.voiceDont, wordmark: d.wordmark, name: d.name, tune: {}, audience: audience()
    }, extra || {});
  }
  function brand() {
    const P = S.pick; if (!P) return null;
    const dW = S.dirs[P.words] || S.dirs[0];
    const tag = P.custom && (P.custom.en || P.custom.km) ? P.custom : (dW.taglines || [])[P.tag] || (dW.taglines || [])[0] || { en: '', km: '' };
    const taglines = [tag].concat((dW.taglines || []).filter(x => x !== tag));
    return brandFrom(dW, {
      colors: B.tuneColors(P.colors, P.tune), font: B.fontById(P.fontId), tagline: tag, taglines, tune: P.tune,
      name: (S.dirs[P.pal] || dW).name, personality: (S.dirs[P.pal] || dW).personality,
      words: [].concat(S.answers.friends3 || []).filter(Boolean), heart: S.heart, pkg: S.pkg, photo: S.photo || ''
    });
  }
  function brandOpts() { const b = brand(); return Object.assign({}, b, { font: undefined, fontId: b.font.id, pkg: undefined, heart: undefined, photo: undefined }); }
  function briefSnapshot() {
    const b = brand(); if (!b) return null;
    return { title: b.title, tagline: b.tagline, taglines: b.taglines.slice(0, 4), colors: b.colors, fontId: b.font.id, mission: b.mission, personality: b.personality,
      pillars: (b.pillars || []).map(p => p.title), voiceDo: b.voiceDo, voiceDont: b.voiceDont, audience: b.audience, tune: b.tune, prompt: B.universalPrompt(b, 'en') };
  }

  /* ---------------- Claude jobs ---------------- */
  const ERR = { NO_KEY: 'errNoKey', NEED_CLASS: 'errNeedClass', BUSY: 'errBusy', LIMIT_STUDENT: 'errLimit', LIMIT_CLASS: 'errLimit', LIMIT_ALL: 'errLimit', REFUSED: 'errRefused', NET: 'errNet', NO_STUDENT: 'errStudent', TIMEOUT: 'errTimeout', BAD_KEY: 'errNoKey', BUSY_CLAUDE: 'errBusyClaude', CLAUDE_DOWN: 'errBusyClaude' };
  const errText = (code) => t(ERR[code] || 'errGeneric');
  let pollTimer = null;
  async function startJob(kind, opts) {
    if (V.job && (V.job.status === 'queued' || V.job.status === 'running')) { toast(t('errBusy')); return; }
    V.err = null;
    if (!(await ensureAccount())) { V.err = errText('NET'); render(); return; }
    V.job = { kind, opts: opts || {}, status: 'queued', started: Date.now() };
    render();
    try {
      const r = await api('genStart', { id: S.id, key: S.key, kind, opts: opts || {}, data: dataOut() });
      V.job.id = r.job; S.job = { id: r.job, kind, opts: opts || {} }; persist();
      fetch('/.netlify/functions/generate-background', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: S.id, key: S.key, job: r.job }) }).catch(() => {});
      poll();
    } catch (e) {
      V.job = null; V.err = errText(e.code); render();
    }
  }
  function poll() {
    clearTimeout(pollTimer);
    pollTimer = setTimeout(async () => {
      if (!S.job) return;
      try {
        const j = await api('job', { id: S.id, key: S.key, job: S.job.id });
        V.job = Object.assign(V.job || { kind: j.kind, opts: j.opts, started: Date.now() }, { status: j.status, partial: j.partial, id: S.job.id });
        if (j.status === 'done') { applyResult(j.kind, j.opts || {}, j.result); S.job = null; V.job = null; save(true); render(); return; }
        if (j.status === 'error') { S.job = null; V.job = null; V.err = errText(j.error); persist(); render(); return; }
        if (j.partial && V.view === 'dirs') render();
        else updateJobBar();
      } catch (e) { if (e.code === 'NO_JOB') { S.job = null; V.job = null; render(); return; } }
      poll();
    }, 2000);
  }
  function applyResult(kind, opts, r) {
    if (!r) return;
    if (kind === 'heart') { S.heart = { title: r.title, en: r.en, km: r.km, confirmed: false }; setStage('heart'); if (V.view !== 'heart') V.view = 'heart'; }
    if (kind === 'directions') { S.dirs = r.dirs.map(d => Object.assign(d, { key: dirKey() })); S.pick = null; S.pkg = null; setStage('directions'); V.view = 'dirs'; if (r.failed) toast(t('someFailed', { n: r.failed })); }
    if (kind === 'more') { const n = S.dirs.length; r.dirs.forEach(d => S.dirs.push(Object.assign(d, { key: dirKey() }))); V.view = 'dirs'; V.scrollTo = n; toast(t('moreAdded', { n: r.dirs.length })); }
    if (kind === 'refine') {
      const d = S.dirs[opts.dir]; if (!d) return;
      Object.assign(d, r.value);
      if (S.pick) {
        if (r.part === 'palette' && S.pick.pal === opts.dir) S.pick.colors = Object.assign({}, d.colors);
        if (r.part === 'fonts' && S.pick.font === opts.dir) S.pick.fontId = d.fontId;
        if (r.part === 'words' && S.pick.words === opts.dir) { S.pick.tag = 0; S.pick.custom = null; }
      }
      toast(t('refined'));
    }
    if (kind === 'package') { S.pkg = r; setStage('finished'); V.view = 'pack'; }
    if (kind === 'plan') { S.plan = r.days; toast(t('planReady')); }
    if (kind === 'check') { S.lastCheck = Object.assign({ at: Date.now() }, r); V.scrollCheck = true; }
    if (kind === 'tidy' && opts.qid) { S.answers[opts.qid] = r.text; V.tidied = opts.qid; }
  }
  function jobText() {
    const j = V.job; if (!j) return '';
    const secs = Math.round((Date.now() - (j.started || Date.now())) / 1000);
    const n = j.partial ? j.partial.length : 0;
    const base = j.kind === 'directions' ? (n ? t('jobDirsN', { n }) : t('jobDirs')) : t('job_' + j.kind);
    return base + (secs > 4 ? ` · ${secs}s` : '');
  }
  function updateJobBar() { const el = $('#jobbar'); if (el) el.querySelector('span').textContent = jobText(); }

  /* ---------------- small UI bits ---------------- */
  function toast(msg) { V.toast = msg; const el = $('#toast'); if (el) { el.textContent = msg; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2600); } }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast(t('copied')); }
    catch (e) { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast(t('copied')); } catch (x) {} ta.remove(); }
  }
  const swatches = (c, big) => `<div class="sws${big ? ' big' : ''}">${B.ROLES.map(r => `<span title="${r} ${c[r]}" style="background:${c[r]}"></span>`).join('')}</div>`;
  const SPARK = (size, color) => `<svg class="spark" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true"><g stroke="${color || 'currentColor'}" stroke-width="11" stroke-linecap="round"><line x1="50" y1="8" x2="50" y2="92"/><line x1="8" y1="50" x2="92" y2="50"/><line x1="20.3" y1="20.3" x2="79.7" y2="79.7"/><line x1="79.7" y1="20.3" x2="20.3" y2="79.7"/></g></svg>`;
  const ICON = {
    home: '<path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
    gallery: '<path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6 6 18"/>',
    mine: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
    cls: '<circle cx="9" cy="9" r="3.2"/><path d="M3.5 19.5c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6"/><circle cx="17" cy="8.5" r="2.5"/><path d="M15.8 14.2c2.4-.3 4.3 1.1 4.8 3.8"/>'
  };
  const icon = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
  const btn = (act, label, cls, arg) => `<button class="btn ${cls || ''}" data-act="${act}"${arg !== undefined ? ` data-arg="${esc(arg)}"` : ''}>${label}</button>`;
  function fontPreview(f, title) {
    B.loadFont(f);
    return `<div class="fprev"><div style="font-family:${B.ff(f.heading.family, 'serif')};font-weight:${f.heading.weight}">${esc(title || 'Aa Hope')}</div>
      <div style="font-family:${B.ff(f.khHeading.family)};font-weight:${f.khHeading.weight}">សង្ឃឹម</div>
      <small>${esc(f.heading.family)} + ${esc(f.body.family)} · ${esc(f.khHeading.family)} + ${esc(f.khBody.family)}</small></div>`;
  }
  function logoImg(b) {
    const up = V.logos[b.id];
    const src = up || b.logo || b.favicon;
    return `<div class="logo ${b.logoBg === 'dark' ? 'dark' : ''}"><img src="${esc(src)}" alt="${esc(b.name)} logo" loading="lazy" referrerpolicy="no-referrer" data-fallback="${esc(up ? (b.logo || b.favicon) : b.logo ? b.favicon : '')}" data-name="${esc(b.name)}"></div>`;
  }
  function logoCredit(b) {
    return `${t('logoCredit', { owner: esc(b.owner || b.name) })} ${V.logos[b.id] ? t('logoTeacher') : esc(b.logoSource || '')}`;
  }

  /* ---------------- views ---------------- */
  const VIEWS = {};

  VIEWS.home = function () {
    const started = S.quiz.result || Object.keys(S.answers).length || S.dirs.length;
    if (!S.cls) {
      const lc = lastClass();
      return `<section class="hero">
        <div class="hero-spark">${SPARK(116, 'var(--cobalt)')}</div>
        <p class="eyebrow">${t('heroEyebrow')}</p>
        <h1>${t('heroTitleA')} <em>${t('heroTitleB')}</em></h1>
        <p class="hand">${t('heroHand')}</p>
        <p class="lead">${t('signInLead')}</p>
        <div class="stack">
          ${lc ? btn('signInLast', t('signInTo', { name: esc(lc.name) }) + ' →', 'primary big') : ''}
          <div class="signin"><input id="signCode" placeholder="${t('classCode')}" maxlength="6" autocapitalize="characters" autocomplete="off" aria-label="${t('classCode')}"><button class="btn ${lc ? 'ghost' : 'primary'}" data-act="signInCode">${t('signIn')}</button></div>
          <p class="muted small">${t('signInWhy')}</p>
          ${btn('go', (started ? t('continueBrand') : t('tryWithout')) + ' →', 'soft', started ? resumeView() : 'quiz')}
        </div>
      </section>
      ${installCard()}
      <section class="card">
        <p class="eyebrow">${t('howItWorks')}</p>
        <ol class="steps">${['step1', 'step2', 'step3', 'step4', 'step5'].map(k => `<li>${t(k)}</li>`).join('')}</ol>
      </section>
      <section class="card">
        <h3>📂 ${t('haveFile')}</h3>
        <p class="muted small">${t('haveFileWhy')}</p>
        <label class="btn ghost small">${t('loadFile')}<input type="file" accept=".json,application/json" id="loadFile" hidden></label>
      </section>`;
    }
    return `<section class="hero">
        <div class="hero-spark">${SPARK(116, 'var(--cobalt)')}</div>
        <p class="eyebrow">${t('signedInAs', { name: esc(S.answers.name || '…'), cls: esc(S.className || S.cls) })}</p>
        <h1>${t('heroTitleA')} <em>${t('heroTitleB')}</em></h1>
        <p class="hand">${t('heroHand')}</p>
        <p class="lead">${t('homeLead')}</p>
        <div class="stack">
          ${started ? btn('go', t('continueBrand') + ` <small>${progress()}%</small>`, 'primary big', resumeView()) : btn('go', t('startQuiz'), 'primary big', 'quiz')}
          ${started ? '' : btn('go', t('skipQuiz'), 'ghost', 'interview')}
          ${btn('go', t('inspiration') + ' →', 'soft', 'gallery')}
        </div>
      </section>
      ${installCard()}
      <section class="card">
        <p class="eyebrow">${t('howItWorks')}</p>
        <ol class="steps">${['step1', 'step2', 'step3', 'step4', 'step5'].map(k => `<li>${t(k)}</li>`).join('')}</ol>
      </section>
      <section class="card">
        <h3>👥 ${t('yourClass')}</h3>
        ${S.cls ? `<p>${t('inClass', { name: esc(S.className || S.cls) })}</p>` : `<p class="muted">${t('joinWhy')}</p>
          <div class="row"><input id="joinCode" placeholder="${t('classCode')}" maxlength="6" autocapitalize="characters" value="${esc(S.pendingClass || '')}"><button class="btn primary" data-act="join">${t('join')}</button></div>`}
        ${S.id ? `<p class="muted small">${t('linkSaved')}</p>${btn('go', '🔗 ' + t('myLink'), 'ghost small', 'cls')}` : ''}
      </section>
      <section class="card">
        <h3>📂 ${t('haveFile')}</h3>
        <p class="muted small">${t('haveFileWhy')}</p>
        <label class="btn ghost small">${t('loadFile')}<input type="file" accept=".json,application/json" id="loadFile" hidden></label>
      </section>`;
  };

  /* --- the classroom link: new here, or tap your name to come back --- */
  VIEWS.welcome = function () {
    const w = V.welcome || {}, me = S.id && (S.answers.name || '').trim();
    if (!w.roster) return `<section class="hero"><p class="eyebrow">${t('welcomeEyebrow')}</p><h1>${esc(w.code || '')}</h1><p class="lead">${w.err ? esc(w.err) : t('loading')}</p></section>`;
    const r = w.roster;
    let body = '';
    if (w.mode === 'new') {
      body = `<section class="card"><h3>${t('whatName')}</h3><p class="muted small">${t('whatNameWhy')}</p>
        <input id="newName" class="big-in" maxlength="60" placeholder="${t('yourName')}" autocomplete="name">
        <div class="stack">${btn('welcomeStart', t('startMyBrand') + ' →', 'primary big')}${btn('welcomeMode', '← ' + t('back'), 'ghost small', '')}</div></section>`;
    } else if (w.mode === 'back') {
      const pick = w.pick && r.students.find(x => x.id === w.pick);
      body = pick ? `<section class="card"><h3>${t('areYou', { name: esc(pick.name) })}</h3><p class="muted small">${t('areYouWhy')}</p>
          <div class="stack">${btn('welcomeConfirm', t('yesItsMe') + ' →', 'primary big', pick.id)}${btn('welcomePick', t('notMe'), 'ghost small', '')}</div></section>`
        : `<section class="card"><h3>${t('tapYourName')}</h3>
          ${r.students.length > 8 ? `<input id="rosterFilter" class="roster-filter" placeholder="${t('findName')}" autocomplete="off" aria-label="${t('findName')}">` : ''}
          ${r.students.length ? `<div class="roster">${r.students.map(x => `<button class="opt" data-act="welcomePick" data-arg="${esc(x.id)}" data-name="${esc(x.name.toLowerCase())}"><span class="avatar">${esc(x.name.trim().slice(0, 1).toUpperCase())}</span><span>${esc(x.name)}</span><small>${x.prog}%</small></button>`).join('')}</div>` : `<p class="muted">${t('nobodyYet')}</p>`}
          ${btn('welcomeMode', '← ' + t('back'), 'ghost small', '')}</section>`;
    } else {
      body = `<div class="stack">
          ${me ? btn('welcomeContinue', t('continueAs', { name: esc(me) }) + ' →', 'primary big') : ''}
          ${btn('welcomeMode', t('imNew'), me ? 'soft big' : 'primary big', 'new')}
          ${btn('welcomeMode', t('imBack'), 'ghost big', 'back')}
        </div>`;
    }
    return `<section class="hero"><div class="hero-spark">${SPARK(116, 'var(--cobalt)')}</div>
        <p class="eyebrow">${t('welcomeEyebrow')}</p><h1>${esc(r.name)}</h1>
        <p class="lead">${t('welcomeLead')}</p></section>${body}`;
  };
  const LAST = 'bfh-lastclass';
  function rememberClass() { if (S.cls) try { localStorage.setItem(LAST, JSON.stringify({ code: S.cls, name: S.className || S.cls })); } catch (e) {} }
  function lastClass() { try { return JSON.parse(localStorage.getItem(LAST) || 'null'); } catch (e) { return null; } }
  async function openWelcome(code) {
    V.welcome = { code: String(code || '').toUpperCase().slice(0, 6), mode: '' };
    go('welcome');
    try { V.welcome.roster = await api('classRoster', { code: V.welcome.code }); }
    catch (e) { V.welcome.err = t(e.code === 'NO_CLASS' ? 'errClass' : 'errNet'); }
    if (V.view === 'welcome') render();
  }
  async function becomeStudent(id, key, cls, className) {
    const lang = S.lang;
    const r = await api('load', { id, key });
    S = Object.assign(fresh(), r.data || {}, { id, key, cls: r.cls || cls, className: r.className || className, lang });
    if (r.job) S.job = { id: r.job };
    V.fb = r.feedback; persist();
  }

  function installCard() {
    const P = window.BFH_PWA;
    if (!P || P.isStandalone) return '';
    if (P.canInstall) return `<section class="card install"><h3>📲 ${t('installTitle')}</h3><p class="muted small">${t('installWhy')}</p>${btn('install', t('install'), 'primary small')}</section>`;
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) return `<section class="card install"><h3>📲 ${t('installTitle')}</h3><p class="muted small">${t('installIos')}</p></section>`;
    return '';
  }

  /* --- the archetype quiz --- */
  VIEWS.quiz = function () {
    const i = Math.min(V.quizI, QUIZ.length - 1), q = QUIZ[i];
    if (!q) return `<p>${t('errGeneric')}</p>`;
    const chosen = S.quiz.answers[q.id];
    const parts = window.BFH_QUIZ_PARTS || [], part = parts.find(p => p.id === q.part), pi = parts.indexOf(part);
    const firstOfPart = part && (i === 0 || QUIZ[i - 1].part !== q.part);
    return `<div class="qtop"><span>${part ? (part.emoji || '') + ' ' + esc(L(part)) : t('quizTitle')}</span><span>${i + 1} / ${QUIZ.length}</span></div>
      <div class="bar"><i style="width:${(i / QUIZ.length) * 100}%"></i></div>
      ${parts.length ? `<div class="secdots">${parts.map((p, n) => `<i class="${n < pi ? 'done' : n === pi ? 'now' : ''}" title="${esc(L(p))}"></i>`).join('')}</div>` : ''}
      ${firstOfPart && i === 0 ? `<p class="sec-intro">${t('quizIntro')}</p>` : ''}
      <h2 class="q">${esc(L(q.q))}</h2>
      ${q.hint ? `<p class="muted">${esc(L(q.hint))}</p>` : ''}
      <div class="opts">${q.options.map(o => `<button class="opt${chosen === o.id ? ' on' : ''}" data-act="quizPick" data-arg="${esc(o.id)}"><span class="em">${o.emoji || ''}</span>${esc(L(o))}</button>`).join('')}</div>
      <div class="nav">${i > 0 ? btn('quizBack', '← ' + t('back'), 'ghost') : btn('go', '← ' + t('home'), 'ghost', 'home')}</div>`;
  };
  VIEWS.quizResult = function () {
    const r = S.quiz.result; if (!r) return VIEWS.quiz();
    const RS = window.BFH_QUIZ_RESULTS || {}, R = RS[r.top] || {}, A = ARCH.find(a => a.id === r.top) || {};
    const R2 = r.second && r.second !== r.top ? RS[r.second] : null;
    const brands = BRANDS.filter(b => b.archetype === r.top);
    const pct = r.pct || {};
    const mix = Object.keys(pct).sort((a, b) => pct[b] - pct[a]).slice(0, 3).filter(k => pct[k] > 0);
    return `<section class="result">
        <div class="res-em">${A.emoji || '✨'}</div>
        <p class="muted">${t('youAre')}</p>
        <h1>${esc(L(R.title))}</h1>
        ${R2 && R2.blend ? `<p class="blend">${esc(L(R2.blend))}</p>` : ''}
        <p class="lead">${esc(L(R.text))}</p>
      </section>
      ${mix.length ? `<section class="card"><h3>📊 ${t('yourMix')}</h3>${mix.map(k => { const a = ARCH.find(x => x.id === k) || {}; return `<div class="mixbar"><span>${a.emoji || ''} ${esc(L((RS[k] || {}).title) || L(a))}</span><div class="bar"><i style="width:${pct[k]}%"></i></div><b>${pct[k]}%</b></div>`; }).join('')}</section>` : ''}
      <section class="card">
        ${R.strengths ? `<h3>💪 ${t('yourStrengths')}</h3><ul class="ticks">${R.strengths.map(s => `<li>${esc(L(s))}</li>`).join('')}</ul>` : ''}
        ${R.watch ? `<p class="watch">💡 ${esc(L(R.watch))}</p>` : ''}
        ${R.brand ? `<h3>🎨 ${t('brandLooks')}</h3><p>${esc(L(R.brand))}</p>` : ''}
        ${R.content ? `<h3>🎬 ${t('contentIdeas')}</h3><ul class="ticks">${R.content.map(s => `<li>${esc(L(s))}</li>`).join('')}</ul>` : ''}
        ${R.verse ? `<p class="muted">📖 ${esc(R.verse)}</p>` : ''}
      </section>
      <section class="card"><h3>${t('brandsLikeYou', { a: esc(L(A)) })}</h3>
        <div class="mini-brands">${brands.map(b => `<button class="mini-brand" data-act="brand" data-arg="${b.id}">${logoImg(b)}<span>${esc(b.name)}</span></button>`).join('')}</div>
        ${btn('gallery', t('seeAll'), 'ghost small', r.top)}
      </section>
      <div class="stack">${btn('go', t('startInterview') + ' →', 'primary big', 'interview')}${btn('quizRedo', t('quizAgain'), 'ghost')}</div>`;
  };

  /* --- the Inspiration gallery --- */
  VIEWS.gallery = function () {
    const f = V.galFilter, list = BRANDS.filter(b => f === 'all' || (f === 'liked' ? S.likes.includes(b.id) : b.archetype === f));
    return `<h2>💡 ${t('inspiration')}</h2>
      <p class="note">🌱 ${t('dontCopy')}</p>
      <div class="chips scroll">
        <button class="chip${f === 'all' ? ' on' : ''}" data-act="galFilter" data-arg="all">${t('all')}</button>
        <button class="chip${f === 'liked' ? ' on' : ''}" data-act="galFilter" data-arg="liked">❤ ${t('liked')} (${S.likes.length})</button>
        ${ARCH.map(a => `<button class="chip${f === a.id ? ' on' : ''}" data-act="galFilter" data-arg="${a.id}">${a.emoji} ${esc(L(a))}</button>`).join('')}
      </div>
      ${f !== 'all' && f !== 'liked' ? `<p class="muted">${esc(L((ARCH.find(a => a.id === f) || {}).blurb))}</p>` : ''}
      <div class="brand-grid">${list.map(b => `<button class="brand-card" data-act="brand" data-arg="${b.id}">
          ${logoImg(b)}
          <div class="bc-body"><b>${esc(b.name)}</b><small>${esc(L(ARCH.find(a => a.id === b.archetype)))}</small>
          <span class="bc-stands">${esc(L(b.stands))}</span></div>
          <div class="bc-dots">${(b.colours || []).map(h => `<i style="background:${h}"></i>`).join('')}</div>
          ${S.likes.includes(b.id) ? '<span class="liked">❤</span>' : ''}
        </button>`).join('') || `<p class="muted">${t('noLikes')}</p>`}</div>
      <p class="muted small">${t('logosNote')}</p>`;
  };
  function brandSheet() {
    const b = BRANDS.find(x => x.id === V.brand); if (!b) return '';
    const liked = S.likes.includes(b.id), A = ARCH.find(a => a.id === b.archetype) || {};
    const row = (k, v) => `<div class="kv"><span>${t(k)}</span><p>${esc(L(v))}</p></div>`;
    return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-label="${esc(b.name)}">
      <button class="x" data-act="closeSheet" aria-label="${t('close')}">✕</button>
      ${logoImg(b)}
      <p class="credit">${logoCredit(b)}</p>
      <h2>${esc(b.name)}</h2>
      <p class="pill">${A.emoji || ''} ${esc(L(A))}</p>
      ${row('standsFor', b.stands)}${row('feeling', b.feeling)}
      <div class="kv"><span>${t('colourStyle')}</span><p>${esc(L(b.colour))}</p><div class="bc-dots big">${(b.colours || []).map(h => `<i style="background:${h}" title="${h}"></i>`).join('')}</div></div>
      ${row('typeStyle', b.type)}${row('voiceTone', b.voice)}
      <div class="kv lesson"><span>💡 ${t('lesson')}</span><p>${esc(L(b.lesson))}</p></div>
      <div class="stack">
        <button class="btn ${liked ? 'primary' : 'soft'} big" data-act="like" data-arg="${b.id}">${liked ? '❤ ' + t('liked1') : '🤍 ' + t('likeVibe')}</button>
        <a class="btn ghost small" href="${esc(b.brandPage || b.site)}" target="_blank" rel="noopener">${t('officialPage')} ↗</a>
      </div>
      <p class="note small">🌱 ${t('dontCopyShort')}</p>
    </div>`;
  }

  /* --- the heart interview --- */
  function sectionOf(q) { return SECTIONS.find(s => s.id === q.section) || {}; }
  VIEWS.interview = function () {
    const qs = askable(), i = Math.max(0, Math.min(S.qi, qs.length - 1)), q = qs[i];
    const sec = sectionOf(q), first = i === 0 || qs[i - 1].section !== q.section;
    const secIdx = SECTIONS.indexOf(sec);
    let input = '';
    const a = S.answers[q.id];
    if (q.type === 'short') input = `<input class="big-in" data-bind="${q.id}" maxlength="${q.maxLen || 120}" placeholder="${esc(L(q.hint))}" value="${esc(a || '')}">`;
    else if (q.type === 'long') input = `<textarea class="big-in" data-bind="${q.id}" maxlength="${q.maxLen || 800}" rows="5" placeholder="${esc(L(q.hint))}">${esc(a || '')}</textarea>`;
    else if (q.type === 'words3') { const w = Array.isArray(a) ? a : ['', '', '']; input = `<div class="words3">${[0, 1, 2].map(n => `<input data-bind="${q.id}" data-idx="${n}" maxlength="${q.maxLen || 20}" placeholder="${n + 1}" value="${esc(w[n] || '')}">`).join('')}</div>${q.hint ? `<p class="muted small">${esc(L(q.hint))}</p>` : ''}`; }
    else if (q.type === 'chips') { const sel = Array.isArray(a) ? a : []; input = `${q.max ? `<p class="muted small">${t('pickUpTo', { n: q.max })}</p>` : ''}<div class="chips wrap">${q.options.map(o => `<button class="chip big${sel.includes(o.id) ? ' on' : ''}" data-act="chip" data-arg="${q.id}|${o.id}">${esc(L(o))}</button>`).join('')}</div>`; }
    else if (q.type === 'choice') input = `<div class="opts">${q.options.map(o => `<button class="opt${a === o.id ? ' on' : ''}" data-act="choice" data-arg="${q.id}|${o.id}">${esc(L(o))}</button>`).join('')}</div>`;
    else if (q.type === 'tot') input = `<div class="tots">${TOT.map(p => `<div class="tot"><p>${esc(L(p.q))}</p><div class="tot-pair">${['a', 'b'].map(s => totCard(p, s)).join('<span class="or">' + t('or') + '</span>')}</div></div>`).join('')}</div>`;
    const canVoice = q.type === 'long' || q.type === 'short';
    const busyTidy = V.job && V.job.kind === 'tidy';
    const voice = canVoice ? `<div class="voicebar">
        ${btn('mic', V.listening === q.id ? '⏹ ' + t('stopMic') : '🎤 ' + t('speak'), V.listening === q.id ? 'primary small listening' : 'soft small', q.id)}
        ${busyTidy ? `<span class="muted small">✳︎ ${t('job_tidy')}</span>` : String(a || '').trim().length > 8 ? btn('tidy', '✨ ' + t('tidy'), 'ghost small', q.id) : ''}
        ${V.tidied === q.id && V.tidyPrev && !busyTidy ? btn('untidy', '↩ ' + t('undo'), 'ghost small') : ''}
      </div>${V.micHelp === q.id ? `<div class="note small">🎤 ${t('micHelp')}</div>` : ''}` : '';
    const follow = V.follow === q.id && q.follow ? `<div class="follow" role="status">💬 ${esc(L(q.follow))}<div class="row">${btn('followMore', t('addMore'), 'soft small')}${btn('next', t('keepGoing') + ' →', 'ghost small', 'force')}</div></div>` : '';
    return `<div class="qtop"><span>${sec.emoji || ''} ${esc(L(sec))}</span><span>${t('qOf', { i: i + 1, n: qs.length })}</span></div>
      <div class="bar"><i style="width:${Math.round(100 * (i + (answered(q) ? 1 : 0)) / qs.length)}%"></i></div>
      <div class="secdots">${SECTIONS.map((s, n) => `<i class="${n < secIdx ? 'done' : n === secIdx ? 'now' : ''}" title="${esc(L(s))}"></i>`).join('')}</div>
      ${first && sec.intro ? `<p class="sec-intro">${esc(L(sec.intro))}</p>` : ''}
      <h2 class="q">${esc(L(q.q))}${q.optional ? ` <small class="opt-tag">${t('optional')}</small>` : ''}</h2>
      ${q.example ? `<details class="example" open><summary>💡 ${t('exampleAnswer')}</summary><p>${esc(L(q.example))}</p></details>` : ''}
      ${input}
      ${voice}
      ${follow}
      <p class="cheer">✨ ${esc(L(q.cheer))}</p>
      <div class="nav">${btn('prev', '← ' + t('back'), 'ghost')}${btn('next', (i === qs.length - 1 ? t('finishInterview') : t('next')) + ' →', 'primary')}</div>
      ${i > 0 ? `<button class="linkish" data-act="go" data-arg="gallery">💡 ${t('peekInspiration')}</button>` : ''}`;
  };
  function totCard(p, s) {
    const x = p[s], art = x.art, on = S.tot[p.id] === s;
    B.loadFamily(art.font, art.weight);
    return `<button class="tot-card${on ? ' on' : ''}" data-act="tot" data-arg="${p.id}|${s}" style="background:${esc(art.bg)};color:${esc(art.fg)}">
      ${shapeSvg(art.shape, art.fg)}
      <span class="tot-text" style="font-family:${B.ff(art.font)};font-weight:${art.weight || 400}">${esc(art.text)}</span>
      <span class="tot-label">${on ? '✓ ' : ''}${esc(L(x.label))}</span></button>`;
  }
  function shapeSvg(shape, fg) {
    const c = esc(fg);
    const S2 = {
      sun: `<circle cx="70" cy="30" r="16" fill="${c}" opacity=".35"/>`,
      burst: `<polygon points="70,8 76,24 92,20 82,32 94,44 78,44 74,60 66,46 52,52 58,36 46,26 62,24" fill="${c}" opacity=".3"/>`,
      circle: `<circle cx="72" cy="28" r="18" fill="none" stroke="${c}" stroke-width="3" opacity=".45"/>`,
      blob: `<path d="M60 14c14-8 34 2 32 18s-14 26-28 22-18-32-4-40z" fill="${c}" opacity=".28"/>`,
      triangle: `<polygon points="72,8 94,48 50,48" fill="${c}" opacity=".3"/>`,
      lines: `<g stroke="${c}" stroke-width="2" opacity=".35"><line x1="8" y1="14" x2="92" y2="14"/><line x1="8" y1="86" x2="92" y2="86"/></g>`,
      grid: `<g fill="${c}" opacity=".3">${[0, 1, 2, 3].map(r => [0, 1, 2, 3].map(k => `<rect x="${56 + k * 10}" y="${6 + r * 10}" width="6" height="6"/>`).join('')).join('')}</g>`
    };
    return S2[shape] ? `<svg class="tot-shape" viewBox="0 0 100 100" aria-hidden="true">${S2[shape]}</svg>` : '';
  }

  /* --- the heart check --- */
  VIEWS.heart = function () {
    const busy = V.job && V.job.kind === 'heart';
    if (!S.heart) {
      return `<h2>❤ ${t('heartCheck')}</h2><p class="lead">${t('heartWhy')}</p>
        ${busy ? jobCard() : `${V.err ? `<p class="err">${esc(V.err)}</p>` : ''}${btn('makeHeart', '✨ ' + t('makeHeart'), 'primary big')}`}
        ${btn('go', '← ' + t('backToQuestions'), 'ghost', 'interview')}`;
    }
    const h = S.heart;
    return `<h2>❤ ${t('heartCheck')}</h2>
      <p class="muted">${t('heartEdit')}</p>
      ${h.title ? `<h3 class="heart-title">${esc(L(h.title))}</h3>` : ''}
      <label class="lab">English</label>
      <textarea class="heart-in" data-heart="en" rows="8">${esc(h.en)}</textarea>
      <label class="lab">ខ្មែរ</label>
      <textarea class="heart-in km" data-heart="km" rows="8">${esc(h.km)}</textarea>
      ${V.err ? `<p class="err">${esc(V.err)}</p>` : ''}
      ${busy ? jobCard() : `<div class="stack">
        ${btn('confirmHeart', (h.confirmed && S.dirs.length ? '✓ ' + t('seeDirections') : '✓ ' + t('thisIsMe')) + ' →', 'primary big')}
        ${btn('makeHeart', '↻ ' + t('writeAgain'), 'ghost small')}
      </div>`}`;
  };

  /* --- the directions --- */
  function jobCard() {
    return `<div class="jobcard" id="jobbar"><div class="spinner"></div><span>${jobText()}</span><p class="muted small">${t('jobKeepOpen')}</p></div>`;
  }
  function votesFor(d) {
    const fb = V.fb; if (!fb || !fb.share) return 0;
    const i = fb.share.dirs.findIndex(x => x.key === d.key);
    return i < 0 ? 0 : (fb.votes[i] || 0);
  }
  function dirCard(d, i) {
    const b = brandFrom(d), open = V.dirOpen[d.key], v = votesFor(d);
    const lane = { heart: '❤', bold: '⚡', soft: '🌸', khmer: '🏯', wild: '🎲', more: '➕' }[d.lane] || '✨';
    return `<article class="dir" id="dir-${i}">
      <div class="dir-mock" style="font-size:12px">${B.mock('poster', b, S.lang)}</div>
      <div class="dir-body">
        <p class="pill">${lane} ${t('lane_' + (d.lane || 'more'))}${v ? ` · 👍 ${v}` : ''}</p>
        <h3>${esc(L(d.name))}</h3>
        <p>${esc(L(d.personality))}</p>
        ${swatches(d.colors, true)}
        ${fontPreview(b.font, S.answers.name)}
        <ul class="taglines">${(d.taglines || []).slice(0, open ? 8 : 3).map(x => `<li>“${esc(L(x))}”</li>`).join('')}</ul>
        ${open ? dirDetails(d) : ''}
        <div class="row wrap">
          ${btn('choose', '✓ ' + t('chooseThis'), 'primary', i)}
          ${btn('more', '➕ ' + t('moreLikeThis'), 'soft', i)}
          ${btn('dirOpen', open ? t('less') : t('seeAllWords'), 'ghost small', d.key)}
        </div>
      </div></article>`;
  }
  function dirDetails(d) {
    const li = (a) => (a || []).map(x => `<li>${esc(L(x))}</li>`).join('');
    return `<div class="details">
      <div class="kv"><span>${t('bio')}</span><p>${esc(L(d.bio))}</p></div>
      <div class="kv"><span>${t('mission')}</span><p>${esc(L(d.mission))}</p></div>
      <div class="kv"><span>${t('whyIPost')}</span><p>${esc(L(d.whyIPost))}</p></div>
      <div class="kv"><span>${t('pillarsTitle')}</span><ol>${(d.pillars || []).map(p => `<li><b>${esc(L(p.title))}</b> — ${esc(L(p.idea))}</li>`).join('')}</ol></div>
      <div class="kv"><span>${t('captions')}</span><ul class="caps">${li(d.captions)}</ul></div>
      <div class="kv"><span>${t('hashtags')}</span><p class="tags">${esc((d.hashtags || []).join(' '))}</p></div>
      <div class="kv two"><div><span>✓ ${t('voiceDo')}</span><ul>${li(d.voiceDo)}</ul></div><div><span>✗ ${t('voiceDont')}</span><ul>${li(d.voiceDont)}</ul></div></div>
      <div class="kv"><span>${t('whyColours')}</span><p>${esc(L(d.paletteWhy))}</p></div>
      <div class="kv"><span>${t('whyFonts')}</span><p>${esc(L(d.fontWhy))}</p></div>
    </div>`;
  }
  VIEWS.dirs = function () {
    const busy = V.job && (V.job.kind === 'directions' || V.job.kind === 'more');
    const list = S.dirs.length ? S.dirs : (busy && V.job.partial ? V.job.partial.map(d => Object.assign({ key: 'p' + Math.random() }, d)) : []);
    if (!list.length && !busy) {
      return `<h2>🎨 ${t('directions')}</h2><p class="lead">${t('dirsWhy')}</p>${V.err ? `<p class="err">${esc(V.err)}</p>` : ''}
        ${S.heart && S.heart.confirmed ? btn('makeDirs', '✨ ' + t('makeDirs'), 'primary big') : btn('go', t('heartFirst') + ' →', 'primary big', 'heart')}`;
    }
    return `<h2>🎨 ${t('directions')}</h2>
      <p class="muted">${t('dirsPick')}</p>
      ${V.err ? `<p class="err">${esc(V.err)}</p>` : ''}
      ${busy ? jobCard() : ''}
      <div class="dirs">${list.map((d, i) => S.dirs.length ? dirCard(d, i) : `<article class="dir"><div class="dir-mock" style="font-size:12px">${B.mock('poster', brandFrom(d), S.lang)}</div><div class="dir-body"><h3>${esc(L(d.name))}</h3><p>${esc(L(d.personality))}</p>${swatches(d.colors, true)}</div></article>`).join('')}</div>
      ${S.dirs.length && !busy ? `<div class="stack">${btn('makeDirs', '↻ ' + t('makeDirsAgain'), 'ghost small')}</div>` : ''}`;
  };

  /* --- the studio: pick, mix and match, refine, preview --- */
  const TABS = ['mix', 'colours', 'type', 'words', 'tune', 'mockups'];
  VIEWS.studio = function () {
    if (!S.pick) return VIEWS.dirs();
    const b = brand(), P = S.pick;
    const busy = V.job && V.job.kind === 'refine';
    let body = '';
    if (V.tab === 'mix') {
      const row = (k, label) => `<div class="mixrow"><span>${label}</span><div class="mixopts">${S.dirs.map((d, i) => `<button class="mixopt${P[k] === i ? ' on' : ''}" data-act="mix" data-arg="${k}|${i}" title="${esc(L(d.name))}">${k === 'pal' ? swatches(d.colors) : k === 'font' ? `<span style="font-family:${B.ff(B.fontById(d.fontId).heading.family)};font-weight:${B.fontById(d.fontId).heading.weight}">Aa</span>` : '“' + esc(L((d.taglines || [])[0]).slice(0, 18)) + '…”'}<small>${esc(L(d.name)).slice(0, 22)}</small></button>`).join('')}</div></div>`;
      S.dirs.forEach(d => B.loadFont(B.fontById(d.fontId)));
      body = `<p class="muted">${t('mixWhy')}</p>${row('pal', '🎨 ' + t('coloursFrom'))}${row('font', '🔤 ' + t('fontsFrom'))}${row('words', '💬 ' + t('wordsFrom'))}`;
    } else if (V.tab === 'colours') {
      const r = V.role, cur = P.colors[r];
      const sameMood = PALS.filter(p => p.mood === (S.dirs[P.pal] || {}).mood).map(p => p.colors[r]);
      const fromDirs = S.dirs.map(d => d.colors[r]);
      const opts = (arr) => [...new Set(arr)].map(h => `<button class="sw-opt${h === cur ? ' on' : ''}" style="background:${h}" data-act="setColor" data-arg="${h}" title="${h}"></button>`).join('');
      const cTxt = B.contrast(b.colors.text, b.colors.background), cPri = B.contrast(b.colors.primary, b.colors.background);
      body = `<div class="roles">${B.ROLES.map(x => `<button class="role${x === r ? ' on' : ''}" data-act="role" data-arg="${x}"><span style="background:${b.colors[x]}"></span>${t('role_' + x)}<code>${b.colors[x]}</code></button>`).join('')}</div>
        <h4>${t('tintsShades')}</h4><div class="sw-row">${opts([...B.tints(cur).reverse(), cur, ...B.shades(cur)])}</div>
        <h4>${t('sameMood')}</h4><div class="sw-row">${opts(sameMood)}</div>
        <h4>${t('fromDirections')}</h4><div class="sw-row">${opts(fromDirs)}</div>
        <div class="row"><label class="lab">${t('ownColour')}</label><input type="color" value="${cur}" data-color="${r}"><button class="btn ghost small" data-act="resetColors">${t('reset')}</button></div>
        ${cTxt < 4.5 ? `<p class="err">⚠ ${t('lowContrast')}</p>` : ''}${cPri < 2.2 ? `<p class="warn">⚠ ${t('lowPrimary')}</p>` : ''}`;
    } else if (V.tab === 'type') {
      const st = V.fontStyle || B.fontById(P.fontId).style;
      const list = FONTS.filter(f => f.style === st);
      body = `<div class="chips scroll">${STYLES.map(s => `<button class="chip${s.id === st ? ' on' : ''}" data-act="fontStyle" data-arg="${s.id}">${esc(L(s))}</button>`).join('')}</div>
        <div class="fonts">${list.map(f => `<button class="font-opt${f.id === P.fontId ? ' on' : ''}" data-act="setFont" data-arg="${f.id}">${fontPreview(f, S.answers.name)}<small>${esc(L(f.feel))}</small></button>`).join('')}</div>
        <h4>${t('fromDirections')}</h4><div class="chips wrap">${S.dirs.map(d => `<button class="chip${d.fontId === P.fontId ? ' on' : ''}" data-act="setFont" data-arg="${d.fontId}">${esc(L(d.name))}</button>`).join('')}</div>`;
    } else if (V.tab === 'words') {
      const dW = S.dirs[P.words];
      body = `<h4>${t('pickTagline')}</h4><div class="opts">${(dW.taglines || []).map((x, i) => `<button class="opt${!P.custom && P.tag === i ? ' on' : ''}" data-act="tag" data-arg="${i}">“${esc(x.en)}”<small class="km">${esc(x.km)}</small></button>`).join('')}</div>
        <h4>${t('ownTagline')}</h4>
        <input data-custom="en" maxlength="80" placeholder="English" value="${esc(P.custom ? P.custom.en : '')}">
        <input data-custom="km" class="km" maxlength="120" placeholder="ខ្មែរ" value="${esc(P.custom ? P.custom.km : '')}">
        ${dirDetails(dW)}`;
    } else if (V.tab === 'tune') {
      const sl = (k, a, z) => `<div class="slider"><div class="sl-lab"><span>${t(a)}</span><span>${t(z)}</span></div><input type="range" min="-100" max="100" step="5" value="${P.tune[k]}" data-tune="${k}" aria-label="${t(a)} / ${t(z)}"></div>`;
      body = `<p class="muted">${t('tuneWhy')}</p>${sl('warm', 'cool', 'warm')}${sl('bold', 'soft', 'bold')}${sl('modern', 'classic', 'modern')}${sl('playful', 'serious', 'playful')}${btn('tuneReset', t('reset'), 'ghost small')}`;
    } else if (V.tab === 'mockups') {
      const ml = V.mockLang || S.lang;
      body = `${photoPicker()}<div class="chips"><button class="chip${ml === 'en' ? ' on' : ''}" data-act="mockLang" data-arg="en">English</button><button class="chip${ml === 'km' ? ' on' : ''}" data-act="mockLang" data-arg="km">ខ្មែរ</button></div>
        ${[['post', 'mkPost', 16], ['story', 'mkStory', 14], ['poster', 'mkPoster', 15], ['thumb', 'mkThumb', 13], ['header', 'mkHeader', 11]].map(([k, lab, fs]) => `<figure class="mk mk-${k}"><figcaption>${t(lab)}</figcaption><div style="font-size:${fs}px">${B.mock(k, b, ml)}</div></figure>`).join('')}`;
    }
    const refinePart = { mix: null, colours: 'palette', type: 'fonts', words: 'words', tune: null, mockups: null }[V.tab];
    const refineDir = refinePart === 'palette' ? P.pal : refinePart === 'fonts' ? P.font : P.words;
    return `<div class="studio">
      <div class="preview" style="font-size:${(Math.min(300, window.innerHeight * 0.34 * 0.75) / 24).toFixed(1)}px">${B.mock(V.tab === 'mockups' ? 'post' : 'poster', b, V.mockLang || S.lang)}</div>
      <div class="studio-head"><div><b>${esc(b.title)}</b> · ${esc(L(b.name))}</div>${swatches(b.colors)}</div>
      <div class="tabs" role="tablist">${TABS.map(k => `<button role="tab" class="tab${V.tab === k ? ' on' : ''}" data-act="tab" data-arg="${k}">${t('tab_' + k)}</button>`).join('')}</div>
      <div class="tabbody">${body}</div>
      ${refinePart ? `<div class="refine"><h4>🤖 ${t('askClaude')}</h4>${busy ? jobCard() : `<div class="row wrap">${['warmer', 'bolder', 'simpler', 'softer', 'khmer', 'playful'].map(h => btn('refine', t('how_' + h), 'soft small', refinePart + '|' + h + '|' + refineDir)).join('')}</div>`}${V.err ? `<p class="err">${esc(V.err)}</p>` : ''}</div>` : ''}
      <div class="stack">${btn('go', '📦 ' + t('toPackage') + ' →', 'primary big', 'pack')}${btn('go', '← ' + t('allDirections'), 'ghost small', 'dirs')}</div>
    </div>`;
  };

  function photoPicker() {
    return `<div class="photo-pick">${S.photo ? `<img src="${S.photo}" alt="">` : '<span class="ph">📷</span>'}
      <div><label class="btn soft small">${t(S.photo ? 'changePhoto' : 'addPhoto')}<input type="file" accept="image/*" data-photo hidden></label>
      ${S.photo ? btn('photoRemove', t('remove'), 'ghost small') : ''}<p class="muted small">${t('photoWhy')}</p></div></div>`;
  }
  function checkCard() {
    const c = S.lastCheck, busy = V.job && V.job.kind === 'check';
    const deg = c ? Math.round(c.score * 3.6) : 0;
    return `<section class="card" id="checkcard"><p class="eyebrow">${t('checkEyebrow')}</p><h3>🔍 ${t('checkTitle')}</h3><p class="muted small">${t('checkWhy')}</p>
      ${busy ? jobCard() : `<label class="btn primary">${t('checkPick')}<input type="file" accept="image/*" data-checkimg hidden></label>`}
      ${c && !busy ? `<div class="check-res"><div class="ring" style="background:conic-gradient(var(--brand) ${deg}deg, var(--line) 0)"><b>${c.score}</b></div><p class="lead">${esc(L(c.verdict))}</p></div>
        <div class="kv two"><div><span>✓ ${t('checkGood')}</span><ul>${c.good.map(x => `<li>${esc(L(x))}</li>`).join('')}</ul></div><div><span>→ ${t('checkFix')}</span><ol>${c.fix.map(x => `<li>${esc(L(x))}</li>`).join('')}</ol></div></div>
        <div class="kv"><span>${t('palette')}</span><p>${esc(L(c.colours))}</p></div><div class="kv"><span>${t('fonts')}</span><p>${esc(L(c.type))}</p></div><div class="kv"><span>${t('tab_words')}</span><p>${esc(L(c.words))}</p></div>` : ''}
    </section>`;
  }
  function planCard() {
    const busy = V.job && V.job.kind === 'plan', days = S.plan || [];
    return `<section class="card"><p class="eyebrow">${t('planEyebrow')}</p><h3>🗓 ${t('planTitle')}</h3><p class="muted small">${t('planWhy')}</p>
      ${busy ? jobCard() : btn('makePlan', days.length ? '↻ ' + t('planAgain') : '✨ ' + t('planMake'), days.length ? 'ghost small' : 'primary')}
      ${days.length && !busy ? `${btn('copyPlan', '📋 ' + t('copyPlan'), 'soft small')}<ol class="plan">${days.map((d, i) => `<li><div class="plan-head"><b>${t('day')} ${d.day}</b><span class="pill">${esc(d.format)}</span><small class="muted">${esc(d.pillar)}</small></div>
        <p>${esc(L(d.idea))}</p><p class="cap">“${esc(L(d.caption))}” <button class="linkish" data-act="copyDay" data-arg="${i}">${t('copy')}</button></p></li>`).join('')}</ol>` : ''}
    </section>`;
  }
  function logoCard() {
    return `<section class="card"><p class="eyebrow">${t('logoEyebrow')}</p><h3>✍️ ${t('logoFiles')}</h3><p class="muted small">${t('logoFilesWhy')}</p>
      <div class="logo-files">${B.LOGO_KINDS.map(k => `<div class="lf lf-${k}"><div class="logo-prev" data-logo="${k}"></div><button class="btn soft small" data-act="logoDl" data-arg="${k}">⬇ ${t('logo_' + k)}</button></div>`).join('')}</div></section>`;
  }
  function canvaCard() {
    return `<section class="card"><p class="eyebrow">Canva</p><h3>🎨 ${t('canvaTitle')}</h3><ol class="steps">${['canva1', 'canva2', 'canva3', 'canva4'].map(k => `<li>${t(k)}</li>`).join('')}</ol>
      <div class="row wrap">${btn('copyColours', '📋 ' + t('copyColours'), 'soft small')}${btn('copyUni', '📋 ' + t('copyPrompt'), 'soft small')}<a class="btn ghost small" href="https://www.canva.com/brand/" target="_blank" rel="noopener">${t('openCanva')} ↗</a></div></section>`;
  }
  async function fillLogos() {
    const b = brand(); if (!b) return;
    for (const el of document.querySelectorAll('.logo-prev[data-logo]')) {
      if (el.dataset.done === b.title + b.font.id + JSON.stringify(b.colors)) continue;
      const cv = await B.logoCanvas(b, el.dataset.logo);
      el.innerHTML = ''; cv.style.maxWidth = '100%'; cv.style.height = 'auto'; cv.style.maxHeight = '140px'; el.appendChild(cv);
      el.dataset.done = b.title + b.font.id + JSON.stringify(b.colors);
    }
  }

  /* --- the brand package --- */
  VIEWS.pack = function () {
    const b = brand();
    if (!b) return `<h2>📦 ${t('package')}</h2><p class="lead">${t('packFirst')}</p>${btn('go', t('directions') + ' →', 'primary big', S.dirs.length ? 'dirs' : resumeView())}`;
    const pl = V.packLang || S.lang, pk = S.pkg, busy = V.job && V.job.kind === 'package';
    const pre = (id, text) => `<pre class="copybox" id="${id}">${esc(text)}</pre>`;
    const promptCard = (p, i, kind) => `<div class="pcard"><div class="pc-head"><b>${i + 1}. ${esc(L(p.title))}</b>${btn('copyPrompt', t('copy'), 'soft small', kind + '|' + i)}</div><p class="muted small">${esc(L(p.use))}</p><pre class="copybox small">${esc(p.prompt)}</pre></div>`;
    const checks = ['chk1', 'chk2', 'chk3', 'chk4', 'chk5', 'chk6'];
    return `<h2>📦 ${t('package')}</h2>
      <section class="brief" style="--p:${b.colors.primary};--bg:${b.colors.background};--tx:${b.colors.text};--ac:${b.colors.accent}">
        <div class="brief-top" style="background:${b.colors.primary};color:${B.readableOn(b.colors.primary)}">
          <div style="font-family:${B.ff(b.font.heading.family, 'serif')};font-weight:${b.font.heading.weight};font-size:2em;line-height:1.1">${esc(b.title)}</div>
          <div style="font-family:${B.ff(b.font.heading.family, 'serif')};font-size:1.15em;margin-top:.3em">${esc(b.tagline.en)}</div>
          <div style="font-family:${B.ff(b.font.khHeading.family)};font-size:1.05em">${esc(b.tagline.km)}</div>
        </div>
        <div class="brief-body">
          <div class="kv"><span>${t('mission')}</span><p>${esc(L(b.mission))}</p></div>
          <div class="kv"><span>${t('audience')}</span><p>${esc(b.audience)}</p></div>
          <div class="kv"><span>${t('personalityWords')}</span><p>${esc((b.words || []).join(' · '))} · ${esc(L(b.personality))}</p></div>
          <div class="kv"><span>${t('palette')}</span><div class="hexes">${B.ROLES.map(r => `<button data-act="copyHex" data-arg="${b.colors[r]}"><i style="background:${b.colors[r]}"></i>${t('role_' + r)}<code>${b.colors[r]}</code></button>`).join('')}</div></div>
          <div class="kv"><span>${t('fonts')}</span>${fontPreview(b.font, b.title)}</div>
          <div class="kv"><span>${t('taglines')}</span><ul>${b.taglines.slice(0, 4).map(x => `<li>${esc(x.en)} <span class="km muted">· ${esc(x.km)}</span></li>`).join('')}</ul></div>
          <div class="kv two"><div><span>✓ ${t('voiceDo')}</span><ul>${(b.voiceDo || []).map(x => `<li>${esc(L(x))}</li>`).join('')}</ul></div><div><span>✗ ${t('voiceDont')}</span><ul>${(b.voiceDont || []).map(x => `<li>${esc(L(x))}</li>`).join('')}</ul></div></div>
          <div class="kv"><span>${t('howWithClaude')}</span>${pre('projblock', B.projectBlock(b, pl))}</div>
        </div>
      </section>
      <div class="chips"><button class="chip${pl === 'en' ? ' on' : ''}" data-act="packLang" data-arg="en">English</button><button class="chip${pl === 'km' ? ' on' : ''}" data-act="packLang" data-arg="km">ខ្មែរ</button></div>
      <div class="actions">
        ${btn('copyBrief', '📋 ' + t('copyBrief'), 'primary')}
        ${btn('pdf', '📄 ' + t('downloadPdf'), 'soft')}
        ${btn('kit', '🖼 ' + t('paletteImage'), 'soft')}
        ${btn('json', '💾 ' + t('brandFile'), 'soft')}
      </div>
      <section class="card"><h3>🌍 ${t('aiPrompt')}</h3><p class="muted small">${t('aiPromptWhy')}</p>
        ${pre('uniprompt', B.universalPrompt(b, pl))}${btn('copyUni', '📋 ' + t('copyPrompt'), 'primary')}</section>
      <section class="card"><h3>✨ ${t('packExtras')}</h3>
        ${pk ? '' : `<p class="muted">${t('packExtrasWhy')}</p>`}
        ${V.err ? `<p class="err">${esc(V.err)}</p>` : ''}
        ${busy ? jobCard() : btn('makePack', pk ? '↻ ' + t('makePackAgain') : '✨ ' + t('makePack'), pk ? 'ghost small' : 'primary big')}
      </section>
      ${pk ? `<section class="card"><h3>🎬 ${t('motionPack')}</h3><p class="muted small">${t('motionWhy')}</p>${pk.motion.map((p, i) => promptCard(p, i, 'motion')).join('')}</section>
        <section class="card"><h3>🖼 ${t('posterPack')}</h3><p class="muted small">${t('posterWhy')}</p>${pk.posters.map((p, i) => promptCard(p, i, 'posters')).join('')}</section>
        <section class="card"><h3>✍️ ${t('logoIdeas')}</h3>
          <div class="marks">${[['background', 'primary'], ['primary', 'readable'], ['text', 'background']].map(([bg, fg]) => `<div style="background:${b.colors[bg]};color:${fg === 'readable' ? B.readableOn(b.colors.primary) : b.colors[fg]};font-family:${B.ff(b.font.heading.family, 'serif')};font-weight:${b.font.heading.weight}">${esc(b.title)}</div>`).join('')}</div>
          <ul>${pk.wordmarks.map(w => `<li><b>${esc(L(w.name))}</b> — ${esc(L(w.how))}</li>`).join('')}</ul></section>
        <section class="card"><h3>🎨 ${t('colourRules')}</h3><ul>${pk.colourRules.map(x => `<li>${esc(L(x))}</li>`).join('')}</ul>
          <h3>🔤 ${t('typeTitle')}</h3>
          <div class="hier"><div style="font-family:${B.ff(b.font.heading.family, 'serif')};font-weight:${b.font.heading.weight};font-size:1.8em;color:${b.colors.primary}">${t('sampleHeading')}</div><p class="muted small">${esc(L(pk.typeRules.heading))}</p>
          <div style="font-family:${B.ff(b.font.heading.family, 'serif')};font-size:1.25em">${t('sampleSub')}</div><p class="muted small">${esc(L(pk.typeRules.subheading))}</p>
          <div style="font-family:${B.ff(b.font.body.family)}">${t('sampleBody')}</div><p class="muted small">${esc(L(pk.typeRules.body))}</p></div>
          <div class="kv two"><div><span>✓ ${t('doExamples')}</span><ul>${pk.doExamples.map(x => `<li>${esc(L(x))}</li>`).join('')}</ul></div><div><span>✗ ${t('dontExamples')}</span><ul>${pk.dontExamples.map(x => `<li>${esc(L(x))}</li>`).join('')}</ul></div></div></section>` : ''}
      ${logoCard()}${checkCard()}${planCard()}${canvaCard()}
      <section class="card"><h3>✅ ${t('saveGuide')}</h3>
        <ul class="checklist">${checks.map(k => `<li><label><input type="checkbox" data-check="${k}"${S.checks[k] ? ' checked' : ''}> <span>${t(k)}</span></label></li>`).join('')}</ul></section>
      <section class="card"><h3>👥 ${t('shareClass')}</h3><p class="muted small">${t('shareWhy')}</p>${btn('go', t('openClass') + ' →', 'soft', 'cls')}</section>
      ${btn('go', '← ' + t('backToStudio'), 'ghost small', 'studio')}`;
  };

  /* --- class: personal link, sharing, peer feedback --- */
  VIEWS.cls = function () {
    const link = myLink(), fb = V.fb;
    let share = '';
    if (S.dirs.length) {
      const keys = S.share.keys || [];
      share = `<section class="card"><h3>🙋 ${t('shareMine')}</h3><p class="muted small">${t('shareMineWhy')}</p>
        <div class="opts">${S.dirs.map(d => `<button class="opt${keys.includes(d.key) ? ' on' : ''}" data-act="shareDir" data-arg="${d.key}">${swatches(d.colors)} ${esc(L(d.name))}${votesFor(d) ? ` · 👍 ${votesFor(d)}` : ''}</button>`).join('')}</div>
        <label class="switch"><input type="checkbox" data-act-change="shareOn"${S.share.on ? ' checked' : ''}${keys.length ? '' : ' disabled'}> <span>${t('shareOn')}</span></label>
        ${fb && (fb.comments.length || Object.keys(fb.votes).length) ? `<h4>${t('yourFeedback')}</h4>
          ${fb.share ? `<div class="votes">${fb.share.dirs.map((d, i) => `<div>${swatches(d.colors)} <b>${esc(L(d.name))}</b> — 👍 ${fb.votes[i] || 0}</div>`).join('')}</div>` : ''}
          <ul class="comments">${fb.comments.map(c => `<li><b>${esc(c.name)}</b> ${esc(c.text)}</li>`).join('')}</ul>` : (S.share.on ? `<p class="muted small">${t('noFeedbackYet')}</p>` : '')}
      </section>`;
    }
    const people = V.people;
    const gallery = !S.cls ? '' : `<section class="card"><h3>👀 ${t('classmates')}</h3>
      ${people === null ? `<p class="muted">${t('loading')}</p>` : !people.length ? `<p class="muted">${t('noClassmates')}</p>` : people.map(p => `<div class="mate">
        <h4>${esc(p.name)}</h4>
        <div class="mate-dirs">${p.dirs.map((d, i) => { const bb = brandFrom({ colors: d.colors, fontId: d.fontId, taglines: [d.tagline], name: d.name, personality: d.personality }, { title: p.name, tune: d.tune || {} }); return `<div class="mate-dir"><div style="font-size:8px">${B.mock('post', bb, S.lang)}</div><b>${esc(L(d.name))}</b><small>${esc(L(d.personality))}</small>
          <button class="btn ${p.myVote === i ? 'primary' : 'soft'} small" data-act="vote" data-arg="${p.id}|${i}">${p.myVote === i ? '👍 ' + t('myPick') : t('voteThis')}</button></div>`; }).join('')}</div>
        ${p.myComments.length ? `<ul class="comments mine">${p.myComments.map(c => `<li>${esc(c.text)}${c.hidden ? ` <small class="muted">(${t('hidden')})</small>` : ''} <button class="linkish" data-act="uncomment" data-arg="${p.id}|${c.id}">${t('remove')}</button></li>`).join('')}</ul>` : ''}
        ${p.myComments.length < 3 ? `<div class="encourage">${['enc1', 'enc2', 'enc3', 'enc4'].map(k => `<button class="chip" data-act="encourage" data-arg="${p.id}|${k}">${t(k)}</button>`).join('')}</div>
        <div class="row"><input data-comment="${p.id}" maxlength="160" placeholder="${t('commentPh')}"><button class="btn soft small" data-act="comment" data-arg="${p.id}">${t('send')}</button></div>` : ''}
      </div>`).join('')}</section>`;
    const me = S.cls ? `<section class="card whoami"><span class="avatar">${esc((S.answers.name || '?').trim().slice(0, 1).toUpperCase())}</span>
        <div><b>${esc(S.answers.name || '')}</b><small class="muted">${esc(S.className || S.cls)} · ${t('savedToAccount')}</small></div>
        ${btn('signOut', t('signOut'), 'ghost small')}</section>` : '';
    return `<h2>👥 ${t('classTitle')}</h2>
      ${me}${boardCard()}
      <section class="card"><h3>🔗 ${t('myLink')}</h3>
        ${link ? `<p class="muted small">${t('myLinkWhy')}</p><pre class="copybox small">${esc(link)}</pre>${btn('copyLink', '📋 ' + t('copyLink'), 'primary small')}` : `<p class="muted small">${t('noLinkYet')}</p>${btn('makeLink', t('makeLink'), 'primary small')}`}
      </section>
      <section class="card"><h3>🏫 ${t('yourClass')}</h3>
        ${S.cls ? `<p>${t('inClass', { name: esc(S.className || S.cls) })}</p>${btn('switchUser', t('notYou'), 'ghost small')}` : `<p class="muted small">${t('joinWhy')}</p>`}
        <div class="row"><input id="joinCode" placeholder="${t('classCode')}" maxlength="6" autocapitalize="characters"><button class="btn ${S.cls ? 'ghost' : 'primary'} small" data-act="join">${S.cls ? t('changeClass') : t('join')}</button></div>
      </section>
      ${share}${gallery}`;
  };

  /* ---------------- render ---------------- */
  const NAV = [['home', '🏠', 'navHome'], ['gallery', '💡', 'navInspire'], ['mine', '❤', 'navBrand'], ['cls', '👥', 'navClass']];
  function render() {
    document.documentElement.lang = S.lang === 'km' ? 'km' : 'en';
    document.body.classList.toggle('km', S.lang === 'km');
    const view = VIEWS[V.view] ? V.view : 'home';
    const animKey = view + ':' + (view === 'quiz' ? V.quizI : view === 'interview' ? S.qi : '');
    document.body.classList.toggle('still', V.animKey === animKey);
    V.animKey = animKey;
    const active = view === 'home' ? 'home' : view === 'gallery' ? 'gallery' : view === 'cls' ? 'cls' : 'mine';
    $('#app').innerHTML = `<header class="top"><button class="brandmark" data-act="go" data-arg="home">${SPARK(22, 'var(--brand)')}<span>${t('appName')}</span></button>
        <div class="lang" role="group" aria-label="Language / ភាសា"><button class="${S.lang === 'km' ? 'on' : ''}" data-act="lang" data-arg="km">ខ្មែរ</button><button class="${S.lang === 'en' ? 'on' : ''}" data-act="lang" data-arg="en">EN</button></div></header>
      ${navigator.onLine === false ? `<div class="offline" role="status">${t('offline')}</div>` : ''}
      <main id="main" class="v-${view}">${VIEWS[view]()}</main>
      ${V.brand ? brandSheet() : ''}
      <nav class="bottom">${NAV.map(([k, em, lab]) => `<button class="${active === k ? 'on' : ''}" data-act="nav" data-arg="${k}"${active === k ? ' aria-current="page"' : ''}>${icon(k)}${t(lab)}</button>`).join('')}</nav>
      <div id="toast" class="toast"></div>`;
    document.title = t('appName');
    if (view === 'pack') setTimeout(fillLogos, 0);
    if (V.scrollCheck && view === 'pack') { V.scrollCheck = false; setTimeout(() => { const el = $('#checkcard'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 60); }
    if (V.scrollTo !== undefined) { const el = $('#dir-' + V.scrollTo); V.scrollTo = undefined; if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50); }
  }
  function go(view) {
    V.err = null; V.follow = null;
    if (view === 'mine') view = resumeView();
    if (view === 'interview' && S.stage === 'start') { setStage('interview'); save(); }
    if (view === 'cls') loadClass();
    if (view === 'heart' && !S.heart && !(V.job && V.job.kind === 'heart') && S.id && S.cls) setTimeout(() => startJob('heart'), 0);
    V.view = view; render(); window.scrollTo(0, 0);
  }
  const STAGE_KEYS = ['start', 'interview', 'heart', 'directions', 'refine', 'finished'];
  function boardCard() {
    if (!S.cls) return '';
    const bd = V.board;
    if (!bd) return `<section class="card"><p class="eyebrow">${t('ourClass')}</p><p class="muted">${t('loading')}</p></section>`;
    const done = bd.students.filter(x => x.stage === 'finished').length;
    return `<section class="card board"><p class="eyebrow">${t('ourClass')}</p>
      <h3>${t('boardTitle', { n: bd.students.length, done })}</h3>
      <p class="muted small">${t('boardPrivacy')}</p>
      <ol class="board-list">${bd.students.map(x => {
        const A = ARCH.find(a => a.id === x.arch), c = x.brand && x.brand.colors;
        return `<li class="${x.me ? 'me' : ''}">
          <span class="avatar" ${c ? `style="background:${esc(c.primary)};color:${B.readableOn(c.primary)}"` : ''}>${esc(x.name.trim().slice(0, 1).toUpperCase())}</span>
          <div class="bl-main"><div class="bl-top"><b>${esc(x.name)}${x.me ? ` <small class="muted">· ${t('you')}</small>` : ''}</b>${A ? `<span title="${esc(L(A))}">${A.emoji}</span>` : ''}</div>
            <div class="bl-stage">${STAGE_KEYS.includes(x.stage) ? t('stage_' + x.stage) : ''}</div>
            <div class="bar"><i style="width:${Math.max(2, x.prog)}%"></i></div>
            ${x.brand ? `<div class="bl-brand">${c ? swatches(c) : ''}<span>“${esc(L(x.brand.tagline))}”</span></div>` : ''}
          </div><b class="bl-pct">${x.prog}%</b></li>`;
      }).join('')}</ol></section>`;
  }
  let boardTimer = null;
  async function loadBoard() {
    if (!S.id || !S.cls) return;
    try { V.board = await api('classProgress', { id: S.id, key: S.key }); } catch (e) { return; }
    if (V.view === 'cls' && !(document.activeElement && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName))) render();
  }
  async function loadClass() {
    loadBoard();
    clearInterval(boardTimer);
    boardTimer = setInterval(() => { if (V.view === 'cls' && !document.hidden) loadBoard(); else if (V.view !== 'cls') clearInterval(boardTimer); }, 30000);
    if (!S.id) return;
    try { V.fb = await api('feedback', { id: S.id, key: S.key }); } catch (e) {}
    if (S.cls) { try { V.people = (await api('gallery', { id: S.id, key: S.key })).people; } catch (e) { V.people = []; } }
    if (V.view === 'cls' || V.view === 'dirs') render();
  }

  /* ---------------- actions ---------------- */
  const ACT = {
    go: (a) => go(a), nav: (a) => go(a),
    welcomeMode: (a) => { V.welcome.mode = a; V.welcome.pick = null; render(); if (a === 'new') setTimeout(() => { const el = $('#newName'); if (el) el.focus(); }, 50); },
    welcomePick: (a) => { V.welcome.pick = a || null; render(); },
    welcomeConfirm: async (a) => {
      try { const r = await api('signIn', { code: V.welcome.code, sid: a }); await becomeStudent(r.id, r.key, r.cls, r.className); toast(t('welcomeBack', { name: S.answers.name || '' })); rememberClass(); loadLogos(); go(resumeView()); }
      catch (e) { toast(t('errNet')); }
    },
    welcomeStart: async () => {
      const name = (($('#newName') || {}).value || '').trim();
      if (!name) { const el = $('#newName'); if (el) el.focus(); return; }
      try {
        const r = await api('start', { name, code: V.welcome.code });
        const lang = S.lang;
        S = Object.assign(fresh(), { id: r.id, key: r.key, cls: r.cls, className: V.welcome.roster.name, lang });
        S.answers.name = name; save(true); rememberClass(); loadLogos(); go('quiz');
      } catch (e) { toast(t(e.code === 'NO_CLASS' ? 'errClass' : 'errNet')); }
    },
    welcomeContinue: async () => {
      try { const r = await api('join', { id: S.id, key: S.key, code: V.welcome.code }); S.cls = r.cls; S.className = r.className; save(true); rememberClass(); loadLogos(); go(resumeView()); }
      catch (e) { toast(t('errNet')); }
    },
    lang: (a) => { S.lang = a; persist(); render(); },
    closeSheet: () => { V.brand = null; render(); },
    brand: (a) => { V.brand = a; render(); },
    like: (a) => { const i = S.likes.indexOf(a); if (i < 0) S.likes.push(a); else S.likes.splice(i, 1); save(); render(); },
    galFilter: (a) => { V.galFilter = a; render(); },
    gallery: (a) => { V.galFilter = a; go('gallery'); },
    quizPick: (a) => {
      const q = QUIZ[V.quizI]; S.quiz.answers[q.id] = a;
      if (V.quizI < QUIZ.length - 1) { V.quizI++; persist(); render(); return; }
      S.quiz.result = window.BFH_quizScore ? window.BFH_quizScore(S.quiz.answers) : null;
      save(); go('quizResult');
    },
    quizBack: () => { V.quizI = Math.max(0, V.quizI - 1); render(); },
    quizRedo: () => { S.quiz = { answers: {}, result: null }; V.quizI = 0; persist(); go('quiz'); },
    chip: (a) => {
      const [qid, oid] = a.split('|'), q = QS.find(x => x.id === qid);
      const cur = Array.isArray(S.answers[qid]) ? S.answers[qid].slice() : [];
      const i = cur.indexOf(oid);
      if (i >= 0) cur.splice(i, 1); else { if (q.max && cur.length >= q.max) { toast(t('pickUpTo', { n: q.max })); return; } cur.push(oid); }
      S.answers[qid] = cur; save(); render();
    },
    choice: (a) => { const [qid, oid] = a.split('|'); S.answers[qid] = oid; save(); render(); },
    tot: (a) => { const [pid, s] = a.split('|'); S.tot[pid] = s; save(); render(); },
    prev: () => { V.follow = null; if (rec) try { rec.stop(); } catch (e) {} if (S.qi > 0) { S.qi--; persist(); render(); window.scrollTo(0, 0); } else go(S.quiz.result ? 'quizResult' : 'home'); },
    next: async (a) => {
      const qs = askable(), q = qs[S.qi];
      if (a !== 'force' && q.follow && !q.optional && short(q)) { V.follow = q.id; render(); const f = $('.follow'); if (f) f.scrollIntoView({ block: 'nearest' }); return; }
      V.follow = null; V.micHelp = null; V.tidied = null; if (rec) try { rec.stop(); } catch (e) {}
      if (S.qi === 0) ensureAccount();
      if (S.qi < qs.length - 1) { S.qi++; save(); render(); window.scrollTo(0, 0); return; }
      setStage('heart'); save(true); go('heart');
    },
    followMore: () => { V.follow = null; render(); const el = $('.big-in, .words3 input'); if (el) el.focus(); },
    makeHeart: () => { if (!S.cls) { V.err = t('errNeedClass'); render(); return; } S.heart = null; startJob('heart'); },
    confirmHeart: () => {
      readHeart(); S.heart.confirmed = true; setStage('directions'); save(true);
      if (!S.dirs.length) { go('dirs'); startJob('directions'); } else go('dirs');
    },
    makeDirs: () => { if (!S.cls) { V.err = t('errNeedClass'); render(); return; } if (S.dirs.length && !confirm(t('replaceDirs'))) return; startJob('directions'); },
    more: (a) => startJob('more', { dir: Number(a) }),
    dirOpen: (a) => { V.dirOpen[a] = !V.dirOpen[a]; render(); },
    choose: (a) => { choose(Number(a)); V.tab = 'mix'; save(); go('studio'); },
    tab: (a) => { V.tab = a; V.fontStyle = null; render(); },
    mix: (a) => {
      const [k, i] = a.split('|'), n = Number(i), d = S.dirs[n];
      S.pick[k] = n;
      if (k === 'pal') S.pick.colors = Object.assign({}, d.colors);
      if (k === 'font') S.pick.fontId = d.fontId;
      if (k === 'words') { S.pick.tag = 0; S.pick.custom = null; }
      save(); render();
    },
    role: (a) => { V.role = a; render(); },
    setColor: (a) => { S.pick.colors[V.role] = a; save(); render(); },
    resetColors: () => { S.pick.colors = Object.assign({}, S.dirs[S.pick.pal].colors); save(); render(); },
    fontStyle: (a) => { V.fontStyle = a; render(); },
    setFont: (a) => { S.pick.fontId = a; save(); render(); },
    tag: (a) => { S.pick.tag = Number(a); S.pick.custom = null; save(); render(); },
    tuneReset: () => { S.pick.tune = { warm: 0, bold: 0, modern: 0, playful: 0 }; save(); render(); },
    mockLang: (a) => { V.mockLang = a; render(); },
    refine: (a) => {
      const [part, how, dir] = a.split('|');
      const opts = { part, how, dir: Number(dir) };
      if (part === 'palette') opts.colors = S.pick.colors;
      startJob('refine', opts);
    },
    makePack: () => startJob('package', { brand: brandOpts() }),
    makePlan: () => startJob('plan', { brand: brandOpts() }),
    copyDay: (a) => { const d = (S.plan || [])[Number(a)]; if (d) copy(L(d.caption)); },
    copyPlan: () => copy((S.plan || []).map(d => `${t('day')} ${d.day} · ${d.format} · ${d.pillar}\n${L(d.idea)}\n${L(d.caption)}`).join('\n\n')),
    logoDl: async (a) => { const cv = await B.logoCanvas(brand(), a); cv.toBlob(bl => download(bl, fileName('-logo-' + a + '.png')), 'image/png'); },
    copyColours: () => { const c = brand().colors; copy(B.ROLES.map(r => `${t('role_' + r)} ${c[r]}`).join('\n')); },
    photoRemove: () => { delete S.photo; save(); render(); },
    install: async () => { if (window.BFH_PWA) { await window.BFH_PWA.install(); render(); } },
    mic: (a) => startMic(a),
    tidy: (a) => { const q = QS.find(x => x.id === a), text = q && q.type === 'words3' ? '' : String(S.answers[a] || ''); if (!text.trim()) return; V.tidyPrev = { qid: a, text }; startJob('tidy', { text, lang: S.lang, qid: a }); },
    untidy: () => { if (V.tidyPrev) { S.answers[V.tidyPrev.qid] = V.tidyPrev.text; V.tidyPrev = null; save(); render(); } },
    packLang: (a) => { V.packLang = a; render(); },
    copyHex: (a) => copy(a),
    copyBrief: () => copy(B.briefText(brand(), V.packLang || S.lang, t)),
    copyUni: () => copy(B.universalPrompt(brand(), V.packLang || S.lang)),
    copyPrompt: (a) => { const [k, i] = a.split('|'); copy(S.pkg[k][Number(i)].prompt); },
    pdf: () => printPdf(),
    kit: () => kitImage(),
    json: () => downloadJson(),
    copyLink: () => copy(myLink()),
    makeLink: async () => { if (await ensureAccount()) { render(); } else toast(t('errNet')); },
    join: async () => {
      const code = (($('#joinCode') || {}).value || '').trim().toUpperCase();
      if (code) openWelcome(code);
    },
    switchUser: () => { if (S.cls) openWelcome(S.cls); },
    signInLast: () => { const lc = lastClass(); if (lc) openWelcome(lc.code); },
    signInCode: () => { const code = (($('#signCode') || {}).value || '').trim().toUpperCase(); if (code) openWelcome(code); else { const el = $('#signCode'); if (el) el.focus(); } },
    signOut: async () => {
      if (!confirm(t('signOutSure'))) return;
      clearTimeout(saveTimer); await syncUp();
      const lang = S.lang; rememberClass();
      S = fresh(); S.lang = lang; V.board = null; V.people = null; V.fb = null; V.job = null; clearTimeout(pollTimer);
      persist(); go('home');
    },
    shareDir: (a) => {
      const k = S.share.keys || (S.share.keys = []), i = k.indexOf(a);
      if (i >= 0) k.splice(i, 1); else { if (k.length >= 2) k.shift(); k.push(a); }
      persist(); if (S.share.on) pushShare(); render();
    },
    vote: async (a) => {
      const [target, i] = a.split('|'), p = (V.people || []).find(x => x.id === target);
      const dir = p && p.myVote === Number(i) ? null : Number(i);
      try { await api('vote', { id: S.id, key: S.key, target, dir }); if (p) p.myVote = dir; render(); } catch (e) { toast(t('errNet')); }
    },
    encourage: (a) => { const [target, k] = a.split('|'); const el = document.querySelector(`[data-comment="${target}"]`); if (el) { el.value = t(k); el.focus(); } },
    comment: async (a) => {
      const el = document.querySelector(`[data-comment="${a}"]`), text = el ? el.value.trim() : '';
      if (!text) return;
      try { await api('comment', { id: S.id, key: S.key, target: a, text }); toast(t('thanksEncourage')); loadClass(); } catch (e) { toast(t(e.code === 'ENOUGH_COMMENTS' ? 'enoughComments' : 'errNet')); }
    },
    uncomment: async (a) => { const [target, cid] = a.split('|'); try { await api('uncomment', { id: S.id, key: S.key, target, cid }); loadClass(); } catch (e) {} }
  };
  function short(q) {
    const a = S.answers[q.id];
    if (q.type === 'words3') return !Array.isArray(a) || a.filter(x => String(x || '').trim()).length < (q.min || 3);
    if (q.type === 'short' || q.type === 'long') return String(a || '').trim().length < (q.min || 1);
    if (q.type === 'chips') return !Array.isArray(a) || !a.length;
    if (q.type === 'choice') return !a;
    if (q.type === 'tot') return !TOT.every(p => S.tot[p.id]);
    return false;
  }
  function readHeart() {
    document.querySelectorAll('[data-heart]').forEach(el => { S.heart[el.dataset.heart] = el.value; });
  }
  async function pushShare() {
    if (!S.id) return;
    const dirs = (S.share.keys || []).map(k => S.dirs.find(d => d.key === k)).filter(Boolean).map(d => {
      const isPick = S.pick && S.dirs[S.pick.pal] === d, b = isPick ? brand() : null;
      return { key: d.key, name: d.name, personality: d.personality, tagline: b ? b.tagline : (d.taglines || [])[0], fontId: b ? b.font.id : d.fontId, colors: b ? b.colors : d.colors, tune: b ? b.tune : {} };
    });
    try { await api('share', { id: S.id, key: S.key, on: S.share.on && dirs.length > 0, dirs, name: S.answers.name || '' }); V.fb = await api('feedback', { id: S.id, key: S.key }); } catch (e) { toast(t('errNet')); }
  }

  /* ---------------- speaking an answer ----------------
     Claude can't hear audio, so the phone turns speech into text (Khmer: km-KH — Chrome on
     Android does this well; iPhones need the Gboard keyboard's 🎤 set to Khmer), then
     "Tidy with Claude" fixes spelling and punctuation without changing their words. */
  let rec = null;
  function startMic(qid) {
    if (V.listening) { try { rec && rec.stop(); } catch (e) {} return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { V.micHelp = qid; render(); return; }
    rec = new SR();
    rec.lang = S.lang === 'km' ? 'km-KH' : 'en-US';
    rec.continuous = true; rec.interimResults = true;
    const base = String(S.answers[qid] || '').trim();
    let finals = '';
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const tx = e.results[i][0].transcript;
        if (e.results[i].isFinal) finals += (finals ? ' ' : '') + tx.trim(); else interim += tx;
      }
      const text = [base, finals, interim.trim()].filter(Boolean).join(' ');
      S.answers[qid] = text.slice(0, 1500);
      const el = document.querySelector(`[data-bind="${qid}"]`); if (el) el.value = S.answers[qid];
      persist();
    };
    rec.onerror = (e) => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast(t('micBlocked')); else if (e.error === 'language-not-supported' || e.error === 'network') V.micHelp = qid; };
    rec.onend = () => { V.listening = null; rec = null; save(); render(); };
    try { rec.start(); V.listening = qid; V.micHelp = null; render(); } catch (e) { V.micHelp = qid; render(); }
  }

  /* a picture from the phone, made small enough to keep and send */
  function readImage(file, max, q) {
    return new Promise((res, rej) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)), cv = document.createElement('canvas');
        cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); res(cv.toDataURL('image/jpeg', q)); };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('bad image')); };
      img.src = url;
    });
  }

  /* ---------------- exports ---------------- */
  function fileName(ext) { return ((S.answers.name || 'my-brand').toLowerCase().replace(/[^a-z0-9ក-៿]+/g, '-').replace(/^-|-$/g, '') || 'my-brand') + ext; }
  function download(blob, name) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  async function printPdf() {
    const b = brand(); await B.fontsReady(b.font);
    let el = $('#print'); if (!el) { el = document.createElement('div'); el.id = 'print'; document.body.appendChild(el); }
    el.innerHTML = B.printPages(b, V.packLang || S.lang, t);
    toast(t('pdfHow'));
    setTimeout(() => window.print(), 400);
  }
  async function kitImage() {
    const cv = await B.kitImage(brand(), V.packLang || S.lang);
    cv.toBlob(async (blob) => {
      const file = new File([blob], fileName('-brand-kit.png'), { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: t('appName') }); return; } catch (e) { if (e.name === 'AbortError') return; } }
      download(blob, file.name);
    }, 'image/png');
  }
  function downloadJson() {
    const out = { app: 'brand-from-the-heart', v: 1, saved: new Date().toISOString(), brand: dataOut() };
    download(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }), fileName('.brand.json'));
  }
  function loadJson(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const j = JSON.parse(r.result);
        if (!j || j.app !== 'brand-from-the-heart' || !j.brand) throw new Error('bad');
        const keep = { id: S.id, key: S.key, cls: S.cls, className: S.className, lang: S.lang };
        S = Object.assign(fresh(), j.brand, keep);
        save(true); toast(t('fileLoaded')); go(resumeView());
      } catch (e) { toast(t('fileBad')); }
    };
    r.readAsText(file);
  }

  /* ---------------- events ---------------- */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled || el.tagName === 'INPUT') return;
    const f = ACT[el.dataset.act];
    if (f) { e.preventDefault(); f(el.dataset.arg); }
  });
  document.addEventListener('input', (e) => {
    const el = e.target, d = el.dataset;
    if (el.id === 'rosterFilter') { const q = el.value.trim().toLowerCase(); document.querySelectorAll('.roster .opt').forEach(b => { b.hidden = q && !b.dataset.name.includes(q); }); return; }
    if (d.bind) {
      const q = QS.find(x => x.id === d.bind);
      if (q && q.type === 'words3') { const w = Array.isArray(S.answers[q.id]) ? S.answers[q.id].slice() : ['', '', '']; w[Number(d.idx)] = el.value; S.answers[q.id] = w; }
      else S.answers[d.bind] = el.value;
      if (V.follow === d.bind && !short(q)) { V.follow = null; const f = $('.follow'); if (f) f.remove(); }
      save(); return;
    }
    if (d.heart) { S.heart[d.heart] = el.value; save(); return; }
    if (d.tune) { S.pick.tune[d.tune] = Number(el.value); persist(); livePreview(); return; }
    if (d.custom) { S.pick.custom = S.pick.custom || { en: '', km: '' }; S.pick.custom[d.custom] = el.value; persist(); livePreview(); return; }
    if (d.color) { S.pick.colors[d.color] = el.value.toUpperCase(); persist(); livePreview(); }
  });
  document.addEventListener('change', (e) => {
    const el = e.target, d = el.dataset;
    if (d.tune || d.custom || d.color) { save(); render(); return; }
    if (d.check) { S.checks[d.check] = el.checked; save(); return; }
    if (d.actChange === 'shareOn') { S.share.on = el.checked; persist(); pushShare().then(render); return; }
    if (el.id === 'loadFile' && el.files[0]) loadJson(el.files[0]);
    if (d.photo !== undefined && el.files[0]) readImage(el.files[0], 720, 0.82).then(u => { S.photo = u; save(); render(); }).catch(() => toast(t('fileBad')));
    if (d.checkimg !== undefined && el.files[0]) readImage(el.files[0], 1280, 0.85).then(u => startJob('check', { image: u, brand: brandOpts() })).catch(() => toast(t('fileBad')));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && V.brand) { V.brand = null; render(); }
    if (e.key === 'Enter' && e.target.id === 'signCode') { e.preventDefault(); ACT.signInCode(); }
    if (e.key === 'Enter' && e.target.id === 'newName') { e.preventDefault(); ACT.welcomeStart(); }
    if (e.key === 'Enter' && e.target.matches('input.big-in, .words3 input') && V.view === 'interview') { e.preventDefault(); ACT.next(); }
  });
  document.addEventListener('error', (e) => {   // a logo that won't load: try the next source, then the name
    const img = e.target;
    if (!img || img.tagName !== 'IMG' || !img.closest('.logo')) return;
    const next = img.dataset.fallback;
    if (next && img.src !== next) { img.dataset.fallback = ''; img.src = next; return; }
    const box = img.parentNode; box.classList.add('text'); box.textContent = img.dataset.name || '';
  }, true);
  function livePreview() {   // sliders and colour pickers redraw only the preview, so the slider keeps its grip
    const p = $('.preview'), b = brand(); if (!p || !b) return;
    p.innerHTML = B.mock(V.tab === 'mockups' ? 'post' : 'poster', b, V.mockLang || S.lang);
    const sw = $('.studio-head .sws'); if (sw) sw.outerHTML = swatches(b.colors);
    if (V.tab === 'mockups') document.querySelectorAll('.mk').forEach(fig => { const k = fig.className.match(/mk-(\w+)/)[1]; fig.querySelector('div').innerHTML = B.mock(k, b, V.mockLang || S.lang); });
  }

  const typing = () => document.activeElement && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName);
  window.addEventListener('hashchange', () => { if (/^#me=/.test(location.hash)) location.reload(); });   // a personal link opened while the app is already open
  window.addEventListener('online', () => { if (V.unsynced) syncUp(); if (!typing()) render(); });
  window.addEventListener('offline', () => { if (!typing()) render(); });
  document.addEventListener('bfh-pwa', () => { if (V.view === 'home' && !typing()) render(); });

  /* ---------------- start ---------------- */
  async function loadLogos() {
    if (!S.cls) return;
    try { V.logos = (await api('logos', { code: S.cls })).logos || {}; if (V.view === 'gallery' || V.brand) render(); } catch (e) {}
  }
  async function boot() {
    const h = new URLSearchParams(location.hash.slice(1)), qp = new URLSearchParams(location.search);
    const me = h.get('me');
    const classLink = qp.get('class') ? qp.get('class').toUpperCase().slice(0, 6) : null;
    if (me && /^[a-z0-9]{12}\.[a-z0-9]{24}$/.test(me)) {
      const [id, key] = me.split('.');
      if (id !== S.id) {
        try {
          const r = await api('load', { id, key });
          const lang = S.lang;
          S = Object.assign(fresh(), r.data || {}, { id, key, cls: r.cls, className: r.className, lang: (r.data && r.data.lang) || lang });
          if (r.job) S.job = { id: r.job };
          V.fb = r.feedback; persist(); V.view = resumeView();
        } catch (e) { V.err = t('errLink'); }
      }
      history.replaceState(null, '', location.pathname + location.search);
    } else if (S.id) {
      try { const r = await api('load', { id: S.id, key: S.key }); S.cls = r.cls; S.className = r.className; V.fb = r.feedback; if (r.job && !S.job) S.job = { id: r.job }; persist(); } catch (e) { if (e.code === 'NO_STUDENT') { S.id = null; S.key = null; persist(); } }
    }
    delete S.pendingClass;
    if (classLink) {
      history.replaceState(null, '', location.pathname + location.hash);
      if (S.cls !== classLink) { openWelcome(classLink); if (S.job && S.job.id) { V.job = { kind: S.job.kind, opts: S.job.opts, status: 'running', started: Date.now() }; poll(); } return; }
    }
    if (S.job && S.job.id) { V.job = { kind: S.job.kind, opts: S.job.opts, status: 'running', started: Date.now() }; poll(); }
    rememberClass();
    render();
    loadLogos();
    if (V.err) toast(V.err);
  }
  window.BFH_APP = { get S() { return S; }, V, render, go, brand };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

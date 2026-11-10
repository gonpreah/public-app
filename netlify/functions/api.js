/*  GonPreah — the public app's backend (app.gonpreah.org).

    One POST endpoint, /.netlify/functions/api, with a {fn, args} body dispatched
    through HANDLERS — the same shape as the YWAM GP Impact app, so the two read alike.
    Everything else is this app's own: its own Netlify site, its own Blobs store
    ("gpa"), its own accounts. Nobody's staff account is in here.

    Storage (Netlify Blobs, store "gpa", strong reads):
      u:<id>          one person: profile, tests, habits, weekly goals, life plan, tasks, teams, device tokens
      ph:<id>         their photo (a small JPEG data URI), read separately so lists stay light
      gsub:<sub>      Google account id → person id
      uname:<name>    username → person id (usernames are unique, lower case)
      people          the search index: [{id, username, name, minor}] — no photos, no birth years
      t:<id>          a team: name, emoji, join code, leaders, members, team tasks, its coachings' ids
      c:<id>          a coaching (1-on-1s): coach, mentee, the team, its meetings — see "1-on-1s" below
      pushKeys        the app's own key pair for phone reminders (made on first use; server only)
      pushSubs        each phone that asked for reminders: { uid, endpoint, p256dh, auth, lang, at }
      pushRun         the last hour the reminders ran, so an hour never sends twice
      reports         what people reported (a photo, a name, a line about them, a team), for the admin
      tcode:<code>    join code → team id

    Who sees what (tests/test-api.mjs holds every line of this):
      · a person's goals, life plan, tasks, habit names, notes and answers stay theirs. Others see
        progress only — a streak, a week's %, "took the strengths test" — and each
        of those has its own switch (share.*);
      · UNDER 18 (worked out from the birth year, cautiously: anyone who could
        still be 17 counts): never in the search, never on a public profile; seen
        only by people in a team with them; their name is their first name only;
        nobody can add them to anything — they join with a leader's code;
      · under 13 can't make an account at all.
*/
import { getStore } from '@netlify/blobs';
import crypto from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';

/* ---------------- storage ---------------- */
/* Tests hand in an in-memory store through globalThis.__gpaStore; the live site
   never sets it. */
function store() { return globalThis.__gpaStore || getStore({ name: 'gpa', consistency: 'strong' }); }
/* A request reads its own writes (the Impact app learned this the hard way: a
   reply built from a stale read paints the old value back). Per request, never
   module-wide. */
const scope = new AsyncLocalStorage();
const copy_ = function (v) { return v == null ? v : JSON.parse(JSON.stringify(v)); };
function shaped_(v, fallback) {
  if (v == null) return fallback;
  if (Array.isArray(fallback) !== Array.isArray(v)) return fallback;
  if (typeof v !== 'object') return fallback;
  return v;
}
async function readJSON(key, fallback) {
  const mine = scope.getStore();
  if (mine && mine.has(key)) return shaped_(copy_(mine.get(key)), fallback);
  let v = await store().get(key, { type: 'json' });
  if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) { v = null; } }
  return shaped_(copy_(v), fallback);
}
async function writeJSON(key, value) {
  await store().setJSON(key, value);
  const mine = scope.getStore(); if (mine) mine.set(key, copy_(value));
  return value;
}
async function dropKey(key) {
  await store().delete(key);
  const mine = scope.getStore(); if (mine) mine.set(key, null);
}
/* Read, change, write, read back; someone else's write in between → try again. */
async function mutate_(key, fallback, fn) {
  for (let i = 0; i < 8; i++) {
    if (i) await new Promise(function (r) { setTimeout(r, Math.random() * 40); });
    const raw = shaped_(await store().get(key, { type: 'json' }), fallback);
    const data = copy_(raw);
    const out = fn(data);
    if (out && out.abort) { delete out.abort; return out; }
    await store().setJSON(key, data);
    const after = shaped_(await store().get(key, { type: 'json' }), fallback);
    if (JSON.stringify(after) === JSON.stringify(data)) {
      const mine = scope.getStore(); if (mine) mine.set(key, copy_(data));
      return out;
    }
  }
  return { ok: false, err: 'busy' };
}

/* ---------------- small helpers ---------------- */
function str_(v, max) { const s = String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); return s.slice(0, max); }
function id_(p) { return p + crypto.randomBytes(9).toString('hex'); }
function sha_(s) { return crypto.createHash('sha256').update(String(s), 'utf8').digest('hex'); }
function safeEq_(a, b) {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
}
/* Cambodia's calendar: the base day, not UTC's. */
function today_() { return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10); }
function addDays_(iso, n) { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function thisYear_() { return Number(today_().slice(0, 4)); }
/* The Monday of a date's week, as the week's key. */
function weekOf_(iso) { const d = new Date(iso + 'T00:00:00Z'); const dow = (d.getUTCDay() + 6) % 7; return addDays_(iso, -dow); }
function isDay_(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + 'T00:00:00Z')); }

/* ---------------- age ---------------- */
const MIN_AGE = 13;
/* Born in birthYear, a person is (thisYear − birthYear) or one less. Count them
   as under 18 unless they are 18 on every day of this year. */
function isMinor_(u) { return !u || !u.birthYear || (thisYear_() - u.birthYear - 1) < 18; }
function firstName_(n) { return String(n || '').trim().split(/\s+/)[0] || ''; }

/* ---------------- sign-in ---------------- */
const GOOGLE_ISS = ['accounts.google.com', 'https://accounts.google.com'];
function googleClientId_() { return String(process.env.GPA_GOOGLE_CLIENT_ID || '').trim(); }
/* An ID token (Google's button) or an access token (our own button) — Google's
   tokeninfo checks either; it must be for OUR client, verified and unexpired. */
async function verifyGoogle_(token) {
  const cid = googleClientId_();
  if (!cid || typeof token !== 'string' || !token || token.length > 4096) return null;
  const isJwt = token.split('.').length === 3;
  let info = null;
  try {
    const res = await globalThis.fetch('https://oauth2.googleapis.com/tokeninfo?' + (isJwt ? 'id_token=' : 'access_token=') + encodeURIComponent(token));
    if (!res || !res.ok) return null;
    info = await res.json();
  } catch (e) { return null; }
  if (!info || info.aud !== cid || !info.sub) return null;
  if (isJwt && GOOGLE_ISS.indexOf(info.iss) === -1) return null;
  if (String(info.email_verified) !== 'true' && String(info.verified_email) !== 'true') return null;
  if (isJwt ? !(Number(info.exp) * 1000 > Date.now()) : !(Number(info.expires_in) > 0)) return null;
  let name = str_(info.name, 80);
  if (!isJwt && !name) {
    try {
      const ui = await globalThis.fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: 'Bearer ' + token } });
      if (ui && ui.ok) { const j = await ui.json(); name = str_(j && j.name, 80); }
    } catch (e) { /* the name is a nicety */ }
  }
  return { sub: String(info.sub), email: String(info.email || '').toLowerCase(), name: name };
}
/* A device token: long, random, kept only as a hash; a phone keeps the token. */
const MAX_TOKENS = 8;
function addToken_(u) {
  const tok = crypto.randomBytes(24).toString('hex');
  u.tokens = (Array.isArray(u.tokens) ? u.tokens : []).concat([{ h: sha_(tok), at: new Date().toISOString() }]).slice(-MAX_TOKENS);
  return tok;
}
/* Every signed-in handler starts here. null = not signed in. */
async function auth_(uid, tok) {
  if (typeof uid !== 'string' || !/^u[a-f0-9]{18}$/.test(uid) || typeof tok !== 'string' || !/^[a-f0-9]{48}$/.test(tok)) return null;
  const u = await readJSON('u:' + uid, null);
  if (!u || u.closed || u.suspended) return null;   // a suspended account is signed out everywhere
  const h = sha_(tok);
  return (u.tokens || []).some(function (t) { return t && safeEq_(t.h, h); }) ? u : null;
}

/* ---------------- the admin ----------------
   Whoever's Google email is in GPA_ADMIN_EMAILS (Netlify env, comma-separated) is an admin:
   they see reports and can remove a photo or a line, suspend an account or close a team.
   The account keeps only a hash of its Google email (eh), so the list can change any time. */
function adminHashes_() { return String(process.env.GPA_ADMIN_EMAILS || '').toLowerCase().split(/[\s,;]+/).filter(Boolean).map(sha_); }
/* …or whose username is in GPA_ADMIN_USERNAMES (for accounts with a password, not Google).
   Set it only after that person has made their account, so nobody else can claim the name. */
function adminUsernames_() { return String(process.env.GPA_ADMIN_USERNAMES || '').toLowerCase().split(/[\s,;]+/).filter(Boolean); }
function isAdmin_(u) { return !!(u && ((u.eh && adminHashes_().indexOf(u.eh) > -1) || adminUsernames_().indexOf(u.username) > -1)); }
/* Blocking works both ways: neither sees the other. */
function blocked_(a, b) { return !!(a && b && (((a.blocked || []).indexOf(b.id) > -1) || ((b.blocked || []).indexOf(a.id) > -1))); }
function gone_(u) { return !u || u.closed || u.suspended; }

/* ---------------- usernames ---------------- */
const RESERVED = ['admin', 'gonpreah', 'ywam', 'support', 'help', 'team', 'teams', 'me', 'you', 'leader', 'staff', 'official', 'jesus', 'god'];
function cleanUsername_(v) {
  const s = String(v == null ? '' : v).trim().toLowerCase();
  if (!/^[a-z0-9_.]{3,20}$/.test(s) || /^[._]|[._]$|\.\./.test(s)) return null;
  if (RESERVED.indexOf(s) > -1) return null;
  return s;
}

/* ---------------- what each person may show ---------------- */
const SHARE_KEYS = ['type', 'strengths', 'apest', 'journey', 'streak', 'week', 'teams', 'plan', 'feed', 'focus', 'level'];
function shareOf_(u) {
  const s = (u && u.share) || {}; const o = {};
  SHARE_KEYS.forEach(function (k) { o[k] = s[k] !== false; });
  return o;
}

/* ---------------- personality & strengths (lists mirror the page's scripts) ---------------- */
const PTYPE_CODES = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];
const PSEASON_IDS = ['ordinary', 'school', 'outreach', 'transition', 'holidays', 'stretched'];
const PAXES = [['E', 'E', 'I'], ['S', 'S', 'N'], ['T', 'T', 'F'], ['J', 'J', 'P']];
/* Bars that disagree with the letters are refused, so a screen can never contradict itself. */
function cleanPScores_(scores, type) {
  if (!scores || typeof scores !== 'object') return null;
  const out = {};
  for (let i = 0; i < PAXES.length; i++) {
    const v = Number(scores[PAXES[i][0]]);
    if (!isFinite(v) || v < 0 || v > 100) return null;
    out[PAXES[i][0]] = Math.round(v);
    if (type.charAt(i) !== (out[PAXES[i][0]] > 50 ? PAXES[i][1] : PAXES[i][2])) return null;
  }
  return out;
}
const GS_IDS = ['hardworker', 'coordinator', 'valuesdriven', 'fairminded', 'careful', 'orderly', 'goalsetter', 'dependable', 'solver', 'starter', 'takecharge', 'voice', 'pacesetter', 'improver', 'confident', 'differencemaker', 'friendmaker', 'flexible', 'weaver', 'mentor', 'comforter', 'peacemaker', 'welcomer', 'noticer', 'optimist', 'loyalfriend', 'factfinder', 'historian', 'visionary', 'inventor', 'collector', 'deepthinker', 'curious', 'pathfinder'];
const GS_PAIRS = [
  ['mentor', 'friendmaker'], ['comforter', 'historian'], ['visionary', 'flexible'], ['curious', 'valuesdriven'],
  ['pathfinder', 'voice'], ['friendmaker', 'historian'], ['coordinator', 'starter'], ['improver', 'curious'],
  ['goalsetter', 'noticer'], ['collector', 'pacesetter'], ['takecharge', 'fairminded'], ['improver', 'peacemaker'],
  ['inventor', 'pacesetter'], ['fairminded', 'factfinder'], ['weaver', 'hardworker'], ['dependable', 'takecharge'],
  ['loyalfriend', 'improver'], ['differencemaker', 'fairminded'], ['flexible', 'coordinator'], ['inventor', 'optimist'],
  ['loyalfriend', 'voice'], ['dependable', 'comforter'], ['noticer', 'visionary'], ['goalsetter', 'pathfinder'],
  ['weaver', 'factfinder'], ['coordinator', 'comforter'], ['welcomer', 'orderly'], ['deepthinker', 'peacemaker'],
  ['confident', 'goalsetter'], ['comforter', 'takecharge'], ['welcomer', 'improver'], ['curious', 'weaver'],
  ['deepthinker', 'noticer'], ['visionary', 'confident'], ['fairminded', 'mentor'], ['starter', 'collector'],
  ['pathfinder', 'mentor'], ['friendmaker', 'careful'], ['voice', 'welcomer'], ['starter', 'goalsetter'],
  ['hardworker', 'flexible'], ['noticer', 'confident'], ['comforter', 'careful'], ['orderly', 'pacesetter'],
  ['collector', 'mentor'], ['hardworker', 'curious'], ['solver', 'inventor'], ['takecharge', 'deepthinker'],
  ['mentor', 'dependable'], ['noticer', 'collector'], ['welcomer', 'starter'], ['takecharge', 'noticer'],
  ['differencemaker', 'weaver'], ['orderly', 'pathfinder'], ['weaver', 'dependable'], ['goalsetter', 'inventor'],
  ['orderly', 'optimist'], ['flexible', 'friendmaker'], ['careful', 'confident'], ['historian', 'valuesdriven'],
  ['optimist', 'differencemaker'], ['confident', 'solver'], ['peacemaker', 'historian'], ['friendmaker', 'hardworker'],
  ['improver', 'deepthinker'], ['factfinder', 'differencemaker'], ['pacesetter', 'valuesdriven'], ['fairminded', 'peacemaker'],
  ['careful', 'pathfinder'], ['visionary', 'orderly'], ['solver', 'friendmaker'], ['confident', 'inventor'],
  ['historian', 'dependable'], ['loyalfriend', 'solver'], ['pacesetter', 'comforter'], ['differencemaker', 'coordinator'],
  ['valuesdriven', 'improver'], ['pacesetter', 'visionary'], ['optimist', 'goalsetter'], ['peacemaker', 'takecharge'],
  ['collector', 'flexible'], ['careful', 'loyalfriend'], ['flexible', 'differencemaker'], ['solver', 'factfinder'],
  ['optimist', 'voice'], ['mentor', 'curious'], ['starter', 'weaver'], ['factfinder', 'coordinator'],
  ['voice', 'hardworker'], ['valuesdriven', 'welcomer'], ['hardworker', 'collector'], ['curious', 'fairminded'],
  ['deepthinker', 'starter'], ['valuesdriven', 'loyalfriend'], ['factfinder', 'optimist'], ['coordinator', 'deepthinker'],
  ['voice', 'orderly'], ['pathfinder', 'loyalfriend'], ['inventor', 'welcomer'], ['historian', 'careful'],
  ['peacemaker', 'solver'], ['dependable', 'visionary']
];
/* The page sends answers only; the Top 5 is worked out here (same sum and
   tie-break as gpGSScore), so what others see always follows from the answers. */
function gsScore_(answers) {
  if (!answers || typeof answers !== 'object') return null;
  const score = {}, strong = {}, clean = {};
  GS_IDS.forEach(function (id) { score[id] = 0; strong[id] = 0; });
  for (let i = 0; i < GS_PAIRS.length; i++) {
    const raw = answers['p' + i], v = Number(raw);
    if (raw === null || raw === undefined || raw === '' || [-2, -1, 0, 1, 2].indexOf(v) === -1) return null;
    clean['p' + i] = v;
    const a = GS_PAIRS[i][0], b = GS_PAIRS[i][1];
    score[a] -= v; score[b] += v;
    if (v === -2) strong[a]++;
    if (v === 2) strong[b]++;
  }
  const ranked = GS_IDS.slice().sort(function (x, y) {
    return (score[y] - score[x]) || (strong[y] - strong[x]) || (GS_IDS.indexOf(x) - GS_IDS.indexOf(y));
  });
  return { answers: clean, scores: score, top: ranked.slice(0, 5) };
}

/* ---------------- habits & weekly goals ---------------- */
const HABIT_IDS = ['bible', 'prayer', 'read', 'english', 'khmer', 'exercise', 'sleep', 'water', 'journal', 'nophone', 'kind', 'study'];
const MAX_HABITS = 6, MAX_GOALS = 3, KEEP_DAYS = 400;
function cleanHabits_(list) {
  if (!Array.isArray(list)) return null;
  const out = [], seen = {};
  list.forEach(function (h) {
    if (!h || typeof h !== 'object' || out.length >= MAX_HABITS) return;
    let id = String(h.id || '');
    if (HABIT_IDS.indexOf(id) > -1) { if (seen[id]) return; seen[id] = 1; out.push({ id: id }); return; }
    const label = str_(h.label, 40); if (!label) return;
    id = /^c_[a-z0-9]{4,12}$/.test(id) ? id : 'c_' + crypto.randomBytes(4).toString('hex');
    if (seen[id]) return; seen[id] = 1;
    out.push({ id: id, label: label, icon: str_(h.icon, 8) || '⭐' });
  });
  return out;
}
/* A streak: days in a row with at least one habit ticked, ending today or
   yesterday (today isn't over yet, so not ticking it yet doesn't break it). */
/* A streak: days in a row with at least one habit ticked, ending today or yesterday. A day a
   streak freeze covered (frozen) keeps it going without adding to it. */
function streakOf_(days, frozen) {
  const done = function (d) { const m = days && days[d]; return !!(m && Object.keys(m).some(function (k) { return m[k]; })); };
  const fz = function (d) { return !!(frozen && frozen.indexOf(d) > -1); };
  let d = today_(); if (!done(d)) d = addDays_(d, -1);
  let n = 0, guard = 0;
  while ((done(d) || fz(d)) && guard < 4000) { if (done(d)) n++; d = addDays_(d, -1); guard++; }
  return n;
}
/* ---------------- streak freezes 🧊 ----------------
   Every 7 days of streak earns a freeze (keep up to MAX_FREEZES). When days are missed and
   there are enough freezes to cover them all, they're used by themselves (at start-up or the
   next tick), and the streak lives on. u.freezes = count, u.frozen = the dates covered. */
const MAX_FREEZES = 2;
function habitDone_(u, d) { const m = (u.days || {})[d]; return !!(m && Object.keys(m).some(function (k) { return m[k]; })); }
function applyFreezes_(u) {
  const t = today_(), frozen = u.frozen || [];
  if (!(u.freezes > 0)) return [];
  let d = addDays_(t, -1), gap = [];
  while (gap.length <= u.freezes && !habitDone_(u, d) && frozen.indexOf(d) === -1) { gap.push(d); d = addDays_(d, -1); }
  if (!gap.length || gap.length > u.freezes) return [];
  if (!(habitDone_(u, d) || frozen.indexOf(d) > -1)) return [];   // there was no streak to save
  if (streakOf_(u.days || {}, frozen.concat(gap)) < 1) return [];
  u.frozen = frozen.concat(gap).sort().slice(-60);
  u.freezes -= gap.length;
  return gap;
}
function bestStreakOf_(days) {
  const ks = Object.keys(days || {}).filter(function (d) { const m = days[d]; return m && Object.keys(m).some(function (k) { return m[k]; }); }).sort();
  let best = 0, run = 0, prev = '';
  ks.forEach(function (d) { run = (prev && addDays_(prev, 1) === d) ? run + 1 : 1; prev = d; if (run > best) best = run; });
  return best;
}
function weekPct_(goals) {
  if (!Array.isArray(goals) || !goals.length) return null;
  return Math.round(goals.reduce(function (a, g) { return a + (Number(g.pct) || 0); }, 0) / goals.length);
}
/* What a person's progress looks like from outside: numbers, never words. */
function focusWeek_(u, wk) {
  const d = u.daily || {}; let m = 0;
  for (let i = 0; i < 7; i++) { const x = d[addDays_(wk, i)]; if (x && x.focus) m += x.focus; }
  return m;
}
function statsOf_(u) {
  const days = u.days || {}, wk = weekOf_(today_());
  return {
    streak: streakOf_(days, u.frozen), best: bestStreakOf_(days), freezes: u.freezes || 0,
    week: weekPct_((u.weeks || {})[wk]), habits: (u.habits || []).length,
    tests: (u.personality ? 1 : 0) + (u.gstrengths ? 1 : 0) + (u.apest ? 1 : 0),
    focusWeek: focusWeek_(u, wk)
  };
}

/* ---------------- Today: three things, focus time, the evening check-in ----------------
   u.daily[date] = { top:[{text, done}] (up to 3), focus (minutes), sessions, mood (1–5),
   grateful }. All of it is the person's own: others see only focus minutes this week, behind
   share.focus. Kept DAILY_KEEP days. A date may be yesterday, today or tomorrow (planning
   tomorrow in the evening; a phone a little off). */
const DAILY_KEEP = 120, FOCUS_MIN = 5, FOCUS_MAX = 180, FOCUS_DAY_MAX = 16 * 60, FOCUS_MILESTONES = [2, 5, 10, 20, 30];
function nearDay_(d) { const t = today_(); return isDay_(d) && (d === t || d === addDays_(t, -1) || d === addDays_(t, 1)); }
function dailyMutate_(u, date, fn) {
  u.daily = u.daily && typeof u.daily === 'object' ? u.daily : {};
  const x = Object.assign({}, u.daily[date] || {});
  fn(x);
  u.daily[date] = x;
  const cut = addDays_(today_(), -DAILY_KEEP);
  Object.keys(u.daily).forEach(function (k) { if (k < cut) delete u.daily[k]; });
}
async function saveTop(uid, tok, date, items) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  if (!nearDay_(date)) return { ok: false, err: 'day' };
  if (!Array.isArray(items)) return { ok: false, err: 'text' };
  const clean = items.slice(0, 3).map(function (i) { return { text: str_(i && i.text, 100), done: !!(i && i.done) }; }).filter(function (i) { return i.text; });
  await mutate_('u:' + uid, null, function (u) {
    if (!u) return { ok: true };
    dailyMutate_(u, date, function (x) { x.top = clean; });
    for (let i = 0; i < 3; i++) { if (clean[i] && clean[i].done) xpAdd_(u, 't|' + date + '|' + i, 5); else xpDrop_(u, 't|' + date + '|' + i); }
    if (clean.length === 3 && clean.every(function (i) { return i.done; })) xpAdd_(u, 't|' + date + '|all', 10); else xpDrop_(u, 't|' + date + '|all');
    return { ok: true };
  });
  return { ok: true, me: selfOut_(await readJSON('u:' + uid, null)) };
}
async function saveCheckin(uid, tok, date, c) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  if (!nearDay_(date)) return { ok: false, err: 'day' };
  c = c && typeof c === 'object' ? c : {};
  const mood = Number(c.mood);
  if ([1, 2, 3, 4, 5].indexOf(mood) === -1) return { ok: false, err: 'mood' };
  await mutate_('u:' + uid, null, function (u) { if (u) { dailyMutate_(u, date, function (x) { x.mood = mood; x.grateful = str_(c.grateful, 200); }); xpAdd_(u, 'c|' + date, 5); } return { ok: true }; });
  return { ok: true, me: selfOut_(await readJSON('u:' + uid, null)) };
}
/* ---------------- my journal ----------------
   A page a day, private: u.journal[date] = { t: text (up to 3000, line breaks kept), p: the
   prompt's number on the phone }. The last JOURNAL_KEEP days. Only the person reads it ('get',
   the latest 60 or those before a date) — boot sends just the days written (selfOut_ journalDays),
   never the words. 5 XP a day for a page of 20+ characters. */
const JOURNAL_KEEP = 365, JOURNAL_PAGE = 60;
async function journal(uid, tok, act, a) {
  const u0 = await auth_(uid, tok);
  if (!u0) return { ok: false, err: 'auth' };
  a = a && typeof a === 'object' ? a : {};
  if (act === 'get') {
    const J = u0.journal || {}, before = isDay_(a.before) ? a.before : '9999';
    const days = Object.keys(J).filter(function (d) { return d < before; }).sort().reverse();
    return { ok: true, entries: days.slice(0, JOURNAL_PAGE).map(function (d) { return { date: d, text: J[d].t, prompt: J[d].p }; }), more: days.length > JOURNAL_PAGE };
  }
  if (act !== 'save') return { ok: false, err: 'act' };
  if (!nearDay_(a.date)) return { ok: false, err: 'day' };
  const text = strMl_(a.text, 3000), pr = Number(a.prompt);
  await mutate_('u:' + uid, null, function (u) {
    if (!u) return { ok: false };
    u.journal = u.journal && typeof u.journal === 'object' ? u.journal : {};
    if (text) u.journal[a.date] = { t: text, p: pr >= 0 && pr < 100 ? Math.floor(pr) : -1 }; else delete u.journal[a.date];
    const cut = addDays_(today_(), -JOURNAL_KEEP);
    Object.keys(u.journal).forEach(function (d) { if (d < cut) delete u.journal[d]; });
    if (text.length >= 20) xpAdd_(u, 'jn|' + a.date, 5); else xpDrop_(u, 'jn|' + a.date);
    return { ok: true };
  });
  return { ok: true, me: selfOut_(await readJSON('u:' + uid, null)) };
}

/* A focus session the phone timed: minutes, added to the day. Hours this week can make a
   feed moment (FOCUS_MILESTONES). */
async function logFocus(uid, tok, date, minutes) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  if (!nearDay_(date)) return { ok: false, err: 'day' };
  const m = Math.round(Number(minutes));
  if (!(m >= FOCUS_MIN && m <= FOCUS_MAX)) return { ok: false, err: 'minutes' };
  const res = await mutate_('u:' + uid, null, function (u) {
    if (!u) return { abort: true, ok: false, err: 'auth' };
    const before = focusWeek_(u, weekOf_(date));
    let over = false;
    dailyMutate_(u, date, function (x) { if ((x.focus || 0) + m > FOCUS_DAY_MAX) { over = true; return; } x.focus = (x.focus || 0) + m; x.sessions = (x.sessions || 0) + 1; });
    if (over) return { abort: true, ok: false, err: 'minutes' };
    xpAdd_(u, 'f|' + date + '|' + u.daily[date].sessions, Math.round(m / 2));
    const after = before + m, wk = weekOf_(date);
    FOCUS_MILESTONES.forEach(function (h) { if (before < h * 60 && after >= h * 60) addPost_(u, 'focus', wk + ':' + h); });
    return { ok: true };
  });
  if (!res.ok) return res;
  return { ok: true, me: selfOut_(await readJSON('u:' + uid, null)) };
}

/* ---------------- faith daily: Bible reading plans and a prayer list ----------------
   A plan is a list of passages — references only ("John 3"); the app never carries the Bible's
   text, so people read in their own Bible or Bible app and tick the day. u.reading[plan] =
   { start, done:[day indexes], finished }. Up to READING_ACTIVE at once. A day read is 10 XP
   (once per plan day), finishing a plan is a feed moment. u.prayers = [{ id, text, made,
   answered }] — private, never shown to anyone. */
const range_ = function (book, n) { const a = []; for (let i = 1; i <= n; i++) a.push(book + ' ' + i); return a; };
const READING_PLANS = {
  who_is_jesus: ['John 1', 'Luke 2', 'Matthew 5', 'Matthew 6', 'Luke 15', 'John 11', 'Matthew 26', 'Luke 23', 'John 20', 'Acts 1'],
  identity: ['Psalms 139', 'Ephesians 1', 'Ephesians 2', 'Romans 8', '1 John 3', 'Isaiah 43', '2 Corinthians 5'],
  hard_days: ['Psalms 23', 'Psalms 27', 'Psalms 34', 'Psalms 46', 'Psalms 91', 'Psalms 121', 'Psalms 62'],
  mark: range_('Mark', 16),
  john: range_('John', 21),
  proverbs: range_('Proverbs', 31)
};
const READING_ACTIVE = 3, MAX_PRAYERS = 150;
async function reading(uid, tok, act, a) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  a = a && typeof a === 'object' ? a : {};
  const plan = READING_PLANS[a.plan];
  if (!plan || !Object.prototype.hasOwnProperty.call(READING_PLANS, a.plan)) return { ok: false, err: 'none' };
  const res = await mutate_('u:' + uid, null, function (u) {
    if (!u) return { abort: true, ok: false, err: 'auth' };
    u.reading = u.reading && typeof u.reading === 'object' ? u.reading : {};
    const R = u.reading[a.plan];
    if (act === 'start') {
      const active = Object.keys(u.reading).filter(function (k) { return !u.reading[k].finished; });
      if (!R && active.length >= READING_ACTIVE) return { abort: true, ok: false, err: 'too_many' };
      u.reading[a.plan] = { start: today_(), done: [], finished: '' };
      return { ok: true };
    }
    if (act === 'stop') { delete u.reading[a.plan]; return { ok: true }; }
    if (act === 'tick') {
      const i = Math.round(Number(a.day));
      if (!R || !(i >= 0 && i < plan.length)) return { abort: true, ok: false, err: 'none' };
      R.done = (R.done || []).filter(function (x) { return x !== i; });
      if (a.done) { R.done.push(i); R.done.sort(function (x, y) { return x - y; }); xpAdd_(u, 'r|' + a.plan + '|' + i, 10); R.lastRead = today_(); }
      else xpDrop_(u, 'r|' + a.plan + '|' + i);
      if (R.done.length === plan.length && !R.finished) { R.finished = today_(); addPost_(u, 'reading', a.plan); }
      if (R.done.length < plan.length) R.finished = '';
      return { ok: true };
    }
    return { abort: true, ok: false, err: 'act' };
  });
  if (!res.ok) return res;
  return { ok: true, me: selfOut_(await readJSON('u:' + uid, null)) };
}
/* Today's devotional, read: once a day, 5 XP. The devotionals themselves are in public/devotions.js. */
async function devoDone(uid, tok, date) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  if (!nearDay_(date)) return { ok: false, err: 'day' };
  await mutate_('u:' + uid, null, function (u) { if (u) { dailyMutate_(u, date, function (x) { x.devo = true; }); xpAdd_(u, 'd|' + date, 5); } return { ok: true }; });
  return { ok: true, me: selfOut_(await readJSON('u:' + uid, null)) };
}
async function prayer(uid, tok, act, a) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  a = a && typeof a === 'object' ? a : {};
  const res = await mutate_('u:' + uid, null, function (u) {
    if (!u) return { abort: true, ok: false, err: 'auth' };
    u.prayers = Array.isArray(u.prayers) ? u.prayers : [];
    if (act === 'add') {
      const text = str_(a.text, 200);
      if (!text) return { abort: true, ok: false, err: 'text' };
      if (u.prayers.length >= MAX_PRAYERS) return { abort: true, ok: false, err: 'too_many' };
      u.prayers.push({ id: 'y' + crypto.randomBytes(5).toString('hex'), text: text, made: today_(), answered: '' });
      return { ok: true };
    }
    const x = u.prayers.filter(function (y) { return y.id === a.id; })[0];
    if (!x) return { abort: true, ok: false, err: 'none' };
    if (act === 'answer') { x.answered = a.on ? today_() : ''; return { ok: true }; }
    if (act === 'drop') { u.prayers = u.prayers.filter(function (y) { return y.id !== a.id; }); return { ok: true }; }
    return { abort: true, ok: false, err: 'act' };
  });
  if (!res.ok) return res;
  return { ok: true, me: selfOut_(await readJSON('u:' + uid, null)) };
}

/* ---------------- XP and levels ----------------
   Every good thing earns XP, once: a habit ticked (5), one of today's 3 done (5, all three
   +10), focus (1 per 2 minutes), the evening check-in (5), a life-plan step (15), a goal
   reached (100), a challenge day (10), a week at 100% (30), a test taken (50). u.xpLog keeps
   what each was worth by a key ('h|date|habit', 's|step'…), so undoing takes it back and
   nothing counts twice; u.xp is the total. Dated keys older than XP_LOG_DAYS are dropped
   from the log (the total keeps them). Levels: 100 XP to level 2, then 50 more each level. */
const XP_LOG_DAYS = 130, LEVEL_TITLES = [[1, 'Seed', '🌱'], [3, 'Sprout', '🌿'], [5, 'Leaf', '🍃'], [8, 'Tree', '🌳'], [12, 'Bamboo', '🎋'], [17, 'Lotus', '🪷'], [23, 'Elephant', '🐘'], [30, 'Angkor', '🏛️']];
function xpForLevel_(L) { return L <= 1 ? 0 : (L - 1) * 100 + 25 * (L - 1) * (L - 2); }   // 0, 100, 250, 450, 700…
function levelOf_(xp) {
  xp = xp || 0; let L = 1;
  while (xpForLevel_(L + 1) <= xp && L < 200) L++;
  let t = LEVEL_TITLES[0]; LEVEL_TITLES.forEach(function (x) { if (L >= x[0]) t = x; });
  return { level: L, title: t[1], icon: t[2], xp: xp, from: xpForLevel_(L), to: xpForLevel_(L + 1) };
}
function xpAdd_(u, key, n) {
  u.xpLog = u.xpLog && typeof u.xpLog === 'object' ? u.xpLog : {};
  if (key in u.xpLog || !(n > 0)) return;
  const before = levelOf_(u.xp).level;
  u.xpLog[key] = n; u.xp = (u.xp || 0) + n;
  const wk = weekOf_(today_()); u.xpWeeks = u.xpWeeks || {}; u.xpWeeks[wk] = (u.xpWeeks[wk] || 0) + n;
  Object.keys(u.xpWeeks).sort().slice(0, -8).forEach(function (k) { delete u.xpWeeks[k]; });
  const after = levelOf_(u.xp).level;
  if (after > before && (after % 5 === 0 || LEVEL_TITLES.some(function (x) { return x[0] === after; }))) addPost_(u, 'level', after);
  const cut = addDays_(today_(), -XP_LOG_DAYS);
  Object.keys(u.xpLog).forEach(function (k) { const m = /\|(\d{4}-\d{2}-\d{2})/.exec(k); if (m && m[1] < cut) delete u.xpLog[k]; });
}
function xpDrop_(u, key) {
  if (u.xpLog && key in u.xpLog) {
    u.xp = Math.max(0, (u.xp || 0) - u.xpLog[key]);
    const wk = weekOf_(today_()); if (u.xpWeeks && u.xpWeeks[wk]) u.xpWeeks[wk] = Math.max(0, u.xpWeeks[wk] - u.xpLog[key]);
    delete u.xpLog[key];
  }
}

/* ---------------- the feed's moments ----------------
   When something worth a 👏 happens, the server notes it on the person (u.posts): a streak
   milestone, a life goal reached, a test taken, a week at 100%, joining a team. Never words of
   their own — no goal titles, habit names or answers. Each kind shows only while the person's
   matching switch is on (POST_SHARE) and their 'feed' switch is on. Kept 30 days. */
const STREAK_MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365, 500, 1000];
const POST_SHARE = { calling: 'plan', apest: 'apest', journey: 'plan', streak: 'streak', goal: 'plan', type: 'type', strengths: 'strengths', week: 'week', joined: 'teams', focus: 'focus', challenge: 'teams', level: 'level', reading: 'feed' };
const KEEP_POST_DAYS = 30, MAX_POSTS = 40, MAX_CLAPS = 300;
function addPost_(u, kind, n) {
  const cut = addDays_(today_(), -KEEP_POST_DAYS);
  u.posts = (Array.isArray(u.posts) ? u.posts : []).filter(function (x) { return x.at >= cut; });
  if (u.posts.some(function (x) { return x.kind === kind && x.n === n; })) return;   // once is enough
  u.posts.push({ id: 'p' + crypto.randomBytes(5).toString('hex'), kind: kind, n: n == null ? null : n, at: today_(), claps: [] });
  u.posts = u.posts.slice(-MAX_POSTS);
}
function postShown_(u, x) {
  const sh = shareOf_(u);
  if (!sh.feed || sh[POST_SHARE[x.kind]] === false) return false;
  if (x.kind === 'type') return !!(u.personality && u.personality.share !== false);
  if (x.kind === 'strengths') return !!(u.gstrengths && u.gstrengths.share !== false);
  if (x.kind === 'apest') return !!(u.apest && u.apest.share !== false);
  return true;
}

/* ---------------- what goes out ----------------
   lang: English first (Uriah, Nov 2026) — Khmer only when someone chose it; older accounts were saved
   as 'km' by default, not by choice, so they read as English until Khmer is picked. */
/* What I see of myself. */
function selfOut_(u) {
  return {
    id: u.id, username: u.username, name: u.name, birthYear: u.birthYear, minor: isMinor_(u),
    lang: u.langChosen && u.lang === 'km' ? 'km' : 'en', sex: u.sex || '', bio: u.bio || '', share: shareOf_(u),
    personality: u.personality || null, gstrengths: u.gstrengths || null, apest: u.apest || null, clifton: u.clifton || null,
    habits: u.habits || [], days: u.days || {}, weeks: u.weeks || {},
    teams: u.teams || [], invites: u.invites || [], stats: statsOf_(u), hasPhoto: !!u.hasPhoto,
    plan: planOf_(u), tasks: u.tasks || [], daily: u.daily || {}, admin: isAdmin_(u), blocked: (u.blocked || []).length, hasPassword: !!u.pw, level: levelOf_(u.xp),
    reading: u.reading || {}, prayers: u.prayers || [], story: storyOf_(u), calling: callingOf_(u), resets: u.resets || {}, journalDays: Object.keys(u.journal || {}).sort(), xpWeek: (u.xpWeeks || {})[weekOf_(today_())] || 0
  };
}
/* What someone else sees of a person. `close` = they share a team. */
function cardOut_(u, close) {
  const sh = shareOf_(u), minor = isMinor_(u), st = statsOf_(u);
  const o = { id: u.id, username: u.username, name: minor ? firstName_(u.name) : u.name, hasPhoto: !!u.hasPhoto, minor: minor };
  if (sh.type && u.personality && u.personality.share !== false) { o.type = u.personality.type; o.sex = u.sex || ''; }
  if (sh.strengths && u.gstrengths && u.gstrengths.share !== false) o.strengths = u.gstrengths.top.slice();
  if (sh.strengths && u.clifton) o.clifton = u.clifton.top.slice();
  if (sh.apest && u.apest && u.apest.share !== false) o.apest = u.apest.top.slice(0, 2);
  if (sh.journey) {   // the Life Journey, a little: how far, the word for the year, who I'm becoming (chip ids) — never the answers or the vision
    const st = storyOf_(u), pl = planOf_(u), known = (st.a.known && Array.isArray(st.a.known.c)) ? st.a.known.c.slice(0, 3) : [];
    if (st.done.length || pl.word) o.journey = { stops: st.done.length, finished: !!st.finished, word: pl.word || '', becoming: known };
  }   // the two strongest gifts, never the answers or numbers
  if (sh.streak) { o.streak = st.streak; o.best = st.best; }
  if (sh.week && st.week !== null) o.week = st.week;
  if (sh.teams && close) o.teamCount = (u.teams || []).length;
  if (sh.plan) { const ps = planStats_(u); if (ps.goals || ps.reached) o.plan = ps; }   // counts, never the words
  if (sh.focus && st.focusWeek) o.focusWeek = st.focusWeek;   // minutes, never what they worked on
  if (sh.level) { const lv = levelOf_(u.xp || 0); o.level = { level: lv.level, title: lv.title, icon: lv.icon }; o.xpWeek = (u.xpWeeks || {})[weekOf_(today_())] || 0; }   // everyone, from day one (a new class's leaderboard)
  o.tests = st.tests;
  if (!minor && u.bio) o.bio = u.bio;
  return o;
}
async function sharesTeam_(a, b) {
  const mine = a.teams || [], theirs = b.teams || [];
  return mine.some(function (t) { return theirs.indexOf(t) > -1; });
}

/* ---------------- handlers ---------------- */
async function authConfig() { return { ok: true, google: googleClientId_() }; }

/* Google first: a known account signs in; an unknown one is told 'new' so the
   page can ask for a username and birth year, then calls register. */
async function loginGoogle(token) {
  const g = await verifyGoogle_(token);
  if (!g) return { ok: false, err: 'google' };
  const map = await readJSON('gsub:' + sha_(g.sub), null);
  if (!map || !map.id) return { ok: false, err: 'new', name: g.name };
  let tok = null;
  const res = await mutate_('u:' + map.id, null, function (u) {
    if (!u || u.closed) return { abort: true, ok: false, err: 'auth' };
    if (u.suspended) return { abort: true, ok: false, err: 'suspended' };
    tok = addToken_(u); u.seen = today_(); if (g.email) u.eh = sha_(g.email);
    return { ok: true };
  });
  if (!res.ok) return res;
  const u = await readJSON('u:' + map.id, null);
  return { ok: true, uid: u.id, token: tok, me: selfOut_(u) };
}

async function checkUsername(name) {
  const n = cleanUsername_(name);
  if (!n) return { ok: true, free: false, err: 'bad' };
  return { ok: true, free: !(await readJSON('uname:' + n, null)) };
}

/* ---------------- username and password (Nov 2026: "a basic login besides Google") ----------------
   A password is kept only as a salted scrypt hash (u.pw). After PW_MAX_FAILS wrong tries in a
   row an account locks for PW_LOCK_MIN minutes. There is no email, so a forgotten password is
   reset by the admin (adminResetPassword), who gets a one-time password to pass on. */
const PW_MIN = 8, PW_MAX = 128, PW_MAX_FAILS = 8, PW_LOCK_MIN = 15;
function pwHash_(pw, salt) { return crypto.scryptSync(String(pw), salt, 32, { N: 16384, r: 8, p: 1 }).toString('hex'); }
function cleanPassword_(pw) { const x = typeof pw === 'string' ? pw : ''; return x.length >= PW_MIN && x.length <= PW_MAX ? x : null; }
function makePw_(pw) { const salt = crypto.randomBytes(16).toString('hex'); return { salt: salt, hash: pwHash_(pw, salt), at: new Date().toISOString() }; }
function pwOk_(u, pw) { return !!(u && u.pw && typeof pw === 'string' && pw.length <= PW_MAX && safeEq_(pwHash_(pw, u.pw.salt), u.pw.hash)); }
async function registerPassword(p) {
  p = p && typeof p === 'object' ? p : {};
  const pw = cleanPassword_(p.password);
  if (!pw) return { ok: false, err: 'password' };
  return register(null, p, makePw_(pw));
}
async function loginPassword(username, password) {
  const n = cleanUsername_(username);
  const map = n ? await readJSON('uname:' + n, null) : null;
  const u0 = map ? await readJSON('u:' + map.id, null) : null;
  if (!u0 || u0.closed) return { ok: false, err: 'login' };
  if (u0.suspended) return { ok: false, err: 'suspended' };
  if (u0.pwLock && u0.pwLock.until && Date.parse(u0.pwLock.until) > Date.now()) return { ok: false, err: 'locked' };
  if (!u0.pw) return { ok: false, err: 'google_only' };
  let tok = null;
  const good = pwOk_(u0, password);
  const res = await mutate_('u:' + u0.id, null, function (u) {
    if (!u) return { abort: true, ok: false, err: 'login' };
    if (!good) {
      const lock = u.pwLock || {}, expired = !!(lock.until && Date.parse(lock.until) <= Date.now());
      const f = (expired ? 0 : (lock.n || 0)) + 1;   // a lock that has run out starts the count again
      u.pwLock = f >= PW_MAX_FAILS ? { n: f, until: new Date(Date.now() + PW_LOCK_MIN * 60000).toISOString() } : { n: f };
      return { ok: false, err: f >= PW_MAX_FAILS ? 'locked' : 'login' };
    }
    delete u.pwLock; tok = addToken_(u); u.seen = today_();
    return { ok: true };
  });
  if (!res.ok) return res;
  const u = await readJSON('u:' + u0.id, null);
  return { ok: true, uid: u.id, token: tok, me: selfOut_(u) };
}
/* Set or change my password. With a password already, the current one is needed. */
async function setPassword(uid, tok, current, next) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  if (me.pw && !pwOk_(me, current)) return { ok: false, err: 'current' };
  const pw = cleanPassword_(next);
  if (!pw) return { ok: false, err: 'password' };
  await mutate_('u:' + uid, null, function (u) { if (u) { u.pw = makePw_(pw); delete u.pwLock; } return { ok: true }; });
  return { ok: true, me: selfOut_(await readJSON('u:' + uid, null)) };
}
/* The admin gives someone who forgot their password a one-time one; it signs them out everywhere. */
async function adminResetPassword(uid, tok, username) {
  const me = await auth_(uid, tok);
  if (!me || !isAdmin_(me)) return { ok: false, err: 'not_admin' };
  const n = cleanUsername_(username), map = n ? await readJSON('uname:' + n, null) : null;
  if (!map || map.id === uid) return { ok: false, err: 'none' };
  const A = 'abcdefghjkmnpqrstuvwxyz23456789', b = crypto.randomBytes(10);
  let temp = ''; for (let i = 0; i < 10; i++) temp += A[b[i] % A.length];
  const res = await mutate_('u:' + map.id, null, function (u) {
    if (!u || u.closed) return { abort: true, ok: false, err: 'none' };
    u.pw = makePw_(temp); u.tokens = []; delete u.pwLock;
    return { ok: true };
  });
  return res.ok ? { ok: true, username: n, password: temp } : res;
}

/* Google (token) or a password (pw, from registerPassword). */
async function register(token, p, pw) {
  let g = null;
  if (!pw) { g = await verifyGoogle_(token); if (!g) return { ok: false, err: 'google' }; }
  p = p && typeof p === 'object' ? p : {};
  const username = cleanUsername_(p.username);
  if (!username) return { ok: false, err: 'username' };
  const name = str_(p.name, 60);
  if (name.length < 2) return { ok: false, err: 'name' };
  const by = Number(p.birthYear), y = thisYear_();
  if (!(by >= y - 100 && by <= y)) return { ok: false, err: 'birthYear' };
  if (y - by < MIN_AGE) return { ok: false, err: 'too_young' };   // even at the most, they are under 13
  const gkey = g ? 'gsub:' + sha_(g.sub) : null;
  if (gkey && await readJSON(gkey, null)) return { ok: false, err: 'exists' };
  if (await readJSON('uname:' + username, null)) return { ok: false, err: 'taken' };
  const id = 'u' + crypto.randomBytes(9).toString('hex');
  const u = {
    id: id, username: username, name: name, birthYear: by, lang: p.lang === 'km' ? 'km' : 'en', langChosen: p.lang === 'km' && p.langChosen === true,
    created: new Date().toISOString(), seen: today_(), teams: [], habits: [], days: {}, weeks: {}, share: {},
    eh: g && g.email ? sha_(g.email) : ''
  };
  if (pw) u.pw = pw;
  const tok = addToken_(u);
  await writeJSON('uname:' + username, { id: id });
  if (gkey) await writeJSON(gkey, { id: id });
  await writeJSON('u:' + id, u);
  await mutate_('people', [], function (rows) { rows.push({ id: id, username: username, name: name, minor: isMinor_(u) }); return { ok: true }; });
  let joined = null;
  if (p.code) { const j = await joinTeam(id, tok, p.code); if (j.ok) joined = j.team; }
  const fresh = await readJSON('u:' + id, u);
  return { ok: true, uid: id, token: tok, me: selfOut_(fresh), joined: joined };
}

async function boot(uid, tok) {
  const u = await auth_(uid, tok);
  if (!u) return { ok: false, err: 'auth' };
  let froze = [];
  if (u.seen !== today_()) {
    await mutate_('u:' + uid, null, function (r) { if (r) { r.seen = today_(); froze = applyFreezes_(r); } return { ok: true }; });
    if (froze.length) Object.assign(u, await readJSON('u:' + uid, u));
  }
  const teams = [], teamTasks = [], myChallenges = [], myMeets = [];
  for (const tid of (u.teams || [])) {
    const t = await readJSON('t:' + tid, null);
    if (!t) continue;
    teams.push(teamBrief_(t, uid));
    teamTasksOut_(t, uid, {}).forEach(function (k) { if (k.forMe && !k.mine) teamTasks.push(Object.assign({ team: t.id, teamName: t.name, emoji: t.emoji || '✦' }, k)); });
    meetsOut_(t, uid, null).forEach(function (m) { if (m.date <= addDays_(today_(), 14) && m.mine !== 'no') myMeets.push(Object.assign({ team: t.id, teamName: t.name, emoji: t.emoji || '✦' }, m)); });
    challengesOut_(t, uid, {}).forEach(function (c) { if (c.joined && c.state === 'on') myChallenges.push(Object.assign({ teamName: t.name, teamEmoji: t.emoji || '✦' }, c, { people: undefined, others: c.people.length - 1 })); });
  }
  const co = await coachings(uid, tok);
  const pk = await pushKeys_(true);
  const fr = await friendsList(uid, tok);
  return { ok: true, me: selfOut_(u), teams: teams, teamTasks: teamTasks, coach: co.ok ? co.coachings : [], cheers: await cheersFor_(u),
    push: pk ? { key: pk.pub, prefs: pushPrefsOf_(u) } : null, challenges: myChallenges, plans: READING_PLANS, froze: froze, friends: fr.ok ? fr.friends : [], friendAsks: fr.ok ? fr.asks : [], today: today_(),
    meets: myMeets.sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; }) };
}

/* name, bio, language, character, what to show — all optional */
async function saveProfile(uid, tok, p) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  p = p && typeof p === 'object' ? p : {};
  const res = await mutate_('u:' + uid, null, function (u) {
    if (!u) return { abort: true, ok: false, err: 'auth' };
    if (p.name !== undefined) { const n = str_(p.name, 60); if (n.length < 2) return { abort: true, ok: false, err: 'name' }; u.name = n; }
    if (p.bio !== undefined) u.bio = str_(p.bio, 160);
    if (p.lang === 'km' || p.lang === 'en') { u.lang = p.lang; u.langChosen = true; }
    if (p.sex !== undefined) u.sex = (p.sex === 'male' || p.sex === 'female') ? p.sex : '';
    if (p.share && typeof p.share === 'object') {
      u.share = Object.assign({}, u.share || {});
      SHARE_KEYS.forEach(function (k) { if (typeof p.share[k] === 'boolean') u.share[k] = p.share[k]; });
    }
    return { ok: true };
  });
  if (!res.ok) return res;
  const u = await readJSON('u:' + uid, null);
  if (p.name !== undefined) await mutate_('people', [], function (rows) { rows.forEach(function (r) { if (r.id === uid) r.name = u.name; }); return { ok: true }; });
  return { ok: true, me: selfOut_(u) };
}

/* a small JPEG the page already shrank; '' takes it away */
async function savePhoto(uid, tok, dataUri) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  const d = String(dataUri || '');
  if (d && (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(d) || d.length > 120000)) return { ok: false, err: 'photo' };
  if (d) await writeJSON('ph:' + uid, { d: d }); else await dropKey('ph:' + uid);
  await mutate_('u:' + uid, null, function (u) { if (u) u.hasPhoto = !!d; return { ok: true }; });
  return { ok: true, me: selfOut_(await readJSON('u:' + uid, null)) };
}
/* Photos of people I may see: myself, anyone not under 18, and anyone in a team with me. */
async function photos(uid, tok, ids) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  const out = {};
  for (const id of (Array.isArray(ids) ? ids : []).slice(0, 60)) {
    if (typeof id !== 'string' || !/^u[a-f0-9]{18}$/.test(id)) continue;
    const u = id === uid ? me : await readJSON('u:' + id, null);
    if (!u || !u.hasPhoto) continue;
    if (id !== uid && (gone_(u) || blocked_(me, u))) continue;
    if (id !== uid && isMinor_(u) && !(await sharesTeam_(me, u))) continue;
    const p = await readJSON('ph:' + id, null);
    if (p && p.d) out[id] = p.d;
  }
  return { ok: true, photos: out };
}

async function savePersonality(uid, tok, p) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  p = p && typeof p === 'object' ? p : {};
  const res = await mutate_('u:' + uid, null, function (u) {
    if (!u) return { abort: true, ok: false, err: 'auth' };
    if (p.remove) { delete u.personality; return { ok: true }; }
    const cur = u.personality || {};
    if (p.type !== undefined) {
      if (PTYPE_CODES.indexOf(p.type) === -1) return { abort: true, ok: false, err: 'type' };
      const scores = p.scores == null ? null : cleanPScores_(p.scores, p.type);
      if (p.scores != null && !scores) return { abort: true, ok: false, err: 'scores' };
      u.personality = { type: p.type, scores: scores, source: scores ? 'test' : 'picked', at: today_(), share: cur.share !== false, season: cur.season || 'ordinary' };
      if (cur.type !== p.type) addPost_(u, 'type', p.type);
      xpAdd_(u, 'pt', 50);
    } else if (!u.personality) return { abort: true, ok: false, err: 'type' };
    if (typeof p.share === 'boolean') u.personality.share = p.share;
    if (PSEASON_IDS.indexOf(p.season) > -1) u.personality.season = p.season;
    if (p.sex === 'male' || p.sex === 'female') u.sex = p.sex;
    return { ok: true };
  });
  if (!res.ok) return res;
  return { ok: true, me: selfOut_(await readJSON('u:' + uid, null)) };
}

/* ---------------- the five gifts (APEST: Ephesians 4:11) ----------------
   30 statements (public/apest.js, this app's own), 6 for each gift, each answered 1–5. The page
   sends the answers; the sums are worked out here, so what others see follows from the answers.
   A statement's id starts with its gift: a apostle, p prophet, e evangelist, s shepherd, t teacher. */
const APEST_IDS = ['a', 'p', 'e', 's', 't'];
function apestScore_(answers) {
  if (!answers || typeof answers !== 'object') return null;
  const sum = {}, clean = {};
  APEST_IDS.forEach(function (g) { sum[g] = 0; });
  for (const g of APEST_IDS) for (let i = 1; i <= 6; i++) {
    const k = g + i, v = Number(answers[k]);
    if ([1, 2, 3, 4, 5].indexOf(v) === -1) return null;
    clean[k] = v; sum[g] += v;
  }
  const scores = {}; APEST_IDS.forEach(function (g) { scores[g] = Math.round((sum[g] - 6) / 24 * 100); });
  const top = APEST_IDS.slice().sort(function (x, y) { return (sum[y] - sum[x]) || (APEST_IDS.indexOf(x) - APEST_IDS.indexOf(y)); });
  return { answers: clean, scores: scores, top: top };
}
async function saveApest(uid, tok, p) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  p = p && typeof p === 'object' ? p : {};
  let scored = null;
  if (p.answers) { scored = apestScore_(p.answers); if (!scored) return { ok: false, err: 'answers' }; }
  const res = await mutate_('u:' + uid, null, function (u) {
    if (!u) return { abort: true, ok: false, err: 'auth' };
    if (scored && !u.apest) addPost_(u, 'apest', scored.top[0]);
    if (scored) { xpAdd_(u, 'ap', 50); u.apest = { answers: scored.answers, scores: scored.scores, top: scored.top, at: today_(), share: !(u.apest && u.apest.share === false) }; }
    else if (!u.apest) return { abort: true, ok: false, err: 'answers' };
    if (typeof p.share === 'boolean') u.apest.share = p.share;
    return { ok: true };
  });
  if (!res.ok) return res;
  return { ok: true, me: selfOut_(await readJSON('u:' + uid, null)) };
}
/* ---------------- StrengthsFinder results someone already has ----------------
   (Uriah, Nov 2026: "let me manually put in my strength finders if I have them".) The Top 5 a
   person got from Gallup's CliftonStrengths, typed in by them: only the five theme names, in
   order — the app carries no Gallup text. u.clifton = { top: [5 names], at }. Others see it with
   the strengths, behind share.strengths. */
const CLIFTON = ['Achiever', 'Arranger', 'Belief', 'Consistency', 'Deliberative', 'Discipline', 'Focus', 'Responsibility', 'Restorative',
  'Activator', 'Command', 'Communication', 'Competition', 'Maximizer', 'Self-Assurance', 'Significance', 'Woo',
  'Adaptability', 'Connectedness', 'Developer', 'Empathy', 'Harmony', 'Includer', 'Individualization', 'Positivity', 'Relator',
  'Analytical', 'Context', 'Futuristic', 'Ideation', 'Input', 'Intellection', 'Learner', 'Strategic'];
async function saveClifton(uid, tok, p) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  p = p && typeof p === 'object' ? p : {};
  let top = null;
  if (!p.clear) {
    top = Array.isArray(p.top) ? p.top.filter(function (x, i, a) { return CLIFTON.indexOf(x) > -1 && a.indexOf(x) === i; }) : [];
    if (top.length !== 5) return { ok: false, err: 'top' };
  }
  await mutate_('u:' + uid, null, function (u) { if (u) { if (top) u.clifton = { top: top, at: today_() }; else delete u.clifton; } return { ok: true }; });
  return { ok: true, me: selfOut_(await readJSON('u:' + uid, null)) };
}
async function saveStrengths(uid, tok, p) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  p = p && typeof p === 'object' ? p : {};
  let scored = null;
  if (p.answers) { scored = gsScore_(p.answers); if (!scored) return { ok: false, err: 'answers' }; }
  const res = await mutate_('u:' + uid, null, function (u) {
    if (!u) return { abort: true, ok: false, err: 'auth' };
    if (scored && !u.gstrengths) addPost_(u, 'strengths', null);
    if (scored) xpAdd_(u, 'gs', 50);
    if (scored) u.gstrengths = { answers: scored.answers, scores: scored.scores, top: scored.top, at: today_(), share: !(u.gstrengths && u.gstrengths.share === false) };
    else if (!u.gstrengths) return { abort: true, ok: false, err: 'answers' };
    if (typeof p.share === 'boolean') u.gstrengths.share = p.share;
    return { ok: true };
  });
  if (!res.ok) return res;
  return { ok: true, me: selfOut_(await readJSON('u:' + uid, null)) };
}

async function saveHabits(uid, tok, list) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  const clean = cleanHabits_(list);
  if (!clean) return { ok: false, err: 'habits' };
  await mutate_('u:' + uid, null, function (u) { if (u) u.habits = clean; return { ok: true }; });
  return { ok: true, me: selfOut_(await readJSON('u:' + uid, null)) };
}
/* Ticks for one day: yesterday or today only (a phone a little off is still fine). */
async function tickHabit(uid, tok, day, habitId, done) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  const t = today_();
  if (!isDay_(day) || (day !== t && day !== addDays_(t, -1) && day !== addDays_(t, 1))) return { ok: false, err: 'day' };
  const res = await mutate_('u:' + uid, null, function (u) {
    if (!u) return { abort: true, ok: false, err: 'auth' };
    if (!(u.habits || []).some(function (h) { return h.id === habitId; })) return { abort: true, ok: false, err: 'habit' };
    u.days = u.days || {};
    const m = Object.assign({}, u.days[day] || {});
    if (done) m[habitId] = true; else delete m[habitId];
    if (done) xpAdd_(u, 'h|' + day + '|' + habitId, 5); else xpDrop_(u, 'h|' + day + '|' + habitId);
    if (Object.keys(m).length) u.days[day] = m; else delete u.days[day];
    const cut = addDays_(t, -KEEP_DAYS);
    Object.keys(u.days).forEach(function (d) { if (d < cut) delete u.days[d]; });
    applyFreezes_(u);
    const st = streakOf_(u.days, u.frozen);
    if (done && STREAK_MILESTONES.indexOf(st) > -1) addPost_(u, 'streak', st);
    if (done && st > 0 && st % 7 === 0 && u.freezeAt !== t && (u.freezes || 0) < MAX_FREEZES) { u.freezes = (u.freezes || 0) + 1; u.freezeAt = t; }
    return { ok: true };
  });
  if (!res.ok) return res;
  return { ok: true, me: selfOut_(await readJSON('u:' + uid, null)) };
}
/* Up to three goals for a week (keyed by its Monday): text and how far along. */
async function saveWeek(uid, tok, week, goals) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  if (!isDay_(week) || weekOf_(week) !== week) return { ok: false, err: 'week' };
  const t = weekOf_(today_());
  if (week < addDays_(t, -7 * 8) || week > addDays_(t, 7)) return { ok: false, err: 'week' };
  if (!Array.isArray(goals)) return { ok: false, err: 'goals' };
  const clean = goals.slice(0, MAX_GOALS).map(function (g) {
    const pct = Math.round((Number(g && g.pct) || 0) / 5) * 5;
    return { text: str_(g && g.text, 120), pct: Math.max(0, Math.min(100, pct)) };
  }).filter(function (g) { return g.text; });
  await mutate_('u:' + uid, null, function (u) {
    if (!u) return { ok: false };
    u.weeks = u.weeks || {};
    if (clean.length) u.weeks[week] = clean; else delete u.weeks[week];
    if (weekPct_(clean) === 100) { addPost_(u, 'week', week); xpAdd_(u, 'w|' + week, 30); }
    Object.keys(u.weeks).sort().slice(0, -60).forEach(function (k) { delete u.weeks[k]; });
    return { ok: true };
  });
  return { ok: true, me: selfOut_(await readJSON('u:' + uid, null)) };
}

/* ---------------- the Sunday reset ----------------
   Once a week (Saturday to Monday) a few minutes: look back (what went well, what was hard), look
   up (which part of life needs care this week) and look ahead (the week's three goals, saved with
   saveWeek). u.resets[monday] = { good, hard, area, at }, the last 26 weeks — private, like the
   rest of the plan. 30 XP once a week. `week` is the Monday of the week being planned. */
async function weekReset(uid, tok, week, a) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  a = a && typeof a === 'object' ? a : {};
  const t = weekOf_(today_());
  if (!isDay_(week) || weekOf_(week) !== week || (week !== t && week !== addDays_(t, 7))) return { ok: false, err: 'week' };
  await mutate_('u:' + uid, null, function (u) {
    if (!u) return { ok: false };
    u.resets = u.resets && typeof u.resets === 'object' ? u.resets : {};
    u.resets[week] = { good: str_(a.good, 300), hard: str_(a.hard, 300), area: AREAS.indexOf(a.area) > -1 ? a.area : '', at: today_() };
    Object.keys(u.resets).sort().slice(0, -26).forEach(function (k) { delete u.resets[k]; });
    xpAdd_(u, 'wr|' + week, 30);
    return { ok: true };
  });
  return { ok: true, me: selfOut_(await readJSON('u:' + uid, null)) };
}

/* ---------------- the life plan ----------------
   A sentence about why ("what God made me for"), up to MAX_LIFE_GOALS SMART goals
   (what exactly · how I'll know · what will help · why it matters · by when),
   each broken into steps for a quarter ('2027-Q1') or a month ('2027-01'), and
   a person's own tasks. All of it is theirs alone: others see counts (cardOut_). */
const AREAS = ['faith', 'family', 'study', 'health', 'money', 'serve'];
const MAX_LIFE_GOALS = 8, MAX_KEPT_GOALS = 30, MAX_STEPS = 40, MAX_TASKS = 60, KEEP_DONE_TASKS = 30;
function monthOf_(iso) { return iso.slice(0, 7); }
function quarterOf_(iso) { return iso.slice(0, 4) + '-Q' + (Math.floor((Number(iso.slice(5, 7)) - 1) / 3) + 1); }
function isMonth_(s) { return typeof s === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(s); }
function isQuarter_(s) { return typeof s === 'string' && /^\d{4}-Q[1-4]$/.test(s); }
function inYears_(s) { const y = Number(String(s).slice(0, 4)); return y >= thisYear_() - 1 && y <= thisYear_() + 10; }
function planOf_(u) { const p = (u && u.plan) || {}; return { why: p.why || '', goals: Array.isArray(p.goals) ? p.goals : [], vision: p.vision || '', word: p.word || '' }; }
function activeGoals_(u) { return planOf_(u).goals.filter(function (g) { return !g.done; }); }
function planStats_(u) {
  const goals = planOf_(u).goals, m = monthOf_(today_());
  let steps = 0;
  goals.forEach(function (g) { (g.steps || []).forEach(function (s) { if (s.done && monthOf_(s.done) === m) steps++; }); });
  return { goals: goals.filter(function (g) { return !g.done; }).length, reached: goals.filter(function (g) { return g.done; }).length, steps: steps };
}

async function savePlanWhy(uid, tok, text) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  await mutate_('u:' + uid, null, function (u) { if (u) { u.plan = planOf_(u); u.plan.why = str_(text, 300); } return { ok: true }; });
  return { ok: true, me: selfOut_(await readJSON('u:' + uid, null)) };
}
/* A new goal (no id) or changes to one. */
async function saveGoal(uid, tok, g) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  g = g && typeof g === 'object' ? g : {};
  const title = str_(g.title, 100);
  if (title.length < 2) return { ok: false, err: 'title' };
  if (AREAS.indexOf(g.area) === -1) return { ok: false, err: 'area' };
  if (!isMonth_(g.by) || !inYears_(g.by)) return { ok: false, err: 'by' };
  const fields = { area: g.area, title: title, measure: str_(g.measure, 160), help: str_(g.help, 160), why: str_(g.why, 200), by: g.by };
  let gid = null;
  const res = await mutate_('u:' + uid, null, function (u) {
    if (!u) return { abort: true, ok: false, err: 'auth' };
    u.plan = planOf_(u);
    if (g.id) {
      const cur = u.plan.goals.filter(function (x) { return x.id === g.id; })[0];
      if (!cur) return { abort: true, ok: false, err: 'none' };
      Object.assign(cur, fields); gid = cur.id;
      return { ok: true };
    }
    if (fields.by < monthOf_(today_())) return { abort: true, ok: false, err: 'by' };
    if (activeGoals_(u).length >= MAX_LIFE_GOALS) return { abort: true, ok: false, err: 'too_many' };
    gid = 'g' + crypto.randomBytes(6).toString('hex');
    u.plan.goals.push(Object.assign({ id: gid, made: today_(), done: '', steps: [] }, fields));
    const reached = u.plan.goals.filter(function (x) { return x.done; });
    if (u.plan.goals.length > MAX_KEPT_GOALS && reached.length) {   // the oldest reached goals go first
      const drop = reached.sort(function (a, b) { return a.done < b.done ? -1 : 1; }).slice(0, u.plan.goals.length - MAX_KEPT_GOALS).map(function (x) { return x.id; });
      u.plan.goals = u.plan.goals.filter(function (x) { return drop.indexOf(x.id) === -1; });
    }
    return { ok: true };
  });
  if (!res.ok) return res;
  return { ok: true, id: gid, me: selfOut_(await readJSON('u:' + uid, null)) };
}
/* ---------------- the Life Journey (Plan tab → view journey) ----------------
   A Q&A in seven stops, in the order of a hero's journey: where you come from, who you are, the
   call, the dragons, your guides, the future you want, your legacy. Its questions borrow the best
   of a few ways of writing a life plan (looking back over your story and ahead to the future you
   want and the one to avoid; your life as a story with a call, a problem to solve and guides; a
   picture of each area of life and how you want to be remembered) — in our own words. The app
   writes a vision statement from the answers; the person edits it and keeps it (u.plan.vision,
   u.plan.word). The answers (u.story = { a: {key: answer}, done: [stop ids], finished }) are
   theirs alone: only selfOut_ sends them, never a card, a coach or a leader. 20 XP a stop (once
   ever), 60 for the vision, 5 a day for reading it again (Home → My vision). */
const JOURNEY_STOPS = ['home', 'you', 'call', 'dragon', 'guide', 'future', 'legacy'];
const STORY_TEXT = ['best', 'hard', 'lesson', 'flow', 'dream', 'avoid', 'helped', 'guideFor', 'year', 'remember',
  'chapter', 'giftStory', 'weakFree', 'heartSaw', 'fearStory', 'brave', 'person5', 'wordWhy'];   // Nov 2026: more in their own words
const STORY_CHIPS = { pastWords: 3, gifts: 3, weak: 2, heart: 2, who: 2, fear: 1, truth: 1, walk: 3, known: 3, word: 1 };
function strMl_(v, max) { return String(v == null ? '' : v).replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max); }
function wheelOf_(v) { const o = {}; v = v && typeof v === 'object' ? v : {}; AREAS.forEach(function (a) { const n = Number(v[a]); if ([1, 2, 3, 4, 5].indexOf(n) > -1) o[a] = n; }); return o; }
function storyAnswer_(k, v) {
  if (STORY_TEXT.indexOf(k) > -1) return str_(v, 300);
  if (k === 'wheel') return wheelOf_(v);
  if (k === 'areas') {
    const o = {}; v = v && typeof v === 'object' ? v : {};
    AREAS.forEach(function (a) { const x = str_(v[a], 160); if (x) o[a] = x; });
    return o;
  }
  if (Object.prototype.hasOwnProperty.call(STORY_CHIPS, k)) {
    v = v && typeof v === 'object' ? v : {};
    const c = (Array.isArray(v.c) ? v.c : []).filter(function (x) { return typeof x === 'string' && /^[a-z]{2,12}$/.test(x); });
    return { c: c.filter(function (x, i) { return c.indexOf(x) === i; }).slice(0, STORY_CHIPS[k]), o: str_(v.o, 80) };
  }
  return undefined;
}
function storyOf_(u) { const s = (u && u.story) || {}; return { a: s.a && typeof s.a === 'object' ? s.a : {}, done: Array.isArray(s.done) ? s.done : [], finished: s.finished || '', wheels: Array.isArray(s.wheels) ? s.wheels : [] }; }
/* A wheel kept in the history (u.story.wheels: [{d, v}], the last 12; one a day). */
function wheelKeep_(st, v) {
  if (!Object.keys(v).length) return;
  const t = today_(); st.wheels = st.wheels.filter(function (w) { return w.d !== t; }).concat([{ d: t, v: v }]).slice(-12);
}
async function journey(uid, tok, act, a) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  a = a && typeof a === 'object' ? a : {};
  const res = await mutate_('u:' + uid, null, function (u) {
    if (!u) return { abort: true, ok: false, err: 'auth' };
    u.story = storyOf_(u);
    if (act === 'save') {   // some answers, and maybe a stop finished
      const ans = a.answers && typeof a.answers === 'object' ? a.answers : {};
      Object.keys(ans).slice(0, 40).forEach(function (k) { const v = storyAnswer_(k, ans[k]); if (v !== undefined) u.story.a[k] = v; });
      if ('wheel' in ans) wheelKeep_(u.story, u.story.a.wheel || {});
      if (a.stop != null) {
        if (JOURNEY_STOPS.indexOf(a.stop) === -1) return { abort: true, ok: false, err: 'stop' };
        if (u.story.done.indexOf(a.stop) === -1) u.story.done.push(a.stop);
        xpAdd_(u, 'j|' + a.stop, 20);
      }
      return { ok: true };
    }
    if (act === 'vision') {   // the statement they keep (edited or not), and their word for the year
      const v = strMl_(a.vision, 1500);
      if (v.length < 10) return { abort: true, ok: false, err: 'text' };
      u.plan = planOf_(u); u.plan.vision = v; u.plan.word = str_(a.word, 30);
      if (a.why != null && str_(a.why, 300)) u.plan.why = str_(a.why, 300);
      if (!u.story.finished) { u.story.finished = today_(); addPost_(u, 'journey', null); }
      xpAdd_(u, 'j|vision', 60);
      return { ok: true };
    }
    if (act === 'wheel') {   // how's my life now? Again any time; 10 XP once a month
      const v = wheelOf_(a.wheel);
      if (Object.keys(v).length < AREAS.length) return { abort: true, ok: false, err: 'wheel' };
      u.story.a.wheel = v; wheelKeep_(u.story, v); xpAdd_(u, 'w|' + monthOf_(today_()), 10);
      return { ok: true };
    }
    if (act === 'read') {   // read my vision again today: 5 XP, once a day
      if (!nearDay_(a.date)) return { abort: true, ok: false, err: 'day' };
      if (!planOf_(u).vision) return { abort: true, ok: false, err: 'none' };
      dailyMutate_(u, a.date, function (x) { x.vision = true; }); xpAdd_(u, 'v|' + a.date, 5);
      return { ok: true };
    }
    return { abort: true, ok: false, err: 'act' };
  });
  if (!res.ok) return res;
  return { ok: true, me: selfOut_(await readJSON('u:' + uid, null)) };
}

/* ---------------- my calling ----------------
   Nov 2026, Uriah: after the tests and the Life Journey, be "laser clear on what they're going to
   focus on in the next few years and why", and have "a compelling vision statement for their life"
   to send to supporters, friends and family. One choice a screen (chip ids only, like the journey):
   how I serve (do), who, the change I want for them, the sphere and the place to start; then ONE
   focus for three years, a milestone a year, what I'll say no to, why, a verse (a reference), and
   how people can help. The phone writes the statement, a letter and a short post (in English or
   Khmer); the person edits them and sends them themselves. u.calling = {a, statement, sl (its
   language), letter:{en,km}, post:{en,km} (their own edits; empty = written fresh), from (the
   first of the three years), at, upd, done:{m1..m3: the day each milestone was reached}}. Private: selfOut_ only, and a coach the mentee shares
   their plan with sees the statement, the focus and the milestones. 60 XP once; a feed moment. */
const CALL_CHIPS = { do: 1, who: 1, change: 1, place: 1, no: 3, help: 6, spheres: 2, roles: 3, skills: 4, checks: 5 };
const CALL_TEXT = { focus: 200, m1: 160, m2: 160, m3: 160, verse: 60, pray: 200, first: 200, models: 200, mentor: 200,
  good1: 80, good2: 80, good3: 80, gives: 200, drains: 200, w1: 300, w2: 300, w3: 300, w4: 300 };
const CALL_LONG = { why: 800, me: 600, alive: 600, burden: 600, person: 600, picture: 600, draw: 400, cost: 400 };   // their own words, line breaks kept
const CALL_SPHERES = ['family', 'church', 'education', 'government', 'media', 'arts', 'business', 'health', 'tech', 'land'];
function callingAnswer_(k, v) {
  if (Object.prototype.hasOwnProperty.call(CALL_LONG, k)) return strMl_(v, CALL_LONG[k]);
  if (k === 'spheres') { const x = callingAnswer_('_chips', v); x.c = x.c.filter(function (id) { return CALL_SPHERES.indexOf(id) > -1; }).slice(0, 2); x.o = ''; return x; }
  if (Object.prototype.hasOwnProperty.call(CALL_TEXT, k)) return str_(v, CALL_TEXT[k]);
  if (k === 'sphere') return CALL_SPHERES.indexOf(v) > -1 ? v : '';
  if (k === '_chips' || Object.prototype.hasOwnProperty.call(CALL_CHIPS, k)) {
    v = v && typeof v === 'object' ? v : {};
    const c = (Array.isArray(v.c) ? v.c : []).filter(function (x) { return typeof x === 'string' && /^[a-z]{2,12}$/.test(x); });
    return { c: c.filter(function (x, i) { return c.indexOf(x) === i; }).slice(0, CALL_CHIPS[k] || 10), o: str_(v.o, 80) };
  }
  return undefined;
}
function callingOf_(u) {
  const c = (u && u.calling) || {}, two = function (x) { x = x && typeof x === 'object' ? x : {}; return { en: x.en || '', km: x.km || '' }; };
  return { a: c.a && typeof c.a === 'object' ? c.a : {}, statement: c.statement || '', sl: c.sl || '', letter: two(c.letter), post: two(c.post), from: c.from || 0, at: c.at || '', upd: c.upd || '', done: c.done && typeof c.done === 'object' ? c.done : {}, step: c.step || 0, updates: Array.isArray(c.updates) ? c.updates : [] };
}
/* The three years start this year until June, next year from July. */
function callFrom_() { const d = today_(); return Number(d.slice(5, 7)) >= 7 ? Number(d.slice(0, 4)) + 1 : Number(d.slice(0, 4)); }
async function calling(uid, tok, act, a) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  a = a && typeof a === 'object' ? a : {};
  const res = await mutate_('u:' + uid, null, function (u) {
    if (!u) return { abort: true, ok: false, err: 'auth' };
    const c = callingOf_(u);
    if (act === 'save' || act === 'keep') {   // answers so far; 'keep' also keeps the statement
      const ans = a.answers && typeof a.answers === 'object' ? a.answers : {};
      Object.keys(ans).slice(0, 60).forEach(function (k) { if (k.charAt(0) === '_') return; const v = callingAnswer_(k, ans[k]); if (v !== undefined) c.a[k] = v; });
      if (Number.isInteger(a.step) && a.step >= 0 && a.step <= 60) c.step = a.step;   // where they are, to carry on later
      if (act === 'keep') {
        const st = strMl_(a.statement, 900);
        if (st.length < 10) return { abort: true, ok: false, err: 'text' };
        c.statement = st; c.sl = a.lang === 'km' ? 'km' : 'en';
        if (!c.from || c.from + 2 < thisYear_()) c.from = callFrom_();   // a new three years once the last ones are over
        if (!c.at) { c.at = today_(); addPost_(u, 'calling', null); }
        c.upd = today_(); xpAdd_(u, 'c|calling', 60);
      }
      u.calling = c; return { ok: true };
    }
    if (act === 'mile') {   // a year's milestone reached (or not): 30 XP, once each
      if (['m1', 'm2', 'm3'].indexOf(a.m) === -1 || !c.statement || !str_(c.a[a.m], 160)) return { abort: true, ok: false, err: 'none' };
      if (a.done) { c.done[a.m] = c.done[a.m] || today_(); xpAdd_(u, 'c|' + a.m, 30); } else { delete c.done[a.m]; xpDrop_(u, 'c|' + a.m); }
      u.calling = c; return { ok: true };
    }
    if (act === 'update') {   // an update for my supporters, kept (the last 12, one a day): 15 XP once a month
      if (!c.statement) return { abort: true, ok: false, err: 'none' };
      const tx = strMl_(a.text, 4000);
      if (tx.length < 20) return { abort: true, ok: false, err: 'text' };
      const d = today_(); c.updates = c.updates.filter(function (x) { return x.d !== d; }).concat([{ d: d, t: tx }]).slice(-12);
      xpAdd_(u, 'cu|' + monthOf_(d), 15);
      u.calling = c; return { ok: true };
    }
    if (act === 'dropUpdate') { c.updates = c.updates.filter(function (x) { return x.d !== a.d; }); u.calling = c; return { ok: true }; }
    if (act === 'text') {   // my own edit of the letter or the post, in one language ('' = write it fresh)
      if (['en', 'km'].indexOf(a.lang) === -1 || ['letter', 'post'].indexOf(a.kind) === -1) return { abort: true, ok: false, err: 'kind' };
      if (!c.statement) return { abort: true, ok: false, err: 'none' };
      c[a.kind][a.lang] = strMl_(a.text, a.kind === 'letter' ? 6000 : 1200);
      u.calling = c; return { ok: true };
    }
    return { abort: true, ok: false, err: 'act' };
  });
  if (!res.ok) return res;
  return { ok: true, me: selfOut_(await readJSON('u:' + uid, null)) };
}

/* One goal: add / tick / drop a step, mark it reached (or not), or delete it. */
async function goalAct(uid, tok, gid, act, a) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  a = a && typeof a === 'object' ? a : {};
  const res = await mutate_('u:' + uid, null, function (u) {
    if (!u) return { abort: true, ok: false, err: 'auth' };
    u.plan = planOf_(u);
    const g = u.plan.goals.filter(function (x) { return x.id === gid; })[0];
    if (!g) return { abort: true, ok: false, err: 'none' };
    g.steps = Array.isArray(g.steps) ? g.steps : [];
    if (act === 'delete') { u.plan.goals = u.plan.goals.filter(function (x) { return x.id !== gid; }); return { ok: true }; }
    if (act === 'reach') { g.done = a.done ? today_() : ''; if (a.done) { addPost_(u, 'goal', g.id); xpAdd_(u, 'g|' + g.id, 100); } else xpDrop_(u, 'g|' + g.id); return { ok: true }; }
    if (act === 'addStep') {
      const text = str_(a.text, 100);
      if (!text) return { abort: true, ok: false, err: 'text' };
      if (!(isMonth_(a.when) || isQuarter_(a.when)) || !inYears_(a.when)) return { abort: true, ok: false, err: 'when' };
      if (g.steps.length >= MAX_STEPS) return { abort: true, ok: false, err: 'too_many' };
      g.steps.push({ id: 's' + crypto.randomBytes(5).toString('hex'), text: text, when: a.when, done: '' });
      return { ok: true };
    }
    const s = g.steps.filter(function (x) { return x.id === a.id; })[0];
    if (!s) return { abort: true, ok: false, err: 'none' };
    if (act === 'tickStep') { s.done = a.done ? today_() : ''; if (a.done) xpAdd_(u, 's|' + s.id, 15); else xpDrop_(u, 's|' + s.id); return { ok: true }; }
    if (act === 'dropStep') { g.steps = g.steps.filter(function (x) { return x.id !== a.id; }); return { ok: true }; }
    return { abort: true, ok: false, err: 'act' };
  });
  if (!res.ok) return res;
  return { ok: true, me: selfOut_(await readJSON('u:' + uid, null)) };
}
/* A person's own tasks: add / tick / drop. Done ones are kept KEEP_DONE_TASKS days. */
async function myTask(uid, tok, act, a) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  a = a && typeof a === 'object' ? a : {};
  const res = await mutate_('u:' + uid, null, function (u) {
    if (!u) return { abort: true, ok: false, err: 'auth' };
    u.tasks = Array.isArray(u.tasks) ? u.tasks : [];
    const cut = addDays_(today_(), -KEEP_DONE_TASKS);
    u.tasks = u.tasks.filter(function (x) { return !x.done || x.done >= cut; });
    if (act === 'add') {
      const text = str_(a.text, 120);
      if (!text) return { abort: true, ok: false, err: 'text' };
      if (u.tasks.filter(function (x) { return !x.done; }).length >= MAX_TASKS) return { abort: true, ok: false, err: 'too_many' };
      u.tasks.push({ id: 'k' + crypto.randomBytes(5).toString('hex'), text: text, due: isDay_(a.due) ? a.due : '', done: '' });
      return { ok: true };
    }
    const k = u.tasks.filter(function (x) { return x.id === a.id; })[0];
    if (!k) return { abort: true, ok: false, err: 'none' };
    if (act === 'tick') { k.done = a.done ? today_() : ''; return { ok: true }; }
    if (act === 'drop') { u.tasks = u.tasks.filter(function (x) { return x.id !== a.id; }); return { ok: true }; }
    return { abort: true, ok: false, err: 'act' };
  });
  if (!res.ok) return res;
  return { ok: true, me: selfOut_(await readJSON('u:' + uid, null)) };
}

/* ---------------- people ---------------- */
/* The search: names and usernames; never anyone under 18, never yourself. */
async function searchPeople(uid, tok, q) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  const s = String(q || '').trim().toLowerCase().replace(/^@/, '');
  if (s.length < 2) return { ok: true, people: [] };
  const rows = await readJSON('people', []);
  const hits = rows.filter(function (r) {
    return r.id !== uid && !r.minor && (r.username.indexOf(s) > -1 || String(r.name || '').toLowerCase().indexOf(s) > -1);
  }).slice(0, 25);
  const out = [];
  for (const r of hits) {
    const u = await readJSON('u:' + r.id, null);
    if (u && !gone_(u) && !isMinor_(u) && !blocked_(me, u)) out.push(cardOut_(u, await sharesTeam_(me, u)));
  }
  return { ok: true, people: out };
}
/* One person's card. Under 18: only for someone in a team with them. */
async function person(uid, tok, id) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  if (typeof id !== 'string' || !/^u[a-f0-9]{18}$/.test(id)) return { ok: false, err: 'none' };
  const u = id === uid ? me : await readJSON('u:' + id, null);
  if (gone_(u) || blocked_(me, u)) return { ok: false, err: 'none' };
  const close = id === uid || await sharesTeam_(me, u);
  if (isMinor_(u) && !close) return { ok: false, err: 'none' };   // as if they weren't there
  const card = cardOut_(u, close);
  const shared = [];
  if (close) for (const tid of (me.teams || [])) {
    if ((u.teams || []).indexOf(tid) > -1) { const t = await readJSON('t:' + tid, null); if (t) shared.push({ id: t.id, name: t.name, emoji: t.emoji, theyLead: t.leaders.indexOf(id) > -1, iLead: t.leaders.indexOf(uid) > -1, leaders: t.leaders.length }); }
  }
  card.sharedTeams = shared;
  return { ok: true, person: card };
}

/* ---------------- teams ---------------- */
const TEAM_KINDS = ['group', 'friends'];   // a group (club, school, base, church) or two or three friends
const MAX_TEAMS = 20, MAX_MEMBERS = 200;
function newCode_() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // no 0/O, 1/I
  let s = ''; const b = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) s += A[b[i] % A.length];
  return s;
}
function teamBrief_(t, uid) {
  const lead = (t.leaders || []).indexOf(uid) > -1;
  const o = { id: t.id, name: t.name, emoji: t.emoji || '✦', kind: t.kind, size: (t.members || []).length, leader: lead };
  if (lead) o.code = t.code;
  return o;
}
async function createTeam(uid, tok, p) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  if (isMinor_(me)) return { ok: false, err: 'adult_only' };
  if ((me.teams || []).length >= MAX_TEAMS) return { ok: false, err: 'too_many' };
  p = p && typeof p === 'object' ? p : {};
  const name = str_(p.name, 50);
  if (name.length < 2) return { ok: false, err: 'name' };
  const t = { id: 't' + crypto.randomBytes(8).toString('hex'), name: name, emoji: str_(p.emoji, 8) || '✦',
    kind: TEAM_KINDS.indexOf(p.kind) > -1 ? p.kind : 'group', about: str_(p.about, 200),
    leaders: [uid], members: [uid], created: new Date().toISOString() };
  for (let i = 0; i < 5; i++) { t.code = newCode_(); if (!(await readJSON('tcode:' + t.code, null))) break; }
  await writeJSON('tcode:' + t.code, { id: t.id });
  await writeJSON('t:' + t.id, t);
  await mutate_('u:' + uid, null, function (u) { u.teams = (u.teams || []).concat([t.id]); return { ok: true }; });
  return { ok: true, team: teamBrief_(t, uid) };
}
async function joinTeam(uid, tok, code) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  const c = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (c.length !== 6) return { ok: false, err: 'code' };
  const map = await readJSON('tcode:' + c, null);
  if (!map) return { ok: false, err: 'code' };
  if ((me.teams || []).indexOf(map.id) > -1) return { ok: true, team: teamBrief_(await readJSON('t:' + map.id, {}), uid), already: true };
  if ((me.teams || []).length >= MAX_TEAMS) return { ok: false, err: 'too_many' };
  const res = await mutate_('t:' + map.id, null, function (t) {
    if (!t || t.code !== c) return { abort: true, ok: false, err: 'code' };
    if ((t.members || []).length >= MAX_MEMBERS) return { abort: true, ok: false, err: 'full' };
    if (t.members.indexOf(uid) === -1) t.members.push(uid);
    return { ok: true };
  });
  if (!res.ok) return res;
  await mutate_('u:' + uid, null, function (u) { if ((u.teams || []).indexOf(map.id) === -1) { u.teams = (u.teams || []).concat([map.id]); addPost_(u, 'joined', map.id); } u.invites = (u.invites || []).filter(function (i) { return i.team !== map.id; }); return { ok: true }; });
  return { ok: true, team: teamBrief_(await readJSON('t:' + map.id, null), uid) };
}
/* A team page: members' cards (progress, never details). Members only. */
async function team(uid, tok, tid) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  const t = typeof tid === 'string' && (me.teams || []).indexOf(tid) > -1 ? await readJSON('t:' + tid, null) : null;
  if (!t || t.closed || t.members.indexOf(uid) === -1) return { ok: false, err: 'none' };
  const people = [], lead = t.leaders.indexOf(uid) > -1;
  for (const id of t.members) {
    const u = id === uid ? me : await readJSON('u:' + id, null);
    if (gone_(u)) continue;
    if (id !== uid && !lead && blocked_(me, u)) continue;   // a leader still sees everyone, to look after the team
    const c = cardOut_(u, true); c.leader = t.leaders.indexOf(id) > -1; people.push(c);
  }
  const out = teamBrief_(t, uid); out.about = t.about || ''; out.people = people;
  const names = {}; people.forEach(function (p) { names[p.id] = p.name; });
  out.tasks = teamTasksOut_(t, uid, names);
  out.challenges = challengesOut_(t, uid, names);
  out.meets = meetsOut_(t, uid, names);
  return { ok: true, team: out };
}
async function leaveTeam(uid, tok, tid) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  const res = await mutate_('t:' + tid, null, function (t) {
    if (!t || t.members.indexOf(uid) === -1) return { abort: true, ok: false, err: 'none' };
    if (t.leaders.length === 1 && t.leaders[0] === uid && t.members.length > 1) return { abort: true, ok: false, err: 'last_leader' };
    t.members = t.members.filter(function (m) { return m !== uid; });
    t.leaders = t.leaders.filter(function (m) { return m !== uid; });
    return { ok: true };
  });
  if (!res.ok) return res;
  await mutate_('u:' + uid, null, function (u) { u.teams = (u.teams || []).filter(function (x) { return x !== tid; }); return { ok: true }; });
  return { ok: true };
}
/* A leader's tools: remove someone, make them a leader, a new join code. */
async function teamManage(uid, tok, tid, act, who) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  if (act === 'lead') {   // a leader holds the join code; nobody under 18 can be one
    const w = typeof who === 'string' ? await readJSON('u:' + who, null) : null;
    if (!w || isMinor_(w)) return { ok: false, err: 'adult_only' };
  }
  let oldCode = null, newCode = null, removed = null, removedPhoto = null;
  const res = await mutate_('t:' + tid, null, function (t) {
    if (!t || t.leaders.indexOf(uid) === -1) return { abort: true, ok: false, err: 'not_leader' };
    if (act === 'code') { oldCode = t.code; newCode = newCode_(); t.code = newCode; return { ok: true }; }
    if (typeof who !== 'string' || t.members.indexOf(who) === -1 || who === uid) return { abort: true, ok: false, err: 'none' };
    if (act === 'remove') { t.members = t.members.filter(function (m) { return m !== who; }); t.leaders = t.leaders.filter(function (m) { return m !== who; }); removed = who; return { ok: true }; }
    if (act === 'lead') { if (t.leaders.indexOf(who) === -1) t.leaders.push(who); return { ok: true }; }
    if (act === 'photo') { removedPhoto = who; return { abort: true, ok: true }; }   // nothing on the team changes
    return { abort: true, ok: false, err: 'act' };
  });
  if (!res.ok) return res;
  if (newCode) { await writeJSON('tcode:' + newCode, { id: tid }); await dropKey('tcode:' + oldCode); }
  if (removedPhoto) { await dropKey('ph:' + removedPhoto); await mutate_('u:' + removedPhoto, null, function (u) { if (u) u.hasPhoto = false; return { ok: true }; }); }
  if (removed) await mutate_('u:' + removed, null, function (u) { if (u) u.teams = (u.teams || []).filter(function (x) { return x !== tid; }); return { ok: true }; });
  return team(uid, tok, tid);
}
/* From the search: ask an adult to join your team. They say yes or no. */
async function inviteToTeam(uid, tok, tid, who) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  const t = await readJSON('t:' + tid, null);
  if (!t || t.leaders.indexOf(uid) === -1) return { ok: false, err: 'not_leader' };
  const res = await mutate_('u:' + who, null, function (u) {
    if (gone_(u) || isMinor_(u) || blocked_(me, u)) return { abort: true, ok: false, err: 'none' };   // nobody adds anyone under 18
    if ((u.teams || []).indexOf(tid) > -1) return { abort: true, ok: false, err: 'already' };
    u.invites = (u.invites || []).filter(function (i) { return i.team !== tid; }).concat([{ team: tid, name: t.name, emoji: t.emoji, from: me.name, at: today_() }]).slice(-20);
    return { ok: true };
  });
  return res.ok ? { ok: true } : res;
}
async function answerInvite(uid, tok, tid, yes) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  if (!(me.invites || []).some(function (i) { return i.team === tid; })) return { ok: false, err: 'none' };
  if (yes) {
    const t = await readJSON('t:' + tid, null);
    if (t) { const j = await joinTeam(uid, tok, t.code); if (!j.ok) return j; }
  }
  await mutate_('u:' + uid, null, function (u) { u.invites = (u.invites || []).filter(function (i) { return i.team !== tid; }); return { ok: true }; });
  return boot(uid, tok);
}

/* ---------------- 1-on-1s with a coach or mentor ----------------
   c:<id> = { id, coach, mentee, team, status: 'asked'|'active'|'ended', askedBy, made,
              next (the next meeting's date), sharePlan (the mentee lets the coach see
              their life plan), meetings: [{ id, date, checkin:{area:1–5}, good, hard,
              notes (the coach's summary, both see it), priv (the coach's own notes),
              follow:[{id, text, who:'coach'|'mentee', done}] }] }

   Safety (tests/test-api.mjs holds these):
     · a coach is an adult and a leader of a team both of them are in, and both agree;
     · a 1-on-1 is the one place two people write to each other, so with someone
       UNDER 18 it is never private between two people: every leader of that team can
       read it (not the coach's own notes), the team must have a second leader before
       anyone can coach them, and they're told so on the screen;
     · if the coach stops leading the team or either of them leaves it, the coach and
       the other leaders lose access at once; the mentee keeps their history. */
const MAX_COACHES = 3, MAX_MENTEES = 40, MAX_MEETINGS = 120, MAX_FOLLOW = 20;
const RATE_AREAS = AREAS;   // the same six areas of life as the life plan
/* Who is looking: 'coach' | 'mentee' | 'leader' (another leader, for an under-18) | null. */
/* Live = the coach still leads the team and both are still in it. */
async function coachLive_(c) {
  const t = c ? await readJSON('t:' + c.team, null) : null;
  if (!t) return false;
  const inTeam = function (id) { return (t.members || []).indexOf(id) > -1; };
  return inTeam(c.coach) && inTeam(c.mentee) && (t.leaders || []).indexOf(c.coach) > -1;
}
async function coachRole_(c, uid) {
  if (!c) return null;
  if (c.mentee === uid) return 'mentee';   // the mentee always keeps their own history
  if (c.status === 'ended' && c.coach !== uid) return null;
  if (!(await coachLive_(c))) return null;
  const t = await readJSON('t:' + c.team, null);
  if (c.coach === uid) return 'coach';
  if ((t.leaders || []).indexOf(uid) > -1 && c.status !== 'asked') {
    const m = await readJSON('u:' + c.mentee, null);
    if (m && isMinor_(m)) return 'leader';
  }
  return null;
}
function personBrief_(u) {
  if (!u) return { id: '', name: '?', username: '' };
  const sh = shareOf_(u), o = { id: u.id, username: u.username, name: isMinor_(u) ? firstName_(u.name) : u.name, hasPhoto: !!u.hasPhoto, minor: isMinor_(u) };
  if (sh.type && u.personality && u.personality.share !== false) { o.type = u.personality.type; o.sex = u.sex || ''; }
  return o;
}
function openFollow_(c, who) {
  let n = 0;
  (c.meetings || []).forEach(function (m) { (m.follow || []).forEach(function (f) { if (!f.done && (!who || f.who === who)) n++; }); });
  return n;
}
async function coachSummary_(c, uid, role) {
  const otherId = role === 'mentee' ? c.coach : c.mentee;
  const other = await readJSON('u:' + otherId, null), t = await readJSON('t:' + c.team, null);
  const last = (c.meetings || []).map(function (m) { return m.date; }).sort().pop() || '';
  const o = { id: c.id, role: role, status: c.status, live: await coachLive_(c), askedByMe: c.askedBy === uid, next: c.next || '', last: last, meetings: (c.meetings || []).length,
    other: personBrief_(other), team: t ? { id: t.id, name: t.name, emoji: t.emoji || '✦' } : null,
    myFollow: role === 'leader' ? 0 : openFollow_(c, role), minor: !!(role === 'coach' ? other && isMinor_(other) : false) };
  if (role === 'leader') { const co = await readJSON('u:' + c.coach, null); o.coachName = co ? co.name : ''; }
  return o;
}
/* Ask someone to be my coach (as: 'mentee'), or offer to coach them (as: 'coach'). */
async function coachAsk(uid, tok, otherId, tid, as) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  if (as !== 'coach' && as !== 'mentee') return { ok: false, err: 'act' };
  const other = typeof otherId === 'string' && /^u[a-f0-9]{18}$/.test(otherId) && otherId !== uid ? await readJSON('u:' + otherId, null) : null;
  const t = typeof tid === 'string' && (me.teams || []).indexOf(tid) > -1 ? await readJSON('t:' + tid, null) : null;
  if (gone_(other) || blocked_(me, other) || !t || t.members.indexOf(uid) === -1 || t.members.indexOf(otherId) === -1) return { ok: false, err: 'none' };
  const coach = as === 'coach' ? me : other, mentee = as === 'coach' ? other : me;
  if (isMinor_(coach) || t.leaders.indexOf(coach.id) === -1) return { ok: false, err: 'not_leader' };
  if (isMinor_(mentee) && t.leaders.length < 2) return { ok: false, err: 'second_leader' };
  const mine = [];
  for (const cid of (me.coaching || [])) { const c = await readJSON('c:' + cid, null); if (c && c.status !== 'ended') mine.push(c); }
  if (mine.some(function (c) { return (c.coach === coach.id && c.mentee === mentee.id) || (c.coach === mentee.id && c.mentee === coach.id); })) return { ok: false, err: 'already' };
  const count = async function (u, field) { let n = 0; for (const cid of (u.coaching || [])) { const c = await readJSON('c:' + cid, null); if (c && c.status !== 'ended' && c[field] === u.id) n++; } return n; };
  if (await count(mentee, 'mentee') >= MAX_COACHES) return { ok: false, err: 'too_many' };
  if (await count(coach, 'coach') >= MAX_MENTEES) return { ok: false, err: 'too_many' };
  const c = { id: 'c' + crypto.randomBytes(8).toString('hex'), coach: coach.id, mentee: mentee.id, team: tid, status: 'asked', askedBy: uid,
    made: today_(), next: '', sharePlan: false, meetings: [] };
  await writeJSON('c:' + c.id, c);
  for (const id of [coach.id, mentee.id]) await mutate_('u:' + id, null, function (u) { if (u) u.coaching = (u.coaching || []).concat([c.id]).slice(-60); return { ok: true }; });
  await mutate_('t:' + tid, null, function (x) { if (x) x.coachings = (x.coachings || []).concat([c.id]).slice(-400); return { ok: true }; });
  await pushNow_(otherId, as === 'mentee' ? 'coachAsk' : 'coachOffer', { name: isMinor_(me) ? firstName_(me.name) : me.name });
  return { ok: true, id: c.id };
}
/* The other person says yes or no. */
async function coachAnswer(uid, tok, cid, yes) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  const c0 = await readJSON('c:' + cid, null);
  const role = await coachRole_(c0, uid);
  if (!c0 || c0.status !== 'asked' || c0.askedBy === uid || (role !== 'coach' && role !== 'mentee') || !(await coachLive_(c0))) return { ok: false, err: 'none' };
  await mutate_('c:' + cid, null, function (c) { if (c) c.status = yes ? 'active' : 'ended'; return { ok: true }; });
  return { ok: true };
}
/* All of mine: as a coach, as someone coached, and (as a leader) under-18s' in my teams. */
async function coachings(uid, tok) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  const out = [], seen = {};
  for (const cid of (me.coaching || [])) {
    const c = await readJSON('c:' + cid, null), role = await coachRole_(c, uid);
    if (!role || seen[cid]) continue; seen[cid] = 1;
    if (c.status === 'ended' && !(c.meetings || []).length) continue;
    out.push(await coachSummary_(c, uid, role));
  }
  for (const tid of (me.teams || [])) {
    const t = await readJSON('t:' + tid, null);
    if (!t || (t.leaders || []).indexOf(uid) === -1) continue;
    for (const cid of (t.coachings || [])) {
      if (seen[cid]) continue;
      const c = await readJSON('c:' + cid, null);
      if (!c || c.status !== 'active' || (await coachRole_(c, uid)) !== 'leader') continue;
      seen[cid] = 1; out.push(await coachSummary_(c, uid, 'leader'));
    }
  }
  return { ok: true, coachings: out };
}
/* One coaching, with its 1-on-1s. The coach's own notes go only to the coach. */
async function coaching(uid, tok, cid) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  const c = typeof cid === 'string' ? await readJSON('c:' + cid, null) : null;
  const role = await coachRole_(c, uid);
  if (!role) return { ok: false, err: 'none' };
  const o = await coachSummary_(c, uid, role);
  o.sharePlan = !!c.sharePlan;
  o.meetings = (c.meetings || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).map(function (m) {
    const x = Object.assign({}, m); if (role !== 'coach') delete x.priv; return x;
  });
  if (role === 'coach' && c.status === 'active' && c.sharePlan) {
    const m = await readJSON('u:' + c.mentee, null);
    if (m) { o.plan = planOf_(m); const cl = callingOf_(m); if (cl.statement) o.calling = { statement: cl.statement, focus: cl.a.focus || '', m1: cl.a.m1 || '', m2: cl.a.m2 || '', m3: cl.a.m3 || '', from: cl.from }; }   // their calling, not the why, the letter or the answers
  }
  if (role === 'mentee' && o.other) { const co = await readJSON('u:' + c.coach, null); o.otherIsMinor = co ? isMinor_(co) : false; }
  if (role !== 'mentee') { const m = await readJSON('u:' + c.mentee, null); o.minor = !!(m && isMinor_(m)); }
  else o.minor = isMinor_(await readJSON('u:' + uid, null));
  return { ok: true, coaching: o };
}
/* Changes to a coaching: a new 1-on-1, saving one, follow-ups, the next date, sharing
   the plan, ending it. Only the coach and the mentee write; other leaders only read. */
function cleanCheckin_(v) {
  if (!v || typeof v !== 'object') return null;
  const o = {};
  RATE_AREAS.forEach(function (a) { const n = Number(v[a]); if ([1, 2, 3, 4, 5].indexOf(n) > -1) o[a] = n; });
  return o;
}
async function coachAct(uid, tok, cid, act, a) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  a = a && typeof a === 'object' ? a : {};
  const c0 = typeof cid === 'string' ? await readJSON('c:' + cid, null) : null;
  const role = await coachRole_(c0, uid);
  if (role !== 'coach' && role !== 'mentee') return { ok: false, err: 'none' };
  if (act !== 'end' && (c0.status !== 'active' || !(await coachLive_(c0)))) return { ok: false, err: 'none' };
  const res = await mutate_('c:' + cid, null, function (c) {
    if (!c) return { abort: true, ok: false, err: 'none' };
    c.meetings = Array.isArray(c.meetings) ? c.meetings : [];
    if (act === 'end') { c.status = 'ended'; c.next = ''; return { ok: true }; }
    if (act === 'next') { c.next = isDay_(a.date) ? a.date : ''; return { ok: true }; }
    if (act === 'sharePlan') { if (role !== 'mentee') return { abort: true, ok: false, err: 'none' }; c.sharePlan = !!a.on; return { ok: true }; }
    if (act === 'new') {
      if (c.meetings.length >= MAX_MEETINGS) c.meetings.sort(function (x, y) { return x.date < y.date ? -1 : 1; }).shift();
      const date = isDay_(a.date) ? a.date : today_();
      const m = { id: 'm' + crypto.randomBytes(5).toString('hex'), date: date, checkin: {}, good: '', hard: '', notes: '', priv: '', follow: [] };
      c.meetings.push(m); if (c.next && c.next <= date) c.next = '';
      return { ok: true, mid: m.id };
    }
    const m = c.meetings.filter(function (x) { return x.id === a.mid; })[0];
    if (!m) return { abort: true, ok: false, err: 'none' };
    m.follow = Array.isArray(m.follow) ? m.follow : [];
    if (act === 'save') {
      if (isDay_(a.date)) m.date = a.date;
      if (a.checkin !== undefined) { const ci = cleanCheckin_(a.checkin); if (ci) m.checkin = ci; }
      if (a.good !== undefined) m.good = str_(a.good, 600);
      if (a.hard !== undefined) m.hard = str_(a.hard, 600);
      if (a.notes !== undefined) m.notes = str_(a.notes, 1200);
      if (a.priv !== undefined) { if (role !== 'coach') return { abort: true, ok: false, err: 'none' }; m.priv = str_(a.priv, 1200); }
      return { ok: true };
    }
    if (act === 'delete') { c.meetings = c.meetings.filter(function (x) { return x.id !== a.mid; }); return { ok: true }; }
    if (act === 'addFollow') {
      const text = str_(a.text, 140);
      if (!text) return { abort: true, ok: false, err: 'text' };
      if (m.follow.length >= MAX_FOLLOW) return { abort: true, ok: false, err: 'too_many' };
      m.follow.push({ id: 'f' + crypto.randomBytes(5).toString('hex'), text: text, who: a.who === 'coach' ? 'coach' : 'mentee', done: '' });
      return { ok: true };
    }
    const f = m.follow.filter(function (x) { return x.id === a.fid; })[0];
    if (!f) return { abort: true, ok: false, err: 'none' };
    if (act === 'tickFollow') { f.done = a.done ? today_() : ''; return { ok: true }; }
    if (act === 'dropFollow') { m.follow = m.follow.filter(function (x) { return x.id !== a.fid; }); return { ok: true }; }
    return { abort: true, ok: false, err: 'act' };
  });
  if (!res.ok) return res;
  const out = await coaching(uid, tok, cid);
  if (res.mid && out.ok) out.mid = res.mid;
  return out;
}

/* ---------------- team tasks ----------------
   A leader (always an adult) sets a task for everyone or for one member; each
   person ticks their own. Everyone in the team sees every team task — there is
   no private channel here, on purpose (see CLAUDE.md, safety). */
const MAX_TEAM_TASKS = 40, KEEP_TEAM_TASK_DAYS = 60;
/* ---------------- team challenges ----------------
   A leader starts a challenge for the team: a title, an emoji and a number of days (3–40),
   from today or tomorrow. Members choose to join and tick each day they did it; everyone in
   the team sees who's in and how many days each has done — counts, nothing else. Finishing
   every day is a feed moment. t.challenges = [{ id, title, emoji, days, start, by, made,
   members: { uid: [dates] } }]. */
const MAX_CHALLENGES = 8, CH_DAYS_MIN = 3, CH_DAYS_MAX = 40, CH_KEEP_DAYS = 30;
function chEnd_(c) { return addDays_(c.start, c.days - 1); }
function challengesOut_(t, uid, names) {
  const today = today_();
  return (t.challenges || []).map(function (c) {
    const mine = (c.members || {})[uid], end = chEnd_(c);
    const people = Object.keys(c.members || {}).filter(function (m) { return (t.members || []).indexOf(m) > -1; })
      .map(function (m) { return { id: m, name: names[m] || '', n: c.members[m].length }; }).sort(function (a, b) { return b.n - a.n; });
    const dayNo = today < c.start ? 0 : Math.min(c.days, Math.round((Date.parse(today) - Date.parse(c.start)) / 864e5) + 1);
    return { id: c.id, team: t.id, title: c.title, emoji: c.emoji || '🏁', days: c.days, start: c.start, end: end, dayNo: dayNo,
      state: today < c.start ? 'soon' : today > end ? 'over' : 'on', joined: !!mine, mine: mine || [], doneToday: !!(mine && mine.indexOf(today) > -1), people: people };
  });
}
async function challenge(uid, tok, tid, act, a) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  if (typeof tid !== 'string' || (me.teams || []).indexOf(tid) === -1) return { ok: false, err: 'none' };
  a = a && typeof a === 'object' ? a : {};
  let finished = null, ticked = null;
  const res = await mutate_('t:' + tid, null, function (t) {
    if (!t || t.closed || t.members.indexOf(uid) === -1) return { abort: true, ok: false, err: 'none' };
    const lead = t.leaders.indexOf(uid) > -1, today = today_();
    t.challenges = (Array.isArray(t.challenges) ? t.challenges : []).filter(function (c) { return chEnd_(c) >= addDays_(today, -CH_KEEP_DAYS); });
    if (act === 'add') {
      if (!lead) return { abort: true, ok: false, err: 'not_leader' };
      const title = str_(a.title, 60), days = Math.round(Number(a.days));
      if (title.length < 2) return { abort: true, ok: false, err: 'text' };
      if (!(days >= CH_DAYS_MIN && days <= CH_DAYS_MAX)) return { abort: true, ok: false, err: 'days' };
      const start = a.start === addDays_(today, 1) ? a.start : today;
      if (t.challenges.filter(function (c) { return chEnd_(c) >= today; }).length >= MAX_CHALLENGES) return { abort: true, ok: false, err: 'too_many' };
      const c = { id: 'h' + crypto.randomBytes(5).toString('hex'), title: title, emoji: str_(a.emoji, 8) || '🏁', days: days, start: start, by: uid, made: today, members: {} };
      c.members[uid] = [];   // the leader is in it
      t.challenges.push(c);
      return { ok: true };
    }
    const c = t.challenges.filter(function (x) { return x.id === a.id; })[0];
    if (!c) return { abort: true, ok: false, err: 'none' };
    c.members = c.members || {};
    if (act === 'join') { if (a.on) { if (!c.members[uid]) c.members[uid] = []; } else delete c.members[uid]; return { ok: true }; }
    if (act === 'tick') {
      const d = isDay_(a.date) ? a.date : today;
      if (!nearDay_(d) || d < c.start || d > chEnd_(c) || d > addDays_(today, 0)) return { abort: true, ok: false, err: 'day' };
      if (!c.members[uid]) c.members[uid] = [];
      const list = c.members[uid].filter(function (x) { return x !== d; });
      if (a.done) list.push(d);
      c.members[uid] = list.sort();
      if (a.done && list.length === c.days) finished = c.id;
      ticked = { key: 'ch|' + d + '|' + c.id, on: !!a.done };
      return { ok: true };
    }
    if (act === 'drop') { if (!lead) return { abort: true, ok: false, err: 'not_leader' }; t.challenges = t.challenges.filter(function (x) { return x.id !== a.id; }); return { ok: true }; }
    return { abort: true, ok: false, err: 'act' };
  });
  if (!res.ok) return res;
  if (finished || ticked) await mutate_('u:' + uid, null, function (u) {
    if (!u) return { ok: true };
    if (ticked) { if (ticked.on) xpAdd_(u, ticked.key, 10); else xpDrop_(u, ticked.key); }
    if (finished) addPost_(u, 'challenge', tid + ':' + finished);
    return { ok: true };
  });
  return team(uid, tok, tid);
}

function teamTasksOut_(t, uid, names) {
  const members = t.members || [];
  return (t.tasks || []).filter(function (k) { return !k.who || members.indexOf(k.who) > -1; }).map(function (k) {
    const done = k.done || {};
    const of = k.who ? [k.who] : members;
    return { id: k.id, text: k.text, due: k.due || '', who: k.who || '', whoName: k.who ? (names[k.who] || '') : '',
      forMe: !k.who || k.who === uid, mine: !!done[uid], n: of.filter(function (m) { return done[m]; }).length, of: of.length, made: k.made };
  });
}
async function teamTask(uid, tok, tid, act, a) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  if (typeof tid !== 'string' || (me.teams || []).indexOf(tid) === -1) return { ok: false, err: 'none' };
  a = a && typeof a === 'object' ? a : {};
  const res = await mutate_('t:' + tid, null, function (t) {
    if (!t || t.members.indexOf(uid) === -1) return { abort: true, ok: false, err: 'none' };
    const lead = t.leaders.indexOf(uid) > -1;
    t.tasks = Array.isArray(t.tasks) ? t.tasks : [];
    const cut = addDays_(today_(), -KEEP_TEAM_TASK_DAYS);
    t.tasks = t.tasks.filter(function (k) { return (k.due || k.made) >= cut; });
    if (act === 'add') {
      if (!lead) return { abort: true, ok: false, err: 'not_leader' };
      const text = str_(a.text, 120);
      if (!text) return { abort: true, ok: false, err: 'text' };
      const who = typeof a.who === 'string' && a.who ? a.who : '';
      if (who && t.members.indexOf(who) === -1) return { abort: true, ok: false, err: 'none' };
      if (t.tasks.length >= MAX_TEAM_TASKS) return { abort: true, ok: false, err: 'too_many' };
      t.tasks.push({ id: 'k' + crypto.randomBytes(5).toString('hex'), text: text, who: who, due: isDay_(a.due) ? a.due : '', by: uid, made: today_(), done: {} });
      return { ok: true };
    }
    const k = t.tasks.filter(function (x) { return x.id === a.id; })[0];
    if (!k) return { abort: true, ok: false, err: 'none' };
    if (act === 'tick') {
      if (k.who && k.who !== uid) return { abort: true, ok: false, err: 'none' };
      k.done = k.done || {};
      if (a.done) k.done[uid] = today_(); else delete k.done[uid];
      return { ok: true };
    }
    if (act === 'drop') {
      if (!lead) return { abort: true, ok: false, err: 'not_leader' };
      t.tasks = t.tasks.filter(function (x) { return x.id !== a.id; });
      return { ok: true };
    }
    return { abort: true, ok: false, err: 'act' };
  });
  if (!res.ok) return res;
  if (act === 'add' && typeof a.who === 'string' && a.who && a.who !== uid) {
    const t = await readJSON('t:' + tid, null);
    if (t) await pushNow_(a.who, 'teamTask', { team: (t.emoji || '') + ' ' + t.name });
  }
  return team(uid, tok, tid);
}

/* ---------------- team meetups ----------------
   A leader (an adult) posts when and where the team meets next; everyone in the team sees it and
   answers going / maybe / can't. Only the team sees it — like team tasks, every member sees every
   one, so it is never a private channel. t.meets = [{ id, title, date, time, place, by, made,
   rsvp: { uid: 'yes'|'maybe'|'no' } }]; kept until the day after. A new one alerts the members
   (the team's name only), and the daily reminder mentions it on the day. */
const MAX_MEETS = 10;
function isTime_(x) { return typeof x === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(x); }
function meetsOut_(t, uid, names) {
  const lead = (t.leaders || []).indexOf(uid) > -1, today = today_();
  return (t.meets || []).filter(function (m) { return m.date >= today; }).sort(function (a, b) { return (a.date + (a.time || '')) < (b.date + (b.time || '')) ? -1 : 1; }).map(function (m) {
    const r = m.rsvp || {}, ids = Object.keys(r).filter(function (k) { return t.members.indexOf(k) > -1; });
    const o = { id: m.id, title: m.title, date: m.date, time: m.time || '', place: m.place || '', going: ids.filter(function (k) { return r[k] === 'yes'; }).length, maybe: ids.filter(function (k) { return r[k] === 'maybe'; }).length, mine: r[uid] || '', lead: lead };
    if (lead && names) o.who = ids.filter(function (k) { return r[k] === 'yes'; }).map(function (k) { return names[k] || ''; }).filter(Boolean);   // leaders see who's coming
    return o;
  });
}
async function meetup(uid, tok, tid, act, a) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  if (typeof tid !== 'string' || (me.teams || []).indexOf(tid) === -1) return { ok: false, err: 'none' };
  a = a && typeof a === 'object' ? a : {};
  const res = await mutate_('t:' + tid, null, function (t) {
    if (!t || t.members.indexOf(uid) === -1) return { abort: true, ok: false, err: 'none' };
    const lead = t.leaders.indexOf(uid) > -1;
    t.meets = (Array.isArray(t.meets) ? t.meets : []).filter(function (m) { return m.date >= addDays_(today_(), -1); });
    if (act === 'add') {
      if (!lead) return { abort: true, ok: false, err: 'not_leader' };
      const title = str_(a.title, 80);
      if (!title) return { abort: true, ok: false, err: 'text' };
      if (!isDay_(a.date) || a.date < today_() || a.date > addDays_(today_(), 180)) return { abort: true, ok: false, err: 'date' };
      if (t.meets.length >= MAX_MEETS) return { abort: true, ok: false, err: 'too_many' };
      t.meets.push({ id: 'm' + crypto.randomBytes(5).toString('hex'), title: title, date: a.date, time: isTime_(a.time) ? a.time : '', place: str_(a.place, 80), by: uid, made: today_(), rsvp: { [uid]: 'yes' } });
      return { ok: true };
    }
    const m = t.meets.filter(function (x) { return x.id === a.id; })[0];
    if (!m) return { abort: true, ok: false, err: 'none' };
    if (act === 'rsvp') {
      m.rsvp = m.rsvp || {};
      if (['yes', 'maybe', 'no'].indexOf(a.answer) > -1) m.rsvp[uid] = a.answer; else delete m.rsvp[uid];
      return { ok: true };
    }
    if (act === 'drop') {
      if (!lead) return { abort: true, ok: false, err: 'not_leader' };
      t.meets = t.meets.filter(function (x) { return x.id !== a.id; });
      return { ok: true };
    }
    return { abort: true, ok: false, err: 'act' };
  });
  if (!res.ok) return res;
  if (act === 'add') {
    const t = await readJSON('t:' + tid, null);
    if (t) for (const mid of t.members) if (mid !== uid) await pushNow_(mid, 'meetup', { team: (t.emoji || '') + ' ' + t.name });
  }
  return team(uid, tok, tid);
}

/* ---------------- the feed: 👏 for each other ----------------
   Moments from the people in my teams over the last two weeks — nobody else's. A moment says
   what happened, never anyone's own words (see addPost_). No comments: only 👏. */
const FEED_DAYS = 14, FEED_MAX = 60, FEED_PEOPLE = 400;
function postOut_(u, x, viewer, teamNames) {
  const o = { id: x.id, kind: x.kind, at: x.at, claps: (x.claps || []).length, clapped: (x.claps || []).indexOf(viewer) > -1, mine: u.id === viewer,
    who: { id: u.id, username: u.username, name: isMinor_(u) ? firstName_(u.name) : u.name, hasPhoto: !!u.hasPhoto } };
  const sh = shareOf_(u);
  if (sh.type && u.personality && u.personality.share !== false) { o.who.type = u.personality.type; o.who.sex = u.sex || ''; }
  if (x.kind === 'streak') o.n = x.n;
  if (x.kind === 'focus') o.n = Number(String(x.n).split(':')[1]) || null;
  if (x.kind === 'reading') o.n = x.n;   // the plan's id: the app's own words, not theirs
  if (x.kind === 'level') { o.n = x.n; const lv = levelOf_(xpForLevel_(x.n)); o.title = lv.title; o.icon = lv.icon; }
  if (x.kind === 'challenge') o.team = teamNames['ch:' + x.n] || null;   // the challenge's title only for people in that team
  if (x.kind === 'type') o.n = x.n;
  if (x.kind === 'apest' && APEST_IDS.indexOf(x.n) > -1) o.n = x.n;   // which gift: the app's own word, not theirs
  if (x.kind === 'joined') o.team = teamNames[x.n] || null;   // the team's name only for someone in it
  return o;
}
async function feed(uid, tok) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  const ids = {}, teamNames = {};
  for (const tid of (me.teams || [])) {
    const t = await readJSON('t:' + tid, null);
    if (!t) continue;
    teamNames[t.id] = (t.emoji || '✦') + ' ' + t.name;
    (t.challenges || []).forEach(function (c) { teamNames['ch:' + t.id + ':' + c.id] = (c.emoji || '🏁') + ' ' + c.title; });
    (t.members || []).forEach(function (m) { ids[m] = 1; });
  }
  ids[uid] = 1;
  const cut = addDays_(today_(), -FEED_DAYS), out = [];
  for (const id of Object.keys(ids).slice(0, FEED_PEOPLE)) {
    const u = id === uid ? me : await readJSON('u:' + id, null);
    if (gone_(u) || (id !== uid && blocked_(me, u))) continue;
    (u.posts || []).forEach(function (x) { if (x.at >= cut && postShown_(u, x)) out.push(postOut_(u, x, uid, teamNames)); });
  }
  out.sort(function (a, b) { return a.at < b.at ? 1 : a.at > b.at ? -1 : 0; });
  return { ok: true, feed: out.slice(0, FEED_MAX) };
}
/* 👏 someone's moment: only someone in a team with them, never your own. */
async function clap(uid, tok, owner, postId, on) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  if (typeof owner !== 'string' || owner === uid) return { ok: false, err: 'none' };
  const u = await readJSON('u:' + owner, null);
  if (gone_(u) || blocked_(me, u) || !(await sharesTeam_(me, u))) return { ok: false, err: 'none' };
  const res = await mutate_('u:' + owner, null, function (x) {
    const pst = x && (x.posts || []).filter(function (y) { return y.id === postId; })[0];
    if (!pst || !postShown_(x, pst)) return { abort: true, ok: false, err: 'none' };
    pst.claps = (pst.claps || []).filter(function (c) { return c !== uid; });
    if (on) pst.claps = pst.claps.concat([uid]).slice(-MAX_CLAPS);
    return { ok: true, n: pst.claps.length };
  });
  return res;
}
/* Who cheered me lately — for Home. */
async function cheersFor_(u) {
  const cut = addDays_(today_(), -7), out = [];
  for (const x of (u.posts || [])) {
    if (x.at < cut || !(x.claps || []).length) continue;
    const names = [];
    for (const c of x.claps.slice(-2).reverse()) { const v = await readJSON('u:' + c, null); if (!gone_(v) && !blocked_(u, v)) names.push(isMinor_(v) ? firstName_(v.name) : v.name); }
    out.push({ id: x.id, kind: x.kind, n: x.kind === 'streak' || x.kind === 'type' || x.kind === 'level' ? x.n : x.kind === 'focus' ? Number(String(x.n).split(':')[1]) || null : null, count: x.claps.length, names: names });
  }
  return out.reverse().slice(0, 5);
}

/* ---------------- blocking ---------------- */
const MAX_BLOCKED = 300;
async function block(uid, tok, who, on) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  if (typeof who !== 'string' || !/^u[a-f0-9]{18}$/.test(who) || who === uid) return { ok: false, err: 'none' };
  await mutate_('u:' + uid, null, function (u) {
    u.blocked = (u.blocked || []).filter(function (x) { return x !== who; });
    if (on) u.blocked = u.blocked.concat([who]).slice(-MAX_BLOCKED);
    return { ok: true };
  });
  return { ok: true, me: selfOut_(await readJSON('u:' + uid, null)) };
}
/* The people I've blocked, so I can unblock them. */
async function blockedList(uid, tok) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  const out = [];
  for (const id of (me.blocked || [])) { const u = await readJSON('u:' + id, null); if (u) out.push({ id: u.id, username: u.username, name: isMinor_(u) ? firstName_(u.name) : u.name }); }
  return { ok: true, people: out };
}

/* ---------------- reporting, and the admin ----------------
   Anyone can report a person they can see (their photo, name, line about them, or something
   else) or a team they are in. Reports wait in 'reports' for the admin (isAdmin_), who can
   remove the photo or the line, suspend the account, close the team, or let it be. */
const REPORT_WHAT = ['photo', 'name', 'bio', 'team', 'other'], MAX_REPORTS = 1000, REPORTS_A_DAY = 15;
async function report(uid, tok, p) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  p = p && typeof p === 'object' ? p : {};
  if (REPORT_WHAT.indexOf(p.what) === -1) return { ok: false, err: 'what' };
  const r = { id: 'r' + crypto.randomBytes(6).toString('hex'), by: uid, at: new Date().toISOString(), what: p.what, reason: str_(p.reason, 400), status: 'open' };
  if (p.what === 'team') {
    if (typeof p.team !== 'string' || (me.teams || []).indexOf(p.team) === -1) return { ok: false, err: 'none' };
    r.team = p.team;
  } else {
    const v = await person(uid, tok, p.who);   // only someone you can see
    if (!v.ok || p.who === uid) return { ok: false, err: 'none' };
    r.who = p.who;
    if (typeof p.team === 'string' && (me.teams || []).indexOf(p.team) > -1) r.team = p.team;
  }
  return mutate_('reports', [], function (rows) {
    const today = today_();
    if (rows.filter(function (x) { return x.by === uid && String(x.at).slice(0, 10) === today; }).length >= REPORTS_A_DAY) return { abort: true, ok: false, err: 'too_many' };
    rows.push(r);
    if (rows.length > MAX_REPORTS) { const i = rows.findIndex(function (x) { return x.status !== 'open'; }); rows.splice(i > -1 ? i : 0, 1); }
    return { ok: true };
  });
}
async function adminReports(uid, tok, all) {
  const me = await auth_(uid, tok);
  if (!me || !isAdmin_(me)) return { ok: false, err: 'not_admin' };
  const rows = (await readJSON('reports', [])).filter(function (r) { return all ? true : r.status === 'open'; }).slice(-200).reverse();
  const out = [];
  for (const r of rows) {
    const o = Object.assign({}, r), by = await readJSON('u:' + r.by, null);
    o.byName = by ? by.name + ' (@' + by.username + ')' : '?';
    if (r.who) { const u = await readJSON('u:' + r.who, null); if (u) o.person = { id: u.id, name: u.name, username: u.username, bio: u.bio || '', hasPhoto: !!u.hasPhoto, minor: isMinor_(u), suspended: !!u.suspended }; }
    if (r.team) { const t = await readJSON('t:' + r.team, null); if (t) o.teamInfo = { id: t.id, name: t.name, emoji: t.emoji, size: (t.members || []).length, closed: !!t.closed }; }
    out.push(o);
  }
  const photos = {};
  for (const o of out) if (o.person && o.person.hasPhoto && !photos[o.person.id]) { const ph = await readJSON('ph:' + o.person.id, null); if (ph) photos[o.person.id] = ph.d; }
  return { ok: true, reports: out, photos: photos };
}
async function closeTeam_(tid) {
  const t = await readJSON('t:' + tid, null);
  if (!t) return;
  for (const m of (t.members || [])) await mutate_('u:' + m, null, function (u) { if (u) u.teams = (u.teams || []).filter(function (x) { return x !== tid; }); return { ok: true }; });
  if (t.code) await dropKey('tcode:' + t.code);
  await mutate_('t:' + tid, null, function (x) { if (x) { x.closed = true; x.members = []; x.leaders = []; x.code = ''; } return { ok: true }; });
}
/* act: photo · bio · suspend · unsuspend · closeTeam · dismiss */
async function adminAct(uid, tok, rid, act) {
  const me = await auth_(uid, tok);
  if (!me || !isAdmin_(me)) return { ok: false, err: 'not_admin' };
  const r = (await readJSON('reports', [])).filter(function (x) { return x.id === rid; })[0];
  if (!r) return { ok: false, err: 'none' };
  if (['photo', 'bio', 'suspend', 'unsuspend'].indexOf(act) > -1 && !r.who) return { ok: false, err: 'none' };
  if (act === 'photo') { await dropKey('ph:' + r.who); await mutate_('u:' + r.who, null, function (u) { if (u) u.hasPhoto = false; return { ok: true }; }); }
  else if (act === 'bio') await mutate_('u:' + r.who, null, function (u) { if (u) u.bio = ''; return { ok: true }; });
  else if (act === 'suspend' || act === 'unsuspend') {
    if (r.who === uid) return { ok: false, err: 'none' };
    await mutate_('u:' + r.who, null, function (u) { if (u) { if (act === 'suspend') u.suspended = today_(); else delete u.suspended; } return { ok: true }; });
  }
  else if (act === 'closeTeam') { if (!r.team) return { ok: false, err: 'none' }; await closeTeam_(r.team); }
  else if (act !== 'dismiss') return { ok: false, err: 'act' };
  await mutate_('reports', [], function (rows) { rows.forEach(function (x) { if (x.id === rid) { x.status = act === 'dismiss' ? 'dismissed' : 'done'; x.acts = (x.acts || []).concat([act]); x.doneAt = new Date().toISOString(); } }); return { ok: true }; });
  return adminReports(uid, tok, false);
}

/* ---------------- reminders: web push ----------------
   Copied from the Impact app (its "Reminders — web push"), for GonPreah. One reminder a day
   at the hour each person picks (Phnom Penh time), only when there is something to do:
   today's habits not ticked yet, the life plan's steps for now (Mondays), team tasks due
   today or tomorrow, a 1-on-1 today. And right away, when someone asks you to coach them
   or offers to coach you, or a leader gives you a team task. netlify/functions/reminders.js
   runs runReminders every hour.
   Keys: GPA_VAPID_PUBLIC / GPA_VAPID_PRIVATE (raw base64url) in Netlify win if set; otherwise
   the app makes a P-256 pair the first time it's needed and keeps it in 'pushKeys' — server
   side only. Messages are encrypted to each phone (RFC 8291, aes128gcm) and signed (VAPID,
   RFC 8292) with node's crypto, no library. Only push services in PUSH_HOSTS are ever
   called, so a subscription can't point the server anywhere else; one the service says is
   gone (404/410) is dropped. The words are PUSH_TEXT, in the phone's language. */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /^([a-z0-9-]+\.)*push\.apple\.com$/, /^([a-z0-9-]+\.)*notify\.windows\.com$/];
const PUSH_MAX_SUBS = 5, PUSH_HOURS_MIN = 5, PUSH_HOURS_MAX = 22, PUSH_DEFAULT_HOUR = 19;
const PUSH_TEXT = {
  title: { en: 'GonPreah', km: 'កូនព្រះ' },
  habits: { en: 'Tick today’s habits and keep your {n}-day streak going 🔥', km: 'សូមគូសទម្លាប់ថ្ងៃនេះ ហើយរក្សាស្ទ្រីក {n} ថ្ងៃរបស់អ្នកឱ្យបន្ត 🔥' },
  habitsNew: { en: 'Your habits for today aren’t ticked yet ✅', km: 'ទម្លាប់សម្រាប់ថ្ងៃនេះ មិនទាន់បានគូសនៅឡើយទេ ✅' },
  steps: { en: '{n} steps in your life plan for now 🎯', km: 'មានជំហាន {n} ក្នុងផែនការជីវិតរបស់អ្នកសម្រាប់ពេលនេះ 🎯' },
  teamTasks: { en: '{n} team tasks due soon 📋', km: 'កិច្ចការក្រុម {n} ជិតដល់កាលកំណត់ 📋' },
  oneonone: { en: '1-on-1 with {name} today 🤝', km: 'ជួបមួយទល់មួយជាមួយ {name} ថ្ងៃនេះ 🤝' },
  friendAsk: { en: '{name} wants to be friends on GonPreah 👯', km: '{name} ចង់ធ្វើជាមិត្តភក្តិនៅលើ កូនព្រះ 👯' },
  nudge: { en: '{name} nudged you 👋 Keep your streak going today!', km: '{name} បានរំលឹកអ្នក 👋 រក្សាស្ទ្រីករបស់អ្នកឱ្យបន្តថ្ងៃនេះ!' },
  cheer: { en: '{name} from {team} is cheering you on 💛', km: '{name} មកពី {team} កំពុងលើកទឹកចិត្តអ្នក 💛' },
  coachAsk: { en: '{name} asked you to be their coach.', km: '{name} បានសុំឱ្យអ្នកធ្វើជាអ្នកណែនាំរបស់គាត់។' },
  coachOffer: { en: '{name} offered to be your coach.', km: '{name} បានស្នើធ្វើជាអ្នកណែនាំរបស់អ្នក។' },
  teamTask: { en: 'A new task for you in {team}.', km: 'មានកិច្ចការថ្មីសម្រាប់អ្នកនៅក្នុង {team}។' },
  planDay: { en: 'Good morning ☀️ What are your 3 things for today?', km: 'អរុណសួស្តី ☀️ តើរឿងទាំង ៣ របស់អ្នកសម្រាប់ថ្ងៃនេះជាអ្វី?' },
  meetup: { en: '📅 {team} has a new meetup — are you coming?', km: '📅 {team} មានការជួបជុំថ្មី — តើអ្នកនឹងមកទេ?' },
  meetupToday: { en: '📅 {team} meets today {time}', km: '📅 {team} ជួបជុំគ្នាថ្ងៃនេះ {time}' },
  saver: { en: '🔥 Your {n}-day streak ends at midnight — tick one habit to keep it going!', km: '🔥 ការធ្វើជាប់ៗគ្នា {n} ថ្ងៃរបស់អ្នកនឹងបញ្ចប់នៅពាក់កណ្តាលអធ្រាត្រ — គូសទម្លាប់មួយដើម្បីរក្សាវា!' },
  reset: { en: 'Sunday reset: 5 minutes to set up your week 🔄', km: 'កំណត់សប្តាហ៍ឡើងវិញនៅថ្ងៃអាទិត្យ៖ ៥ នាទីដើម្បីរៀបចំសប្តាហ៍របស់អ្នក 🔄' },
  vision: { en: 'It’s Sunday: read your vision again 📜', km: 'ថ្ងៃនេះជាថ្ងៃអាទិត្យ៖ អានចក្ខុវិស័យរបស់អ្នកម្តងទៀត 📜' },
  reading: { en: 'Today’s Bible reading is waiting 📖', km: 'ការអានព្រះគម្ពីរថ្ងៃនេះកំពុងរង់ចាំ 📖' },
  challenges: { en: '{n} team challenges to tick today 🏁', km: 'ការប្រកួតក្រុម {n} ដែលត្រូវគូសថ្ងៃនេះ 🏁' },
  test: { en: 'Reminders are on. You’ll hear from GonPreah at the time you chose.', km: 'ការរំលឹកត្រូវបានបើក។ កូនព្រះនឹងរំលឹកអ្នកនៅម៉ោងដែលអ្នកបានជ្រើសរើស។' }
};
function pushText_(key, lang, params) {
  const x = PUSH_TEXT[key] || {};
  let out = (lang === 'km' && x.km) || x.en || key;
  Object.keys(params || {}).forEach(function (k) { out = out.split('{' + k + '}').join(String(params[k])); });
  return out;
}
const b64u_ = function (buf) { return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u_ = function (x) { return Buffer.from(String(x || '').replace(/-/g, '+').replace(/_/g, '/'), 'base64'); };
function hkdf_(salt, ikm, info, len) { return Buffer.from(crypto.hkdfSync('sha256', ikm, salt, info, len)); }
async function pushKeys_(make) {
  if (process.env.GPA_VAPID_PUBLIC && process.env.GPA_VAPID_PRIVATE) return { pub: process.env.GPA_VAPID_PUBLIC, priv: process.env.GPA_VAPID_PRIVATE, subject: 'https://app.gonpreah.org' };
  const k = await readJSON('pushKeys', {});
  if (k && k.pub && k.priv) return k;
  if (!make) return null;
  await mutate_('pushKeys', {}, function (x) {
    if (x.pub && x.priv) return { abort: true, ok: true };   // someone else made them a moment ago
    const ecdh = crypto.createECDH('prime256v1'); ecdh.generateKeys();
    x.pub = b64u_(ecdh.getPublicKey()); x.priv = b64u_(ecdh.getPrivateKey()); x.subject = 'https://app.gonpreah.org'; x.at = new Date().toISOString();
    return { ok: true };
  });
  return readJSON('pushKeys', null);
}
function vapidKeyObject_(pub, priv) {
  const p = unb64u_(pub);
  return crypto.createPrivateKey({ key: { kty: 'EC', crv: 'P-256', d: b64u_(unb64u_(priv)), x: b64u_(p.subarray(1, 33)), y: b64u_(p.subarray(33, 65)) }, format: 'jwk' });
}
function vapidJwt_(endpoint, keys, nowSec) {
  const aud = new URL(endpoint).origin;
  const head = b64u_(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const body = b64u_(JSON.stringify({ aud: aud, exp: (nowSec || Math.floor(Date.now() / 1000)) + 12 * 3600, sub: keys.subject }));
  const sig = crypto.sign('sha256', Buffer.from(head + '.' + body), { key: vapidKeyObject_(keys.pub, keys.priv), dsaEncoding: 'ieee-p1363' });
  return head + '.' + body + '.' + b64u_(sig);
}
function pushEncrypt_(sub, payload) {
  const uaPub = unb64u_(sub.p256dh), auth = unb64u_(sub.auth);
  const ecdh = crypto.createECDH('prime256v1'); ecdh.generateKeys();
  const asPub = ecdh.getPublicKey(), secret = ecdh.computeSecret(uaPub);
  const ikm = hkdf_(auth, secret, Buffer.concat([Buffer.from('WebPush: info\0'), uaPub, asPub]), 32);
  const salt = crypto.randomBytes(16);
  const cek = hkdf_(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = hkdf_(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const c = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const body = Buffer.concat([c.update(Buffer.concat([Buffer.from(payload, 'utf8'), Buffer.from([2])])), c.final(), c.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([asPub.length]), asPub, body]);
}
function pushHostOk_(endpoint) {
  try { const u = new URL(endpoint); return u.protocol === 'https:' && PUSH_HOSTS.some(function (re) { return re.test(u.hostname); }); }
  catch (e) { return false; }
}
async function pushSend_(sub, message, keys) {
  if (!pushHostOk_(sub.endpoint)) return 'bad_host';
  try {
    const res = await globalThis.fetch(sub.endpoint, {
      method: 'POST',
      headers: { 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '43200', Urgency: 'normal',
        Authorization: 'vapid t=' + vapidJwt_(sub.endpoint, keys) + ', k=' + keys.pub },
      body: pushEncrypt_(sub, JSON.stringify(message))
    });
    if (res.status === 404 || res.status === 410) return 'gone';
    return res.ok ? 'sent' : 'failed';
  } catch (e) { return 'failed'; }
}
const PUSH_PREF_KEYS = ['habits', 'plan', 'team', 'coach', 'alerts', 'saver'];
const SAVER_HOUR = 21, SAVER_MIN_STREAK = 2;
function pushPrefsOf_(u) {
  const p = (u && u.pushPrefs) || {}, h = Number(p.hour), o = { hour: h >= PUSH_HOURS_MIN && h <= PUSH_HOURS_MAX ? Math.round(h) : PUSH_DEFAULT_HOUR };
  PUSH_PREF_KEYS.forEach(function (k) { o[k] = p[k] !== false; });
  return o;
}
async function dropSubs_(gone) {
  if (gone.length) await mutate_('pushSubs', [], function (rows) { for (let i = rows.length - 1; i >= 0; i--) if (gone.indexOf(rows[i].endpoint) > -1) rows.splice(i, 1); return { ok: true }; });
}
/* Right away, to one person's phones (if they have reminders and alerts on). Never throws. */
async function pushNow_(uid, key, params) {
  try {
    const keys = await pushKeys_(false); if (!keys) return 0;
    const subs = (await readJSON('pushSubs', [])).filter(function (r) { return r.uid === uid; });
    if (!subs.length) return 0;
    const u = await readJSON('u:' + uid, null);
    if (gone_(u) || !pushPrefsOf_(u).alerts) return 0;
    let sent = 0; const gone = [];
    for (const sub of subs) {
      const r = await pushSend_(sub, { title: pushText_('title', sub.lang), body: pushText_(key, sub.lang, params), tag: 'gpa-' + key, url: '/' }, keys);
      if (r === 'sent') sent++; if (r === 'gone') gone.push(sub.endpoint);
    }
    await dropSubs_(gone);
    return sent;
  } catch (e) { return 0; }
}
async function pushSubscribe(uid, tok, sub, lang) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  if (!(await pushKeys_(true))) return { ok: false, err: 'not_set_up' };
  const endpoint = sub && typeof sub.endpoint === 'string' ? sub.endpoint.slice(0, 1200) : '';
  const k = (sub && sub.keys) || {};
  if (!pushHostOk_(endpoint)) return { ok: false, err: 'bad_endpoint' };
  if (unb64u_(k.p256dh).length !== 65 || unb64u_(k.auth).length !== 16) return { ok: false, err: 'bad_keys' };
  await mutate_('pushSubs', [], function (rows) {
    for (let i = rows.length - 1; i >= 0; i--) if (rows[i].endpoint === endpoint) rows.splice(i, 1);
    const mine = rows.filter(function (r) { return r.uid === uid; }).sort(function (a, b) { return a.at < b.at ? -1 : 1; });
    if (mine.length >= PUSH_MAX_SUBS) rows.splice(rows.indexOf(mine[0]), 1);
    rows.push({ uid: uid, endpoint: endpoint, p256dh: String(k.p256dh), auth: String(k.auth), lang: lang === 'km' ? 'km' : 'en', at: new Date().toISOString() });
    return { ok: true };
  });
  return { ok: true, prefs: pushPrefsOf_(await readJSON('u:' + uid, null)) };
}
async function pushUnsubscribe(uid, tok, endpoint) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  await mutate_('pushSubs', [], function (rows) { for (let i = rows.length - 1; i >= 0; i--) if (rows[i].uid === uid && rows[i].endpoint === endpoint) rows.splice(i, 1); return { ok: true }; });
  return { ok: true };
}
async function pushSavePrefs(uid, tok, prefs) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  const p = prefs && typeof prefs === 'object' ? prefs : {}, h = Number(p.hour);
  const clean = { hour: h >= PUSH_HOURS_MIN && h <= PUSH_HOURS_MAX ? Math.round(h) : PUSH_DEFAULT_HOUR };
  PUSH_PREF_KEYS.forEach(function (k) { clean[k] = p[k] !== false; });
  await mutate_('u:' + uid, null, function (u) { if (u) u.pushPrefs = clean; return { ok: true }; });
  return { ok: true, prefs: clean };
}
async function pushTest(uid, tok) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  const keys = await pushKeys_(false);
  if (!keys) return { ok: false, err: 'not_set_up' };
  const subs = (await readJSON('pushSubs', [])).filter(function (r) { return r.uid === uid; });
  if (!subs.length) return { ok: false, err: 'no_subscription' };
  let sent = 0; const gone = [];
  for (const sub of subs) { const r = await pushSend_(sub, { title: pushText_('title', sub.lang), body: pushText_('test', sub.lang), tag: 'gpa-test', url: '/' }, keys); if (r === 'sent') sent++; if (r === 'gone') gone.push(sub.endpoint); }
  await dropSubs_(gone);
  return { ok: sent > 0, sent: sent, err: sent ? undefined : 'not_sent' };
}
/* What one person's reminder says right now, if anything. */
async function reminderItems_(u, ctx) {
  const p = pushPrefsOf_(u), out = [], today = ctx.today;
  if (p.habits && ctx.hour < 12) {   // a morning reminder: plan the day first
    const D = (u.daily || {})[today];
    if (!(D && D.top && D.top.length)) out.push({ key: 'planDay' });
  }
  if (p.plan) {
    const rd = u.reading || {};
    if (Object.keys(rd).some(function (k) { return READING_PLANS[k] && !rd[k].finished && rd[k].lastRead !== today; })) out.push({ key: 'reading' });
  }
  if (p.habits && (u.habits || []).length) {
    const m = (u.days || {})[today];
    if (!(m && Object.keys(m).some(function (k) { return m[k]; }))) { const st = streakOf_(u.days || {}, u.frozen); out.push(st ? { key: 'habits', params: { n: st } } : { key: 'habitsNew' }); }
  }
  if (p.plan && ctx.sunday && !((u.resets || {})[addDays_(weekOf_(today), 7)])) out.push({ key: 'reset' });   // Sundays: set up the week
  if (p.plan && ctx.sunday && planOf_(u).vision && !((u.daily || {})[today] || {}).vision) out.push({ key: 'vision' });   // Sundays: read my vision again
  if (p.plan && ctx.monday) {
    const mon = monthOf_(today), q = quarterOf_(today);
    let n = 0;
    planOf_(u).goals.forEach(function (g) { if (!g.done) (g.steps || []).forEach(function (st) { if (!st.done && (st.when === mon || st.when === q || st.when < (/Q/.test(st.when) ? q : mon))) n++; }); });
    if (n) out.push({ key: 'steps', params: { n: n } });
  }
  if (p.team) {
    let ch = 0;
    for (const tid of (u.teams || [])) {
      if (!(tid in ctx.teams)) ctx.teams[tid] = await readJSON('t:' + tid, null);
      const t = ctx.teams[tid]; if (!t) continue;
      (t.challenges || []).forEach(function (c) { const mine = (c.members || {})[u.id]; if (mine && today >= c.start && today <= chEnd_(c) && mine.indexOf(today) === -1) ch++; });
    }
    if (ch) out.push({ key: 'challenges', params: { n: ch } });
    for (const tid of (u.teams || [])) {
      const t = ctx.teams[tid]; if (!t) continue;
      const m = (t.meets || []).filter(function (x) { return x.date === today && (x.rsvp || {})[u.id] !== 'no'; })[0];
      if (m) out.push({ key: 'meetupToday', params: { team: (t.emoji || '') + ' ' + t.name, time: m.time || '' } });
    }
  }
  if (p.team) {
    let n = 0; const soon = addDays_(today, 1);
    for (const tid of (u.teams || [])) {
      if (!(tid in ctx.teams)) ctx.teams[tid] = await readJSON('t:' + tid, null);
      const t = ctx.teams[tid]; if (!t) continue;
      (t.tasks || []).forEach(function (k) { if ((!k.who || k.who === u.id) && !(k.done || {})[u.id] && k.due && k.due <= soon) n++; });
    }
    if (n) out.push({ key: 'teamTasks', params: { n: n } });
  }
  if (p.coach) {
    for (const cid of (u.coaching || [])) {
      const c = await readJSON('c:' + cid, null);
      if (!c || c.status !== 'active' || c.next !== today) continue;
      const other = await readJSON('u:' + (c.coach === u.id ? c.mentee : c.coach), null);
      if (other && !gone_(other)) out.push({ key: 'oneonone', params: { name: firstName_(other.name) } });
    }
  }
  return out;
}
/* Every hour (netlify/functions/reminders.js): everyone whose hour it is gets one notification
   with whatever applies to them. Nothing to say → nothing sent. `now` is for tests. */
/* The streak saver (9 pm, on unless switched off): habits not ticked today, and a streak of 2+
   that ends at midnight. Not for someone whose own reminder hour is 9 pm — that one says it. */
function saverItems_(u, ctx) {
  if (!(u.habits || []).length) return [];
  const m = (u.days || {})[ctx.today];
  if (m && Object.keys(m).some(function (k) { return m[k]; })) return [];
  const st = streakOf_(u.days || {}, u.frozen);
  return st >= SAVER_MIN_STREAK ? [{ key: 'saver', params: { n: st } }] : [];
}
async function runReminders(now) {
  return scope.run(new Map(), async function () {
    const at = now || new Date();
    const keys = await pushKeys_(false);
    if (!keys) return { ok: false, err: 'not_set_up' };
    const local = new Date(at.getTime() + 7 * 3600 * 1000);
    const hour = local.getUTCHours(), today = local.toISOString().slice(0, 10);
    const subs = await readJSON('pushSubs', []);
    if (!subs.length) return { ok: true, sent: 0, people: 0 };
    const run = await readJSON('pushRun', {});
    if (run.slot === today + 'T' + hour) return { ok: true, sent: 0, skipped: 'already_ran' };
    await writeJSON('pushRun', { slot: today + 'T' + hour, at: at.toISOString(), running: true });
    const ctx = { today: today, hour: hour, monday: local.getUTCDay() === 1, sunday: local.getUTCDay() === 0, teams: {} }, byUid = {};
    subs.forEach(function (r) { (byUid[r.uid] = byUid[r.uid] || []).push(r); });
    let sent = 0, people = 0; const gone = [];
    for (const uid of Object.keys(byUid)) {
      const u = await readJSON('u:' + uid, null);
      if (gone_(u)) continue;
      const P = pushPrefsOf_(u);
      let items;
      if (P.hour === hour) items = await reminderItems_(u, ctx);
      else if (hour === SAVER_HOUR && P.saver && P.habits) items = saverItems_(u, ctx);   // the streak saver: 9 pm, only if a streak is about to end
      else continue;
      if (!items.length) continue;
      people++;
      for (const sub of byUid[uid]) {
        const r = await pushSend_(sub, { title: pushText_('title', sub.lang), body: items.map(function (x) { return pushText_(x.key, sub.lang, x.params); }).join('\n'), tag: 'gpa-reminder', url: '/' }, keys);
        if (r === 'sent') sent++; if (r === 'gone') gone.push(sub.endpoint);
      }
    }
    await dropSubs_(gone);
    await writeJSON('pushRun', { slot: today + 'T' + hour, at: at.toISOString(), sent: sent, people: people, dropped: gone.length });
    return { ok: true, sent: sent, people: people, dropped: gone.length };
  });
}

/* ---------------- friends ----------------
   Two or three close friends who keep each other going. Both must agree (an ask, then yes).
   Adults can ask adults by username; with anyone under 18, the two must share a team — and a
   friendship with someone under 18 shows only while they still share one. Friends see each
   other's streak and whether today's habits are done (behind share.streak) and their streak
   together; a 👋 nudge is a fixed notification, once a day per friend — never a message.
   u.friends = [{ id, since }], u.friendAsks = [{ from, at }] (asks I've received). */
const MAX_FRIENDS = 12, MAX_FRIEND_ASKS = 30;
async function friendOk_(a, b) {
  if (gone_(a) || gone_(b) || a.id === b.id || blocked_(a, b)) return false;
  if (isMinor_(a) || isMinor_(b)) return sharesTeam_(a, b);
  return true;
}
async function friendAsk(uid, tok, username) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  const n = cleanUsername_(username), map = n ? await readJSON('uname:' + n, null) : null;
  const them = map ? await readJSON('u:' + map.id, null) : null;
  if (!them || !(await friendOk_(me, them))) return { ok: false, err: 'none' };   // as if they weren't there
  if ((me.friends || []).some(function (f) { return f.id === them.id; })) return { ok: false, err: 'already' };
  if ((me.friends || []).length >= MAX_FRIENDS) return { ok: false, err: 'too_many' };
  if ((me.friendAsks || []).some(function (x) { return x.from === them.id; })) return friendAnswer(uid, tok, them.id, true);   // they asked me first
  const res = await mutate_('u:' + them.id, null, function (u) {
    if (!u) return { abort: true, ok: false, err: 'none' };
    if ((u.friends || []).length >= MAX_FRIENDS) return { abort: true, ok: false, err: 'too_many' };
    u.friendAsks = (u.friendAsks || []).filter(function (x) { return x.from !== uid; }).concat([{ from: uid, at: today_() }]).slice(-MAX_FRIEND_ASKS);
    return { ok: true };
  });
  if (!res.ok) return res;
  await pushNow_(them.id, 'friendAsk', { name: isMinor_(me) ? firstName_(me.name) : me.name });
  return { ok: true, asked: true };
}
async function friendAnswer(uid, tok, from, yes) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  if (!(me.friendAsks || []).some(function (x) { return x.from === from; })) return { ok: false, err: 'none' };
  const them = await readJSON('u:' + from, null);
  let made = false;
  if (yes && them && await friendOk_(me, them) && (me.friends || []).length < MAX_FRIENDS) {
    made = true;
    await mutate_('u:' + from, null, function (u) { if (u) u.friends = (u.friends || []).filter(function (f) { return f.id !== uid; }).concat([{ id: uid, since: today_() }]); return { ok: true }; });
  }
  await mutate_('u:' + uid, null, function (u) {
    u.friendAsks = (u.friendAsks || []).filter(function (x) { return x.from !== from; });
    if (made) u.friends = (u.friends || []).filter(function (f) { return f.id !== from; }).concat([{ id: from, since: today_() }]);
    return { ok: true };
  });
  return friendsList(uid, tok);
}
async function friendDrop(uid, tok, id) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  for (const [a, b] of [[uid, id], [id, uid]]) await mutate_('u:' + a, null, function (u) { if (u) u.friends = (u.friends || []).filter(function (f) { return f.id !== b; }); return { ok: true }; });
  return friendsList(uid, tok);
}
/* Days in a row both of us ticked a habit (ending today or yesterday). */
function togetherStreak_(a, b) {
  let d = today_(); if (!(habitDone_(a, d) && habitDone_(b, d))) d = addDays_(d, -1);
  let n = 0; while (n < 3660 && habitDone_(a, d) && habitDone_(b, d)) { n++; d = addDays_(d, -1); }
  return n;
}
async function friendsList(uid, tok) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  const friends = [], asks = [], t = today_();
  for (const f of (me.friends || [])) {
    const u = await readJSON('u:' + f.id, null);
    if (!u || !(await friendOk_(me, u))) continue;
    const o = personBrief_(u), sh = shareOf_(u);
    o.since = f.since; o.nudged = (me.nudged || {})[u.id] === t;
    if (sh.streak) { o.streak = streakOf_(u.days || {}, u.frozen); o.doneToday = habitDone_(u, t); o.together = togetherStreak_(me, u); }
    if (sh.level) o.xpWeek = (u.xpWeeks || {})[weekOf_(t)] || 0;   // friends this week: XP numbers only
    friends.push(o);
  }
  for (const x of (me.friendAsks || [])) {
    const u = await readJSON('u:' + x.from, null);
    if (u && await friendOk_(me, u)) asks.push(Object.assign(personBrief_(u), { at: x.at }));
  }
  return { ok: true, friends: friends, asks: asks };
}
async function friendNudge(uid, tok, id) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  const them = (me.friends || []).some(function (f) { return f.id === id; }) ? await readJSON('u:' + id, null) : null;
  if (!them || !(await friendOk_(me, them))) return { ok: false, err: 'none' };
  if ((me.nudged || {})[id] === today_()) return { ok: false, err: 'once_a_day' };
  await mutate_('u:' + uid, null, function (u) { u.nudged = Object.assign({}, u.nudged || {}); u.nudged[id] = today_(); Object.keys(u.nudged).forEach(function (k) { if (u.nudged[k] < addDays_(today_(), -7)) delete u.nudged[k]; }); return { ok: true }; });
  const sent = await pushNow_(id, 'nudge', { name: isMinor_(me) ? firstName_(me.name) : me.name });
  return { ok: true, sent: sent };
}

/* ---------------- the leader's dashboard ----------------
   For a team's leaders only: each member's last day in the app, and — behind the member's own
   switches — their streak, habit days this week, focus and XP this week. Numbers only. A 💛
   cheer is a fixed notification from the leader, once a day per member. */
async function teamPulse(uid, tok, tid) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  const t = typeof tid === 'string' && (me.teams || []).indexOf(tid) > -1 ? await readJSON('t:' + tid, null) : null;
  if (!t || t.closed || (t.leaders || []).indexOf(uid) === -1) return { ok: false, err: 'not_leader' };
  const today = today_(), wk = weekOf_(today), rows = [];
  for (const id of t.members) {
    if (id === uid) continue;
    const u = await readJSON('u:' + id, null);
    if (gone_(u)) continue;
    const sh = shareOf_(u), o = personBrief_(u);
    o.seenAgo = u.seen ? Math.max(0, Math.round((Date.parse(today) - Date.parse(u.seen)) / 864e5)) : null;
    o.cheered = (me.cheered || {})[id] === today;
    if (sh.streak) {
      o.streak = streakOf_(u.days || {}, u.frozen);
      let n = 0; for (let i = 0; i < 7; i++) { const d = addDays_(wk, i); if (d <= today && habitDone_(u, d)) n++; }
      o.habitDays = n;
    }
    if (sh.focus) o.focusWeek = focusWeek_(u, wk);
    if (sh.level) o.xpWeek = (u.xpWeeks || {})[wk] || 0;
    o.tests = { type: !!u.personality, strengths: !!(u.gstrengths || u.clifton), gifts: !!u.apest };   // taken or not — like the test count on a card
    if (sh.plan) o.calling = !!callingOf_(u).statement;   // found or not — never its words
    if (sh.journey) { const st = storyOf_(u); o.journey = { stops: st.done.length, finished: !!st.finished }; }
    rows.push(o);
  }
  rows.sort(function (a, b) { return (b.seenAgo == null ? 999 : b.seenAgo) - (a.seenAgo == null ? 999 : a.seenAgo); });
  return { ok: true, pulse: { team: { id: t.id, name: t.name, emoji: t.emoji }, rows: rows,
    today: rows.filter(function (r) { return r.seenAgo === 0; }).length,
    week: rows.filter(function (r) { return r.seenAgo != null && r.seenAgo < 7; }).length,
    quiet: rows.filter(function (r) { return r.seenAgo == null || r.seenAgo >= 4; }).length,
    allTests: rows.filter(function (r) { return r.tests.type && r.tests.strengths && r.tests.gifts; }).length,
    callings: rows.filter(function (r) { return r.calling; }).length,
    journeys: rows.filter(function (r) { return r.journey && r.journey.finished; }).length } };
}
async function leaderCheer(uid, tok, tid, who) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  const t = typeof tid === 'string' && (me.teams || []).indexOf(tid) > -1 ? await readJSON('t:' + tid, null) : null;
  if (!t || (t.leaders || []).indexOf(uid) === -1) return { ok: false, err: 'not_leader' };
  if (typeof who !== 'string' || t.members.indexOf(who) === -1 || who === uid) return { ok: false, err: 'none' };
  if ((me.cheered || {})[who] === today_()) return { ok: false, err: 'once_a_day' };
  await mutate_('u:' + uid, null, function (u) { u.cheered = Object.assign({}, u.cheered || {}); u.cheered[who] = today_(); Object.keys(u.cheered).forEach(function (k) { if (u.cheered[k] < addDays_(today_(), -7)) delete u.cheered[k]; }); return { ok: true }; });
  const sent = await pushNow_(who, 'cheer', { name: firstName_(me.name), team: t.name });
  return { ok: true, sent: sent };
}

async function signOut(uid, tok) {
  if (!(await auth_(uid, tok))) return { ok: true };
  const h = sha_(tok);
  await mutate_('u:' + uid, null, function (u) { if (u) u.tokens = (u.tokens || []).filter(function (t) { return t.h !== h; }); return { ok: true }; });
  return { ok: true };
}

export const HANDLERS = {
  authConfig, loginGoogle, checkUsername, register, registerPassword, loginPassword, setPassword, adminResetPassword, boot, saveProfile, savePhoto, photos,
  savePersonality, saveStrengths, saveApest, saveClifton, saveHabits, tickHabit, saveWeek,
  savePlanWhy, saveGoal, goalAct, myTask, teamTask, meetup, journey, calling, weekReset, journal,
  coachAsk, coachAnswer, coachings, coaching, coachAct,
  feed, clap, block, blockedList, report, adminReports, adminAct,
  pushSubscribe, pushUnsubscribe, pushSavePrefs, pushTest,
  saveTop, saveCheckin, logFocus, challenge, reading, prayer, devoDone,
  friendAsk, friendAnswer, friendDrop, friendsList, friendNudge, teamPulse, leaderCheer,
  searchPeople, person, createTeam, joinTeam, team, leaveTeam, teamManage, inviteToTeam, answerInvite, signOut
};
export const __test = { isMinor_, weekOf_, today_, streakOf_, gsScore_, apestScore_, monthOf_, quarterOf_, levelOf_, xpForLevel_ };
export { runReminders, pushEncrypt_, vapidJwt_ };

export default async function (req) {
  const J = function (o, s) { return new Response(JSON.stringify(o), { status: s || 200, headers: { 'Content-Type': 'application/json' } }); };
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  let body;
  try { body = await req.json(); } catch (e) { return J({ ok: false, error: 'Bad JSON' }, 400); }
  const fn = body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(HANDLERS, body.fn) ? HANDLERS[body.fn] : null;
  if (typeof fn !== 'function') return J({ ok: false, error: 'Unknown function' }, 400);
  try {
    const out = await scope.run(new Map(), function () { return fn.apply(null, Array.isArray(body.args) ? body.args : []); });
    return J(out);
  } catch (err) {
    return J({ ok: false, error: String((err && err.message) || err) }, 500);
  }
}

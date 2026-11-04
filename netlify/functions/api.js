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
      t:<id>          a team: name, emoji, join code, leaders, members, team tasks
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
  if (!u || u.closed) return null;
  const h = sha_(tok);
  return (u.tokens || []).some(function (t) { return t && safeEq_(t.h, h); }) ? u : null;
}

/* ---------------- usernames ---------------- */
const RESERVED = ['admin', 'gonpreah', 'ywam', 'support', 'help', 'team', 'teams', 'me', 'you', 'leader', 'staff', 'official', 'jesus', 'god'];
function cleanUsername_(v) {
  const s = String(v == null ? '' : v).trim().toLowerCase();
  if (!/^[a-z0-9_.]{3,20}$/.test(s) || /^[._]|[._]$|\.\./.test(s)) return null;
  if (RESERVED.indexOf(s) > -1) return null;
  return s;
}

/* ---------------- what each person may show ---------------- */
const SHARE_KEYS = ['type', 'strengths', 'streak', 'week', 'teams', 'plan'];
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
function streakOf_(days) {
  const done = function (d) { const m = days && days[d]; return !!(m && Object.keys(m).some(function (k) { return m[k]; })); };
  let d = today_(); if (!done(d)) d = addDays_(d, -1);
  let n = 0; while (done(d) && n < 3660) { n++; d = addDays_(d, -1); }
  return n;
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
function statsOf_(u) {
  const days = u.days || {}, wk = weekOf_(today_());
  return {
    streak: streakOf_(days), best: bestStreakOf_(days),
    week: weekPct_((u.weeks || {})[wk]), habits: (u.habits || []).length,
    tests: (u.personality ? 1 : 0) + (u.gstrengths ? 1 : 0)
  };
}

/* ---------------- what goes out ---------------- */
/* What I see of myself. */
function selfOut_(u) {
  return {
    id: u.id, username: u.username, name: u.name, birthYear: u.birthYear, minor: isMinor_(u),
    lang: u.lang || 'km', sex: u.sex || '', bio: u.bio || '', share: shareOf_(u),
    personality: u.personality || null, gstrengths: u.gstrengths || null,
    habits: u.habits || [], days: u.days || {}, weeks: u.weeks || {},
    teams: u.teams || [], invites: u.invites || [], stats: statsOf_(u), hasPhoto: !!u.hasPhoto,
    plan: planOf_(u), tasks: u.tasks || []
  };
}
/* What someone else sees of a person. `close` = they share a team. */
function cardOut_(u, close) {
  const sh = shareOf_(u), minor = isMinor_(u), st = statsOf_(u);
  const o = { id: u.id, username: u.username, name: minor ? firstName_(u.name) : u.name, hasPhoto: !!u.hasPhoto, minor: minor };
  if (sh.type && u.personality && u.personality.share !== false) { o.type = u.personality.type; o.sex = u.sex || ''; }
  if (sh.strengths && u.gstrengths && u.gstrengths.share !== false) o.strengths = u.gstrengths.top.slice();
  if (sh.streak) { o.streak = st.streak; o.best = st.best; }
  if (sh.week && st.week !== null) o.week = st.week;
  if (sh.teams && close) o.teamCount = (u.teams || []).length;
  if (sh.plan) { const ps = planStats_(u); if (ps.goals || ps.reached) o.plan = ps; }   // counts, never the words
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
    tok = addToken_(u); u.seen = today_();
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

async function register(token, p) {
  const g = await verifyGoogle_(token);
  if (!g) return { ok: false, err: 'google' };
  p = p && typeof p === 'object' ? p : {};
  const username = cleanUsername_(p.username);
  if (!username) return { ok: false, err: 'username' };
  const name = str_(p.name, 60);
  if (name.length < 2) return { ok: false, err: 'name' };
  const by = Number(p.birthYear), y = thisYear_();
  if (!(by >= y - 100 && by <= y)) return { ok: false, err: 'birthYear' };
  if (y - by < MIN_AGE) return { ok: false, err: 'too_young' };   // even at the most, they are under 13
  const gkey = 'gsub:' + sha_(g.sub);
  if (await readJSON(gkey, null)) return { ok: false, err: 'exists' };
  if (await readJSON('uname:' + username, null)) return { ok: false, err: 'taken' };
  const id = 'u' + crypto.randomBytes(9).toString('hex');
  const u = {
    id: id, username: username, name: name, birthYear: by, lang: p.lang === 'en' ? 'en' : 'km',
    created: new Date().toISOString(), seen: today_(), teams: [], habits: [], days: {}, weeks: {}, share: {}
  };
  const tok = addToken_(u);
  await writeJSON('uname:' + username, { id: id });
  await writeJSON(gkey, { id: id });
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
  if (u.seen !== today_()) await mutate_('u:' + uid, null, function (r) { if (r) r.seen = today_(); return { ok: true }; });
  const teams = [], teamTasks = [];
  for (const tid of (u.teams || [])) {
    const t = await readJSON('t:' + tid, null);
    if (!t) continue;
    teams.push(teamBrief_(t, uid));
    teamTasksOut_(t, uid, {}).forEach(function (k) { if (k.forMe && !k.mine) teamTasks.push(Object.assign({ team: t.id, teamName: t.name, emoji: t.emoji || '✦' }, k)); });
  }
  return { ok: true, me: selfOut_(u), teams: teams, teamTasks: teamTasks, today: today_() };
}

/* name, bio, language, character, what to show — all optional */
async function saveProfile(uid, tok, p) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  p = p && typeof p === 'object' ? p : {};
  const res = await mutate_('u:' + uid, null, function (u) {
    if (!u) return { abort: true, ok: false, err: 'auth' };
    if (p.name !== undefined) { const n = str_(p.name, 60); if (n.length < 2) return { abort: true, ok: false, err: 'name' }; u.name = n; }
    if (p.bio !== undefined) u.bio = str_(p.bio, 160);
    if (p.lang === 'km' || p.lang === 'en') u.lang = p.lang;
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
    } else if (!u.personality) return { abort: true, ok: false, err: 'type' };
    if (typeof p.share === 'boolean') u.personality.share = p.share;
    if (PSEASON_IDS.indexOf(p.season) > -1) u.personality.season = p.season;
    if (p.sex === 'male' || p.sex === 'female') u.sex = p.sex;
    return { ok: true };
  });
  if (!res.ok) return res;
  return { ok: true, me: selfOut_(await readJSON('u:' + uid, null)) };
}

async function saveStrengths(uid, tok, p) {
  if (!(await auth_(uid, tok))) return { ok: false, err: 'auth' };
  p = p && typeof p === 'object' ? p : {};
  let scored = null;
  if (p.answers) { scored = gsScore_(p.answers); if (!scored) return { ok: false, err: 'answers' }; }
  const res = await mutate_('u:' + uid, null, function (u) {
    if (!u) return { abort: true, ok: false, err: 'auth' };
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
    if (Object.keys(m).length) u.days[day] = m; else delete u.days[day];
    const cut = addDays_(t, -KEEP_DAYS);
    Object.keys(u.days).forEach(function (d) { if (d < cut) delete u.days[d]; });
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
    Object.keys(u.weeks).sort().slice(0, -60).forEach(function (k) { delete u.weeks[k]; });
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
function planOf_(u) { const p = (u && u.plan) || {}; return { why: p.why || '', goals: Array.isArray(p.goals) ? p.goals : [] }; }
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
    if (act === 'reach') { g.done = a.done ? today_() : ''; return { ok: true }; }
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
    if (act === 'tickStep') { s.done = a.done ? today_() : ''; return { ok: true }; }
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
    if (u && !u.closed && !isMinor_(u)) out.push(cardOut_(u, await sharesTeam_(me, u)));
  }
  return { ok: true, people: out };
}
/* One person's card. Under 18: only for someone in a team with them. */
async function person(uid, tok, id) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  if (typeof id !== 'string' || !/^u[a-f0-9]{18}$/.test(id)) return { ok: false, err: 'none' };
  const u = id === uid ? me : await readJSON('u:' + id, null);
  if (!u || u.closed) return { ok: false, err: 'none' };
  const close = id === uid || await sharesTeam_(me, u);
  if (isMinor_(u) && !close) return { ok: false, err: 'none' };   // as if they weren't there
  const card = cardOut_(u, close);
  const shared = [];
  if (close) for (const tid of (me.teams || [])) {
    if ((u.teams || []).indexOf(tid) > -1) { const t = await readJSON('t:' + tid, null); if (t) shared.push({ id: t.id, name: t.name, emoji: t.emoji }); }
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
  await mutate_('u:' + uid, null, function (u) { if ((u.teams || []).indexOf(map.id) === -1) u.teams = (u.teams || []).concat([map.id]); u.invites = (u.invites || []).filter(function (i) { return i.team !== map.id; }); return { ok: true }; });
  return { ok: true, team: teamBrief_(await readJSON('t:' + map.id, null), uid) };
}
/* A team page: members' cards (progress, never details). Members only. */
async function team(uid, tok, tid) {
  const me = await auth_(uid, tok);
  if (!me) return { ok: false, err: 'auth' };
  const t = typeof tid === 'string' && (me.teams || []).indexOf(tid) > -1 ? await readJSON('t:' + tid, null) : null;
  if (!t || t.members.indexOf(uid) === -1) return { ok: false, err: 'none' };
  const people = [];
  for (const id of t.members) {
    const u = id === uid ? me : await readJSON('u:' + id, null);
    if (u && !u.closed) { const c = cardOut_(u, true); c.leader = t.leaders.indexOf(id) > -1; people.push(c); }
  }
  const out = teamBrief_(t, uid); out.about = t.about || ''; out.people = people;
  const names = {}; people.forEach(function (p) { names[p.id] = p.name; });
  out.tasks = teamTasksOut_(t, uid, names);
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
  let oldCode = null, newCode = null, removed = null;
  const res = await mutate_('t:' + tid, null, function (t) {
    if (!t || t.leaders.indexOf(uid) === -1) return { abort: true, ok: false, err: 'not_leader' };
    if (act === 'code') { oldCode = t.code; newCode = newCode_(); t.code = newCode; return { ok: true }; }
    if (typeof who !== 'string' || t.members.indexOf(who) === -1 || who === uid) return { abort: true, ok: false, err: 'none' };
    if (act === 'remove') { t.members = t.members.filter(function (m) { return m !== who; }); t.leaders = t.leaders.filter(function (m) { return m !== who; }); removed = who; return { ok: true }; }
    if (act === 'lead') { if (t.leaders.indexOf(who) === -1) t.leaders.push(who); return { ok: true }; }
    return { abort: true, ok: false, err: 'act' };
  });
  if (!res.ok) return res;
  if (newCode) { await writeJSON('tcode:' + newCode, { id: tid }); await dropKey('tcode:' + oldCode); }
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
    if (!u || u.closed || isMinor_(u)) return { abort: true, ok: false, err: 'none' };   // nobody adds anyone under 18
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

/* ---------------- team tasks ----------------
   A leader (always an adult) sets a task for everyone or for one member; each
   person ticks their own. Everyone in the team sees every team task — there is
   no private channel here, on purpose (see CLAUDE.md, safety). */
const MAX_TEAM_TASKS = 40, KEEP_TEAM_TASK_DAYS = 60;
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
  return team(uid, tok, tid);
}

async function signOut(uid, tok) {
  if (!(await auth_(uid, tok))) return { ok: true };
  const h = sha_(tok);
  await mutate_('u:' + uid, null, function (u) { if (u) u.tokens = (u.tokens || []).filter(function (t) { return t.h !== h; }); return { ok: true }; });
  return { ok: true };
}

export const HANDLERS = {
  authConfig, loginGoogle, checkUsername, register, boot, saveProfile, savePhoto, photos,
  savePersonality, saveStrengths, saveHabits, tickHabit, saveWeek,
  savePlanWhy, saveGoal, goalAct, myTask, teamTask,
  searchPeople, person, createTeam, joinTeam, team, leaveTeam, teamManage, inviteToTeam, answerInvite, signOut
};
export const __test = { isMinor_, weekOf_, today_, streakOf_, gsScore_, monthOf_, quarterOf_ };

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

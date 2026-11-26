/*  Lordship — the backend. One POST endpoint: {fn, args} → HANDLERS[fn](args).

    Blobs store "lordship":
      cfg                     the main class: {name, code, weekStart}  (code falls back to LS_CLASS_CODE)
      classes                 more classes: {CODE: {name, weekStart}}; mv:<class>:<sid> / mvn:<class>:<name> → where a student moved
      slide:<day>             a day's slides: {pdf:{name,size,type,parts,v}, pptx:{…}, link}
      sp:<day>:<kind>:<v>:<i> one part of an uploaded file (base64, ≤ 3 MB of file each)
      q:<id>                  an anonymous question: {id, text, topic, day, status} — no name, no device, no IP
      job:<id>                a coaching turn waiting for Claude (deleted once read; the chat itself lives on the phone)
      bk:<code>               a cloud backup a student asked for: their own saved answers, found only by its code (180 days)
      st:<class>:<sid>        a student who joined: name, PIN (salted scrypt hash), phones' keys (hashed), fun fact
      stn:<class>:<name>      the student id for a name (one name per class)
      sd:<sid>                a student's saved answers (synced from their phone; only they can load them)
      game:<class>            the Day 1 game: phase, rounds, reveal; gv:<class>:<round>:<sid> a vote
      an:<class>:<anon>       anonymous class totals a student opted into: wheel numbers, HOT numbers, committed yes/no —
                              keyed by a random id made on the phone, never a name
      n:<day>, nch:<day>, nq:<day>, bad:<day>   daily counters

    Who can do what:
      anyone with the class code: sessions, slides, the question box, all coaching tools.
      anyone at all (church mode): only the coaching tools marked church in lib/prompts.js.
      the admin (LS_ADMIN_PASSWORD): the class, slides, the questions.
*/
import { getStore } from '@netlify/blobs';
import crypto from 'node:crypto';
import { TOOLS, LIFE_AREA_IDS } from './lib/prompts.js';
import { POLLS, nextRound, PROFILE_IDS, LIVE_POLL_IDS } from './lib/game.js';

/* ---------------- storage ---------------- */
function store() { return globalThis.__lsStore || getStore({ name: 'lordship', consistency: 'strong' }); }
export const db = {
  get: (k) => store().get(k, { type: 'json' }),
  set: (k, v) => store().setJSON(k, v),
  del: (k) => store().delete(k),
  async keys(prefix) { const r = await store().list({ prefix }); return (r.blobs || []).map(b => b.key); }
};

/* ---------------- helpers ---------------- */
const rnd = (n) => { const abc = 'abcdefghijkmnpqrstuvwxyz23456789'; const b = crypto.randomBytes(n); let s = ''; for (let i = 0; i < n; i++) s += abc[b[i] % abc.length]; return s; };
const same = (a, b) => { const x = crypto.createHash('sha256').update(String(a)).digest(), y = crypto.createHash('sha256').update(String(b)).digest(); return crypto.timingSafeEqual(x, y); };
export const clip = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, n);
const today = () => new Date().toISOString().slice(0, 10);
export class Fail extends Error { constructor(code, status) { super(code); this.code = code; this.status = status || 400; } }

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
export const PUB_GROUPS = ['dts', 'dbs', 'staff', 'visitor'];
export const CLOUDS = ['excuse'];
let wcSeq = 0;
export const SPHERE_IDS = ['family', 'church', 'education', 'government', 'media', 'arts', 'business'];
export const TOPICS = ['romance', 'sexuality', 'finances', 'struggles', 'faith', 'calling', 'other'];
export const STATUSES = ['new', 'class', 'panel', 'answered', 'hidden'];
const KINDS = { pdf: /^application\/pdf$/, pptx: /^application\/(vnd\.openxmlformats-officedocument\.presentationml\.presentation|vnd\.ms-powerpoint|octet-stream)$/ };
const PART = 3 * 1024 * 1024;                       // bytes of file per part
const MAX_FILE = 60 * 1024 * 1024;
const num = (v, d) => { const n = parseInt(v, 10); return n > 0 ? n : d; };
const CAP_DAY = () => num(process.env.LS_CAP_DAY, 3000);
const CAP_CHURCH = () => num(process.env.LS_CAP_CHURCH, 1000);
const CAP_Q = () => num(process.env.LS_CAP_QUESTIONS, 400);
async function bump(k) { const n = ((await db.get(k)) || 0) + 1; await db.set(k, n); return n; }

const BK = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const bkCode = () => { const b = crypto.randomBytes(10); let s = ''; for (let i = 0; i < 10; i++) s += BK[b[i] % BK.length]; return s; };
const normBk = (c) => { const s = String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); return /^[A-Z0-9]{10}$/.test(s) ? s : ''; };
const fmtBk = (s) => s.slice(0, 5) + '-' + s.slice(5);
const normCode = (c) => clip(c, 20).toUpperCase().replace(/[^A-Z0-9]/g, '');
export async function cfg() {
  const c = (await db.get('cfg')) || {};
  return { name: c.name || 'Lordship DTS', code: c.code || normCode(process.env.LS_CLASS_CODE || ''), weekStart: c.weekStart || '' };
}
/* More classes (Nov 2026, Uriah: both classes joined under one code — "move to a DTS class that I can view, just them"):
   'classes' = {CODE: {name, weekStart}} beside the main class in 'cfg'. Everything a class keeps is under its code. */
async function extraClasses() { return (await db.get('classes')) || {}; }
async function findClass(code) {
  code = normCode(code);
  if (!code) return null;
  const c = await cfg();
  if (c.code && same(code, c.code)) return c;
  const x = (await extraClasses())[code];
  return x ? { name: x.name, code, weekStart: x.weekStart || c.weekStart || '' } : null;
}
async function allClassList() {
  const c = await cfg(), x = await extraClasses();
  return (c.code ? [Object.assign({ main: true }, c)] : []).concat(Object.entries(x).map(([code, v]) => ({ code, name: v.name, weekStart: v.weekStart || c.weekStart || '' })));
}
/* A live poll on its own (Zoom) or one class's run of it (a.room = the class code): lp:<poll>[@<class>]:… */
async function pollKey(a) {
  if (!a.room) return a.poll;
  const c = await findClass(a.room);
  if (!c) throw new Fail('NO_CLASS', 403);
  return a.poll + '@' + c.code;
}
async function classOk(a) {
  const c = await findClass(a.code);
  if (!c) throw new Fail('NO_CLASS', 403);
  return c;
}
/* The admin picks which class a call is about (a.cls); the main class by default. */
async function adminClass(a) {
  const c = a.cls ? await findClass(a.cls) : await cfg();
  if (!c || !c.code) throw new Fail('NO_CLASS', 404);
  return c;
}
/* Move a student (their account, name, keys and quiz result) to another class. Their saved answers (sd:<sid>) don't move:
   they're keyed by the student. A pointer is left behind so a phone still on the old class finds them. */
async function moveStudent(s, from, to) {
  const nk = nameKey(s.name);
  if (await db.get('stn:' + to.code + ':' + nk)) throw new Fail('NAME_TAKEN', 409);
  await db.set('st:' + to.code + ':' + s.id, s);
  await db.set('stn:' + to.code + ':' + nk, s.id);
  const ns = await db.get('ns:' + from.code + ':' + s.id);
  if (ns) { await db.set('ns:' + to.code + ':' + s.id, ns); await db.del('ns:' + from.code + ':' + s.id); }
  const qz = await db.get('qz:' + from.code + ':' + s.id);
  if (qz) { await db.set('qz:' + to.code + ':' + s.id, qz); await db.del('qz:' + from.code + ':' + s.id); }
  await db.del('st:' + from.code + ':' + s.id); await db.del('stn:' + from.code + ':' + nk);
  await db.set('mv:' + from.code + ':' + s.id, to.code); await db.set('mvn:' + from.code + ':' + nk, to.code);
  await db.del('mv:' + to.code + ':' + s.id); await db.del('mvn:' + to.code + ':' + nk);
  return { code: to.code, name: to.name, weekStart: to.weekStart };
}
/* ---- students: a name and a 4-digit PIN (Uriah: "a basic 4-pin thing") ---- */
const normName = (n) => clip(n, 40).trim().replace(/\s+/g, ' ');
const nameKey = (n) => normName(n).toLowerCase().replace(/[^a-z0-9\u00c0-\uffff ]/g, '').replace(/ /g, '-').slice(0, 40);
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
function pinHash(pin, salt) { return crypto.scryptSync(String(pin), salt, 32).toString('hex'); }
async function student(a, c) {
  c = c || await classOk(a);
  const t = String(a.token || '');
  const sid = clip(a.sid, 20);
  let s = sid && await db.get('st:' + c.code + ':' + sid);
  if (!s && sid) {   // moved to another class: follow the pointer
    const to = await db.get('mv:' + c.code + ':' + sid);
    const nc = to && await findClass(to);
    if (nc) { s = await db.get('st:' + nc.code + ':' + sid); c = nc; }
  }
  if (!s || !t || !(s.keys || []).includes(sha(t))) throw new Fail('NO_STUDENT', 401);
  return { s, c };
}
async function issueKey(s, c) {
  const token = rnd(24);
  s.keys = [sha(token)].concat(s.keys || []).slice(0, 6);
  s.seen = Date.now();
  await db.set('st:' + c.code + ':' + s.id, s);
  return { token, sid: s.id, name: s.name, fact: s.fact || '' };
}
async function allStudents(c) {
  const out = [];
  for (const k of await db.keys('st:' + c.code + ':')) { const s = await db.get(k); if (s) out.push(s); }
  return out.sort((x, y) => (x.at || 0) - (y.at || 0));
}

async function admin(a) {
  const pw = process.env.LS_ADMIN_PASSWORD;
  if (!pw) throw new Fail('NO_ADMIN_PASSWORD', 503);
  const k = 'bad:' + today();
  if (((await db.get(k)) || 0) > 60) throw new Fail('LOCKED', 429);
  if (!same(String(a.pw || ''), pw)) { await bump(k); throw new Fail('BAD_PASSWORD', 403); }
}
const day = (d) => { if (!DAYS.includes(d)) throw new Fail('BAD_DAY'); return d; };
const kind = (k) => { if (!KINDS[k]) throw new Fail('BAD_KIND'); return k; };

/* A chat as the phone keeps it: the coach speaks first, then turns alternate. */
function cleanMessages(m) {
  if (!Array.isArray(m) || m.length > 40) throw new Fail('BAD_MESSAGES');
  return m.map(x => {
    if (!x || (x.role !== 'user' && x.role !== 'assistant')) throw new Fail('BAD_MESSAGES');
    const content = clip(x.content, 2500).trim();
    if (!content) throw new Fail('BAD_MESSAGES');
    return { role: x.role, content };
  });
}

function slideOut(s) {
  const f = (x) => x ? { name: x.name, size: x.size, type: x.type, parts: x.parts, v: x.v, done: !!x.done } : null;
  return { pdf: f(s && s.pdf && s.pdf.done && s.pdf), pptx: f(s && s.pptx && s.pptx.done && s.pptx), link: (s && s.link) || '' };
}
async function allSlides() {
  const out = {};
  for (const d of DAYS) out[d] = slideOut(await db.get('slide:' + d));
  return out;
}
async function dropFile(d, k, meta) {
  if (!meta) return;
  for (let i = 0; i < (meta.parts || 0); i++) await db.del(`sp:${d}:${k}:${meta.v}:${i}`);
}

/* ---------------- the handlers ---------------- */
export const HANDLERS = {
  /* --- the class --- */
  async classCheck(a) {
    const c = await classOk(a);
    const out = { ok: true, name: c.name, weekStart: c.weekStart };
    if (a.sid && a.token) {   // a phone still on the class its student was moved out of
      try { const r = await student(a, c); if (r.c.code !== c.code) out.moved = { code: r.c.code, name: r.c.name, weekStart: r.c.weekStart }; } catch (e) { /* not signed in here */ }
    }
    return out;
  },
  /* A student moves themselves with the new class's code. */
  async moveClass(a) {
    const { s, c } = await student(a);
    const to = await findClass(a.to);
    if (!to) throw new Fail('NO_CLASS', 403);
    if (to.code === c.code) return { code: c.code, name: c.name, weekStart: c.weekStart };
    return moveStudent(s, c, to);
  },
  async slides(a) { await classOk(a); return { slides: await allSlides() }; },
  async slideGet(a) {
    await classOk(a);
    const d = day(a.day), k = kind(a.kind);
    const s = await db.get('slide:' + d);
    const meta = s && s[k];
    const i = parseInt(a.i, 10);
    if (!meta || !meta.done || !(i >= 0 && i < meta.parts)) throw new Fail('NO_FILE', 404);
    const p = await db.get(`sp:${d}:${k}:${meta.v}:${i}`);
    if (!p) throw new Fail('NO_FILE', 404);
    return { d: p.d };
  },

  /* --- joining the class: name + 4-digit PIN --- */
  async join(a) {
    const c = await classOk(a);
    const name = normName(a.name);
    if (name.length < 2) throw new Fail('BAD_NAME');
    if (!/^\d{4}$/.test(String(a.pin || ''))) throw new Fail('BAD_PIN');
    const nk = nameKey(name);
    if (!nk) throw new Fail('BAD_NAME');
    if (await db.get('stn:' + c.code + ':' + nk)) throw new Fail('NAME_TAKEN', 409);
    if (await bump('nj:' + c.code + ':' + today()) > num(process.env.LS_CAP_JOINS, 300)) throw new Fail('LIMIT', 429);
    const id = rnd(12), salt = rnd(16);
    const s = { id, name, salt, pin: pinHash(a.pin, salt), at: Date.now(), keys: [] };
    await db.set('stn:' + c.code + ':' + nk, id);
    return issueKey(s, c);
  },
  async signIn(a) {
    let c = await classOk(a);
    let sid = await db.get('stn:' + c.code + ':' + nameKey(a.name));
    if (!sid) {   // moved to another class: sign in there and tell the phone
      const to = await db.get('mvn:' + c.code + ':' + nameKey(a.name));
      const nc = to && await findClass(to);
      if (nc) { c = nc; sid = await db.get('stn:' + c.code + ':' + nameKey(a.name)); }
    }
    let from = null;
    if (!sid) {   // still in another class (e.g. joined under the wrong code): the same name and PIN brings them here
      for (const o of await allClassList()) {
        if (o.code === c.code) continue;
        const osid = await db.get('stn:' + o.code + ':' + nameKey(a.name));
        if (osid) { sid = osid; from = o; break; }
      }
    }
    const s = sid && await db.get('st:' + (from || c).code + ':' + sid);
    if (!s) throw new Fail('NO_NAME', 404);
    const k = 'pinbad:' + s.id + ':' + new Date().toISOString().slice(0, 13);
    if (((await db.get(k)) || 0) >= 8) throw new Fail('LOCKED', 429);
    if (!/^\d{4}$/.test(String(a.pin || '')) || !same(pinHash(a.pin, s.salt), s.pin)) { await bump(k); throw new Fail('BAD_PIN', 403); }
    if (from) await moveStudent(s, from, c);
    return Object.assign(await issueKey(s, c), { cls: { code: c.code, name: c.name, weekStart: c.weekStart } });
  },
  async me(a) { const { s } = await student(a); return { sid: s.id, name: s.name, fact: s.fact || '' }; },
  async setFact(a) {
    const { s, c } = await student(a);
    s.fact = clip(a.fact, 160).trim();
    await db.set('st:' + c.code + ':' + s.id, s);
    return { ok: true, fact: s.fact };
  },
  async syncSave(a) {
    const { s } = await student(a);
    if (!a.data || typeof a.data !== 'object' || Array.isArray(a.data)) throw new Fail('EMPTY');
    const raw = JSON.stringify(a.data);
    if (raw.length > 400000) throw new Fail('TOO_BIG', 413);
    const at = Math.min(parseInt(a.at, 10) || Date.now(), Date.now());
    await db.set('sd:' + s.id, { data: JSON.parse(raw), at });
    return { ok: true, at };
  },
  async syncLoad(a) {
    const { s } = await student(a);
    const d = await db.get('sd:' + s.id);
    return { data: d ? d.data : null, at: d ? d.at : 0 };
  },

  /* --- the Day 1 game (phones) --- */
  async gameState(a) {
    const c = await classOk(a);
    let me = null;
    try { me = (await student(a, c)).s; } catch (e) { /* not signed in: can watch, can't vote */ }
    const g = (await db.get('game:' + c.code)) || { phase: 'off' };
    const out = { phase: g.phase, round: g.rounds ? g.rounds.length - 1 : -1, reveal: !!g.reveal, joined: (await db.keys('st:' + c.code + ':')).length };
    const r = g.rounds && g.rounds[g.rounds.length - 1];
    if (r && g.phase === 'q') {
      out.kind = r.kind;
      out.q = r.kind === 'poll' ? r.q : r.fact;
      out.opts = r.kind === 'poll' ? r.opts : (await allStudents(c)).map(x => ({ id: x.id, name: x.name }));
      if (me) out.mine = await db.get(`gv:${c.code}:${out.round}:${me.id}`);
      if (g.reveal) Object.assign(out, await tally(c, g, out.round));
      if (me && r.kind === 'who') out.isMe = r.sid === me.id;
    }
    if (g.phase === 'end' || (g.phase === 'q' && g.reveal)) { const b = await board(c, g); out.top = b.slice(0, 5); if (me) out.myScore = (b.find(x => x.id === me.id) || {}).score || 0; }
    return out;
  },
  async gameVote(a) {
    const { s, c } = await student(a);
    const g = await db.get('game:' + c.code);
    const round = parseInt(a.round, 10);
    if (!g || g.phase !== 'q' || g.reveal || round !== g.rounds.length - 1) throw new Fail('CLOSED', 409);
    const r = g.rounds[round];
    const choice = r.kind === 'poll' ? parseInt(a.choice, 10) : clip(a.choice, 20);
    if (r.kind === 'poll' && !(choice >= 0 && choice < r.opts.length)) throw new Fail('BAD_CHOICE');
    if (r.kind === 'who' && !(await db.get('st:' + c.code + ':' + choice))) throw new Fail('BAD_CHOICE');
    await db.set(`gv:${c.code}:${round}:${s.id}`, choice);
    return { ok: true };
  },

  /* --- the Lordship profile quiz: a joined student puts their profile on the big screen --- */
  async quizSave(a) {
    const { s, c } = await student(a);
    if (!PROFILE_IDS.includes(a.profile)) throw new Fail('BAD_PROFILE');
    await db.set('qz:' + c.code + ':' + s.id, { p: a.profile, at: Date.now() });
    return { ok: true };
  },

  /* --- the base-wide profile quiz (?quiz): no class code, no account. Everything lives in the key itself
     (pq:<phone id>:<time>:<group>:<profile>:<first name>) so the projector's results are one list call. --- */
  async pubQuiz(a) {
    const rid = String(a.rid || '');
    if (!/^[a-z0-9]{16}$/.test(rid)) throw new Fail('BAD_ID');
    if (!PUB_GROUPS.includes(a.group)) throw new Fail('BAD_GROUP');
    if (!PROFILE_IDS.includes(a.profile)) throw new Fail('BAD_PROFILE');
    const name = clip(a.name, 40).replace(/[\u200B-\u200F\u2028-\u202E\u2066-\u2069]/g, '').trim().split(/\s+/)[0].slice(0, 20);
    if (!name) throw new Fail('NO_NAME');
    const k = 'pqn:' + today();
    const n = (await db.get(k)) || 0;
    if (n > 3000) throw new Fail('BUSY', 429);
    await db.set(k, n + 1);
    for (const old of await db.keys('pq:' + rid + ':')) await db.del(old);
    await db.set(['pq', rid, Date.now().toString(36), a.group, a.profile, Buffer.from(name).toString('base64url')].join(':'), 1);
    return { ok: true };
  },
  async pubQuizResults() {
    const rows = [];
    for (const k of await db.keys('pq:')) {
      const [, , t, g, p, n] = k.split(':');
      if (!PUB_GROUPS.includes(g) || !PROFILE_IDS.includes(p)) continue;
      let name = ''; try { name = Buffer.from(n || '', 'base64url').toString('utf8').slice(0, 20); } catch { name = ''; }
      rows.push({ t: parseInt(t, 36) || 0, g, p, n: name });
    }
    rows.sort((x, y) => x.t - y.t);
    const counts = {};
    for (const g of ['all'].concat(PUB_GROUPS)) counts[g] = Object.fromEntries(PROFILE_IDS.map(p => [p, 0]));
    for (const r of rows) { counts.all[r.p]++; counts[r.g][r.p]++; }
    const totals = Object.fromEntries(Object.keys(counts).map(g => [g, Object.values(counts[g]).reduce((x, y) => x + y, 0)]));
    return { counts, totals, recent: rows.slice(-18).reverse().map(r => ({ n: r.n, g: r.g, p: r.p })) };
  },
  async pubQuizReset(a) {
    await admin(a);
    for (const k of await db.keys('pq:')) await db.del(k);
    return { ok: true };
  },

  /* --- live polls (?poll=<id>, Zoom or a room): no name at all — a random phone id so a retake replaces, and the answers.
     Everything is in the key (lp:<poll>:<phone id>:<time>:<answer>:<answer>…), so the results are one list call. --- */
  async livePoll(a) {
    const ids = Object.prototype.hasOwnProperty.call(LIVE_POLL_IDS, a.poll) && LIVE_POLL_IDS[a.poll];
    if (!ids) throw new Fail('NO_POLL', 404);
    const rid = String(a.rid || '');
    if (!/^[a-z0-9]{16}$/.test(rid)) throw new Fail('BAD_ID');
    const pk = await pollKey(a);
    const ans = Array.isArray(a.answers) ? a.answers : [];
    if (ans.length !== ids.length || ans.some((x, i) => !ids[i].includes(x))) throw new Fail('BAD_ANSWER');
    const k = 'lpn:' + today();
    const n = (await db.get(k)) || 0;
    if (n > 5000) throw new Fail('BUSY', 429);
    await db.set(k, n + 1);
    for (const old of await db.keys('lp:' + pk + ':' + rid + ':')) await db.del(old);
    await db.set(['lp', pk, rid, Date.now().toString(36)].concat(ans).join(':'), 1);
    return { ok: true };
  },
  async livePollResults(a) {
    const ids = Object.prototype.hasOwnProperty.call(LIVE_POLL_IDS, a.poll) && LIVE_POLL_IDS[a.poll];
    if (!ids) throw new Fail('NO_POLL', 404);
    const counts = ids.map(opts => Object.fromEntries(opts.map(o => [o, 0])));
    let total = 0;
    for (const k of await db.keys('lp:' + await pollKey(a) + ':')) {
      const ans = k.split(':').slice(4);
      if (ans.length !== ids.length || ans.some((x, i) => !ids[i].includes(x))) continue;
      total++; ans.forEach((x, i) => { counts[i][x]++; });
    }
    return { total, counts };
  },
  async livePollReset(a) {
    await admin(a);
    if (!Object.prototype.hasOwnProperty.call(LIVE_POLL_IDS, a.poll)) throw new Fail('NO_POLL', 404);
    for (const k of await db.keys('lp:' + await pollKey(a) + ':')) await db.del(k);
    return { ok: true };
  },

  /* --- a word cloud ("My excuse is ___"): a few words, no names; up to 3 per phone; the admin can close, reopen or hide one.
     Keys wc:<cloud>[@<class>]:<phone id>:<time>:<words, base64url>; wco:<…> closed; wch:<…> hidden phrases. --- */
  async cloudAdd(a) {
    if (!CLOUDS.includes(a.cloud)) throw new Fail('NO_CLOUD', 404);
    const ck = await pollKey({ poll: a.cloud, room: a.room });
    if (await db.get('wco:' + ck)) throw new Fail('CLOSED', 409);
    const rid = String(a.rid || '');
    if (!/^[a-z0-9]{16}$/.test(rid)) throw new Fail('BAD_ID');
    const words = clip(a.text, 60).replace(/[\u200B-\u200F\u2028-\u202E\u2066-\u2069]/g, '').trim().split(/\s+/).filter(Boolean).slice(0, 4).join(' ').slice(0, 40);
    if (!words) throw new Fail('EMPTY');
    const k = 'lpn:' + today();
    const n = (await db.get(k)) || 0;
    if (n > 5000) throw new Fail('BUSY', 429);
    await db.set(k, n + 1);
    const mine = (await db.keys('wc:' + ck + ':' + rid + ':')).sort();
    for (const old of mine.slice(0, Math.max(0, mine.length - 2))) await db.del(old);
    await db.set(['wc', ck, rid, (Date.now() * 1000 + (++wcSeq % 1000)).toString(36).padStart(11, '0'), Buffer.from(words).toString('base64url')].join(':'), 1);
    return { ok: true, words };
  },
  async cloudResults(a) {
    if (!CLOUDS.includes(a.cloud)) throw new Fail('NO_CLOUD', 404);
    const ck = await pollKey({ poll: a.cloud, room: a.room });
    const hidden = (await db.get('wch:' + ck)) || [];
    const counts = {};
    for (const k of await db.keys('wc:' + ck + ':')) {
      let w = ''; try { w = Buffer.from(k.split(':')[4] || '', 'base64url').toString('utf8'); } catch { w = ''; }
      const key = w.toLowerCase().replace(/[^\p{L}\p{N}' ]/gu, '').replace(/\s+/g, ' ').trim();
      if (!key || hidden.includes(key)) continue;
      counts[key] = (counts[key] || 0) + 1;
    }
    const words = Object.entries(counts).map(([w, n]) => ({ w, n })).sort((x, y) => y.n - x.n).slice(0, 60);
    return { open: !(await db.get('wco:' + ck)), words, total: words.reduce((t, x) => t + x.n, 0) };
  },
  async cloudAdmin(a) {
    await admin(a);
    if (!CLOUDS.includes(a.cloud)) throw new Fail('NO_CLOUD', 404);
    const ck = await pollKey({ poll: a.cloud, room: a.room });
    if (a.action === 'close') await db.set('wco:' + ck, 1);
    else if (a.action === 'open') await db.del('wco:' + ck);
    else if (a.action === 'hide') { const h = (await db.get('wch:' + ck)) || []; const w = clip(a.word, 60).toLowerCase(); if (w && !h.includes(w)) h.push(w); await db.set('wch:' + ck, h.slice(-200)); }
    else if (a.action === 'reset') { for (const k of await db.keys('wc:' + ck + ':')) await db.del(k); await db.del('wch:' + ck); }
    else throw new Fail('BAD_ACTION');
    return HANDLERS.cloudResults(a);
  },

  /* --- Friday: one next step in 30 days, the throw-down, and the 7/14/30-day check-ins (ns:<class>:<sid>). Private by
     default: the admin sees counts; the step, sphere and notes only of those who chose "share with my staff". --- */
  async stepSave(a) {
    const { s, c } = await student(a);
    const k = 'ns:' + c.code + ':' + s.id;
    const cur = (await db.get(k)) || { checks: {} };
    const step = clip(a.step, 200).trim();
    if (!step) throw new Fail('EMPTY');
    const sphere = SPHERE_IDS.includes(a.sphere) ? a.sphere : '';
    const by = /^\d{4}-\d{2}-\d{2}$/.test(String(a.by || '')) ? a.by : '';
    const n = { step, sphere, by, share: !!a.share, declared: a.declared ? (cur.declared || Date.now()) : 0, checks: cur.checks || {}, at: Date.now() };
    await db.set(k, n);
    return { ok: true, declared: n.declared };
  },
  async stepCheck(a) {
    const { s, c } = await student(a);
    const k = 'ns:' + c.code + ':' + s.id;
    const cur = await db.get(k);
    if (!cur || !cur.declared) throw new Fail('NOT_DECLARED', 409);
    if (!['d7', 'd14', 'd30'].includes(a.at)) throw new Fail('BAD_CHECK');
    if (!['yes', 'partly', 'not'].includes(a.answer)) throw new Fail('BAD_ANSWER');
    cur.checks = Object.assign({}, cur.checks, { [a.at]: { a: a.answer, note: clip(a.note, 300).trim(), at: Date.now() } });
    await db.set(k, cur);
    return { ok: true };
  },
  /* Thursday's "Burn the ships": an anonymous count per class (bs:<class>:<phone id>) — never the plan itself. */
  async burnAdd(a) {
    const c = await classOk(a);
    const rid = String(a.rid || '');
    if (!/^[a-z0-9]{16}$/.test(rid)) throw new Fail('BAD_ID');
    await db.set('bs:' + c.code + ':' + rid, 1);
    return { ok: true };
  },
  async burnCount(a) {
    const c = await classOk(a);
    return { burned: (await db.keys('bs:' + c.code + ':')).length, students: (await db.keys('st:' + c.code + ':')).length };
  },
  async burnReset(a) {
    await admin(a);
    const c = await adminClass(a);
    for (const k of await db.keys('bs:' + c.code + ':')) await db.del(k);
    return { ok: true };
  },
  async throwdownCount(a) {
    const c = await classOk(a);
    let declared = 0;
    for (const k of await db.keys('ns:' + c.code + ':')) { const r = await db.get(k); if (r && r.declared) declared++; }
    return { declared, students: (await db.keys('st:' + c.code + ':')).length };
  },
  async adminSteps(a) {
    await admin(a);
    const c = await adminClass(a);
    const byId = Object.fromEntries((await allStudents(c)).map(x => [x.id, x.name]));
    const out = { declared: 0, planned: 0, checks: { d7: { yes: 0, partly: 0, not: 0 }, d14: { yes: 0, partly: 0, not: 0 }, d30: { yes: 0, partly: 0, not: 0 } }, shared: [] };
    for (const k of await db.keys('ns:' + c.code + ':')) {
      const r = await db.get(k); if (!r) continue;
      out.planned++; if (r.declared) out.declared++;
      for (const [w, v] of Object.entries(r.checks || {})) if (out.checks[w] && out.checks[w][v.a] != null) out.checks[w][v.a]++;
      const sid = k.split(':').pop();
      if (r.share && byId[sid]) out.shared.push({ name: byId[sid], step: r.step, sphere: r.sphere, by: r.by, declared: r.declared, checks: r.checks || {} });
    }
    out.shared.sort((x, y) => x.name.localeCompare(y.name));
    return out;
  },

  /* --- the anonymous question box: only the words and a topic are kept --- */
  async ask(a) {
    await classOk(a);
    const text = clip(a.text, 1200).trim();
    if (text.length < 3) throw new Fail('EMPTY');
    const topic = TOPICS.includes(a.topic) ? a.topic : 'other';
    if (await bump('nq:' + today()) > CAP_Q()) throw new Fail('LIMIT', 429);
    const id = rnd(12);
    await db.set('q:' + id, { id, text, topic, day: today(), status: 'new' });
    return { ok: true };
  },

  /* --- coaching with Claude (the work runs in coach-background.js) --- */
  async coachStart(a) {
    const tool = TOOLS[a.tool];
    if (!tool || !Object.prototype.hasOwnProperty.call(TOOLS, a.tool)) throw new Fail('BAD_TOOL');
    let church = false;
    try { await classOk(a); } catch (e) {
      if (!tool.church || process.env.LS_CHURCH_COACH === 'off') throw e;
      church = true;
    }
    if (!process.env.ANTHROPIC_API_KEY && !globalThis.__lsClaude) throw new Fail('NO_KEY', 503);
    const distill = !!a.distill;
    if (distill && !tool.distill) throw new Fail('BAD_TOOL');
    const messages = cleanMessages(a.messages || []);
    if (distill && !messages.some(m => m.role === 'user')) throw new Fail('EMPTY');
    const context = clip(a.context, 6000);
    const d = today();
    if (await bump('n:' + d) > CAP_DAY()) throw new Fail('LIMIT', 429);
    if (church && await bump('nch:' + d) > CAP_CHURCH()) throw new Fail('LIMIT', 429);
    const id = rnd(16);
    await db.set('job:' + id, { id, tool: a.tool, church, distill, messages, context, status: 'queued', at: Date.now() });
    return { job: id };
  },
  async coachJob(a) {
    const id = clip(a.job, 20);
    const j = id && await db.get('job:' + id);
    if (!j) throw new Fail('NO_JOB', 404);
    if ((j.status === 'queued' || j.status === 'running') && Date.now() - j.at > 5 * 60000) { j.status = 'error'; j.error = 'TIMEOUT'; }
    if (j.status === 'done' || j.status === 'error') await db.del('job:' + id);
    return { status: j.status, result: j.result == null ? null : j.result, partial: j.partial || null, error: j.error || null };
  },

  /* --- "Save my work": a backup found only by its code (no account) --- */
  async backupSave(a) {
    const raw = JSON.stringify(a.data == null ? null : a.data);
    if (!a.data || typeof a.data !== 'object' || Array.isArray(a.data)) throw new Fail('EMPTY');
    if (raw.length > 400000) throw new Fail('TOO_BIG', 413);
    let code = normBk(a.code);
    if (code && !(await db.get('bk:' + code))) code = '';
    if (!code) {
      if (await bump('nb:' + today()) > num(process.env.LS_CAP_BACKUPS, 3000)) throw new Fail('LIMIT', 429);
      code = bkCode();
    }
    await db.set('bk:' + code, { data: JSON.parse(raw), at: Date.now() });
    return { code: fmtBk(code) };
  },
  async backupLoad(a) {
    const code = normBk(a.code);
    const k = 'nbx:' + today();
    if (((await db.get(k)) || 0) > 2000) throw new Fail('LOCKED', 429);
    const b = code && await db.get('bk:' + code);
    if (!b || Date.now() - b.at > 180 * 86400000) { await bump(k); throw new Fail('NO_BACKUP', 404); }
    return { data: b.data, at: b.at };
  },

  /* --- anonymous class totals (opt-in on the phone) --- */
  async shareTotals(a) {
    const c = await classOk(a);
    const anon = String(a.anon || '');
    if (!/^[a-z0-9]{16}$/.test(anon)) throw new Fail('BAD_ID');
    const k = 'an:' + c.code + ':' + anon;
    if (a.off) { await db.del(k); return { ok: true }; }
    const nums = (o, max) => {
      const out = {};
      if (o && typeof o === 'object') for (const [id, v] of Object.entries(o).slice(0, 12)) {
        const n = parseInt(v, 10);
        if (/^[a-z]{2,12}$/.test(id) && n >= 1 && n <= max) out[id] = n;
      }
      return out;
    };
    const w = a.wheel || {};
    await db.set(k, { out: nums(w.out, 10), in: nums(w.in, 10), hot: nums(a.hot, 5), committed: !!a.committed, day: today() });
    return { ok: true };
  },
  async adminTotals(a) {
    await admin(a);
    const c = await adminClass(a);
    const sums = { out: {}, in: {}, hot: {} };
    let n = 0, committed = 0, wheels = 0;
    for (const k of await db.keys('an:' + c.code + ':')) {
      const r = await db.get(k); if (!r) continue;
      n++; if (r.committed) committed++;
      if (Object.keys(r.out || {}).length + Object.keys(r.in || {}).length) wheels++;
      for (const side of ['out', 'in', 'hot']) for (const [id, v] of Object.entries(r[side] || {})) {
        const s = sums[side][id] || (sums[side][id] = { t: 0, n: 0 }); s.t += v; s.n++;
      }
    }
    const avg = (o) => Object.fromEntries(Object.entries(o).map(([id, s]) => [id, { avg: Math.round(s.t / s.n * 10) / 10, n: s.n }]));
    return { n, wheels, committed, out: avg(sums.out), in: avg(sums.in), hot: avg(sums.hot) };
  },

  /* --- the admin page --- */
  async adminLogin(a) { await admin(a); return { cfg: await cfg(), classes: await allClassList(), slides: await allSlides(), hasKey: !!process.env.ANTHROPIC_API_KEY }; },
  async adminClasses(a) {
    await admin(a);
    const list = await allClassList();
    for (const c of list) c.n = (await db.keys('st:' + c.code + ':')).length;
    return { classes: list };
  },
  async adminClassAdd(a) {
    await admin(a);
    const code = normCode(a.code);
    if (code.length < 4 || code.length > 12) throw new Fail('BAD_CODE');
    if (await findClass(code)) throw new Fail('CODE_TAKEN', 409);
    const x = await extraClasses();
    if (Object.keys(x).length >= 20) throw new Fail('LIMIT', 429);
    const ws = /^\d{4}-\d{2}-\d{2}$/.test(String(a.weekStart || '')) ? a.weekStart : '';
    x[code] = { name: clip(a.name, 80).trim() || code, weekStart: ws };
    await db.set('classes', x);
    return HANDLERS.adminClasses(a);
  },
  async adminClassDrop(a) {
    await admin(a);
    const code = normCode(a.code), x = await extraClasses();
    if (!x[code]) throw new Fail('NO_CLASS', 404);
    if ((await db.keys('st:' + code + ':')).length) throw new Fail('NOT_EMPTY', 409);
    delete x[code];
    await db.set('classes', x);
    return HANDLERS.adminClasses(a);
  },
  async adminMove(a) {
    await admin(a);
    const from = await adminClass(a), to = await findClass(a.to);
    if (!to) throw new Fail('NO_CLASS', 404);
    const s = await db.get('st:' + from.code + ':' + clip(a.sid, 20));
    if (!s) throw new Fail('NO_STUDENT', 404);
    if (to.code === from.code) return { ok: true };
    await moveStudent(s, from, to);
    return { ok: true };
  },
  async adminSet(a) {
    await admin(a);
    const code = normCode(a.code);
    if (code && (code.length < 4 || code.length > 12)) throw new Fail('BAD_CODE');
    if (code && (await extraClasses())[code]) throw new Fail('CODE_TAKEN', 409);
    const ws = /^\d{4}-\d{2}-\d{2}$/.test(String(a.weekStart || '')) ? a.weekStart : '';
    await db.set('cfg', { name: clip(a.name, 80).trim() || 'Lordship DTS', code, weekStart: ws });
    return { cfg: await cfg() };
  },
  /* --- the class roster and the game (projector) --- */
  async adminRoster(a) {
    await admin(a);
    const c = await adminClass(a);
    if (!c.code) return { students: [] };
    const st = await allStudents(c);
    return { students: await Promise.all(st.map(async x => ({ id: x.id, name: x.name, at: x.at, seen: x.seen || 0, fact: !!x.fact, saved: ((await db.get('sd:' + x.id)) || {}).at || 0 }))) };
  },
  async adminStudent(a) {
    await admin(a);
    const c = await adminClass(a);
    const s = await db.get('st:' + c.code + ':' + clip(a.sid, 20));
    if (!s) throw new Fail('NO_STUDENT', 404);
    if (a.remove) {
      await db.del('st:' + c.code + ':' + s.id); await db.del('stn:' + c.code + ':' + nameKey(s.name)); await db.del('sd:' + s.id);
      return { ok: true };
    }
    if (!/^\d{4}$/.test(String(a.pin || ''))) throw new Fail('BAD_PIN');
    s.salt = rnd(16); s.pin = pinHash(a.pin, s.salt);
    await db.set('st:' + c.code + ':' + s.id, s);
    return { ok: true };
  },
  async gameScreen(a) {
    await admin(a);
    const c = await adminClass(a);
    if (!c.code) throw new Fail('NO_CLASS', 403);
    const g = (await db.get('game:' + c.code)) || { phase: 'off' };
    const st = await allStudents(c);
    const out = { phase: g.phase, reveal: !!g.reveal, code: c.code, names: st.map(x => x.name), facts: st.filter(x => x.fact).length, questions: (await db.keys('q:')).length };
    if (g.phase === 'quiz') {
      const byId = Object.fromEntries(st.map(x => [x.id, x.name]));
      const list = [];
      for (const k of await db.keys('qz:' + c.code + ':')) { const r = await db.get(k); const sid = k.split(':').pop(); if (r && byId[sid]) list.push({ name: byId[sid], p: r.p, at: r.at }); }
      out.profiles = list.sort((x, y) => x.at - y.at).map(({ name, p }) => ({ name, p }));
    }
    const r = g.rounds && g.rounds[g.rounds.length - 1];
    if (r && g.phase === 'q') {
      out.round = g.rounds.length - 1; out.kind = r.kind; out.q = r.kind === 'poll' ? r.q : r.fact; out.opts = r.kind === 'poll' ? r.opts : null;
      out.answered = (await db.keys(`gv:${c.code}:${out.round}:`)).length;
      if (g.reveal) Object.assign(out, await tally(c, g, out.round));
    }
    if (g.phase === 'end' || (g.phase === 'q' && g.reveal)) out.top = (await board(c, g)).slice(0, 5);
    out.more = !!nextRound(g.rounds ? g : Object.assign({}, g, { rounds: [] }), st.filter(x => x.fact).map(x => ({ sid: x.id, text: x.fact })));
    return out;
  },
  async gameAdmin(a) {
    await admin(a);
    const c = await adminClass(a);
    if (!c.code) throw new Fail('NO_CLASS', 403);
    const k = 'game:' + c.code;
    let g = (await db.get(k)) || { phase: 'off' };
    if (a.action === 'quiz') {
      if (!(g.phase === 'quiz')) for (const qk of await db.keys('qz:' + c.code + ':')) await db.del(qk);
      g = Object.assign({}, g, { phase: 'quiz', reveal: false });
    } else if (a.action === 'lobby') {
      for (const vk of await db.keys('gv:' + c.code + ':')) await db.del(vk);
      g = { phase: 'lobby', rounds: [], reveal: false };
    } else if (a.action === 'next') {
      if (!g.rounds) g.rounds = [];
      const facts = (await allStudents(c)).filter(x => x.fact).map(x => ({ sid: x.id, text: x.fact }));
      const r = nextRound(g, facts);
      if (r) { g.rounds.push(r); g.phase = 'q'; g.reveal = false; } else g.phase = 'end';
    } else if (a.action === 'reveal') { if (g.phase === 'q') g.reveal = true; }
    else if (a.action === 'end') g.phase = 'end';
    else if (a.action === 'off') g = { phase: 'off' };
    else throw new Fail('BAD_ACTION');
    await db.set(k, g);
    return { ok: true, phase: g.phase };
  },

  async adminQuestions(a) {
    await admin(a);
    const out = [];
    for (const k of await db.keys('q:')) { const q = await db.get(k); if (q) out.push(q); }
    out.sort((x, y) => (y.day || '').localeCompare(x.day || '') || x.id.localeCompare(y.id));
    return { questions: out };
  },
  async adminMark(a) {
    await admin(a);
    const q = await db.get('q:' + clip(a.id, 20));
    if (!q) throw new Fail('NO_QUESTION', 404);
    if (a.drop) { await db.del('q:' + q.id); return { ok: true }; }
    if (!STATUSES.includes(a.status)) throw new Fail('BAD_STATUS');
    q.status = a.status;
    await db.set('q:' + q.id, q);
    return { ok: true };
  },
  async slideBegin(a) {
    await admin(a);
    const d = day(a.day), k = kind(a.kind);
    const size = parseInt(a.size, 10);
    const type = clip(a.type, 120) || (k === 'pdf' ? 'application/pdf' : 'application/octet-stream');
    if (!(size > 0 && size <= MAX_FILE)) throw new Fail('TOO_BIG', 413);
    if (!KINDS[k].test(type)) throw new Fail('BAD_TYPE');
    const s = (await db.get('slide:' + d)) || {};
    const old = s[k];
    s[k] = { name: clip(a.name, 120) || (d + '.' + k), size, type, parts: Math.ceil(size / PART), v: rnd(8), done: false, got: 0 };
    await db.set('slide:' + d, s);
    await dropFile(d, k, old);
    return { v: s[k].v, parts: s[k].parts, partSize: PART };
  },
  async slidePut(a) {
    await admin(a);
    const d = day(a.day), k = kind(a.kind);
    const s = await db.get('slide:' + d);
    const meta = s && s[k];
    const i = parseInt(a.i, 10);
    if (!meta || meta.v !== a.v || !(i >= 0 && i < meta.parts)) throw new Fail('NO_UPLOAD', 409);
    const data = String(a.d || '');
    if (!/^[A-Za-z0-9+/=]+$/.test(data) || data.length > Math.ceil(PART / 3) * 4 + 8) throw new Fail('BAD_PART');
    await db.set(`sp:${d}:${k}:${meta.v}:${i}`, { d: data });
    meta.got = Math.max(meta.got || 0, i + 1);
    if (meta.got === meta.parts) meta.done = true;
    await db.set('slide:' + d, s);
    return { ok: true, done: meta.done };
  },
  async slideLink(a) {
    await admin(a);
    const d = day(a.day);
    const url = clip(a.url, 500).trim();
    if (url && !/^https:\/\/[^\s"'<>]+$/.test(url)) throw new Fail('BAD_URL');
    const s = (await db.get('slide:' + d)) || {};
    s.link = url;
    await db.set('slide:' + d, s);
    return { slides: await allSlides() };
  },
  async slideDrop(a) {
    await admin(a);
    const d = day(a.day), k = kind(a.kind);
    const s = (await db.get('slide:' + d)) || {};
    await dropFile(d, k, s[k]);
    delete s[k];
    await db.set('slide:' + d, s);
    return { slides: await allSlides() };
  }
};

/* Results of a round: counts per option (polls) or per name, and for "who" the right answer. */
async function tally(c, g, round) {
  const r = g.rounds[round];
  const counts = {};
  for (const k of await db.keys(`gv:${c.code}:${round}:`)) { const v = await db.get(k); counts[v] = (counts[v] || 0) + 1; }
  if (r.kind === 'poll') return { counts: r.opts.map((_, i) => counts[i] || 0) };
  const who = await db.get('st:' + c.code + ':' + r.sid);
  return { counts, answer: { id: r.sid, name: who ? who.name : '?' }, right: counts[r.sid] || 0 };
}
/* Points: one for each "who wrote this?" guessed right (only revealed rounds count). */
async function board(c, g) {
  const st = await allStudents(c);
  const score = {};
  for (let i = 0; i < (g.rounds || []).length; i++) {
    const r = g.rounds[i];
    if (r.kind !== 'who' || (i === g.rounds.length - 1 && !g.reveal && g.phase !== 'end')) continue;
    for (const k of await db.keys(`gv:${c.code}:${i}:`)) { if ((await db.get(k)) === r.sid) { const sid = k.split(':').pop(); score[sid] = (score[sid] || 0) + 1; } }
  }
  return st.map(x => ({ id: x.id, name: x.name, score: score[x.id] || 0 })).filter(x => x.score > 0).sort((x, y) => y.score - x.score);
}

export { LIFE_AREA_IDS, POLLS };

/* ---------------- the endpoint ---------------- */
const json = (o, status) => new Response(JSON.stringify(o), { status: status || 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
export default async function (req) {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  let body;
  try { body = await req.json(); } catch (e) { return json({ error: 'BAD_JSON' }, 400); }
  const fn = body && typeof body.fn === 'string' && Object.prototype.hasOwnProperty.call(HANDLERS, body.fn) && HANDLERS[body.fn];
  if (!fn) return json({ error: 'NO_FN' }, 404);
  try { return json(await fn(body.args || {})); }
  catch (e) {
    if (e instanceof Fail) return json({ error: e.code }, e.status);
    console.error(body.fn, e);
    return json({ error: 'SERVER' }, 500);
  }
}

/*  Brand From the Heart — the backend. One POST endpoint: {fn, args} → HANDLERS[fn].

    No logins. A student is a random id plus a secret key, kept on their phone and
    in their personal link (#me=<id>.<key>); only a hash of the key is stored.
    A teacher makes a class (BFH_TEACHER_PASSWORD) and gets a class code for
    students and a private teacher key for the dashboard.

    Storage (Netlify Blobs, store "bfh"):
      s:<sid>             a student: key hash, class, and their whole brand work (data)
      sum:<sid>           what the teacher and classmates may see: name, stage, progress,
                          last active, shared directions, finished brief
      c:<code>            a class: name, teacher key hash
      cs:<code>:<sid>     membership (one key each, so 25 students joining at once never clash)
      v:<target>:<voter>  a classmate's vote for one of the target's shared directions
      cm:<target>:<cid>   an encouraging comment (the teacher can hide it)
      logo:<code>:<brand> a logo screenshot the teacher uploaded for the Inspiration gallery
      job:<jid>           a Claude job: who, what, status, result
      n:<day>, nc:<code>:<day>, ns:<sid>:<day>   job counters (daily caps)

    Who sees what: a student's answers and drafts are theirs alone. Classmates see only
    the directions a student chose to share (name, colours, fonts, a tagline). Votes and
    comments are seen by the student they're for and by the teacher; a voter sees their own.
*/
import { getStore } from '@netlify/blobs';
import crypto from 'node:crypto';

/* ---------------- storage ---------------- */
function store() { return globalThis.__bfhStore || getStore({ name: 'bfh', consistency: 'strong' }); }
export const db = {
  get: (k) => store().get(k, { type: 'json' }),
  set: (k, v) => store().setJSON(k, v),
  del: (k) => store().delete(k),
  async keys(prefix) {
    const r = await store().list({ prefix });
    return (r.blobs || []).map(b => b.key);
  }
};

/* ---------------- small helpers ---------------- */
const rnd = (n, abc) => { abc = abc || 'abcdefghijkmnpqrstuvwxyz23456789'; const b = crypto.randomBytes(n); let s = ''; for (let i = 0; i < n; i++) s += abc[b[i] % abc.length]; return s; };
const hash = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const clip = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, n);
const HEX = /^#[0-9A-Fa-f]{6}$/;
const today = () => new Date().toISOString().slice(0, 10);
const STAGES = ['start', 'interview', 'heart', 'directions', 'refine', 'finished'];
export class Fail extends Error { constructor(code, status) { super(code); this.code = code; this.status = status || 400; } }

/* A student can be signed in on several phones: one key per phone, only hashes kept. */
export function keyOk(s, key) {
  const h = hash(String(key || ''));
  return !!s && ((s.kh && same(s.kh, h)) || (Array.isArray(s.khs) && s.khs.some(x => same(x, h))));
}
async function student(a) {
  const id = clip(a && a.id, 20), key = String((a && a.key) || '');
  if (!/^[a-z0-9]{12}$/.test(id) || !key) throw new Fail('NO_STUDENT', 401);
  const s = await db.get('s:' + id);
  if (!s || !keyOk(s, key)) throw new Fail('NO_STUDENT', 401);
  return s;
}
async function teacherClass(a) {
  const code = clip(a && a.code, 8).toUpperCase();
  const c = code && await db.get('c:' + code);
  if (!c || !same(c.th, hash(String((a && a.tkey) || '')))) throw new Fail('NO_TEACHER', 401);
  return c;
}
async function members(code) {
  const ks = await db.keys('cs:' + code + ':');
  return ks.map(k => k.split(':')[2]).filter(Boolean);
}
function cleanShare(dirs) {
  return (Array.isArray(dirs) ? dirs : []).slice(0, 2).map(d => {
    d = d || {};
    const c = {};
    for (const k of ['primary', 'secondary', 'accent', 'background', 'text']) c[k] = HEX.test(d.colors && d.colors[k]) ? d.colors[k] : '#888888';
    const bi = (x) => ({ en: clip(x && x.en, 200), km: clip(x && x.km, 300) });
    return { key: clip(d.key, 40), name: bi(d.name), personality: bi(d.personality), tagline: bi(d.tagline), fontId: clip(d.fontId, 60), colors: c, tune: cleanTune(d.tune) };
  });
}
function cleanTune(t) {
  const o = {};
  for (const k of ['warm', 'bold', 'modern', 'playful']) { const v = Number(t && t[k]); o[k] = Number.isFinite(v) ? Math.max(-100, Math.min(100, Math.round(v))) : 0; }
  return o;
}
function cleanBrief(b) {
  if (!b || typeof b !== 'object') return null;
  const s = JSON.stringify(b);
  if (s.length > 60000) return null;
  return JSON.parse(s);   // plain data only; the teacher page escapes every string it shows
}
function summaryOut(sum) {
  return { id: sum.id, name: sum.name, stage: sum.stage, prog: sum.prog, updated: sum.updated, created: sum.created, lastErr: sum.lastErr || null, arch: sum.arch || null };
}

/* ---------------- daily caps on Claude jobs ---------------- */
const CAP_STUDENT = () => Number(process.env.BFH_STUDENT_DAILY) || 40;
const CAP_CLASS = () => Number(process.env.BFH_CLASS_DAILY) || 900;
const CAP_ALL = () => Number(process.env.BFH_DAILY_LIMIT) || 3000;
async function bump(k) { const n = ((await db.get(k)) || 0) + 1; await db.set(k, n); return n; }

/* ---------------- the handlers ---------------- */
export const HANDLERS = {
  /* --- classes --- */
  async classCreate(a) {
    const pw = process.env.BFH_TEACHER_PASSWORD;
    if (!pw) throw new Fail('NO_TEACHER_PASSWORD', 403);
    if (!same(hash(clip(a.password, 200)), hash(pw))) throw new Fail('BAD_PASSWORD', 403);
    const name = clip(a.name, 60).trim() || 'My class';
    let code;
    for (let i = 0; i < 10; i++) { code = rnd(6, 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'); if (!(await db.get('c:' + code))) break; }
    const tkey = rnd(24);
    await db.set('c:' + code, { code, name, th: hash(tkey), created: Date.now() });
    return { code, tkey, name };
  },
  async classInfo(a) {
    const c = await db.get('c:' + clip(a.code, 8).toUpperCase());
    if (!c) throw new Fail('NO_CLASS', 404);
    return { code: c.code, name: c.name };
  },

  /* --- the classroom link: who's in this class, and signing back in by tapping your name ---
     Uriah (Nov 2026): keep security to a minimum, students forget passwords. So a returning
     student opens the class link and taps their name; that phone gets its own key. */
  async classRoster(a) {
    const c = await db.get('c:' + clip(a.code, 8).toUpperCase());
    if (!c) throw new Fail('NO_CLASS', 404);
    const out = [];
    await Promise.all((await members(c.code)).map(async id => {
      const sum = await db.get('sum:' + id);
      if (sum && sum.name) out.push({ id, name: sum.name, prog: sum.prog || 0, updated: sum.updated || 0 });
    }));
    out.sort((x, y) => x.name.localeCompare(y.name));
    return { code: c.code, name: c.name, students: out };
  },
  async signIn(a) {
    const code = clip(a.code, 8).toUpperCase(), sid = clip(a.sid, 20);
    const c = await db.get('c:' + code);
    if (!c || !(await db.get('cs:' + code + ':' + sid))) throw new Fail('NO_STUDENT', 404);
    const s = await db.get('s:' + sid);
    if (!s || s.cls !== code) throw new Fail('NO_STUDENT', 404);
    const key = rnd(24);
    s.khs = (Array.isArray(s.khs) ? s.khs : []).concat(hash(key)).slice(-10);
    await db.set('s:' + sid, s);
    return { id: sid, key, cls: code, className: c.name };
  },

  /* --- a student --- */
  async start(a) {
    const id = rnd(12), key = rnd(24), now = Date.now();
    let cls = null;
    if (a.code) { const c = await db.get('c:' + clip(a.code, 8).toUpperCase()); if (!c) throw new Fail('NO_CLASS', 404); cls = c.code; }
    const name = clip(a.name, 60).trim();
    await db.set('s:' + id, { id, kh: hash(key), cls, created: now, data: null });
    await db.set('sum:' + id, { id, name, stage: 'start', prog: 0, updated: now, created: now, cls, share: null, brief: null });
    if (cls) await db.set('cs:' + cls + ':' + id, 1);
    return { id, key, cls };
  },
  async load(a) {
    const s = await student(a);
    const sum = (await db.get('sum:' + s.id)) || {};
    const c = s.cls ? await db.get('c:' + s.cls) : null;
    return { data: s.data, cls: s.cls, className: c ? c.name : null, job: s.job || null, feedback: await feedbackFor(s.id) };
  },
  async save(a) {
    const s = await student(a);
    const raw = JSON.stringify(a.data || null);
    if (raw.length > 450000) throw new Fail('TOO_BIG', 413);
    s.data = JSON.parse(raw);
    await db.set('s:' + s.id, s);
    const sum = (await db.get('sum:' + s.id)) || { id: s.id, created: s.created };
    sum.name = clip(a.name, 60).trim() || sum.name || '';
    if (STAGES.includes(a.stage)) sum.stage = a.stage;
    const top = s.data && s.data.quiz && s.data.quiz.result && s.data.quiz.result.top;
    sum.arch = ['bold', 'simple', 'warm', 'explorer', 'sage', 'faith', 'playful'].includes(top) ? top : null;
    const p = Number(a.prog); if (Number.isFinite(p)) sum.prog = Math.max(0, Math.min(100, Math.round(p)));
    if (a.brief !== undefined) sum.brief = cleanBrief(a.brief);
    sum.updated = Date.now(); sum.cls = s.cls;
    await db.set('sum:' + s.id, sum);
    return { ok: true, updated: sum.updated };
  },
  async join(a) {
    const s = await student(a);
    const c = await db.get('c:' + clip(a.code, 8).toUpperCase());
    if (!c) throw new Fail('NO_CLASS', 404);
    if (s.cls && s.cls !== c.code) await db.del('cs:' + s.cls + ':' + s.id);
    s.cls = c.code; await db.set('s:' + s.id, s);
    const sum = (await db.get('sum:' + s.id)) || { id: s.id };
    sum.cls = c.code; await db.set('sum:' + s.id, sum);
    await db.set('cs:' + c.code + ':' + s.id, 1);
    return { cls: c.code, className: c.name };
  },

  /* --- peer feedback --- */
  async share(a) {
    const s = await student(a);
    const sum = (await db.get('sum:' + s.id)) || { id: s.id };
    sum.share = a.on ? { dirs: cleanShare(a.dirs), at: Date.now() } : null;
    if (a.name) sum.name = clip(a.name, 60).trim();
    await db.set('sum:' + s.id, sum);
    return { ok: true, share: sum.share };
  },
  async gallery(a) {
    const s = await student(a);
    if (!s.cls) throw new Fail('NO_CLASS', 404);
    const ids = (await members(s.cls)).filter(id => id !== s.id);
    const out = [];
    await Promise.all(ids.map(async id => {
      const sum = await db.get('sum:' + id);
      if (!sum || !sum.share || !sum.share.dirs || !sum.share.dirs.length) return;
      const mine = await db.get('v:' + id + ':' + s.id);
      const myComments = [];
      for (const k of await db.keys('cm:' + id + ':')) { const c = await db.get(k); if (c && c.by === s.id) myComments.push({ id: c.id, text: c.text, at: c.at, hidden: !!c.hidden }); }
      out.push({ id, name: sum.name || '?', dirs: sum.share.dirs, myVote: mine ? mine.dir : null, myComments, at: sum.share.at });
    }));
    out.sort((x, y) => (y.at || 0) - (x.at || 0));
    return { people: out };
  },
  async vote(a) {
    const s = await student(a);
    const t = await db.get('sum:' + clip(a.target, 20));
    if (!t || t.id === s.id || !s.cls || t.cls !== s.cls || !t.share) throw new Fail('NO_TARGET', 404);
    const dir = Number(a.dir);
    if (a.dir === null || a.dir === undefined) { await db.del('v:' + t.id + ':' + s.id); return { ok: true, myVote: null }; }
    if (!Number.isInteger(dir) || dir < 0 || dir >= t.share.dirs.length) throw new Fail('BAD_DIR');
    await db.set('v:' + t.id + ':' + s.id, { dir, key: t.share.dirs[dir].key, at: Date.now() });
    return { ok: true, myVote: dir };
  },
  async comment(a) {
    const s = await student(a);
    const t = await db.get('sum:' + clip(a.target, 20));
    if (!t || t.id === s.id || !s.cls || t.cls !== s.cls || !t.share) throw new Fail('NO_TARGET', 404);
    const text = clip(a.text, 160).trim();
    if (!text) throw new Fail('EMPTY');
    const mine = [];
    for (const k of await db.keys('cm:' + t.id + ':')) { const c = await db.get(k); if (c && c.by === s.id) mine.push(c); }
    if (mine.length >= 3) throw new Fail('ENOUGH_COMMENTS');
    const me = (await db.get('sum:' + s.id)) || {};
    const cid = Date.now().toString(36) + rnd(4);
    await db.set('cm:' + t.id + ':' + cid, { id: cid, by: s.id, name: clip(me.name, 60) || '?', text, at: Date.now(), hidden: false });
    return { ok: true, id: cid };
  },
  async uncomment(a) {
    const s = await student(a);
    const k = 'cm:' + clip(a.target, 20) + ':' + clip(a.cid, 30);
    const c = await db.get(k);
    if (!c || c.by !== s.id) throw new Fail('NO_COMMENT', 404);
    await db.del(k);
    return { ok: true };
  },

  /* --- Claude jobs (the work itself runs in generate-background.js) --- */
  async genStart(a) {
    const s = await student(a);
    const KINDS = ['heart', 'directions', 'more', 'refine', 'package', 'plan', 'check', 'tidy'];
    if (!KINDS.includes(a.kind)) throw new Fail('BAD_KIND');
    if (!s.cls) throw new Fail('NEED_CLASS', 403);
    if (!process.env.ANTHROPIC_API_KEY && !globalThis.__bfhClaude) throw new Fail('NO_KEY', 503);
    if (s.job) {
      const j = await db.get('job:' + s.job);
      if (j && (j.status === 'queued' || j.status === 'running') && Date.now() - j.at < 16 * 60000) throw new Fail('BUSY', 409);
    }
    const d = today();
    if (await bump('ns:' + s.id + ':' + d) > CAP_STUDENT()) throw new Fail('LIMIT_STUDENT', 429);
    if (await bump('nc:' + s.cls + ':' + d) > CAP_CLASS()) throw new Fail('LIMIT_CLASS', 429);
    if (await bump('n:' + d) > CAP_ALL()) throw new Fail('LIMIT_ALL', 429);
    if (a.data !== undefined) {
      const raw = JSON.stringify(a.data);
      if (raw.length > 450000) throw new Fail('TOO_BIG', 413);
      s.data = JSON.parse(raw);
    }
    const jid = rnd(16);
    const raw = a.opts && typeof a.opts === 'object' ? Object.assign({}, a.opts) : {};
    let image = null;
    if (a.kind === 'check') {   // a post or poster to check against the brand: kept apart from the job record
      image = String(raw.image || '');
      if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image) || image.length > 2400000) throw new Fail('BAD_IMAGE');
      delete raw.image;
    }
    if (a.kind === 'tidy' && !String(raw.text || '').trim()) throw new Fail('EMPTY');
    const ojs = JSON.stringify(raw);
    if (ojs.length > 60000) throw new Fail('TOO_BIG', 413);
    const opts = JSON.parse(ojs);
    if (image) await db.set('img:' + jid, { data: image });
    await db.set('job:' + jid, { id: jid, sid: s.id, kind: a.kind, opts, status: 'queued', at: Date.now() });
    s.job = jid;
    await db.set('s:' + s.id, s);
    return { job: jid };
  },
  async job(a) {
    const s = await student(a);
    const j = await db.get('job:' + clip(a.job, 20));
    if (!j || j.sid !== s.id) throw new Fail('NO_JOB', 404);
    if ((j.status === 'queued' || j.status === 'running') && Date.now() - j.at > 16 * 60000) j.status = 'error', j.error = 'TIMEOUT';
    return { status: j.status, kind: j.kind, opts: j.opts, result: j.result || null, partial: j.partial || null, error: j.error || null };
  },

  /* --- the teacher --- */
  async teacher(a) {
    const c = await teacherClass(a);
    const ids = await members(c.code);
    const students = [], comments = [];
    await Promise.all(ids.map(async id => {
      const sum = await db.get('sum:' + id);
      if (!sum) return;
      const votes = {};
      for (const k of await db.keys('v:' + id + ':')) { const v = await db.get(k); if (v) votes[v.dir] = (votes[v.dir] || 0) + 1; }
      for (const k of await db.keys('cm:' + id + ':')) { const cm = await db.get(k); if (cm) comments.push(Object.assign({ target: id, targetName: sum.name }, cm)); }
      students.push(Object.assign(summaryOut(sum), { share: sum.share || null, votes, brief: sum.brief || null }));
    }));
    students.sort((x, y) => String(x.name).localeCompare(String(y.name)));
    comments.sort((x, y) => y.at - x.at);
    return { code: c.code, name: c.name, students, comments, now: Date.now() };
  },
  async teacherHide(a) {
    const c = await teacherClass(a);
    const target = clip(a.target, 20);
    const t = await db.get('sum:' + target);
    if (!t || t.cls !== c.code) throw new Fail('NO_TARGET', 404);
    const k = 'cm:' + target + ':' + clip(a.cid, 30);
    const cm = await db.get(k);
    if (!cm) throw new Fail('NO_COMMENT', 404);
    cm.hidden = !!a.hidden; await db.set(k, cm);
    return { ok: true };
  },
  async teacherRemove(a) {
    const c = await teacherClass(a);
    const sid = clip(a.sid, 20);
    await db.del('cs:' + c.code + ':' + sid);
    const s = await db.get('s:' + sid);
    if (s && s.cls === c.code) { s.cls = null; await db.set('s:' + sid, s); const sum = await db.get('sum:' + sid); if (sum) { sum.cls = null; await db.set('sum:' + sid, sum); } }
    return { ok: true };
  },
  async teacherLogo(a) {
    const c = await teacherClass(a);
    const brand = clip(a.brand, 40);
    if (!/^[a-z0-9-]+$/.test(brand)) throw new Fail('BAD_BRAND');
    if (a.data === null) { await db.del('logo:' + c.code + ':' + brand); return { ok: true }; }
    const d = String(a.data || '');
    if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(d) || d.length > 400000) throw new Fail('BAD_IMAGE');
    await db.set('logo:' + c.code + ':' + brand, { data: d, at: Date.now() });
    return { ok: true };
  },
  async logos(a) {
    const code = clip(a.code, 8).toUpperCase();
    if (!code || !(await db.get('c:' + code))) return { logos: {} };
    const out = {};
    for (const k of await db.keys('logo:' + code + ':')) { const l = await db.get(k); if (l) out[k.split(':')[2]] = l.data; }
    return { logos: out };
  }
};

async function feedbackFor(sid) {
  const votes = {}, comments = [];
  for (const k of await db.keys('v:' + sid + ':')) { const v = await db.get(k); if (v) votes[v.dir] = (votes[v.dir] || 0) + 1; }
  for (const k of await db.keys('cm:' + sid + ':')) { const c = await db.get(k); if (c && !c.hidden) comments.push({ id: c.id, name: c.name, text: c.text, at: c.at }); }
  comments.sort((x, y) => y.at - x.at);
  const sum = await db.get('sum:' + sid);
  return { votes, comments, share: sum && sum.share || null };
}
HANDLERS.feedback = async (a) => { const s = await student(a); return feedbackFor(s.id); };

/* ---------------- the endpoint ---------------- */
const json = (o, status) => new Response(JSON.stringify(o), { status: status || 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
export default async function (req) {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  let body;
  try { body = await req.json(); } catch (e) { return json({ error: 'BAD_JSON' }, 400); }
  const fn = body && HANDLERS[body.fn];
  if (!fn || !Object.prototype.hasOwnProperty.call(HANDLERS, body.fn)) return json({ error: 'NO_FN' }, 404);
  try { return json(await fn(body.args || {})); }
  catch (e) {
    if (e instanceof Fail) return json({ error: e.code }, e.status);
    console.error(body.fn, e);
    return json({ error: 'SERVER' }, 500);
  }
}

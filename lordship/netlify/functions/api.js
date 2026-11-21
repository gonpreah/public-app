/*  Lordship — the backend. One POST endpoint: {fn, args} → HANDLERS[fn](args).

    Blobs store "lordship":
      cfg                     the class: {name, code, weekStart}  (code falls back to LS_CLASS_CODE)
      slide:<day>             a day's slides: {pdf:{name,size,type,parts,v}, pptx:{…}, link}
      sp:<day>:<kind>:<v>:<i> one part of an uploaded file (base64, ≤ 3 MB of file each)
      q:<id>                  an anonymous question: {id, text, topic, day, status} — no name, no device, no IP
      job:<id>                a coaching turn waiting for Claude (deleted once read; the chat itself lives on the phone)
      bk:<code>               a cloud backup a student asked for: their own saved answers, found only by its code (180 days)
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
async function classOk(a) {
  const c = await cfg();
  const code = normCode(a.code);
  if (!c.code || !code || !same(code, c.code)) throw new Fail('NO_CLASS', 403);
  return c;
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
  async classCheck(a) { const c = await classOk(a); return { ok: true, name: c.name, weekStart: c.weekStart }; },
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
    const c = await cfg();
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
  async adminLogin(a) { await admin(a); return { cfg: await cfg(), slides: await allSlides(), hasKey: !!process.env.ANTHROPIC_API_KEY }; },
  async adminSet(a) {
    await admin(a);
    const code = normCode(a.code);
    if (code && (code.length < 4 || code.length > 12)) throw new Fail('BAD_CODE');
    const ws = /^\d{4}-\d{2}-\d{2}$/.test(String(a.weekStart || '')) ? a.weekStart : '';
    await db.set('cfg', { name: clip(a.name, 80).trim() || 'Lordship DTS', code, weekStart: ws });
    return { cfg: await cfg() };
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

export { LIFE_AREA_IDS };

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

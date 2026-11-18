/*  Claude jobs, in the background (Netlify gives a "-background" function up to
    15 minutes; a normal one only 26 seconds — too short for five rich, bilingual
    brand directions). api.js genStart checks the student, the class and the daily
    caps and writes job:<jid> as "queued"; the page then posts {id, key, job} here
    and asks api.js job() every 2 seconds until it is "done" or "error". */
import { db, keyOk } from './api.js';
import { runJob } from './lib/prompts.js';
import { callClaude } from './lib/claude.js';

export async function work(body) {
  const jid = String((body && body.job) || '').slice(0, 20);
  const j = jid && await db.get('job:' + jid);
  if (!j || j.status !== 'queued' || j.sid !== String(body.id || '')) return 'skip';
  const s = await db.get('s:' + j.sid);
  if (!s || !keyOk(s, body.key)) return 'skip';
  j.status = 'running'; j.at = Date.now();
  await db.set('job:' + jid, j);
  try {
    const opts = Object.assign({}, j.opts || {});
    if (j.kind === 'check') { const img = await db.get('img:' + jid); opts.image = img && img.data; }
    const result = await runJob(j.kind, s.data || {}, opts, callClaude, async (partial) => {
      const cur = (await db.get('job:' + jid)) || j;
      if (cur.status === 'running') { cur.partial = partial; await db.set('job:' + jid, cur); }
    });
    const cur = (await db.get('job:' + jid)) || j;
    cur.status = 'done'; cur.result = result; cur.partial = null; cur.done = Date.now();
    await db.set('job:' + jid, cur);
    if (j.kind === 'check') await db.del('img:' + jid);
  } catch (e) {
    const msg = String((e && e.message) || e);
    const code = ['NO_KEY', 'REFUSED', 'TOO_LONG', 'BAD_JSON'].includes(msg) ? msg
      : (e && e.status === 429) ? 'BUSY_CLAUDE' : (e && e.status === 401) ? 'BAD_KEY' : (e && e.status >= 500) ? 'CLAUDE_DOWN' : 'FAILED';
    console.error('job', jid, j.kind, msg);
    const cur = (await db.get('job:' + jid)) || j;
    cur.status = 'error'; cur.error = code;
    await db.set('job:' + jid, cur);
    const sum = await db.get('sum:' + j.sid);
    if (sum) { sum.lastErr = { code, kind: j.kind, at: Date.now() }; await db.set('sum:' + j.sid, sum); }
  }
  return 'ran';
}

export default async function (req) {
  let body = {};
  try { body = await req.json(); } catch (e) { return new Response('bad', { status: 400 }); }
  await work(body);
  return new Response('ok', { status: 202 });
}

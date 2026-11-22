/*  A coaching turn, in the background (a "-background" function may run up to 15 minutes;
    a normal one only 10–26 seconds). api.js coachStart checks the class code or church mode
    and the daily caps and writes job:<id> as "queued"; the page posts {job} here and asks
    api.js coachJob every 1.5 seconds. The chat is wiped from the job once answered. */
import { db } from './api.js';
import { callClaude } from './lib/claude.js';
import { BASE, CHURCH, TOOLS, DISTILL } from './lib/prompts.js';

export function buildRequest(j) {
  const tool = TOOLS[j.tool];
  let system = BASE + (j.church ? CHURCH : '') + '\n\n' + tool.say;
  const ctx = j.context ? `<context>\n${j.context}\n</context>\n\n` : '';
  if (j.distill) {
    const transcript = j.messages.map(m => (m.role === 'user' ? 'Student: ' : 'Coach: ') + m.content).join('\n\n');
    return { system: system + '\n\n' + DISTILL, messages: [{ role: 'user', content: `${ctx}<conversation>\n${transcript}\n</conversation>` }], schema: tool.distill };
  }
  const messages = [{ role: 'user', content: ctx + 'Please start: reflect briefly on what I shared (if anything) and ask your first question.' }]
    .concat(j.messages);
  if (messages[messages.length - 1].role !== 'user') messages.push({ role: 'user', content: '(Ask your next question.)' });
  return { system, messages, schema: null };
}

export async function work(body) {
  const id = String((body && body.job) || '').slice(0, 20);
  const j = id && await db.get('job:' + id);
  if (!j || j.status !== 'queued') return 'skip';
  j.status = 'running'; j.at = Date.now();
  await db.set('job:' + id, j);
  const pending = { n: 0 };
  try {
    const r = buildRequest(j);
    let last = 0, writing = false;
    const onText = j.distill ? null : (soFar) => {   // show the reply growing: write what's there every ~0.6 s
      if (writing || Date.now() - last < 600) return;
      writing = true; last = Date.now(); pending.n++;
      db.get('job:' + id).then(cur => (cur && cur.status === 'running') ? db.set('job:' + id, Object.assign(cur, { partial: soFar })) : null)
        .catch(() => {}).finally(() => { writing = false; pending.n--; });
    };
    const result = await callClaude(r.system, r.messages, r.schema, { maxTokens: j.distill ? 3000 : 2000, onText });
    Object.assign(j, { status: 'done', result, partial: null, messages: null, context: null });
  } catch (e) {
    const msg = String((e && e.message) || e);
    const code = ['NO_KEY', 'REFUSED', 'TOO_LONG', 'BAD_JSON'].includes(msg) ? msg
      : (e && e.status === 429) ? 'BUSY' : (e && e.status === 401) ? 'BAD_KEY' : (e && e.status >= 500) ? 'CLAUDE_DOWN' : 'FAILED';
    console.error('coach', id, j.tool, msg);
    Object.assign(j, { status: 'error', error: code, partial: null, messages: null, context: null });
  }
  // a partial write still in flight must not land after the final answer
  for (let i = 0; i < 50 && pending.n; i++) await new Promise(r => setTimeout(r, 50));
  await db.set('job:' + id, j);
  return 'ran';
}

export default async function (req) {
  let body = {};
  try { body = await req.json(); } catch (e) { return new Response('bad', { status: 400 }); }
  await work(body);
  return new Response('ok', { status: 202 });
}

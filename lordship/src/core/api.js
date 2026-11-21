/* Talking to the server: one POST endpoint, plus the coach's background turns. */
export class ApiError extends Error { constructor(code, status) { super(code); this.code = code; this.status = status; } }

export async function api(fn, args) {
  let r;
  try {
    r = await fetch('/.netlify/functions/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fn, args: args || {} }) });
  } catch (e) { throw new ApiError('OFFLINE', 0); }
  let j = {};
  try { j = await r.json(); } catch (e) { /* not JSON */ }
  if (!r.ok || j.error) throw new ApiError(j.error || 'SERVER', r.status);
  return j;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* One coaching turn (or a distill): start the job, kick the background function, poll. */
export async function coach({ code, tool, messages, context, distill }) {
  const { job } = await api('coachStart', { code, tool, messages, context, distill: !!distill });
  fetch('/.netlify/functions/coach-background', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ job }) }).catch(() => {});
  const t0 = Date.now();
  await sleep(1200);
  while (Date.now() - t0 < 4 * 60000) {
    let r;
    try { r = await api('coachJob', { job }); } catch (e) { if (e.code === 'OFFLINE') { await sleep(2000); continue; } throw e; }
    if (r.status === 'done') return r.result;
    if (r.status === 'error') throw new ApiError(r.error || 'FAILED');
    await sleep(1500);
  }
  throw new ApiError('TIMEOUT');
}

export const ERR = {
  OFFLINE: 'You look offline. Check your connection and try again.',
  NO_CLASS: 'That class code didn’t work. Check it with Uriah or Naomi.',
  NO_KEY: 'The coach isn’t switched on yet (no Claude key on the server).',
  LIMIT: 'The coach has had a very busy day. Try again tomorrow.',
  BUSY: 'The coach is busy right now. Try again in a minute.',
  REFUSED: 'The coach couldn’t answer that one. Try putting it another way, or talk with a leader.',
  TIMEOUT: 'That took too long. Try again.',
  EMPTY: 'Write a little more first.',
  BAD_PASSWORD: 'Wrong password.',
  NO_ADMIN_PASSWORD: 'Set LS_ADMIN_PASSWORD in Netlify first.'
};
export const errText = (e) => ERR[e && e.code] || 'Something went wrong. Try again.';

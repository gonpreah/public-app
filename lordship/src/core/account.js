/* A student's account: name + 4-digit PIN. Signed in, everything the teaching keeps on the phone is also
   saved to the account (a few seconds after each change), so a new phone or the Home Screen app picks up
   where they left off. The anonymous question box and the class totals never send the account. */
import { api } from './api.js';
import { collect, restore } from './backup.js';

const ME = 'gp.lordship.me', AT = 'gp.lordship.__at';
export function getMe() { try { return JSON.parse(localStorage.getItem(ME) || 'null'); } catch (e) { return null; } }
export function setMe(m) { try { if (m) localStorage.setItem(ME, JSON.stringify(m)); else localStorage.removeItem(ME); } catch (e) { /* */ } window.dispatchEvent(new CustomEvent('gp-me')); }
const localAt = () => { try { return +localStorage.getItem(AT) || 0; } catch (e) { return 0; } };
const auth = (m) => ({ code: m.code, sid: m.sid, token: m.token });

let timer = null, status = 'idle';
export const syncStatus = () => status;
function setStatus(s) { status = s; window.dispatchEvent(new CustomEvent('gp-sync', { detail: s })); }

export async function pushNow() {
  const m = getMe(); if (!m) return;
  setStatus('saving');
  try { await api('syncSave', Object.assign(auth(m), { data: collect(), at: localAt() || Date.now() }), { keepalive: true }); setStatus('saved'); }
  catch (e) { setStatus(e.code === 'NO_STUDENT' ? 'signed-out' : 'offline'); if (e.code === 'NO_STUDENT') setMe(null); }
}
/* Watch every change to this teaching's data. */
window.addEventListener('gp-store', (e) => {
  const k = e.detail;
  if (!k || !/^lordship\./.test(k) || /^lordship\.(me|class|anon|__at|backupCode)$/.test(k)) return;
  try { localStorage.setItem(AT, String(Date.now())); } catch (x) { /* */ }
  if (!getMe()) return;
  clearTimeout(timer); timer = setTimeout(pushNow, 2500);
});
window.addEventListener('pagehide', () => { if (timer) { clearTimeout(timer); pushNow(); } });

/* After signing in: the newer copy wins — the account's or this phone's. */
async function settle(m) {
  try {
    const r = await api('syncLoad', auth(m));
    const mine = Object.keys(collect()).filter(k => !/^lordship\.(welcomed|slidesMeta)/.test(k)).length;
    if (r.data && (r.at > localAt() || !mine)) { restore(r.data); try { localStorage.setItem(AT, String(r.at)); } catch (e) { /* */ } setStatus('saved'); }
    else if (mine) await pushNow();
  } catch (e) { /* keep going offline */ }
}
export async function join(code, name, pin) { const r = await api('join', { code, name, pin }); const m = { code, sid: r.sid, token: r.token, name: r.name, fact: r.fact }; setMe(m); await settle(m); return m; }
export async function signIn(code, name, pin) {
  const r = await api('signIn', { code, name, pin });
  if (r.cls && r.cls.code !== code) { setClass(r.cls); code = r.cls.code; }   // they were moved to another class
  const m = { code, sid: r.sid, token: r.token, name: r.name, fact: r.fact }; setMe(m); await settle(m); return m;
}
/* The class this phone is on (App keeps it as 'gp.lordship.class'); moving tells App. */
export function setClass(c) {
  try { localStorage.setItem('gp.lordship.class', JSON.stringify({ code: c.code, name: c.name, weekStart: c.weekStart || '' })); } catch (e) { /* */ }
  window.dispatchEvent(new CustomEvent('gp-class'));
}
export async function moveClass(to) {
  const m = getMe(); if (!m) return null;
  const c = await api('moveClass', Object.assign(auth(m), { to }));
  setClass(c); setMe(Object.assign({}, m, { code: c.code }));
  return c;
}
export async function saveFact(fact) { const m = getMe(); if (!m) return; await api('setFact', Object.assign(auth(m), { fact })); setMe(Object.assign({}, m, { fact })); }
export function signOut() { pushNow(); setMe(null); }
export function authArgs() { const m = getMe(); return m ? auth(m) : {}; }

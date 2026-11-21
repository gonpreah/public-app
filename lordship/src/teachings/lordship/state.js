/* Where this teaching keeps things on the phone (all under "gp.lordship.*"). */
import { read, write, uid, todayStr } from '../../core/store.js';
import { api } from '../../core/api.js';

export const K = {
  wheel: 'lordship.wheel', list: 'lordship.list', hot: 'lordship.hot', mentors: 'lordship.mentors',
  scroll: 'lordship.scroll', decisions: 'lordship.decisions', growth: 'lordship.growth',
  habits: 'lordship.habits', commit: 'lordship.commit', days: 'lordship.daysDone', wheelHist: 'lordship.wheelHistory',
  share: 'lordship.shareTotals', anon: 'lordship.anon', notes: (d) => 'lordship.notes.' + d,
  chat: (t, x) => 'lordship.chat.' + t + (x ? '.' + x : '')
};

export function addToList(item) {
  const list = read(K.list, []);
  const it = Object.assign({ id: uid(), at: todayStr() }, item);
  write(K.list, [it].concat(list));
  return it;
}
export function addHabit(name) {
  const n = String(name || '').trim().slice(0, 120);
  if (!n) return false;
  const hs = read(K.habits, []);
  if (hs.some(h => h.name.toLowerCase() === n.toLowerCase())) return false;
  write(K.habits, hs.concat([{ id: uid(), name: n, days: {}, at: todayStr() }]));
  return true;
}
export function streakOf(days, today) {
  let n = 0;
  const d = new Date((today || todayStr()) + 'T12:00:00');
  if (!days[todayStr(d)]) d.setDate(d.getDate() - 1);   // today not ticked yet: the streak still counts to yesterday
  while (days[todayStr(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* Anonymous class totals, only when the student switched them on: a random id made on this phone,
   the wheel's numbers, the HOT numbers, and whether a commitment is declared. Never a name or words. */
let syncT = null;
export function syncTotals(code, off, now) {
  if (!code) return;
  const on = read(K.share, false);
  if (!on && !off) return;
  let anon = read(K.anon, '');
  if (!/^[a-z0-9]{16}$/.test(anon)) { anon = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join(''); write(K.anon, anon); }
  clearTimeout(syncT);
  syncT = setTimeout(() => {
    const w = read(K.wheel, {});
    const hot = read(K.hot, {});
    const avg = (l) => { const v = [0, 1, 2].map(i => hot[l + i]).filter(Boolean); return v.length === 3 ? Math.round(v.reduce((a, b) => a + b, 0) / 3) : undefined; };
    const h = {}; ['H', 'O', 'T'].forEach(l => { const v = avg(l); if (v) h[l.toLowerCase() + 'x'] = v; });
    api('shareTotals', off ? { code, anon, off: true } : { code, anon, wheel: { out: w.out || {}, in: w.in || {} }, hot: h, committed: !!read(K.commit, {}).declaredAt }).catch(() => {});
  }, off || now ? 0 : 1500);
}

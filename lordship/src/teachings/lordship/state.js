/* Where this teaching keeps things on the phone (all under "gp.lordship.*"). */
import { read, write, uid, todayStr } from '../../core/store.js';

export const K = {
  wheel: 'lordship.wheel', list: 'lordship.list', hot: 'lordship.hot', mentors: 'lordship.mentors',
  scroll: 'lordship.scroll', decisions: 'lordship.decisions', growth: 'lordship.growth',
  habits: 'lordship.habits', commit: 'lordship.commit', notes: (d) => 'lordship.notes.' + d,
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

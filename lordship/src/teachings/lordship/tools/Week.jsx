/* My Lordship week: everything I wrote, on one page — to read back, share with a mentor, or print / save as PDF. */
import { read } from '../../../core/store.js';
import { K } from '../state.js';
import { WHEEL_OUT, WHEEL_IN, ALIGN } from '../content.js';
import { planAreas } from './LayDown.jsx';
import { HORIZONS, MENTOR_ROLES } from '../content.js';
import { val, planText } from './Growth.jsx';
import { shareText } from '../../../core/ui.jsx';

export function weekText() {
  const w = read(K.wheel, {}), plans = read('lordship.plans', {}), list = read(K.list, []), sc = read(K.scroll, {}),
    c = read(K.commit, {}), hs = read(K.habits, []), dec = read(K.decisions, []);
  const out = [];
  const spokes = WHEEL_OUT.map(a => [a, (w.out || {})[a.id]]).concat(WHEEL_IN.map(a => [a, (w.in || {})[a.id]])).filter(x => x[1]).sort((x, y) => x[1] - y[1]);
  if (spokes.length) out.push({ h: 'My wheel', lines: [`Lowest: ${spokes.slice(0, 3).map(([a, v]) => `${a.name} ${v}/10`).join(', ')}`, `Highest: ${spokes.slice(-2).reverse().map(([a, v]) => `${a.name} ${v}/10`).join(', ')}`] });
  const pa = planAreas().filter(a => plans[a.id] && (plans[a.id].mine || plans[a.id].gods));
  if (pa.length) out.push({ h: 'My plan vs God’s plan', lines: pa.map(a => { const p = plans[a.id]; return `${a.name}${p.align ? ` (${ALIGN[p.align]})` : ''} — mine: ${p.mine || '—'} · God’s: ${p.gods || '—'}`; }) });
  if (list.length) out.push({ h: 'Lay down / take up', lines: list.map(x => `${x.area ? x.area + ': ' : ''}lay down ${x.laydown || '—'}; take up ${x.takeup || x.yes || '—'}`) });
  if (sc.statement) out.push({ h: 'My scroll', lines: [sc.statement] });
  if (dec.length) out.push({ h: 'God thing or good thing?', lines: dec.map(d => `${d.what} — ${d.lean}${d.nextStep ? `; next: ${d.nextStep}` : ''}`) });
  const g = read(K.growth, {}), ms = read(K.mentors, []).filter(m => m.name);
  const gl = HORIZONS.filter(x => val(g[x.id]).trim()).map(x => `${x.name} (${x.title}): ${val(g[x.id]).replace(/\n/g, '; ')}`);
  const p10 = planText(read(K.plan10, {}));
  if (p10) out.push({ h: 'Stay in YWAM. Keep growing.', lines: p10.split('\n\n') });
  else if (gl.length) out.push({ h: 'My 2 · 5 · 10', lines: gl });
  if (ms.length) out.push({ h: 'My mentor map', lines: MENTOR_ROLES.map(([k, n]) => [n, ms.filter(m => (m.kind || 'barnabas') === k)]).filter(x => x[1].length).map(([n, l]) => `${n}: ${l.map(m => m.name + (m.invite ? ' (inviting this month)' : '')).join(', ')}`) });
  if (hs.length) out.push({ h: 'Daily habits', lines: hs.map(h => h.name) });
  if (c.text) out.push({ h: 'My throw-down commitment', lines: [`“${c.text}” (declared ${c.declaredAt})`] });
  return out;
}

export default function Week() {
  const secs = weekText();
  const plain = 'My Lordship week\n\n' + secs.map(s => s.h + '\n' + s.lines.map(l => '• ' + l).join('\n')).join('\n\n');
  return (
    <div className="weekpage">
      <p className="eyebrow">All in, full of joy</p>
      <h1>My Lordship week</h1>
      {!secs.length && <p className="muted">Nothing yet — start with today’s session.</p>}
      {secs.map(s => <div className="card" key={s.h}><h3>{s.h}</h3>{s.lines.map((l, i) => <p key={i} className="wk-line">{l}</p>)}</div>)}
      {secs.length > 0 && (
        <div className="row wrap noprint">
          <button className="btn primary" onClick={() => shareText(plain, 'My Lordship week')}>Share with my mentor</button>
          <button className="btn ghost" onClick={() => window.print()}>Print or save as PDF</button>
        </div>
      )}
    </div>
  );
}

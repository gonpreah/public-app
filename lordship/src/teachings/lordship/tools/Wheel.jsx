/* 2. The Heart, Soul, Mind & Strength wheel (Mark 12:30): 9 outer areas (coaching) and
   9 inner areas (counselling), each 1–10, drawn as two wheels coloured by heart/soul/mind/strength.
   Then the coach helps pick one thing to lay down and one to take up. */
import { useState } from 'react';
import { GROUPS, WHEEL_OUT, WHEEL_IN } from '../content.js';
import { useLocal, todayStr } from '../../../core/store.js';
import { K, addToList, addHabit } from '../state.js';
import Coach from '../../../core/Coach.jsx';
import { toast } from '../../../core/ui.jsx';

const color = (g) => (GROUPS.find(x => x.id === g) || {}).color || '#888';

export function WheelSvg({ areas, vals, title }) {
  const C = 160, R = 120, n = areas.length;
  const pt = (a, r) => [C + r * Math.sin(a), C - r * Math.cos(a)];
  const wedge = (i, r) => {
    const a0 = (i / n) * 2 * Math.PI, a1 = ((i + 1) / n) * 2 * Math.PI;
    const [x0, y0] = pt(a0, r), [x1, y1] = pt(a1, r);
    return `M${C},${C} L${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z`;
  };
  return (
    <div className="wheel">
      <svg viewBox="0 0 320 320" role="img" aria-label={title + ' wheel'}>
        {[2, 4, 6, 8, 10].map(k => <circle key={k} cx={C} cy={C} r={R * k / 10} fill="none" stroke="var(--line)" strokeWidth={k === 10 ? 2 : 1} />)}
        {areas.map((a, i) => {
          const v = vals[a.id];
          return v ? <path key={a.id} d={wedge(i, R * v / 10)} fill={color(a.g)} fillOpacity=".78" stroke="var(--card)" strokeWidth="1.5" /> : null;
        })}
        {areas.map((a, i) => {
          const am = ((i + 0.5) / n) * 2 * Math.PI;
          const [x, y] = pt(am, R + 20);
          const words = a.name.split(' / ')[0];
          return <text key={a.id} x={x} y={y} fontSize="11" fontWeight="700" textAnchor="middle" dominantBaseline="middle" fill="var(--head)">{words}{vals[a.id] ? ' ' + vals[a.id] : ''}</text>;
        })}
      </svg>
      <h3>{title}</h3>
    </div>
  );
}

export function wheelContext(w) {
  const line = (a) => `${a.name} (${a.g}): ${(w.out || {})[a.id] || (w.in || {})[a.id] || '—'}/10`;
  return `My Heart, Soul, Mind & Strength wheel (1 = struggling, 10 = thriving):\nOuter areas (coaching):\n${WHEEL_OUT.map(line).join('\n')}\nInner areas (counselling):\n${WHEEL_IN.map(line).join('\n')}`;
}

export default function Wheel({ code, church }) {
  const [w, setW] = useLocal(K.wheel + (church ? '.church' : ''), { out: {}, in: {} });
  const [tab, setTab] = useState('out');
  const [saved, setSaved] = useState(null);
  const areas = tab === 'out' ? WHEEL_OUT : WHEEL_IN;
  const set = (id, v) => setW(cur => Object.assign({}, cur, { [tab]: Object.assign({}, cur[tab], { [id]: v }), at: todayStr() }));
  const rated = Object.keys(w.out || {}).length + Object.keys(w.in || {}).length;
  const low = WHEEL_OUT.concat(WHEEL_IN).filter(a => (w.out || {})[a.id] || (w.in || {})[a.id])
    .map(a => ({ a, v: (w.out || {})[a.id] || (w.in || {})[a.id] })).sort((x, y) => x.v - y.v).slice(0, 3);

  return (
    <>
      <p className="eyebrow">Mark 12:30</p>
      <h1>Heart, Soul, Mind & Strength</h1>
      <p className="lead">“You shall love the Lord your God with all your heart, with all your soul, with all your mind, and with all your strength.”</p>
      <p className="muted">Rate each area 1–10 — 1 is struggling, 10 is thriving. Be honest; no one else sees this. The outer wheel is where a coach helps. The inner wheel is where a counsellor helps.</p>

      <div className="wheels">
        <WheelSvg areas={WHEEL_OUT} vals={w.out || {}} title="Outer life" />
        <WheelSvg areas={WHEEL_IN} vals={w.in || {}} title="Inner life" />
      </div>
      <div className="legend">{GROUPS.map(g => <span key={g.id}><i style={{ background: g.color }} />{g.name}</span>)}</div>

      <div className="chips" role="tablist">
        <button className={'chip' + (tab === 'out' ? ' on' : '')} onClick={() => setTab('out')}>Outer · coaching</button>
        <button className={'chip' + (tab === 'in' ? ' on' : '')} onClick={() => setTab('in')}>Inner · counselling</button>
      </div>
      <div className="card">
        {areas.map(a => {
          const v = (w[tab] || {})[a.id] || 0;
          return (
            <div className="rate" key={a.id}>
              <div className="top-line"><b><span className="dot" style={{ background: color(a.g) }} />{a.name}</b><span className="val">{v || '–'}</span></div>
              <small>{a.q}</small>
              <div className="scale" role="radiogroup" aria-label={a.name}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <button key={n} role="radio" aria-checked={v === n} aria-label={`${a.name} ${n}`} className={v === n ? 'on' : ''} onClick={() => set(a.id, n)}>{n}</button>)}
              </div>
            </div>
          );
        })}
      </div>

      {low.length > 0 && <div className="note"><b>Lowest right now:</b> {low.map(x => `${x.a.name} (${x.v})`).join(', ')}</div>}
      {rated >= 6
        ? <Coach tool="wheel" code={code} context={wheelContext(w)} storeKey={K.chat('wheel', church ? 'church' : '')}
            intro="When you’re ready, the coach will look at your wheel with you and help you pick one thing to lay down and one to take up."
            saveLabel="Save my lay down / take up"
            onSaved={(r) => { const it = addToList({ from: 'Wheel', area: r.area, laydown: r.laydown, takeup: r.takeup }); setSaved(it); toast('Saved to your list'); }} />
        : <p className="muted">Rate at least 6 areas to talk it through with the coach.</p>}
      {saved && (
        <div className="card">
          <h3>Saved</h3>
          <div className="kv"><b>Area</b><span>{saved.area}</span><b>Lay down</b><span>{saved.laydown}</span><b>Take up</b><span>{saved.takeup}</span></div>
          <div className="row wrap">
            <button className="btn soft small" onClick={() => toast(addHabit(saved.takeup) ? 'Added to your habits' : 'Already a habit')}>Make "take up" a daily habit</button>
            <a className="btn ghost small" href={church ? '#/church/list' : '#/t/list'}>See my list</a>
          </div>
        </div>
      )}
    </>
  );
}

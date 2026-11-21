/* 7. Self-Development Plan: 2-, 5- and 10-year goals in skills, language, education and health,
   while serving in missions. Ideas to tap; the coach can help sharpen it. */
import { useState } from 'react';
import { GROWTH_AREAS, HORIZONS } from '../content.js';
import { useLocal } from '../../../core/store.js';
import { K } from '../state.js';
import Coach from '../../../core/Coach.jsx';
import { shareText } from '../../../core/ui.jsx';

export default function Growth({ code }) {
  const [g, setG] = useLocal(K.growth, {});
  const [h, setH] = useState('y2');
  const set = (area, v) => setG(Object.assign({}, g, { [h]: Object.assign({}, g[h] || {}, { [area]: v }) }));
  const add = (area, idea) => { const cur = (g[h] || {})[area] || ''; set(area, cur ? cur.replace(/\s*$/, '') + '\n' + idea : idea); };
  const text = HORIZONS.map(x => `${x.name}:\n` + GROWTH_AREAS.map(a => `  ${a.name}: ${((g[x.id] || {})[a.id] || '—').replace(/\n/g, '; ')}`).join('\n')).join('\n\n');
  const filled = HORIZONS.some(x => GROWTH_AREAS.some(a => ((g[x.id] || {})[a.id] || '').trim()));
  return (
    <>
      <p className="eyebrow">2 Timothy 2:3–6</p>
      <h1>Self-Development Plan</h1>
      <p className="lead">Soldier, athlete, farmer: keep growing while you serve.</p>
      <p className="muted">Set goals for skills, language, education and health — for 2, 5 and 10 years from now. Tap an idea to add it.</p>
      <div className="chips">{HORIZONS.map(x => <button key={x.id} className={'chip' + (h === x.id ? ' on' : '')} onClick={() => setH(x.id)}>{x.name}</button>)}</div>
      {GROWTH_AREAS.map(a => (
        <div className="card" key={a.id}>
          <h3>{a.name}</h3>
          <textarea rows={3} aria-label={a.name + ' in ' + h} value={(g[h] || {})[a.id] || ''} maxLength={800} onChange={e => set(a.id, e.target.value)}
            placeholder={`In ${HORIZONS.find(x => x.id === h).name}, I want to…`} />
          <div className="chips">{a.ideas.map(i => <button key={i} className="chip" onClick={() => add(a.id, i)}>+ {i}</button>)}</div>
        </div>
      ))}
      {filled && <button className="btn ghost" onClick={() => shareText('My self-development plan\n\n' + text)}>Share or copy my plan</button>}
      {filled && <Coach tool="growth" code={code} context={'My self-development plan so far:\n' + text} storeKey={K.chat('growth')} canSave={false}
        intro="Want help making these specific and realistic alongside ministry?" startLabel="Sharpen my plan with the coach" />}
    </>
  );
}

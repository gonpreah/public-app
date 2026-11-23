/* 7. Self-development plan (Friday): 2, 5 and 10 years — firm foundations, force for change,
   frontier missions. Ideas to tap; the coach can help sharpen it. */
import { HORIZONS } from '../content.js';
import { useLocal } from '../../../core/store.js';
import { K } from '../state.js';
import Coach from '../../../core/Coach.jsx';
import { shareText } from '../../../core/ui.jsx';

export const val = (v) => typeof v === 'string' ? v : v && typeof v === 'object' ? Object.values(v).filter(Boolean).join('\n') : '';

export default function Growth({ code }) {
  const [g, setG] = useLocal(K.growth, {});
  const set = (h, v) => setG(Object.assign({}, g, { [h]: v }));
  const add = (h, idea) => { const cur = val(g[h]); set(h, cur ? cur.replace(/\s*$/, '') + '\n' + idea : idea); };
  const text = HORIZONS.map(x => `${x.name} — ${x.title}:\n  ${(val(g[x.id]) || '—').replace(/\n/g, '; ')}`).join('\n\n');
  const filled = HORIZONS.some(x => val(g[x.id]).trim());
  return (
    <>
      <p className="eyebrow">2 Timothy 2:3–6</p>
      <h1>My 2 · 5 · 10</h1>
      <p className="lead">Soldier, athlete, farmer: keep growing while you serve.</p>
      <p className="muted">What will you pick up? Write a line or two for each, or tap an idea.</p>
      {HORIZONS.map(x => (
        <div className="card horizon" key={x.id}>
          <p className="eyebrow">{x.name}</p>
          <h3>{x.title}</h3>
          <p className="muted small">{x.hint}</p>
          <textarea rows={3} aria-label={x.name + ': ' + x.title} value={val(g[x.id])} maxLength={800} onChange={e => set(x.id, e.target.value)}
            placeholder={`In ${x.name}, I want to…`} />
          <div className="chips">{x.ideas.map(i => <button key={i} className="chip" onClick={() => add(x.id, i)}>+ {i}</button>)}</div>
        </div>
      ))}
      {filled && <button className="btn ghost" onClick={() => shareText('My 2 · 5 · 10\n\n' + text)}>Share or copy my plan</button>}
      {filled && <Coach tool="growth" code={code} context={'My self-development plan so far:\n' + text} storeKey={K.chat('growth')} canSave={false}
        intro="Want help making these specific and realistic alongside ministry?" startLabel="Sharpen my plan with the coach" />}
    </>
  );
}

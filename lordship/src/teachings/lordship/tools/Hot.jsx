/* 4. Stay HOT: a short honesty check (humble, open, transparent), then a mentor map —
   who speaks into which areas — with the gaps shown. */
import { HOT, MENTOR_AREAS } from '../content.js';
import { useLocal, uid } from '../../../core/store.js';
import { K } from '../state.js';

const NOTE = {
  H: ['Humility grows when we practise saying "I was wrong" and "I need help." Start small this week.', 'You’re growing here. Keep asking for help early.', 'Lovely. Keep celebrating others — and receiving help.'],
  O: ['Invite one person to tell you something they see in you that you might not.', 'You’re open in places. Who could you give more access to?', 'You’re teachable — that’s rare. Keep inviting input.'],
  T: ['You’re not alone. Is there one safe person you could tell one true thing this week?', 'Some light, some shadow. What’s one thing still hidden?', 'Walking in the light (1 John 1:7). Keep it up — and keep it current.']
};

export default function Hot() {
  const [hot, setHot] = useLocal(K.hot, {});
  const [ms, setMs] = useLocal(K.mentors, []);
  const scores = HOT.map(h => {
    const vals = h.items.map((_, i) => hot[h.l + i]).filter(Boolean);
    return { h, n: vals.length, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 };
  });
  const covered = (a) => ms.filter(m => (m.areas || []).includes(a));
  const gaps = MENTOR_AREAS.filter(a => !covered(a).length);
  const upd = (id, p) => setMs(ms.map(m => m.id === id ? Object.assign({}, m, p) : m));

  return (
    <>
      <p className="eyebrow">1 John 1:7</p>
      <h1>Stay HOT</h1>
      <p className="lead">Humble, Open, Transparent. “If we walk in the light … we have fellowship with one another.”</p>
      <div className="card">
        <h3>The honesty check</h3>
        <p className="muted small">1 = not me yet · 5 = very me. Only you see this.</p>
        {HOT.map(h => (
          <div key={h.l}>
            <h4>{h.l} · {h.name}</h4>
            {h.items.map((it, i) => (
              <div key={i} className="rate">
                <span>{it}</span>
                <div className="chips">{[1, 2, 3, 4, 5].map(v => <button key={v} className={'chip' + (hot[h.l + i] === v ? ' on' : '')} onClick={() => setHot(Object.assign({}, hot, { [h.l + i]: v }))} aria-label={`${it}: ${v}`}>{v}</button>)}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      {scores.some(s => s.n === 3) && (
        <div className="card">
          <h3>Where you are</h3>
          {scores.map(s => s.n === 3 && (
            <div key={s.h.l} style={{ margin: '12px 0' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}><b>{s.h.name}</b><span className="muted">{s.avg.toFixed(1)} / 5</span></div>
              <div className="bar"><i style={{ width: (s.avg / 5 * 100) + '%' }} /></div>
              <p className="small">{NOTE[s.h.l][s.avg < 2.7 ? 0 : s.avg < 4 ? 1 : 2]}</p>
            </div>
          ))}
          <p className="muted small">“My grace is sufficient for you, for my power is made perfect in weakness.” — 2 Corinthians 12:9</p>
        </div>
      )}

      <h2>My mentor map</h2>
      <p className="muted">Who speaks into your life — and about what? First names or nicknames are fine.</p>
      {ms.map(m => (
        <div className="card" key={m.id}>
          <div className="row"><input value={m.name} placeholder="Name" aria-label="Name" onChange={e => upd(m.id, { name: e.target.value })} />
            <button className="linkish" onClick={() => setMs(ms.filter(x => x.id !== m.id))}>Remove</button></div>
          <input value={m.role || ''} placeholder="Who they are (e.g. DTS leader, mum, pastor)" aria-label="Who they are" onChange={e => upd(m.id, { role: e.target.value })} />
          <div className="chips">{MENTOR_AREAS.map(a => {
            const on = (m.areas || []).includes(a);
            return <button key={a} className={'chip' + (on ? ' on' : '')} onClick={() => upd(m.id, { areas: on ? m.areas.filter(x => x !== a) : (m.areas || []).concat([a]) })}>{a}</button>;
          })}</div>
        </div>
      ))}
      <button className="btn soft" onClick={() => setMs(ms.concat([{ id: uid(), name: '', role: '', areas: [] }]))}>+ Add a person</button>
      {ms.length > 0 && (
        <div className="card grid">
          <h3>The map</h3>
          <table>
            <thead><tr><th>Area</th><th>Who</th></tr></thead>
            <tbody>{MENTOR_AREAS.map(a => {
              const c = covered(a);
              return <tr key={a}><td>{a}</td><td className={c.length ? '' : 'gap'}>{c.length ? c.map(m => m.name || '?').join(', ') : 'No one yet'}</td></tr>;
            })}</tbody>
          </table>
          {gaps.length > 0
            ? <p className="note small"><b>Gaps:</b> {gaps.join(', ')}. Who could you ask? It’s okay to ask someone, “Could I check in with you about this now and then?”</p>
            : <p className="ok">Every area has someone. That’s a gift — keep them in the loop.</p>}
        </div>
      )}
    </>
  );
}

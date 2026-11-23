/* 4. Stay HOT: a short honesty check (humble, open, transparent), then a mentor map —
   a Paul ahead of me, a Barnabas beside me, a Timothy I pour into — and one name to invite this month. */
import { HOT, MENTOR_ROLES } from '../content.js';
import { useLocal, uid } from '../../../core/store.js';
import { K, syncTotals } from '../state.js';

const NOTE = {
  H: ['Humility grows when we practise saying "I was wrong" and "I need help." Start small this week.', 'You’re growing here. Keep asking for help early.', 'Lovely. Keep celebrating others — and receiving help.'],
  O: ['Invite one person to tell you something they see in you that you might not.', 'You’re open in places. Who could you give more access to?', 'You’re teachable — that’s rare. Keep inviting input.'],
  T: ['You’re not alone. Is there one safe person you could tell one true thing this week?', 'Some light, some shadow. What’s one thing still hidden?', 'Walking in the light (1 John 1:7). Keep it up — and keep it current.']
};

export default function Hot({ code }) {
  const [hot, setHot0] = useLocal(K.hot, {});
  const setHot = (v) => { setHot0(v); syncTotals(code); };
  const [ms, setMs] = useLocal(K.mentors, []);
  const scores = HOT.map(h => {
    const vals = h.items.map((_, i) => hot[h.l + i]).filter(Boolean);
    return { h, n: vals.length, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 };
  });
  const inv = ms.find(m => m.invite);
  const upd = (id, p) => setMs(ms.map(m => m.id === id ? Object.assign({}, m, p) : m));

  return (
    <>
      <p className="eyebrow">1 John 1:7</p>
      <h1>Stay HOT</h1>
      <p className="lead">Humble, Open, Transparent. “If we walk in the light … we have fellowship with one another.”</p>
      <p className="hand">His power is amplified when my weakness is magnified.</p>
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
      <p className="muted">Everyone needs a Paul, a Barnabas and a Timothy. First names or nicknames are fine.</p>
      {MENTOR_ROLES.map(([k, n, sub]) => {
        const list = ms.filter(m => (m.kind || 'barnabas') === k);
        return (
          <div className="card mentor-role" key={k}>
            <h3>{n} <small className="muted">· {sub}</small></h3>
            {list.map(m => (
              <div className="row" key={m.id}>
                <button className={'chip' + (m.invite ? ' on' : '')} aria-pressed={!!m.invite} aria-label={'Invite ' + (m.name || 'them') + ' this month'}
                  onClick={() => setMs(ms.map(x => Object.assign({}, x, { invite: x.id === m.id ? !m.invite : false })))}>{m.invite ? '◉' : '○'}</button>
                <input value={m.name} placeholder="Name" aria-label={n + ' name'} onChange={e => upd(m.id, { name: e.target.value })} />
                <button className="linkish" aria-label={'Remove ' + (m.name || 'person')} onClick={() => setMs(ms.filter(x => x.id !== m.id))}>✕</button>
              </div>
            ))}
            {!list.length && <p className="muted small">{k === 'paul' ? 'Who is ahead of you, and could speak into your life?' : k === 'barnabas' ? 'Who walks beside you and knows your real stuff?' : 'Who are you pouring into, or could you?'}</p>}
            <button className="btn soft small" onClick={() => setMs(ms.concat([{ id: uid(), name: '', kind: k }]))}>+ Add a {n}</button>
          </div>
        );
      })}
      {inv
        ? <p className="ok">◉ This month I’ll invite <b>{inv.name || 'them'}</b> in. “Could I check in with you now and then?”</p>
        : ms.length > 0 && <p className="note small">Circle (○) one name to invite in this month.</p>}
      {ms.length > 0 && !ms.some(m => (m.kind || 'barnabas') === 'barnabas' && m.name) && <p className="note small"><b>No Barnabas yet.</b> Hiding weakness doesn’t make us strong; it makes us alone. Who could you tell one true thing?</p>}
    </>
  );
}

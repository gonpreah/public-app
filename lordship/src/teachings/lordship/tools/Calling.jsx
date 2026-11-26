/* Thursday, private: where am I? Identity status (explore, then commit), the four places a calling is discovered,
   and the 3 C's before joining any team. Stays on this phone (and the student's own account sync). */
import { IDENTITY, CALLING_FOUND, THREE_CS } from '../content.js';
import { useLocal } from '../../../core/store.js';

export default function Calling() {
  const [c, setC] = useLocal('lordship.calling', {});
  const set = (k, v) => setC(Object.assign({}, c, { [k]: v }));
  const weakest = THREE_CS.filter(([id]) => (c.cs || {})[id]).sort((a, b) => c.cs[a[0]] - c.cs[b[0]])[0];
  return (
    <>
      <p className="eyebrow">Thursday · just for you</p>
      <h1>Where am I?</h1>
      <p className="lead">Explore, then commit. No right answer — just an honest one.</p>
      <div className="card">
        <h3>My identity status right now</h3>
        <div className="lp-opts">{IDENTITY.map(([id, em, n, d]) => (
          <button key={id} className={'opt-btn' + (c.status === id ? ' mine' : '')} aria-pressed={c.status === id} onClick={() => set('status', id)}>
            <span className="lp-em">{em}</span><span><b>{n}</b><br /><small className="muted">{d}</small></span></button>))}</div>
        {c.status && c.status !== 'achievement' && <p className="note small">{c.status === 'moratorium' ? 'Exploring is healthy — keep going, and set a time to choose.' : c.status === 'foreclosure' ? 'Ask: is this my plan, or one I was handed? Explore it with God.' : 'Start exploring: try, ask, serve. God guides moving feet.'}</p>}
      </div>
      <div className="card">
        <h3>Four places a calling is discovered</h3>
        {CALLING_FOUND.map(([id, n, d]) => (
          <div key={id} className="pf">
            <label className="lab" htmlFor={'cf' + id}><b>{n}</b> — {d}</label>
            <input id={'cf' + id} value={(c.found || {})[id] || ''} maxLength={160} placeholder="A line…" onChange={e => set('found', Object.assign({}, c.found, { [id]: e.target.value }))} />
          </div>
        ))}
      </div>
      <div className="card">
        <h3>The 3 C’s before joining any team</h3>
        <p className="muted small">1 = needs work · 5 = strong</p>
        {THREE_CS.map(([id, n, d]) => (
          <div key={id} className="rate"><span><b>{n}</b> <small className="muted">{d}</small></span>
            <div className="chips">{[1, 2, 3, 4, 5].map(v => <button key={v} className={'chip' + ((c.cs || {})[id] === v ? ' on' : '')} aria-label={`${n}: ${v}`} onClick={() => set('cs', Object.assign({}, c.cs, { [id]: v }))}>{v}</button>)}</div></div>
        ))}
        {weakest && <p className="note small">Grow first in <b>{weakest[1]}</b>. Who could help you with it?</p>}
      </div>
      <a className="btn primary big" href="#/t/backup">Next: burn the ships ›</a>
    </>
  );
}

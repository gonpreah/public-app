/* Wednesday: lay down a right. A right is anything I believe I'm owed; pick one (or write your own),
   and hand it over: "Jesus, this is yours." It goes on my lay down / take up list. */
import { useState } from 'react';
import { RIGHTS } from '../content.js';
import { useLocal, todayStr } from '../../../core/store.js';
import { addToList } from '../state.js';
import { burst } from '../../../core/ui.jsx';

export default function Rights() {
  const [given, setGiven] = useLocal('lordship.rights', []);
  const [pick, setPick] = useState('');
  const [text, setText] = useState('');
  const what = (text.trim() || (RIGHTS.find(r => r.id === pick) || {}).name || '').slice(0, 160);
  function give(e) {
    if (!what) return;
    addToList({ from: 'Laying down', area: 'A right', laydown: what });
    setGiven([{ what, at: todayStr() }].concat(given).slice(0, 20));
    setPick(''); setText(''); burst(e.currentTarget);
  }
  return (
    <>
      <p className="eyebrow">Philippians 2:6–7</p>
      <h1>Lay down a right</h1>
      <p className="hand">You can’t hold what he asks you to lay down.</p>
      <p className="lead">A right is anything I believe I’m owed. Laying it down isn’t losing it — it’s handing it to someone I trust more than myself.</p>
      <div className="card">
        <h3>Which right would be hardest to lay down?</h3>
        <div className="chips">{RIGHTS.map(r => (
          <button key={r.id} className={'chip' + (pick === r.id && !text.trim() ? ' on' : '')} onClick={() => { setPick(r.id); setText(''); }} title={r.ref}>{r.name}</button>
        ))}</div>
        <label className="small muted" htmlFor="right">Or in your own words — your “never, Lord”</label>
        <input id="right" value={text} maxLength={160} onChange={e => setText(e.target.value)} placeholder="My right to…" />
        <p className="muted small">Holy Spirit, what are you asking me to put in your hands?</p>
        <button className="btn primary big" disabled={!what} onClick={give}>{what ? `Jesus, ${what.toLowerCase()} is yours.` : 'Jesus, this is yours.'}</button>
      </div>
      {given.length > 0 && (
        <div className="card">
          <h3>In his hands</h3>
          {given.map((g, i) => <p key={i} className="wk-line">🤲 {g.what} <span className="muted small">· {g.at}</span></p>)}
          <p className="muted small">Also saved to your lay down / take up list. “Yahweh Will Provide.” — Genesis 22:14</p>
        </div>
      )}
    </>
  );
}

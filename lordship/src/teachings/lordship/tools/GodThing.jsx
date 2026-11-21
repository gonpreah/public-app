/* 6. God thing or good thing: an opportunity or decision, walked through John 5:19 and my scroll. */
import { useState } from 'react';
import { useLocal, uid, todayStr, read } from '../../../core/store.js';
import { K } from '../state.js';
import Coach from '../../../core/Coach.jsx';
import { toast } from '../../../core/ui.jsx';

export default function GodThing({ code }) {
  const [list, setList] = useLocal(K.decisions, []);
  const [cur, setCur] = useLocal('lordship.decision.current', { id: '', what: '' });
  const [started, setStarted] = useState(!!cur.id);
  const scroll = read(K.scroll, {}).statement || '';
  const begin = () => { if (cur.what.trim().length < 5) return; const id = cur.id || uid(); setCur(Object.assign({}, cur, { id })); setStarted(true); };
  return (
    <>
      <p className="eyebrow">John 5:19</p>
      <h1>God thing or good thing?</h1>
      <p className="lead">“The Son can do nothing of himself, but what he sees the Father doing.”</p>
      <p className="muted">Not every good thing is your thing. Put in an opportunity or decision and walk it through with the coach{scroll ? ' and your scroll' : ''}.</p>
      <div className="card">
        <label className="lab" htmlFor="what">The opportunity or decision</label>
        <textarea id="what" rows={3} value={cur.what} disabled={started} maxLength={1500} onChange={e => setCur(Object.assign({}, cur, { what: e.target.value }))}
          placeholder="e.g. I’ve been asked to staff the next DTS; a job offer back home; leading worship; going to uni next year…" />
        {!started && <button className="btn primary" style={{ marginTop: 10 }} disabled={cur.what.trim().length < 5} onClick={begin}>Walk it through</button>}
        {!scroll && <p className="tiny muted">Tip: write <a href="#/t/scroll">your scroll</a> first and the coach can use it.</p>}
      </div>
      {started && (
        <Coach tool="godthing" code={code} storeKey={K.chat('godthing', cur.id)}
          context={`The opportunity or decision: ${cur.what}${scroll ? `\n\nMy scroll: ${scroll}` : ''}`}
          saveLabel="Save where I’ve landed"
          onSaved={(r) => {
            setList([Object.assign({ id: cur.id, what: cur.what, at: todayStr() }, r)].concat(list.filter(x => x.id !== cur.id)));
            setCur({ id: '', what: '' }); setStarted(false); toast('Saved'); window.scrollTo(0, 0);
          }} />
      )}
      {started && <button className="linkish" onClick={() => { setCur({ id: '', what: '' }); setStarted(false); }}>Start a different one</button>}
      {list.length > 0 && <h2>What I’ve weighed</h2>}
      {list.map(d => (
        <div className="card" key={d.id}>
          <p className="muted tiny">{d.at}</p>
          <h3>{d.what}</h3>
          <p><span className="pill">{d.lean}</span></p>
          <div className="kv"><b>Why</b><span>{d.why}</span><b>People-pleasing?</b><span>{d.pleasingPeople}</span><b>Next step</b><span>{d.nextStep}</span></div>
          <button className="linkish" onClick={() => { if (confirm('Remove this?')) setList(list.filter(x => x.id !== d.id)); }}>Remove</button>
        </div>
      ))}
    </>
  );
}

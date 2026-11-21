/* 5. My Scroll: Jesus read Isaiah's scroll in Nazareth (Luke 4). Write what you sense God calling
   you to; the coach asks discernment questions and helps shape a short "scroll" statement. */
import { useState } from 'react';
import { useLocal, todayStr } from '../../../core/store.js';
import { K } from '../state.js';
import Coach from '../../../core/Coach.jsx';
import { toast, shareText } from '../../../core/ui.jsx';

export default function Scroll({ code }) {
  const [s, setS] = useLocal(K.scroll, { draft: '', statement: '' });
  const [editing, setEditing] = useState(false);
  const set = (p) => setS(Object.assign({}, s, p));
  return (
    <>
      <p className="eyebrow">Luke 4:16–21</p>
      <h1>My Scroll</h1>
      <p className="lead">Jesus stood up, unrolled the scroll and read what he was sent to do. What do you sense is written on yours?</p>
      {s.statement && !editing && (
        <div className="scroll-card">
          <p className="hand">My scroll</p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{s.statement}</p>
          <p className="small">{s.at}</p>
        </div>
      )}
      {s.statement && !editing && (
        <div className="row wrap">
          <button className="btn soft small" onClick={() => setEditing(true)}>Edit</button>
          <button className="btn ghost small" onClick={() => shareText('My scroll\n\n' + s.statement)}>Share or copy</button>
        </div>
      )}
      {editing && (
        <div className="card">
          <label className="lab">My scroll statement</label>
          <textarea rows={5} value={s.statement} onChange={e => set({ statement: e.target.value })} maxLength={800} />
          <div className="row"><button className="btn primary small" onClick={() => { set({ at: todayStr() }); setEditing(false); }}>Done</button></div>
        </div>
      )}
      <div className="card">
        <label className="lab" htmlFor="draft">What I sense God is calling me to (messy is fine)</label>
        <textarea id="draft" rows={5} value={s.draft} onChange={e => set({ draft: e.target.value })} maxLength={3000}
          placeholder="People I can’t stop thinking about… things that break my heart… what I’ve heard in prayer… what others see in me…" />
      </div>
      {s.draft.trim().length > 20
        ? <Coach tool="scroll" code={code} context={`What I sense God calling me to:\n${s.draft}${s.statement ? `\n\nMy scroll so far:\n${s.statement}` : ''}`} storeKey={K.chat('scroll')}
            intro="The coach will ask discernment questions — where this came from, what confirms it, who it’s for — and then help you shape a short statement."
            saveLabel="Shape my scroll statement"
            onSaved={(r) => { set({ statement: r.scroll, at: todayStr() }); toast('Your scroll is saved'); window.scrollTo(0, 0); }} />
        : <p className="muted">Write a few sentences above, then talk it through with the coach.</p>}
      {!s.statement && <button className="linkish" onClick={() => setEditing(true)}>Or write the statement yourself</button>}
    </>
  );
}

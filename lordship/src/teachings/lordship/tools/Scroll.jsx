/* 5. My Scroll: Jesus read Isaiah's scroll in Nazareth (Luke 4). Write what you sense God calling
   you to; the coach asks discernment questions and helps shape a short "scroll" statement. */
import { useLocal, todayStr } from '../../../core/store.js';
import { K } from '../state.js';
import Coach from '../../../core/Coach.jsx';
import { toast, shareText } from '../../../core/ui.jsx';

export default function Scroll({ code }) {
  const [s, setS] = useLocal(K.scroll, { draft: '', statement: '' });
  const editing = false;
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
          <button className="btn ghost small" onClick={() => shareText('My scroll\n\n' + s.statement)}>Share or copy</button>
        </div>
      )}
      <div className="twoplans">
        <div className="plan-col mine">
          <h3><span className="dotc mine" /> My plan for my life</h3>
          <label className="small muted" htmlFor="myplan">What I’ve always pictured — career, place, family, dreams.</label>
          <textarea id="myplan" rows={5} value={s.myPlan || ''} onChange={e => set({ myPlan: e.target.value })} maxLength={2000} placeholder="If it were up to me…" />
        </div>
        <div className="plan-col gods">
          <h3><span className="dotc gods" /> What God might have written</h3>
          <label className="small muted" htmlFor="draft">What I sense God is calling me to (messy is fine).</label>
          <textarea id="draft" rows={5} value={s.draft} onChange={e => set({ draft: e.target.value })} maxLength={3000}
            placeholder="People I can’t stop thinking about… what breaks my heart… what I’ve heard in prayer… what others see in me…" />
        </div>
      </div>
      <div className="card">
        <h3>Shape my scroll</h3>
        <p className="muted small">Jesus’ scroll was short: who he was sent to, and what he’d do (Luke 4:18–19). Try yours in 2–4 sentences — “I am sent to… so that…”.</p>
        <textarea rows={4} value={s.statement} onChange={e => set({ statement: e.target.value, at: todayStr() })} maxLength={800} aria-label="My scroll statement" placeholder="I am sent to…" />
      </div>
      {s.draft.trim().length > 20
        && <Coach tool="scroll" code={code} context={`My own plan for my life:\n${s.myPlan || '—'}\n\nWhat I sense God calling me to:\n${s.draft}${s.statement ? `\n\nMy scroll so far:\n${s.statement}` : ''}`} storeKey={K.chat('scroll')}
            intro="The coach can ask discernment questions — where this came from, what confirms it, who it’s for — and help you shape the statement."
            saveLabel="Shape my scroll statement"
            onSaved={(r) => { set({ statement: r.scroll, at: todayStr() }); toast('Your scroll is saved'); window.scrollTo(0, 0); }} />}
    </>
  );
}

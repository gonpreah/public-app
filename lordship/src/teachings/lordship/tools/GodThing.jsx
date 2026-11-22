/* 6. God thing or good thing? An opportunity, with my plan for it next to what I see the Father doing
   (John 5:19), five honest checks, and my own verdict. The coach is optional. */
import { useLocal, uid, todayStr, read } from '../../../core/store.js';
import { K } from '../state.js';
import Coach from '../../../core/Coach.jsx';
import { toast, burst } from '../../../core/ui.jsx';
import { Venn } from './LayDown.jsx';

const CHECKS = [
  { id: 'scroll', q: 'It fits what I sense is on my scroll.' },
  { id: 'peace', q: 'I have peace about it when I pray.' },
  { id: 'wise', q: 'Wise people who know me think it’s right.' },
  { id: 'seen', q: 'I’d still do it if no one ever saw it or praised me.' },
  { id: 'cost', q: 'I know what I’d have to say no to — and I’m okay with that.' }
];
const LEANS = [['god thing', '🙌 God thing'], ['good thing', '👍 Good thing (not mine right now)'], ['not sure yet', '🤔 Not sure yet']];
const EMPTY = { id: '', what: '', mine: '', father: '', checks: {}, lean: '', why: '', nextStep: '' };

export default function GodThing({ code }) {
  const [list, setList] = useLocal(K.decisions, []);
  const [cur, setCur] = useLocal('lordship.decision.current', EMPTY);
  const c = Object.assign({}, EMPTY, cur);
  const set = (p) => setCur(Object.assign({}, c, { id: c.id || uid() }, p));
  const scroll = read(K.scroll, {}).statement || '';
  const yes = CHECKS.filter(x => c.checks[x.id] === 'yes').length;
  const answered = CHECKS.filter(x => c.checks[x.id]).length;
  const align = answered ? Math.max(1, Math.min(5, Math.round(yes / CHECKS.length * 4) + 1)) : 0;
  function save(e) {
    const people = c.checks.seen === 'no' ? 'Honestly, some of this is about being seen or pleasing people.' : c.checks.seen === 'yes' ? 'I’d do it even if no one noticed.' : 'Not sure yet.';
    setList([{ id: c.id || uid(), what: c.what, mine: c.mine, father: c.father, lean: c.lean, why: c.why, pleasingPeople: people, nextStep: c.nextStep, yes, at: todayStr() }].concat(list.filter(x => x.id !== c.id)));
    burst(e.currentTarget); setCur(EMPTY); toast('Saved'); window.scrollTo(0, 0);
  }
  const ctx = `The opportunity or decision: ${c.what}\nMy plan / why I want it: ${c.mine || '—'}\nWhat I see the Father doing: ${c.father || '—'}\nChecks: ${CHECKS.map(x => `${x.q} → ${c.checks[x.id] || 'unanswered'}`).join('; ')}${scroll ? `\nMy scroll: ${scroll}` : ''}`;
  return (
    <>
      <p className="eyebrow">John 5:19</p>
      <h1>God thing or good thing?</h1>
      <p className="lead">“The Son can do nothing of himself, but what he sees the Father doing.”</p>
      <p className="muted">Not every good thing is your thing. Put your plan for it next to what you see the Father doing.</p>
      <div className="card">
        <label className="lab" htmlFor="what">The opportunity or decision</label>
        <textarea id="what" rows={2} value={c.what} maxLength={600} onChange={e => set({ what: e.target.value })}
          placeholder="e.g. staffing the next DTS; a job back home; going to uni next year…" />
      </div>
      {c.what.trim().length >= 5 && <>
        <div className="twoplans">
          <div className="plan-col mine"><h3><span className="dotc mine" /> My plan</h3>
            <p className="small muted">Why do I want this? What do I hope it gives me?</p>
            <textarea rows={4} value={c.mine} maxLength={1200} onChange={e => set({ mine: e.target.value })} aria-label="My plan for it" /></div>
          <div className="plan-col gods"><h3><span className="dotc gods" /> What the Father is doing</h3>
            <p className="small muted">Where do I see God already at work in this — or not?</p>
            <textarea rows={4} value={c.father} maxLength={1200} onChange={e => set({ father: e.target.value })} aria-label="What I see the Father doing" /></div>
        </div>
        <div className="card">
          <h3>Five honest checks</h3>
          {CHECKS.map(x => (
            <div className="rate" key={x.id}>
              <span>{x.q}{x.id === 'scroll' && scroll ? <small className="muted"> My scroll: “{scroll.slice(0, 90)}{scroll.length > 90 ? '…' : ''}”</small> : null}</span>
              <div className="chips">{[['yes', 'Yes'], ['unsure', 'Not sure'], ['no', 'No']].map(([v, l]) =>
                <button key={v} className={'chip' + (c.checks[x.id] === v ? ' on' : '')} onClick={() => set({ checks: Object.assign({}, c.checks, { [x.id]: v }) })} aria-label={`${x.q} ${l}`}>{l}</button>)}</div>
            </div>
          ))}
          {answered > 0 && <div className="align-card"><Venn align={align} size={180} /><p className="muted small" style={{ textAlign: 'center' }}>{yes} of {CHECKS.length} checks say yes.</p></div>}
        </div>
        <div className="card">
          <h3>Where I’ve landed</h3>
          <div className="chips">{LEANS.map(([v, l]) => <button key={v} className={'chip' + (c.lean === v ? ' on' : '')} onClick={() => set({ lean: v })}>{l}</button>)}</div>
          <label className="lab">Why, in a sentence</label>
          <input value={c.why} maxLength={300} onChange={e => set({ why: e.target.value })} />
          <label className="lab">My next step</label>
          <input value={c.nextStep} maxLength={200} onChange={e => set({ nextStep: e.target.value })} placeholder="Pray a week; ask my mentor; say yes; say no…" />
          <button className="btn primary" style={{ marginTop: 12 }} disabled={!c.lean} onClick={save}>Save</button>
        </div>
        <Coach tool="godthing" code={code} storeKey={K.chat('godthing', c.id || 'new')} context={ctx}
          intro="Want help weighing it? The coach asks one question at a time — you decide."
          saveLabel="Suggest where I’ve landed"
          onSaved={(r) => { set({ lean: r.lean, why: r.why, nextStep: r.nextStep }); toast('Filled in — check it and save'); }} />
        <button className="linkish" onClick={() => { if (confirm('Clear this one and start again?')) setCur(EMPTY); }}>Start a different one</button>
      </>}
      {list.length > 0 && <h2>What I’ve weighed</h2>}
      {list.map(d => (
        <div className="card" key={d.id}>
          <p className="muted tiny">{d.at}</p>
          <h3>{d.what}</h3>
          <p><span className="pill">{d.lean}</span>{typeof d.yes === 'number' && <span className="muted small"> · {d.yes}/5 checks</span>}</p>
          <div className="kv">{d.mine && <><b>My plan</b><span>{d.mine}</span></>}{d.father && <><b>The Father</b><span>{d.father}</span></>}
            {d.why && <><b>Why</b><span>{d.why}</span></>}<b>Pleasing people?</b><span>{d.pleasingPeople}</span><b>Next step</b><span>{d.nextStep || '—'}</span></div>
          <button className="linkish" onClick={() => { if (confirm('Remove this?')) setList(list.filter(x => x.id !== d.id)); }}>Remove</button>
        </div>
      ))}
    </>
  );
}

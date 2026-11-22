/* 9. Throw-down commitment: on Friday, one specific commitment — write it, declare it, save it,
   share it with a mentor. Check-ins come up in the app at 30 and 90 days. */
import { useState } from 'react';
import { useLocal, todayStr, addDays, daysBetween } from '../../../core/store.js';
import { K, syncTotals } from '../state.js';
import { shareText, burst } from '../../../core/ui.jsx';
import { downloadIcs } from '../../../core/ics.js';

export function dueCheckin(c, today) {
  if (!c || !c.declaredAt) return null;
  const n = daysBetween(c.declaredAt, today || todayStr());
  const ck = c.checkins || {};
  if (n >= 90 && !ck.d90) return 'd90';
  if (n >= 30 && !ck.d30) return 'd30';
  return null;
}

export default function Commit({ code }) {
  const [c, setC] = useLocal(K.commit, {});
  const [text, setText] = useState(c.text || '');
  const [show, setShow] = useState(false);
  const [ck, setCk] = useState({ score: 0, note: '' });
  const due = dueCheckin(c);
  const declare = () => { setC(Object.assign({}, c, { text: text.trim(), declaredAt: c.declaredAt || todayStr() })); setShow(true); syncTotals(code, false, true); setTimeout(() => burst(document.querySelector('.declare .big'), 24), 250); };
  const cal = () => downloadIcs([30, 90].map(n => ({ date: addDays(c.declaredAt || todayStr(), n), title: `Lordship: ${n}-day check-in`, text: `My commitment: “${c.text || text}”. Open the Lordship app and do your check-in — and tell your mentor how it’s going.` })), 'lordship-check-ins.ics');
  const msg = `My throw-down commitment from Lordship week (${c.declaredAt || todayStr()}):\n\n“${c.text || text}”\n\nWould you check in with me on this in 30 days and again in 90?`;

  if (show && c.text) return (
    <>
      <div className="declare">
        <p className="hand">I’m all in.</p>
        <p className="big">“{c.text}”</p>
        <p>Declared {c.declaredAt}</p>
      </div>
      <p className="muted" style={{ textAlign: 'center' }}>Say it out loud. Then tell someone who will ask you about it.</p>
      <div className="stack">
        <button className="btn primary big" onClick={() => shareText(msg, 'My commitment')}>Share with a mentor</button>
        <button className="btn soft big" onClick={cal}>📅 Add 30- and 90-day check-ins to my calendar</button>
        <button className="btn ghost" onClick={() => setShow(false)}>Done</button>
      </div>
    </>
  );

  return (
    <>
      <p className="eyebrow">Friday</p>
      <h1>Throw-down commitment</h1>
      <p className="lead">One specific thing you will do. Not a feeling — a step someone could check on.</p>
      {due && (
        <div className="card qa-new">
          <h3>{due === 'd30' ? '30-day' : '90-day'} check-in</h3>
          <p>You committed: <b>“{c.text}”</b></p>
          <label className="lab">How’s it going?</label>
          <div className="chips">{[['1', 'Not started'], ['2', 'Struggling'], ['3', 'Some days'], ['4', 'Mostly'], ['5', 'Living it']].map(([v, l]) =>
            <button key={v} className={'chip' + (ck.score === +v ? ' on' : '')} onClick={() => setCk(Object.assign({}, ck, { score: +v }))}>{l}</button>)}</div>
          <textarea rows={3} value={ck.note} onChange={e => setCk(Object.assign({}, ck, { note: e.target.value }))} placeholder="What’s helped? What’s got in the way? Who knows about it?" />
          <div className="row"><button className="btn primary" disabled={!ck.score} onClick={() => { setC(Object.assign({}, c, { checkins: Object.assign({}, c.checkins, { [due]: Object.assign({ at: todayStr() }, ck) }) })); setCk({ score: 0, note: '' }); }}>Save check-in</button></div>
          <p className="muted small">No shame here. Grace is the soil we grow in — start again today.</p>
        </div>
      )}
      <div className="card">
        <label className="lab" htmlFor="commit">My commitment</label>
        <textarea id="commit" rows={3} value={text} maxLength={280} onChange={e => setText(e.target.value)}
          placeholder="e.g. I will meet with my mentor every two weeks and tell her the truth about my finances." />
        <p className="tiny muted">{text.length}/280 · Specific, doable, someone could ask you about it.</p>
        <div className="row wrap">
          <button className="btn primary" disabled={text.trim().length < 8} onClick={declare}>{c.declaredAt ? 'Update & declare' : 'Declare it'}</button>
          {c.text && <button className="btn ghost" onClick={() => shareText(msg, 'My commitment')}>Share with a mentor</button>}
        </div>
      </div>
      {c.declaredAt && (
        <div className="card">
          <h3>Check-ins</h3>
          <button className="btn soft small" onClick={cal}>📅 Add to my calendar</button>
          {[['d30', 30], ['d90', 90]].map(([k, n]) => {
            const r = (c.checkins || {})[k];
            return <p key={k}><b>{n} days</b> ({addDays(c.declaredAt, n)}): {r ? `✓ ${r.at} — ${['', 'Not started', 'Struggling', 'Some days', 'Mostly', 'Living it'][r.score]}${r.note ? ' · ' + r.note : ''}` : <span className="muted">we’ll remind you here</span>}</p>;
          })}
        </div>
      )}
    </>
  );
}

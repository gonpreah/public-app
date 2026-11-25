/* Wednesday, private: "I'm prone to…" (everyday leanings, not a shame list) with a new-creation verse beside each, and a
   weekly MSP check-in (money, sex, power: 1–5 and a note). Nothing leaves this phone except the account's own sync. */
import { useState } from 'react';
import { PRONE, NEW_CREATION } from '../content.js';
import { useLocal, todayStr } from '../../../core/store.js';
import { burst } from '../../../core/ui.jsx';

export default function Prone() {
  const [mine, setMine] = useLocal('lordship.prone', []);
  const [msp, setMsp] = useLocal('lordship.msp', []);
  const [own, setOwn] = useState('');
  const [cur, setCur] = useState({ m: 0, s: 0, p: 0, note: '' });
  const toggle = (t) => setMine(mine.includes(t) ? mine.filter(x => x !== t) : mine.concat([t]).slice(-12));
  const last = msp[0];
  return (
    <>
      <p className="eyebrow">Just you and God · stays on your phone</p>
      <h1>“I’m prone to…”</h1>
      <p className="lead">Small, everyday leanings. You don’t have to fix them overnight. You do have to know them. Both are true: still a sinner in the flesh, a new creation in Christ.</p>
      <div className="chips">{PRONE.map(t => <button key={t} className={'chip' + (mine.includes(t) ? ' on' : '')} aria-pressed={mine.includes(t)} onClick={() => toggle(t)}>{t}</button>)}</div>
      <form className="row" onSubmit={e => { e.preventDefault(); const t = own.trim().slice(0, 60); if (t) { toggle(t); setOwn(''); } }}>
        <input value={own} maxLength={60} onChange={e => setOwn(e.target.value)} placeholder="In my own words…" aria-label="I’m prone to, in my own words" />
        <button className="btn soft" disabled={!own.trim()}>Add</button>
      </form>
      {mine.length > 0 && <div className="card prone-list">{mine.map((t, i) => { const v = NEW_CREATION[i % NEW_CREATION.length]; return (
        <div key={t} className="prone-row"><p><b>I’m prone to {t}.</b></p><p className="small">But in Christ: “{v.text}” <i>— {v.ref}</i></p></div>); })}
        <p className="tiny muted">Name it · bring it to the light · put it to death · walk as who you are.</p></div>}

      <h2>MSP check-in</h2>
      <p className="muted">Money, sex, power. How am I doing this week? 1 = struggling · 5 = free. Private — nothing is shared.</p>
      <div className="card">
        {[['m', '💸 Money'], ['s', '❤️‍🔥 Sex'], ['p', '👑 Power']].map(([k, l]) => (
          <div key={k} className="rate"><span>{l}{last ? <small className="muted"> · last time {last[k]}</small> : null}</span>
            <div className="chips">{[1, 2, 3, 4, 5].map(v => <button key={v} className={'chip' + (cur[k] === v ? ' on' : '')} aria-label={`${l}: ${v}`} onClick={() => setCur(Object.assign({}, cur, { [k]: v }))}>{v}</button>)}</div></div>
        ))}
        <textarea rows={2} value={cur.note} maxLength={500} onChange={e => setCur(Object.assign({}, cur, { note: e.target.value }))} placeholder="A private note" aria-label="Private note" />
        <button className="btn primary" disabled={!cur.m || !cur.s || !cur.p} onClick={(e) => { setMsp([Object.assign({ d: todayStr() }, cur)].concat(msp.filter(x => x.d !== todayStr())).slice(0, 26)); setCur({ m: 0, s: 0, p: 0, note: '' }); burst(e.currentTarget); }}>Save this week</button>
        {msp.length > 0 && <p className="tiny muted">{msp.slice(0, 6).map(x => `${x.d}: 💸${x.m} ❤️‍🔥${x.s} 👑${x.p}`).join(' · ')}</p>}
      </div>
      <p className="small">Want to talk with staff? <a href="#/t/questions">Ask anonymously in the question box</a>, or <a href="#/t/help">find someone to talk to</a>.</p>
    </>
  );
}

/* "What's your Lordship profile?" — 8 quick, funny questions, then a profile card to show your neighbour
   and put on the big screen (in class, once you've joined). In church mode it's just for fun. */
import { useState } from 'react';
import { QUIZ, PROFILES } from '../content.js';
import { useLocal } from '../../../core/store.js';
import { api, errText } from '../../../core/api.js';
import { authArgs, getMe } from '../../../core/account.js';
import { burst, shareText, toast } from '../../../core/ui.jsx';

export function score(answers) {
  const n = {};
  answers.forEach(p => { n[p] = (n[p] || 0) + 1; });
  const order = Object.keys(n).sort((a, b) => n[b] - n[a] || answers.indexOf(a) - answers.indexOf(b));
  return { top: order[0], next: order[1] && n[order[1]] >= 2 ? order[1] : null };
}

export function ProfileCard({ id, name, big }) {
  const p = PROFILES[id];
  if (!p) return null;
  return (
    <div className={'pcard' + (big ? ' big' : '')}>
      <div className="pcard-emoji">{p.emoji}</div>
      {name && <p className="pcard-who">{name} is…</p>}
      <h2>{p.name}</h2>
      <p className="pcard-tag">“{p.tag}”</p>
    </div>
  );
}

export default function Quiz({ code, church, onPosted }) {
  const [res, setRes] = useLocal('lordship.quiz', null);
  const [ans, setAns] = useState([]);
  const [show, setShow] = useState(false);
  const [posted, setPosted] = useState(false);
  const [busy, setBusy] = useState(false);
  const me = !church && getMe();
  const i = ans.length;

  function pick(p, e) {
    const next = ans.concat([p]);
    burst(e.currentTarget, 6);
    if (next.length === QUIZ.length) { const r = score(next); setRes(Object.assign({ at: Date.now() }, r)); setAns([]); setTimeout(() => burst(document.querySelector('.pcard'), 24), 300); }
    else setAns(next);
  }
  async function post() {
    setBusy(true);
    try { await api('quizSave', Object.assign({ code, profile: res.top }, authArgs())); setPosted(true); toast('It’s on the big screen!'); onPosted && onPosted(); }
    catch (e) { toast(errText(e)); }
    setBusy(false);
  }

  if (res && !ans.length && show) return (
    <div className="pshow" onClick={() => setShow(false)}>
      <ProfileCard id={res.top} name={me ? me.name.split(' ')[0] : ''} big />
      <p className="muted small">Tap to close</p>
    </div>
  );
  if (res && !ans.length) {
    const p = PROFILES[res.top];
    return (
      <div className="quizres">
        <p className="eyebrow">Your Lordship profile</p>
        <ProfileCard id={res.top} />
        <p className="lead">{p.about}</p>
        {res.next && <p className="muted small">With a dash of {PROFILES[res.next].emoji} {PROFILES[res.next].name}.</p>}
        <div className="card">
          <p><b>Your “Not so, Lord”:</b> {p.notso}</p>
          <p><b>Lay down:</b> {p.down}<br /><b>Take up:</b> {p.up}</p>
          <p className="tiny muted">{p.ref}</p>
        </div>
        <div className="stack">
          <button className="btn primary big" onClick={() => setShow(true)}>👀 Show your neighbour</button>
          {me && <button className="btn soft big" disabled={busy || posted} onClick={post}>{posted ? '✓ On the big screen' : '📽️ Put it on the big screen'}</button>}
          <button className="btn ghost" onClick={() => shareText(`My Lordship profile: ${p.emoji} ${p.name} — “${p.tag}”`, 'My Lordship profile')}>Share</button>
          <button className="linkish" onClick={() => { setRes(null); setPosted(false); }}>Take it again</button>
        </div>
        <a className="btn ghost" href={(church ? '#/church/' : '#/t/') + 'laydown'}>Now for real: my plan vs God’s plan ›</a>
      </div>
    );
  }
  const q = QUIZ[i];
  return (
    <div className="quiz" key={i}>
      <p className="eyebrow">What’s your Lordship profile? · {i + 1}/{QUIZ.length}</p>
      <div className="qdots">{QUIZ.map((_, k) => <i key={k} className={k < i ? 'on' : k === i ? 'cur' : ''} />)}</div>
      <h1>{q.q}</h1>
      <div className="opts">{q.opts.map(([t, p]) => <button key={t} className="opt-btn" onClick={(e) => pick(p, e)}>{t}</button>)}</div>
      {i > 0 && <button className="linkish" onClick={() => setAns(ans.slice(0, -1))}>‹ Back</button>}
    </div>
  );
}

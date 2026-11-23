/* Day 1 game on the phone: watch the big screen, tap an answer. "Who wrote this?" rounds use the fun
   facts from joining; this-or-that polls show counts only. While waiting: ask Uriah anything (anonymous). */
import { useEffect, useRef, useState } from 'react';
import { api, errText } from '../../../core/api.js';
import { authArgs, getMe, saveFact } from '../../../core/account.js';
import { burst, toast } from '../../../core/ui.jsx';

export function useGame(code, ms) {
  const [g, setG] = useState(null);
  useEffect(() => {
    let dead = false, t;
    const tick = async () => {
      try { const r = await api('gameState', Object.assign({ code }, authArgs())); if (!dead) setG(r); } catch (e) { /* offline: keep last */ }
      if (!dead && !document.hidden) t = setTimeout(tick, ms);
      else if (!dead) t = setTimeout(tick, ms * 3);
    };
    tick();
    return () => { dead = true; clearTimeout(t); };
  }, [code, ms]);
  return [g, setG];
}

function AskBox({ code }) {
  const [text, setText] = useState('');
  const [sent, setSent] = useState(0);
  const [busy, setBusy] = useState(false);
  async function send() {
    setBusy(true);
    try { await api('ask', { code, text, topic: 'other' }); setText(''); setSent(sent + 1); toast('Sent anonymously'); } catch (e) { toast(errText(e)); }
    setBusy(false);
  }
  return (
    <div className="card">
      <h3>❓ Ask Uriah anything for the week</h3>
      <p className="small muted">Romance, money, calling, struggles… It’s anonymous — no name goes with it.{sent ? ` ✓ ${sent} sent` : ''}</p>
      <textarea rows={2} maxLength={1200} value={text} onChange={e => setText(e.target.value)} aria-label="Your question" placeholder="Type a question…" />
      <button className="btn soft small" style={{ marginTop: 8 }} disabled={busy || text.trim().length < 3} onClick={send}>Send anonymously</button>
    </div>
  );
}

function FactBox() {
  const me = getMe() || {};
  const [fact, setFact] = useState(me.fact || '');
  const [saved, setSaved] = useState(!!me.fact);
  return (
    <div className="card">
      <h3>🤫 Your fun fact</h3>
      <p className="small muted">The class will guess who wrote it. Something surprising!</p>
      <div className="row"><input value={fact} maxLength={160} onChange={e => { setFact(e.target.value); setSaved(false); }} aria-label="Fun fact" placeholder="I’ve eaten a tarantula…" />
        <button className="btn soft small" disabled={saved || fact.trim().length < 3} onClick={async () => { await saveFact(fact.trim()); setSaved(true); toast('Saved'); }}>{saved ? '✓' : 'Save'}</button></div>
    </div>
  );
}

export default function Game({ code }) {
  const [g, setG] = useGame(code, 2500);
  const [sending, setSending] = useState(false);
  const lastRound = useRef(-1);
  const me = getMe();
  useEffect(() => { if (g && g.round !== lastRound.current) { lastRound.current = g.round; } }, [g]);
  if (!g) return <p className="muted">Loading the game…</p>;
  async function vote(choice, e) {
    if (!me) { toast('Join the class first'); return; }
    setSending(true);
    try { await api('gameVote', Object.assign({ code, round: g.round, choice }, authArgs())); setG(Object.assign({}, g, { mine: choice })); burst(e.currentTarget, 8); }
    catch (x) { toast(x.code === 'CLOSED' ? 'Too late for that one!' : errText(x)); }
    setSending(false);
  }
  const head = <><p className="eyebrow">🎲 Day 1 game</p></>;
  if (g.phase === 'off') return (<>{head}<h1>The game hasn’t started</h1><p className="muted">When Uriah starts it, it’ll appear here. Meanwhile:</p><FactBox /><AskBox code={code} /></>);
  if (g.phase === 'lobby') return (<>{head}<h1>You’re in! 👀</h1><p className="lead">Watch the big screen — {g.joined} joined so far.</p><FactBox /><AskBox code={code} /></>);
  if (g.phase === 'end') return (
    <>{head}<h1>That’s a wrap 🎉</h1>
      {typeof g.myScore === 'number' && <p className="lead">You guessed <b>{g.myScore}</b> right.</p>}
      {g.top && g.top.length > 0 && <div className="card"><h3>Top guessers</h3>{g.top.map((t, i) => <p key={t.id} className="lb"><b>{['🥇', '🥈', '🥉', '4.', '5.'][i]}</b> {t.name} <span>{t.score}</span></p>)}</div>}
      <AskBox code={code} />
    </>
  );
  const isWho = g.kind === 'who';
  const total = g.counts ? (isWho ? Object.values(g.counts).reduce((a, b) => a + b, 0) : g.counts.reduce((a, b) => a + b, 0)) : 0;
  return (
    <div key={g.round} className="gameq">
      {head}
      <p className="muted small">{isWho ? 'Who wrote this?' : 'This or that'}</p>
      <h1 className={isWho ? 'factq' : ''}>{isWho ? `“${g.q}”` : g.q}</h1>
      {g.isMe && !g.reveal && <p className="note small">🤫 That’s yours! Pick someone else to throw them off.</p>}
      {!g.reveal ? (
        <div className={'opts' + (isWho ? ' names' : '')}>
          {(isWho ? g.opts : g.opts.map((o, i) => ({ id: i, name: o }))).map(o => (
            <button key={o.id} className={'opt-btn' + (g.mine === o.id ? ' on' : '')} disabled={sending} onClick={(e) => vote(o.id, e)}>{o.name}</button>
          ))}
        </div>
      ) : isWho ? (
        <div className="reveal card">
          <p className="muted">It was…</p>
          <h2>{g.answer.name}</h2>
          <p className={g.mine === g.answer.id ? 'ok' : 'muted'}>{g.mine === g.answer.id ? '✓ You got it!' : g.mine ? 'Not this time.' : ''} {g.right} of {total} guessed right.</p>
        </div>
      ) : (
        <div className="card">{g.opts.map((o, i) => <div key={i} className="tbar"><span>{o}{g.mine === i ? ' ✓' : ''}</span><div className="bar"><i style={{ width: (total ? g.counts[i] / total * 100 : 0) + '%' }} /></div><b>{g.counts[i]}</b></div>)}</div>
      )}
      {g.mine !== null && g.mine !== undefined && !g.reveal && <p className="ok" style={{ textAlign: 'center' }}>Locked in ✓ — watch the screen</p>}
    </div>
  );
}

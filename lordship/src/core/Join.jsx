/* Joining the class: a name and a 4-digit PIN. New, or back on another phone — then one fun fact for the
   Day 1 game ("Who wrote this?"). Kept as short as possible. */
import { useRef, useState } from 'react';
import { join, signIn, saveFact, getMe, moveClass } from './account.js';
import { errText } from './api.js';
import { Spark } from './ui.jsx';

export function PinBoxes({ value, onChange, label, autoFocus }) {
  const refs = [useRef(), useRef(), useRef(), useRef()];
  const digits = (value + '    ').slice(0, 4).split('');
  const set = (i, d) => {
    const v = (value.slice(0, i) + d + value.slice(i + 1)).replace(/\D/g, '').slice(0, 4);
    onChange(v);
    if (d && i < 3) refs[i + 1].current && refs[i + 1].current.focus();
  };
  return (
    <div className="pin" role="group" aria-label={label}>
      {digits.map((d, i) => (
        <input key={i} ref={refs[i]} className="pinbox" inputMode="numeric" pattern="[0-9]*" maxLength={4} autoComplete="off"
          aria-label={`${label} digit ${i + 1}`} autoFocus={autoFocus && i === 0} type="password" value={d.trim()}
          onChange={e => { const t = e.target.value.replace(/\D/g, ''); if (t.length > 1) { onChange(t.slice(0, 4)); refs[Math.min(3, t.length - 1)].current.focus(); } else set(i, t); }}
          onKeyDown={e => { if (e.key === 'Backspace' && !digits[i].trim() && i > 0) { refs[i - 1].current.focus(); onChange(value.slice(0, i - 1)); } }} />
      ))}
    </div>
  );
}

export default function Join({ cls, onDone, onStart }) {
  const [mode, setMode] = useState('new');
  const [step, setStep] = useState('who');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [fact, setFact] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const MSG = { NAME_TAKEN: 'Someone in this class already has that name. If it’s you, tap “I’ve joined before”. Otherwise add your last initial.',
    NO_NAME: 'No one with that name in this class yet — check the spelling, or tap “I’m new”.', BAD_PIN: mode === 'new' ? 'Your PIN needs 4 numbers.' : 'That PIN doesn’t match. Try again — or ask Uriah to reset it.',
    LOCKED: 'Too many tries. Ask Uriah or Naomi to reset your PIN.', BAD_NAME: 'Type your name.' };
  async function go(e) {
    e && e.preventDefault();
    setErr('');
    if (mode === 'new' && pin !== pin2) { setErr('The two PINs don’t match.'); return; }
    setBusy(true);
    onStart && onStart();
    try {
      const m = mode === 'new' ? await join(cls.code, name, pin) : await signIn(cls.code, name, pin);
      if (mode === 'new' || !m.fact) setStep('fact'); else onDone();
    } catch (x) { setErr(MSG[x.code] || errText(x)); }
    setBusy(false);
  }
  const other = getMe();
  async function moveHere() {
    setBusy(true); setErr('');
    try { await moveClass(cls.code); onDone(); } catch (x) { setErr(x.code === 'NAME_TAKEN' ? 'Someone in this class already has your name. Ask Uriah to move you.' : x.code === 'NO_STUDENT' ? 'Sign in below instead.' : errText(x)); }
    setBusy(false);
  }
  async function finish(skip) {
    if (!skip && fact.trim()) { setBusy(true); try { await saveFact(fact.trim()); } catch (x) { /* keep going */ } setBusy(false); }
    onDone();
  }
  if (step === 'fact') return (
    <div className="joinpage">
      <p className="eyebrow">You’re in 🎉</p>
      <h1>One fun fact</h1>
      <p className="lead">Something surprising about you. In today’s game the class guesses who wrote it!</p>
      <textarea rows={3} maxLength={160} value={fact} onChange={e => setFact(e.target.value)} placeholder="I’ve eaten a tarantula… I was born on a boat… I can juggle…" aria-label="Fun fact" autoFocus />
      <div className="stack">
        <button className="btn primary big" disabled={busy || fact.trim().length < 3} onClick={() => finish(false)}>Save and start</button>
        <button className="linkish" onClick={() => finish(true)}>Skip for now</button>
      </div>
    </div>
  );
  const ready = name.trim().length >= 2 && pin.length === 4 && (mode !== 'new' || pin2.length === 4);
  return (
    <form className="joinpage" onSubmit={go}>
      <p className="eyebrow"><Spark size={14} color="var(--accent)" /> {cls.name}</p>
      <h1>{mode === 'new' ? 'Join the class' : 'Welcome back'}</h1>
      {other && other.code !== cls.code && (
        <div className="card moveclass">
          <p><b>You’re signed in as {other.name}</b> in another class.</p>
          <button type="button" className="btn primary big" disabled={busy} onClick={moveHere}>Move me to {cls.name}</button>
          <p className="tiny muted">Your answers come with you. Or sign in below.</p>
        </div>
      )}
      <div className="seg" role="tablist">
        <button type="button" className={mode === 'new' ? 'on' : ''} onClick={() => { setMode('new'); setErr(''); }}>I’m new</button>
        <button type="button" className={mode === 'back' ? 'on' : ''} onClick={() => { setMode('back'); setErr(''); }}>I’ve joined before</button>
      </div>
      {mode === 'new' && !(other && other.code !== cls.code) && <p className="note small">Already joined Lordship — even in another class? Tap <button type="button" className="linkish" onClick={() => { setMode('back'); setErr(''); }}><b>I’ve joined before</b></button>: your name and PIN bring you and your answers here.</p>}
      <label className="lab" htmlFor="jname">Your name</label>
      <input id="jname" value={name} onChange={e => setName(e.target.value)} autoComplete="given-name" autoCapitalize="words" maxLength={40} placeholder="First name (and last initial)" />
      <label className="lab">{mode === 'new' ? 'Choose a 4-number PIN' : 'Your 4-number PIN'}</label>
      <PinBoxes value={pin} onChange={setPin} label="PIN" />
      {mode === 'new' && <><label className="lab">Type it again</label><PinBoxes value={pin2} onChange={setPin2} label="PIN again" /></>}
      {err && <p className="err">{err}</p>}
      <button className="btn primary big" style={{ marginTop: 16 }} disabled={busy || !ready}>{busy ? '…' : mode === 'new' ? 'Join' : 'Sign in'}</button>
      <p className="tiny muted" style={{ marginTop: 12 }}>Your name and PIN keep your answers safe on any phone. Uriah and Naomi see your name — never your answers. The question box stays anonymous.</p>
    </form>
  );
}

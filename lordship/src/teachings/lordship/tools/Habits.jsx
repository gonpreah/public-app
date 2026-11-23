/* 8. Habit tracker: "take up" items become daily habits with check-offs and streaks. */
import { useState } from 'react';
import { useLocal, todayStr, addDays } from '../../../core/store.js';
import { K, addHabit, streakOf } from '../state.js';
import { burst } from '../../../core/ui.jsx';
import { DAILY_OBEDIENCE } from '../content.js';

export default function Habits() {
  const [hs, setHs] = useLocal(K.habits, []);
  const [list] = useLocal(K.list, []);
  const [name, setName] = useState('');
  const t = todayStr();
  const toggle = (id) => setHs(hs.map(h => {
    if (h.id !== id) return h;
    const days = Object.assign({}, h.days);
    if (days[t]) delete days[t]; else days[t] = true;
    return Object.assign({}, h, { days });
  }));
  const last14 = Array.from({ length: 14 }, (_, i) => addDays(t, i - 13));
  const ideas = list.map(x => x.takeup || x.yes).filter(Boolean).filter(x => !hs.some(h => h.name.toLowerCase() === x.toLowerCase())).slice(0, 5);
  const doneToday = hs.filter(h => h.days[t]).length;
  return (
    <>
      <p className="eyebrow">Romans 12:1</p>
      <h1>Daily habits</h1>
      <p className="muted">Small, daily yeses. Tick each one when you’ve done it today.</p>
      {hs.length > 0 && <p className="lead"><b>{doneToday} of {hs.length}</b> done today</p>}
      <div className="card">
        {!hs.length && <p className="muted">No habits yet. Add one below, or turn a “take up” from your list into a habit.</p>}
        {hs.map(h => {
          const s = streakOf(h.days, t);
          return (
            <div className="habit" key={h.id}>
              <button className={'tick' + (h.days[t] ? ' on' : '')} onClick={(e) => { if (!h.days[t]) burst(e.currentTarget, 10); toggle(h.id); }} aria-pressed={!!h.days[t]} aria-label={'Done today: ' + h.name}>{h.days[t] ? '✓' : ''}</button>
              <div className="grow">
                <b>{h.name}</b>
                <div className="days14" aria-hidden="true">{last14.map(d => <i key={d} className={h.days[d] ? 'on' : ''} />)}</div>
              </div>
              <span className="streak">{s ? `🔥 ${s}` : ''}</span>
              <button className="linkish" aria-label={'Remove ' + h.name} onClick={() => { if (confirm('Remove this habit?')) setHs(hs.filter(x => x.id !== h.id)); }}>✕</button>
            </div>
          );
        })}
      </div>
      <form className="row" onSubmit={e => { e.preventDefault(); if (addHabit(name)) setName(''); }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="A new habit, e.g. 10 minutes in the Word" maxLength={120} aria-label="New habit" />
        <button className="btn primary" disabled={!name.trim()}>Add</button>
      </form>
      <h4>One daily act of obedience</h4>
      <p className="muted small">Plod, don’t sprint: small enough to do tomorrow, and the next day.</p>
      <div className="chips">{DAILY_OBEDIENCE.filter(i => !hs.some(h => h.name.toLowerCase() === i.toLowerCase())).map(i => <button key={i} className="chip" onClick={() => addHabit(i)}>+ {i}</button>)}</div>
      {ideas.length > 0 && (
        <>
          <h4>From your take-up list</h4>
          <div className="chips">{ideas.map(i => <button key={i} className="chip" onClick={() => addHabit(i)}>+ {i}</button>)}</div>
        </>
      )}
    </>
  );
}

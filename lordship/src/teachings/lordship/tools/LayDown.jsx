/* 3. Lay Down, Take Up: walk through areas of life; the coach asks "What's my 'Not so, Lord' here?
   What is God asking me to pick up?" Each saved answer goes on the personal list. */
import { useState } from 'react';
import { LIFE_AREAS } from '../content.js';
import { useLocal } from '../../../core/store.js';
import { K, addToList, addHabit } from '../state.js';
import Coach from '../../../core/Coach.jsx';
import { toast } from '../../../core/ui.jsx';

export default function LayDown({ code, church }) {
  const [area, setArea] = useState(null);
  const [list] = useLocal(K.list, []);
  const [saved, setSaved] = useState(null);
  const done = (id) => list.some(x => x.areaId === id);
  const a = LIFE_AREAS.find(x => x.id === area);
  const base = church ? '#/church/' : '#/t/';

  if (!a) return (
    <>
      <p className="eyebrow">Luke 9:23</p>
      <h1>Lay Down, Take Up</h1>
      <p className="lead">“Let him deny himself, take up his cross daily, and follow me.”</p>
      <p className="muted">Pick an area. The coach will ask a few questions: what’s my “Not so, Lord” here, and what is God asking me to pick up? Go through as many as you like.</p>
      <div className="tiles">
        {LIFE_AREAS.map(x => (
          <button key={x.id} className="tile" style={{ textAlign: 'left', border: 0, cursor: 'pointer' }} onClick={() => { setArea(x.id); setSaved(null); window.scrollTo(0, 0); }}>
            <span className="em">{done(x.id) ? '✅' : x.emoji}</span><span><b>{x.name}</b><small>{x.hint}</small></span>
          </button>
        ))}
      </div>
      <a className="btn ghost" href={base + 'list'}>My list ({list.length})</a>
    </>
  );

  return (
    <>
      <button className="back linkish" onClick={() => setArea(null)}>‹ All areas</button>
      <p className="eyebrow">Lay Down, Take Up</p>
      <h1>{a.emoji} {a.name}</h1>
      <p className="muted">{a.hint}</p>
      <Coach tool="laydown" code={code} context={`The area of life: ${a.name} (${a.hint})`} storeKey={K.chat('laydown', a.id + (church ? '.church' : ''))}
        intro={`The coach will ask about ${a.name.toLowerCase()} — one question at a time.`}
        saveLabel="Save to my list"
        onSaved={(r) => { setSaved(addToList({ from: 'Lay Down, Take Up', areaId: a.id, area: a.name, notSoLord: r.notSoLord, laydown: r.laydown, takeup: r.takeup })); toast('Saved to your list'); }} />
      {saved && (
        <div className="card">
          <h3>On your list</h3>
          <div className="kv"><b>Not so, Lord</b><span>{saved.notSoLord}</span><b>Lay down</b><span>{saved.laydown}</span><b>Take up</b><span>{saved.takeup}</span></div>
          <div className="row wrap">
            <button className="btn soft small" onClick={() => toast(addHabit(saved.takeup) ? 'Added to your habits' : 'Already a habit')}>Make it a daily habit</button>
            <button className="btn ghost small" onClick={() => setArea(null)}>Next area</button>
          </div>
        </div>
      )}
    </>
  );
}

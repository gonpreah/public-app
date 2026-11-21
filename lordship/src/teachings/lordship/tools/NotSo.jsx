/* The "Not so, Lord" reflection (Acts 10:14) — in class and church mode. */
import { useState } from 'react';
import { CHURCH, TEACHING } from '../content.js';
import { useLocal } from '../../../core/store.js';
import { K, addToList } from '../state.js';
import Coach from '../../../core/Coach.jsx';
import { toast } from '../../../core/ui.jsx';

export default function NotSo({ code, church }) {
  const n = CHURCH.notSo;
  const [notes, setNotes] = useLocal('lordship.notso', {});
  const [saved, setSaved] = useState(null);
  const ctx = n.questions.map((q, i) => notes[i] ? `${q}\nMy answer: ${notes[i]}` : '').filter(Boolean).join('\n\n');
  return (
    <>
      <p className="eyebrow">A reflection</p>
      <h1>“Not so, Lord”</h1>
      <div className="scripture"><b>{n.ref}</b><p>{n.text}</p></div>
      <p className="tiny muted">{TEACHING.translation}</p>
      <p>Peter called Jesus “Lord” and said “not so” in the same breath. Most of us do. Lordship isn’t a one-time decision; it’s a daily yes — and it leads to joy.</p>
      <div className="card">
        {n.questions.map((q, i) => (
          <div key={i}><label className="lab">{q}</label>
            <textarea rows={2} value={notes[i] || ''} onChange={e => setNotes(Object.assign({}, notes, { [i]: e.target.value }))} placeholder="Just for you — stays on this phone" /></div>
        ))}
      </div>
      <Coach tool="notso" code={code} context={ctx} storeKey={K.chat('notso', church ? 'church' : '')}
        intro="Want to talk it through? The coach will help you find one place to say yes."
        saveLabel="Save my yes"
        onSaved={(r) => { setSaved(addToList({ from: 'Not so, Lord', area: 'Not so, Lord', notSoLord: r.notSoLord, yes: r.yes })); toast('Saved to your list'); }} />
      {saved && <div className="note"><b>Your yes:</b> {saved.yes}</div>}
    </>
  );
}

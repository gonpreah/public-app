/* My lay down / take up list: everything saved from the wheel, the coach and the reflection. */
import { useState } from 'react';
import { useLocal } from '../../../core/store.js';
import { K, addHabit } from '../state.js';
import { toast, shareText } from '../../../core/ui.jsx';

export default function List({ church }) {
  const [list, setList] = useLocal(K.list, []);
  const [edit, setEdit] = useState(null);
  const text = list.map(x => `${x.area ? x.area + ': ' : ''}lay down ${x.laydown || '—'}; take up ${x.takeup || x.yes || '—'}`).join('\n');
  return (
    <>
      <p className="eyebrow">Personal</p>
      <h1>My lay down / take up list</h1>
      {!list.length && <p className="muted">Nothing yet. Try the <a href={church ? '#/church/wheel' : '#/t/wheel'}>wheel</a> or <a href={church ? '#/church/laydown' : '#/t/laydown'}>Lay Down, Take Up</a>.</p>}
      {list.map(x => (
        <div className="card" key={x.id}>
          <p className="muted tiny">{x.from} · {x.at}</p>
          {edit === x.id ? (
            <EditItem x={x} onDone={(nx) => { setList(list.map(y => y.id === x.id ? nx : y)); setEdit(null); }} />
          ) : (
            <>
              <h3>{x.area || 'Reflection'}</h3>
              <div className="kv">
                {x.notSoLord && <><b>Not so, Lord</b><span>{x.notSoLord}</span></>}
                {x.laydown && <><b>Lay down</b><span>{x.laydown}</span></>}
                {(x.takeup || x.yes) && <><b>Take up</b><span>{x.takeup || x.yes}</span></>}
              </div>
              <div className="row wrap">
                {(x.takeup || x.yes) && <button className="btn soft small" onClick={() => toast(addHabit(x.takeup || x.yes) ? 'Added to your habits' : 'Already a habit')}>Make it a habit</button>}
                <button className="linkish" onClick={() => setEdit(x.id)}>Edit</button>
                <button className="linkish" onClick={() => { if (confirm('Remove this from your list?')) setList(list.filter(y => y.id !== x.id)); }}>Remove</button>
              </div>
            </>
          )}
        </div>
      ))}
      {list.length > 0 && <button className="btn ghost" onClick={() => shareText('My lay down / take up list\n\n' + text, 'My list')}>Share or copy my list</button>}
    </>
  );
}

function EditItem({ x, onDone }) {
  const [v, setV] = useState(x);
  const f = (k, label) => <><label className="lab">{label}</label><input value={v[k] || ''} onChange={e => setV(Object.assign({}, v, { [k]: e.target.value }))} /></>;
  return (
    <>
      {f('area', 'Area')}{f('notSoLord', 'Not so, Lord')}{f('laydown', 'Lay down')}{f(x.yes && !x.takeup ? 'yes' : 'takeup', 'Take up')}
      <div className="row"><button className="btn primary small" onClick={() => onDone(v)}>Save</button></div>
    </>
  );
}

/* Thursday's response: write your backup plan, tear it up, pray "Jesus, you're my only plan."
   Burn the ships (Cortés), Elisha burns the plow (1 Kings 19:19–21), the woman breaks the jar (Mark 14:3). */
import { useState } from 'react';
import { useLocal, todayStr } from '../../../core/store.js';
import { addToList } from '../state.js';
import { burst } from '../../../core/ui.jsx';
import { api } from '../../../core/api.js';

const phoneId = () => { try { const k = 'gp.lordship.pollId'; let v = localStorage.getItem(k); if (!/^[a-z0-9]{16}$/.test(v || '')) { v = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join(''); localStorage.setItem(k, v); } return v; } catch (e) { return ''; } };

export default function Backup({ code }) {
  const [done, setDone] = useLocal('lordship.backup', null);
  const [text, setText] = useState('');
  const [tearing, setTearing] = useState(false);
  function tear(e) {
    const t = text.trim().slice(0, 300);
    if (!t) return;
    setTearing(true); burst(e.currentTarget, 30);
    addToList({ from: 'Burn the ships', area: 'My backup plan', laydown: t });
    if (code) api('burnAdd', { code, rid: phoneId() }).catch(() => {});   /* only a count for the screen, never the words */
    setTimeout(() => { setDone({ at: todayStr() }); setTearing(false); setText(''); }, 1100);
  }
  return (
    <>
      <p className="eyebrow">1 Kings 19:19–21 · Mark 14:3</p>
      <h1>Burn the ships</h1>
      <p className="lead">Cortés burned his ships. Elisha burned his plow. The woman broke her jar. No way back — and no need for one.</p>
      {done && !tearing ? (
        <div className="card torn">
          <p className="hand">Jesus, you’re my only plan.</p>
          <p className="muted small">Torn up on {done.at}. It’s on your lay down list — only you can see it. The screen shows only how many ships are burned.</p>
          <button className="linkish" onClick={() => setDone(null)}>Write another</button>
        </div>
      ) : (
        <div className={'card backup' + (tearing ? ' tearing' : '')}>
          <label className="lab" htmlFor="backup">My backup plan — the ship I keep ready in case God doesn’t come through</label>
          <textarea id="backup" rows={4} value={text} maxLength={300} onChange={e => setText(e.target.value)} placeholder="If this doesn’t work out, I’ll just…" />
          <button className="btn primary big" disabled={!text.trim() || tearing} onClick={tear}>✂️ Tear it up</button>
          <p className="tiny muted">Private. Then pray: “Jesus, you’re my only plan.”</p>
        </div>
      )}
    </>
  );
}

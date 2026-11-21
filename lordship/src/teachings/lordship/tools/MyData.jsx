/* "Save my work": everything stays on this phone, so back it up with a code (no account) or a file,
   and bring it back on a new phone or browser. */
import { useState } from 'react';
import { useLocal } from '../../../core/store.js';
import { saveToCloud, loadFromCloud, downloadFile, loadFile, collect } from '../../../core/backup.js';
import { errText } from '../../../core/api.js';
import { toast, copyText } from '../../../core/ui.jsx';

export default function MyData() {
  const [code, setCode] = useLocal('lordship.backupCode', '');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [inCode, setInCode] = useState('');
  const items = Object.keys(collect()).length;
  async function save() {
    setBusy('save'); setErr('');
    try { const c = await saveToCloud(code); setCode(c); toast('Saved'); } catch (e) { setErr(errText(e)); }
    setBusy('');
  }
  async function load() {
    if (!confirm('Bring back your saved work? It replaces what’s on this phone now.')) return;
    setBusy('load'); setErr('');
    try { const n = await loadFromCloud(inCode); setCode(inCode.toUpperCase()); toast(`Restored ${n} things`); setInCode(''); } catch (e) { setErr(errText(e)); }
    setBusy('');
  }
  return (
    <>
      <p className="eyebrow">Don’t lose it</p>
      <h1>Save my work</h1>
      <p className="muted">Your answers live only on this phone. A new phone, a cleared browser, or moving from Safari to the Home Screen app starts empty — so save a copy.</p>
      <div className="card">
        <h3>Save with a code</h3>
        <p className="small muted">No account. Anyone with the code can open what you saved, so keep it to yourself.</p>
        {code && <p className="bigcode" aria-label="Your code">{code} <button className="linkish" onClick={() => copyText(code)}>Copy</button></p>}
        <button className="btn primary" disabled={!!busy || !items} onClick={save}>{busy === 'save' ? 'Saving…' : code ? 'Save again (same code)' : 'Save and get my code'}</button>
        {code && <p className="tiny muted">Write it down or screenshot it. Saving again updates the same code.</p>}
      </div>
      <div className="card">
        <h3>Bring it back</h3>
        <div className="row"><input value={inCode} onChange={e => setInCode(e.target.value.toUpperCase())} placeholder="ABCDE-FGHJK" aria-label="Your code" autoCapitalize="characters" />
          <button className="btn soft" disabled={!!busy || inCode.replace(/[^A-Z0-9]/gi, '').length !== 10} onClick={load}>{busy === 'load' ? '…' : 'Restore'}</button></div>
      </div>
      {err && <p className="err">{err}</p>}
      <div className="card">
        <h3>Or keep a file</h3>
        <div className="row wrap">
          <button className="btn ghost small" onClick={downloadFile}>Download my work</button>
          <label className="btn ghost small">Restore from a file
            <input type="file" hidden accept="application/json,.json" onChange={async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; try { toast(`Restored ${await loadFile(f)} things`); } catch (x) { setErr('That file didn’t work.'); } }} />
          </label>
        </div>
      </div>
    </>
  );
}

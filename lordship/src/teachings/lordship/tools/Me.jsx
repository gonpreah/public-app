/* Me: who I'm signed in as, whether my answers are saved to my account, my fun fact, sign out. */
import { useEffect, useState } from 'react';
import { getMe, signOut, pushNow, syncStatus, saveFact, moveClass } from '../../../core/account.js';
import { errText } from '../../../core/api.js';
import { toast } from '../../../core/ui.jsx';

export default function Me() {
  const [me, setMe] = useState(getMe());
  const [st, setSt] = useState(syncStatus());
  const [fact, setFact] = useState((getMe() || {}).fact || '');
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const a = () => setMe(getMe()), b = (e) => setSt(e.detail);
    window.addEventListener('gp-me', a); window.addEventListener('gp-sync', b);
    return () => { window.removeEventListener('gp-me', a); window.removeEventListener('gp-sync', b); };
  }, []);
  if (!me) return <p className="muted">Not signed in.</p>;
  const label = { saving: 'Saving…', saved: '✓ Saved to your account', offline: 'Offline — will save when you’re back', idle: '✓ Saved to your account' }[st] || '';
  return (
    <>
      <p className="eyebrow">Me</p>
      <h1>{me.name}</h1>
      <div className="card">
        <p><b>{label}</b></p>
        <p className="small muted">Sign in with your name and PIN on any phone and your answers come with you. Uriah and Naomi see your name, never your answers.</p>
        <button className="btn soft small" onClick={() => pushNow().then(() => toast('Saved'))}>Save now</button>
      </div>
      <div className="card">
        <h3>My fun fact</h3>
        <div className="row"><input value={fact} maxLength={160} onChange={e => setFact(e.target.value)} aria-label="Fun fact" />
          <button className="btn soft small" onClick={async () => { await saveFact(fact.trim()); toast('Saved'); }}>Save</button></div>
      </div>
      <div className="card">
        <h3>Move to another class</h3>
        <p className="small muted">In the wrong class? Type the new class code from Uriah or Naomi. Your answers come with you.</p>
        <form className="row" onSubmit={async e => { e.preventDefault(); setBusy(true); try { const c = await moveClass(to); toast('You’re in ' + c.name); setTo(''); location.hash = '#/class'; } catch (x) { toast(x.code === 'NAME_TAKEN' ? 'Someone there already has your name — ask Uriah to move you.' : errText(x)); } setBusy(false); }}>
          <input value={to} maxLength={12} autoCapitalize="characters" autoComplete="off" aria-label="New class code" placeholder="New class code" onChange={e => setTo(e.target.value.toUpperCase())} />
          <button className="btn primary small" disabled={busy || to.trim().length < 4}>Move</button>
        </form>
      </div>
      <a className="btn ghost small" href="#/t/data">Download a copy of my answers</a>
      <p className="small muted">Forgot your PIN? Ask Uriah or Naomi — they can set a new one.</p>
      <button className="btn ghost" onClick={() => { if (confirm('Sign out on this phone? Your answers stay saved to your account.')) { signOut(); location.hash = '#/class'; } }}>Sign out</button>
    </>
  );
}

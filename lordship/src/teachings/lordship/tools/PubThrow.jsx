/* The whole-group throw-down: ymlordship.netlify.app/?throwdown — no class code or account, like Monday's quiz.
   A first name and DTS / DBS / Staff / Visitor (remembered from the quiz), then: I'm throwing down… I'm picking up…
   my first step in 30 days. Declared, it counts on the big screen (#/throwdown-all); the words go up only if they choose. */
import { useEffect, useRef, useState } from 'react';
import { useLocal, todayStr, addDays } from '../../../core/store.js';
import { api, errText } from '../../../core/api.js';
import { burst, shareText, toast } from '../../../core/ui.jsx';
import { downloadIcs } from '../../../core/ics.js';
import Qr from '../../../core/Qr.jsx';
import { GROUPS } from './PubQuiz.jsx';
import { ThrowExamples } from './Commit.jsx';

const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');

export default function PubThrow() {
  const [me, setMe] = useLocal('lordship.pubquiz', null);
  const [t, setT] = useLocal('lordship.pubthrow', {});
  const [name, setName] = useState((me && me.name) || '');
  const [group, setGroup] = useState((me && me.group) || '');
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setT(Object.assign({}, t, { [k]: v }));
  const sentence = () => `I’m throwing down ${t.down}. I’m picking up ${t.up}.${t.step ? ` My first step in 30 days: ${t.step}.` : ''}`;

  if (!me || !me.name || !me.group) return (
    <div className="pubquiz">
      <p className="eyebrow">Lordship · the throw-down</p>
      <h1>What are you <em>throwing down?</em></h1>
      <p className="muted">No sign-in. Your first name and group, then your throw-down.</p>
      <form className="card" onSubmit={e => { e.preventDefault(); const n = name.trim(); if (n && group) setMe({ name: n.split(/\s+/)[0].slice(0, 20), group, rid: (me && me.rid) || newId() }); }}>
        <label className="lab" htmlFor="ptname">Your first name</label>
        <input id="ptname" value={name} maxLength={20} autoComplete="given-name" onChange={e => setName(e.target.value)} placeholder="First name" />
        <p className="lab">I’m…</p>
        <div className="chips big">{GROUPS.map(([id, l]) => <button type="button" key={id} className={'chip' + (group === id ? ' on' : '')} aria-pressed={group === id} onClick={() => setGroup(id)}>{l}</button>)}</div>
        <button className="btn primary big" style={{ marginTop: 14 }} disabled={!name.trim() || !group}>Next</button>
      </form>
    </div>
  );

  async function declare(e) {
    const el = e.currentTarget;
    setBusy(true);
    try {
      await api('pubThrow', { rid: me.rid, name: me.name, group: me.group, text: sentence(), show: !!t.show });
      setT(Object.assign({}, t, { at: todayStr() })); burst(el, 30);
    } catch (x) { toast(errText(x)); }
    setBusy(false);
  }

  if (t.at) return (
    <div className="pubquiz">
      <div className="declare">
        <p className="hand">I’m all in.</p>
        <p className="big">“{sentence()}”</p>
        <p>{me.name} · declared {t.at}</p>
      </div>
      <p className="muted" style={{ textAlign: 'center' }}>Say it out loud. Then tell someone who will ask you about it.</p>
      <div className="stack">
        <button className="btn soft big" onClick={() => downloadIcs([7, 14, 30].map(n => ({ date: addDays(t.at, n), title: `Did you take your step? (day ${n})`, text: sentence() })), 'my-throw-down.ics')}>📅 Remind me at 7, 14 and 30 days</button>
        <button className="btn ghost" onClick={() => shareText(`My throw-down (${t.at}):\n\n“${sentence()}”\n\nWould you ask me about it in 30 days?`, 'My throw-down')}>Share with a friend or mentor</button>
        <button className="linkish" onClick={() => set('at', '')}>Change it</button>
      </div>
    </div>
  );

  const ready = (t.down || '').trim() && (t.up || '').trim() && (t.step || '').trim();
  return (
    <div className="pubquiz">
      <p className="eyebrow">{me.name} · {GROUPS.find(g => g[0] === me.group)[1]} · <button className="linkish" onClick={() => setMe(Object.assign({}, me, { name: '', group: '' }))}>not you?</button></p>
      <h1>The throw-down</h1>
      <p className="lead">Easy to die for Jesus. Hard to live for him. Lay something down, pick something up, and take one step in the next 30 days.</p>
      <ThrowExamples onPick={(x) => setT(Object.assign({}, t, x))} />
      <div className="card">
        {[['down', '🚩 I’m throwing down…', 'e.g. my backup plan, doing this alone'], ['up', '🙌 I’m picking up…', 'e.g. a mentor, two years of staffing'], ['step', '👣 My first step in the next 30 days…', 'e.g. ask Naomi to mentor me this Sunday']].map(([k, l, ph]) => (
          <div className="pf" key={k}><label className="lab" htmlFor={'pt' + k}>{l}</label>
            <input id={'pt' + k} value={t[k] || ''} maxLength={k === 'step' ? 70 : 50} placeholder={ph} onChange={e => set(k, e.target.value)} /></div>
        ))}
        <label className="lockin"><input type="checkbox" checked={!!t.show} onChange={e => set('show', e.target.checked)} /> Put my words on the big screen (with my first name)</label>
        <p className="tiny muted">Not ticked, the screen only counts you — your words stay on your phone.</p>
        <button className="btn primary big" disabled={!ready || busy} onClick={declare}>🚩 Throw it down</button>
      </div>
    </div>
  );
}

/* The projector: #/throwdown-all */
export function PubThrowResults() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useLocal('lordship.pttab', 'all');
  const [names, setNames] = useLocal('lordship.ptnames', true);
  const timer = useRef(null);
  const link = location.origin + '/?throwdown';
  useEffect(() => {
    let live = true;
    const tick = () => api('pubThrowResults', {}).then(x => { if (live) { setD(x); setErr(''); } }).catch(e => live && setErr(errText(e)))
      .finally(() => { if (live) timer.current = setTimeout(tick, document.hidden ? 10000 : 3000); });
    tick();
    return () => { live = false; clearTimeout(timer.current); };
  }, []);
  async function reset() {
    let pw = ''; try { pw = sessionStorage.getItem('ls-admin') || ''; } catch (e) { /* */ }
    if (!pw) pw = prompt('Admin password to clear the throw-down') || '';
    if (!pw || !confirm('Clear every throw-down and start again?')) return;
    try { await api('pubThrowReset', { pw }); try { sessionStorage.setItem('ls-admin', pw); } catch (e) { /* */ } setD(await api('pubThrowResults', {})); }
    catch (e) { toast(errText(e)); }
  }
  const n = d ? d.totals[tab] : 0;
  const recent = d ? d.recent.filter(r => tab === 'all' || r.g === tab) : [];
  return (
    <div className="screen qresults tdall">
      <div className="screen-main">
        <p className="eyebrow">Lordship · the throw-down</p>
        <div className="qr-tabs" role="tablist">{[['all', 'All']].concat(GROUPS.slice(0, 3)).map(([id, l]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{l} <small>{d ? d.totals[id] : ''}</small></button>))}</div>
        <p className="td-big" key={n}>{d ? n : '…'}</p>
        <h1 className="screen-q">thrown down 🚩</h1>
        {err && <p className="err">{err}</p>}
        {names && <div className="td-wall">{recent.slice(0, 18).map((r, i) => (
          <div key={r.n + i} className={'td-card' + (r.w ? ' words' : '')}><b>🚩 {r.n}</b>{r.w && <span>{r.w}</span>}</div>))}</div>}
        <div className="qr-tools">
          <button className="linkish" onClick={() => setNames(!names)}>{names ? 'Hide names' : 'Show names'}</button>
          <button className="linkish" onClick={reset}>Reset</button>
        </div>
      </div>
      <div className="screen-qr">
        <Qr text={link} size={280} />
        <p><b>Scan to throw down</b> · no sign-in<br />{link.replace(/^https?:\/\//, '')}</p>
      </div>
    </div>
  );
}

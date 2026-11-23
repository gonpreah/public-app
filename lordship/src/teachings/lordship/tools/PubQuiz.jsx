/* The base-wide profile quiz: ymlordship.netlify.app/?quiz — no class code, PIN or account.
   A first name and DTS / DBS / Staff / Visitor, then the quiz; the result goes to the live results
   (#/quiz-results) for the projector, never into the class list. */
import { useEffect, useRef, useState } from 'react';
import { PROFILES } from '../content.js';
import { useLocal } from '../../../core/store.js';
import { api, errText } from '../../../core/api.js';
import { toast } from '../../../core/ui.jsx';
import Qr from '../../../core/Qr.jsx';
import Quiz from './Quiz.jsx';
import Avatar from './Avatars.jsx';

export const GROUPS = [['dts', 'DTS'], ['dbs', 'DBS'], ['staff', 'Staff'], ['visitor', 'Visitor']];
const RES_KEY = 'lordship.pubquiz.res';
const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');

export default function PubQuiz() {
  const [me, setMe] = useLocal('lordship.pubquiz', null);
  const [name, setName] = useState((me && me.name) || '');
  const [group, setGroup] = useState((me && me.group) || '');
  const [sent, setSent] = useState('');
  const [, setRes] = useLocal(RES_KEY, null);

  async function send(r) {
    try { await api('pubQuiz', { rid: me.rid, name: me.name, group: me.group, profile: r.top }); setSent(r.top); toast('You’re on the big screen!'); }
    catch (e) { toast(errText(e)); }
  }
  if (!me || !me.name || !me.group) return (
    <div className="pubquiz">
      <div className="pq-faces" aria-hidden="true">{Object.keys(PROFILES).map((k, i) => <span key={k} style={{ animationDelay: i * 90 + 'ms' }}><Avatar id={k} size={54} /></span>)}</div>
      <p className="eyebrow">Lordship · just for fun</p>
      <h1>What’s your <em>Lordship profile?</em></h1>
      <p className="muted">8 quick questions. No sign-in. Watch the results live on the big screen.</p>
      <form className="card" onSubmit={e => { e.preventDefault(); const n = name.trim(); if (n && group) { setRes(null); setMe({ name: n.split(/\s+/)[0].slice(0, 20), group, rid: (me && me.rid) || newId() }); } }}>
        <label className="lab" htmlFor="pqname">Your first name</label>
        <input id="pqname" value={name} maxLength={20} autoComplete="given-name" onChange={e => setName(e.target.value)} placeholder="First name" />
        <p className="lab">I’m…</p>
        <div className="chips big">{GROUPS.map(([id, l]) => <button type="button" key={id} className={'chip' + (group === id ? ' on' : '')} aria-pressed={group === id} onClick={() => setGroup(id)}>{l}</button>)}</div>
        <button className="btn primary big" style={{ marginTop: 14 }} disabled={!name.trim() || !group}>Start the quiz</button>
      </form>
    </div>
  );
  return (
    <div className="pubquiz">
      <Quiz church storeKey={RES_KEY} pubName={me.name} onResult={send} posted={sent} />
      <p className="tiny muted center">{me.name} · {GROUPS.find(g => g[0] === me.group)[1]} · <button className="linkish" onClick={() => { setMe(Object.assign({}, me, { name: '', group: '' })); setSent(''); }}>not you?</button></p>
    </div>
  );
}

/* The projector: big bars, updating every 3 seconds, with All / DTS / DBS / Staff tabs. */
export function QuizResults() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useLocal('lordship.pqtab', 'all');
  const [names, setNames] = useLocal('lordship.pqnames', true);
  const timer = useRef(null);
  const link = location.origin + '/?quiz';
  useEffect(() => {
    let live = true;
    const tick = () => api('pubQuizResults', {}).then(x => { if (live) { setD(x); setErr(''); } }).catch(e => live && setErr(errText(e)))
      .finally(() => { if (live) timer.current = setTimeout(tick, document.hidden ? 10000 : 3000); });
    tick();
    return () => { live = false; clearTimeout(timer.current); };
  }, []);
  async function reset() {
    let pw = ''; try { pw = sessionStorage.getItem('ls-admin') || ''; } catch (e) { /* */ }
    if (!pw) pw = prompt('Admin password to clear the results') || '';
    if (!pw || !confirm('Clear every result and start again?')) return;
    try { await api('pubQuizReset', { pw }); try { sessionStorage.setItem('ls-admin', pw); } catch (e) { /* */ } setD(null); toast('Cleared'); api('pubQuizResults', {}).then(setD); }
    catch (e) { toast(errText(e)); }
  }
  const counts = d ? d.counts[tab] : {};
  const total = d ? d.totals[tab] : 0;
  const order = Object.keys(PROFILES).sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
  const max = Math.max(1, ...order.map(k => counts[k] || 0));
  const lead = total && order[0];
  const recent = d ? d.recent.filter(r => tab === 'all' || r.g === tab) : [];
  return (
    <div className="screen qresults">
      <div className="screen-main">
        <p className="eyebrow">Lordship · live results</p>
        <h1 className="screen-q">What’s your <em>Lordship profile?</em></h1>
        <div className="qr-tabs" role="tablist">{[['all', 'All']].concat(GROUPS.slice(0, 3)).map(([id, l]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{l} <small>{d ? d.totals[id] : ''}</small></button>))}</div>
        {err && <p className="err">{err}</p>}
        {!total && <p className="screen-ref">Waiting for the first results… scan the code to play.</p>}
        <div className="qbars">{order.map(k => {
          const n = counts[k] || 0;
          return (
            <div key={k} className={'qbar' + (k === lead ? ' lead' : '') + (n ? '' : ' zero')}>
              <Avatar id={k} size={64} />
              <span className="qbar-name">{PROFILES[k].name}</span>
              <div className="qbar-track"><i style={{ width: n / max * 100 + '%' }} /></div>
              <b>{n}</b>
            </div>
          );
        })}</div>
        {names && recent.length > 0 && <div className="qrecent">{recent.slice(0, 12).map((r, i) => <span key={r.n + r.p + i} className="pchip"><Avatar id={r.p} size={26} /> {r.n} <em>{GROUPS.find(g => g[0] === r.g)[1]}</em></span>)}</div>}
        <div className="qr-tools">
          <button className="linkish" onClick={() => setNames(!names)}>{names ? 'Hide names' : 'Show names'}</button>
          <button className="linkish" onClick={reset}>Reset</button>
        </div>
      </div>
      <div className="screen-qr">
        <Qr text={link} size={280} />
        <p><b>Scan to play</b> · no sign-in<br />{link.replace(/^https?:\/\//, '')}</p>
        <p className="qr-total"><b>{d ? d.totals.all : 0}</b> played</p>
      </div>
    </div>
  );
}

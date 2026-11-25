/* Live polls for a room or a Zoom call: ymlordship.netlify.app/?poll=<id> — no name, no sign-in, one tap a question.
   The results (#/poll-results/<id>) are made for sharing your screen: big bars, live every 3 seconds, the link to paste. */
import { useEffect, useRef, useState } from 'react';
import { LIVE_POLLS, PICK_UP } from '../content.js';
import { useLocal } from '../../../core/store.js';
import { api, errText } from '../../../core/api.js';
import { burst, copyText, toast } from '../../../core/ui.jsx';
import { addHabit, addToList } from '../state.js';
import Qr from '../../../core/Qr.jsx';
import { Bingo, BingoBars, SortBars, QuizBars } from './Games.jsx';

const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');
export const pollLink = (id, room) => location.origin + '/?poll=' + id + (room ? '&room=' + room : '');

/* Moses' staff: the thing laid down, picked back up God's way. */
export function PickUp({ area, opts }) {
  const u = PICK_UP[area], o = (opts || []).find(x => x[0] === area);
  if (!u) return null;
  return (
    <div className="card pickup">
      <p className="eyebrow">{o ? o[1] + ' ' + o[2] : ''} · picked back up</p>
      <h2>{u.up}</h2>
      <p>{u.how}</p>
      <div className="scripture"><b>{u.ref}</b><p>{u.text}</p></div>
      <p><b>Ask God:</b> “{u.ask}”</p>
      <p><b>One small step:</b> {u.step}</p>
    </div>
  );
}

/* In class: keep it — the "never" goes on my lay down list; the step to pick it back up becomes a daily habit. */
function KeepIt({ p, id, area }) {
  const [kept, setKept] = useLocal('lordship.pollKept.' + id, '');
  const o = p.qs[0].opts.find(x => x[0] === area), u = PICK_UP[area];
  if (!o || (id !== 'never' && id !== 'staff')) return null;
  if (kept === area) return <p className="ok">✓ {p.qs.some(x => x.pickup) ? 'Added to your daily habits' : 'Added to your lay down list'}</p>;
  const pickup = p.qs.some(x => x.pickup);
  if (pickup && !u) return null;
  return (
    <button className="btn soft big" onClick={(e) => {
      if (pickup) addHabit(u.habit);
      else addToList({ from: '“Never, Lord”', area: o[2], laydown: o[2] });
      setKept(area); burst(e.currentTarget, 10);
    }}>{pickup ? `✅ Daily habit: “${u.habit}”` : '🤲 Put it on my lay down list'}</button>
  );
}

/* One statement at a time, a countdown each (p.seconds); time out counts as a skip. */
function Swipe({ p, q, ans, busy, pick, back }) {
  const [left, setLeft] = useState(p.seconds || 0);
  const n = ans.length;
  useEffect(() => {
    if (!p.seconds) return undefined;
    setLeft(p.seconds);
    const t0 = Date.now();
    const iv = setInterval(() => {
      const l = p.seconds - (Date.now() - t0) / 1000;
      if (l <= 0) { clearInterval(iv); setLeft(0); pick('skip', { currentTarget: document.querySelector('.swipe-card') }); }
      else setLeft(l);
    }, 100);
    return () => clearInterval(iv);
  }, [n]);   // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="livepoll swipe">
      <p className="eyebrow">{p.title} · {n + 1}/{p.qs.length}</p>
      <div className="qdots">{p.qs.map((_, k) => <i key={k} className={k < n ? 'on' : k === n ? 'cur' : ''} />)}</div>
      {p.seconds > 0 && <div className="swipe-timer" aria-hidden="true"><i style={{ width: (left / p.seconds * 100) + '%' }} /></div>}
      <div className="swipe-card" key={n}><p>{q.q}</p></div>
      <div className="swipe-btns">{q.opts.map(([o, em, label]) => <button key={o} className={'swipe-btn ' + o} disabled={busy} onClick={(e) => pick(o, e)}><span>{em}</span>{label}</button>)}</div>
      {n > 0 && <button className="linkish" onClick={back}>‹ Back</button>}
    </div>
  );
}

export default function LivePoll({ id, room = '', code }) {
  room = room || code || '';
  const sfx = room ? '.' + room : '';
  const p = LIVE_POLLS[id];
  const [rid] = useState(() => { try { const k = 'gp.lordship.pollId'; let v = localStorage.getItem(k); if (!/^[a-z0-9]{16}$/.test(v || '')) { v = newId(); localStorage.setItem(k, v); } return v; } catch (e) { return newId(); } });
  const [saved, setSaved] = useLocal('lordship.poll.' + id + sfx, null);
  const [ans, setAns] = useState([]);
  const [started, setStarted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [before] = useLocal('lordship.poll.' + ((p && p.from) || '-') + sfx, null);   // what they picked in the poll this one follows
  if (!p) return <p className="muted">That poll isn’t here. Check the link.</p>;

  async function pick(o, e) {
    const next = ans.concat([o]);
    burst(e.currentTarget, 8);
    if (next.length < p.qs.length) { setAns(next); return; }
    setBusy(true);
    try { await api('livePoll', { poll: id, rid, answers: next, room }); setSaved(next); setAns([]); setStarted(false); }
    catch (x) { toast(errText(x)); }
    setBusy(false);
  }

  if (p.kind === 'bingo') return <Bingo p={p} id={id} room={room} rid={rid} />;
  if (saved && !started) {
    const a = p.qs[0].opts.find(o => o[0] === saved[0]);
    return (
      <div className="livepoll done">
        <p className="eyebrow">{p.title}</p>
        <h1>Thank you for being honest 🙏</h1>
        {p.kind === 'quiz' && <p className="lp-mine">✓ {saved.filter((x, i) => x === p.qs[i].correct).length} of {p.qs.length} right</p>}
        {p.kind === 'quiz' && <div className="card">{p.qs.map((x, i) => { const o = x.opts.find(y => y[0] === x.correct); return <p key={i} className="small" style={{ margin: '4px 0' }}>{saved[i] === x.correct ? '✓' : '✗'} <b>{x.q.split(' · ')[0]}:</b> {o[2]}</p>; })}</div>}
        {p.kind === 'swipe' && <p className="lp-mine">🔥 {saved.filter(x => x === 'fire').length} · ⛲ {saved.filter(x => x === 'fount').length}</p>}
        {a && p.kind !== 'swipe' && !p.qs.some(x => x.pickup) && <p className="lp-mine"><span>{a[1]}</span> {a[2]}</p>}
        {p.qs.some(x => x.pickup) && <PickUp area={saved[0]} opts={p.qs[0].opts} />}
        <p className="muted small">No one can see what you picked — only the totals, on the shared screen.</p>
        <div className="scripture"><b>{p.done.ref}</b><p>{p.done.text}</p></div>
        {p.next && LIVE_POLLS[p.next] && <a className="btn primary big" href={room ? '#/t/' + p.next : '#/poll/' + p.next}>Next: {LIVE_POLLS[p.next].title} ›</a>}
        <div className="card"><p className="eyebrow">A prayer, if you want it</p><p className="lead">{p.done.prayer}</p></div>
        {room && <KeepIt p={p} id={id} area={saved[0]} />}
        <button className="linkish" onClick={() => { setAns([]); setStarted(true); }}>Change my answer</button>
      </div>
    );
  }
  if (!started) return (
    <div className="livepoll">
      <p className="eyebrow">Just between you and God · no names</p>
      <h1>{p.title}</h1>
      <div className="scripture"><b>{p.verse.ref}</b><p>{p.verse.text}</p></div>
      <p className="lead">{p.intro}</p>
      <button className="btn primary big" onClick={() => setStarted(true)}>Start · {p.qs.length} {p.qs.length === 1 ? 'tap' : 'taps'}</button>
    </div>
  );
  const q = p.qs[ans.length];
  if (p.kind === 'swipe') return <Swipe p={p} q={q} ans={ans} busy={busy} pick={pick} back={() => setAns(ans.slice(0, -1))} />;
  return (
    <div className="livepoll" key={ans.length}>
      <p className="eyebrow">{p.title} · {ans.length + 1}/{p.qs.length}</p>
      <h1>{q.q}</h1>
      {q.sub && <p className="muted">{q.sub}</p>}
      {q.pickup && <PickUp area={ans[0]} opts={p.qs[0].opts} />}
      <div className={'lp-opts' + (q.opts.length > 6 ? ' grid' : '')}>
        {q.opts.map(([o, em, label]) => {
          const mine = ans.length === 0 && before && before[0] === o;
          return <button key={o} className={'opt-btn' + (mine ? ' mine' : '')} disabled={busy} onClick={(e) => pick(o, e)}><span className="lp-em">{em}</span>{label}{mine && <small className="lp-earlier">you laid this down</small>}</button>;
        })}
      </div>
      {ans.length > 0 && <button className="linkish" onClick={() => setAns(ans.slice(0, -1))}>‹ Back</button>}
    </div>
  );
}

/* The shared screen. */
export function LivePollResults({ id, room = '' }) {
  const [verses, setVerses] = useState(false);
  const p = LIVE_POLLS[id];
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const timer = useRef(null);
  const link = pollLink(id, room);
  useEffect(() => {
    if (!p) return undefined;
    let live = true;
    const tick = () => api('livePollResults', { poll: id, room }).then(x => { if (live) { setD(x); setErr(''); } }).catch(e => live && setErr(errText(e)))
      .finally(() => { if (live) timer.current = setTimeout(tick, document.hidden ? 10000 : 3000); });
    tick();
    return () => { live = false; clearTimeout(timer.current); };
  }, [id, room]);   // eslint-disable-line react-hooks/exhaustive-deps
  if (!p) return <p className="muted">No poll called “{id}”.</p>;
  async function reset() {
    let pw = ''; try { pw = sessionStorage.getItem('ls-admin') || ''; } catch (e) { /* */ }
    if (!pw) pw = prompt('Admin password to clear the results') || '';
    if (!pw || !confirm('Clear every answer and start again?')) return;
    try { await api('livePollReset', { poll: id, pw, room }); try { sessionStorage.setItem('ls-admin', pw); } catch (e) { /* */ } toast('Cleared'); setD(await api('livePollResults', { poll: id, room })); }
    catch (e) { toast(errText(e)); }
  }
  const total = d ? d.total : 0;
  return (
    <div className="screen lpresults">
      <div className="screen-main">
        <p className="eyebrow">{p.title} · live · no names{room ? ' · class ' + room : ''}</p>
        <div className="lp-link"><span>Open on your phone or laptop:</span><b>{link.replace(/^https?:\/\//, '')}</b>
          <button className="btn soft small" onClick={() => copyText(link)}>Copy link for the chat</button></div>
        {err && <p className="err">{err}</p>}
        {p.kind === 'bingo' ? <><BingoBars p={p} d={d} />{p.cloud && <a className="btn soft small" href={'#/cloud/' + p.cloud.id + (room ? '/' + room : '')}>Word cloud: “{p.cloud.q}” ›</a>}</>
          : p.kind === 'sort' ? <SortBars p={p} d={d} />
          : p.kind === 'quiz' ? <QuizBars p={p} d={d} />
          : p.kind === 'swipe' ? (
          <div className="ff-rows">
            <div className="ff-head"><span>🔥 Fire · burns</span><span>Fountain · builds ⛲</span></div>
            {p.qs.map((q, qi) => {
              const c = d ? d.counts[qi] : {}, f = c.fire || 0, w = c.fount || 0, t = f + w;
              if (verses && q.is) return (
                <div key={qi} className="ff-row">
                  <p>{q.is === 'fire' ? '🔥' : '⛲'} {q.q}</p>
                  <div className="ff-bar">{t ? <><i className="fire" style={{ width: f / t * 100 + '%' }}>{f / t >= 0.12 ? Math.round(f / t * 100) + '%' : ''}</i><i className="fount" style={{ width: w / t * 100 + '%' }}>{w / t >= 0.12 ? Math.round(w / t * 100) + '%' : ''}</i></> : <em>—</em>}</div>
                </div>
              );
              return (
                <div key={qi} className="ff-row">
                  <p>{q.q}</p>
                  <div className="ff-bar">{t ? <><i className="fire" style={{ width: f / t * 100 + '%' }}>{f / t >= 0.12 ? Math.round(f / t * 100) + '%' : ''}</i><i className="fount" style={{ width: w / t * 100 + '%' }}>{w / t >= 0.12 ? Math.round(w / t * 100) + '%' : ''}</i></> : <em>—</em>}</div>
                </div>
              );
            })}
            {p.verses && <div className="ff-tools"><button className="btn soft small" onClick={() => setVerses(!verses)}>{verses ? 'Hide the verses' : 'Show the James 3 verses'}</button>
              {p.next && <a className="btn ghost small" href={'#/poll-results/' + p.next + (room ? '/' + room : '')}>Next: {LIVE_POLLS[p.next].title} ›</a>}</div>}
            {verses && p.verses && <div className="ff-verses">{p.verses.map(v => <div key={v.ref} className={'ff-verse ' + v.is}><b>{v.ref}</b><p>{v.text}</p></div>)}</div>}
          </div>
        ) : <div className="lp-cols">
          {p.qs.map((q, qi) => {
            const counts = d ? d.counts[qi] : {};
            const order = qi === 0 ? q.opts.slice().sort((x, y) => (counts[y[0]] || 0) - (counts[x[0]] || 0)) : q.opts;
            const max = Math.max(1, ...q.opts.map(o => counts[o[0]] || 0));
            return (
              <div key={qi} className="lp-col">
                <h2>{q.q}</h2>
                {order.map(([o, em, label]) => {
                  const n = counts[o] || 0;
                  return (
                    <div key={o} className={'lpbar' + (n ? '' : ' zero')}>
                      <span className="lp-em">{em}</span><span className="lp-label">{label}</span>
                      <div className="qbar-track"><i style={{ width: n / max * 100 + '%' }} /></div>
                      <b>{total ? Math.round(n / total * 100) + '%' : '—'}</b>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>}
        {p.qs.some(x => x.pickup) && total > 0 && (() => {
          const c0 = d.counts[0], top = Object.keys(c0).sort((x, y) => c0[y] - c0[x])[0], o = p.qs[0].opts.find(x => x[0] === top), u = PICK_UP[top];
          return u ? <p className="lp-top">Most in our hands: <b>{o[1]} {o[2]}</b> → picked back up: <em>{u.up}</em></p> : null;
        })()}
        {p.next && p.kind !== 'swipe' && LIVE_POLLS[p.next] && <a className="btn ghost small" style={{ alignSelf: 'flex-start', marginTop: 10 }} href={'#/poll-results/' + p.next + (room ? '/' + room : '')}>Next: {LIVE_POLLS[p.next].title} ›</a>}
        <div className="qr-tools"><span className="qr-total"><b>{total}</b> answered</span><button className="linkish" onClick={reset}>Reset</button></div>
      </div>
      <div className="screen-qr lp-qr"><Qr text={link} size={220} /><p>Scan on a phone</p></div>
    </div>
  );
}

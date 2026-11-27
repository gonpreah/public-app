/* Thursday's Excuse bingo and its word cloud ("My excuse is ___"), and the projector views for the
   bingo, the sphere sorter, the recap quiz and the cloud. All anonymous: a random phone id, no names. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { LIVE_POLLS, SPHERE7 } from '../content.js';
import { useLocal } from '../../../core/store.js';
import { api, errText } from '../../../core/api.js';
import { burst, toast } from '../../../core/ui.jsx';

const LINES = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15], [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15], [0, 5, 10, 15], [3, 6, 9, 12]];

/* A card in this phone's own order: a shuffle seeded by the phone id. */
function shuffled(n, seed) {
  const a = Array.from({ length: n }, (_, i) => i);
  let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  for (let i = n - 1; i > 0; i--) { h = (h * 1103515245 + 12345) >>> 0; const j = h % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function Bingo({ p, id, room, rid }) {
  const sfx = room ? '.' + room : '';
  const [on, setOn] = useLocal('lordship.bingo.' + id + sfx, {});
  const [bingo, setBingo] = useState(false);
  const order = useMemo(() => shuffled(p.qs.length, rid), [rid, p.qs.length]);
  const timer = useRef(null);
  const send = (next) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => api('livePoll', { poll: id, rid, room, answers: p.qs.map(q => next[q.id] ? 'y' : 'n') }).catch(e => toast(errText(e))), 500);
  };
  function tap(qid, e) {
    const next = Object.assign({}, on, { [qid]: !on[qid] });
    if (!next[qid]) delete next[qid];
    setOn(next); send(next);
    if (next[qid]) burst(e.currentTarget, 6);
    const cells = order.map(i => !!next[p.qs[i].id]);
    const got = LINES.some(l => l.every(i => cells[i]));
    if (got && !bingo) { setBingo(true); setTimeout(() => burst(document.querySelector('.bingo-grid'), 40), 50); }
    if (!got) setBingo(false);
  }
  const n = Object.keys(on).length;
  return (
    <div className="livepoll bingo">
      <p className="eyebrow">No names · Exodus 3–4</p>
      <h1>{p.title}</h1>
      <p className="muted">{p.intro}</p>
      <div className="bingo-grid">{order.map(i => {
        const q = p.qs[i];
        return <button key={q.id} className={'bingo-cell' + (on[q.id] ? ' on' : '')} aria-pressed={!!on[q.id]} onClick={(e) => tap(q.id, e)}>{q.q}</button>;
      })}</div>
      {bingo ? <p className="bingo-shout">BINGO! 🎉</p> : <p className="muted small">{n ? `${n} tapped — they show up on the screen as you go.` : 'Tap the ones you’ve used.'}</p>}
      <div className="scripture"><b>{p.done.ref}</b><p>{p.done.text}</p></div>
      {p.cloud && <CloudInput cloud={p.cloud} room={room} rid={rid} />}
    </div>
  );
}

export function CloudInput({ cloud, room, rid }) {
  const [text, setText] = useState('');
  const [mine, setMine] = useLocal('lordship.cloud.' + cloud.id + (room ? '.' + room : ''), []);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(true);
  useEffect(() => { api('cloudResults', { cloud: cloud.id, room }).then(r => setOpen(r.open)).catch(() => {}); }, [cloud.id, room]);
  const words = text.trim().split(/\s+/).filter(Boolean);
  async function add(e) {
    e.preventDefault(); setBusy(true);
    try { const r = await api('cloudAdd', { cloud: cloud.id, room, rid, text }); setMine(mine.concat([r.words]).slice(-3)); setText(''); toast('It’s on the screen'); }
    catch (x) { if (x.code === 'CLOSED') setOpen(false); toast(x.code === 'CLOSED' ? 'The word cloud is closed for now.' : errText(x)); }
    setBusy(false);
  }
  return (
    <form className="card cloudin" onSubmit={add}>
      <h3>{cloud.q}</h3>
      <p className="muted small">Up to {cloud.max} words. Anonymous — it goes into the class word cloud.</p>
      {open ? <div className="row">
        <input value={text} maxLength={40} aria-label={cloud.q} placeholder="e.g. too scared" onChange={e => setText(e.target.value.split(/\s+/).slice(0, cloud.max + 1).join(' '))} />
        <button className="btn primary" disabled={busy || !words.length || words.length > cloud.max}>Add</button>
      </div> : <p className="note small">The word cloud is closed right now. It may open again later.</p>}
      {mine.length > 0 && <p className="tiny muted">You added: {mine.map(w => '“' + w + '”').join(' · ')}</p>}
    </form>
  );
}

/* Projector pieces, used by LivePollResults. */
export function BingoBars({ p, d }) {
  const rows = p.qs.map((q, i) => ({ q, n: d ? d.counts[i].y : 0 })).sort((x, y) => y.n - x.n);
  const max = Math.max(1, ...rows.map(r => r.n));
  return (
    <div className="bingo-bars">{rows.map(({ q, n }, i) => (
      <div key={q.id} className={'lpbar' + (n ? '' : ' zero') + (i < 3 && n ? ' lead3' : '')}>
        <span className="lp-em">{q.id === 'who' || q.id === 'say' || q.id === 'believe' || q.id === 'speaker' || q.id === 'else' ? '🔥' : '·'}</span>
        <span className="lp-label">{q.q}</span>
        <div className="qbar-track"><i style={{ width: n / max * 100 + '%' }} /></div>
        <b>{n}</b>
      </div>))}
      <p className="tiny" style={{ color: 'var(--ink-5)' }}>🔥 = one of Moses’ five (Exodus 3–4)</p>
    </div>
  );
}

export function SortBars({ p, d }) {
  return (
    <div className="sort-rows">
      <div className="sort-legend">{SPHERE7.map(([id, em, l], i) => <span key={id}><i style={{ background: `var(--sph${i})` }} />{em} {l}</span>)}</div>
      {p.qs.map((q, qi) => {
        const c = d ? d.counts[qi] : {}, t = SPHERE7.reduce((s, [id]) => s + (c[id] || 0), 0);
        const top = t ? SPHERE7.slice().sort((a, b) => (c[b[0]] || 0) - (c[a[0]] || 0))[0] : null;
        return (
          <div key={qi} className="sort-row">
            <p>{q.q}{top && <small> · mostly {top[1]} {top[2]}</small>}</p>
            <div className="ff-bar">{t ? SPHERE7.map(([id, em], i) => c[id] ? <i key={id} style={{ width: c[id] / t * 100 + '%', background: `var(--sph${i})` }}>{c[id] / t >= 0.1 ? em : ''}</i> : null) : <em>—</em>}</div>
          </div>
        );
      })}
    </div>
  );
}

export function QuizBars({ p, d }) {
  return (
    <div className="quiz-rows">{p.qs.map((q, qi) => {
      const c = d ? d.counts[qi] : {}, t = Object.values(c).reduce((s, x) => s + x, 0), ok = c[q.correct] || 0;
      const line = q.opts.find(o => o[0] === q.correct);
      return (
        <div key={qi} className="quiz-row">
          <p><b>{q.q}</b><br /><span>{line[1]} {line[2]}</span></p>
          <div className="qbar-track"><i style={{ width: (t ? ok / t * 100 : 0) + '%' }} /></div>
          <b>{t ? Math.round(ok / t * 100) + '% ✓' : '—'}</b>
        </div>
      );
    })}</div>
  );
}

/* The word cloud on the projector: #/cloud/<id>[/<class>] */
export function CloudScreen({ id, room = '' }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const timer = useRef(null);
  const poll = Object.values(LIVE_POLLS).find(x => x.cloud && x.cloud.id === id);
  useEffect(() => {
    let live = true;
    const tick = () => api('cloudResults', { cloud: id, room }).then(x => { if (live) { setD(x); setErr(''); } }).catch(e => live && setErr(errText(e)))
      .finally(() => { if (live) timer.current = setTimeout(tick, document.hidden ? 10000 : 3000); });
    tick();
    return () => { live = false; clearTimeout(timer.current); };
  }, [id, room]);
  async function act(action, word) {
    let pw = ''; try { pw = sessionStorage.getItem('ls-admin') || ''; } catch (e) { /* */ }
    if (!pw) pw = prompt('Admin password') || '';
    if (!pw) return;
    if (action === 'reset' && !confirm('Clear the whole word cloud?')) return;
    try { setD(await api('cloudAdmin', { cloud: id, room, pw, action, word })); try { sessionStorage.setItem('ls-admin', pw); } catch (e) { /* */ } }
    catch (e) { toast(errText(e)); }
  }
  const max = d ? Math.max(1, ...d.words.map(w => w.n)) : 1;
  return (
    <div className="screen cloudscreen">
      <div className="screen-main">
        <p className="eyebrow">Word cloud · no names{room ? ' · class ' + room : ''}</p>
        <h1 className="screen-q">{poll ? poll.cloud.q : 'Word cloud'}</h1>
        {err && <p className="err">{err}</p>}
        <div className="cloud">{d && d.words.length ? d.words.map((w, i) => (
          <button key={w.w} className="cloud-w" style={{ fontSize: `clamp(1rem, ${1.2 + 3.4 * w.n / max}vw, ${1.2 + 4.5 * w.n / max}rem)`, '--h': (i * 47) % 360 }} title="Tap to hide" onClick={() => { if (confirm(`Hide “${w.w}” from the cloud?`)) act('hide', w.w); }}>{w.w}</button>))
          : <p className="screen-ref">Waiting for the first words…</p>}</div>
        <div className="qr-tools"><span className="qr-total"><b>{d ? d.total : 0}</b> in</span>
          {d && <button className="linkish" onClick={() => act(d.open ? 'close' : 'open')}>{d.open ? 'Close' : 'Reopen'}</button>}
          <button className="linkish" onClick={() => act('reset')}>Reset</button>
          {d && !d.open && <span className="pill">closed</span>}</div>
      </div>
    </div>
  );
}

/* The throw-down on the projector: #/throwdown/<class> — an anonymous live count of declared next steps. */
export function ThrowdownScreen({ code }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    let live = true, t = null;
    const tick = () => api('throwdownCount', { code }).then(x => { if (live) { setD(x); setErr(''); } }).catch(e => live && setErr(errText(e)))
      .finally(() => { if (live) t = setTimeout(tick, document.hidden ? 10000 : 3000); });
    tick();
    return () => { live = false; clearTimeout(t); };
  }, [code]);
  return (
    <div className="screen tdscreen">
      <div className="screen-main">
        <p className="eyebrow">The throw-down · no names</p>
        <h1 className="screen-q">Next steps declared</h1>
        {err && <p className="err">{err}</p>}
        <p className="td-big" key={d ? d.declared : 0}>{d ? d.declared : '…'}</p>
        {d && <p className="screen-ref">of {d.students} in the class · one step in the next 30 days</p>}
        <p className="screen-ref">Easy to die for Jesus. Hard to live for him.</p>
      </div>
    </div>
  );
}

/* Burn the ships on the projector: #/burn/<class> — how many backup plans are torn up, no names, no words. */
export function BurnScreen({ code }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    let live = true, t = null;
    const tick = () => api('burnCount', { code }).then(x => { if (live) { setD(x); setErr(''); } }).catch(e => live && setErr(errText(e)))
      .finally(() => { if (live) t = setTimeout(tick, document.hidden ? 10000 : 3000); });
    tick();
    return () => { live = false; clearTimeout(t); };
  }, [code]);
  async function reset() {
    let pw = ''; try { pw = sessionStorage.getItem('ls-admin') || ''; } catch (e) { /* */ }
    if (!pw) pw = prompt('Admin password') || '';
    if (!pw || !confirm('Start the count again from zero?')) return;
    try { await api('burnReset', { pw, cls: code }); try { sessionStorage.setItem('ls-admin', pw); } catch (e) { /* */ } setD(await api('burnCount', { code })); }
    catch (e) { toast(errText(e)); }
  }
  const n = d ? d.burned : 0;
  return (
    <div className="screen burnscreen">
      <div className="screen-main">
        <p className="eyebrow">Burn the ships · no names</p>
        <div className="burn-fire" aria-hidden="true">{Array.from({ length: Math.min(n, 40) }, (_, i) => <span key={i} style={{ animationDelay: (i % 10) * 0.13 + 's', left: ((i * 37) % 100) + '%' }}>🔥</span>)}</div>
        <p className="td-big burn-n" key={n}>{d ? n : '…'}</p>
        <h1 className="screen-q">{n === 1 ? 'ship burned' : 'ships burned'}</h1>
        {d && <p className="screen-ref">of {d.students} in the class</p>}
        <p className="burn-pray">“Jesus, you’re my only plan.”</p>
        <p className="screen-ref">Elisha burned the plow · the woman broke the jar · 1 Kings 19:21 · Mark 14:3</p>
        {err && <p className="err">{err}</p>}
        <div className="qr-tools" style={{ justifyContent: 'center' }}><button className="linkish" onClick={reset}>Reset</button></div>
      </div>
    </div>
  );
}

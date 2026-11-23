/* Uriah's admin page (#/admin): the class code and week, each day's slides, the anonymous questions,
   and QR codes for the class and church links. Password: LS_ADMIN_PASSWORD in Netlify. */
import { useEffect, useState } from 'react';
import { api, errText } from './core/api.js';
import { DAYS, TOPICS, WHEEL_OUT, WHEEL_IN, GROUPS } from './teachings/lordship/content.js';
import { toast, copyText } from './core/ui.jsx';
import Qr, { downloadQrPng } from './core/Qr.jsx';

const STATUS = [
  { id: 'new', name: 'New' }, { id: 'class', name: 'Answer in class' }, { id: 'panel', name: 'Thursday panel' },
  { id: 'answered', name: 'Answered' }, { id: 'hidden', name: 'Hide' }
];
const ss = { get: () => { try { return sessionStorage.getItem('ls-admin') || ''; } catch (e) { return ''; } }, set: (v) => { try { sessionStorage.setItem('ls-admin', v); } catch (e) { /* */ } } };
const b64 = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = rej; r.readAsDataURL(blob); });
const mb = (n) => (n / 1048576).toFixed(1) + ' MB';

export default function Admin() {
  const [pw, setPw] = useState(ss.get());
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('questions');
  async function login(p) {
    setErr('');
    try { const r = await api('adminLogin', { pw: p }); setD(r); ss.set(p); }
    catch (e) { setErr(errText(e)); setD(null); }
  }
  useEffect(() => { if (pw) login(pw); }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  if (!d) return (
    <>
      <h1>Admin</h1>
      <form className="card" onSubmit={e => { e.preventDefault(); login(pw); }}>
        <label className="lab" htmlFor="pw">Password</label>
        <input id="pw" type="password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="current-password" />
        {err && <p className="err">{err}</p>}
        <button className="btn primary" style={{ marginTop: 10 }}>Sign in</button>
      </form>
    </>
  );
  return (
    <>
      <h1>Admin</h1>
      {!d.hasKey && <p className="note small">No <code>ANTHROPIC_API_KEY</code> on the server yet — the coach won’t answer until it’s set in Netlify.</p>}
      <a className="btn primary big" href="#/game" style={{ marginBottom: 8 }}>🎲 Day 1 game &amp; join wall (projector)</a>
      <div className="chips">{[['questions', 'Questions'], ['roster', 'Class list'], ['totals', 'Class totals'], ['slides', 'Slides'], ['class', 'Class & links']].map(([k, l]) =>
        <button key={k} className={'chip' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === 'class' && <ClassSettings pw={pw} cfg={d.cfg} onSaved={(cfg) => setD(Object.assign({}, d, { cfg }))} />}
      {tab === 'slides' && <SlidesAdmin pw={pw} slides={d.slides} onChange={(slides) => setD(Object.assign({}, d, { slides }))} />}
      {tab === 'questions' && <QuestionsAdmin pw={pw} />}
      {tab === 'totals' && <Totals pw={pw} />}
      {tab === 'roster' && <Roster pw={pw} />}
      <button className="linkish" onClick={() => { ss.set(''); setPw(''); setD(null); }}>Sign out</button>
    </>
  );
}

function ClassSettings({ pw, cfg, onSaved }) {
  const [v, setV] = useState(cfg);
  const [err, setErr] = useState('');
  const classLink = location.origin + '/?class=' + encodeURIComponent(cfg.code || '');
  const churchLink = location.origin + '/?church';
  async function save() {
    setErr('');
    try { const r = await api('adminSet', Object.assign({ pw }, v)); onSaved(r.cfg); setV(r.cfg); toast('Saved'); }
    catch (e) { setErr(e.code === 'BAD_CODE' ? 'The code needs 4–12 letters or numbers.' : errText(e)); }
  }
  return (
    <>
      <div className="card">
        <h3>This week’s class</h3>
        <label className="lab">Class name</label>
        <input value={v.name} onChange={e => setV(Object.assign({}, v, { name: e.target.value }))} maxLength={80} />
        <label className="lab">Class code (4–12 letters/numbers; changing it locks out last week’s class)</label>
        <input value={v.code} onChange={e => setV(Object.assign({}, v, { code: e.target.value.toUpperCase() }))} maxLength={12} />
        <label className="lab">Monday of the teaching week (so “today” opens the right day)</label>
        <input type="date" value={v.weekStart} onChange={e => setV(Object.assign({}, v, { weekStart: e.target.value }))} />
        {err && <p className="err">{err}</p>}
        <button className="btn primary" style={{ marginTop: 12 }} onClick={save}>Save</button>
      </div>
      {cfg.code && (
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>Class link</h3>
          <Qr text={classLink} />
          <p><code>{classLink}</code></p>
          <div className="row wrap" style={{ justifyContent: 'center' }}>
            <button className="btn soft small" onClick={() => copyText(classLink)}>Copy</button>
            <button className="btn soft small" onClick={() => downloadQrPng(classLink, classLink.replace(/^https?:\/\//, ''), 'lordship-class-qr.png')}>Download QR for slides</button>
          </div>
        </div>
      )}
      <div className="card" style={{ textAlign: 'center' }}>
        <h3>Church (public) link</h3>
        <Qr text={churchLink} />
        <p><code>{churchLink}</code></p>
        <div className="row wrap" style={{ justifyContent: 'center' }}>
          <button className="btn soft small" onClick={() => copyText(churchLink)}>Copy</button>
          <button className="btn soft small" onClick={() => downloadQrPng(churchLink, churchLink.replace(/^https?:\/\//, ''), 'lordship-church-qr.png')}>Download QR</button>
          <a className="btn primary small" href="#/church/screen">▶ Sunday screen</a>
        </div>
      </div>
    </>
  );
}

function SlidesAdmin({ pw, slides, onChange }) {
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [links, setLinks] = useState(() => Object.fromEntries(DAYS.map(x => [x.id, (slides[x.id] || {}).link || ''])));
  async function upload(day, kind, file) {
    if (!file) return;
    setErr(''); setBusy(`${day}:${kind}:0`);
    try {
      const type = file.type || (kind === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
      const b = await api('slideBegin', { pw, day, kind, name: file.name, size: file.size, type });
      for (let i = 0; i < b.parts; i++) {
        setBusy(`${day}:${kind}:${Math.round(i / b.parts * 100)}`);
        const d = await b64(file.slice(i * b.partSize, (i + 1) * b.partSize));
        await api('slidePut', { pw, day, kind, v: b.v, i, d });
      }
      const r = await api('adminLogin', { pw });
      onChange(r.slides); toast('Uploaded');
    } catch (e) { setErr(e.code === 'TOO_BIG' ? 'Files can be up to 60 MB.' : e.code === 'BAD_TYPE' ? 'That isn’t a PDF or PPTX.' : errText(e)); }
    setBusy('');
  }
  async function drop(day, kind) {
    if (!confirm('Remove this file?')) return;
    try { onChange((await api('slideDrop', { pw, day, kind })).slides); } catch (e) { setErr(errText(e)); }
  }
  async function saveLink(day) {
    try { onChange((await api('slideLink', { pw, day, url: links[day] })).slides); toast('Saved'); }
    catch (e) { setErr(e.code === 'BAD_URL' ? 'Links must start with https://' : errText(e)); }
  }
  return (
    <>
      {err && <p className="err">{err}</p>}
      {DAYS.map(x => {
        const s = slides[x.id] || {};
        return (
          <div className="card" key={x.id}>
            <h3>{x.name}: {x.title}</h3>
            {['pdf', 'pptx'].map(k => {
              const f = s[k], b = busy.startsWith(`${x.id}:${k}:`);
              return (
                <div className="item" key={k}>
                  <b>{k.toUpperCase()}</b> {f ? <span className="muted small">{f.name} · {mb(f.size)}</span> : <span className="muted small">none</span>}
                  <div className="row wrap">
                    <label className="btn soft small" aria-disabled={!!busy}>
                      {b ? `Uploading… ${busy.split(':')[2]}%` : f ? 'Replace' : 'Upload'}
                      <input type="file" hidden disabled={!!busy} accept={k === 'pdf' ? 'application/pdf,.pdf' : '.pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation'}
                        onChange={e => { upload(x.id, k, e.target.files[0]); e.target.value = ''; }} />
                    </label>
                    {f && <button className="linkish" onClick={() => drop(x.id, k)}>Remove</button>}
                  </div>
                </div>
              );
            })}
            <label className="lab">Or a link (Google Slides, Canva…)</label>
            <div className="row"><input value={links[x.id]} placeholder="https://" onChange={e => setLinks(Object.assign({}, links, { [x.id]: e.target.value }))} />
              <button className="btn soft small" onClick={() => saveLink(x.id)}>Save</button></div>
          </div>
        );
      })}
      <p className="muted small">Tip: upload a PDF export too — students can view a PDF in the app; the PPTX is for downloading and editing.</p>
    </>
  );
}

function QuestionsAdmin({ pw }) {
  const [qs, setQs] = useState(null);
  const [f, setF] = useState('open');
  const [err, setErr] = useState('');
  const load = async () => { try { setQs((await api('adminQuestions', { pw })).questions); } catch (e) { setErr(errText(e)); } };
  useEffect(() => { load(); }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  async function mark(id, status, drop) {
    try { await api('adminMark', { pw, id, status, drop }); setQs(drop ? qs.filter(q => q.id !== id) : qs.map(q => q.id === id ? Object.assign({}, q, { status }) : q)); }
    catch (e) { setErr(errText(e)); }
  }
  if (!qs) return err ? <p className="err">{err}</p> : <p className="muted">Loading…</p>;
  const shown = qs.filter(q => f === 'open' ? ['new', 'class', 'panel'].includes(q.status) : q.status === f);
  const topic = (id) => (TOPICS.find(t => t.id === id) || {}).name || id;
  return (
    <>
      <div className="chips">
        {[['open', 'Open'], ['new', 'New'], ['class', 'In class'], ['panel', 'Thursday panel'], ['answered', 'Answered'], ['hidden', 'Hidden']].map(([k, l]) =>
          <button key={k} className={'chip' + (f === k ? ' on' : '')} onClick={() => setF(k)}>{l} ({qs.filter(q => k === 'open' ? ['new', 'class', 'panel'].includes(q.status) : q.status === k).length})</button>)}
        <button className="chip" onClick={load}>↻</button>
      </div>
      <a className="btn primary" href="#/panel">▶ Thursday panel screen ({qs.filter(q => q.status === 'panel').length})</a>
      {err && <p className="err">{err}</p>}
      {!shown.length && <p className="muted">No questions here.</p>}
      {shown.map(q => (
        <div className={'card' + (q.status === 'new' ? ' qa-new' : '')} key={q.id}>
          <p className="muted tiny">{topic(q.topic)} · {q.day}</p>
          <p style={{ whiteSpace: 'pre-wrap', fontSize: '1.05rem' }}>{q.text}</p>
          <div className="chips">{STATUS.map(s => <button key={s.id} className={'chip' + (q.status === s.id ? ' on' : '')} onClick={() => mark(q.id, s.id)}>{s.name}</button>)}
            <button className="chip" onClick={() => { if (confirm('Delete this question for good?')) mark(q.id, null, true); }}>Delete</button></div>
        </div>
      ))}
    </>
  );
}

/* Anonymous class totals: averages from students who switched sharing on. */
function Totals({ pw }) {
  const [t, setT] = useState(null);
  const [err, setErr] = useState('');
  const load = async () => { try { setT(await api('adminTotals', { pw })); } catch (e) { setErr(errText(e)); } };
  useEffect(() => { load(); }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  if (err) return <p className="err">{err}</p>;
  if (!t) return <p className="muted">Loading…</p>;
  const col = (g) => (GROUPS.find(x => x.id === g) || {}).color;
  const rows = (areas, side) => areas.map(a => ({ a, v: t[side][a.id] })).filter(x => x.v).sort((x, y) => x.v.avg - y.v.avg);
  const Bars = ({ list }) => list.map(({ a, v }) => (
    <div key={a.id} className="tbar"><span>{a.name}</span><div className="bar"><i style={{ width: v.avg * 10 + '%', background: col(a.g) }} /></div><b>{v.avg}</b></div>));
  const hot = [['hx', 'Humble'], ['ox', 'Open'], ['tx', 'Transparent']].filter(([k]) => t.hot[k]);
  return (
    <>
      <div className="stats">
        <div><b>{t.n}</b><span>sharing</span></div><div><b>{t.wheels}</b><span>wheels</span></div><div><b>{t.committed}</b><span>committed</span></div>
      </div>
      <p className="muted small">Only students who switched on “Add my numbers to the class totals” — no names. Lowest first. <button className="linkish" onClick={load}>Refresh</button></p>
      {t.wheels > 0 ? <>
        <div className="card"><h3>Outer life</h3><Bars list={rows(WHEEL_OUT, 'out')} /></div>
        <div className="card"><h3>Inner life</h3><Bars list={rows(WHEEL_IN, 'in')} /></div>
      </> : <p className="muted">No wheels shared yet.</p>}
      {hot.length > 0 && <div className="card"><h3>HOT (1–5)</h3>{hot.map(([k, l]) => <div key={k} className="tbar"><span>{l}</span><div className="bar"><i style={{ width: t.hot[k].avg * 20 + '%' }} /></div><b>{t.hot[k].avg}</b></div>)}</div>}
    </>
  );
}

/* The Thursday panel on the projector: the questions marked "Thursday panel", big, one at a time. */
export function Panel() {
  const [qs, setQs] = useState(null);
  const [i, setI] = useState(0);
  const [err, setErr] = useState('');
  const pw = ss.get();
  useEffect(() => {
    document.body.classList.add('bigScreen');
    api('adminQuestions', { pw }).then(r => setQs(r.questions.filter(q => q.status === 'panel'))).catch(e => setErr(errText(e)));
    const key = (e) => { if (e.key === 'ArrowRight' || e.key === ' ') setI(x => x + 1); if (e.key === 'ArrowLeft') setI(x => Math.max(0, x - 1)); };
    window.addEventListener('keydown', key);
    return () => { document.body.classList.remove('bigScreen'); window.removeEventListener('keydown', key); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  if (err) return <div className="screen"><p className="err">{err} <a href="#/admin">Sign in</a></p></div>;
  if (!qs) return <div className="screen"><p>Loading…</p></div>;
  const n = qs.length, k = Math.min(i, Math.max(0, n - 1)), q = qs[k];
  async function answered() {
    try { await api('adminMark', { pw, id: q.id, status: 'answered' }); setQs(qs.filter(x => x.id !== q.id)); } catch (e) { setErr(errText(e)); }
  }
  return (
    <div className="screen panel">
      <div className="screen-main">
        <p className="eyebrow">Thursday panel · {n ? `${k + 1} of ${n}` : 'no questions'}</p>
        {q ? <h1 className="screen-q" key={q.id}>{q.text}</h1> : <h1 className="screen-q">No panel questions yet.</h1>}
        {q && <p className="screen-ref">{(TOPICS.find(t => t.id === q.topic) || {}).name} · asked anonymously</p>}
      </div>
      <div className="panel-nav">
        <button className="btn ghost" disabled={k <= 0} onClick={() => setI(k - 1)}>‹ Back</button>
        {q && <button className="btn soft" onClick={answered}>✓ Answered</button>}
        <button className="btn primary" disabled={k >= n - 1} onClick={() => setI(k + 1)}>Next ›</button>
      </div>
      <a className="screen-exit" href="#/admin">✕</a>
    </div>
  );
}

/* Who has joined (names only), with a PIN reset for anyone who forgets. */
function Roster({ pw }) {
  const [st, setSt] = useState(null);
  const [err, setErr] = useState('');
  const load = async () => { try { setSt((await api('adminRoster', { pw })).students); } catch (e) { setErr(errText(e)); } };
  useEffect(() => { load(); }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  if (err) return <p className="err">{err}</p>;
  if (!st) return <p className="muted">Loading…</p>;
  const ago = (t) => t ? new Date(t).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : '—';
  async function reset(s) {
    const pin = prompt(`New 4-number PIN for ${s.name}:`, String(Math.floor(1000 + Math.random() * 9000)));
    if (!pin) return;
    try { await api('adminStudent', { pw, sid: s.id, pin }); toast(`${s.name}'s PIN is now ${pin}`); } catch (e) { setErr(e.code === 'BAD_PIN' ? 'A PIN is 4 numbers.' : errText(e)); }
  }
  async function remove(s) {
    if (!confirm(`Remove ${s.name} from the class? Their saved answers are deleted too.`)) return;
    try { await api('adminStudent', { pw, sid: s.id, remove: true }); load(); } catch (e) { setErr(errText(e)); }
  }
  return (
    <>
      <div className="stats"><div><b>{st.length}</b><span>joined</span></div><div><b>{st.filter(s => s.fact).length}</b><span>fun facts</span></div><div><b>{st.filter(s => s.saved).length}</b><span>saving</span></div></div>
      <p className="muted small">Names only — you never see their answers. <button className="linkish" onClick={load}>Refresh</button></p>
      <div className="card">{!st.length && <p className="muted">No one yet.</p>}
        {st.map(s => <div className="item row wrap" key={s.id} style={{ justifyContent: 'space-between' }}>
          <span><b>{s.name}</b>{s.fact ? ' 🤫' : ''}<br /><small className="muted">joined {ago(s.at)} · last seen {ago(s.seen)}</small></span>
          <span><button className="btn soft small" onClick={() => reset(s)}>New PIN</button> <button className="linkish" onClick={() => remove(s)}>Remove</button></span>
        </div>)}
      </div>
    </>
  );
}

/* The projector: a join wall (names pop up as they join), then the game rounds with live answers and reveals. */
export function GameScreen() {
  const pw = ss.get();
  const [g, setG] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => { try { setG(await api('gameScreen', { pw })); setErr(''); } catch (e) { setErr(errText(e)); } };
  useEffect(() => {
    document.body.classList.add('bigScreen');
    load(); const t = setInterval(load, 2500);
    return () => { clearInterval(t); document.body.classList.remove('bigScreen'); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  async function act(action) { setBusy(true); try { await api('gameAdmin', { pw, action }); await load(); } catch (e) { setErr(errText(e)); } setBusy(false); }
  if (err && !g) return <div className="screen"><p className="err">{err} — <a href="#/admin">sign in to the admin page first</a></p><a className="screen-exit" href="#/admin">✕</a></div>;
  if (!g) return <div className="screen"><p>Loading…</p></div>;
  const link = location.origin + '/?class=' + g.code;
  const total = g.counts ? (g.kind === 'who' ? Object.values(g.counts).reduce((a, b) => a + b, 0) : g.counts.reduce((a, b) => a + b, 0)) : 0;
  const controls = (
    <div className="panel-nav game-nav">
      {(g.phase === 'off' || g.phase === 'end') && <button className="btn primary" disabled={busy} onClick={() => act('lobby')}>{g.phase === 'end' ? 'New game' : 'Open the join wall'}</button>}
      {g.phase === 'lobby' && <button className="btn primary" disabled={busy || !g.names.length} onClick={() => act('next')}>Start the game ▶</button>}
      {g.phase === 'q' && !g.reveal && <button className="btn primary" disabled={busy} onClick={() => act('reveal')}>Reveal</button>}
      {g.phase === 'q' && g.reveal && (g.more ? <button className="btn primary" disabled={busy} onClick={() => act('next')}>Next ▶</button> : <button className="btn primary" disabled={busy} onClick={() => act('end')}>Finish 🏁</button>)}
      {g.phase === 'q' && <button className="btn ghost" disabled={busy} onClick={() => act('end')}>End</button>}
    </div>
  );
  if (g.phase === 'off' || g.phase === 'lobby') return (
    <div className="screen joinwall">
      <div className="screen-main">
        <p className="eyebrow">Lordship · Day 1</p>
        <h1 className="screen-q">Join the class</h1>
        <p className="screen-ref">Scan → your name + a 4-number PIN → one fun fact</p>
        <div className="names-wall">{g.names.map((n, i) => <span key={n + i} className="name-chip" style={{ animationDelay: Math.min(i, 20) * 30 + 'ms' }}>{n}</span>)}</div>
        <p className="screen-ref"><b>{g.names.length}</b> joined · <b>{g.facts}</b> fun facts · <b>{g.questions}</b> questions in the box</p>
        {controls}
      </div>
      <div className="screen-qr"><Qr text={link} size={300} /><p><b>Scan to join</b><br />{link.replace(/^https?:\/\//, '')}</p></div>
      <a className="screen-exit" href="#/admin">✕</a>
    </div>
  );
  if (g.phase === 'end') return (
    <div className="screen panel">
      <div className="screen-main"><p className="eyebrow">Day 1 game</p><h1 className="screen-q">🏆 Top guessers</h1>
        <div className="podium">{(g.top || []).map((t, i) => <div key={t.name} className="pod" style={{ animationDelay: i * 150 + 'ms' }}><b>{['🥇', '🥈', '🥉', '4', '5'][i]}</b><span>{t.name}</span><em>{t.score}</em></div>)}</div>
        {!(g.top || []).length && <p className="screen-ref">No one scored — everyone’s a mystery!</p>}
      </div>{controls}<a className="screen-exit" href="#/admin">✕</a>
    </div>
  );
  return (
    <div className="screen panel">
      <div className="screen-main">
        <p className="eyebrow">{g.kind === 'who' ? 'Who wrote this?' : 'This or that'} · round {g.round + 1}</p>
        <h1 className="screen-q" key={g.round}>{g.kind === 'who' ? `“${g.q}”` : g.q}</h1>
        {!g.reveal && <p className="screen-ref"><b>{g.answered}</b> of {g.names.length} answered</p>}
        {g.reveal && g.kind === 'who' && <div className="who-reveal"><span>It was</span><h2>{g.answer.name}</h2><p>{g.right} of {total} guessed right</p></div>}
        {g.reveal && g.kind === 'poll' && <div className="poll-bars">{g.opts.map((o, i) => <div key={i} className="pbar"><span>{o}</span><div><i style={{ width: (total ? g.counts[i] / total * 100 : 0) + '%' }} /></div><b>{g.counts[i]}</b></div>)}</div>}
        {!g.reveal && g.kind === 'poll' && <div className="poll-opts">{g.opts.map((o, i) => <span key={i}>{o}</span>)}</div>}
      </div>
      {controls}
      <a className="screen-exit" href="#/admin">✕</a>
    </div>
  );
}

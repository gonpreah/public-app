/* Uriah's admin page (#/admin): the class code and week, each day's slides, the anonymous questions,
   and QR codes for the class and church links. Password: LS_ADMIN_PASSWORD in Netlify. */
import { useEffect, useState } from 'react';
import { api, errText } from './core/api.js';
import { DAYS, TOPICS } from './teachings/lordship/content.js';
import { toast, copyText } from './core/ui.jsx';
import Qr from './core/Qr.jsx';

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
      <div className="chips">{[['questions', 'Questions'], ['slides', 'Slides'], ['class', 'Class & links']].map(([k, l]) =>
        <button key={k} className={'chip' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === 'class' && <ClassSettings pw={pw} cfg={d.cfg} onSaved={(cfg) => setD(Object.assign({}, d, { cfg }))} />}
      {tab === 'slides' && <SlidesAdmin pw={pw} slides={d.slides} onChange={(slides) => setD(Object.assign({}, d, { slides }))} />}
      {tab === 'questions' && <QuestionsAdmin pw={pw} />}
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
          <button className="btn soft small" onClick={() => copyText(classLink)}>Copy</button>
        </div>
      )}
      <div className="card" style={{ textAlign: 'center' }}>
        <h3>Church (public) link</h3>
        <Qr text={churchLink} />
        <p><code>{churchLink}</code></p>
        <button className="btn soft small" onClick={() => copyText(churchLink)}>Copy</button>
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

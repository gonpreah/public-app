/* 1. A day's session: title, big idea, scripture with the text, breakout questions, the slides
   (viewed in the app, PDF download, PPTX if uploaded), my notes, and today's people group. */
import { lazy, Suspense, useEffect, useState } from 'react';
import { DAYS, TEACHING } from '../content.js';
import { useLocal } from '../../../core/store.js';
import { K } from '../state.js';
import { getSlides, getFile, saveBlob } from '../../../core/slides.js';
import { errText } from '../../../core/api.js';
import PeopleGroup from './PeopleGroup.jsx';

const PdfView = lazy(() => import('../../../core/PdfView.jsx'));
let slidesCache = null;

export function todayDayId(weekStart) {
  const d = new Date();
  if (weekStart) {
    const n = Math.floor((d - new Date(weekStart + 'T00:00:00')) / 86400000);
    if (n >= 0 && n < 5) return DAYS[n].id;
  }
  const dow = d.getDay();
  return (DAYS.find(x => x.dow === dow) || {}).id || null;
}

export function DayTabs({ cur, today }) {
  return (
    <div className="daytabs">
      {DAYS.map(d => <a key={d.id} href={'#/day/' + d.id} className={(cur === d.id ? 'on ' : '') + (today === d.id ? 'today' : '')}>{d.name.slice(0, 3)}<small>{today === d.id ? 'today' : ''}</small></a>)}
    </div>
  );
}

function Slides({ code, day }) {
  const [meta, setMeta] = useState(slidesCache);
  const [err, setErr] = useState('');
  const [blob, setBlob] = useState(null);
  const [prog, setProg] = useState(0);
  const [view, setView] = useState(false);
  useEffect(() => {
    if (!slidesCache) getSlides(code).then(s => { slidesCache = s; setMeta(s); }).catch(e => setErr(errText(e)));
  }, [code]);
  useEffect(() => { setBlob(null); setView(false); setProg(0); }, [day]);
  const m = meta && meta[day];
  if (err) return <p className="err">{err}</p>;
  if (!meta) return <p className="muted">Loading slides…</p>;
  if (!m || (!m.pdf && !m.pptx && !m.link)) return <p className="muted">Slides for this day aren’t up yet.</p>;
  async function load(kind) {
    setErr(''); setProg(0.01);
    try { const b = await getFile(code, day, kind, m[kind], setProg); if (kind === 'pdf') setBlob(b); return b; }
    catch (e) { setErr(errText(e)); setProg(0); return null; }
  }
  return (
    <>
      {m.pdf && !view && <button className="btn primary big" onClick={async () => { if (await load('pdf')) setView(true); }}>{prog > 0 && prog < 1 ? `Loading… ${Math.round(prog * 100)}%` : 'View slides'}</button>}
      {view && blob && <Suspense fallback={<p className="muted">Opening…</p>}><PdfView blob={blob} /></Suspense>}
      <div className="row wrap">
        {m.pdf && <button className="btn soft small" onClick={async () => { const b = blob || await load('pdf'); if (b) saveBlob(b, m.pdf.name); }}>Download PDF</button>}
        {m.pptx && <button className="btn soft small" onClick={async () => { const b = await load('pptx'); if (b) saveBlob(b, m.pptx.name); }}>Download PPTX (editable)</button>}
        {m.link && <a className="btn ghost small" href={m.link} target="_blank" rel="noopener noreferrer">Open online</a>}
      </div>
    </>
  );
}

export default function Day({ code, id, weekStart }) {
  const d = DAYS.find(x => x.id === id) || DAYS[0];
  const [notes, setNotes] = useLocal(K.notes(d.id), '');
  const today = todayDayId(weekStart);
  return (
    <>
      <DayTabs cur={d.id} today={today} />
      <p className="eyebrow">{d.name}</p>
      <h1>{d.title}</h1>
      <p className="bigidea">{d.bigIdea}</p>
      <h4>Scripture</h4>
      {d.scripture.map(s => <div className="scripture" key={s.ref}><b>{s.ref}</b><p>{s.text}</p></div>)}
      <p className="tiny muted">{TEACHING.translation}</p>
      <h4>Breakout questions</h4>
      <ol className="qs">{d.questions.map((q, i) => <li key={i}>{q}</li>)}</ol>
      <h4>Slides</h4>
      <Slides code={code} day={d.id} />
      <h4>My notes</h4>
      <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Stays on this phone" />
      <PeopleGroup />
    </>
  );
}

/* Friday's plan: "Stay in YWAM. Keep growing." 2, 5 and 10 years (firm foundations, skilled up, all in and planted),
   lock in by year 10, a sphere, the LPU pathway, the mentor map, and one required next step in 30 days. Private by
   default; "share with my staff" sends only the next step and sphere. Then the throw-down and the 7/14/30-day check-ins. */
import { useState } from 'react';
import { PLAN10, LOCK_IN, SPHERE7 } from '../content.js';
import { useLocal, todayStr, addDays, read } from '../../../core/store.js';
import { K } from '../state.js';
import { api, errText } from '../../../core/api.js';
import { authArgs, getMe } from '../../../core/account.js';
import { burst, shareText, toast } from '../../../core/ui.jsx';
import { downloadIcs } from '../../../core/ics.js';
import { MentorMap } from './Hot.jsx';

export const val = (v) => typeof v === 'string' ? v : v && typeof v === 'object' ? Object.values(v).filter(x => typeof x === 'string').filter(Boolean).join('\n') : '';
const daysSince = (d) => d ? Math.floor((Date.now() - d) / 86400000) : -1;

/* Which check-in is due: 7, 14 or 30 days after the throw-down, not yet answered. */
export function dueStep(p) {
  if (!p || !p.declared) return null;
  const n = daysSince(p.declared), ck = p.checks || {};
  return ['d30', 'd14', 'd7'].find(w => n >= +w.slice(1) && !ck[w]) || null;
}

export function planText(p) {
  const out = [];
  PLAN10.forEach(h => {
    const lines = h.fields.map(f => (p[h.id] || {})[f.id] ? `  ${f.label}: ${(p[h.id] || {})[f.id]}` : '').filter(Boolean);
    if (lines.length) out.push(`${h.years} · ${h.title}\n` + lines.join('\n'));
  });
  const locked = LOCK_IN.filter(l => (p.lock || {})[l[0]]).map(l => l[1]);
  if (locked.length) out.push('By year 10: ' + locked.join(' · '));
  const sp = SPHERE7.find(x => x[0] === p.sphere);
  if (sp) out.push('My sphere: ' + sp[2]);
  if (p.step) out.push(`My next step (by ${p.by || 'in 30 days'}): ${p.step}`);
  return out.join('\n\n');
}

export default function Growth({ code }) {
  const [p, setP] = useLocal(K.plan10, {});
  const [old] = useLocal(K.growth, {});
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const me = getMe();
  const set = (patch) => setP(Object.assign({}, p, patch));
  const setF = (h, f, v) => set({ [h]: Object.assign({}, p[h] || {}, { [f]: v }) });
  const by = p.by || addDays(todayStr(), 30);
  const due = dueStep(p);
  const oldNotes = ['y2', 'y5', 'y10'].map(k => val(old[k])).filter(Boolean).join('\n');

  async function save(patch, quiet) {
    const n = Object.assign({}, p, patch);
    if (patch.declared === true) n.declared = p.declared || Date.now();   // a time, never just true (the check-ins count days from it)
    setP(n);
    if (!code || !me) return n;
    setBusy(true);
    try { const r = await api('stepSave', Object.assign({ code, step: n.step, sphere: n.sphere, by: n.by || by, share: !!n.share, declared: !!n.declared }, authArgs())); setP(Object.assign({}, read(K.plan10, n), { declared: r.declared || 0 })); if (!quiet) toast('Saved'); }
    catch (e) { toast(errText(e)); }
    setBusy(false);
    return n;
  }
  async function check(answer) {
    setBusy(true);
    try {
      await api('stepCheck', Object.assign({ code, at: due, answer, note }, authArgs()));
      set({ checks: Object.assign({}, p.checks, { [due]: { a: answer, note, at: Date.now() } }) }); setNote(''); toast('Thanks — keep going');
    } catch (e) { toast(errText(e)); }
    setBusy(false);
  }

  return (
    <div className="plan10">
      <p className="eyebrow">Friday · 2 Timothy 2:3–6</p>
      <h1>Stay in YWAM. <em>Keep growing.</em></h1>
      <p className="lead">Five years growing, five years planting. Write a line where you can — it stays on your phone unless you share it.</p>

      {due && (
        <div className="card stepcheck">
          <p className="eyebrow">{due.slice(1)}-day check-in</p>
          <h3>Did you take your step?</h3>
          <p className="muted">“{p.step}”</p>
          <textarea rows={2} value={note} maxLength={300} onChange={e => setNote(e.target.value)} placeholder="A note (optional)" aria-label="Check-in note" />
          <div className="row wrap">{[['yes', '✅ Yes'], ['partly', '🌓 Partly'], ['not', '⏳ Not yet']].map(([a, l]) => <button key={a} className="btn soft" disabled={busy} onClick={() => check(a)}>{l}</button>)}</div>
        </div>
      )}

      {PLAN10.map(h => (
        <div className="card horizon" key={h.id}>
          <p className="eyebrow">{h.years}</p>
          <h3>{h.title}</h3>
          <p className="muted small">{h.hint}</p>
          {h.fields.map(f => (
            <div key={f.id} className="pf">
              <label className="lab" htmlFor={h.id + f.id}>{f.label}</label>
              <input id={h.id + f.id} value={(p[h.id] || {})[f.id] || ''} maxLength={160} placeholder={f.ph} onChange={e => setF(h.id, f.id, e.target.value)} />
              {f.ideas && <div className="chips">{f.ideas.map(i => <button key={i} className="chip" onClick={() => setF(h.id, f.id, i)}>{i}</button>)}</div>}
            </div>
          ))}
          {h.id === 'y2' && (
            <div className="lpu">
              <b>🎓 The LPU pathway</b>
              <p>2 years in YWAM + 1 year with Life Pacific University = a bachelor’s degree.</p>
              <p className="small muted">Talk to staff about how your schools count.</p>
            </div>
          )}
        </div>
      ))}

      <div className="card">
        <h3>By year 10, lock in</h3>
        {LOCK_IN.map(([id, l]) => (
          <label key={id} className="lockin"><input type="checkbox" checked={!!(p.lock || {})[id]} onChange={e => set({ lock: Object.assign({}, p.lock, { [id]: e.target.checked }) })} /> {l}</label>
        ))}
      </div>

      <div className="card">
        <h3>My sphere</h3>
        <p className="muted small">Where do you sense God sending you to make him known?</p>
        <div className="chips">{SPHERE7.map(([id, em, l]) => <button key={id} className={'chip' + (p.sphere === id ? ' on' : '')} aria-pressed={p.sphere === id} onClick={() => set({ sphere: p.sphere === id ? '' : id })}>{em} {l}</button>)}</div>
      </div>

      <h2>My mentor map</h2>
      <MentorMap />

      <div className="card nextstep">
        <p className="eyebrow">Required</p>
        <h3>One next step in the next 30 days</h3>
        <input value={p.step || ''} maxLength={200} aria-label="My next step" placeholder="e.g. Email the LPU office · Ask Naomi to mentor me · Start Khmer lessons" onChange={e => set({ step: e.target.value })} />
        <label className="lab" htmlFor="stepby">By</label>
        <input id="stepby" type="date" value={by} onChange={e => set({ by: e.target.value })} />
        <label className="lockin"><input type="checkbox" checked={!!p.share} onChange={e => save({ share: e.target.checked }, true)} /> Share my next step and sphere with my staff</label>
        <p className="tiny muted">Private by default. Shared, staff see your name, this step and your sphere — never the rest of your plan.</p>
        {!p.declared
          ? <button className="btn primary big" disabled={busy || !(p.step || '').trim()} onClick={async (e) => { const el = e.currentTarget; const n = await save({ declared: true, step: (p.step || '').trim(), by }, true); if (n.declared || !code) { burst(el, 30); toast('Declared! 🚩'); } }}>🚩 Throw it down: declare my step</button>
          : <>
            <p className="ok">🚩 Declared. We’ll check in at 7, 14 and 30 days.</p>
            <div className="row wrap">
              <button className="btn soft small" onClick={() => downloadIcs([7, 14, 30].map(n => ({ date: addDays(todayStr(), n), title: `Lordship: did you take your step? (day ${n})`, text: `My next step: “${p.step}”. Open the Lordship app and do your check-in.` })), 'lordship-next-step.ics')}>📅 Add the check-ins to my calendar</button>
              <button className="btn ghost small" disabled={busy} onClick={() => save({ step: (p.step || '').trim() })}>Update my step</button>
            </div>
          </>}
      </div>

      <button className="btn ghost" onClick={() => shareText('Stay in YWAM. Keep growing.\n\n' + planText(Object.assign({}, p, { by })), 'My 2 · 5 · 10')}>Share or copy my plan</button>
      {oldNotes && <details className="more"><summary>My earlier notes</summary><p className="small" style={{ whiteSpace: 'pre-wrap' }}>{oldNotes}</p></details>}
    </div>
  );
}

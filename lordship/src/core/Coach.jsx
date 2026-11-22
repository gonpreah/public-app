/* The coach: a short chat with Claude, one question at a time. The chat lives on the phone;
   the server keeps a turn only until it's answered. "Save" asks Claude to distill it. */
import { useEffect, useRef, useState } from 'react';
import { coach, errText } from './api.js';
import { useLocal } from './store.js';
import { Spark } from './ui.jsx';

export default function Coach({ tool, code, context, storeKey, intro, optional = true, canSave = true, saveLabel = 'Save what I’m taking away', onSaved, startLabel = 'Start with the coach' }) {
  const [msgs, setMsgs] = useLocal(storeKey, []);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [partial, setPartial] = useState('');
  const [open, setOpen] = useState(false);
  const end = useRef(null);
  useEffect(() => { if (msgs.length && end.current) end.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [msgs.length, busy, partial.length > 0]);

  async function turn(next) {
    setErr(''); setBusy('think'); setPartial('');
    if (next.length) setMsgs(next);
    try {
      const reply = await coach({ code, tool, messages: next, context, onPartial: setPartial });
      setMsgs(next.concat([{ role: 'assistant', content: String(reply || '').trim() || '…' }]));
    } catch (e) { setErr(errText(e)); setMsgs(next); }
    setBusy(''); setPartial('');
  }
  function send(e) {
    e && e.preventDefault();
    const t = draft.trim();
    if (!t || busy) return;
    setDraft('');
    turn(msgs.concat([{ role: 'user', content: t }]));
  }
  async function save() {
    setErr(''); setBusy('save');
    try { const r = await coach({ code, tool, messages: msgs, context, distill: true }); onSaved && onSaved(r); }
    catch (e) { setErr(errText(e)); }
    setBusy('');
  }
  const userTurns = msgs.filter(m => m.role === 'user').length;
  if (optional && !open && !msgs.length) return (
    <button className="coach-mini" onClick={() => setOpen(true)}>
      <span className="coach-av"><Spark size={14} color="currentColor" /></span>
      <span><b>Stuck? Ask for a question</b><small>An optional AI coach asks one question at a time.</small></span><span className="go">›</span>
    </button>
  );

  return (
    <div className="coach card">
      <div className="coach-h"><span className="coach-av"><Spark size={16} color="currentColor" /></span> <b>Coach</b><span className="muted small"> · one question at a time</span>
        <a className="helplink" href={(location.hash.startsWith('#/church') ? '#/church' : '#/t') + '/help'}>Need to talk to someone?</a></div>
      {intro && !msgs.length && <p className="muted">{intro}</p>}
      {!msgs.length && <button className="btn primary big" disabled={!!busy} onClick={() => turn([])}>{busy ? 'Thinking…' : startLabel}</button>}
      <div className="msgs">
        {msgs.map((m, i) => <div key={i} className={'msg ' + m.role}>{m.content}</div>)}
        {busy === 'think' && (partial
          ? <div className="msg assistant live">{partial}<span className="caret" /></div>
          : <div className="msg assistant typing" aria-label="The coach is thinking"><i /><i /><i /></div>)}
        <div ref={end} />
      </div>
      {err && <p className="err">{err}</p>}
      {msgs.length > 0 && (
        <form className="say" onSubmit={send}>
          <textarea rows={2} value={draft} placeholder="Type your answer…" maxLength={2000}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(pointer: fine)').matches) send(e); }} />
          <button className="btn primary" disabled={!draft.trim() || !!busy}>Send</button>
        </form>
      )}
      {msgs.length > 0 && (
        <div className="row wrap">
          {canSave && userTurns > 0 && <button className="btn soft" disabled={!!busy} onClick={save}>{busy === 'save' ? 'Saving…' : saveLabel}</button>}
          <button className="linkish" disabled={!!busy} onClick={() => { if (confirm('Clear this chat and start again?')) { setMsgs([]); setErr(''); } }}>Start over</button>
        </div>
      )}
      <p className="muted tiny">The coach is an AI. It can be wrong — test what it says with scripture and your leaders. Struggling? Talk to a staff member today.</p>
    </div>
  );
}

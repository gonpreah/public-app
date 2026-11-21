/* 10. Anonymous question box: no name, no account, no device id — just the words and a topic. */
import { useState } from 'react';
import { TOPICS } from '../content.js';
import { api, errText } from '../../../core/api.js';

export default function Questions({ code }) {
  const [text, setText] = useState('');
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  async function send() {
    setBusy(true); setErr('');
    try { await api('ask', { code, text, topic: topic || 'other' }); setDone(true); setText(''); setTopic(''); }
    catch (e) { setErr(errText(e)); }
    setBusy(false);
  }
  return (
    <>
      <p className="eyebrow">Anonymous</p>
      <h1>Question box</h1>
      <p className="lead">Ask anything — romance, sexuality, money, struggles, faith. Uriah and Naomi may answer it in class or on the Thursday panel.</p>
      <div className="note small">🔒 <b>Truly anonymous.</b> We don’t store your name, account, phone or IP address — only your words and the topic. Leave out details that would identify you or anyone else.</div>
      {done ? (
        <div className="card"><h3>Sent. Thank you for asking.</h3><p className="muted">Asking is brave. Listen out for it in class.</p><button className="btn soft" onClick={() => setDone(false)}>Ask another</button></div>
      ) : (
        <div className="card">
          <label className="lab">Topic</label>
          <div className="chips">{TOPICS.map(t => <button key={t.id} className={'chip' + (topic === t.id ? ' on' : '')} onClick={() => setTopic(t.id)}>{t.name}</button>)}</div>
          <label className="lab" htmlFor="q">Your question</label>
          <textarea id="q" rows={5} value={text} maxLength={1200} onChange={e => setText(e.target.value)} />
          {err && <p className="err">{err}</p>}
          <button className="btn primary big" style={{ marginTop: 10 }} disabled={busy || text.trim().length < 3} onClick={send}>{busy ? 'Sending…' : 'Send anonymously'}</button>
        </div>
      )}
      <p className="muted small">If you’re in danger or thinking about hurting yourself, please don’t wait for class — talk to a staff member today.</p>
    </>
  );
}

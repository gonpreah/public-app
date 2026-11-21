/* "Need to talk to someone now?" — reachable from every coaching screen. */
import { HELP, LINKS } from '../content.js';

export default function Help({ church }) {
  const contact = LINKS.contact.filter(l => !/PLACEHOLDER/.test(l.href));
  return (
    <>
      <p className="eyebrow">You’re not alone</p>
      <h1>Need to talk to someone now?</h1>
      <p className="lead">{HELP.intro}</p>
      {!church && <div className="card"><h3>In the DTS</h3><p>{HELP.staff}</p></div>}
      {contact.length > 0 && (
        <div className="card connect"><h3>Uriah &amp; Naomi</h3>{contact.map(l => <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>)}</div>
      )}
      {church && <div className="card"><h3>At church</h3><p>Talk to a pastor or a leader you trust today — that’s what they’re there for.</p></div>}
      <div className="card">
        {HELP.emergency.map(e => <div className="item" key={e.where}><b>{e.where}</b><p className="small" style={{ margin: '4px 0 0' }}>{e.text}</p></div>)}
      </div>
      <p className="muted small">“The Lord is near to those who have a broken heart.” — Psalm 34:18</p>
    </>
  );
}

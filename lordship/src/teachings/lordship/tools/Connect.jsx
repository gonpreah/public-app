/* Church mode's Connect page: small and low-key, with one clear way to give. */
import { LINKS, CHURCH } from '../content.js';

export default function Connect() {
  return (
    <>
      <p className="eyebrow">Connect</p>
      <h1>Stay in touch</h1>
      <p className="muted">{CHURCH.affirm}</p>
      <a className="btn primary big support" href={LINKS.support.href} target="_blank" rel="noopener noreferrer">{LINKS.support.label}</a>
      <div className="card connect small">
        <h3>Contact us</h3>
        {LINKS.contact.map(l => <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>)}
        <h4>Instagram</h4>
        {LINKS.instagram.map(l => <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>)}
        {LINKS.people.map(p => (
          <div key={p.name}><h4>{p.name}</h4>{p.links.map(l => <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>)}</div>
        ))}
        <h4>GonPreah</h4>
        <a href={LINKS.gonpreah.href} target="_blank" rel="noopener noreferrer">{LINKS.gonpreah.label}</a>
      </div>
    </>
  );
}

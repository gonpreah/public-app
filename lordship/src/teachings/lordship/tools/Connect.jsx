/* Church mode's Connect page: small and low-key, with one clear way to give. */
import { LINKS, CHURCH } from '../content.js';

const real = (l) => l && !/PLACEHOLDER/.test(l.href);
const A = ({ l }) => <a href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>;

export default function Connect() {
  const contact = LINKS.contact.filter(real), insta = LINKS.instagram.filter(real);
  const people = LINKS.people.map(p => ({ name: p.name, links: p.links.filter(real) })).filter(p => p.links.length);
  return (
    <>
      <p className="eyebrow">Connect</p>
      <h1>Stay in touch</h1>
      <p className="muted">{CHURCH.affirm}</p>
      {real(LINKS.support) && <a className="btn primary big support" href={LINKS.support.href} target="_blank" rel="noopener noreferrer">{LINKS.support.label}</a>}
      <div className="card connect small">
        {contact.length > 0 && <><h3>Contact us</h3>{contact.map(l => <A key={l.label} l={l} />)}</>}
        {insta.length > 0 && <><h4>Instagram</h4>{insta.map(l => <A key={l.label} l={l} />)}</>}
        {people.map(p => <div key={p.name}><h4>{p.name}</h4>{p.links.map(l => <A key={l.label} l={l} />)}</div>)}
        <h4>GonPreah</h4>
        <A l={LINKS.gonpreah} />
      </div>
    </>
  );
}

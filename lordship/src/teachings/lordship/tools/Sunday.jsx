/* The Sunday screen for the projector: scan to join, the "Not so, Lord" question, today's people group. */
import { useEffect } from 'react';
import { CHURCH } from '../content.js';
import { groupFor } from './PeopleGroup.jsx';
import Qr from '../../../core/Qr.jsx';
import { Spark } from '../../../core/ui.jsx';

export default function Sunday() {
  useEffect(() => { document.body.classList.add('bigScreen'); return () => document.body.classList.remove('bigScreen'); }, []);
  const g = groupFor();
  const link = location.origin + '/?church';
  return (
    <div className="screen">
      <div className="screen-main">
        <p className="eyebrow"><Spark size={18} color="var(--marigold)" /> Lordship · All in, full of joy</p>
        <h1 className="screen-q">Where do I call Jesus “Lord” — and also say <em>“not so”</em>?</h1>
        <p className="screen-ref">“Not so, Lord …” — Peter, {CHURCH.notSo.ref}</p>
        <div className="screen-pg" style={g.photo ? { backgroundImage: `linear-gradient(90deg, rgba(23,21,15,.92) 45%, rgba(23,21,15,.55)), url(${g.photo.src})` } : null}>
          <p className="eyebrow">Pray today for</p>
          <h2>{g.name} <span>· {g.where}</span></h2>
          <p>{g.pray}</p>
          {g.photo && <p className="screen-credit">Photo: {g.photo.caption} · {g.photo.by} · {g.photo.license}</p>}
        </div>
      </div>
      <div className="screen-qr">
        <Qr text={link} size={300} />
        <p><b>Scan to respond</b><br />{link.replace(/^https?:\/\//, '')}</p>
      </div>
      <a className="screen-exit" href="#/church">✕</a>
    </div>
  );
}

/* 11. Today's unreached people group (Cambodia, Laos and South-East Asia), with a prayer prompt. */
import { PEOPLE_GROUPS } from '../content.js';

export function groupFor(d) {
  d = d || new Date();
  const n = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86400000);
  return PEOPLE_GROUPS[n % PEOPLE_GROUPS.length];
}

export default function PeopleGroup({ big }) {
  const g = groupFor();
  return (
    <div className="card">
      <p className="eyebrow">People group of the day</p>
      <h3 style={big ? { fontSize: '1.5rem' } : null}>{g.name}</h3>
      <p className="muted small">{g.where}</p>
      <p>{g.about}</p>
      <div className="note">🙏 {g.pray}</div>
      <p className="tiny muted">Learn more at <a href="https://joshuaproject.net" target="_blank" rel="noopener noreferrer">joshuaproject.net</a>.</p>
    </div>
  );
}

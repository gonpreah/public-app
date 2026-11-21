/* The class's home and the church's home. */
import { DAYS, TEACHING, CHURCH } from './content.js';
import { TOOLS } from './index.jsx';
import { useLocal, todayStr } from '../../core/store.js';
import { K } from './state.js';
import { Spark, Tile } from '../../core/ui.jsx';
import { todayDayId, DayTabs } from './tools/Day.jsx';
import { dueCheckin } from './tools/Commit.jsx';
import PeopleGroup from './tools/PeopleGroup.jsx';

export function ClassHome({ cls }) {
  const [hs] = useLocal(K.habits, []);
  const [c] = useLocal(K.commit, {});
  const tid = todayDayId(cls.weekStart);
  const d = DAYS.find(x => x.id === tid);
  const due = dueCheckin(c);
  const t = todayStr();
  const tools = TOOLS.filter(x => x.cls);
  return (
    <>
      <section className="hero">
        <div className="spark-bg"><Spark size={110} color="var(--cobalt)" /></div>
        <p className="eyebrow">{cls.name}</p>
        <h1>Lordship:<br /><em>All in,</em> full of joy</h1>
        <p className="hand">Uriah &amp; Naomi Lyford</p>
      </section>
      {due && <a className="note" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }} href="#/t/commit">🚩 <b>Time for your {due === 'd30' ? '30' : '90'}-day check-in</b> on “{c.text}”</a>}
      {d ? (
        <a className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }} href={'#/day/' + d.id}>
          <p className="eyebrow">Today · {d.name}</p>
          <h2>{d.title}</h2>
          <p className="muted">{d.bigIdea}</p>
          <span className="btn primary small">Open today’s session</span>
        </a>
      ) : <h4>The week</h4>}
      <DayTabs cur={null} today={tid} />
      {hs.length > 0 && <a className="note" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }} href="#/t/habits">✅ Habits today: <b>{hs.filter(h => h.days[t]).length} of {hs.length}</b></a>}
      <h4>Tools</h4>
      <div className="tiles">{tools.map(x => <Tile key={x.id} href={'#/t/' + x.id} emoji={x.emoji} title={x.title} sub={x.sub} />)}</div>
      <PeopleGroup />
    </>
  );
}

export function ChurchHome() {
  const tools = TOOLS.filter(x => x.church && !['list', 'connect', 'people'].includes(x.id));
  return (
    <>
      <section className="hero">
        <div className="spark-bg"><Spark size={110} color="var(--cobalt)" /></div>
        <p className="eyebrow">{TEACHING.by}</p>
        <h1>Lordship:<br /><em>All in,</em> full of joy</h1>
        <p>Jesus is Lord — not just on Sunday, and not just of the easy parts. That’s good news: it leads to freedom and joy.</p>
      </section>
      <p className="lead">{CHURCH.affirm}</p>
      <h4>Respond</h4>
      <div className="tiles one">{tools.map(x => <Tile key={x.id} href={'#/church/' + x.id} emoji={x.emoji} title={x.title} sub={x.sub} />)}</div>
      <PeopleGroup />
      <h4>Join God’s mission</h4>
      <div className="card">
        {CHURCH.join.map(j => <div className="item" key={j.title}><b>{j.emoji} {j.title}</b><p className="muted small" style={{ margin: '2px 0 0' }}>{j.text}</p></div>)}
      </div>
      <div className="tiles">
        <Tile href="#/church/list" emoji="📝" title="My list" sub="What you saved" />
        <Tile href="#/church/connect" emoji="🤝" title="Connect" sub="Stay in touch" />
      </div>
    </>
  );
}

/* The class's home and the church's home. */
import { DAYS, TEACHING, CHURCH } from './content.js';
import { TOOLS } from './index.jsx';
import { useLocal, todayStr } from '../../core/store.js';
import { K } from './state.js';
import { Spark, Tile } from '../../core/ui.jsx';
import { todayDayId, DayTabs, JamesCard } from './tools/Day.jsx';
import { dueCheckin } from './tools/Commit.jsx';
import PeopleGroup from './tools/PeopleGroup.jsx';
import Install from '../../core/Install.jsx';
import { useGame } from './tools/Game.jsx';
import { planAreas, Venn } from './tools/LayDown.jsx';
import { ALIGN } from './content.js';

function PlansGlance({ base }) {
  const [plans] = useLocal('lordship.plans', {});
  const areas = planAreas().filter(a => plans[a.id] && plans[a.id].align);
  return (
    <a className="card glance" href={base}>
      <div className="glance-h"><div><p className="eyebrow">My plan vs God’s plan</p>
        <h3>{areas.length ? `${areas.length} area${areas.length > 1 ? 's' : ''} laid side by side` : 'Lay your plans next to his'}</h3></div>
        <Venn align={areas.length ? Math.round(areas.reduce((s, a) => s + plans[a.id].align, 0) / areas.length) : 2} size={80} labels={false} /></div>
      {areas.length > 0 && <div className="glance-row">{areas.slice(0, 6).map(a => <span key={a.id} className="pill" title={ALIGN[plans[a.id].align]}>{a.emoji} {a.name} · {plans[a.id].align}/5</span>)}</div>}
    </a>
  );
}

function Welcome({ church }) {
  const [seen, setSeen] = useLocal('lordship.welcomed' + (church ? '.church' : ''), false);
  if (seen) return null;
  return (
    <div className="card welcome">
      <h3>👋 How this works</h3>
      <ol className="small">
        {church ? <>
          <li><b>My plan vs God’s plan</b> — lay your plans for money, romance, your future next to what you sense God’s plan is.</li>
          <li><b>The wheel</b> — an honest look at your whole life.</li>
          <li><b>Pray</b> for today’s unreached people group.</li>
        </> : <>
          <li>Each day: read the session, then do <b>today’s response</b> at the bottom.</li>
          <li>At the heart of the week: <b>my plan vs God’s plan</b>, area by area.</li>
          <li>We live in <b>James</b>: one chapter a day, five minutes, one thing to do.</li>
          <li>Friday: <b>throw down</b> — say what you’re picking up.</li>
        </>}
      </ol>
      <p className="tiny muted">Everything you write stays on this phone. Use “Save my work” to keep a copy.</p>
      <button className="btn soft small" onClick={() => setSeen(true)}>Got it</button>
    </div>
  );
}

function GameBanner({ code }) {
  const [g] = useGame(code, 8000);
  if (!g || g.phase === 'off') return null;
  return <a className="gamebanner" href="#/t/game"><span>🎲</span><b>{g.phase === 'end' ? 'See the game results' : 'The game is on — join in!'}</b><span className="go">›</span></a>;
}

export function ClassHome({ cls }) {
  const [hs] = useLocal(K.habits, []);
  const [c] = useLocal(K.commit, {});
  const tid = todayDayId(cls.weekStart);
  const d = DAYS.find(x => x.id === tid);
  const due = dueCheckin(c);
  const t = todayStr();
  const ORDER = ['quiz', 'game', 'laydown', 'wheel', 'commit', 'questions'];
  const tools = ORDER.map(id => TOOLS.find(x => x.id === id)).filter(Boolean);
  const more = TOOLS.filter(x => x.cls && x.more);
  const [done] = useLocal(K.days, {});
  const nDone = DAYS.filter(x => done[x.id]).length;
  return (
    <>
      <section className="hero">
        <div className="spark-bg"><Spark size={110} color="var(--cobalt)" /></div>
        <p className="eyebrow">{cls.name}</p>
        <h1>Lordship:<br /><em>All in,</em> full of joy</h1>
        <p className="tagline">My plan, or God’s plan?</p>
        <p className="hand">Uriah &amp; Naomi Lyford</p>
        <div className="weekring" aria-label={`${nDone} of 5 days responded`}>
          <svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="3.2" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--marigold)" strokeWidth="3.2" strokeLinecap="round" strokeDasharray={`${nDone / 5 * 100} 100`} transform="rotate(-90 18 18)" className="ringfill" /></svg>
          <span><b>{nDone}/5</b><small>days</small></span>
        </div>
      </section>
      <GameBanner code={cls.code} />
      <Install where="class" />
      <Welcome />
      {due && <a className="note" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }} href="#/t/commit">🚩 <b>Time for your {due === 'd30' ? '30' : '90'}-day check-in</b> on “{c.text}”</a>}
      {d ? (
        <div className="card today">
          <a className="today-link" href={'#/day/' + d.id}>
            <p className="eyebrow">Today · {d.name}</p>
            <h2>{d.title}</h2>
            {d.sticky && <p className="sticky">{d.sticky}</p>}
            <p className="muted">{d.bigIdea}</p>
          </a>
          <p className="lab">Today’s response {done[d.id] ? '· ✓ done' : ''}</p>
          <div className="chips">{d.respond.map(x => { const t = TOOLS.find(y => y.id === x.tool); return t ? <a key={x.tool} className="chip" href={'#/t/' + t.id}>{t.emoji} {t.title}</a> : null; })}</div>
          <a className="btn primary small" href={'#/day/' + d.id}>Open today’s session</a>
        </div>
      ) : <h4>The week</h4>}
      <h4>Live class polls</h4>
      <div className="tiles">{TOOLS.filter(x => x.poll).sort((a, b) => (b.day === tid) - (a.day === tid)).map(x => <Tile key={x.id} href={'#/t/' + x.id} emoji={x.emoji} title={x.title} sub={x.sub} />)}</div>
      <DayTabs cur={null} today={tid} />
      {d && <JamesCard d={d} link />}
      <PlansGlance base="#/t/laydown" />
      <h4>Tools</h4>
      <div className="tiles">{tools.map(x => <Tile key={x.id} href={'#/t/' + x.id} emoji={x.emoji} title={x.title} sub={x.sub} />)}</div>
      <details className="more">
        <summary>More tools</summary>
        <div className="tiles">{more.map(x => <Tile key={x.id} href={'#/t/' + x.id} emoji={x.emoji} title={x.title} sub={x.sub} />)}</div>
      </details>
      <PeopleGroup />
    </>
  );
}

export function ChurchHome() {
  const tools = TOOLS.filter(x => x.church && !x.hidden && !['list', 'connect', 'people', 'data'].includes(x.id));
  return (
    <>
      <section className="hero">
        <div className="spark-bg"><Spark size={110} color="var(--cobalt)" /></div>
        <p className="eyebrow">{TEACHING.by}</p>
        <h1>Lordship:<br /><em>All in,</em> full of joy</h1>
        <p className="tagline">My plan, or God’s plan?</p>
        <p>Jesus is Lord — not just on Sunday, and not just of the easy parts. Laying our plans next to his is good news: it leads to freedom and joy.</p>
      </section>
      <Install where="church" />
      <p className="lead">{CHURCH.affirm}</p>
      <Welcome church />
      <PlansGlance base="#/church/laydown" />
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
        <Tile href="#/church/data" emoji="💾" title="Save my work" sub="Back up with a code" />
      </div>
    </>
  );
}

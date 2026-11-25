/* The shell: landing (class code), the class view, the public church view, and the admin page.
   Routes: #/ · #/class · #/day/<mon…fri> · #/t/<tool> · #/church · #/church/<tool> · #/admin
   ?class=CODE opens the class; ?church opens church mode; ?quiz the base-wide profile quiz (#/quiz),
   whose live results are #/quiz-results. */
import { useEffect, useState } from 'react';
import { useRoute, go } from './core/router.js';
import { read, write } from './core/store.js';
import { api, errText } from './core/api.js';
import { Spark, Toast } from './core/ui.jsx';
import L from './teachings/lordship/index.jsx';
import { ClassHome, ChurchHome } from './teachings/lordship/Home.jsx';
import { todayDayId } from './teachings/lordship/tools/Day.jsx';
import Admin, { Panel, GameScreen } from './Admin.jsx';
import Join from './core/Join.jsx';
import { getMe, setMe } from './core/account.js';
import { ThemeToggle } from './core/theme.jsx';
import Install from './core/Install.jsx';
import PubQuiz, { QuizResults } from './teachings/lordship/tools/PubQuiz.jsx';
import LivePoll, { LivePollResults } from './teachings/lordship/tools/LivePoll.jsx';
import { CloudScreen, ThrowdownScreen } from './teachings/lordship/tools/Games.jsx';

const CLS = 'lordship.class';

/* Projector screens: one tap to fill the screen (and back). */
function FullScreen() {
  const [on, setOn] = useState(!!document.fullscreenElement);
  useEffect(() => { const f = () => setOn(!!document.fullscreenElement); document.addEventListener('fullscreenchange', f); return () => document.removeEventListener('fullscreenchange', f); }, []);
  if (!document.documentElement.requestFullscreen) return null;
  return <button className="fsbtn" aria-label={on ? 'Exit full screen' : 'Full screen'} onClick={() => (on ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {})}>{on ? '⤡' : '⛶'}</button>;
}

/* Read ?class= / ?church once, before the router looks at the address, and tidy the address. */
const PENDING = (() => {
  const p = new URLSearchParams(location.search);
  const c = p.get('class');
  if (p.get('poll')) history.replaceState(null, '', location.pathname + '#/poll/' + encodeURIComponent(p.get('poll').toLowerCase()) + (p.get('room') ? '/' + encodeURIComponent(p.get('room').toUpperCase()) : ''));
  else if (p.has('quiz')) history.replaceState(null, '', location.pathname + '#/quiz');
  else if (p.has('church') || c) history.replaceState(null, '', location.pathname + (p.has('church') ? '#/church' : '#/'));
  return c || '';
})();

function Landing({ onJoin, initial }) {
  const [code, setCode] = useState(initial || '');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function join(e) {
    e && e.preventDefault();
    setBusy(true); setErr('');
    try {   // a Home Screen app still opens the class it was installed from: follow a student who has moved since
      const m = getMe(), r = await api('classCheck', Object.assign({ code }, m ? { sid: m.sid, token: m.token } : {}));
      onJoin(r.moved || { code: code.trim().toUpperCase(), name: r.name, weekStart: r.weekStart });
    }
    catch (er) { setErr(errText(er)); }
    setBusy(false);
  }
  useEffect(() => { if (initial) join(); }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <section className="hero">
        <div className="spark-bg"><Spark size={110} color="var(--cobalt)" /></div>
        <p className="eyebrow">{L.by}</p>
        <h1>Lordship:<br /><em>All in,</em> full of joy</h1>
        <p>A five-day teaching — and the tools to live it out.</p>
      </section>
      <form className="card" onSubmit={join}>
        <h3>In the class?</h3>
        <label className="lab" htmlFor="code">Class code</label>
        <input id="code" value={code} onChange={e => setCode(e.target.value.toUpperCase())} autoCapitalize="characters" autoComplete="off" placeholder="e.g. DTS2026" />
        {err && <p className="err">{err}</p>}
        <button className="btn primary big" style={{ marginTop: 12 }} disabled={busy || code.trim().length < 4}>{busy ? 'Checking…' : 'Open this week’s class'}</button>
      </form>
      <a className="tile" href="#/church"><span className="em">⛪</span><span><b>Visiting from church?</b><small>My plan vs God’s plan, the wheel, the reflection and today’s people group — no code needed.</small></span></a>
    </>
  );
}

export default function App() {
  const r = useRoute();
  const [cls, setCls] = useState(() => read(CLS, null));
  const [me, setMeS] = useState(getMe);
  const [joining, setJoining] = useState(false);   // keep the join screen up for its fun-fact step
  useEffect(() => { const on = () => setMeS(getMe()); window.addEventListener('gp-me', on); return () => window.removeEventListener('gp-me', on); }, []);
  useEffect(() => { const on = () => { setPending(''); setCls(read(CLS, null)); }; window.addEventListener('gp-class', on); return () => window.removeEventListener('gp-class', on); }, []);
  const [pending, setPending] = useState(PENDING);
  useEffect(() => {   // refresh the class (a new week may have a new code or start date)
    if (!cls) return;
    const m = getMe(), mine = m && m.code === cls.code ? { sid: m.sid, token: m.token } : {};
    api('classCheck', Object.assign({ code: cls.code }, mine)).then(x => {
      if (x.moved) { write(CLS, x.moved); setPending(''); setCls(x.moved); setMe(Object.assign({}, m, { code: x.moved.code })); return; }   // Uriah moved them to another class
      const n = Object.assign({}, cls, { name: x.name, weekStart: x.weekStart }); write(CLS, n); setCls(n);
    })
      .catch(e => { if (e.code === 'NO_CLASS') { write(CLS, null); setCls(null); } });
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const church = r[0] === 'church';
  useEffect(() => {   // "Add to Home Screen" should open straight into this class (or church mode)
    const m = document.getElementById('manifest');
    if (m) m.setAttribute('href', '/app.webmanifest' + (church ? '?church=1' : cls ? '?class=' + encodeURIComponent(cls.code) : ''));
  }, [church, cls && cls.code]);   // eslint-disable-line react-hooks/exhaustive-deps
  const admin = r[0] === 'admin';
  const FS = <FullScreen />;
  if (r[0] === 'panel') return <><Panel />{FS}<Toast /></>;
  if (r[0] === 'game') return <><GameScreen />{FS}<Toast /></>;
  if (r[0] === 'quiz-results') return <><QuizResults />{FS}<Toast /></>;
  if (r[0] === 'throwdown') return <><ThrowdownScreen code={r[1] || (cls && cls.code) || ''} />{FS}<Toast /></>;
  if (r[0] === 'cloud') return <><CloudScreen id={r[1]} room={r[2] || ''} key={r.join('/')} />{FS}<Toast /></>;
  if (r[0] === 'poll-results') return <><LivePollResults id={r[1]} room={r[2] || ''} key={r.join('/')} />{FS}<Toast /></>;
  const bareTool = church && r[1] && L.TOOLS.find(x => x.id === r[1] && x.bare);
  if (bareTool) return <bareTool.C />;
  const needsClass = ['class', 'day', 't'].includes(r[0]) || !r[0];
  const join = (c) => { write(CLS, c); setPending(''); setCls(c); go('class'); };

  let page;
  if (admin) page = <Admin />;
  else if (r[0] === 'quiz') page = <PubQuiz />;
  else if (r[0] === 'poll') page = <LivePoll id={r[1]} room={r[2] || ''} key={r.join('/')} />;
  else if (church) {
    const t = r[1] && L.TOOLS.find(x => x.id === r[1] && x.church);
    page = t ? <div className="toolpage" key={t.id}>{!r[2] && <a className="back" href="#/church">‹ Home</a>}<t.C church code="" sub={r[2]} /></div> : <ChurchHome />;
  } else if (!cls || pending && pending.toUpperCase() !== (cls && cls.code)) {
    page = <Landing onJoin={join} initial={pending} />;
  } else if (!me || me.code !== cls.code || joining) {
    page = <Join cls={cls} onStart={() => setJoining(true)} onDone={() => { setJoining(false); setMeS(getMe()); go('class'); }} />;
  } else if (r[0] === 'day') {
    page = <L.Day code={cls.code} id={r[1]} weekStart={cls.weekStart} />;
  } else if (r[0] === 't') {
    const t = L.TOOLS.find(x => x.id === r[1] && x.cls);
    page = t ? <div className="toolpage" key={t.id}>{!r[2] && <a className="back" href="#/class">‹ Home</a>}<t.C code={cls.code} sub={r[2]} /></div> : <ClassHome cls={cls} />;
  } else page = <ClassHome cls={cls} />;

  const tid = cls && todayDayId(cls.weekStart);
  const nav = church
    ? [['church', '🏠', 'Home'], ['church/wheel', '🎯', 'Wheel'], ['church/laydown', '⚖️', 'My plan'], ['church/people', '🌏', 'Pray'], ['church/connect', '🤝', 'Connect']]
    : cls && me && needsClass ? [['class', '🏠', 'Home'], ['day/' + (tid || 'mon'), '📖', 'Sessions'], ['t/laydown', '⚖️', 'My plan'], ['t/questions', '❓', 'Ask']]
      : null;
  const here = r.join('/') || 'class';
  const on = (p) => here === p || (here.startsWith(p + '/')) || (p.startsWith('day/') && r[0] === 'day');

  return (
    <>
      <header className="top">
        <a className="brandmark" href={church ? '#/church' : '#/class'}><Spark size={20} color="var(--accent)" /> Lordship</a>
        <span className="top-r">{!admin && !church && cls && me ? <a className="mechip" href="#/t/me" aria-label={'Me: ' + me.name}><span>{me.name.slice(0, 1).toUpperCase()}</span>{me.name.split(' ')[0]}</a>
          : <span className="mode">{admin ? 'Admin' : r[0] === 'quiz' ? 'Just for fun' : r[0] === 'poll' ? 'No names' : church ? 'Public' : cls ? cls.name : ''}</span>}<ThemeToggle /></span>
      </header>
      <main>{page}</main>
      {nav && <nav className="bottom">{nav.map(([p, e, l]) => <a key={p} href={'#/' + p} className={on(p) ? 'on' : ''}><span aria-hidden="true">{e}</span>{l}</a>)}</nav>}
      <Toast />
    </>
  );
}

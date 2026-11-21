/* The shell: landing (class code), the class view, the public church view, and the admin page.
   Routes: #/ · #/class · #/day/<mon…fri> · #/t/<tool> · #/church · #/church/<tool> · #/admin
   ?class=CODE opens the class; ?church opens church mode. */
import { useEffect, useState } from 'react';
import { useRoute, go } from './core/router.js';
import { read, write } from './core/store.js';
import { api, errText } from './core/api.js';
import { Spark, Toast } from './core/ui.jsx';
import L from './teachings/lordship/index.jsx';
import { ClassHome, ChurchHome } from './teachings/lordship/Home.jsx';
import { todayDayId } from './teachings/lordship/tools/Day.jsx';
import Admin, { Panel } from './Admin.jsx';
import { ThemeToggle } from './core/theme.jsx';

const CLS = 'lordship.class';

/* Read ?class= / ?church once, before the router looks at the address, and tidy the address. */
const PENDING = (() => {
  const p = new URLSearchParams(location.search);
  const c = p.get('class');
  if (p.has('church') || c) history.replaceState(null, '', location.pathname + (p.has('church') ? '#/church' : '#/'));
  return c || '';
})();

function Landing({ onJoin, initial }) {
  const [code, setCode] = useState(initial || '');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function join(e) {
    e && e.preventDefault();
    setBusy(true); setErr('');
    try { const r = await api('classCheck', { code }); onJoin({ code: code.trim().toUpperCase(), name: r.name, weekStart: r.weekStart }); }
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
      <a className="tile" href="#/church"><span className="em">⛪</span><span><b>Visiting from church?</b><small>The wheel, the reflection, Lay Down Take Up and today’s people group — no code needed.</small></span></a>
    </>
  );
}

export default function App() {
  const r = useRoute();
  const [cls, setCls] = useState(() => read(CLS, null));
  const [pending] = useState(PENDING);
  useEffect(() => {   // refresh the class (a new week may have a new code or start date)
    if (!cls) return;
    api('classCheck', { code: cls.code }).then(x => { const n = Object.assign({}, cls, { name: x.name, weekStart: x.weekStart }); write(CLS, n); setCls(n); })
      .catch(e => { if (e.code === 'NO_CLASS') { write(CLS, null); setCls(null); } });
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const church = r[0] === 'church';
  const admin = r[0] === 'admin';
  if (r[0] === 'panel') return <><Panel /><Toast /></>;
  const bareTool = church && r[1] && L.TOOLS.find(x => x.id === r[1] && x.bare);
  if (bareTool) return <bareTool.C />;
  const needsClass = ['class', 'day', 't'].includes(r[0]) || !r[0];
  const join = (c) => { write(CLS, c); setCls(c); go('class'); };

  let page;
  if (admin) page = <Admin />;
  else if (church) {
    const t = r[1] && L.TOOLS.find(x => x.id === r[1] && x.church);
    page = t ? <div className="toolpage" key={t.id}><a className="back" href="#/church">‹ Home</a><t.C church code="" /></div> : <ChurchHome />;
  } else if (!cls || pending && pending.toUpperCase() !== (cls && cls.code)) {
    page = <Landing onJoin={join} initial={pending} />;
  } else if (r[0] === 'day') {
    page = <L.Day code={cls.code} id={r[1]} weekStart={cls.weekStart} />;
  } else if (r[0] === 't') {
    const t = L.TOOLS.find(x => x.id === r[1] && x.cls);
    page = t ? <div className="toolpage" key={t.id}><a className="back" href="#/class">‹ Home</a><t.C code={cls.code} /></div> : <ClassHome cls={cls} />;
  } else page = <ClassHome cls={cls} />;

  const tid = cls && todayDayId(cls.weekStart);
  const nav = church
    ? [['church', '🏠', 'Home'], ['church/wheel', '🎯', 'Wheel'], ['church/laydown', '🙌', 'Lay down'], ['church/people', '🌏', 'Pray'], ['church/connect', '🤝', 'Connect']]
    : cls && needsClass ? [['class', '🏠', 'Home'], ['day/' + (tid || 'mon'), '📖', 'Sessions'], ['t/wheel', '🎯', 'Wheel'], ['t/habits', '✅', 'Habits'], ['t/questions', '❓', 'Ask']]
      : null;
  const here = r.join('/') || 'class';
  const on = (p) => here === p || (p.startsWith('day/') && r[0] === 'day');

  return (
    <>
      <header className="top">
        <a className="brandmark" href={church ? '#/church' : '#/class'}><Spark size={20} color="var(--accent)" /> Lordship</a>
        <span className="top-r"><span className="mode">{admin ? 'Admin' : church ? 'Public' : cls ? cls.name : ''}</span><ThemeToggle /></span>
      </header>
      <main>{page}</main>
      {nav && <nav className="bottom">{nav.map(([p, e, l]) => <a key={p} href={'#/' + p} className={on(p) ? 'on' : ''}><span aria-hidden="true">{e}</span>{l}</a>)}</nav>}
      <Toast />
    </>
  );
}

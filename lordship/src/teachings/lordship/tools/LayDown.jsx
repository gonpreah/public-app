/* 3. My plan vs God's plan (it was "Lay Down, Take Up"). Proverbs 16:9. For each area of life:
   what's my plan, what do I sense is God's plan, how close are they (two circles that move together),
   and where they differ — my "Not so, Lord", what I'll lay down and what I'll take up. The coach is optional. */
import { useState } from 'react';
import { LIFE_AREAS, PLAN_VERSE, PLAN_VERSE2, ALIGN, TEACHING } from '../content.js';
import { useLocal, todayStr, read, write } from '../../../core/store.js';
import { K, addHabit } from '../state.js';
import Coach from '../../../core/Coach.jsx';
import { toast, burst, shareText } from '../../../core/ui.jsx';

const GENERIC = {
  mine: ['My plan here is…', 'What I want most…', 'What I’m holding onto…'],
  gods: ['What I sense God is saying…', 'What scripture says about this…', 'What wise people have told me…']
};
export function planAreas() { return LIFE_AREAS.concat(read('lordship.planAreas', [])); }

/* Two circles — my plan and God's plan — closer as they line up (1 far apart … 5 one plan). */
export function Venn({ align, size = 220, labels = true }) {
  const a = align || 0;
  const off = a ? [0, 44, 32, 21, 10, 0][a] : 48;
  return (
    <svg className={'venn' + (a === 5 ? ' one' : '')} viewBox="0 0 220 140" width={size} height={size * 140 / 220} role="img"
      aria-label={a ? `My plan and God's plan: ${ALIGN[a]}` : 'My plan and God’s plan'}>
      <g style={{ transform: `translateX(${-off}px)` }} className="vc"><circle cx="110" cy="70" r="52" className="mine" /></g>
      <g style={{ transform: `translateX(${off}px)` }} className="vc"><circle cx="110" cy="70" r="52" className="gods" /></g>
      {labels && <>
        <text x={110 - off - (a === 5 ? 0 : 18)} y="74" textAnchor="middle" className="vl" style={{ opacity: a === 5 ? 0 : 1 }}>Mine</text>
        <text x={110 + off + (a === 5 ? 0 : 18)} y="74" textAnchor="middle" className="vl" style={{ opacity: a === 5 ? 0 : 1 }}>God’s</text>
        {a === 5 && <text x="110" y="74" textAnchor="middle" className="vl">One plan</text>}
      </>}
    </svg>
  );
}

function Prompts({ list, onPick }) {
  return <div className="chips small-chips">{list.map(p => <button key={p} className="chip" onClick={() => onPick(p)}>+ {p.replace(/…$/, '')}</button>)}</div>;
}

/* A surrender prayer made from their own words — no AI, nothing sent anywhere. */
export function prayerFor(a, p) {
  const clean = (t) => String(t || '').trim().replace(/\s+/g, ' ').replace(/[.…\s]+$/, '');
  const lines = [`Lord, here is my plan for ${a.name.toLowerCase()}: ${clean(p.mine) || 'I’m still working it out'}.`];
  if (p.gods) lines.push(`Here is what I sense you’re saying: ${clean(p.gods)}.`);
  if (p.notso) lines.push(`I confess I’ve said “not so” — ${clean(p.notso)}.`);
  if (p.laydown) lines.push(`I lay down ${clean(p.laydown)}.`);
  if (p.takeup) lines.push(`I take up ${clean(p.takeup)}.`);
  lines.push('Not my will, but yours be done. Your plan is better than mine. Amen.');
  return lines.join(' ');
}
function Prayer({ a, p }) {
  const [open, setOpen] = useState(false);
  const text = prayerFor(a, p);
  return (
    <div className="card prayer">
      <h3>🙏 Pray it</h3>
      {!open ? <><p className="muted small">Turn your two plans into a prayer of surrender, in your own words.</p>
        <button className="btn soft" onClick={() => setOpen(true)}>Make my prayer</button></>
        : <><p className="prayer-text">{text}</p><p className="tiny muted">“Not my will, but yours, be done.” — Luke 22:42</p>
          <div className="row wrap"><button className="btn ghost small" onClick={() => shareText(text, 'My prayer')}>Share or copy</button></div></>}
    </div>
  );
}

function Area({ a, code, church, base, next }) {
  const [plans, setPlans] = useLocal('lordship.plans', {});
  const [list, setList] = useLocal(K.list, []);
  const p = plans[a.id] || {};
  const set = (patch) => setPlans(cur => Object.assign({}, cur, { [a.id]: Object.assign({}, cur[a.id] || {}, patch, { at: todayStr() }) }));
  const add = (k, prompt) => set({ [k]: ((p[k] || '').replace(/\s*$/, '') + ((p[k] || '').trim() ? '\n' : '') + prompt + ' ') });
  const mine = a.mine || GENERIC.mine, gods = a.gods || GENERIC.gods;
  const saved = list.find(x => x.areaId === a.id);
  function save(e) {
    const item = { from: 'My plan vs God’s plan', areaId: a.id, area: a.name, notSoLord: p.notso || '', laydown: p.laydown || '', takeup: p.takeup || '', at: todayStr() };
    setList(saved ? list.map(x => x.areaId === a.id ? Object.assign({}, x, item) : x) : [Object.assign({ id: Math.random().toString(36).slice(2, 10) }, item)].concat(list));
    burst(e.currentTarget); toast(saved ? 'Updated on your list' : 'Saved to your list');
  }
  const ctx = `The area of life: ${a.name} (${a.hint})\nMy plan: ${p.mine || '(not written yet)'}\nWhat I sense God's plan is: ${p.gods || '(not written yet)'}${p.align ? `\nHow close they feel (1–5): ${p.align}` : ''}`;
  return (
    <>
      <a className="back" href={base}>‹ All areas</a>
      <p className="eyebrow">My plan vs God’s plan</p>
      <h1>{a.emoji} {a.name}</h1>
      <p className="muted">{a.hint}</p>
      {a.verse && <div className="scripture"><b>{a.verse.ref}</b><p>{a.verse.text}</p></div>}

      <div className="twoplans">
        <div className="plan-col mine">
          <h3><span className="dotc mine" /> My plan</h3>
          <p className="small muted">Honestly — what are you planning, wanting, holding onto?</p>
          <textarea rows={5} value={p.mine || ''} maxLength={1500} onChange={e => set({ mine: e.target.value })} aria-label={`My plan: ${a.name}`} placeholder="Write it as it really is…" />
          <Prompts list={mine} onPick={(x) => add('mine', x)} />
        </div>
        <div className="plan-col gods">
          <h3><span className="dotc gods" /> God’s plan</h3>
          <p className="small muted">What do you sense God’s plan is? Scripture, prayer, wise people, peace.</p>
          <textarea rows={5} value={p.gods || ''} maxLength={1500} onChange={e => set({ gods: e.target.value })} aria-label={`God's plan: ${a.name}`} placeholder="What might he be saying?" />
          <Prompts list={gods} onPick={(x) => add('gods', x)} />
        </div>
      </div>

      <div className="card align-card">
        <h3>How close are they?</h3>
        <Venn align={p.align} />
        <div className="chips align-chips">{[1, 2, 3, 4, 5].map(n =>
          <button key={n} className={'chip' + (p.align === n ? ' on' : '')} onClick={() => set({ align: n, hist: (p.hist || []).filter(h => h.d !== todayStr()).concat([{ d: todayStr(), a: n }]).slice(-12) })}>{ALIGN[n]}</button>)}</div>
      </div>

      {(p.hist || []).length > 1 && (() => { const first = p.hist[0], last = p.hist[p.hist.length - 1]; return (
        <p className="muted small align-hist">{first.d}: {ALIGN[first.a]} → {last.d}: {ALIGN[last.a]} {last.a > first.a ? '▲ closer' : last.a < first.a ? '▼ further' : ''}</p>); })()}
      <div className="card">
        <h3>Where they’re different</h3>
        <label className="lab">My “Not so, Lord” here (Acts 10:14)</label>
        <input value={p.notso || ''} maxLength={200} onChange={e => set({ notso: e.target.value })} placeholder="Lord, but not…" />
        <label className="lab">So I’ll lay down…</label>
        <input value={p.laydown || ''} maxLength={200} onChange={e => set({ laydown: e.target.value })} placeholder="My plan for…, my timeline for…" />
        <label className="lab">And take up…</label>
        <input value={p.takeup || ''} maxLength={200} onChange={e => set({ takeup: e.target.value })} placeholder="One thing I’ll actually do" />
        <div className="row wrap">
          <button className="btn primary" disabled={!(p.laydown || p.takeup)} onClick={save}>{saved ? 'Update my list' : 'Save to my list'}</button>
          {p.takeup && <button className="btn soft" onClick={() => toast(addHabit(p.takeup) ? 'Added to your habits' : 'Already a habit')}>Make it a daily habit</button>}
        </div>
      </div>
      {(p.mine || p.gods) && <Prayer a={a} p={p} />}
      {next && <a className="btn ghost big" href={base + '/' + next.id}>Next: {next.emoji} {next.name} ›</a>}
      <Coach tool="laydown" code={code} context={ctx} storeKey={K.chat('laydown', a.id + (church ? '.church' : ''))} optional
        intro="Stuck between the two? The coach can ask you one question at a time." saveLabel="Fill in lay down / take up from our chat"
        onSaved={(r) => { set({ notso: r.notSoLord || p.notso, laydown: r.laydown || p.laydown, takeup: r.takeup || p.takeup }); toast('Filled in — check it and save'); }} />
    </>
  );
}

function Summary({ base }) {
  const [plans] = useLocal('lordship.plans', {});
  const areas = planAreas().filter(a => plans[a.id] && (plans[a.id].mine || plans[a.id].gods));
  const text = areas.map(a => { const p = plans[a.id]; return `${a.name}\n  My plan: ${p.mine || '—'}\n  God’s plan: ${p.gods || '—'}${p.takeup ? `\n  I’ll take up: ${p.takeup}` : ''}`; }).join('\n\n');
  return (
    <>
      <a className="back" href={base}>‹ All areas</a>
      <h1>My plan vs God’s plan</h1>
      <p className="muted">Side by side, every area you’ve written.</p>
      {!areas.length && <p className="muted">Nothing yet — pick an area to start.</p>}
      {areas.map(a => { const p = plans[a.id]; return (
        <a key={a.id} className="card sumcard" href={base + '/' + a.id}>
          <div className="row" style={{ justifyContent: 'space-between' }}><h3 style={{ margin: 0 }}>{a.emoji} {a.name}</h3>{p.align && <Venn align={p.align} size={70} labels={false} />}</div>
          <div className="twoplans mini"><div className="plan-col mine"><b>Mine</b><p>{p.mine || '—'}</p></div><div className="plan-col gods"><b>God’s</b><p>{p.gods || '—'}</p></div></div>
          {p.takeup && <p className="small"><b>Taking up:</b> {p.takeup}</p>}
        </a>); })}
      {areas.length > 0 && <button className="btn ghost" onClick={() => shareText('My plan vs God’s plan\n\n' + text)}>Share or copy</button>}
    </>
  );
}

export default function PlanVsGod({ code, church, sub }) {
  const [plans] = useLocal('lordship.plans', {});
  const base = (church ? '#/church/' : '#/t/') + 'laydown';
  const areas = planAreas();
  if (sub === 'all') return <Summary base={base} />;
  const i = areas.findIndex(x => x.id === sub);
  if (i >= 0) return <Area key={sub} a={areas[i]} code={code} church={church} base={base} next={areas[i + 1]} />;
  const started = areas.filter(a => plans[a.id] && (plans[a.id].mine || plans[a.id].gods)).length;
  return (
    <>
      <p className="eyebrow">Proverbs 16:9 · Luke 9:23</p>
      <h1>My plan vs God’s plan</h1>
      <div className="planhero">
        <Venn align={3} size={160} labels={false} />
        <p className="lead">“{PLAN_VERSE.text}”</p>
      </div>
      <p className="muted">We all have plans — for money, romance, where we live, our future. Lordship is laying ours next to his. For each area: write your plan, write what you sense is God’s plan, see how close they are, and decide what to lay down and take up.</p>
      <div className="tiles">
        {areas.map(x => { const p = plans[x.id] || {}; const has = p.mine || p.gods; return (
          <a key={x.id} className={'tile areatile' + (has ? ' has' : '') + (p.align ? ' v' : '')} href={base + '/' + x.id}>
            <span className="em">{x.emoji}</span>
            <span><b>{x.name}</b><small>{p.align ? ALIGN[p.align] : has ? 'Started' : 'Not started'}</small></span>
            {p.align ? <span className="minivenn"><Venn align={p.align} size={38} labels={false} /></span> : null}
          </a>); })}
      </div>
      <div className="row wrap">
        {started > 0 && <a className="btn primary" href={base + '/all'}>See them side by side ({started})</a>}
        <a className="btn ghost" href={(church ? '#/church/' : '#/t/') + 'list'}>My lay down / take up list</a>
      </div>
      <div className="scripture"><b>{PLAN_VERSE2.ref}</b><p>{PLAN_VERSE2.text}</p></div>
      <p className="tiny muted">{TEACHING.translation}</p>
    </>
  );
}

/* From the wheel: open a low spoke as its own area here. */
export function openFromWheel(spoke, church) {
  const extra = read('lordship.planAreas', []);
  const id = 'w-' + spoke.id;
  if (!extra.some(x => x.id === id) && !LIFE_AREAS.some(x => x.id === id)) write('lordship.planAreas', extra.concat([{ id, name: spoke.name, emoji: '🎯', hint: spoke.q }]));
  location.hash = (church ? '#/church/' : '#/t/') + 'laydown/' + id;
}

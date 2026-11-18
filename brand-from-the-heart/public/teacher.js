/*  Brand From the Heart — the teacher's page.
    teacher.html                      → make a class (needs the teacher password, BFH_TEACHER_PASSWORD)
    teacher.html#c=<code>&t=<key>     → the dashboard (bookmark it; the key never goes to the server log in a URL path)
    Shows every student's stage, who looks stuck, a gallery of finished briefs,
    comments to moderate, and lets the teacher upload logo screenshots for the gallery.
    Also: the join link as a QR code (and full screen for the projector), "Big screen" for live
    voting and celebration (shared directions by votes, our archetypes, finished brands), and
    exports (a CSV of every student, every finished brief as one A4 page to print or save as PDF). */
(function () {
  'use strict';
  const B = window.BFH_BRAND, esc = B.esc, $ = (s) => document.querySelector(s);
  const h = new URLSearchParams(location.hash.slice(1));
  let code = h.get('c'), tkey = h.get('t'), data = null, timer = null;
  try { if (!code) { const s = JSON.parse(localStorage.getItem('bfh-teacher') || 'null'); if (s) { code = s.code; tkey = s.tkey; } } } catch (e) {}

  async function api(fn, args) {
    const r = await fetch('/.netlify/functions/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fn, args }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.error) { const e = new Error(j.error || 'NET'); e.code = j.error || 'NET'; throw e; }
    return j;
  }
  function toast(m) { const el = $('#toast'); el.textContent = m; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2400); }
  const ago = (ms) => { const m = Math.round(ms / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };
  const base = () => location.origin + location.pathname.replace(/teacher\.html$/, '');
  const STATUS = { start: ['none', 'Not started'], interview: ['interview', 'In interview'], heart: ['interview', 'In interview'], directions: ['choosing', 'Choosing direction'], refine: ['choosing', 'Choosing direction'], finished: ['finished', 'Finished'] };
  function status(s) { return (s.stage === 'start' && s.prog < 3) || !STATUS[s.stage] ? STATUS.start : STATUS[s.stage]; }
  function stuck(s, now) {
    if (s.lastErr && now - s.lastErr.at < 30 * 60000) return 'Claude error (' + s.lastErr.code + ')';
    if (s.stage === 'finished') return '';
    const idle = now - s.updated;
    if (idle > 20 * 60000 && idle < 8 * 3600000) return 'No progress for ' + Math.round(idle / 60000) + ' min';
    return '';
  }

  const HEXRE = /^#[0-9A-Fa-f]{6}$/;
  const col = (x, fb) => HEXRE.test(x) ? x : fb;
  const cols = (c) => { c = c || {}; return { primary: col(c.primary, '#1f44ff'), secondary: col(c.secondary, '#ffb323'), accent: col(c.accent, '#ffb323'), background: col(c.background, '#faf6f0'), text: col(c.text, '#17150f') }; };
  const en = (o) => !o ? '' : typeof o === 'string' ? o : (o.en || '');
  const km = (o) => o && typeof o === 'object' ? (o.km || '') : '';
  const votesOf = (s) => Object.values(s.votes || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  const archOf = (s) => { const id = s.arch && typeof s.arch === 'object' ? s.arch.id : s.arch; return (window.BFH_ARCHETYPES || []).find(x => x.id === id) || null; };
  const joinLink = () => base() + '?class=' + (data ? data.code : code);
  function qrSvg(text) {
    try { const q = window.qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 8, margin: 2, scalable: true, title: 'Scan to join the class' }); }
    catch (e) { return ''; }
  }

  /* ---- make a class ---- */
  function createView() {
    $('#t').innerHTML = `<h1>Make a class</h1>
      <p class="lead">Students join with a class code. You get a private dashboard link — bookmark it.</p>
      <section class="card">
        <label class="lab">Class name</label><input id="cname" placeholder="e.g. Social Media School — Nov 2026" maxlength="60">
        <label class="lab">Teacher password (set in Netlify as BFH_TEACHER_PASSWORD)</label><input id="cpw" type="password" autocomplete="current-password">
        <div class="stack"><button class="btn primary big" id="mk">Make my class</button></div>
        <p id="msg" class="err"></p>
      </section>
      ${code ? `<p><a href="#c=${esc(code)}&t=${esc(tkey)}" id="back">← Back to class ${esc(code)}</a></p>` : ''}`;
    $('#mk').onclick = async () => {
      try {
        const r = await api('classCreate', { name: $('#cname').value, password: $('#cpw').value });
        code = r.code; tkey = r.tkey;
        try { localStorage.setItem('bfh-teacher', JSON.stringify({ code, tkey })); } catch (e) {}
        location.hash = 'c=' + code + '&t=' + tkey;
        start();
      } catch (e) {
        $('#msg').textContent = { BAD_PASSWORD: 'That password is not right.', NO_TEACHER_PASSWORD: 'Set BFH_TEACHER_PASSWORD in Netlify first (see README).' }[e.code] || 'Could not make the class: ' + e.code;
      }
    };
  }

  /* ---- the dashboard ---- */
  async function refresh() {
    try { data = await api('teacher', { code, tkey }); draw(); drawProj(); }
    catch (e) { if (e.code === 'NO_TEACHER') { $('#t').innerHTML = `<p class="err">This teacher link doesn't work.</p><p><button class="btn soft" id="new">Make a new class</button></p>`; $('#new').onclick = () => { code = null; createView(); }; } }
  }
  function draw() {
    const d = data, now = d.now, st = d.students;
    $('#cls').textContent = d.name + ' · ' + d.code;
    const counts = { none: 0, interview: 0, choosing: 0, finished: 0 };
    st.forEach(s => counts[status(s)[0]]++);
    const stuckList = st.filter(s => stuck(s, now));
    const finished = st.filter(s => s.brief);
    const join = joinLink();
    $('#t').innerHTML = `<h1>${esc(d.name)}</h1>
      <section class="card joincard">
        <div class="jq" aria-hidden="true">${qrSvg(join)}</div>
        <div class="jt"><p class="eyebrow">Students join here</p>
          <div class="bigcode">${esc(d.code)}</div>
          <p class="muted small">Scan the QR code, or open the link. New students make their brand; returning ones tap their name.</p>
          <div class="row"><input readonly value="${esc(join)}" aria-label="Join link"><button class="btn soft small" data-copy="${esc(join)}">Copy link</button></div>
          <div class="row wrap"><button class="btn primary" data-proj="join">Show on projector</button><button class="btn ghost" data-proj="big">Big screen</button></div></div>
      </section>
      <section class="card"><h3>Your dashboard link</h3>
        <p class="muted small">This link is private — bookmark this page. Don't share it with students.</p>
        <div class="row"><input readonly value="${esc(location.href)}" aria-label="Dashboard link"><button class="btn ghost small" data-copy="${esc(location.href)}">Copy dashboard link</button></div></section>
      <div class="stats">
        <div class="stat"><b>${st.length}</b>students</div>
        <div class="stat"><b>${counts.none}</b>not started</div>
        <div class="stat"><b>${counts.interview}</b>in interview</div>
        <div class="stat"><b>${counts.choosing}</b>choosing direction</div>
        <div class="stat"><b>${counts.finished}</b>finished</div>
        <div class="stat stuck"><b>${stuckList.length}</b>look stuck</div>
      </div>
      <section class="card"><h3>Progress <small class="muted">(refreshes every 30 s)</small></h3><div class="tablewrap"><table>
        <thead><tr><th>Name</th><th>Status</th><th>Progress</th><th>Last active</th><th>Votes</th><th></th></tr></thead>
        <tbody>${st.map(s => { const [k, lab] = status(s), why = stuck(s, now), v = votesOf(s);
          return `<tr><td><b>${esc(s.name || '(no name yet)')}</b>${why ? `<br><span class="flag">⚠ ${esc(why)}</span>` : ''}</td>
            <td><span class="st st-${k}">${lab}</span></td>
            <td><div class="pbar"><i style="width:${s.prog || 0}%"></i></div><small>${s.prog || 0}%</small></td>
            <td>${ago(now - s.updated)}</td><td>${v ? '👍 ' + v : ''}</td>
            <td><button class="linkish" data-remove="${esc(s.id)}" data-name="${esc(s.name || '')}">remove</button></td></tr>`; }).join('') || '<tr><td colspan="6" class="muted">No students yet. Share the class code.</td></tr>'}</tbody></table></div></section>
      <section class="card"><div class="hrow"><h3>Finished brand briefs (${finished.length})</h3>
          <div class="row wrap"><button class="btn soft small" id="csv">Download CSV (all students)</button><button class="btn soft small" id="pdf"${finished.length ? '' : ' disabled'}>All briefs PDF</button></div></div>
        <div class="briefs">${finished.map(s => { const b = s.brief, c = cols(b.colors), f = B.fontById(b.fontId); B.loadFont(f);
          return `<button class="bcard" data-brief="${esc(s.id)}"><div class="top2" style="background:${c.primary};color:${B.readableOn(c.primary)}">
            <div style="font-family:${B.ff(f.heading.family, 'serif')};font-weight:${f.heading.weight};font-size:1.5rem">${esc(b.title)}</div>
            <div style="font-family:${B.ff(f.heading.family, 'serif')}">${esc((b.tagline || {}).en || '')}</div>
            <div style="font-family:${B.ff(f.khHeading.family)}">${esc((b.tagline || {}).km || '')}</div></div>
            <div class="bot">${B.ROLES.map(r => `<i style="display:inline-block;width:20px;height:20px;border-radius:6px;background:${c[r]};border:1px solid #0002"></i>`).join(' ')}<p>${esc((b.mission || {}).en || '')}</p></div></button>`; }).join('') || '<p class="muted">None yet.</p>'}</div></section>
      <section class="card"><h3>Encouragement comments</h3><p class="muted small">Students see comments meant for them. Hide anything unkind.</p>
        ${d.comments.map(c => `<div class="cm${c.hidden ? ' hidden' : ''}"><div><b>${esc(c.name)}</b> → <b>${esc(c.targetName || '')}</b>: ${esc(c.text)}</div>
          <button class="btn ghost small" data-hide="${esc(c.target)}|${esc(c.id)}|${c.hidden ? 0 : 1}">${c.hidden ? 'Show' : 'Hide'}</button></div>`).join('') || '<p class="muted">No comments yet.</p>'}</section>
      <section class="card"><h3>Inspiration logos</h3>
        <p class="muted small">The gallery loads each brand's real logo from the web. If one doesn't show (or you prefer your own screenshot), upload one here — it's shown unaltered and credited to its owner, for teaching only.</p>
        <div class="logos">${(window.BFH_BRANDS || []).map(b => `<div class="item"><div class="logo ${b.logoBg === 'dark' ? 'dark' : ''}"><img src="${esc(b.logo || b.favicon)}" alt="" referrerpolicy="no-referrer" data-name="${esc(b.name)}"></div>
          <b>${esc(b.name)}</b><div class="row"><label class="btn soft small">Upload<input type="file" accept="image/*" hidden data-logo="${esc(b.id)}"></label><button class="btn ghost small" data-unlogo="${esc(b.id)}">Clear upload</button></div></div>`).join('')}</div></section>
      <p><a href="#" id="newcls">Make another class</a></p>`;
  }
  function briefDialog(s) {
    const b = s.brief, dlg = $('#dlg'), c = cols(b.colors);
    dlg.innerHTML = `<div class="dlg"><button class="btn ghost small" id="x" style="float:right">Close</button><h2>${esc(b.title)}</h2>
      <p><b>Mission:</b> ${esc((b.mission || {}).en || '')}</p><p><b>Personality:</b> ${esc((b.personality || {}).en || '')}</p>
      <p><b>Audience:</b> ${esc(b.audience || '')}</p>
      <p>${B.ROLES.map(r => `<code style="background:${c[r]};color:${B.readableOn(c[r])};padding:2px 6px;border-radius:6px">${r} ${c[r]}</code>`).join(' ')}</p>
      <h3>Universal prompt</h3><pre class="copybox small">${esc(b.prompt || '')}</pre><button class="btn soft small" data-copy="${esc(b.prompt || '')}">Copy</button></div>`;
    dlg.showModal();
    $('#x').onclick = () => dlg.close();
  }
  /* ---- the projector: the join screen, and "Big screen" (directions by votes, archetypes, brands) ---- */
  const PANELS = [['dirs', 'Shared directions'], ['arch', 'Our archetypes'], ['brands', 'Finished brands']];
  const P = { mode: null, panel: 0, timer: null, html: '', fs: false };
  function openProj(mode) {
    P.mode = mode; P.html = '';
    document.body.classList.add('projOn');
    $('#proj').hidden = false;
    drawProj();
    clearInterval(P.timer);
    if (mode === 'big') P.timer = setInterval(() => { if (!document.hidden) refresh(); }, 10000);
    const el = document.documentElement;
    if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().then(() => { P.fs = true; }).catch(() => {});
    $('#proj').focus();
  }
  function closeProj() {
    if (!P.mode) return;
    P.mode = null; clearInterval(P.timer);
    document.body.classList.remove('projOn');
    $('#proj').hidden = true; $('#proj').innerHTML = ''; P.html = '';
    if (P.fs && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    P.fs = false;
  }
  function movePanel(n) { P.panel = (P.panel + n + PANELS.length) % PANELS.length; drawProj(); $('#proj').scrollTop = 0; }
  function drawProj() {
    if (!P.mode || !data) return;
    const close = `<button class="pj-x" data-pj="close" aria-label="Close">✕</button>`;
    let html;
    if (P.mode === 'join') {
      const join = joinLink();
      html = `${close}<div class="pj-join"><div class="pj-qr">${qrSvg(join)}</div>
        <div class="pj-jt"><div class="pj-cname">${esc(data.name)}</div>
          <div class="pj-label">Class code</div><div class="pj-code">${esc(data.code)}</div>
          <div class="pj-scan">Scan to join · <span class="pj-km">ស្កេនដើម្បីចូលរួម</span></div>
          <div class="pj-link">${esc(join)}</div></div></div>`;
    } else {
      const [id, label] = PANELS[P.panel];
      const body = id === 'dirs' ? panelDirs() : id === 'arch' ? panelArch() : panelBrands();
      html = `<div class="pj-bar">${close}<div class="pj-tabs" role="tablist">${PANELS.map(([pid, lab], i) =>
          `<button role="tab" aria-selected="${i === P.panel}" class="${i === P.panel ? 'on' : ''}" data-pj="${i}">${esc(lab)}</button>`).join('')}</div>
        <div class="pj-hint">← → to switch · Esc to close</div></div>
        <section class="pj-panel"><h2 class="pj-h">${esc(label)}</h2>${body}</section>`;
    }
    if (html !== P.html) { P.html = html; $('#proj').innerHTML = html; }
  }
  function panelDirs() {
    const items = [];
    data.students.forEach(s => ((s.share && s.share.dirs) || []).forEach((d, i) => items.push({ s, d, v: Number((s.votes || {})[i]) || 0 })));
    if (!items.length) return `<p class="pj-empty">No shared directions yet. Students can share up to two from their app, then vote for each other's.</p>`;
    items.sort((a, b) => b.v - a.v || String(a.s.name).localeCompare(String(b.s.name)));
    const top = items[0].v;
    return `<div class="pj-dirs">${items.map(({ s, d, v }) => {
      const font = B.fontById(d.fontId); B.loadFont(font);
      const brand = { title: s.name || '', colors: cols(d.colors), font, tagline: { en: en(d.tagline), km: km(d.tagline) }, tune: d.tune || {}, pillars: [], captions: [] };
      return `<figure class="pj-dir${v && v === top ? ' lead' : ''}"><div class="pj-mock">${B.mock('post', brand, 'en')}</div>
        <figcaption><div><b>${esc(s.name || '(no name yet)')}</b><span>${esc(en(d.name))}</span></div>
          <div class="pj-votes" aria-label="${v} votes">${v}<small>${v === 1 ? 'vote' : 'votes'}</small></div></figcaption></figure>`;
    }).join('')}</div>`;
  }
  function panelArch() {
    const A = window.BFH_ARCHETYPES || [], n = {}, st = data.students;
    let none = 0;
    st.forEach(s => { const a = archOf(s); if (a) n[a.id] = (n[a.id] || 0) + 1; else none++; });
    const rows = A.map(a => ({ a, c: n[a.id] || 0 })).sort((x, y) => y.c - x.c);
    const max = Math.max(1, none, ...rows.map(r => r.c));
    const bar = (lab, c, cls) => `<div class="pj-arow${cls ? ' ' + cls : ''}"><div class="pj-alab">${lab}</div>
      <div class="pj-track"><i style="width:${(c / max * 100).toFixed(1)}%"></i></div><b class="pj-n">${c}</b></div>`;
    return `<p class="pj-sub">${st.length - none} of ${st.length} ${st.length === 1 ? 'student leads' : 'students lead'} with…</p>
      <div class="pj-arch">${rows.map(r => bar(`<span class="pj-emo">${esc(r.a.emoji)}</span>${esc(r.a.en)}`, r.c)).join('')}
      ${bar('Not taken yet', none, 'none')}</div>`;
  }
  function panelBrands() {
    const fin = data.students.filter(s => s.brief);
    if (!fin.length) return `<p class="pj-empty">No finished brands yet — they'll appear here as students finish.</p>`;
    return `<div class="pj-brands">${fin.map(s => {
      const b = s.brief, c = cols(b.colors), f = B.fontById(b.fontId), on = B.readableOn(c.primary); B.loadFont(f);
      return `<article class="pj-brand" style="background:${c.background};color:${c.text}">
        <div class="pj-btop" style="background:${c.primary};color:${on}">
          <div class="pj-btitle" style="font-family:${B.ff(f.heading.family, 'serif')};font-weight:${f.heading.weight || 700}">${esc(b.title || s.name)}</div>
          <div class="pj-btl" style="font-family:${B.ff(f.heading.family, 'serif')}">${esc(en(b.tagline))}</div>
          <div class="pj-btk" style="font-family:${B.ff(f.khHeading.family)}">${esc(km(b.tagline))}</div></div>
        <div class="pj-bbot" style="font-family:${B.ff(f.body.family)}">
          <div class="pj-sw">${B.ROLES.map(r => `<i style="background:${c[r]}"></i>`).join('')}</div>
          <p>${esc(en(b.mission))}</p><div class="pj-by">${esc(s.name || '')}</div></div></article>`;
    }).join('')}</div>`;
  }

  /* ---- exports ---- */
  function downloadCsv() {
    const cell = (v) => { let x = String(v == null ? '' : v).replace(/\r?\n/g, ' '); if (/^[=+\-@\t]/.test(x)) x = "'" + x; return '"' + x.replace(/"/g, '""') + '"'; };
    const head = ['Name', 'Status', 'Progress %', 'Last active', 'Archetype', 'Votes', 'Brief title', 'Tagline EN', 'Tagline KM', 'Mission EN',
      'Primary', 'Secondary', 'Accent', 'Background', 'Text', 'Font pairing'];
    const rows = data.students.map(s => {
      const b = s.brief || {}, c = b.colors || {}, a = archOf(s), t = Number(s.updated);
      return [s.name || '', status(s)[1], Number(s.prog) || 0, Number.isFinite(t) && t > 0 ? new Date(t).toISOString() : '', a ? a.en : '', votesOf(s),
        b.title || '', en(b.tagline), km(b.tagline), en(b.mission), ...B.ROLES.map(r => c[r] || ''), b.fontId || ''].map(cell).join(',');
    });
    const text = '﻿' + [head.map(cell).join(','), ...rows].join('\r\n') + '\r\n';
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'brand-from-the-heart-' + data.code + '-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  function briefPage(s) {
    const b = s.brief, c = cols(b.colors), f = B.fontById(b.fontId), on = B.readableOn(c.primary);
    const st = (x) => `font-family:${B.ff(x.family)};font-weight:${x.weight || 400};`;
    const H = st(f.heading), Bd = st(f.body), KH = st(f.khHeading), KB = st(f.khBody);
    const list = (xs) => (Array.isArray(xs) ? xs : []).map(x => `<li>${esc(en(x))}${km(x) ? `<br><span style="${KB}">${esc(km(x))}</span>` : ''}</li>`).join('');
    const pillars = (Array.isArray(b.pillars) ? b.pillars : []).map(p => p && typeof p === 'object' && p.title ? p.title : p);
    return `<section class="tp-page" style="background:${c.background};color:${c.text};${Bd}">
      <div class="tp-band" style="background:${c.primary};color:${on}">
        <div class="tp-who">${esc(s.name || '')} · Brand From the Heart</div>
        <div class="tp-title" style="${H}">${esc(b.title || s.name || '')}</div>
        <div class="tp-tl" style="${H}">${esc(en(b.tagline))}</div>
        ${km(b.tagline) ? `<div class="tp-tlk" style="${KH}">${esc(km(b.tagline))}</div>` : ''}
      </div>
      <div class="tp-body">
        <div class="tp-two"><div>
          <h3 style="${H}color:${c.primary}">Mission</h3><p>${esc(en(b.mission))}</p>${km(b.mission) ? `<p style="${KB}">${esc(km(b.mission))}</p>` : ''}
          <h3 style="${H}color:${c.primary}">Personality</h3><p>${esc(en(b.personality))}</p>
          <h3 style="${H}color:${c.primary}">Audience</h3><p>${esc(en(b.audience))}</p></div>
          <div><h3 style="${H}color:${c.primary}">Content pillars</h3><ul>${list(pillars)}</ul></div></div>
        <h3 style="${H}color:${c.primary}">Colours</h3>
        <div class="tp-sws">${B.ROLES.map(r => `<div><i style="background:${c[r]}"></i><b>${r}</b><code>${c[r]}</code></div>`).join('')}</div>
        <p class="tp-fonts">Fonts: ${esc(f.heading.family)} · ${esc(f.body.family)} · Khmer: ${esc(f.khHeading.family)} · ${esc(f.khBody.family)}</p>
        <div class="tp-two"><div><h3 style="${H}color:${c.primary}">✓ Voice: do</h3><ul>${list(b.voiceDo)}</ul></div>
          <div><h3 style="${H}color:${c.primary}">✗ Voice: don't</h3><ul>${list(b.voiceDont)}</ul></div></div>
        ${b.prompt ? `<div class="tp-prompt"><b>Universal prompt</b><pre>${esc(b.prompt)}</pre></div>` : ''}
      </div></section>`;
  }
  async function printBriefs() {
    const fin = data.students.filter(s => s.brief);
    if (!fin.length) { toast('No finished briefs yet'); return; }
    toast('Getting the fonts ready…');
    $('#print').innerHTML = fin.map(briefPage).join('');
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    await Promise.race([Promise.all(fin.map(s => B.fontsReady(B.fontById(s.brief.fontId)))).then(() => document.fonts && document.fonts.ready), wait(8000)]);
    window.print();
  }

  async function resizeLogo(file) {
    const img = new Image(); img.src = URL.createObjectURL(file);
    await img.decode();
    const k = Math.min(1, 480 / Math.max(img.width, img.height)), cv = document.createElement('canvas');
    cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    return cv.toDataURL('image/png');
  }

  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-copy],[data-hide],[data-remove],[data-brief],[data-unlogo],[data-proj],[data-pj],#newcls,#csv,#pdf');
    if (!el) return;
    if (el.dataset.proj) { openProj(el.dataset.proj); return; }
    if (el.dataset.pj) { if (el.dataset.pj === 'close') closeProj(); else { P.panel = Number(el.dataset.pj) || 0; drawProj(); } return; }
    if (el.id === 'csv') { downloadCsv(); return; }
    if (el.id === 'pdf') { printBriefs(); return; }
    if (el.id === 'newcls') { e.preventDefault(); clearInterval(timer); closeProj(); createView(); return; }
    if (el.dataset.copy !== undefined) { try { await navigator.clipboard.writeText(el.dataset.copy); toast('Copied'); } catch (x) { toast('Copy failed'); } return; }
    if (el.dataset.hide) { const [target, cid, hidden] = el.dataset.hide.split('|'); await api('teacherHide', { code, tkey, target, cid, hidden: hidden === '1' }); refresh(); return; }
    if (el.dataset.remove) { if (!confirm('Remove ' + (el.dataset.name || 'this student') + ' from the class? Their brand stays on their own link.')) return; await api('teacherRemove', { code, tkey, sid: el.dataset.remove }); refresh(); return; }
    if (el.dataset.brief) { const s = data.students.find(x => x.id === el.dataset.brief); if (s) briefDialog(s); return; }
    if (el.dataset.unlogo) { await api('teacherLogo', { code, tkey, brand: el.dataset.unlogo, data: null }); toast('Cleared'); }
  });
  document.addEventListener('keydown', (e) => {
    if (!P.mode) return;
    if (e.key === 'Escape') { e.preventDefault(); closeProj(); return; }
    if (P.mode !== 'big') return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); movePanel(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); movePanel(-1); }
    else if (/^[1-9]$/.test(e.key) && Number(e.key) <= PANELS.length) { P.panel = Number(e.key) - 1; drawProj(); }
  });
  document.addEventListener('fullscreenchange', () => {   // Esc in full screen leaves full screen first: close with it
    if (!document.fullscreenElement && P.fs) { P.fs = false; closeProj(); }
  });
  document.addEventListener('error', (e) => {   // a logo that won't load: show the name
    const img = e.target;
    if (!img || img.tagName !== 'IMG' || !img.closest('.logo')) return;
    const box = img.parentNode; box.classList.add('text'); box.textContent = img.dataset.name || '';
  }, true);
  document.addEventListener('change', async (e) => {
    const el = e.target;
    if (!el.dataset.logo || !el.files[0]) return;
    try { const d = await resizeLogo(el.files[0]); await api('teacherLogo', { code, tkey, brand: el.dataset.logo, data: d }); toast('Logo saved ✓'); }
    catch (x) { toast('Could not save that image'); }
  });

  function start() {
    if (!code || !tkey) { createView(); return; }
    try { localStorage.setItem('bfh-teacher', JSON.stringify({ code, tkey })); } catch (e) {}
    if (!location.hash) history.replaceState(null, '', '#c=' + code + '&t=' + tkey);
    refresh();
    clearInterval(timer); timer = setInterval(() => { if (!document.hidden) refresh(); }, 30000);
  }
  start();
})();

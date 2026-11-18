/*  Brand From the Heart — the teacher's page.
    teacher.html                      → make a class (needs the teacher password, BFH_TEACHER_PASSWORD)
    teacher.html#c=<code>&t=<key>     → the dashboard (bookmark it; the key never goes to the server log in a URL path)
    Shows every student's stage, who looks stuck, a gallery of finished briefs,
    comments to moderate, and lets the teacher upload logo screenshots for the gallery. */
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
    try { data = await api('teacher', { code, tkey }); draw(); }
    catch (e) { if (e.code === 'NO_TEACHER') { $('#t').innerHTML = `<p class="err">This teacher link doesn't work.</p><p><button class="btn soft" id="new">Make a new class</button></p>`; $('#new').onclick = () => { code = null; createView(); }; } }
  }
  function draw() {
    const d = data, now = d.now, st = d.students;
    $('#cls').textContent = d.name + ' · ' + d.code;
    const counts = { none: 0, interview: 0, choosing: 0, finished: 0 };
    st.forEach(s => counts[status(s)[0]]++);
    const stuckList = st.filter(s => stuck(s, now));
    const finished = st.filter(s => s.brief);
    const join = base() + '?class=' + d.code;
    $('#t').innerHTML = `<h1>${esc(d.name)}</h1>
      <section class="card"><h3>Students join here</h3>
        <p>Class code <b style="font-size:1.6rem;letter-spacing:.1em">${esc(d.code)}</b></p>
        <div class="row"><input readonly value="${esc(join)}"><button class="btn soft small" data-copy="${esc(join)}">Copy link</button></div>
        <p class="muted small">Your dashboard link is private — bookmark this page. Don't share it with students.</p>
        <div class="row"><input readonly value="${esc(location.href)}"><button class="btn ghost small" data-copy="${esc(location.href)}">Copy dashboard link</button></div></section>
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
        <tbody>${st.map(s => { const [k, lab] = status(s), why = stuck(s, now), v = Object.values(s.votes || {}).reduce((a, b) => a + b, 0);
          return `<tr><td><b>${esc(s.name || '(no name yet)')}</b>${why ? `<br><span class="flag">⚠ ${esc(why)}</span>` : ''}</td>
            <td><span class="st st-${k}">${lab}</span></td>
            <td><div class="pbar"><i style="width:${s.prog || 0}%"></i></div><small>${s.prog || 0}%</small></td>
            <td>${ago(now - s.updated)}</td><td>${v ? '👍 ' + v : ''}</td>
            <td><button class="linkish" data-remove="${esc(s.id)}" data-name="${esc(s.name || '')}">remove</button></td></tr>`; }).join('') || '<tr><td colspan="6" class="muted">No students yet. Share the class code.</td></tr>'}</tbody></table></div></section>
      <section class="card"><h3>Finished brand briefs (${finished.length})</h3>
        <div class="briefs">${finished.map(s => { const b = s.brief, c = b.colors || {}, f = B.fontById(b.fontId); B.loadFont(f);
          return `<button class="bcard" data-brief="${esc(s.id)}"><div class="top2" style="background:${c.primary};color:${B.readableOn(c.primary || '#888888')}">
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
    const b = s.brief, dlg = $('#dlg');
    dlg.innerHTML = `<div class="dlg"><button class="btn ghost small" id="x" style="float:right">Close</button><h2>${esc(b.title)}</h2>
      <p><b>Mission:</b> ${esc((b.mission || {}).en || '')}</p><p><b>Personality:</b> ${esc((b.personality || {}).en || '')}</p>
      <p><b>Audience:</b> ${esc(b.audience || '')}</p>
      <p>${B.ROLES.map(r => `<code style="background:${(b.colors || {})[r]};color:${B.readableOn((b.colors || {})[r] || '#888888')};padding:2px 6px;border-radius:6px">${r} ${(b.colors || {})[r]}</code>`).join(' ')}</p>
      <h3>Universal prompt</h3><pre class="copybox small">${esc(b.prompt || '')}</pre><button class="btn soft small" data-copy="${esc(b.prompt || '')}">Copy</button></div>`;
    dlg.showModal();
    $('#x').onclick = () => dlg.close();
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
    const el = e.target.closest('[data-copy],[data-hide],[data-remove],[data-brief],[data-unlogo],#newcls');
    if (!el) return;
    if (el.id === 'newcls') { e.preventDefault(); clearInterval(timer); createView(); return; }
    if (el.dataset.copy !== undefined) { try { await navigator.clipboard.writeText(el.dataset.copy); toast('Copied'); } catch (x) { toast('Copy failed'); } return; }
    if (el.dataset.hide) { const [target, cid, hidden] = el.dataset.hide.split('|'); await api('teacherHide', { code, tkey, target, cid, hidden: hidden === '1' }); refresh(); return; }
    if (el.dataset.remove) { if (!confirm('Remove ' + (el.dataset.name || 'this student') + ' from the class? Their brand stays on their own link.')) return; await api('teacherRemove', { code, tkey, sid: el.dataset.remove }); refresh(); return; }
    if (el.dataset.brief) { const s = data.students.find(x => x.id === el.dataset.brief); if (s) briefDialog(s); return; }
    if (el.dataset.unlogo) { await api('teacherLogo', { code, tkey, brand: el.dataset.unlogo, data: null }); toast('Cleared'); }
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

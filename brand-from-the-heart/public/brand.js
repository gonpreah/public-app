/*  Brand From the Heart — the brand engine, shared by every screen:
    · colour maths and the four tuning sliders (warm↔cool, bold↔soft, modern↔classic, playful↔serious)
    · loading Google Fonts for a pairing
    · the mock-ups (Instagram post, story, poster, YouTube thumbnail, profile header)
    · the words we export: brief, universal AI prompt (EN/KM), Claude Project block
    · the brand kit image (canvas) and the print pages for "Save as PDF"
    Everything here is a pure function of a "brand" object:
      { title, colors{primary,secondary,accent,background,text}, font (a BFH_FONTS pairing),
        tagline{en,km}, taglines[], personality{en,km}, mission{en,km}, bio, whyIPost, pillars[],
        captions[], hashtags[], voiceDo[], voiceDont[], wordmark, tune{warm,bold,modern,playful}, audience, pkg } */
(function () {
  'use strict';
  const B = {};

  /* ---------------- colour ---------------- */
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  B.hexToRgb = (h) => { h = String(h || '#000000').replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) || 0); };
  B.rgbToHex = (r, g, b) => '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase();
  B.toHsl = (hex) => {
    let [r, g, b] = B.hexToRgb(hex).map(v => v / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    let h = 0, s = 0;
    if (mx !== mn) {
      const d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return { h, s, l };
  };
  B.fromHsl = (h, s, l) => {
    h = ((h % 360) + 360) % 360; s = clamp(s, 0, 1); l = clamp(l, 0, 1);
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return B.rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
  };
  B.mix = (a, b, t) => { const x = B.hexToRgb(a), y = B.hexToRgb(b); return B.rgbToHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); };
  const lum = (hex) => { const c = B.hexToRgb(hex).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  B.contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  B.tints = (hex) => [0.2, 0.4, 0.6, 0.8].map(t => B.mix(hex, '#FFFFFF', t));
  B.shades = (hex) => [0.2, 0.4, 0.6, 0.8].map(t => B.mix(hex, '#000000', t));
  B.readableOn = (bg) => B.contrast('#FFFFFF', bg) >= B.contrast('#1A1A1A', bg) ? '#FFFFFF' : '#1A1A1A';
  const hueToward = (h, target, t) => { let d = ((target - h + 540) % 360) - 180; return h + d * t; };
  B.ROLES = ['primary', 'secondary', 'accent', 'background', 'text'];

  /* The sliders run -100…100. warm>0 warmer, bold>0 bolder (<0 softer),
     modern>0 more modern (<0 classic), playful>0 more playful (<0 serious). */
  B.tuneColors = function (c, t) {
    t = t || {};
    const w = (t.warm || 0) / 100, bo = (t.bold || 0) / 100, pl = (t.playful || 0) / 100;
    const out = {};
    for (const role of B.ROLES) {
      let { h, s, l } = B.toHsl(c[role]);
      const isGround = role === 'background' || role === 'text';
      if (w && s > 0.06) h = hueToward(h, w > 0 ? 28 : 205, Math.abs(w) * (isGround ? 0.3 : 0.45));
      if (!isGround) {
        s = s * (1 + 0.55 * bo + (role === 'accent' ? 0.35 * pl : 0));
        if (bo > 0) l = l + (0.5 - l) * 0.35 * bo;           // bolder: richer, mid-tones
        else l = l + (0.88 - l) * 0.4 * -bo;                 // softer: lighter, pastel
        s = bo < 0 ? s * (1 + 0.45 * bo) : s;
      }
      let hex = B.fromHsl(h, s, l);
      if (role === 'background' && w) hex = B.mix(hex, w > 0 ? '#FFE8CC' : '#DCEBF5', Math.abs(w) * 0.22);
      if (role === 'background' && bo > 0 && l < 0.5) hex = B.mix(hex, '#000000', 0.25 * bo);
      out[role] = s < 0.02 && !w && !bo ? c[role] : hex;
    }
    if (!w && !bo && !pl) return Object.assign({}, c);
    // keep it readable
    if (B.contrast(out.text, out.background) < 4.5) {
      const dark = B.toHsl(out.background).l > 0.5;
      for (let i = 0; i < 20 && B.contrast(out.text, out.background) < 4.5; i++) out.text = B.mix(out.text, dark ? '#000000' : '#FFFFFF', 0.2);
    }
    return out;
  };
  /* What the type sliders do: modern → upper-case, tracked headings; classic → sentence case, tighter.
     bold → heavier; soft → lighter. playful → round corners and tilted stickers; serious → square and still. */
  B.tuneType = function (t) {
    t = t || {};
    const m = (t.modern || 0) / 100, bo = (t.bold || 0) / 100, p = (t.playful || 0) / 100;
    return {
      upper: m > 0.35, track: m > 0.35 ? (0.02 + 0.08 * m).toFixed(3) + 'em' : (m < -0.35 ? '-0.01em' : '0'),
      italic: m < -0.6, weightBoost: bo, radius: Math.round(p >= 0 ? 10 + 30 * p : 10 + 10 * p),
      tilt: p > 0.2 ? (3 + 5 * p).toFixed(1) : 0, stickers: p > -0.3, scale: 1 + 0.12 * bo
    };
  };

  /* ---------------- fonts ---------------- */
  const loaded = {};
  B.fontById = (id) => (window.BFH_FONTS || []).find(f => f.id === id) || (window.BFH_FONTS || [])[0];
  B.loadFont = function (f) {
    if (!f || loaded[f.id] || !window.BFH_FONT_URL) return;
    loaded[f.id] = 1;
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = window.BFH_FONT_URL(f); l.dataset.font = f.id;
    document.head.appendChild(l);
  };
  B.loadFamily = function (family, weight) {   // one family, e.g. for this-or-that cards
    const k = 'fam:' + family + weight;
    if (loaded[k]) return; loaded[k] = 1;
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(family).replace(/%20/g, '+') + ':wght@' + (weight || 400) + '&display=swap';
    document.head.appendChild(l);
  };
  B.ff = (fam, fallback) => `'${String(fam).replace(/'/g, '')}', ${fallback || 'sans-serif'}`;
  B.fontsReady = async function (f) {
    if (!f || !document.fonts) return;
    B.loadFont(f);
    const fams = [[f.heading, 'Brand'], [f.body, 'Brand'], [f.khHeading, 'ខ្មែរ'], [f.khBody, 'ខ្មែរ']];
    try { await Promise.all(fams.map(([x, s]) => document.fonts.load(`${x.weight || 400} 40px ${B.ff(x.family)}`, s))); } catch (e) {}
  };

  /* ---------------- mock-ups ---------------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  B.esc = esc;
  function css(b) {
    const c = b.colors, f = b.font, ty = B.tuneType(b.tune);
    const hw = Math.min(900, (f.heading.weight || 700) + (ty.weightBoost > 0.3 ? 100 : ty.weightBoost < -0.3 ? -100 : 0));
    return {
      c, ty,
      h: `font-family:${B.ff(f.heading.family, B.ff(f.khHeading.family, "'Kantumruy Pro', serif"))};font-weight:${hw};${ty.upper ? 'text-transform:uppercase;' : ''}letter-spacing:${ty.track};${ty.italic ? 'font-style:italic;' : ''}line-height:1.05;`,
      b: `font-family:${B.ff(f.body.family, B.ff(f.khBody.family, "'Kantumruy Pro', sans-serif"))};font-weight:${f.body.weight || 400};`,
      kh: `font-family:${B.ff(f.khHeading.family)};font-weight:${f.khHeading.weight || 400};line-height:1.5;`,
      kb: `font-family:${B.ff(f.khBody.family)};font-weight:${f.khBody.weight || 400};line-height:1.6;`
    };
  }
  const pick = (o, lang) => o ? (o[lang] || o.en || '') : '';
  function shape(c, ty, where) {
    if (!ty.stickers) return `<div style="position:absolute;${where};width:38%;aspect-ratio:1;background:${c.secondary};opacity:.9"></div>`;
    return `<div style="position:absolute;${where};width:42%;aspect-ratio:1;border-radius:${ty.radius >= 20 ? '50%' : ty.radius + 'px'};background:${c.secondary};transform:rotate(${ty.tilt}deg)"></div>`;
  }
  /* Each mock-up is an em-based box: set font-size on the wrapper to scale it. */
  B.mock = function (kind, b, lang) {
    lang = lang || 'en';
    B.loadFont(b.font);
    const k = css(b), c = k.c, ty = k.ty, tl = b.tagline || { en: '', km: '' };
    const title = esc(b.title || 'Your name'), en = esc(tl.en), km = esc(tl.km);
    const pillar = b.pillars && b.pillars[0] ? esc(pick(b.pillars[0].title, lang)) : '';
    const cap = b.captions && b.captions[0] ? esc(pick(b.captions[0], lang)) : en;
    const r = ty.radius, onP = B.readableOn(c.primary), onS = B.readableOn(c.secondary), onA = B.readableOn(c.accent);
    const sticker = (txt) => ty.stickers ? `<span style="align-self:flex-start;display:inline-block;background:${c.accent};color:${onA};${k.b}font-size:.8em;padding:.35em .8em;border-radius:${Math.max(r, 4)}px;transform:rotate(${-ty.tilt}deg)">${txt}</span>` : `<span style="align-self:flex-start;display:inline-block;border-bottom:.15em solid ${c.accent};${k.b}font-size:.8em;padding:.2em 0;color:inherit">${txt}</span>`;
    const box = (ratio, inner, bg) => `<div class="mock mock-${kind}" style="position:relative;overflow:hidden;aspect-ratio:${ratio};background:${bg || c.background};color:${c.text};border-radius:${Math.min(r, 18) * 0.06}em">${inner}</div>`;
    if (kind === 'post') {
      return box('1 / 1', `${shape(c, ty, 'right:-12%;top:-12%')}
        <div style="position:absolute;inset:8% 8% 8% 8%;display:flex;flex-direction:column;justify-content:flex-end;gap:.5em">
          ${pillar ? sticker(pillar) : ''}
          <div style="${k.h}font-size:2.1em;color:${c.primary}">${en || title}</div>
          ${km ? `<div style="${k.kh}font-size:1.2em;color:${c.text}">${km}</div>` : ''}
          <div style="${k.b}font-size:.8em;opacity:.85;margin-top:.4em">@${esc(String(b.title || 'you').toLowerCase().replace(/[^a-z0-9]+/g, ''))}</div>
        </div>`);
    }
    if (kind === 'story') {
      return box('9 / 16', `<div style="position:absolute;inset:0;background:linear-gradient(180deg,${c.primary} 0 46%,${c.background} 46%)"></div>
        ${ty.stickers ? `<div style="position:absolute;left:50%;top:46%;transform:translate(-50%,-50%) rotate(${ty.tilt}deg);width:34%;aspect-ratio:1;border-radius:50%;background:${c.accent};border:.25em solid ${c.background}"></div>` : `<div style="position:absolute;left:8%;right:8%;top:46%;height:.3em;background:${c.accent}"></div>`}
        <div style="position:absolute;left:8%;right:8%;top:9%;color:${onP}">
          <div style="${k.b}font-size:.75em;opacity:.9;margin-bottom:.6em">${title}</div>
          <div style="${k.h}font-size:2.2em">${en || title}</div>
        </div>
        <div style="position:absolute;left:8%;right:8%;bottom:9%;display:flex;flex-direction:column;gap:.6em">
          ${km ? `<div style="${k.kh}font-size:1.25em;color:${c.primary}">${km}</div>` : ''}
          <div style="${k.b}font-size:.85em">${cap.slice(0, 140)}</div>
          <div style="align-self:flex-start">${sticker(lang === 'km' ? 'អានបន្ថែម ↑' : 'Read more ↑')}</div>
        </div>`);
    }
    if (kind === 'poster') {
      return box('3 / 4', `${shape(c, ty, 'left:-14%;bottom:-14%')}
        <div style="position:absolute;right:-9%;top:-7%;width:28%;aspect-ratio:1;border-radius:${ty.stickers ? '50%' : '0'};border:.5em solid ${c.primary};opacity:.85"></div>
        <div style="position:absolute;left:8%;right:8%;top:12%;display:flex;flex-direction:column">
          ${sticker(lang === 'km' ? 'កម្មវិធីពិសេស' : 'Special night')}
          <div style="${k.h}font-size:2.6em;color:${c.primary};margin-top:.35em">${en || title}</div>
          ${km ? `<div style="${k.kh}font-size:1.3em;margin-top:.3em">${km}</div>` : ''}
        </div>
        <div style="position:absolute;left:8%;right:8%;bottom:8%;text-align:right;${k.b}font-size:.8em">
          <div style="${k.h}font-size:1.2em;color:${c.text}">${title}</div>
          <div style="opacity:.85">${lang === 'km' ? 'សុក្រ ៧ យប់ • [ទីកន្លែង]' : 'Friday 7pm • [place]'}</div>
        </div>`);
    }
    if (kind === 'thumb') {
      return box('16 / 9', `<div style="position:absolute;inset:0 45% 0 0;background:${c.primary}"></div>
        <div style="position:absolute;right:6%;top:12%;bottom:12%;width:34%;border-radius:${ty.stickers ? Math.max(r, 12) * 0.08 + 'em' : '0'};background:${B.mix(c.secondary, c.background, .15)};display:flex;align-items:center;justify-content:center;${k.b}color:${onS};font-size:.8em;transform:rotate(${ty.tilt / 2}deg)">${lang === 'km' ? '[រូបថតរបស់អ្នក]' : '[your photo]'}</div>
        <div style="position:absolute;left:5%;top:12%;width:48%;color:${onP}">
          <div style="${k.h}font-size:2em">${en || title}</div>
          ${km ? `<div style="${k.kh}font-size:1.05em;margin-top:.3em">${km}</div>` : ''}
          <div style="margin-top:.6em">${sticker(pillar || title)}</div>
        </div>`);
    }
    if (kind === 'header') {
      return box('820 / 312', `<div style="position:absolute;inset:0;background:linear-gradient(90deg,${c.background} 0 55%,${c.primary} 55%)"></div>
        ${shape(c, ty, 'right:20%;top:-30%')}
        <div style="position:absolute;left:5%;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:.8em;max-width:62%">
          <div style="flex:0 0 3.6em;height:3.6em;border-radius:50%;background:${c.primary};color:${onP};display:flex;align-items:center;justify-content:center;${k.h}font-size:1em;border:.18em solid ${c.background};box-shadow:0 0 0 .12em ${c.accent}">${esc(String(b.title || '?').trim().slice(0, 1).toUpperCase())}</div>
          <div><div style="${k.h}font-size:1.5em;color:${c.primary}">${title}</div>
          <div style="${k.b}font-size:.8em">${en}</div>${km ? `<div style="${k.kb}font-size:.8em">${km}</div>` : ''}</div>
        </div>`);
    }
    return '';
  };
  B.MOCKS = ['post', 'story', 'poster', 'thumb', 'header'];

  /* ---------------- the words we export ---------------- */
  const line = (x, lang) => pick(x, lang);
  B.fontNames = (f) => ({ heading: f.heading.family, body: f.body.family, khHeading: f.khHeading.family, khBody: f.khBody.family });
  B.briefText = function (b, lang, T) {
    const f = B.fontNames(b.font), c = b.colors, L = (x) => line(x, lang);
    const out = [
      `${T('briefTitle')}: ${b.title}`,
      '',
      `${T('mission')}: ${L(b.mission)}`,
      `${T('personality')}: ${L(b.personality)}`,
      `${T('audience')}: ${b.audience || ''}`,
      `${T('personalityWords')}: ${(b.words || []).join(', ')}`,
      '',
      `${T('palette')}:`,
      ...B.ROLES.map(r => `  ${T('role_' + r)}: ${c[r]}`),
      '',
      `${T('fonts')}: ${T('headings')} ${f.heading} · ${T('body')} ${f.body} · ${T('khmerHeadings')} ${f.khHeading} · ${T('khmerBody')} ${f.khBody}`,
      '',
      `${T('mainTagline')}: ${L(b.tagline)}`,
      `${T('taglines')}:`,
      ...(b.taglines || []).map(x => '  • ' + L(x)),
      '',
      `${T('voiceDo')}:`, ...(b.voiceDo || []).map(x => '  ✓ ' + L(x)),
      `${T('voiceDont')}:`, ...(b.voiceDont || []).map(x => '  ✗ ' + L(x)),
      '',
      `${T('howWithClaude')}:`,
      B.projectBlock(b, lang)
    ];
    return out.join('\n');
  };
  /* The ready-to-paste instruction for a Claude Project (or any AI tool). */
  B.projectBlock = function (b, lang) {
    const f = B.fontNames(b.font), c = b.colors, L = (x) => line(x, lang);
    if (lang === 'km') {
      return [
        `អ្នកជួយខ្ញុំបង្កើតមាតិកាសម្រាប់ «${b.title}»។`,
        `ពេលរចនាអ្វីក៏ដោយ ត្រូវប្រើពណ៌ទាំងនេះជានិច្ច៖ ពណ៌មេ ${c.primary}, ពណ៌រង ${c.secondary}, ពណ៌បន្លិច ${c.accent} (ប្រើតិចៗ), ផ្ទៃខាងក្រោយ ${c.background}, អក្សរ ${c.text}។`,
        `ពុម្ពអក្សរ៖ ចំណងជើង ${f.heading}, អត្ថបទ ${f.body}។ អក្សរខ្មែរ៖ ចំណងជើង ${f.khHeading}, អត្ថបទ ${f.khBody}។`,
        `បុគ្គលិកលក្ខណៈ៖ ${L(b.personality)}`,
        `បេសកកម្ម៖ ${L(b.mission)}`,
        `អ្នកទស្សនា៖ ${b.audience || ''}`,
        `សំឡេង — ធ្វើ៖ ${(b.voiceDo || []).map(L).join('; ')}។ កុំធ្វើ៖ ${(b.voiceDont || []).map(L).join('; ')}។`,
        `ពាក្យស្លោក៖ ${(b.taglines || []).slice(0, 4).map(L).join(' | ')}`,
        `ប្រធានបទមាតិកា៖ ${(b.pillars || []).map(p => L(p.title)).join(', ')}`,
        `កុំចម្លងម៉ាកផ្សេង។ សរសេរជាភាសាខ្មែរ និងអង់គ្លេសងាយៗ។ សួរខ្ញុំ ប្រសិនបើខ្វះព័ត៌មាន (ថ្ងៃ ទីកន្លែង រូបថត)។`
      ].join('\n');
    }
    return [
      `You are helping me create content for "${b.title}".`,
      `Always design with these colours: primary ${c.primary}, secondary ${c.secondary}, accent ${c.accent} (use sparingly), background ${c.background}, text ${c.text}.`,
      `Fonts: headings ${f.heading}, body ${f.body}. For Khmer text: headings ${f.khHeading}, body ${f.khBody}.`,
      `Brand personality: ${L(b.personality)}`,
      `Mission: ${L(b.mission)}`,
      `Audience: ${b.audience || ''}`,
      `Voice — do: ${(b.voiceDo || []).map(L).join('; ')}. Don't: ${(b.voiceDont || []).map(L).join('; ')}.`,
      `Taglines: ${(b.taglines || []).slice(0, 4).map(L).join(' | ')}`,
      `Content pillars: ${(b.pillars || []).map(p => L(p.title)).join(', ')}`,
      `Speak in this voice, for this audience, in simple English and natural Khmer. Never copy other brands. Ask me for missing details (date, place, photo) instead of inventing them.`
    ].join('\n');
  };
  /* One block that works pasted into Claude, ChatGPT, Gemini, Canva AI or anything else. */
  B.universalPrompt = function (b, lang) {
    const f = B.fontNames(b.font), c = b.colors, L = (x) => line(x, lang);
    if (lang === 'km') {
      return `=== ម៉ាករបស់ខ្ញុំ៖ ${b.title} ===
សូមប្រើព័ត៌មាននេះគ្រប់ពេលដែលអ្នកជួយខ្ញុំសរសេរ ឬរចនា។

ខ្ញុំជានរណា៖ ${L(b.personality)}
បេសកកម្ម៖ ${L(b.mission)}
ហេតុអ្វីខ្ញុំបង្ហោះ៖ ${L(b.whyIPost)}
អ្នកទស្សនារបស់ខ្ញុំ៖ ${b.audience || ''}

ពណ៌ (ប្រើតែពណ៌ទាំងនេះ)៖
- ពណ៌មេ ${c.primary}
- ពណ៌រង ${c.secondary}
- ពណ៌បន្លិច ${c.accent} (ប្រើតិចៗ)
- ផ្ទៃខាងក្រោយ ${c.background}
- អក្សរ ${c.text}

ពុម្ពអក្សរ (Google Fonts)៖ ចំណងជើង ${f.heading} · អត្ថបទ ${f.body} · ចំណងជើងខ្មែរ ${f.khHeading} · អត្ថបទខ្មែរ ${f.khBody}

ពាក្យស្លោក៖
${(b.taglines || []).map(x => '- ' + L(x)).join('\n')}

ប្រធានបទមាតិកា៖
${(b.pillars || []).map(p => '- ' + L(p.title) + ' — ' + L(p.idea)).join('\n')}

សំឡេង — ធ្វើ៖
${(b.voiceDo || []).map(x => '- ' + L(x)).join('\n')}
សំឡេង — កុំធ្វើ៖
${(b.voiceDont || []).map(x => '- ' + L(x)).join('\n')}

ច្បាប់៖
- រចនាដោយប្រើពណ៌ និងពុម្ពអក្សរខាងលើជានិច្ច។
- និយាយដោយសំឡេងនេះ សម្រាប់អ្នកទស្សនានេះ។
- ប្រើភាសាសាមញ្ញ។ កុំចម្លងម៉ាក ឡូហ្គោ ឬពាក្យស្លោករបស់អ្នកដទៃ។
- ប្រសិនបើខ្វះព័ត៌មាន (ថ្ងៃ ទីកន្លែង រូបថត) សូមសួរខ្ញុំ។`;
    }
    return `=== MY BRAND: ${b.title} ===
Use this every time you help me write or design anything.

Who I am: ${L(b.personality)}
Mission: ${L(b.mission)}
Why I post: ${L(b.whyIPost)}
My audience: ${b.audience || ''}

COLOURS (use only these):
- Primary ${c.primary}
- Secondary ${c.secondary}
- Accent ${c.accent} (use sparingly)
- Background ${c.background}
- Text ${c.text}

FONTS (Google Fonts): headings ${f.heading} · body ${f.body} · Khmer headings ${f.khHeading} · Khmer body ${f.khBody}

TAGLINES:
${(b.taglines || []).map(x => '- ' + L(x)).join('\n')}

CONTENT PILLARS:
${(b.pillars || []).map(p => '- ' + L(p.title) + ' — ' + L(p.idea)).join('\n')}

VOICE — DO:
${(b.voiceDo || []).map(x => '- ' + L(x)).join('\n')}
VOICE — DON'T:
${(b.voiceDont || []).map(x => '- ' + L(x)).join('\n')}

RULES:
- Always design with these colours and fonts.
- Speak in this voice, for this audience.
- Keep words simple. Write Khmer naturally, not word for word.
- Never copy other brands' logos, names or slogans.
- If a detail is missing (date, place, photo), ask me instead of inventing it.`;
  };

  /* ---------------- the brand kit image (1080×1920, for the camera roll) ---------------- */
  function wrap(ctx, text, x, y, maxW, lh, maxLines) {
    const words = String(text || '').split(/(\s+)/); let lineTxt = '', lines = 0;
    // Khmer has no spaces between words: fall back to breaking by characters when one "word" is too wide.
    const flush = () => { ctx.fillText(lineTxt.trim(), x, y); y += lh; lines++; lineTxt = ''; };
    for (const w of words) {
      if (ctx.measureText(lineTxt + w).width > maxW && lineTxt.trim()) { flush(); if (lines >= maxLines) return y; }
      if (ctx.measureText(w).width > maxW) {
        for (const ch of Array.from(w)) { if (ctx.measureText(lineTxt + ch).width > maxW) { flush(); if (lines >= maxLines) return y; } lineTxt += ch; }
      } else lineTxt += w;
    }
    if (lineTxt.trim() && lines < maxLines) flush();
    return y;
  }
  B.kitImage = async function (b, lang) {
    await B.fontsReady(b.font);
    const W = 1080, H = 1920, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d'), c = b.colors, f = b.font, ty = B.tuneType(b.tune);
    const fh = (sz, kh) => `${kh ? f.khHeading.weight || 400 : f.heading.weight || 700} ${sz}px ${B.ff(kh ? f.khHeading.family : f.heading.family)}`;
    const fb = (sz, kh) => `${kh ? f.khBody.weight || 400 : f.body.weight || 400} ${sz}px ${B.ff(kh ? f.khBody.family : f.body.family)}`;
    x.fillStyle = c.background; x.fillRect(0, 0, W, H);
    x.fillStyle = c.primary; x.fillRect(0, 0, W, 520);
    x.fillStyle = c.secondary; x.beginPath(); x.arc(W - 120, 470, 170, 0, Math.PI * 2); x.fill();
    x.fillStyle = B.readableOn(c.primary); x.textBaseline = 'top';
    x.font = fb(36); x.fillText((lang === 'km' ? 'កញ្ចប់ម៉ាក' : 'BRAND KIT'), 80, 90);
    x.font = fh(96); let y = wrap(x, ty.upper ? String(b.title).toUpperCase() : b.title, 80, 160, 820, 104, 2);
    x.font = fb(40); wrap(x, pick(b.tagline, 'en'), 80, y + 20, 760, 52, 2);
    y = 600;
    x.fillStyle = c.text; x.font = fb(34); x.fillText(lang === 'km' ? 'ពណ៌' : 'COLOURS', 80, y); y += 60;
    B.ROLES.forEach((r, i) => {
      const cx = 80 + i * 188;
      x.fillStyle = c[r]; x.beginPath(); x.roundRect ? x.roundRect(cx, y, 164, 164, 24) : x.rect(cx, y, 164, 164); x.fill();
      x.strokeStyle = B.mix(c.text, c.background, 0.75); x.lineWidth = 3; x.stroke();
      x.fillStyle = c.text; x.font = fb(28); x.fillText(c[r], cx, y + 180);
      x.font = fb(24); x.globalAlpha = 0.75; x.fillText(r, cx, y + 216); x.globalAlpha = 1;
    });
    y += 300;
    x.fillStyle = c.text; x.font = fb(34); x.fillText(lang === 'km' ? 'ពុម្ពអក្សរ' : 'FONTS', 80, y); y += 60;
    x.fillStyle = c.primary; x.font = fh(72); x.fillText('Aa ' + f.heading.family, 80, y); y += 100;
    x.fillStyle = c.text; x.font = fb(40); x.fillText(f.body.family + ' — body text', 80, y); y += 70;
    x.fillStyle = c.primary; x.font = fh(58, true); x.fillText('ខ្មែរ ' + f.khHeading.family, 80, y); y += 100;
    x.fillStyle = c.text; x.font = fb(38, true); x.fillText('អត្ថបទ ' + f.khBody.family, 80, y); y += 110;
    x.fillStyle = c.text; x.font = fb(34); x.fillText(lang === 'km' ? 'ពាក្យស្លោក' : 'TAGLINES', 80, y); y += 64;
    for (const tl of (b.taglines || []).slice(0, 3)) {
      if (y > H - 300) break;
      x.fillStyle = c.accent; x.fillRect(80, y + 6, 12, 44);
      x.fillStyle = c.text; x.font = fh(44); y = wrap(x, pick(tl, 'en'), 116, y, 880, 54, 1);
      x.font = fh(36, true); y = wrap(x, pick(tl, 'km'), 116, y + 4, 880, 58, 1) + 26;
    }
    x.fillStyle = c.primary; x.fillRect(0, H - 120, W, 120);
    x.fillStyle = B.readableOn(c.primary); x.font = fb(30); x.fillText('Brand From the Heart', 80, H - 76);
    return cv;
  };

  /* ---------------- print pages ("Save as PDF") ---------------- */
  B.printPages = function (b, lang, T) {
    const k = css(b), c = b.colors, L = (o) => esc(pick(o, lang)), f = b.font;
    const sw = B.ROLES.map(r => `<div class="pp-sw"><div style="background:${c[r]};height:26mm;border-radius:3mm;border:1px solid #0002"></div>
      <div class="pp-row">${[...B.tints(c[r]).slice(0, 2).reverse(), ...B.shades(c[r]).slice(0, 2)].map(h => `<i style="background:${h}"></i>`).join('')}</div>
      <b>${esc(T('role_' + r))}</b><br><code>${c[r]}</code></div>`).join('');
    const pk = b.pkg || {};
    const page = (title, inner) => `<section class="pp-page" style="background:${c.background};color:${c.text}"><div class="pp-head" style="${k.b}"><span style="color:${c.primary};${k.h}">${esc(b.title)}</span><span>${esc(title)}</span></div>${inner}<div class="pp-foot" style="${k.b}">Brand From the Heart</div></section>`;
    return [
      `<section class="pp-page pp-cover" style="background:${c.primary};color:${B.readableOn(c.primary)}">
        <div style="${k.b}font-size:12pt;opacity:.85">${esc(T('brandGuide'))}</div>
        <div style="${k.h}font-size:48pt;margin:8mm 0 4mm">${esc(b.title)}</div>
        <div style="${k.h}font-size:20pt">${esc(pick(b.tagline, 'en'))}</div>
        <div style="${k.kh}font-size:18pt;margin-top:3mm">${esc(pick(b.tagline, 'km'))}</div>
        <div style="position:absolute;right:-30mm;bottom:-30mm;width:120mm;height:120mm;border-radius:50%;background:${c.secondary}"></div>
      </section>`,
      page(T('pStory'), `<h2 style="${k.h}color:${c.primary}">${esc(T('pStory'))}</h2>
        ${b.heart ? `<p style="${lang === 'km' ? k.kb : k.b}font-size:12pt">${esc(lang === 'km' ? b.heart.km : b.heart.en)}</p>` : ''}
        <h3 style="${k.h}">${esc(T('mission'))}</h3><p style="${k.b}">${L(b.mission)}</p>
        <h3 style="${k.h}">${esc(T('personality'))}</h3><p style="${k.b}">${L(b.personality)}</p>
        <h3 style="${k.h}">${esc(T('whyIPost'))}</h3><p style="${k.b}">${L(b.whyIPost)}</p>
        <h3 style="${k.h}">${esc(T('audience'))}</h3><p style="${k.b}">${esc(b.audience || '')}</p>`),
      page(T('palette'), `<h2 style="${k.h}color:${c.primary}">${esc(T('palette'))}</h2><div class="pp-sws">${sw}</div>
        ${(pk.colourRules || []).length ? `<h3 style="${k.h}">${esc(T('colourRules'))}</h3><ul style="${k.b}">${pk.colourRules.map(x => `<li>${L(x)}</li>`).join('')}</ul>` : ''}`),
      page(T('typeTitle'), `<h2 style="${k.h}color:${c.primary}">${esc(T('typeTitle'))}</h2>
        <div style="${k.h}font-size:34pt;color:${c.primary}">${esc(T('sampleHeading'))}</div><p class="pp-cap">${esc(T('headings'))}: ${esc(f.heading.family)}${pk.typeRules ? ' — ' + L(pk.typeRules.heading) : ''}</p>
        <div style="${k.h}font-size:18pt">${esc(T('sampleSub'))}</div><p class="pp-cap">${esc(T('subheading'))}${pk.typeRules ? ' — ' + L(pk.typeRules.subheading) : ''}</p>
        <div style="${k.b}font-size:11pt">${esc(T('sampleBody'))}</div><p class="pp-cap">${esc(T('body'))}: ${esc(f.body.family)}${pk.typeRules ? ' — ' + L(pk.typeRules.body) : ''}</p>
        <div style="${k.kh}font-size:26pt;color:${c.primary}">ក្ដីសង្ឃឹមសម្រាប់ថ្ងៃស្អែក</div><p class="pp-cap">${esc(T('khmerHeadings'))}: ${esc(f.khHeading.family)}</p>
        <div style="${k.kb}font-size:12pt">ព្រះស្រឡាញ់អ្នក ហើយមានផែនការល្អសម្រាប់ជីវិតអ្នក។</div><p class="pp-cap">${esc(T('khmerBody'))}: ${esc(f.khBody.family)}</p>`),
      page(T('logoIdeas'), `<h2 style="${k.h}color:${c.primary}">${esc(T('logoIdeas'))}</h2>
        <div class="pp-marks">
          <div style="background:${c.background};border:1px solid #0002"><span style="${k.h}font-size:28pt;color:${c.primary}">${esc(b.title)}</span></div>
          <div style="background:${c.primary}"><span style="${k.h}font-size:28pt;color:${B.readableOn(c.primary)}">${esc(b.title)}</span></div>
          <div style="background:${c.text}"><span style="${k.h}font-size:28pt;color:${c.background}">${esc(b.title)}</span><span style="display:inline-block;width:5mm;height:5mm;border-radius:50%;background:${c.accent};margin-left:2mm"></span></div>
        </div>
        ${(pk.wordmarks || []).length ? `<ul style="${k.b}">${pk.wordmarks.map(w => `<li><b>${L(w.name)}</b> — ${L(w.how)}</li>`).join('')}</ul>` : (b.wordmark ? `<p style="${k.b}">${L(b.wordmark)}</p>` : '')}`),
      page(T('voiceTitle'), `<h2 style="${k.h}color:${c.primary}">${esc(T('voiceTitle'))}</h2>
        <div class="pp-two"><div><h3 style="${k.h}">✓ ${esc(T('voiceDo'))}</h3><ul style="${k.b}">${(b.voiceDo || []).map(x => `<li>${L(x)}</li>`).join('')}</ul>
          ${(pk.doExamples || []).length ? `<h3 style="${k.h}">✓ ${esc(T('doExamples'))}</h3><ul style="${k.b}">${pk.doExamples.map(x => `<li>${L(x)}</li>`).join('')}</ul>` : ''}</div>
        <div><h3 style="${k.h}">✗ ${esc(T('voiceDont'))}</h3><ul style="${k.b}">${(b.voiceDont || []).map(x => `<li>${L(x)}</li>`).join('')}</ul>
          ${(pk.dontExamples || []).length ? `<h3 style="${k.h}">✗ ${esc(T('dontExamples'))}</h3><ul style="${k.b}">${pk.dontExamples.map(x => `<li>${L(x)}</li>`).join('')}</ul>` : ''}</div></div>
        <h3 style="${k.h}">${esc(T('taglines'))}</h3><ul style="${k.b}">${(b.taglines || []).map(x => `<li>${esc(x.en)} — <span style="${k.kb}">${esc(x.km)}</span></li>`).join('')}</ul>`),
      page(T('pillarsTitle'), `<h2 style="${k.h}color:${c.primary}">${esc(T('pillarsTitle'))}</h2>
        <ol style="${k.b}">${(b.pillars || []).map(p => `<li><b>${L(p.title)}</b> — ${L(p.idea)}</li>`).join('')}</ol>
        <h3 style="${k.h}">${esc(T('captions'))}</h3>${(b.captions || []).map(x => `<p style="${k.b}border-left:2mm solid ${c.accent};padding-left:3mm">${L(x)}</p>`).join('')}
        <p style="${k.b}color:${c.primary}">${esc((b.hashtags || []).join(' '))}</p>`),
      page(T('samplePosts'), `<h2 style="${k.h}color:${c.primary}">${esc(T('samplePosts'))}</h2>
        <div class="pp-mocks"><div style="font-size:9pt">${B.mock('post', b, lang)}</div><div style="font-size:7pt">${B.mock('story', b, lang)}</div><div style="font-size:8pt">${B.mock('poster', b, lang)}</div></div>
        <div style="font-size:8pt;margin-top:6mm;width:70%">${B.mock('thumb', b, lang)}</div>`),
      page(T('aiPrompt'), `<h2 style="${k.h}color:${c.primary}">${esc(T('aiPrompt'))}</h2><pre class="pp-pre">${esc(B.universalPrompt(b, lang))}</pre>`)
    ].join('');
  };

  window.BFH_BRAND = B;
})();

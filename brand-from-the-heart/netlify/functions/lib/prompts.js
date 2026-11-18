/*  Brand From the Heart — what we ask Claude, and the JSON shapes we ask for.

    Every call uses structured outputs (a JSON schema), so the page can always
    draw what comes back. The student's own words are data: they go in the user
    turn, wrapped and labelled, never in the system prompt.

    Kinds of job (the page starts one through api.js → genStart):
      heart       the "this is who you are" story, English + Khmer
      directions  5 brand directions, one call per "lane", run side by side
      more        2 more like one direction ("show me more like this")
      refine      one part of a direction again: palette | fonts | words | voice,
                  made warmer | bolder | simpler | softer | cooler | more Khmer | more playful
      package     the finished brand's extras: wordmark ideas, colour rules, type
                  hierarchy, do/don't examples, 5 Claude Motion prompts, 5 poster prompts
*/
import { PALETTES, FONTS, BRANDS, ARCHETYPES, QUESTIONS, TOT, QUIZ_RESULTS, COLOR } from './data.js';

/* ---------------- JSON schema pieces ---------------- */
const S = { type: 'string' };
const BI = { type: 'object', properties: { en: S, km: S }, required: ['en', 'km'], additionalProperties: false };
const arr = (items) => ({ type: 'array', items });
const obj = (props) => ({ type: 'object', properties: props, required: Object.keys(props), additionalProperties: false });
const COLORS = obj({ primary: S, secondary: S, accent: S, background: S, text: S });

export const HEART_SCHEMA = obj({ title: BI, en: S, km: S });

const DIR_PROPS = {
  name: BI, personality: BI, archetype: S, mood: S,
  paletteId: S, colors: COLORS, paletteWhy: BI,
  fontId: S, fontWhy: BI,
  taglines: arr(BI), bio: BI, mission: BI, whyIPost: BI,
  pillars: arr(obj({ title: BI, idea: BI })),
  captions: arr(BI), hashtags: arr(S),
  voiceDo: arr(BI), voiceDont: arr(BI),
  wordmark: BI, keywords: arr(S)
};
export const DIRECTION_SCHEMA = obj(DIR_PROPS);

export const REFINE_PARTS = {
  palette: ['paletteId', 'colors', 'paletteWhy'],
  fonts: ['fontId', 'fontWhy'],
  words: ['taglines', 'bio', 'mission', 'whyIPost', 'captions', 'hashtags'],
  voice: ['voiceDo', 'voiceDont']
};
export const REFINE_HOW = {
  warmer: 'warmer — more sunlight, earth and welcome',
  cooler: 'cooler — calmer, more blue-green, more breathing room',
  bolder: 'bolder — more contrast, more energy, more confidence',
  softer: 'softer — gentler, lighter, kinder',
  simpler: 'simpler — fewer ideas, plainer words, cleaner',
  khmer: 'more rooted in Cambodia — Khmer colours, motifs and type',
  playful: 'more playful — more fun, more surprise, lighter tone'
};
export function refineSchema(part) {
  const p = {};
  for (const k of REFINE_PARTS[part]) p[k] = DIR_PROPS[k];
  return obj(p);
}

const PROMPT_ITEM = obj({ kind: S, title: BI, use: BI, prompt: S });
export const PACKAGE_SCHEMA = obj({
  wordmarks: arr(obj({ name: BI, how: BI })),
  colourRules: arr(BI),
  typeRules: obj({ heading: BI, subheading: BI, body: BI }),
  doExamples: arr(BI), dontExamples: arr(BI),
  motion: arr(PROMPT_ITEM),
  posters: arr(PROMPT_ITEM)
});

/* ---------------- the system prompt (stable — cached) ---------------- */
function paletteLines() {
  return PALETTES.map(p => `${p.id} | ${p.mood} | ${p.name.en} | primary ${p.colors.primary} secondary ${p.colors.secondary} accent ${p.colors.accent} background ${p.colors.background} text ${p.colors.text}`).join('\n');
}
function fontLines() {
  return FONTS.map(f => `${f.id} | ${f.style} | ${f.heading.family} ${f.heading.weight} / ${f.body.family} ${f.body.weight} | Khmer: ${f.khHeading.family} / ${f.khBody.family}`).join('\n');
}
let SYSTEM_CACHE = null;
export function systemPrompt() {
  if (SYSTEM_CACHE) return SYSTEM_CACHE;
  SYSTEM_CACHE = `You are a warm, skilled brand designer and copywriter helping students at a Christian social media school in Cambodia build an authentic personal or ministry brand. Most students speak Khmer first and read basic English. They will use the brand with AI tools to make posters, graphics and short videos.

How you work:
- The brand must come from the student's own heart: their story, their people, their words. Use their details. Never generic.
- Faith-friendly but not cheesy: no clichés like "blessed and highly favoured", no preachy tone unless they asked for it.
- English: short, simple sentences a learner can read. No idioms that don't translate.
- Khmer: write natural Khmer the way a young Cambodian Christian talks and posts — not a word-for-word translation. Use ព្រះ for God and ព្រះយេស៊ូវ for Jesus, as Cambodian churches do. Every {en, km} pair says the same thing in each language.
- Never copy a real brand: no real brand names, slogans, logos or trademarks in what you make. Liked brands are only taste signals.
- Taglines: 2–7 words, memorable, specific to this person.
- Colours: pick from the palette library below and adapt it to the student (you may shift colours or add one custom colour from what they love). Hex codes as #RRGGBB. The text colour must be easy to read on the background (contrast 7:1 or more); the primary colour must stand out on the background.
- Fonts: pick one pairing id from the font library below — it already carries a matching Khmer heading and body font.
- Answer only with the JSON the schema asks for.

PALETTE LIBRARY (id | mood | name | colours)
${paletteLines()}

FONT LIBRARY (id | style | Latin heading / body | Khmer heading / body)
${fontLines()}`;
  return SYSTEM_CACHE;
}

/* ---------------- the student, as Claude reads it ---------------- */
const clip = (s, n) => String(s == null ? '' : s).slice(0, n);
function answerText(q, a) {
  if (a == null || a === '') return '';
  if (Array.isArray(a)) {
    if (q.type === 'chips') return a.map(id => { const o = (q.options || []).find(o => o.id === id); return o ? o.en : clip(id, 60); }).join(', ');
    return a.map(x => clip(x, 60)).filter(Boolean).join(', ');
  }
  if (q.type === 'choice') { const o = (q.options || []).find(o => o.id === a); return o ? o.en : clip(a, 80); }
  return clip(a, 1500);
}
export function profileText(data) {
  data = data || {};
  const ans = data.answers || {}, lines = [];
  for (const q of QUESTIONS) {
    if (q.type === 'tot') continue;
    const t = answerText(q, ans[q.id]);
    if (t) lines.push(`Q: ${q.q.en}\nA: ${t}`);
  }
  const tot = data.tot || {}, taste = [];
  for (const p of TOT) { const c = tot[p.id]; if (c === 'a' || c === 'b') taste.push(`- ${p.q.en} → "${p[c].label.en}" (${p[c].signal})`); }
  const likes = (data.likes || []).map(id => BRANDS.find(b => b.id === id)).filter(Boolean)
    .map(b => `${b.name} (${(ARCHETYPES.find(a => a.id === b.archetype) || {}).en || b.archetype}: ${b.feeling.en})`);
  const quiz = data.quiz && data.quiz.result;
  let out = `<student_answers>\n${lines.join('\n\n') || '(no answers yet)'}\n</student_answers>`;
  if (taste.length) out += `\n\n<visual_taste>\n${taste.join('\n')}\n</visual_taste>`;
  if (likes.length) out += `\n\n<brands_they_like_the_vibe_of>\n${likes.join('\n')}\n</brands_they_like_the_vibe_of>`;
  if (quiz && quiz.top) out += `\n\n<archetype_quiz>top: ${quiz.top}${quiz.second ? ', second: ' + quiz.second : ''}${QUIZ_RESULTS[quiz.top] ? ' (' + QUIZ_RESULTS[quiz.top].title.en + ')' : ''}</archetype_quiz>`;
  const h = data.heart;
  if (h && (h.en || h.km)) out += `\n\n<heart_check note="the student read this and confirmed or edited it — it is who they are, let it drive everything">\n${clip(h.en, 2500)}\n${clip(h.km, 2500)}\n</heart_check>`;
  return out;
}

/* ---------------- five lanes, so the directions really differ ---------------- */
const MOOD_TO_PAL = { joyful: ['joyful'], calm: ['calm'], bold: ['bold'], gentle: ['gentle'], hopeful: ['warm', 'joyful'], playful: ['joyful'], serious: ['modern', 'sacred'], warm: ['warm'], modern: ['modern'], traditional: ['khmer', 'sacred', 'earthy'], adventurous: ['earthy', 'bold'] };
const MOOD_TO_FONT = { joyful: ['playful'], calm: ['elegant'], bold: ['strong'], gentle: ['handwritten', 'elegant'], hopeful: ['modern'], playful: ['playful', 'handwritten'], serious: ['editorial'], warm: ['handwritten'], modern: ['modern'], traditional: ['traditional'], adventurous: ['strong'] };
const ARCH_TO_PAL = { bold: ['bold'], simple: ['modern'], warm: ['warm'], explorer: ['earthy'], sage: ['sacred', 'modern'], faith: ['sacred'], playful: ['joyful'] };
const ARCH_TO_FONT = { bold: ['strong'], simple: ['modern'], warm: ['handwritten'], explorer: ['strong', 'editorial'], sage: ['editorial'], faith: ['elegant', 'traditional'], playful: ['playful'] };
const uniq = (a) => [...new Set(a.filter(Boolean))];

export function lanes(data) {
  data = data || {};
  const moods = ((data.answers || {}).moods || []).filter(m => MOOD_TO_PAL[m]);
  const likedArch = uniq((data.likes || []).map(id => (BRANDS.find(b => b.id === id) || {}).archetype));
  const quizTop = data.quiz && data.quiz.result && data.quiz.result.top;
  const heartPal = uniq(moods.flatMap(m => MOOD_TO_PAL[m])).slice(0, 3);
  const heartFont = uniq(moods.flatMap(m => MOOD_TO_FONT[m])).slice(0, 3);
  const wildArch = uniq([...likedArch, quizTop]);
  const wildPal = uniq(wildArch.flatMap(a => ARCH_TO_PAL[a] || [])).slice(0, 3);
  const wildFont = uniq(wildArch.flatMap(a => ARCH_TO_FONT[a] || [])).slice(0, 3);
  return [
    { id: 'heart', title: 'Heart-true', brief: 'The most faithful picture of their answers and moods. If they read it they should say "that is me".', pal: heartPal.length ? heartPal : ['warm', 'calm'], font: heartFont.length ? heartFont : ['modern', 'elegant'] },
    { id: 'bold', title: 'Brighter & bolder', brief: 'The same heart with more energy, colour and confidence — for scrolling thumbs.', pal: ['bold', 'joyful'], font: ['strong', 'playful', 'modern'] },
    { id: 'soft', title: 'Softer & gentler', brief: 'The same heart with calm, space and tenderness — like a quiet conversation.', pal: ['gentle', 'calm', 'sacred'], font: ['elegant', 'handwritten', 'editorial'] },
    { id: 'khmer', title: 'Rooted in Cambodia', brief: 'Draw on Khmer colour, craft and type: Angkor stone, krama checks, silk, lotus, rice fields — modern, not old-fashioned.', pal: ['khmer'], font: ['traditional', 'elegant', 'modern'] },
    { id: 'wild', title: 'Wildcard', brief: 'Inspired by the brands they like and their this-or-that picks. Surprising, but still unmistakably them.', pal: wildPal.length ? wildPal : ['modern', 'earthy'], font: wildFont.length ? wildFont : ['editorial', 'playful'] }
  ];
}
function laneText(l, others) {
  return `<your_lane>\nThis direction's lane: "${l.title}" — ${l.brief}\nStart from palettes with mood: ${l.pal.join(', ')}. Start from font styles: ${l.font.join(', ')}.\nThe other directions being made at the same time are: ${others.join('; ')} — make yours clearly different from them.\n</your_lane>`;
}
const DIR_ASK = `Make ONE brand direction for this student as JSON. Include: a short evocative name for the direction; a one-sentence brand personality; archetype (one of: ${'bold, simple, warm, explorer, sage, faith, playful'}); mood (one palette mood id); paletteId and the 5 adapted colours; why this palette; fontId and why; 8 taglines; a short bio (under 150 characters, for a profile); a mission statement (one sentence); a "why I post" statement (two sentences, first person); 5 content pillars (title + one-line idea); 3 sample captions (first person, ready to post, 1–3 sentences each, may end with a question); 8 hashtags (mix English and Khmer, no spaces); 3 voice do's and 3 don'ts; a logo wordmark idea (how to set their name as a simple text logo in this direction's fonts); 3 keywords for the feeling. Every text field in English and Khmer.`;

/* ---------------- tidy what comes back ---------------- */
const HEX = /^#[0-9A-Fa-f]{6}$/;
const biOk = (b) => b && typeof b === 'object' ? { en: clip(b.en, 600), km: clip(b.km, 900) } : { en: '', km: '' };
const biArr = (a, n) => (Array.isArray(a) ? a : []).slice(0, n).map(biOk).filter(b => b.en || b.km);
export function cleanColors(c, fallback) {
  const fb = fallback || (PALETTES[0] && PALETTES[0].colors) || { primary: '#C8553D', secondary: '#F28F3B', accent: '#588B8B', background: '#FFF5E9', text: '#2B2118' };
  const out = {};
  for (const k of ['primary', 'secondary', 'accent', 'background', 'text']) out[k] = HEX.test(c && c[k]) ? c[k].toUpperCase() : fb[k];
  if (COLOR && COLOR.contrast(out.text, out.background) < 4.5) {
    out.text = COLOR.contrast('#111111', out.background) >= COLOR.contrast('#FFFFFF', out.background) ? '#1A1A1A' : '#FFFFFF';
  }
  return out;
}
export function cleanDirection(d, lane) {
  d = d || {};
  const pal = PALETTES.find(p => p.id === d.paletteId) || PALETTES.find(p => lane && lane.pal.includes(p.mood)) || PALETTES[0];
  const font = FONTS.find(f => f.id === d.fontId) || FONTS.find(f => lane && lane.font.includes(f.style)) || FONTS[0];
  return {
    lane: lane ? lane.id : (d.lane || 'more'),
    name: biOk(d.name), personality: biOk(d.personality),
    archetype: ARCHETYPES.some(a => a.id === d.archetype) ? d.archetype : 'warm',
    mood: pal ? pal.mood : clip(d.mood, 20),
    paletteId: pal ? pal.id : '', colors: cleanColors(d.colors, pal && pal.colors), paletteWhy: biOk(d.paletteWhy),
    fontId: font ? font.id : '', fontWhy: biOk(d.fontWhy),
    taglines: biArr(d.taglines, 8), bio: biOk(d.bio), mission: biOk(d.mission), whyIPost: biOk(d.whyIPost),
    pillars: (Array.isArray(d.pillars) ? d.pillars : []).slice(0, 5).map(p => ({ title: biOk(p && p.title), idea: biOk(p && p.idea) })),
    captions: biArr(d.captions, 4),
    hashtags: (Array.isArray(d.hashtags) ? d.hashtags : []).slice(0, 10).map(h => '#' + clip(String(h).replace(/^#+/, '').replace(/\s+/g, ''), 40)).filter(h => h.length > 1),
    voiceDo: biArr(d.voiceDo, 4), voiceDont: biArr(d.voiceDont, 4),
    wordmark: biOk(d.wordmark),
    keywords: (Array.isArray(d.keywords) ? d.keywords : []).slice(0, 4).map(k => clip(k, 30))
  };
}
function cleanPart(part, r, dir) {
  const merged = cleanDirection(Object.assign({}, dir, r), null);
  const out = {};
  for (const k of REFINE_PARTS[part]) out[k] = merged[k];
  return out;
}
function cleanPackage(p) {
  p = p || {};
  const items = (a) => (Array.isArray(a) ? a : []).slice(0, 6).map(x => ({ kind: clip(x && x.kind, 30), title: biOk(x && x.title), use: biOk(x && x.use), prompt: clip(x && x.prompt, 3000) })).filter(x => x.prompt);
  const tr = p.typeRules || {};
  return {
    wordmarks: (Array.isArray(p.wordmarks) ? p.wordmarks : []).slice(0, 4).map(w => ({ name: biOk(w && w.name), how: biOk(w && w.how) })),
    colourRules: biArr(p.colourRules, 6),
    typeRules: { heading: biOk(tr.heading), subheading: biOk(tr.subheading), body: biOk(tr.body) },
    doExamples: biArr(p.doExamples, 4), dontExamples: biArr(p.dontExamples, 4),
    motion: items(p.motion), posters: items(p.posters)
  };
}

/* ---------------- the brand as finally chosen (mix and match), for the package ---------------- */
export function brandText(b) {
  b = b || {};
  const f = FONTS.find(x => x.id === b.fontId) || FONTS[0] || { heading: {}, body: {}, khHeading: {}, khBody: {} };
  const c = cleanColors(b.colors);
  const L = (x) => x ? `${clip(x.en, 600)} / ${clip(x.km, 900)}` : '';
  return `<final_brand>
Name: ${clip(b.title, 80)}
Direction: ${L(b.name)}
Personality: ${L(b.personality)}
Mission: ${L(b.mission)}
Main tagline: ${L(b.tagline)}
Other taglines: ${(b.taglines || []).slice(0, 8).map(L).join(' | ')}
Colours: primary ${c.primary}, secondary ${c.secondary}, accent ${c.accent}, background ${c.background}, text ${c.text}
Fonts: headings ${f.heading.family}, body ${f.body.family}; Khmer headings ${f.khHeading.family}, Khmer body ${f.khBody.family}
Voice do: ${(b.voiceDo || []).map(L).join(' | ')}
Voice don't: ${(b.voiceDont || []).map(L).join(' | ')}
Content pillars: ${(b.pillars || []).map(p => L(p.title)).join(' | ')}
Audience: ${clip(b.audience, 600)}
</final_brand>`;
}
const PACKAGE_ASK = `Finish this student's brand package as JSON:
- wordmarks: 3 text-logo ideas for their name (name of the idea + how to set it: font, weight, case, spacing, colour, one simple mark if any — no clip-art, nothing copied).
- colourRules: 5 short colour usage rules (which colour where, about how much of each, what never to do).
- typeRules: the type hierarchy — heading, subheading and body (font, size feel, case, when to use the Khmer font).
- doExamples / dontExamples: 3 each, concrete examples of on-brand vs off-brand posts.
- motion: exactly 5 ready-to-paste Claude Motion prompts, kinds in this order: intro (a 5–8 second intro reel), quote (a quote reel), testimony (a testimony clip), event (an event promo), text (a kinetic text animation). Each prompt is in English, 80–160 words, bakes in their exact hex colours, fonts, voice and a tagline, gives timing, motion style, aspect ratio 9:16, and leaves [square brackets] for details they fill in (date, place, quote, photo).
- posters: exactly 5 ready-to-paste Claude prompts for graphics, kinds in this order: event (event poster), quote (quote graphic), carousel (a 5-slide Instagram carousel), announcement, thumbnail (YouTube thumbnail 1280x720). Same rules: English, exact colours and fonts, size, layout, [brackets] to fill in, and "use Khmer font X for any Khmer text".
- Each motion/poster item: kind, a short title and a one-line "use" (when to use it), both in English and Khmer; the prompt itself in English.`;

/* ---------------- run a job ----------------
   call(system, userText, schema, maxTokens) → parsed JSON (the real one talks to Claude).
   progress(partial) lets the page see directions as they arrive. */
export async function runJob(kind, data, opts, call, progress) {
  const sys = systemPrompt(), prof = profileText(data);
  if (kind === 'heart') {
    const r = await call(sys, `${prof}\n\nWrite this student's "heart check": a short story that reflects their answers back to them so they feel seen — "You are…". Second person, warm, specific, 90–140 words, no flattery, no clichés. A 3–6 word title. Give it in English (simple sentences) and Khmer.`, HEART_SCHEMA, 6000);
    return { title: biOk(r.title), en: clip(r.en, 2500), km: clip(r.km, 2500) };
  }
  if (kind === 'directions') {
    const ls = lanes(data), done = [];
    const settled = await Promise.allSettled(ls.map(async (l, i) => {
      const r = await call(sys, `${prof}\n\n${laneText(l, ls.filter(x => x !== l).map(x => x.title))}\n\n${DIR_ASK}`, DIRECTION_SCHEMA, 16000);
      done[i] = cleanDirection(r, l);
      if (progress) await progress(done.filter(Boolean));
      return done[i];
    }));
    const dirs = settled.map(s => s.status === 'fulfilled' ? s.value : null).filter(Boolean);
    if (!dirs.length) throw new Error((settled[0] && settled[0].reason && settled[0].reason.message) || 'no directions');
    return { dirs, failed: settled.length - dirs.length };
  }
  if (kind === 'more') {
    const base = (data.dirs || [])[opts.dir];
    if (!base) throw new Error('bad direction');
    const baseText = `<direction_they_like>\n${JSON.stringify({ name: base.name, personality: base.personality, paletteId: base.paletteId, colors: base.colors, fontId: base.fontId, taglines: (base.taglines || []).slice(0, 3) })}\n</direction_they_like>`;
    const vs = [
      { id: 'more', title: 'Close cousin — new colours', brief: 'Keep its personality and type feel; try a different but related palette and fresh taglines.', pal: [base.mood], font: [] },
      { id: 'more', title: 'Close cousin — new type', brief: 'Keep its colours close; try a different font pairing, voice and taglines.', pal: [base.mood], font: [] }
    ];
    const settled = await Promise.allSettled(vs.map(v => call(sys, `${prof}\n\n${baseText}\n\nThe student said "show me more like this". Variation: ${v.title} — ${v.brief}\n\n${DIR_ASK}`, DIRECTION_SCHEMA, 16000)
      .then(r => cleanDirection(Object.assign(r, { lane: 'more' }), Object.assign({}, v, { pal: [base.mood], font: [] })))));
    const dirs = settled.map(s => s.status === 'fulfilled' ? s.value : null).filter(Boolean);
    if (!dirs.length) throw new Error((settled[0].reason && settled[0].reason.message) || 'no variations');
    dirs.forEach(d => { d.from = opts.dir; });
    return { dirs };
  }
  if (kind === 'refine') {
    const dir = (data.dirs || [])[opts.dir];
    if (!dir || !REFINE_PARTS[opts.part] || !REFINE_HOW[opts.how]) throw new Error('bad refine');
    const cur = {};
    for (const k of REFINE_PARTS[opts.part]) cur[k] = dir[k];
    if (opts.part === 'palette' && opts.colors) cur.colors = cleanColors(opts.colors, dir.colors);
    const r = await call(sys, `${prof}\n\n<direction>\nName: ${dir.name.en}. Personality: ${dir.personality.en}\n</direction>\n\n<part_to_change name="${opts.part}">\n${JSON.stringify(cur)}\n</part_to_change>\n\nThe student asked to make the ${opts.part} ${REFINE_HOW[opts.how]}. Keep what already works and stays true to them; change only this part. Answer with the new ${opts.part} as JSON (every text field in English and Khmer${opts.part === 'words' ? '; 8 taglines, 3 captions, 8 hashtags' : ''}).`, refineSchema(opts.part), 10000);
    return { part: opts.part, value: cleanPart(opts.part, r, dir) };
  }
  if (kind === 'package') {
    const r = await call(sys, `${prof}\n\n${brandText(opts.brand)}\n\n${PACKAGE_ASK}`, PACKAGE_SCHEMA, 16000);
    return cleanPackage(r);
  }
  throw new Error('unknown job');
}

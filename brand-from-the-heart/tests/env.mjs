/* Test set-up: an in-memory Blobs store, a stand-in for Claude that answers every
   schema with plausible data from the app's own libraries, and a local server that
   serves public/ plus the real functions. No network, no API key. */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function memStore() {
  const m = new Map();
  return {
    _m: m,
    async get(k) { return m.has(k) ? JSON.parse(m.get(k)) : null; },
    async setJSON(k, v) { m.set(k, JSON.stringify(v)); },
    async delete(k) { m.delete(k); },
    async list({ prefix }) { return { blobs: [...m.keys()].filter(k => k.startsWith(prefix || '')).map(key => ({ key })) }; }
  };
}

export function checker() {
  let pass = 0, fail = 0;
  const ok = function (name, cond, extra) {
    if (cond) { pass++; console.log('ok   ' + name); }
    else { fail++; console.log('FAIL ' + name + (extra !== undefined ? '  → ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)) : '')); }
  };
  ok.done = function () { console.log('\n' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0); };
  return ok;
}

/* ---------- a stand-in for Claude ---------- */
let n = 0;
export function fakeClaude(opts) {
  opts = opts || {};
  const calls = [];
  const W = globalThis;
  const fn = async (system, userIn, schema, maxTokens, copts) => {
    const user = typeof userIn === 'string' ? userIn : JSON.stringify(userIn);
    calls.push({ system, user, userIn, schema, fast: !!(copts && copts.fast) });
    if (opts.delay) await new Promise(r => setTimeout(r, opts.delay));
    if (opts.fail) throw Object.assign(new Error('boom'), { status: 500 });
    const P = W.BFH_PALETTES, F = W.BFH_FONTS;
    const bi = (s) => ({ en: s, km: 'ខ្មែរ ' + s });
    const props = schema.properties || {};
    n++;
    if (props.days) return { days: Array.from({ length: 30 }, (_, i) => ({ day: i + 1, pillar: 'Pillar ' + (i % 5 + 1), format: i % 2 ? 'reel' : 'carousel', idea: bi('Idea for day ' + (i + 1)), caption: bi('Caption for day ' + (i + 1)) })) };
    if (props.score) return { score: 72, verdict: bi('Nearly on-brand.'), good: [bi('Warm colours'), bi('Clear words')], fix: [bi('Use your background colour'), bi('Bigger title')], colours: bi('Close'), type: bi('Good'), words: bi('Kind') };
    if (props.text && Object.keys(props).length === 1) { const m = /<dictated[^>]*>\n([\s\S]*)\n<\/dictated>/.exec(user); return { text: (m ? m[1] : '').trim().replace(/\s+/g, ' ') + '។' }; }
    if (props.title && props.en && props.km && !props.name) return { title: bi('A bridge of hope'), en: 'You are someone who listens. Test heart story.', km: 'អ្នកជាមនុស្សដែលស្ដាប់។' };
    if (props.motion) {
      const item = (k, i) => ({ kind: k, title: bi(k + ' ' + i), use: bi('When to use ' + k), prompt: `Make a ${k} in #C8553D and Playfair Display. [date]` });
      return { wordmarks: [1, 2, 3].map(i => ({ name: bi('Mark ' + i), how: bi('Set it in caps') })), colourRules: [1, 2, 3, 4, 5].map(i => bi('Rule ' + i)),
        typeRules: { heading: bi('Big'), subheading: bi('Medium'), body: bi('Small') }, doExamples: [1, 2, 3].map(i => bi('Do ' + i)), dontExamples: [1, 2, 3].map(i => bi('Dont ' + i)),
        motion: ['intro', 'quote', 'testimony', 'event', 'text'].map(item), posters: ['event', 'quote', 'carousel', 'announcement', 'thumbnail'].map(item) };
    }
    const moodM = /Start from palettes with mood: ([a-z, ]+)\./.exec(user);
    const mood = moodM ? moodM[1].split(', ')[0] : 'warm';
    const pal = P.find(p => p.mood === mood) || P[n % P.length];
    const font = F[n % F.length];
    const out = {};
    const all = {
      name: bi('Direction ' + n), personality: bi('Warm and brave, like a big sister.'), archetype: 'warm', mood: pal.mood,
      paletteId: pal.id, colors: Object.assign({}, pal.colors), paletteWhy: bi('It feels like sunrise.'),
      fontId: font.id, fontWhy: bi('Friendly and clear.'),
      taglines: [1, 2, 3, 4, 5, 6, 7, 8].map(i => bi('Hope speaks ' + n + '.' + i)), bio: bi('Sharing hope in Battambang.'), mission: bi('Help youth find hope.'), whyIPost: bi('I post because hope is real.'),
      pillars: [1, 2, 3, 4, 5].map(i => ({ title: bi('Pillar ' + i), idea: bi('Idea ' + i) })), captions: [1, 2, 3].map(i => bi('Caption ' + i)),
      hashtags: ['#hope', 'faith', '#សង្ឃឹម'], voiceDo: [1, 2, 3].map(i => bi('Do ' + i)), voiceDont: [1, 2, 3].map(i => bi('Dont ' + i)),
      wordmark: bi('Name in lowercase'), keywords: ['warm', 'brave', 'kind']
    };
    for (const k of Object.keys(props)) out[k] = all[k];
    if (opts.badColors && out.colors) out.colors = { primary: 'red', secondary: '#123', accent: '#00FF00', background: '#FFFFFF', text: '#FEFEFE' };
    return out;
  };
  fn.calls = calls;
  return fn;
}

/* ---------- a local server: public/ + the real functions ---------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
export async function startServer(port, claudeOpts) {
  globalThis.__bfhStore = globalThis.__bfhStore || memStore();
  process.env.BFH_TEACHER_PASSWORD = process.env.BFH_TEACHER_PASSWORD || 'teach';
  await import('../netlify/functions/lib/data.js');
  globalThis.__bfhClaude = globalThis.__bfhClaude || fakeClaude(claudeOpts);
  const api = (await import('../netlify/functions/api.js')).default;
  const bg = await import('../netlify/functions/generate-background.js');
  const srv = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/.netlify/functions/api') {
      let body = ''; for await (const c of req) body += c;
      const r = await api(new Request('http://x/', { method: req.method, body: req.method === 'POST' ? body : undefined }));
      res.writeHead(r.status, { 'Content-Type': 'application/json' }); res.end(await r.text()); return;
    }
    if (u.pathname === '/.netlify/functions/generate-background') {
      let body = ''; for await (const c of req) body += c;
      res.writeHead(202); res.end('ok');
      bg.work(JSON.parse(body || '{}')).catch(e => console.error(e));
      return;
    }
    let f = path.join(ROOT, 'public', decodeURIComponent(u.pathname));
    if (u.pathname.endsWith('/')) f = path.join(f, 'index.html');
    if (!f.startsWith(path.join(ROOT, 'public')) || !fs.existsSync(f)) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
  });
  await new Promise(r => srv.listen(port || 0, r));
  return { srv, base: 'http://localhost:' + srv.address().port };
}

export function findChromium() {
  for (const p of [process.env.BFH_CHROMIUM, '/opt/pw-browsers/chromium', '/usr/bin/chromium', '/usr/bin/chromium-browser']) { try { if (p && fs.existsSync(p) && fs.statSync(p).isFile()) return p; } catch (e) {} }
  return undefined;
}

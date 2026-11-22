/* Test set-up: an in-memory Blobs store, a stand-in for Claude, and a local server that serves
   dist/ plus the real functions. No network, no API key. */
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

/* A stand-in coach: a question for chats, plausible fields for any distill schema. */
export function fakeClaude(opts) {
  opts = opts || {};
  const calls = [];
  const fn = async (system, messages, schema, copts) => {
    calls.push({ system, messages, schema });
    if (opts.fail) throw Object.assign(new Error('boom'), { status: 500 });
    if (!schema) {
      const reply = `What feels most important to you about that? (${calls.length})`;
      if (copts && copts.onText) for (let i = 8; i < reply.length; i += 8) { copts.onText(reply.slice(0, i)); if (opts.delay) await new Promise(r => setTimeout(r, opts.delay)); }
      return reply;
    }
    const out = {};
    for (const [k, v] of Object.entries(schema.properties)) out[k] = v.enum ? v.enum[0] : `Test ${k}`;
    return out;
  };
  fn.calls = calls;
  return fn;
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };
export async function serve(port) {
  const api = (await import('../netlify/functions/api.js')).default;
  const bg = await import('../netlify/functions/coach-background.js');
  const srv = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/app.webmanifest') {
      const { manifestFor } = await import('../netlify/functions/manifest.js');
      res.writeHead(200, { 'Content-Type': 'application/manifest+json' }); res.end(JSON.stringify(manifestFor(url.searchParams))); return;
    }
    if (url.pathname.startsWith('/.netlify/functions/')) {
      const chunks = []; for await (const c of req) chunks.push(c);
      const body = Buffer.concat(chunks).toString();
      if (url.pathname.endsWith('/coach-background')) { res.writeHead(202); res.end(); bg.work(JSON.parse(body || '{}')); return; }
      const r = await api(new Request('http://x' + url.pathname, { method: req.method, body: req.method === 'POST' ? body : undefined }));
      res.writeHead(r.status, { 'Content-Type': 'application/json' }); res.end(await r.text()); return;
    }
    let f = path.join(ROOT, 'dist', decodeURIComponent(url.pathname));
    if (!f.startsWith(path.join(ROOT, 'dist')) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(ROOT, 'dist', 'index.html');
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => srv.listen(port, r));
  return srv;
}

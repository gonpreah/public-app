/* Shared test set-up: an in-memory Blobs store and a stand-in for Google's
   tokeninfo, so the real api.js runs with no network.
   A Google "token" in tests is "test:<sub>:<name>" — only this stand-in reads it. */
export function memStore() {
  const m = new Map();
  return {
    _m: m,
    async get(k) { return m.has(k) ? JSON.parse(m.get(k)) : null; },
    async setJSON(k, v) { m.set(k, JSON.stringify(v)); },
    async delete(k) { m.delete(k); }
  };
}
export const CLIENT = 'test-client.apps.googleusercontent.com';
export function fakeGoogle() {
  process.env.GPA_GOOGLE_CLIENT_ID = CLIENT;
  globalThis.fetch = async function (url) {
    const u = String(url);
    if (u.startsWith('https://oauth2.googleapis.com/tokeninfo?')) {
      const tok = decodeURIComponent(u.split('=').slice(1).join('='));
      const m = /^test:([a-z0-9]+):(.*)$/.exec(tok);
      if (!m) return { ok: false, json: async () => ({}) };
      return { ok: true, json: async () => ({ aud: CLIENT, sub: m[1], email: m[1] + '@example.com', verified_email: true, expires_in: 3000, name: m[2] }) };
    }
    if (u.startsWith('https://openidconnect.googleapis.com/')) return { ok: false, json: async () => ({}) };
    throw new Error('no network in tests: ' + u);
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

/* ---------- the browser side ---------- */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function findChromium() {
  if (process.env.GPA_CHROMIUM) return process.env.GPA_CHROMIUM;
  for (const p of ['/opt/pw-browsers/chromium', '/usr/bin/chromium', '/usr/bin/chromium-browser']) { try { if (fs.existsSync(p)) return p; } catch (e) {} }
  return undefined;
}
export const CHROMIUM = findChromium();
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2' };
/* public/ plus the real api.js on an in-memory store, with Google stood in for. */
export async function startServer(port) {
  globalThis.__gpaStore = globalThis.__gpaStore || memStore();
  fakeGoogle();
  const api = (await import('../netlify/functions/api.js')).default;
  const srv = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/.netlify/functions/api') {
      let body = ''; for await (const c of req) body += c;
      const r = await api(new Request('http://x/', { method: req.method, body: req.method === 'POST' ? body : undefined }));
      res.writeHead(r.status, { 'Content-Type': 'application/json' }); res.end(await r.text()); return;
    }
    let f = path.join(ROOT, 'public', decodeURIComponent(u.pathname));
    if (u.pathname.endsWith('/')) f = path.join(f, 'index.html');
    if (!f.startsWith(path.join(ROOT, 'public')) || !fs.existsSync(f)) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
  });
  await new Promise(r => srv.listen(port || 0, r));
  return { srv, base: 'http://localhost:' + srv.address().port };
}

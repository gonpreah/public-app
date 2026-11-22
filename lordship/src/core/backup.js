/* "Save my work": everything this teaching keeps on the phone, as one object — to a file or to a code. */
import { api } from './api.js';

const PREFIX = 'gp.lordship.';
export function collect() {
  const out = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX) && k !== PREFIX + 'class' && k !== PREFIX + 'anon') out[k.slice(3)] = JSON.parse(localStorage.getItem(k));
    }
  } catch (e) { /* storage blocked */ }
  return out;
}
export function restore(data) {
  let n = 0;
  for (const [k, v] of Object.entries(data || {})) {
    if (!/^lordship\.[a-zA-Z0-9.\-_]+$/.test(k) || k === 'lordship.class' || k === 'lordship.anon') continue;
    try { localStorage.setItem('gp.' + k, JSON.stringify(v)); n++; } catch (e) { /* */ }
  }
  window.dispatchEvent(new CustomEvent('gp-store', { detail: null }));
  return n;
}
export async function saveToCloud(code) { return (await api('backupSave', { code, data: collect() })).code; }
export async function loadFromCloud(code) { return restore((await api('backupLoad', { code })).data); }
export function downloadFile() {
  const blob = new Blob([JSON.stringify({ app: 'lordship', at: new Date().toISOString(), data: collect() }, null, 1)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'lordship-my-work.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export async function loadFile(file) {
  const j = JSON.parse(await file.text());
  return restore(j && j.data ? j.data : j);
}

/* Everything a student writes stays on their phone (localStorage), under one prefix per teaching,
   so a future hub can hold several teachings side by side. */
import { useEffect, useState, useCallback } from 'react';

const PREFIX = 'gp.';
export function read(key, dflt) {
  try { const v = localStorage.getItem(PREFIX + key); return v == null ? dflt : JSON.parse(v); } catch (e) { return dflt; }
}
export function write(key, v) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ }
  window.dispatchEvent(new CustomEvent('gp-store', { detail: key }));
}

/* useLocal('lordship.wheel', {}) → [value, set] — set takes a value or an updater. */
export function useLocal(key, dflt) {
  const [v, setV] = useState(() => read(key, dflt));
  useEffect(() => {
    const on = (e) => { if (!e.detail || e.detail === key) setV(read(key, dflt)); };
    window.addEventListener('gp-store', on);
    return () => window.removeEventListener('gp-store', on);
  }, [key]);   // eslint-disable-line react-hooks/exhaustive-deps
  const set = useCallback((nv) => {
    const next = typeof nv === 'function' ? nv(read(key, dflt)) : nv;
    write(key, next);
  }, [key]);   // eslint-disable-line react-hooks/exhaustive-deps
  return [v, set];
}

export const todayStr = (d) => { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
export const addDays = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return todayStr(d); };
export const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
export const uid = () => Math.random().toString(36).slice(2, 10);

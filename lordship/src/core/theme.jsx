/* Light, dark or follow the phone. Kept on the phone (gp.theme); applied as <html data-theme>. */
import { useEffect, useState } from 'react';

const KEY = 'gp.theme';
export function getTheme() { try { return localStorage.getItem(KEY) || 'auto'; } catch (e) { return 'auto'; } }
export function applyTheme(t) {
  const el = document.documentElement;
  if (t === 'light' || t === 'dark') el.setAttribute('data-theme', t); else el.removeAttribute('data-theme');
  const dark = t === 'dark' || (t !== 'light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', dark ? '#17150f' : '#faf6f0'));
}
export function useTheme() {
  const [t, setT] = useState(getTheme);
  useEffect(() => { applyTheme(t); try { localStorage.setItem(KEY, t); } catch (e) { /* */ } }, [t]);
  return [t, setT];
}
const NEXT = { auto: 'light', light: 'dark', dark: 'auto' };
const ICON = { auto: '◐', light: '☀︎', dark: '☾' };
const LABEL = { auto: 'Theme: follow my phone', light: 'Theme: light', dark: 'Theme: dark' };
export function ThemeToggle() {
  const [t, setT] = useTheme();
  return <button className="themebtn" onClick={() => setT(NEXT[t])} aria-label={LABEL[t] + ' (tap to change)'} title={LABEL[t]}><span aria-hidden="true">{ICON[t]}</span><small>{t}</small></button>;
}

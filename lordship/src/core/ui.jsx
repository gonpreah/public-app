/* Shared pieces in Uriah's brand (from Brand From the Heart): the spark, cards, pills, a toast. */
import { useEffect, useState } from 'react';

export function Spark({ size = 22, color = 'currentColor' }) {
  return (
    <svg className="spark" width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <g stroke={color} strokeWidth="11" strokeLinecap="round">
        <line x1="50" y1="8" x2="50" y2="92" /><line x1="8" y1="50" x2="92" y2="50" />
        <line x1="20.3" y1="20.3" x2="79.7" y2="79.7" /><line x1="79.7" y1="20.3" x2="20.3" y2="79.7" />
      </g>
    </svg>
  );
}

export function Back({ to, label = 'Back' }) {
  return <a className="back" href={'#/' + to}>‹ {label}</a>;
}

export function Tile({ href, emoji, title, sub }) {
  return (
    <a className="tile" href={href}>
      <span className="em" aria-hidden="true">{emoji}</span>
      <span><b>{title}</b>{sub && <small>{sub}</small>}</span>
    </a>
  );
}

let toastFn = null;
export function toast(msg) { if (toastFn) toastFn(msg); }
export function Toast() {
  const [m, setM] = useState('');
  useEffect(() => { toastFn = (x) => { setM(x); clearTimeout(toastFn.t); toastFn.t = setTimeout(() => setM(''), 2600); }; return () => { toastFn = null; }; }, []);
  return <div className={'toast' + (m ? ' on' : '')} role="status">{m}</div>;
}

export async function shareText(text, title) {
  try {
    if (navigator.share) { await navigator.share({ title: title || 'Lordship', text }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(text); toast('Copied'); } catch (e) { toast('Couldn’t copy — select and copy it yourself'); }
}
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('Copied'); } catch (e) { toast('Couldn’t copy'); }
}

/* A small burst of sparks from a button: for "declared", "responded", a habit ticked. */
export function burst(el, n = 14) {
  try {
    if (!el || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    const r = el.getBoundingClientRect();
    const colors = ['#ffb323', '#1f44ff', '#e0503d', '#7b4bd6', '#2F7D4F'];
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i');
      s.className = 'spark-p';
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.4, d = 50 + Math.random() * 60;
      s.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;background:${colors[i % colors.length]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px`;
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 900);
    }
  } catch (e) { /* decoration only */ }
}

import { createRoot } from 'react-dom/client';
import './core/theme.css';
import { applyTheme, getTheme } from './core/theme.jsx';
import App from './App.jsx';

applyTheme(getTheme());
/* Catch the browser's install prompt early (it can fire before React draws) so "Install" is one tap. */
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); window.__installPrompt = e; window.dispatchEvent(new Event('gp-install')); });
if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => applyTheme(getTheme()));
createRoot(document.getElementById('root')).render(<App />);
if ('serviceWorker' in navigator && import.meta.env.PROD && !navigator.webdriver) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

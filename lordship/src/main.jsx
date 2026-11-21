import { createRoot } from 'react-dom/client';
import './core/theme.css';
import { applyTheme, getTheme } from './core/theme.jsx';
import App from './App.jsx';

applyTheme(getTheme());
if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => applyTheme(getTheme()));
createRoot(document.getElementById('root')).render(<App />);
if ('serviceWorker' in navigator && import.meta.env.PROD && !navigator.webdriver) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

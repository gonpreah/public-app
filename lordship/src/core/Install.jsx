/* "Add to Home Screen", as easy as each phone allows:
   - Android / Chrome / Edge: one tap (the browser's own install prompt, caught early in main.jsx).
   - iPhone / iPad: Apple allows no button, so a sheet shows the three taps with an arrow to Share.
   - Instagram / Facebook / Messenger / LINE in-app browsers can't install: copy the link, open it in Safari or Chrome.
   Hidden once the app is installed (opened from the Home Screen), or for a week after "Later". */
import { useEffect, useState } from 'react';
import { toast } from './ui.jsx';

export const standalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const UA = navigator.userAgent || '';
const isIOS = /iPhone|iPad|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const inApp = /FBAN|FBAV|FB_IAB|Instagram|Line\/|Messenger|MicroMessenger|TikTok|musical_ly/i.test(UA);
const iosChrome = /CriOS|FxiOS|EdgiOS/.test(UA);
const KEY = 'gp.installLater';

function laterOk() { try { return Date.now() - (+localStorage.getItem(KEY) || 0) > 7 * 86400000; } catch (e) { return true; } }

const ShareIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style={{ verticalAlign: '-5px' }}><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" /></svg>
);
const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style={{ verticalAlign: '-5px' }}><rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
);

export default function Install({ where = 'class' }) {
  const [prompt, setPrompt] = useState(() => window.__installPrompt || null);
  const [sheet, setSheet] = useState(false);
  const [show, setShow] = useState(() => !standalone() && laterOk());
  const [done, setDone] = useState(false);
  useEffect(() => {
    const on = () => setPrompt(window.__installPrompt || null);
    const inst = () => { setDone(true); setShow(false); };
    window.addEventListener('gp-install', on);
    window.addEventListener('appinstalled', inst);
    return () => { window.removeEventListener('gp-install', on); window.removeEventListener('appinstalled', inst); };
  }, []);
  if (!show || done) return null;

  async function tap() {
    if (prompt) {
      prompt.prompt();
      try { const r = await prompt.userChoice; if (r && r.outcome === 'accepted') { setDone(true); toast('Installed — find Lordship on your Home Screen'); } } catch (e) { /* */ }
      window.__installPrompt = null; setPrompt(null);
      return;
    }
    setSheet(true);
  }
  const later = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) { /* */ } setShow(false); };
  const copy = async () => { try { await navigator.clipboard.writeText(location.href); toast('Link copied'); } catch (e) { toast(location.href); } };

  return (
    <>
      <div className="install card">
        <img src="/icon-192.png" alt="" width="52" height="52" />
        <div className="install-t"><b>Put Lordship on your Home Screen</b><small>{where === 'church' ? 'Come back to it any time, like an app.' : 'Opens like an app, straight into the class — and works offline.'}</small></div>
        <button className="btn primary small" onClick={tap}>{prompt ? 'Install' : 'Add'}</button>
        <button className="install-x" onClick={later} aria-label="Later">✕</button>
      </div>
      {sheet && (
        <div className="sheet-back" onClick={() => setSheet(false)}>
          <div className="sheet" role="dialog" aria-label="Add to Home Screen" onClick={e => e.stopPropagation()}>
            <button className="install-x" onClick={() => setSheet(false)} aria-label="Close">✕</button>
            <img src="/icon-192.png" alt="" width="64" height="64" className="sheet-icon" />
            <h3>Add to Home Screen</h3>
            {inApp ? <>
              <p>This browser (inside Instagram, Facebook or another app) can’t add apps.</p>
              <ol className="steps">
                <li>Tap <b>Copy link</b> below.</li>
                <li>Open <b>{isIOS ? 'Safari' : 'Chrome'}</b> and paste it.</li>
                <li>Tap <b>Add</b> again there.</li>
              </ol>
              <button className="btn primary big" onClick={copy}>Copy link</button>
              <p className="tiny muted">Or tap ••• / ⋮ at the top and choose “Open in {isIOS ? 'Safari' : 'browser'}”.</p>
            </> : isIOS ? <>
              <ol className="steps">
                <li>Tap <b>Share</b> <ShareIcon /> {iosChrome ? 'in the address bar' : 'at the bottom of Safari (on newer iPhones: tap ••• first, then Share)'}.</li>
                <li>Scroll down and tap <b>Add to Home Screen</b> <PlusIcon />.</li>
                <li>Tap <b>Add</b>. Done — open Lordship from your Home Screen.</li>
              </ol>
              <p className="tiny muted">Do this first, then start your answers in the app — an iPhone keeps the Home Screen app’s answers separate from Safari’s. Already started? Use “Save my work” to move them.</p>
              {!iosChrome && <div className="point-down" aria-hidden="true">⬇</div>}
            </> : <>
              <ol className="steps">
                <li>Open the browser menu <b>⋮</b> (top right).</li>
                <li>Tap <b>Install app</b> or <b>Add to Home screen</b>.</li>
                <li>Tap <b>Install</b>.</li>
              </ol>
            </>}
          </div>
        </div>
      )}
    </>
  );
}

/* A QR code for a link (qrcode-generator, MIT), drawn as SVG — for the projector on Sunday or day one. */
import qrcode from 'qrcode-generator';

/* A big PNG of the QR (with the link under it), for slides. */
export function downloadQrPng(text, label, file) {
  const q = qrcode(0, 'M'); q.addData(text); q.make();
  const n = q.getModuleCount(), cell = 24, pad = 4 * cell, w = n * cell + pad * 2, h = w + (label ? 110 : 0);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.fillStyle = '#17150f';
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) x.fillRect(pad + k * cell, pad + r * cell, cell, cell);
  if (label) { x.font = 'bold 44px Arial, sans-serif'; x.textAlign = 'center'; x.fillText(label, w / 2, w + 40); }
  c.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = file || 'qr.png'; document.body.appendChild(a); a.click(); a.remove(); }, 'image/png');
}

export default function Qr({ text, size = 240 }) {
  const q = qrcode(0, 'M');
  q.addData(text); q.make();
  const n = q.getModuleCount(), cells = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) cells.push(`M${c + 2},${r + 2}h1v1h-1z`);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${n + 4} ${n + 4}`} role="img" aria-label={'QR code for ' + text} style={{ background: '#fff', borderRadius: 8 }}>
      <path d={cells.join('')} fill="#17150f" />
    </svg>
  );
}

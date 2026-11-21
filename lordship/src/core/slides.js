/* Slides: meta from the server; files come down in parts (each under the function size limit)
   and are joined into a Blob on the phone. */
import { api } from './api.js';

const blobs = {};
export async function getSlides(code) { return (await api('slides', { code })).slides; }

export async function getFile(code, day, kind, meta, onProgress) {
  const key = `${day}:${kind}:${meta.v}`;
  if (blobs[key]) return blobs[key];
  const chunks = [];
  for (let i = 0; i < meta.parts; i++) {
    const { d } = await api('slideGet', { code, day, kind, i });
    const bin = atob(d);
    const u = new Uint8Array(bin.length);
    for (let j = 0; j < bin.length; j++) u[j] = bin.charCodeAt(j);
    chunks.push(u);
    onProgress && onProgress((i + 1) / meta.parts);
  }
  blobs[key] = new Blob(chunks, { type: meta.type || (kind === 'pdf' ? 'application/pdf' : 'application/octet-stream') });
  return blobs[key];
}

export function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name || 'slides';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

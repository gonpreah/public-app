/* In-app slide viewer: pdf.js draws one page at a time (phones can't all show PDFs inline). Loaded only when needed. */
import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export default function PdfView({ blob }) {
  const [doc, setDoc] = useState(null);
  const [page, setPage] = useState(1);
  const [err, setErr] = useState('');
  const canvas = useRef(null);
  useEffect(() => {
    let dead = false, task;
    blob.arrayBuffer().then(buf => { task = pdfjs.getDocument({ data: buf }); return task.promise; })
      .then(d => { if (!dead) { setDoc(d); setPage(1); } })
      .catch(() => { if (!dead) setErr('Couldn’t open these slides. Try downloading them instead.'); });
    return () => { dead = true; if (task) task.destroy(); };
  }, [blob]);
  useEffect(() => {
    if (!doc || !canvas.current) return;
    let render;
    doc.getPage(page).then(p => {
      const c = canvas.current; if (!c) return;
      const w = Math.min(c.parentElement.clientWidth || 600, 1200);
      const v1 = p.getViewport({ scale: 1 });
      const scale = (w / v1.width) * Math.min(window.devicePixelRatio || 1, 2);
      const vp = p.getViewport({ scale });
      c.width = vp.width; c.height = vp.height;
      render = p.render({ canvasContext: c.getContext('2d'), viewport: vp, canvas: c });
      return render.promise;
    }).catch(() => {});
    return () => { if (render) render.cancel(); };
  }, [doc, page]);
  if (err) return <p className="err">{err}</p>;
  if (!doc) return <p className="muted">Opening slides…</p>;
  return (
    <div className="pdfview">
      <canvas ref={canvas} onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPage(p => e.clientX - r.left < r.width / 3 ? Math.max(1, p - 1) : Math.min(doc.numPages, p + 1)); }} />
      <div className="pdfnav">
        <button className="btn soft small" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Prev</button>
        <span className="muted">{page} / {doc.numPages}</span>
        <button className="btn soft small" disabled={page >= doc.numPages} onClick={() => setPage(page + 1)}>Next ›</button>
      </div>
    </div>
  );
}

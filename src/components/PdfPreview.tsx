'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

// Keep this in sync with the installed pdfjs-dist version (see package.json).
const PDFJS_VERSION = '6.4.299';

type Status = 'loading' | 'ready' | 'error';

/**
 * Renders a PDF (from a blob:/http URL) to <canvas> pages with pdf.js.
 * Unlike an <iframe>, this works on Android Chrome, which cannot display a
 * PDF inline and otherwise falls back to a "download / Open" card.
 */
export default function PdfPreview({ url, maxPages = 8 }: { url: string; maxPages?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    setStatus('loading');
    setTotalPages(0);
    while (container.firstChild) container.removeChild(container.firstChild);

    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
        }

        // Fetch as ArrayBuffer: more reliable than handing a blob: URL to pdf.js.
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Failed to load PDF (${resp.status})`);
        const data = await resp.arrayBuffer();

        const doc = await pdfjs.getDocument({ data }).promise;
        if (cancelled) return;

        const cssWidth = container.clientWidth || 320;
        const dpr = window.devicePixelRatio || 1;
        const renderCount = Math.min(doc.numPages, maxPages);

        for (let i = 1; i <= renderCount; i++) {
          const page = await doc.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const scale = (cssWidth / base.width) * dpr;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          canvas.style.display = 'block';
          canvas.style.borderRadius = '8px';
          canvas.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
          canvas.style.background = '#fff';

          await page.render({ canvas, viewport }).promise;
          if (cancelled) { canvas.remove(); return; }
          container.appendChild(canvas);
          page.cleanup();
        }

        setTotalPages(doc.numPages);
        setStatus('ready');
      } catch (err) {
        console.error('PDF preview failed to render:', err);
        if (!cancelled) setStatus('error');
      }
    })();

    return () => { cancelled = true; };
  }, [url, maxPages]);

  return (
    <div>
      <div ref={containerRef} className="space-y-2" />

      {status === 'loading' && (
        <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Loading preview…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-xs text-gray-500">Couldn’t preview this file here.</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-purple-700 hover:underline"
          >
            Open PDF
          </a>
        </div>
      )}

      {status === 'ready' && totalPages > maxPages && (
        <p className="text-[11px] text-gray-400 text-center pt-2">
          Showing first {maxPages} of {totalPages} pages.
        </p>
      )}
    </div>
  );
}

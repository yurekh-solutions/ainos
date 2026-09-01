'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

// Public preview page: renders the embed widget exactly as it would appear
// on the connected website (data-site makes the API serve that site's blogs).
// Client component + post-mount script injection so React hydration never
// wipes the widget's injected DOM.
export default function EmbedPreviewPage() {
  return (
    <Suspense
      fallback={
        <main style={{ minHeight: '100vh', background: '#f8f7fc' }}>
          <p style={{ textAlign: 'center', color: '#6b7280', paddingTop: 48 }}>Loading preview...</p>
        </main>
      }
    >
      <PreviewInner />
    </Suspense>
  );
}

function PreviewInner() {
  const site = useSearchParams().get('site') || '';

  useEffect(() => {
    // Inject embed.js AFTER hydration so its DOM survives
    const s = document.createElement('script');
    s.src = '/embed.js';
    document.body.appendChild(s);
    return () => { s.remove(); };
  }, []);

  return (
    <main style={{ minHeight: '100vh', background: '#f8f7fc', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px 8px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1f2937', margin: 0 }}>
          This is how your blogs will look on your website
        </h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 8 }}>
          Live preview of the AINOS blog widget{site ? ` for ${site}` : ''}. Colors auto-match your website theme when embedded.
        </p>
      </header>
      <div id="ainos-blog" data-limit="9" data-style="grid" data-site={site} style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }} />
    </main>
  );
}

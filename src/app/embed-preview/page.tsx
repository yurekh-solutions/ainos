import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog Widget Preview — AINOS',
  description: 'See how your blog widget will look on your website.',
};

// Public preview page: renders the embed widget exactly as it would appear
// on the connected website (data-site makes the API serve that site's blogs).
export default async function EmbedPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string }>;
}) {
  const { site } = await searchParams;
  const siteUrl = site || '';

  return (
    <main style={{ minHeight: '100vh', background: '#f8f7fc', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px 8px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1f2937', margin: 0 }}>
          This is how your blogs will look on your website
        </h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 8 }}>
          Live preview of the AINOS blog widget{siteUrl ? ` for ${siteUrl}` : ''}. Colors auto-match your website theme when embedded.
        </p>
      </header>
      <div id="ainos-blog" data-limit="9" data-style="grid" data-site={siteUrl} style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }} />
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script src="/embed.js" />
    </main>
  );
}

// Text escaping for generated XML (RSS feed, sitemap).
// A single raw "&" or "<" inside a title, category or tag makes the whole
// document invalid, and browsers/readers refuse to show anything at all.
export function escapeXml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Feed descriptions must be plain text: strip HTML tags and markdown noise.
export function plainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/[#*_>`]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

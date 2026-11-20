import { escapeXml } from '@/lib/xml';

// Browsers get this readable preview, feed readers get the raw XML.
// XSLT was the old way to do it, but Chrome is removing XSLT support.
export type FeedPreviewItem = {
  title: string;
  url: string;
  pubDate: string;
  description: string;
  categories: string[];
};

const STYLES = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #fbfaff; color: #1f1b2e; line-height: 1.6;
    font-family: "Segoe UI", Poppins, system-ui, -apple-system, sans-serif; }
  .wrap { max-width: 760px; margin: 0 auto; padding: 44px 20px 64px; }
  .brand { display: inline-block; font-weight: 800; letter-spacing: .14em; font-size: 13px;
    color: #4c1d95; text-decoration: none; text-transform: uppercase; }
  .eyebrow { margin: 18px 0 6px; font-size: 11px; letter-spacing: .18em; text-transform: uppercase;
    color: #7c6f9b; font-weight: 700; }
  h1 { margin: 0 0 8px; font-size: 30px; line-height: 1.2; letter-spacing: -.01em; }
  .lede { margin: 0; color: #4a4260; font-size: 15px; }
  .meta { margin: 14px 0 0; font-size: 12.5px; color: #6b6285; }
  .meta span + span:before { content: "\\00b7"; margin: 0 8px; color: #b6add0; }
  .actions { margin: 22px 0 0; display: flex; flex-wrap: wrap; gap: 10px; }
  .btn { display: inline-block; padding: 10px 18px; border-radius: 999px; border: 1px solid #ddd6ee;
    background: #fff; color: #4c1d95; font-size: 13.5px; font-weight: 600; text-decoration: none; }
  .btn.primary { background: #4c1d95; border-color: #4c1d95; color: #fff; }
  .hint { margin: 18px 0 0; padding: 12px 16px; border-radius: 12px; background: #f3efff;
    border: 1px solid #e6dcff; font-size: 12.5px; color: #534a70; }
  .hint code { font-size: 12px; color: #4c1d95; background: #fff; padding: 2px 6px; border-radius: 6px;
    word-break: break-all; }
  .rule { height: 1px; background: #ece6f8; margin: 30px 0 6px; border: 0; }
  article { padding: 20px 0; border-bottom: 1px solid #ece6f8; }
  article h2 { margin: 0 0 4px; font-size: 19px; line-height: 1.35; }
  article h2 a { color: #1f1b2e; text-decoration: none; }
  article h2 a:hover { color: #4c1d95; text-decoration: underline; }
  .date { margin: 0; font-size: 12px; color: #8a80a6; }
  .desc { margin: 8px 0 0; font-size: 14.5px; color: #46405c; }
  .tags { margin: 10px 0 0; }
  .tag { display: inline-block; margin: 0 6px 6px 0; padding: 3px 10px; border-radius: 999px;
    background: #f3efff; border: 1px solid #e6dcff; color: #5b21b6; font-size: 11.5px; font-weight: 600; }
  footer { margin-top: 34px; font-size: 12px; color: #8a80a6; }
  @media (max-width: 520px) { .wrap { padding: 32px 16px 48px; } h1 { font-size: 24px; } }
`;

export function renderFeedPreview(options: {
  siteUrl: string;
  title: string;
  description: string;
  lastBuildDate: string;
  items: FeedPreviewItem[];
}): string {
  const { siteUrl, title, description, lastBuildDate, items } = options;
  const feedUrl = `${siteUrl}/api/blog-rss`;
  const updated = new Date(lastBuildDate).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const rows = items
    .map(
      (item) => `
        <article>
          <h2><a href="${escapeXml(item.url)}">${escapeXml(item.title)}</a></h2>
          <p class="date">${escapeXml(item.pubDate)}</p>
          <p class="desc">${escapeXml(item.description)}</p>
          <p class="tags">${item.categories
            .map((category) => `<span class="tag">${escapeXml(category)}</span>`)
            .join('')}</p>
        </article>`
    )
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, follow" />
    <title>${escapeXml(title)} · feed preview</title>
    <style>${STYLES}</style>
  </head>
  <body>
    <div class="wrap">
      <a class="brand" href="${escapeXml(siteUrl)}">AINOS</a>
      <p class="eyebrow">Blog feed · RSS 2.0</p>
      <h1>${escapeXml(title)}</h1>
      <p class="lede">${escapeXml(description)}</p>
      <p class="meta">
        <span>${items.length} guides</span>
        <span>Updated ${escapeXml(updated)} IST</span>
      </p>
      <div class="actions">
        <a class="btn primary" href="${escapeXml(siteUrl)}/blog">Read the blog</a>
        <a class="btn" href="${escapeXml(feedUrl)}?format=xml">Open raw XML</a>
      </div>
      <p class="hint">
        This is the feed preview for readers and feed readers. Paste
        <code>${escapeXml(feedUrl)}</code> into Feedly, Inoreader or Outlook to get new
        AINOS guides as they publish.
      </p>
      <hr class="rule" />
      ${rows}
      <footer>AINOS · Yurekh Solutions Private Limited</footer>
    </div>
  </body>
</html>`;
}

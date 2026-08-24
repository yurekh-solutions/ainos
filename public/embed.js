/**
 * AINOS Blog Embed Widget
 * Universal blog widget that works on ANY website platform
 * Supports: WordPress, Shopify, React, HTML, Wix, Squarespace, etc.
 * 
 * Usage:
 * <script src="https://ainos.vercel.app/embed.js"></script>
 * <div id="ainos-blog" data-limit="6" data-style="grid"></div>
 */

(function () {
  'use strict';

  // Dynamically detect the API URL based on where embed.js is hosted
  const currentScript = document.currentScript || document.querySelector('script[src*="embed.js"]');
  const scriptSrc = currentScript?.src || '';
  const baseUrl = scriptSrc ? new URL(scriptSrc).origin : 'https://ainos-ywu0.onrender.com';
  const AINOS_API = `${baseUrl}/api/blog-embed`;

  // Basic HTML sanitizer to prevent XSS
  function sanitize(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Markdown to HTML converter (sanitized)
  function renderMarkdown(md) {
    if (!md) return '';
    return md
      .replace(/^### (.*$)/gm, '<h3>' + '$1' + '</h3>')
      .replace(/^## (.*$)/gm, '<h2>' + '$1' + '</h2>')
      .replace(/^# (.*$)/gm, '<h1>' + '$1' + '</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>' + '$1' + '</strong>')
      .replace(/\*(.*?)\*/g, '<em>' + '$1' + '</em>')
      .replace(/^- (.*$)/gm, '<li>' + '$1' + '</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[hul])/gm, '<p>')
      .replace(/(<p>[^<].*)$/gm, '$1</p>');
  }

  // Format date
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Render blog card (no images)
  function renderCard(post, style) {
    const safeTitle = sanitize(post.title);
    const safeExcerpt = sanitize(post.excerpt || '');
    const safeCategory = sanitize(post.category || '');
    const safeUrl = sanitize(post.url || '#');

    const tagsHtml = post.tags && post.tags.length
      ? `<div class="ainos-blog-tags">${post.tags.slice(0, 3).map(t => `<span class="ainos-blog-tag">#${sanitize(t)}</span>`).join('')}</div>`
      : '';

    if (style === 'list') {
      return `
        <article class="ainos-blog-card ainos-blog-card-list">
          <div class="ainos-blog-content">
            ${safeCategory ? `<span class="ainos-blog-category">${safeCategory}</span>` : ''}
            <h3 class="ainos-blog-title"><a href="${safeUrl}">${safeTitle}</a></h3>
            <p class="ainos-blog-excerpt">${safeExcerpt}</p>
            ${tagsHtml}
            <div class="ainos-blog-meta">
              <span class="ainos-blog-date">${formatDate(post.publishedAt)}</span>
              <span class="ainos-blog-readtime">${post.readTime} min read</span>
            </div>
          </div>
        </article>`;
    }

    return `
      <article class="ainos-blog-card">
        <div class="ainos-blog-content">
          ${safeCategory ? `<span class="ainos-blog-category">${safeCategory}</span>` : ''}
          <h3 class="ainos-blog-title"><a href="${safeUrl}">${safeTitle}</a></h3>
          <p class="ainos-blog-excerpt">${safeExcerpt}</p>
          ${tagsHtml}
          <div class="ainos-blog-meta">
            <span class="ainos-blog-date">${formatDate(post.publishedAt)}</span>
            <span class="ainos-blog-readtime">${post.readTime} min read</span>
          </div>
        </div>
      </article>`;
  }

  // Render full blog post (detail view)
  function renderFullPost(post) {
    const safeTitle = sanitize(post.title);
    const safeContent = renderMarkdown(post.content);
    const safeImage = post.featuredImage ? sanitize(post.featuredImage) : '';
    const safeWebsiteName = sanitize(post.websiteName || '');
    const safeWebsiteUrl = sanitize(post.websiteUrl || '');

    return `
      <article class="ainos-blog-full">
        <header class="ainos-blog-header">
          ${post.category ? `<span class="ainos-blog-category">${sanitize(post.category)}</span>` : ''}
          <h1 class="ainos-blog-title-full">${safeTitle}</h1>
          <div class="ainos-blog-meta">
            <span class="ainos-blog-date">${formatDate(post.publishedAt)}</span>
            <span class="ainos-blog-readtime">${post.readTime} min read</span>
          </div>
          ${post.tags && post.tags.length ? `<div class="ainos-blog-tags-full">${post.tags.map(t => `<span class="ainos-blog-tag">#${sanitize(t)}</span>`).join('')}</div>` : ''}
        </header>
        ${safeImage ? `<div class="ainos-blog-featured-image"><img src="${safeImage}" alt="${safeTitle}"/></div>` : ''}
        <div class="ainos-blog-body">${safeContent}</div>
        ${safeWebsiteName ? `<footer class="ainos-blog-footer"><p>Originally published on <a href="${safeWebsiteUrl}" target="_blank" rel="noopener">${safeWebsiteName}</a></p></footer>` : ''}
      </article>`;
  }

  // Load and render blogs
  async function loadBlogs(container) {
    const limit = container.getAttribute('data-limit') || '6';
    const style = container.getAttribute('data-style') || 'grid';
    const category = container.getAttribute('data-category') || '';
    const slug = container.getAttribute('data-slug') || '';

    container.innerHTML = '<div class="ainos-blog-loading">Loading articles...</div>';

    try {
      const params = new URLSearchParams({ limit, format: 'json' });
      if (category) params.set('category', category);
      if (slug) params.set('slug', slug);

      const res = await fetch(`${AINOS_API}?${params}`);
      if (!res.ok) throw new Error('Failed to load blogs');

      const data = await res.json();

      if (slug && data.title) {
        // Single post view
        container.innerHTML = renderFullPost(data);
        // Inject JSON-LD for SEO
        if (data.schemaOrg) {
          const script = document.createElement('script');
          script.type = 'application/ld+json';
          script.textContent = JSON.stringify(data.schemaOrg);
          document.head.appendChild(script);
        }
      } else {
        // Blog list view
        const posts = data.posts || [];
        if (posts.length === 0) {
          container.innerHTML = '<div class="ainos-blog-empty">No articles found.</div>';
          return;
        }

        const gridClass = style === 'list' ? 'ainos-blog-list' : 'ainos-blog-grid';
        container.innerHTML = `
          <div class="${gridClass}">
            ${posts.map(p => renderCard(p, style)).join('')}
          </div>
          ${data.categories && data.categories.length ? `
            <div class="ainos-blog-categories">
              ${data.categories.map(c => `<button class="ainos-blog-cat-btn" data-category="${c}">${c}</button>`).join('')}
            </div>
          ` : ''}
        `;

        // Category filter buttons
        container.querySelectorAll('.ainos-blog-cat-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            container.setAttribute('data-category', btn.getAttribute('data-category'));
            loadBlogs(container);
          });
        });
      }
    } catch (err) {
      container.innerHTML = '<div class="ainos-blog-error">Failed to load articles. Please try again later.</div>';
      console.error('AINOS Blog Widget Error:', err);
    }
  }

  // CSS Styles (injected dynamically)
  function injectStyles() {
    if (document.getElementById('ainos-blog-styles')) return;

    const css = `
      .ainos-blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
      .ainos-blog-list { display: flex; flex-direction: column; gap: 20px; }
      .ainos-blog-card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); transition: transform 0.3s, box-shadow 0.3s; border: 1px solid #f0f0f0; }
      .ainos-blog-card:hover { transform: translateY(-4px); box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
      .ainos-blog-card-list { display: flex; flex-direction: row; }
      .ainos-blog-content { padding: 24px; }
      .ainos-blog-category { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #f3e8ff; color: #7c3aed; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
      .ainos-blog-title { font-size: 18px; font-weight: 700; margin: 8px 0; line-height: 1.4; }
      .ainos-blog-title a { color: #1a1a2e; text-decoration: none; }
      .ainos-blog-title a:hover { color: #7c3aed; }
      .ainos-blog-title-full { font-size: 32px; font-weight: 800; margin: 16px 0; line-height: 1.3; color: #1a1a2e; }
      .ainos-blog-excerpt { font-size: 14px; color: #666; line-height: 1.6; margin: 8px 0 12px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      .ainos-blog-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
      .ainos-blog-tags-full { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
      .ainos-blog-tag { padding: 3px 10px; border-radius: 12px; font-size: 11px; background: #f5f3ff; color: #7c3aed; font-weight: 500; }
      .ainos-blog-meta { display: flex; gap: 16px; font-size: 12px; color: #999; padding-top: 12px; border-top: 1px solid #f0f0f0; }
      .ainos-blog-date, .ainos-blog-readtime { display: flex; align-items: center; gap: 4px; }
      .ainos-blog-categories { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; justify-content: center; }
      .ainos-blog-cat-btn { padding: 8px 20px; border-radius: 24px; border: 1px solid #e0e0e0; background: #fff; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
      .ainos-blog-cat-btn:hover { background: #7c3aed; color: #fff; border-color: #7c3aed; }
      .ainos-blog-full { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
      .ainos-blog-header { margin-bottom: 32px; }
      .ainos-blog-body { font-size: 16px; line-height: 1.8; color: #333; }
      .ainos-blog-body h2 { font-size: 24px; font-weight: 700; margin: 32px 0 16px; color: #1a1a2e; }
      .ainos-blog-body h3 { font-size: 20px; font-weight: 600; margin: 24px 0 12px; color: #1a1a2e; }
      .ainos-blog-body p { margin: 16px 0; }
      .ainos-blog-body ul { margin: 16px 0; padding-left: 24px; }
      .ainos-blog-body li { margin: 8px 0; }
      .ainos-blog-footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #e0e0e0; font-size: 14px; color: #666; }
      .ainos-blog-footer a { color: #7c3aed; text-decoration: none; font-weight: 600; }
      .ainos-blog-loading, .ainos-blog-empty, .ainos-blog-error { text-align: center; padding: 40px; color: #666; font-size: 14px; }
      .ainos-blog-error { color: #dc2626; }
      @media (max-width: 768px) {
        .ainos-blog-grid { grid-template-columns: 1fr; }
        .ainos-blog-card-list { flex-direction: column; }
        .ainos-blog-title-full { font-size: 24px; }
      }
    `;

    const style = document.createElement('style');
    style.id = 'ainos-blog-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // Auto-initialize on DOM ready
  function init() {
    injectStyles();
    const containers = document.querySelectorAll('#ainos-blog, .ainos-blog-widget, [data-ainos-blog]');
    containers.forEach(loadBlogs);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for manual use
  window.AINOSBlog = { load: loadBlogs, refresh: init };
})();

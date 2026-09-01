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

  // ═══════════════════════════════════════════
  // SMART THEME DETECTION — matches host website colors
  // ═══════════════════════════════════════════
  function detectTheme() {
    const container = document.querySelector('#ainos-blog, .ainos-blog-widget, [data-ainos-blog]');

    // 1. Manual override via data attributes
    if (container) {
      const manualColor = container.getAttribute('data-color');
      const manualTheme = container.getAttribute('data-theme');
      if (manualColor || manualTheme) {
        return buildThemeFromColor(
          manualColor || '#7c3aed',
          manualTheme || detectDarkMode()
        );
      }
    }

    // 2. Detect from CSS custom properties (most common in modern sites)
    const root = getComputedStyle(document.documentElement);
    const cssVarNames = [
      '--primary', '--primary-color', '--accent', '--accent-color',
      '--theme-color', '--color-primary', '--brand-color',
      '--color-brand', '--primary-500', '--color-accent',
      '--tw-primary', '--color-primary-500', '--p', '--primary-color-500'
    ];
    for (const varName of cssVarNames) {
      const val = root.getPropertyValue(varName).trim();
      if (val && val !== 'none' && val !== 'initial' && val !== 'inherit') {
        return buildThemeFromColor(val, detectDarkMode());
      }
    }

    // 3. Detect from actual element colors on the page
    const detectedColor = detectColorFromElements();
    if (detectedColor) {
      return buildThemeFromColor(detectedColor, detectDarkMode());
    }

    // 4. Fallback: default AINOS theme
    return buildThemeFromColor('#7c3aed', detectDarkMode());
  }

  function detectDarkMode() {
    // Walk from the widget container up to <html> and use the FIRST
    // non-transparent background. Many sites (and our preview page) keep
    // <body> transparent and paint the wrapper instead — treating a
    // transparent body as "dark" produced ugly dark boxes on light pages.
    const candidates = [];
    const container = document.querySelector('#ainos-blog, .ainos-blog-widget, [data-ainos-blog]');
    let el = container;
    while (el && el !== document.documentElement) { candidates.push(el); el = el.parentElement; }
    candidates.push(document.body, document.documentElement);
    for (const node of candidates) {
      if (!node) continue;
      const rgb = parseRgb(getComputedStyle(node).backgroundColor);
      if (rgb && rgb.a > 0.1) {
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        return brightness < 80;
      }
    }
    return false; // no painted background anywhere -> assume light page
  }

  function detectColorFromElements() {
    // Check links first (most reliable accent color)
    const links = document.querySelectorAll('a[href]');
    for (let i = 0; i < Math.min(links.length, 10); i++) {
      const color = getComputedStyle(links[i]).color;
      const rgb = parseRgb(color);
      if (rgb && isAccentColor(rgb)) {
        return rgbToHex(rgb);
      }
    }
    // Check buttons
    const buttons = document.querySelectorAll('button, [role="button"], .btn, a.button, input[type="submit"]');
    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      const bg = getComputedStyle(buttons[i]).backgroundColor;
      const rgb = parseRgb(bg);
      if (rgb && isAccentColor(rgb)) {
        return rgbToHex(rgb);
      }
    }
    // Check headings
    const headings = document.querySelectorAll('h1, h2, h3');
    if (headings.length > 0) {
      const color = getComputedStyle(headings[0]).color;
      const rgb = parseRgb(color);
      if (rgb && isAccentColor(rgb)) {
        return rgbToHex(rgb);
      }
    }
    return null;
  }

  function parseRgb(str) {
    if (!str) return null;
    const match = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?/);
    if (match) {
      return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]), a: match[4] === undefined ? 1 : parseFloat(match[4]) };
    }
    // Try hex
    const hexMatch = str.match(/^#([0-9a-f]{3,6})$/i);
    if (hexMatch) {
      const hex = hexMatch[1];
      if (hex.length === 3) {
        return { r: parseInt(hex[0]+hex[0],16), g: parseInt(hex[1]+hex[1],16), b: parseInt(hex[2]+hex[2],16), a: 1 };
      }
      return { r: parseInt(hex.substring(0,2),16), g: parseInt(hex.substring(2,4),16), b: parseInt(hex.substring(4,6),16), a: 1 };
    }
    return null;
  }

  function rgbToHex(rgb) {
    return '#' + [rgb.r, rgb.g, rgb.b].map(c => c.toString(16).padStart(2, '0')).join('');
  }

  function isAccentColor(rgb) {
    // Skip black, white, and very gray colors
    const max = Math.max(rgb.r, rgb.g, rgb.b);
    const min = Math.min(rgb.r, rgb.g, rgb.b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    // Must have some color saturation (not gray/white/black)
    return saturation > 0.3 && max > 30;
  }

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 124, g: 58, b: 237 };
  }

  function buildThemeFromColor(primaryHex, isDark) {
    const rgb = hexToRgb(primaryHex);
    const r = rgb.r, g = rgb.g, b = rgb.b;

    if (isDark) {
      return {
        primary: primaryHex,
        primaryRgb: rgb,
        cardBg: '#1e1e2e',
        cardBorder: `rgba(${r},${g},${b},0.2)`,
        cardShadow: '0 2px 12px rgba(0,0,0,0.3)',
        cardShadowHover: '0 8px 30px rgba(0,0,0,0.4)',
        titleColor: '#e8e8f0',
        titleHover: primaryHex,
        excerptColor: '#a0a0b0',
        metaColor: '#707080',
        metaBorder: 'rgba(255,255,255,0.08)',
        categoryBg: `rgba(${r},${g},${b},0.15)`,
        categoryColor: primaryHex,
        tagBg: `rgba(${r},${g},${b},0.12)`,
        tagColor: primaryHex,
        btnBg: 'transparent',
        btnBorder: `rgba(${r},${g},${b},0.3)`,
        btnText: '#c0c0d0',
        btnHoverBg: primaryHex,
        btnHoverText: '#ffffff',
        bodyColor: '#c0c0d0',
        headingColor: '#e8e8f0',
        footerBorder: 'rgba(255,255,255,0.08)',
        footerColor: '#a0a0b0',
        loadingColor: '#a0a0b0'
      };
    }

    return {
      primary: primaryHex,
      primaryRgb: rgb,
      cardBg: '#ffffff',
      cardBorder: `rgba(${r},${g},${b},0.1)`,
      cardShadow: '0 2px 12px rgba(0,0,0,0.06)',
      cardShadowHover: '0 8px 30px rgba(0,0,0,0.1)',
      titleColor: '#1a1a2e',
      titleHover: primaryHex,
      excerptColor: '#555566',
      metaColor: '#888899',
      metaBorder: `rgba(${r},${g},${b},0.08)`,
      categoryBg: `rgba(${r},${g},${b},0.1)`,
      categoryColor: primaryHex,
      tagBg: `rgba(${r},${g},${b},0.08)`,
      tagColor: primaryHex,
      btnBg: '#ffffff',
      btnBorder: `rgba(${r},${g},${b},0.2)`,
      btnText: '#444455',
      btnHoverBg: primaryHex,
      btnHoverText: '#ffffff',
      bodyColor: '#333344',
      headingColor: '#1a1a2e',
      footerBorder: `rgba(${r},${g},${b},0.1)`,
      footerColor: '#666677',
      loadingColor: '#666677'
    };
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
      // Tell the API which website this widget lives on, so only this
      // website's own blogs are served (multi-tenant isolation).
      // data-site allows preview pages to impersonate a website.
      params.set('site', container.getAttribute('data-site') || window.location.href);

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

  // CSS Styles (injected dynamically with theme colors)
  function injectStyles() {
    if (document.getElementById('ainos-blog-styles')) return;

    const theme = detectTheme();
    const t = theme;

    const css = `
      .ainos-blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
      .ainos-blog-list { display: flex; flex-direction: column; gap: 20px; }
      .ainos-blog-card { background: ${t.cardBg}; border-radius: 16px; overflow: hidden; box-shadow: ${t.cardShadow}; transition: transform 0.3s, box-shadow 0.3s; border: 1px solid ${t.cardBorder}; }
      .ainos-blog-card:hover { transform: translateY(-4px); box-shadow: ${t.cardShadowHover}; }
      .ainos-blog-card-list { display: flex; flex-direction: row; }
      .ainos-blog-content { padding: 24px; }
      .ainos-blog-category { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; background: ${t.categoryBg}; color: ${t.categoryColor}; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
      .ainos-blog-title { font-size: 18px; font-weight: 700; margin: 8px 0; line-height: 1.4; }
      .ainos-blog-title a { color: ${t.titleColor}; text-decoration: none; transition: color 0.2s; }
      .ainos-blog-title a:hover { color: ${t.titleHover}; }
      .ainos-blog-title-full { font-size: 32px; font-weight: 800; margin: 16px 0; line-height: 1.3; color: ${t.headingColor}; }
      .ainos-blog-excerpt { font-size: 14px; color: ${t.excerptColor}; line-height: 1.6; margin: 8px 0 12px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      .ainos-blog-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
      .ainos-blog-tags-full { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
      .ainos-blog-tag { padding: 3px 10px; border-radius: 12px; font-size: 11px; background: ${t.tagBg}; color: ${t.tagColor}; font-weight: 500; }
      .ainos-blog-meta { display: flex; gap: 16px; font-size: 12px; color: ${t.metaColor}; padding-top: 12px; border-top: 1px solid ${t.metaBorder}; }
      .ainos-blog-date, .ainos-blog-readtime { display: flex; align-items: center; gap: 4px; }
      .ainos-blog-categories { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; justify-content: center; }
      .ainos-blog-cat-btn { padding: 8px 20px; border-radius: 24px; border: 1px solid ${t.btnBorder}; background: ${t.btnBg}; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; color: ${t.btnText}; }
      .ainos-blog-cat-btn:hover { background: ${t.btnHoverBg}; color: ${t.btnHoverText}; border-color: ${t.btnHoverBg}; }
      .ainos-blog-full { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
      .ainos-blog-header { margin-bottom: 32px; }
      .ainos-blog-body { font-size: 16px; line-height: 1.8; color: ${t.bodyColor}; }
      .ainos-blog-body h2 { font-size: 24px; font-weight: 700; margin: 32px 0 16px; color: ${t.headingColor}; }
      .ainos-blog-body h3 { font-size: 20px; font-weight: 600; margin: 24px 0 12px; color: ${t.headingColor}; }
      .ainos-blog-body p { margin: 16px 0; }
      .ainos-blog-body ul { margin: 16px 0; padding-left: 24px; }
      .ainos-blog-body li { margin: 8px 0; }
      .ainos-blog-footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid ${t.footerBorder}; font-size: 14px; color: ${t.footerColor}; }
      .ainos-blog-footer a { color: ${t.primary}; text-decoration: none; font-weight: 600; }
      .ainos-blog-loading, .ainos-blog-empty, .ainos-blog-error { text-align: center; padding: 40px; color: ${t.loadingColor}; font-size: 14px; }
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
  function makeFallback() {
    const fallback = document.createElement('div');
    fallback.id = 'ainos-blog';
    fallback.setAttribute('data-limit', '6');
    fallback.setAttribute('data-style', 'grid');
    document.body.appendChild(fallback);
    return fallback;
  }

  function init() {
    injectStyles();
    let containers = Array.from(document.querySelectorAll('#ainos-blog, .ainos-blog-widget, [data-ainos-blog]'));
    // Non-developer safety net: if the user's platform (React/SPA builders)
    // wiped the pasted div, create our own section at the page bottom so
    // blogs always show up
    if (!containers.length) {
      containers = [makeFallback()];
    }
    containers.forEach(loadBlogs);

    // Self-heal: some builders replace page HTML after mount — if our
    // container gets removed, re-attach a fallback (checked for ~30s)
    let checks = 0;
    const heal = setInterval(() => {
      checks++;
      const alive = containers.some(c => document.body.contains(c));
      if (!alive) {
        const fallback = makeFallback();
        containers = [fallback];
        loadBlogs(fallback);
      }
      if (checks > 10) clearInterval(heal);
    }, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for manual use
  window.AINOSBlog = { load: loadBlogs, refresh: init };
})();

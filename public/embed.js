/**
 * AINOS Blog Embed Widget
 * Universal blog widget that works on ANY website platform
 * (WordPress, Shopify, React, HTML, Wix, Squarespace, etc.)
 *
 * The widget reads the host website's own design language — fonts, colors,
 * corner roundness, light/dark — from its computed CSS (index.css etc.) and
 * mirrors it, so the blog section looks native to the site.
 *
 * Article pages open ON the client's own domain via hash routing
 * (#ainos-blog/slug) with JSON-LD structured data — readers and SEO
 * value stay on the client's website.
 *
 * Usage:
 * <script src="https://ainos-ywu0.onrender.com/embed.js"></script>
 * <div id="ainos-blog" data-limit="6" data-style="grid"></div>
 *
 * Optional attributes: data-limit, data-style (grid|list), data-category,
 * data-color (#hex accent override), data-theme (light|dark), data-slug
 * (single-article embed), data-site (preview impersonation).
 */

(function () {
  'use strict';

  // Dynamically detect the API URL based on where embed.js is hosted
  const currentScript = document.currentScript || document.querySelector('script[src*="embed.js"]');
  const scriptSrc = currentScript?.src || '';
  const baseUrl = scriptSrc ? new URL(scriptSrc).origin : 'https://ainos-ywu0.onrender.com';
  const AINOS_API = `${baseUrl}/api/blog-embed`;

  // On-site article routes: #ainos-blog/<slug> keeps readers on the
  // client's domain instead of sending them to AINOS
  const HASH_PREFIX = '#ainos-blog/';

  function currentHashSlug() {
    const h = window.location.hash || '';
    return h.indexOf(HASH_PREFIX) === 0 ? decodeURIComponent(h.slice(HASH_PREFIX.length)) : '';
  }

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
    // non-transparent background. Many sites keep <body> transparent and
    // paint the wrapper instead — treating a transparent body as "dark"
    // produced ugly dark boxes on light pages.
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

  // ═══════════════════════════════════════════
  // TYPOGRAPHY DETECTION — mirror the host site's fonts & shape language
  // (reads the site's effective CSS: index.css, Tailwind, theme files...)
  // ═══════════════════════════════════════════
  function detectTypography() {
    const bodyCs = getComputedStyle(document.body);
    const heading = document.querySelector('h1, h2, h3');
    const headingFont = heading ? getComputedStyle(heading).fontFamily : bodyCs.fontFamily;
    const baseSize = parseFloat(bodyCs.fontSize) || 16;

    // Corner roundness: sample the site's own buttons/cards so the widget's
    // cards feel like they belong (sharp site -> sharp cards, etc.)
    let radius = 16;
    const sample = document.querySelector('button, .btn, a.button, [class*="card"]');
    if (sample) {
      const r = parseFloat(getComputedStyle(sample).borderRadius);
      if (!isNaN(r) && r >= 0) radius = Math.min(24, r);
    }

    return {
      bodyFont: bodyCs.fontFamily || 'system-ui, sans-serif',
      headingFont: headingFont || bodyCs.fontFamily || 'system-ui, sans-serif',
      baseSize,
      radius
    };
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
    const result = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
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

  // Strip JSON wrapper from blog content — extract only the markdown
  function cleanBlogContent(raw) {
    if (!raw) return '';
    var trimmed = raw.trim();
    if (trimmed.charAt(0) === '{') {
      try {
        var parsed = JSON.parse(trimmed);
        if (parsed.content && typeof parsed.content === 'string') return parsed.content;
        if (parsed.title && parsed.excerpt) return '# ' + parsed.title + '\n\n' + parsed.excerpt + '\n\n' + (parsed.content || '');
      } catch (e) {
        // Not valid JSON — strip JSON-like prefix lines until we hit markdown
        var lines = trimmed.split('\n');
        var startIdx = 0;
        for (var i = 0; i < lines.length; i++) {
          if (lines[i].trim().charAt(0) === '#' && lines[i].trim().charAt(1) === ' ') { startIdx = i; break; }
          if (lines[i].indexOf('"') > -1 && (lines[i].indexOf('title') > -1 || lines[i].indexOf('slug') > -1 || lines[i].indexOf('excerpt') > -1)) { startIdx = i + 1; }
        }
        return lines.slice(startIdx).join('\n').trim();
      }
    }
    return trimmed;
  }

  // Markdown to HTML converter (sanitized)
  function renderMarkdown(md) {
    if (!md) return '';
    md = cleanBlogContent(md);
    return md
      // Images: ![alt](url) — must come BEFORE links to avoid conflict
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<div class="ainos-blog-inline-img"><img src="$2" alt="$1" loading="lazy" style="width:100%;max-height:420px;object-fit:cover;border-radius:12px;margin:24px 0;display:block;"></div>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      // Headings
      .replace(/^### (.*$)/gm, '<h3>' + '$1' + '</h3>')
      .replace(/^## (.*$)/gm, '<h2>' + '$1' + '</h2>')
      .replace(/^# (.*$)/gm, '<h1>' + '$1' + '</h1>')
      // Bold & italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>' + '$1' + '</strong>')
      .replace(/\*(.*?)\*/g, '<em>' + '$1' + '</em>')
      // Lists
      .replace(/^- (.*$)/gm, '<li>' + '$1' + '</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      // Paragraphs
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

  // Render blog card with featured image. Links use hash routing so the
  // article opens ON the client's own website (not on AINOS).
  // opts: { showTags, showMeta, showCategory } — all default true
  function renderCard(post, style, opts) {
    opts = opts || {};
    const safeTitle = sanitize(post.title);
    const safeExcerpt = sanitize(post.excerpt || '');
    const safeCategory = sanitize(post.category || '');
    const safeImage = post.featuredImage ? sanitize(post.featuredImage) : '';
    const articleHref = `${HASH_PREFIX}${encodeURIComponent(post.slug)}`;
    const imgHtml = safeImage
      ? `<div class="ainos-blog-card-img"><img src="${safeImage}" alt="${safeTitle}" loading="lazy"/></div>`
      : '';

    const showTags = opts.showTags !== false;
    const showMeta = opts.showMeta !== false;
    const showCategory = opts.showCategory !== false;

    const tagsHtml = showTags && post.tags && post.tags.length
      ? `<div class="ainos-blog-tags">${post.tags.slice(0, 3).map(t => `<span class="ainos-blog-tag">#${sanitize(t)}</span>`).join('')}</div>`
      : '';

    if (style === 'list') {
      return `
        <article class="ainos-blog-card ainos-blog-card-list">
          ${imgHtml}
          <div class="ainos-blog-content">
            ${showCategory && safeCategory ? `<span class="ainos-blog-category">${safeCategory}</span>` : ''}
            <h3 class="ainos-blog-title"><a href="${articleHref}">${safeTitle}</a></h3>
            <p class="ainos-blog-excerpt">${safeExcerpt}</p>
            ${tagsHtml}
            ${showMeta ? `<div class="ainos-blog-meta">
              <span class="ainos-blog-date">${formatDate(post.publishedAt)}</span>
              <span class="ainos-blog-readtime">${post.readTime} min read</span>
            </div>` : ''}
          </div>
        </article>`;
    }

    return `
      <article class="ainos-blog-card">
        ${imgHtml}
        <div class="ainos-blog-content">
          ${showCategory && safeCategory ? `<span class="ainos-blog-category">${safeCategory}</span>` : ''}
          <h3 class="ainos-blog-title"><a href="${articleHref}">${safeTitle}</a></h3>
          <p class="ainos-blog-excerpt">${safeExcerpt}</p>
          ${tagsHtml}
          ${showMeta ? `<div class="ainos-blog-meta">
            <span class="ainos-blog-date">${formatDate(post.publishedAt)}</span>
            <span class="ainos-blog-readtime">${post.readTime} min read</span>
          </div>` : ''}
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

  // ═══════════════════════════════════════════
  // SEO — structured data injected on the client's domain
  // ═══════════════════════════════════════════
  function injectJsonLd(id, obj) {
    if (!obj) return;
    const old = document.getElementById(id);
    if (old) old.remove();
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.id = id;
    s.textContent = JSON.stringify(obj);
    document.head.appendChild(s);
  }

  function injectListSchema(posts) {
    // Remove single-article schema when back on the list view
    const oldPost = document.getElementById('ainos-blog-post-schema');
    if (oldPost) oldPost.remove();
    injectJsonLd('ainos-blog-list-schema', {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      numberOfItems: posts.length,
      itemListElement: posts.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.title,
        url: `${window.location.origin}${window.location.pathname}${HASH_PREFIX}${encodeURIComponent(p.slug)}`
      }))
    });
  }

  // ═══════════════════════════════════════════
  // LOADERS
  // ═══════════════════════════════════════════
  async function loadBlogs(container) {
    const limit = container.getAttribute('data-limit') || '6';
    const style = container.getAttribute('data-style') || 'grid';
    const category = container.getAttribute('data-category') || '';

    // Customization options from data attributes
    const opts = {
      showTags: container.getAttribute('data-show-tags') !== 'false',
      showMeta: container.getAttribute('data-show-meta') !== 'false',
      showCategory: container.getAttribute('data-show-category') !== 'false',
    };

    container.innerHTML = '<div class="ainos-blog-loading">Loading articles...</div>';

    try {
      const params = new URLSearchParams({ limit, format: 'json' });
      if (category) params.set('category', category);
      // Tell the API which website this widget lives on, so only this
      // website's own blogs are served (multi-tenant isolation).
      params.set('site', container.getAttribute('data-site') || window.location.href);

      const res = await fetch(`${AINOS_API}?${params}`);
      if (!res.ok) throw new Error('Failed to load blogs');

      const data = await res.json();
      const posts = data.posts || [];
      if (posts.length === 0) {
        container.innerHTML = '<div class="ainos-blog-empty">No articles found.</div>';
        return;
      }

      const gridClass = style === 'list' ? 'ainos-blog-list' : 'ainos-blog-grid';
      container.innerHTML = `
        <div class="${gridClass}">
          ${posts.map(p => renderCard(p, style, opts)).join('')}
        </div>
        ${data.categories && data.categories.length ? `
          <div class="ainos-blog-categories">
            ${data.categories.map(c => `<button class="ainos-blog-cat-btn" data-category="${sanitize(c)}">${sanitize(c)}</button>`).join('')}
          </div>
        ` : ''}
      `;
      injectListSchema(posts);

      // Category filter buttons
      container.querySelectorAll('.ainos-blog-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          container.setAttribute('data-category', btn.getAttribute('data-category'));
          loadBlogs(container);
        });
      });
    } catch (err) {
      container.innerHTML = '<div class="ainos-blog-error">Failed to load articles. Please try again later.</div>';
      console.error('AINOS Blog Widget Error:', err);
    }
  }

  // Single article view — rendered ON the client's domain (hash route)
  async function loadSingle(container, slug) {
    container.innerHTML = '<div class="ainos-blog-loading">Loading article...</div>';
    try {
      const params = new URLSearchParams({ slug, format: 'json' });
      params.set('site', container.getAttribute('data-site') || window.location.href);

      const res = await fetch(`${AINOS_API}?${params}`);
      if (!res.ok) throw new Error('Failed to load article');
      const data = await res.json();

      const backHref = sanitize(window.location.pathname + window.location.search);
      container.innerHTML =
        `<div class="ainos-blog-back"><a href="${backHref}">&larr; All articles</a></div>` +
        renderFullPost(data);

      // BlogPosting structured data on the client's own domain
      const oldList = document.getElementById('ainos-blog-list-schema');
      if (oldList) oldList.remove();
      injectJsonLd('ainos-blog-post-schema', data.schemaOrg);

      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      container.innerHTML = '<div class="ainos-blog-error">Failed to load article. Please try again later.</div>';
      console.error('AINOS Blog Widget Error:', err);
    }
  }

  // CSS Styles (injected dynamically with theme + host typography)
  function injectStyles() {
    if (document.getElementById('ainos-blog-styles')) return;

    const t = detectTheme();
    const typo = detectTypography();
    // Scale widget type to the host site's base font size
    const px = (n) => Math.round((n / 16) * typo.baseSize);

    const css = `
      .ainos-blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
      #ainos-blog.ainos-blog-grid, .ainos-blog-widget.ainos-blog-grid, [data-ainos-blog].ainos-blog-grid { grid-template-columns: repeat(var(--ainos-cols, auto-fill), minmax(280px, 1fr)); }
      .ainos-blog-list { display: flex; flex-direction: column; gap: 20px; }
      .ainos-blog-card { background: ${t.cardBg}; border-radius: var(--ainos-radius, ${typo.radius}px); overflow: hidden; box-shadow: var(--ainos-shadow, ${t.cardShadow}); transition: transform 0.3s, box-shadow 0.3s; border: 1px solid ${t.cardBorder}; font-family: ${typo.bodyFont}; }
      .ainos-blog-card:hover { transform: translateY(-4px); box-shadow: ${t.cardShadowHover}; }
      .ainos-blog-card-list { display: flex; flex-direction: row; }
      .ainos-blog-card-img { height: ${px(160)}px; overflow: hidden; }
      .ainos-blog-card-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
      .ainos-blog-card:hover .ainos-blog-card-img img { transform: scale(1.05); }
      .ainos-blog-card-list .ainos-blog-card-img { width: ${px(200)}px; flex-shrink: 0; height: auto; }
      .ainos-blog-content { padding: 24px; }
      .ainos-blog-category { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: ${px(11)}px; font-weight: 600; background: ${t.categoryBg}; color: ${t.categoryColor}; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
      .ainos-blog-title { font-size: ${px(18)}px; font-weight: 700; margin: 8px 0; line-height: 1.4; font-family: ${typo.headingFont}; }
      .ainos-blog-title a { color: ${t.titleColor}; text-decoration: none; transition: color 0.2s; }
      .ainos-blog-title a:hover { color: ${t.titleHover}; }
      .ainos-blog-title-full { font-size: ${px(32)}px; font-weight: 800; margin: 16px 0; line-height: 1.3; color: ${t.headingColor}; font-family: ${typo.headingFont}; }
      .ainos-blog-excerpt { font-size: ${px(14)}px; color: ${t.excerptColor}; line-height: 1.6; margin: 8px 0 12px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      .ainos-blog-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
      .ainos-blog-tags-full { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
      .ainos-blog-tag { padding: 3px 10px; border-radius: 12px; font-size: ${px(11)}px; background: ${t.tagBg}; color: ${t.tagColor}; font-weight: 500; }
      .ainos-blog-meta { display: flex; gap: 16px; font-size: ${px(12)}px; color: ${t.metaColor}; padding-top: 12px; border-top: 1px solid ${t.metaBorder}; }
      .ainos-blog-date, .ainos-blog-readtime { display: flex; align-items: center; gap: 4px; }
      .ainos-blog-categories { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; justify-content: center; }
      .ainos-blog-cat-btn { padding: 8px 20px; border-radius: 24px; border: 1px solid ${t.btnBorder}; background: ${t.btnBg}; font-size: ${px(13)}px; font-weight: 500; cursor: pointer; transition: all 0.2s; color: ${t.btnText}; font-family: ${typo.bodyFont}; }
      .ainos-blog-cat-btn:hover { background: ${t.btnHoverBg}; color: ${t.btnHoverText}; border-color: ${t.btnHoverBg}; }
      .ainos-blog-back { margin-bottom: ${px(16)}px; }
      .ainos-blog-back a { color: ${t.primary}; font-weight: 600; text-decoration: none; font-size: ${px(14)}px; font-family: ${typo.bodyFont}; }
      .ainos-blog-back a:hover { text-decoration: underline; }
      .ainos-blog-full { max-width: 800px; margin: 0 auto; padding: 24px 4px; font-family: ${typo.bodyFont}; }
      .ainos-blog-header { margin-bottom: 32px; }
      .ainos-blog-featured-image { margin: 24px 0; border-radius: ${Math.max(8, typo.radius)}px; overflow: hidden; }
      .ainos-blog-featured-image img { width: 100%; max-height: 420px; object-fit: cover; display: block; }
      .ainos-blog-body { font-size: ${px(16)}px; line-height: 1.8; color: ${t.bodyColor}; }
      .ainos-blog-body h1, .ainos-blog-body h2 { font-size: ${px(24)}px; font-weight: 700; margin: 32px 0 16px; color: ${t.headingColor}; font-family: ${typo.headingFont}; }
      .ainos-blog-body h3 { font-size: ${px(20)}px; font-weight: 600; margin: 24px 0 12px; color: ${t.headingColor}; font-family: ${typo.headingFont}; }
      .ainos-blog-body p { margin: 16px 0; }
      .ainos-blog-body ul { margin: 16px 0; padding-left: 24px; }
      .ainos-blog-body li { margin: 8px 0; }
      .ainos-blog-footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid ${t.footerBorder}; font-size: ${px(14)}px; color: ${t.footerColor}; }
      .ainos-blog-footer a { color: ${t.primary}; text-decoration: none; font-weight: 600; }
      .ainos-blog-loading, .ainos-blog-empty, .ainos-blog-error { text-align: center; padding: 40px; color: ${t.loadingColor}; font-size: ${px(14)}px; font-family: ${typo.bodyFont}; }
      .ainos-blog-error { color: #dc2626; }
      .ainos-blog-section { max-width: 1280px; margin: 0 auto; padding: 60px 24px 80px; }
      .ainos-blog-section-heading { text-align: center; font-size: 28px; font-weight: 800; margin-bottom: 8px; color: inherit; }
      .ainos-blog-section-subheading { text-align: center; color: #888; margin-bottom: 40px; font-size: 15px; }
      .ainos-blog-view-all { text-align: center; margin-top: 40px; }
      .ainos-blog-view-all a { display: inline-block; padding: 12px 32px; border-radius: 8px; background: ${t.primary}; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; transition: opacity 0.2s; }
      .ainos-blog-view-all a:hover { opacity: 0.85; }
      @media (max-width: 768px) {
        .ainos-blog-grid { grid-template-columns: 1fr; }
        .ainos-blog-card-list { flex-direction: column; }
        .ainos-blog-card-list .ainos-blog-card-img { width: 100%; height: ${px(160)}px; }
        .ainos-blog-title-full { font-size: ${px(24)}px; }
        .ainos-blog-section { padding: 40px 16px 60px; }
        .ainos-blog-section-heading { font-size: 22px; }
      }
    `;

    const style = document.createElement('style');
    style.id = 'ainos-blog-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // Apply per-container CSS custom properties for customization
  function applyContainerStyles(container) {
    const cols = container.getAttribute('data-columns');
    const radius = container.getAttribute('data-card-radius');
    const primaryColor = container.getAttribute('data-primary-color');
    const bgColor = container.getAttribute('data-bg-color');
    const cardShadow = container.getAttribute('data-card-shadow');

    let cssVars = '';
    if (cols) cssVars += `--ainos-cols: ${cols};`;
    if (radius) cssVars += `--ainos-radius: ${radius}px;`;
    if (primaryColor) cssVars += `--ainos-primary: ${primaryColor};`;
    if (bgColor) cssVars += `--ainos-bg: ${bgColor};`;
    if (cardShadow) {
      const shadows = { none: 'none', sm: '0 1px 3px rgba(0,0,0,0.08)', md: '0 4px 12px rgba(0,0,0,0.1)', lg: '0 8px 30px rgba(0,0,0,0.12)' };
      cssVars += `--ainos-shadow: ${shadows[cardShadow] || cardShadow};`;
    }
    if (cssVars) container.style.cssText = cssVars;
  }

  // Auto-reposition: if blog container is after <footer>, move it before footer
  // and wrap in a properly styled section with heading
  function autoReposition(container) {
    // Find the nearest footer element
    var footer = document.querySelector('footer') || document.querySelector('[role="contentinfo"]');
    if (!footer) return; // no footer found, leave as-is

    // Check if container is AFTER footer in DOM order
    var containerPos = container.compareDocumentPosition(footer);
    var isAfterFooter = (containerPos & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

    if (isAfterFooter) {
      // Create a styled section wrapper
      var section = document.createElement('section');
      section.className = 'ainos-blog-section';

      // Add heading
      var heading = document.createElement('h2');
      heading.className = 'ainos-blog-section-heading';
      heading.textContent = container.getAttribute('data-heading') || 'Latest from Our Blog';
      var subheading = document.createElement('p');
      subheading.className = 'ainos-blog-section-subheading';
      subheading.textContent = container.getAttribute('data-subheading') || 'Expert insights, tips and industry updates';

      section.appendChild(heading);
      section.appendChild(subheading);

      // Move container into section, then insert section before footer
      footer.parentNode.insertBefore(section, footer);
      section.appendChild(container);

      // Add "View All" button if data-view-all is set
      var viewAllUrl = container.getAttribute('data-view-all');
      if (viewAllUrl) {
        var viewAllDiv = document.createElement('div');
        viewAllDiv.className = 'ainos-blog-view-all';
        var viewAllLink = document.createElement('a');
        viewAllLink.href = viewAllUrl;
        viewAllLink.textContent = container.getAttribute('data-view-all-text') || 'View All Articles';
        viewAllDiv.appendChild(viewAllLink);
        section.appendChild(viewAllDiv);
      }
    }
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

    // Auto-reposition each container: if after footer, move before footer
    containers.forEach(autoReposition);

    // Apply per-container customization styles
    containers.forEach(applyContainerStyles);

    const renderFor = (c) => {
      const slug = c.getAttribute('data-slug') || currentHashSlug();
      if (slug) loadSingle(c, slug); else loadBlogs(c);
    };
    containers.forEach(renderFor);

    // On-site article pages: card clicks change the hash (#ainos-blog/slug)
    // and we swap list <-> article without leaving the client's domain
    window.addEventListener('hashchange', () => {
      containers.forEach(c => {
        if (c.getAttribute('data-slug')) return; // fixed single-post embeds
        renderFor(c);
      });
    });

    // Self-heal: some builders replace page HTML after mount — if our
    // container gets removed, re-attach a fallback (checked for ~30s)
    let checks = 0;
    const heal = setInterval(() => {
      checks++;
      const alive = containers.some(c => document.body.contains(c));
      if (!alive) {
        const fallback = makeFallback();
        containers = [fallback];
        renderFor(fallback);
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

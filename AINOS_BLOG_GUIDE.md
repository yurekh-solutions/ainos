# AINOS Blog System — Complete User Guidance Notes

> One-stop reference for how AINOS blogs work, how to integrate them on any website, and how the scheduling/calendar/status flow operates.

---

## 1. System Overview — What Happens Behind the Scenes

```
AINOS Dashboard (ainos-ywu0.onrender.com)
  │
  ├─ AI Blog Agent generates articles (topic → AI → markdown + image + tags)
  ├─ You review → Publish / Schedule / Save as Draft
  │
  └─ Published blogs are served via API ──→ embed.js on YOUR website
                                              │
                                              ├─ Auto-detects your site's theme (light/dark)
                                              ├─ Mirrors your fonts, colors, corner radius
                                              ├─ Each article gets its own SEO-friendly URL
                                              └─ JSON-LD structured data injected automatically
```

### Key Points
- **One script** does everything — no plugins, no dependencies, no build step
- Works on **WordPress, Shopify, Wix, Squarespace, React, plain HTML** — any platform
- Blogs are **multi-tenant** — each connected website only sees its own articles
- **Auto-updates** — when you publish a new blog in AINOS, it appears on your site automatically (no re-pasting code)

---

## 2. The Embed Script — What It Is and How It Works

### The Code You Paste

```html
<script src="https://ainos-ywu0.onrender.com/embed.js"></script>
<div id="ainos-blog" data-limit="6" data-style="grid"></div>
```

That's it. Two lines. Everything else is automatic.

### What Happens When You Paste It

1. **Script loads** from AINOS server
2. **Detects your website's design** — reads your CSS variables, link colors, button styles, fonts, dark/light mode
3. **Fetches your published blogs** from AINOS API (only blogs belonging to your website URL)
4. **Renders blog cards** that match your site's look and feel
5. **Auto-repositions** — if you accidentally paste after `<footer>`, the widget moves itself before the footer automatically
6. **Self-heals** — if your website builder removes the pasted HTML (React/SPA issue), the widget recreates itself

---

## 3. Where to Paste the Code

### For Multi-Page Websites (WordPress, Shopify, Wix, Squarespace, etc.)

These websites have separate pages — create a **dedicated blog page**:

| Platform | Steps |
|----------|-------|
| **WordPress** | Pages → Add New → Add "Custom HTML" block → Paste code → Publish |
| **Shopify** | Online Store → Pages → Open/Create page → "Show HTML" → Paste code → Save |
| **Wix** | Add → Embed → "Embed Code" → Paste → Publish |
| **Squarespace** | Add page → Add "Code" block → Paste → Save |
| **Any HTML site** | Open the HTML file → Paste before `</body>` or before `<footer>` → Upload |

**Result:** Your blog gets its own page at `yoursite.com/blog` (or whatever you name the page). Each article also gets its own URL like `yoursite.com/blog/my-article-title`.

### For Single-Page Websites (Landing Pages, Portfolios, etc.)

If your website is a single scrolling page with no separate pages:

1. Paste the code **directly before your `<footer>` tag** (or at the bottom of the page)
2. The widget automatically creates a **styled blog section** with:
   - A heading: "Latest from Our Blog" (customizable)
   - A subheading: "Expert insights, tips and industry updates" (customizable)
   - Blog cards in grid or list layout
   - Category filter buttons

**Result:** Blogs appear as a section on your page — no separate page needed.

### Paste Location Summary

```
Multi-page website  →  Create a "Blog" page  →  Paste code there
Single-page website →  Paste before <footer>  →  Section auto-created
Any wrong placement →  Widget auto-repositions  →  Finds correct spot
```

---

## 4. Customization Options (data-* Attributes)

All customization is done through HTML attributes on the `<div>` — no CSS knowledge needed.

### Basic Options

| Attribute | Values | Default | What It Does |
|-----------|--------|---------|--------------|
| `data-limit` | Any number | `6` | How many blog cards to show |
| `data-style` | `grid` or `list` | `grid` | Grid = card columns, List = stacked rows |
| `data-category` | Category name | _(all)_ | Show only blogs from one category |
| `data-columns` | Number (2, 3, 4) | auto | Force specific column count |

### Theme & Appearance

| Attribute | Values | Default | What It Does |
|-----------|--------|---------|--------------|
| `data-color` | Any hex code | Auto-detected | Override the accent color |
| `data-theme` | `light` or `dark` | Auto-detected | Force light or dark mode |
| `data-card-radius` | Number (px) | Auto-detected | Card corner roundness |
| `data-card-shadow` | `none`, `sm`, `md`, `lg` | Auto-detected | Shadow intensity |

### Content & Layout

| Attribute | Values | Default | What It Does |
|-----------|--------|---------|--------------|
| `data-show-tags` | `true` / `false` | `true` | Show hashtag labels on cards |
| `data-show-meta` | `true` / `false` | `true` | Show date and read time |
| `data-show-category` | `true` / `false` | `true` | Show category badge |
| `data-heading` | Any text | "Latest from Our Blog" | Section heading text |
| `data-subheading` | Any text | "Expert insights..." | Section subheading text |

### Advanced

| Attribute | Values | Default | What It Does |
|-----------|--------|---------|--------------|
| `data-path` | URL prefix | `blog` | Article URL prefix (e.g., `articles` → `/articles/slug`) |
| `data-slug` | Article slug | _(none)_ | Embed a single specific article |
| `data-site` | URL | `window.location.href` | Override which website's blogs to show (for preview) |
| `data-view-all` | URL | _(none)_ | Add a "View All" button linking to full blog page |
| `data-view-all-text` | Any text | "View All Articles" | Text for the View All button |

### Example: Fully Customized

```html
<script src="https://ainos-ywu0.onrender.com/embed.js"></script>
<div id="ainos-blog"
  data-limit="9"
  data-style="grid"
  data-columns="3"
  data-color="#e63946"
  data-theme="light"
  data-card-radius="12"
  data-heading="Our Latest Insights"
  data-subheading="Stay updated with industry trends"
  data-show-tags="true"
  data-path="articles">
</div>
```

---

## 5. How Blog Routing Works (Pages vs Sections)

### Multi-Page Website → Each Article Gets Its Own URL

When a visitor clicks a blog card:
- URL changes to `yoursite.com/blog/article-slug` (using HTML5 pushState — no page reload)
- Full article renders in the same container
- Browser back/forward buttons work correctly
- Each article has its own `<link rel="canonical">` and JSON-LD `BlogPosting` schema
- **Google treats every article as a separate indexable page on YOUR domain**

```
yoursite.com/blog              → Blog listing (all cards)
yoursite.com/blog/seo-tips     → Article: "SEO Tips for 2025"
yoursite.com/blog/ai-trends    → Article: "AI Trends to Watch"
```

### Single-Page Website → Blog as a Section

When there's no separate blog page:
- Widget auto-detects it's placed after footer
- Wraps everything in a styled `<section>` with heading
- Article clicks still use pushState for smooth navigation
- Back button returns to the main page

### URL Prefix Customization

If you don't want `/blog/`, change it:
```html
<div id="ainos-blog" data-path="articles"></div>
<!-- Articles now live at /articles/slug -->

<div id="ainos-blog" data-path="news"></div>
<!-- Articles now live at /news/slug -->

<div id="ainos-blog" data-path="insights"></div>
<!-- Articles now live at /insights/slug -->
```

---

## 6. Blog Status Flow — Draft, Scheduled, Published

### In the AINOS Dashboard

When you create a blog post (manually or via AI), it goes through this flow:

```
AI Generates Blog
       │
       ├─→ Save as Draft     → Status: "draft"     → Not visible on website
       ├─→ Publish Now       → Status: "published"  → Immediately appears on website
       └─→ Schedule          → Status: "scheduled"  → Appears automatically on scheduled date
```

### Status Meanings

| Status | Icon | Meaning | Visible on Website? |
|--------|------|---------|---------------------|
| **Draft** | Pencil | Saved but not live | No — only visible in AINOS dashboard |
| **Published** | Green Check | Live and public | Yes — appears in embed.js immediately |
| **Scheduled** | Clock | Will auto-publish on date | No — appears automatically when date arrives |

### Calendar View

The AINOS dashboard has a **Content Calendar** that shows:
- All scheduled posts on their dates
- Published posts marked in green
- Draft posts visible for planning
- Quick status change from the calendar

Toggle between **Grid View** (cards) and **Calendar View** (monthly calendar) using the view toggle at the top of the Blog page.

---

## 7. How to Know If Blogs Are Working on Your Website

### Quick Check List

1. **Open your website** in a browser
2. **Scroll to where you pasted the code** (or to the footer section)
3. **You should see:**
   - Blog cards with images, titles, excerpts, categories
   - Cards match your website's colors and fonts
   - Clicking a card opens the full article

### If You See "Loading articles..." Forever
- Check: Is your website URL connected in AINOS? (Blog Agent → Connected Websites)
- Check: Do you have published blogs? (Drafts don't show)

### If You See "No articles found."
- Your website is connected but has no published blogs yet
- Publish a blog from the AINOS dashboard

### If You See Nothing At All
- Check: Did you paste both lines? (the `<script>` AND the `<div>`)
- Check: Is the script URL correct? `https://ainos-ywu0.onrender.com/embed.js`
- Open browser DevTools (F12) → Console tab → Look for "AINOS Blog Widget Error"

### Browser Console Debugging
```javascript
// Check if AINOS blog widget loaded
console.log(window.AINOSBlog);  // Should show { load: fn, refresh: fn }

// Manually trigger a refresh
window.AINOSBlog.refresh();

// Check what the API returns
fetch('https://ainos-ywu0.onrender.com/api/blog-embed?site=yoursite.com&format=json')
  .then(r => r.json())
  .then(data => console.log(data.posts));
```

---

## 8. SEO Benefits — What Happens Automatically

Every blog embedded on your website gets:

| SEO Feature | How It Helps |
|-------------|--------------|
| **Unique URL per article** | Google indexes each article as a separate page on YOUR domain |
| **JSON-LD BlogPosting schema** | Rich snippets in Google search results |
| **ItemList schema on listing** | Google understands your blog structure |
| **Canonical URL** | Tells Google the definitive URL for each article |
| **Semantic HTML** | Proper `<article>`, `<header>`, `<h1>`, `<h2>` tags |
| **Lazy-loaded images** | Fast page load = better Core Web Vitals |
| **Mobile responsive** | Works on all screen sizes = mobile-first indexing |

**Important:** The SEO value stays on YOUR website — not on AINOS. Readers and search engines see everything on your domain.

---

## 9. Additional Integration Methods

### RSS Feed
For platforms that support RSS (WordPress, email newsletters, etc.):
```
https://ainos-ywu0.onrender.com/api/blog-rss
```

### XML Sitemap
Submit to Google Search Console for indexing:
```
https://ainos-ywu0.onrender.com/api/blog-sitemap
```

### JSON API
For custom integrations:
```
https://ainos-ywu0.onrender.com/api/blog-embed?site=yoursite.com&limit=10&format=json
```

Returns:
```json
{
  "posts": [
    {
      "title": "Article Title",
      "slug": "article-title",
      "excerpt": "Short description...",
      "content": "Full markdown content...",
      "category": "Technology",
      "tags": ["AI", "Business"],
      "featuredImage": "https://...",
      "publishedAt": "2025-01-15T00:00:00Z",
      "readTime": 5
    }
  ],
  "categories": ["Technology", "Marketing"]
}
```

---

## 10. Complete Workflow Summary

```
Step 1: Connect Your Website
   └─ AINOS Dashboard → Blog Agent → Add your website URL

Step 2: Create Blogs
   └─ AI generates article → Review → Publish / Schedule / Draft

Step 3: Copy Embed Code
   └─ Blog page → "Publish to Website" button → Copy code

Step 4: Paste on Your Website
   ├─ Multi-page → Create "Blog" page → Paste code
   └─ Single-page → Paste before <footer> → Section auto-created

Step 5: Verify
   └─ Open your website → See blogs live → Click articles → Check URLs

Step 6: Ongoing
   └─ Publish new blogs in AINOS → They auto-appear on your site
   └─ Schedule blogs → They auto-publish on the date
   └─ No need to re-paste code EVER
```

---

## 11. Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| Blogs not showing | Check website URL is connected in Blog Agent; check blogs are "published" not "draft" |
| Wrong colors/theme | Add `data-theme="light"` or `data-theme="dark"` to force the mode |
| Cards look different from site | Add `data-color="#your-brand-color"` to match your brand |
| Article click goes to wrong URL | Check `data-path` attribute — default is `blog` |
| Widget disappears on React/SPA sites | Normal — the widget has self-healing that recreates itself within 30 seconds |
| "Loading..." forever | Check internet connection; check AINOS server is up; check browser console for errors |
| Want fewer/more blogs | Change `data-limit="3"` or `data-limit="12"` |
| Want list instead of grid | Change `data-style="list"` |
| Want single article embed | Add `data-slug="article-slug"` to the div |

---

## 12. Important Notes

- **No card grid on single-page sites** — the widget automatically creates a flowing section, not a boxed grid
- **Script always goes near footer** — paste before `</body>` or before `<footer>` tag
- **Auto-repositioning** — if pasted after footer, widget moves itself before footer automatically
- **No re-pasting needed** — once code is pasted, all future blogs appear automatically
- **Multi-tenant isolation** — each website only sees its own blogs (based on connected URL)
- **Works with any website builder** — WordPress, Shopify, Wix, Squarespace, Webflow, React, Next.js, plain HTML

// Yurekh AI Website Builder — generation engine
// Generates a complete, self-contained, responsive HTML website from business details.
// Tries free AI (Pollinations) for copywriting, falls back to an industry-aware content engine
// so generation ALWAYS succeeds. Hero/section images come from image.pollinations.ai (free).

export interface SiteBrief {
  businessName: string;
  industry: string;
  description?: string;
  siteType?: string;
  theme?: 'modern' | 'minimal' | 'bold';
  primaryColor?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface SiteContent {
  tagline: string;
  heroHeading: string;
  heroSub: string;
  about: string;
  services: { name: string; desc: string }[];
  features: string[];
  testimonial: { quote: string; author: string };
  cta: string;
}

// ─── Industry-aware fallback content ─────────────────────────────────────────

const INDUSTRY_PACKS: Record<string, Partial<SiteContent>> = {
  restaurant: {
    tagline: 'Taste the difference',
    heroSub: 'Fresh ingredients, authentic recipes and a warm atmosphere — crafted for people who love great food.',
    services: [
      { name: 'Dine-In Experience', desc: 'A welcoming space designed for family dinners, celebrations and everything in between.' },
      { name: 'Online Ordering', desc: 'Your favourite dishes delivered hot to your doorstep in minutes.' },
      { name: 'Private Events', desc: 'Birthdays, corporate dinners and gatherings with custom menus.' },
      { name: 'Chef Specials', desc: 'Seasonal menus curated by our head chef with locally sourced produce.' },
    ],
    features: ['Fresh ingredients daily', 'Hygienic kitchen standards', 'Fast delivery & takeaway'],
  },
  retail: {
    tagline: 'Quality you can trust',
    heroSub: 'Curated products, honest prices and service that keeps customers coming back.',
    services: [
      { name: 'Wide Product Range', desc: 'Carefully selected products across categories to match every need and budget.' },
      { name: 'Fast Shipping', desc: 'Quick, tracked delivery so your order reaches you without the wait.' },
      { name: 'Easy Returns', desc: 'No-questions-asked return policy for complete peace of mind.' },
      { name: 'Member Rewards', desc: 'Earn points on every purchase and unlock exclusive discounts.' },
    ],
    features: ['Genuine products only', 'Secure payments', '7-day easy returns'],
  },
  technology: {
    tagline: 'Build the future, today',
    heroSub: 'Modern software solutions that automate work, cut costs and help your business scale.',
    services: [
      { name: 'Custom Software', desc: 'Tailor-made applications engineered around your exact business workflows.' },
      { name: 'Cloud Solutions', desc: 'Scalable, secure cloud infrastructure that grows with your business.' },
      { name: 'Automation', desc: 'Eliminate repetitive tasks with intelligent workflow automation.' },
      { name: 'Support & Maintenance', desc: '24/7 monitoring, updates and support that keeps you running.' },
    ],
    features: ['Enterprise-grade security', 'Scales with your growth', 'Dedicated support team'],
  },
  health: {
    tagline: 'Your health, our priority',
    heroSub: 'Compassionate, expert care backed by modern facilities and a patient-first approach.',
    services: [
      { name: 'Consultations', desc: 'Expert consultations with experienced practitioners who listen first.' },
      { name: 'Diagnostics', desc: 'Accurate, fast diagnostic services with modern equipment.' },
      { name: 'Preventive Care', desc: 'Health checkups and programs designed to keep you well.' },
      { name: 'Follow-up Support', desc: 'Continuous care with reminders, reports and easy rebooking.' },
    ],
    features: ['Experienced practitioners', 'Modern facilities', 'Patient-first approach'],
  },
  education: {
    tagline: 'Learn. Grow. Succeed.',
    heroSub: 'Practical, engaging learning experiences that turn curiosity into real-world skill.',
    services: [
      { name: 'Expert-Led Courses', desc: 'Structured programs taught by industry practitioners.' },
      { name: 'Hands-On Projects', desc: 'Learn by doing with real projects and personal feedback.' },
      { name: 'Career Guidance', desc: 'Mentorship, mock interviews and placement support.' },
      { name: 'Flexible Learning', desc: 'Study online or in person, at a pace that fits your life.' },
    ],
    features: ['Industry-expert mentors', 'Certificate on completion', 'Lifetime resource access'],
  },
  fashion: {
    tagline: 'Wear your confidence',
    heroSub: 'Contemporary designs and timeless staples, crafted with quality fabrics and attention to detail.',
    services: [
      { name: 'New Collections', desc: 'Fresh seasonal drops that keep your wardrobe ahead of the curve.' },
      { name: 'Custom Fits', desc: 'Made-to-measure tailoring for the perfect silhouette.' },
      { name: 'Style Consultation', desc: 'Personal styling advice to build looks that feel like you.' },
      { name: 'Express Delivery', desc: 'Fast shipping with premium packaging on every order.' },
    ],
    features: ['Premium fabrics', 'Ethically made', 'Easy exchanges'],
  },
  fitness: {
    tagline: 'Stronger every day',
    heroSub: 'Personalised training, expert coaching and a community that keeps you accountable.',
    services: [
      { name: 'Personal Training', desc: 'One-on-one coaching built around your goals and schedule.' },
      { name: 'Group Classes', desc: 'High-energy sessions that make fitness fun and consistent.' },
      { name: 'Nutrition Plans', desc: 'Practical meal guidance that fits your lifestyle.' },
      { name: 'Progress Tracking', desc: 'Measurable milestones so you can see yourself improve.' },
    ],
    features: ['Certified trainers', 'Flexible memberships', 'Results-driven programs'],
  },
  realestate: {
    tagline: 'Find your place',
    heroSub: 'Verified listings, honest guidance and end-to-end support for buying, selling and renting.',
    services: [
      { name: 'Property Listings', desc: 'Handpicked, verified properties across prime locations.' },
      { name: 'Site Visits', desc: 'Guided visits scheduled around your convenience.' },
      { name: 'Legal Assistance', desc: 'Documentation and legal checks handled by experts.' },
      { name: 'Home Loans', desc: 'Loan assistance with the best rates from partner banks.' },
    ],
    features: ['100% verified listings', 'Transparent pricing', 'End-to-end support'],
  },
  beauty: {
    tagline: 'Look good, feel amazing',
    heroSub: 'Premium treatments, skilled professionals and products that care for you.',
    services: [
      { name: 'Hair & Styling', desc: 'Cuts, colour and styling by experienced professionals.' },
      { name: 'Skin Care', desc: 'Facials and treatments customised to your skin type.' },
      { name: 'Bridal Packages', desc: 'Complete bridal looks for your most important day.' },
      { name: 'Spa & Wellness', desc: 'Relaxing therapies that melt the stress away.' },
    ],
    features: ['Certified professionals', 'Premium products', 'Hygienic & safe'],
  },
  agency: {
    tagline: 'Growth, engineered',
    heroSub: 'Strategy, creative and execution that move real business numbers — not vanity metrics.',
    services: [
      { name: 'Brand Strategy', desc: 'Positioning and messaging that make your brand impossible to ignore.' },
      { name: 'Digital Marketing', desc: 'SEO, ads and content engineered for measurable ROI.' },
      { name: 'Design & Creative', desc: 'Scroll-stopping creative across every channel.' },
      { name: 'Analytics & Reporting', desc: 'Clear dashboards that show exactly what is working.' },
    ],
    features: ['ROI-focused campaigns', 'Dedicated account manager', 'Transparent reporting'],
  },
};

const DEFAULT_PACK: Partial<SiteContent> = {
  tagline: 'Built for your success',
  heroSub: 'Quality service, honest pricing and a team that genuinely cares about your experience.',
  services: [
    { name: 'Our Expertise', desc: 'Years of hands-on experience delivering consistent, reliable results.' },
    { name: 'Customer First', desc: 'Every decision starts with what is best for our customers.' },
    { name: 'Fair Pricing', desc: 'Transparent, competitive pricing with no hidden surprises.' },
    { name: 'Always Available', desc: 'Quick responses and support whenever you need us.' },
  ],
  features: ['Trusted by local customers', 'Quality guaranteed', 'Responsive support'],
};

function matchIndustryPack(industry: string): Partial<SiteContent> {
  const s = industry.toLowerCase();
  if (/restaurant|food|cafe|catering|bakery|kitchen/.test(s)) return INDUSTRY_PACKS.restaurant;
  if (/retail|shop|store|ecommerce|e-commerce|grocery/.test(s)) return INDUSTRY_PACKS.retail;
  if (/tech|software|it|saas|app|startup/.test(s)) return INDUSTRY_PACKS.technology;
  if (/health|clinic|hospital|doctor|dental|pharma|medical/.test(s)) return INDUSTRY_PACKS.health;
  if (/educat|school|coach|academy|tutor|training|institute/.test(s)) return INDUSTRY_PACKS.education;
  if (/fashion|clothing|apparel|boutique|garment/.test(s)) return INDUSTRY_PACKS.fashion;
  if (/gym|fitness|yoga|sport/.test(s)) return INDUSTRY_PACKS.fitness;
  if (/real estate|property|builder|construction/.test(s)) return INDUSTRY_PACKS.realestate;
  if (/salon|beauty|spa|makeup|parlour|parlor/.test(s)) return INDUSTRY_PACKS.beauty;
  if (/agency|marketing|consult|advertis|design studio/.test(s)) return INDUSTRY_PACKS.agency;
  return DEFAULT_PACK;
}

function buildFallbackContent(brief: SiteBrief): SiteContent {
  const pack = matchIndustryPack(brief.industry);
  const name = brief.businessName;
  return {
    tagline: pack.tagline || DEFAULT_PACK.tagline!,
    heroHeading: `Welcome to ${name}`,
    heroSub: brief.description?.trim() || pack.heroSub || DEFAULT_PACK.heroSub!,
    about: brief.description?.trim()
      ? `${name} — ${brief.description.trim()} We believe in doing things right: quality work, honest communication and long-term relationships with every customer we serve.`
      : `${name} is a ${brief.industry} business committed to quality, trust and customer happiness. We combine experience with a genuine passion for what we do, so every customer walks away satisfied.`,
    services: (pack.services || DEFAULT_PACK.services!) as { name: string; desc: string }[],
    features: (pack.features || DEFAULT_PACK.features!) as string[],
    testimonial: {
      quote: `Working with ${name} was a fantastic experience. Professional, responsive and the quality exceeded our expectations.`,
      author: 'A happy customer',
    },
    cta: `Ready to get started with ${name}? Reach out today — we would love to hear from you.`,
  };
}

// ─── Optional AI enrichment (free, best-effort with strict timeout) ──────────

async function tryAIContent(brief: SiteBrief): Promise<SiteContent | null> {
  try {
    const prompt =
      `Website copy for "${brief.businessName}" (${brief.industry}). ${brief.description ? 'About: ' + brief.description.slice(0, 200) : ''} ` +
      `Reply ONLY minified JSON: {"tagline":"...","heroHeading":"...","heroSub":"...","about":"...","services":[{"name":"...","desc":"..."}],"features":["..."],"testimonial":{"quote":"...","author":"..."},"cta":"..."} with 4 services, 3 features.`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?json=true`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const text = await res.text();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) return null;
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    if (!parsed.heroHeading || !Array.isArray(parsed.services) || parsed.services.length < 2) return null;
    const fallback = buildFallbackContent(brief);
    return {
      tagline: parsed.tagline || fallback.tagline,
      heroHeading: parsed.heroHeading,
      heroSub: parsed.heroSub || fallback.heroSub,
      about: parsed.about || fallback.about,
      services: parsed.services.slice(0, 6).map((s: { name?: string; desc?: string }) => ({ name: s.name || 'Service', desc: s.desc || '' })),
      features: Array.isArray(parsed.features) && parsed.features.length ? parsed.features.slice(0, 4) : fallback.features,
      testimonial: parsed.testimonial?.quote ? parsed.testimonial : fallback.testimonial,
      cta: parsed.cta || fallback.cta,
    };
  } catch {
    return null;
  }
}

// ─── HTML rendering ──────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function heroImageUrl(brief: SiteBrief): string {
  const p = encodeURIComponent(`professional ${brief.industry} business, modern, high quality photography, ${brief.businessName}`);
  return `https://image.pollinations.ai/prompt/${p}?width=1600&height=900&nologo=true&seed=${Math.floor(Math.random() * 99999)}`;
}

interface ThemeVars { bg: string; surface: string; text: string; muted: string; cardBorder: string; navBg: string; }

const THEMES: Record<string, ThemeVars> = {
  modern: { bg: '#0b0d14', surface: 'rgba(255,255,255,0.05)', text: '#f4f5f7', muted: '#9aa1b1', cardBorder: 'rgba(255,255,255,0.09)', navBg: 'rgba(11,13,20,0.85)' },
  minimal: { bg: '#ffffff', surface: '#f6f7f9', text: '#111318', muted: '#5c6370', cardBorder: '#e6e8ec', navBg: 'rgba(255,255,255,0.9)' },
  bold: { bg: '#12060f', surface: 'rgba(255,255,255,0.06)', text: '#fff5fa', muted: '#c0a5b6', cardBorder: 'rgba(255,255,255,0.12)', navBg: 'rgba(18,6,15,0.88)' },
};

export function renderSiteHTML(brief: SiteBrief, content: SiteContent): string {
  const theme = THEMES[brief.theme || 'modern'] || THEMES.modern;
  const accent = brief.primaryColor || '#6d5df6';
  const name = esc(brief.businessName);
  const year = new Date().getFullYear();
  const heroImg = heroImageUrl(brief);
  const contact = [
    brief.email ? `<a href="mailto:${esc(brief.email)}">${esc(brief.email)}</a>` : '',
    brief.phone ? `<a href="tel:${esc(brief.phone)}">${esc(brief.phone)}</a>` : '',
    brief.address ? `<span>${esc(brief.address)}</span>` : '',
  ].filter(Boolean).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${name} — ${esc(content.tagline)}</title>
<meta name="description" content="${esc(content.heroSub.slice(0, 155))}" />
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--accent:${accent}}
html{scroll-behavior:smooth}
body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:${theme.bg};color:${theme.text};line-height:1.6}
a{color:inherit;text-decoration:none}
.container{max-width:1100px;margin:0 auto;padding:0 20px}
nav{position:fixed;top:0;left:0;right:0;z-index:50;background:${theme.navBg};backdrop-filter:blur(14px);border-bottom:1px solid ${theme.cardBorder}}
nav .container{display:flex;align-items:center;justify-content:space-between;height:64px}
.logo{font-weight:800;font-size:1.15rem;letter-spacing:.5px}
.logo span{color:var(--accent)}
.nav-links{display:flex;gap:26px;font-size:.9rem}
.nav-links a{color:${theme.muted};transition:color .2s}
.nav-links a:hover{color:var(--accent)}
.btn{display:inline-block;background:linear-gradient(135deg,var(--accent),color-mix(in srgb,var(--accent) 60%,#fff 15%));color:#fff;padding:13px 30px;border-radius:12px;font-weight:600;font-size:.95rem;transition:transform .2s,box-shadow .2s;box-shadow:0 8px 24px color-mix(in srgb,var(--accent) 40%,transparent)}
.btn:hover{transform:translateY(-2px)}
header{position:relative;min-height:92vh;display:flex;align-items:center;padding:120px 0 80px;overflow:hidden}
.hero-bg{position:absolute;inset:0;background:url('${heroImg}') center/cover no-repeat;opacity:.22}
.hero-fade{position:absolute;inset:0;background:linear-gradient(180deg,transparent,${theme.bg} 96%)}
.hero-inner{position:relative;max-width:720px}
.eyebrow{display:inline-block;color:var(--accent);font-size:.8rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;margin-bottom:18px}
h1{font-size:clamp(2.2rem,6vw,3.8rem);line-height:1.12;font-weight:800;margin-bottom:20px}
h1 em{font-style:normal;color:var(--accent)}
.hero-sub{color:${theme.muted};font-size:1.1rem;max-width:560px;margin-bottom:34px}
section{padding:88px 0}
.sec-label{color:var(--accent);font-size:.78rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;margin-bottom:12px}
h2{font-size:clamp(1.6rem,4vw,2.3rem);font-weight:800;margin-bottom:16px}
.about-text{color:${theme.muted};max-width:720px;font-size:1.05rem}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;margin-top:40px}
.card{background:${theme.surface};border:1px solid ${theme.cardBorder};border-radius:18px;padding:28px;transition:transform .25s,border-color .25s}
.card:hover{transform:translateY(-5px);border-color:var(--accent)}
.card .num{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,var(--accent),color-mix(in srgb,var(--accent) 55%,#fff 20%));display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;margin-bottom:18px}
.card h3{font-size:1.05rem;margin-bottom:8px}
.card p{color:${theme.muted};font-size:.92rem}
.features{display:flex;flex-wrap:wrap;gap:14px;margin-top:32px}
.chip{background:${theme.surface};border:1px solid ${theme.cardBorder};border-radius:999px;padding:10px 22px;font-size:.9rem;display:flex;align-items:center;gap:8px}
.chip::before{content:'✓';color:var(--accent);font-weight:800}
.quote-card{background:${theme.surface};border:1px solid ${theme.cardBorder};border-left:4px solid var(--accent);border-radius:18px;padding:36px;max-width:760px;margin-top:36px}
.quote-card p{font-size:1.12rem;font-style:italic;margin-bottom:16px}
.quote-card cite{color:${theme.muted};font-style:normal;font-size:.9rem}
.cta-band{background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 22%,${theme.bg}),${theme.bg});border:1px solid ${theme.cardBorder};border-radius:24px;padding:56px 36px;text-align:center}
.cta-band p{color:${theme.muted};max-width:520px;margin:0 auto 30px}
.contact-links{display:flex;flex-wrap:wrap;gap:20px;justify-content:center;margin-top:26px;color:${theme.muted};font-size:.95rem}
.contact-links a:hover{color:var(--accent)}
footer{border-top:1px solid ${theme.cardBorder};padding:34px 0;text-align:center;color:${theme.muted};font-size:.85rem}
footer b{color:var(--accent)}
@media(max-width:640px){.nav-links{display:none}section{padding:60px 0}}
</style>
</head>
<body>
<nav><div class="container">
  <div class="logo">${name.split(' ')[0]}<span>${name.split(' ').length > 1 ? ' ' + name.split(' ').slice(1).join(' ') : '.'}</span></div>
  <div class="nav-links"><a href="#about">About</a><a href="#services">Services</a><a href="#why">Why Us</a><a href="#contact">Contact</a></div>
  <a class="btn" style="padding:10px 22px;font-size:.85rem" href="#contact">Get in Touch</a>
</div></nav>

<header>
  <div class="hero-bg"></div><div class="hero-fade"></div>
  <div class="container hero-inner">
    <span class="eyebrow">${esc(content.tagline)}</span>
    <h1>${esc(content.heroHeading).replace(esc(brief.businessName), `<em>${name}</em>`)}</h1>
    <p class="hero-sub">${esc(content.heroSub)}</p>
    <a class="btn" href="#contact">Get Started →</a>
  </div>
</header>

<section id="about"><div class="container">
  <p class="sec-label">About Us</p>
  <h2>Who we are</h2>
  <p class="about-text">${esc(content.about)}</p>
</div></section>

<section id="services"><div class="container">
  <p class="sec-label">What We Offer</p>
  <h2>Our Services</h2>
  <div class="grid">
    ${content.services.map((s, i) => `<div class="card"><div class="num">${String(i + 1).padStart(2, '0')}</div><h3>${esc(s.name)}</h3><p>${esc(s.desc)}</p></div>`).join('\n    ')}
  </div>
</div></section>

<section id="why"><div class="container">
  <p class="sec-label">Why Choose Us</p>
  <h2>Built on trust</h2>
  <div class="features">
    ${content.features.map((f) => `<div class="chip">${esc(f)}</div>`).join('\n    ')}
  </div>
  <div class="quote-card"><p>“${esc(content.testimonial.quote)}”</p><cite>— ${esc(content.testimonial.author)}</cite></div>
</div></section>

<section id="contact"><div class="container">
  <div class="cta-band">
    <h2>Let's work together</h2>
    <p>${esc(content.cta)}</p>
    ${brief.email ? `<a class="btn" href="mailto:${esc(brief.email)}">Contact Us</a>` : `<a class="btn" href="#top">Contact Us</a>`}
    ${contact ? `<div class="contact-links">${contact}</div>` : ''}
  </div>
</div></section>

<footer><div class="container">© ${year} ${name}. All rights reserved. · Built with <b>AINOS</b> by Yurekh Solutions</div></footer>
</body>
</html>`;
}

export async function generateSite(brief: SiteBrief): Promise<{ html: string; content: SiteContent; aiUsed: boolean }> {
  const aiContent = await tryAIContent(brief);
  const content = aiContent || buildFallbackContent(brief);
  return { html: renderSiteHTML(brief, content), content, aiUsed: !!aiContent };
}

// AINOS AI Tool Studio — execution engines
// Every Yurekh service is DONE by an AINOS tool: the engine produces the actual
// deliverable (logos, brand kits, social content, SEO packs, emails, press releases,
// posters, QR codes, launch blueprints). Deterministic quality output guaranteed,
// with best-effort free AI enrichment on top.

export type ToolId = 'logo' | 'brandkit' | 'social' | 'content' | 'seo' | 'email' | 'pr' | 'launch' | 'poster' | 'qr';

export interface ToolSection { title: string; body: string; }
export interface ToolImage { label: string; url: string; }
export interface ToolSwatch { hex: string; name: string; }
export interface ToolOutput {
  headline: string;
  sections?: ToolSection[];
  images?: ToolImage[];
  palette?: ToolSwatch[];
  aiUsed?: boolean;
}

type Inputs = Record<string, string>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function seedFrom(s: string): number {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}
function pick<T>(arr: T[], seed: number, salt = 0): T { return arr[(seed + salt) % arr.length]; }

function img(prompt: string, w = 1024, h = 1024): string {
  const seed = Math.floor(Math.random() * 100000);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true&seed=${seed}`;
}

async function aiJson(prompt: string): Promise<Record<string, unknown> | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?json=true`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const text = await res.text();
    const a = text.indexOf('{');
    const b = text.lastIndexOf('}');
    if (a === -1 || b === -1) return null;
    return JSON.parse(text.slice(a, b + 1));
  } catch { return null; }
}

// ─── Color utilities (brand kit) ─────────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0; const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, s, l];
}
function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360; s = Math.min(1, Math.max(0, s)); l = Math.min(1, Math.max(0, l));
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

// ─── Tool: AI Logo Designer ──────────────────────────────────────────────────

function runLogo(i: Inputs): ToolOutput {
  const name = i.businessName, ind = i.industry || 'business';
  const colors = i.colors || 'brand colors';
  const base = `logo design for "${name}", ${ind} company, ${colors}, vector style, clean white background, professional, high quality, centered`;
  return {
    headline: `4 logo concepts for ${name}`,
    images: [
      { label: 'Minimalist', url: img(`minimalist flat ${base}`, 1024, 1024) },
      { label: 'Modern Gradient', url: img(`modern gradient geometric ${base}`, 1024, 1024) },
      { label: 'Emblem / Badge', url: img(`emblem badge crest ${base}`, 1024, 1024) },
      { label: 'Monogram', url: img(`elegant monogram lettermark ${base}`, 1024, 1024) },
    ],
    sections: [
      { title: 'How to use', body: 'Click any concept to open it full size, then right-click → Save Image. Use "Regenerate" for 4 fresh concepts. For print-ready vector files (SVG/AI) and trademark-safe refinement, the Yurekh design team can finalize your favourite concept.' },
    ],
  };
}

// ─── Tool: Brand Kit Generator ───────────────────────────────────────────────

async function runBrandkit(i: Inputs): Promise<ToolOutput> {
  const name = i.businessName, ind = i.industry || 'business';
  const seed = seedFrom(name + ind);
  const base = /^#[0-9a-fA-F]{6}$/.test(i.primaryColor || '') ? i.primaryColor : pick(['#6d5df6', '#1BE1D3', '#f43f5e', '#0ea5e9', '#f59e0b'], seed);
  const [h, s] = hexToHsl(base);
  const palette: ToolSwatch[] = [
    { hex: base, name: 'Primary' },
    { hex: hslToHex(h, Math.min(1, s + 0.08), 0.32), name: 'Primary Dark' },
    { hex: hslToHex(h, s * 0.85, 0.9), name: 'Primary Tint' },
    { hex: hslToHex(h + 180, Math.max(0.35, s * 0.8), 0.55), name: 'Accent' },
    { hex: hslToHex(h, 0.12, 0.14), name: 'Ink' },
    { hex: hslToHex(h, 0.1, 0.97), name: 'Paper' },
  ];
  const voices = [
    ['Confident', 'Warm', 'Clear'], ['Bold', 'Direct', 'Energetic'], ['Premium', 'Refined', 'Assured'],
    ['Friendly', 'Practical', 'Trustworthy'], ['Innovative', 'Sharp', 'Optimistic'],
  ];
  const voice = pick(voices, seed, 3);
  let taglines = [
    `${name}. Built different.`, `Where ${ind} meets excellence.`, `${name} — quality you can feel.`,
    `The smarter way to ${ind}.`, `${name}. Trusted, always.`,
  ];
  const ai = await aiJson(`5 short catchy taglines for "${name}" (${ind}). JSON only: {"taglines":["..."]}`);
  let aiUsed = false;
  if (ai && Array.isArray(ai.taglines) && ai.taglines.length >= 3) { taglines = (ai.taglines as string[]).slice(0, 5); aiUsed = true; }
  return {
    headline: `Brand kit for ${name}`,
    palette,
    aiUsed,
    sections: [
      { title: 'Tagline options', body: taglines.map((t, n) => `${n + 1}. ${t}`).join('\n') },
      { title: 'Brand voice', body: `${voice.join(' · ')}\n\nSpeak like a knowledgeable friend: short sentences, active voice, zero jargon. Lead with the customer's outcome, close with a clear next step.` },
      { title: 'Typography pairing', body: pick([
        'Headings: Poppins (SemiBold) · Body: Inter (Regular)\nGeometric warmth for headings, neutral clarity for reading.',
        'Headings: Playfair Display (Bold) · Body: Lato (Regular)\nEditorial elegance paired with friendly readability.',
        'Headings: Montserrat (Bold) · Body: Open Sans (Regular)\nModern confidence with a proven workhorse body font.',
      ], seed, 5) },
      { title: 'Logo usage rules', body: '• Keep clear space equal to the logo height on all sides\n• Never stretch, rotate or add shadows\n• Use Primary on light backgrounds, Paper on dark\n• Minimum size: 32px digital / 12mm print' },
      { title: 'Mission statement', body: `${name} exists to make ${ind} simpler, better and more human — delivering consistent quality that customers recommend without being asked.` },
    ],
  };
}

// ─── Tool: Social Media Content Engine ───────────────────────────────────────

async function runSocial(i: Inputs): Promise<ToolOutput> {
  const name = i.businessName, ind = i.industry || 'business';
  const platform = i.platform || 'Instagram';
  const topic = i.topic || `${ind} tips and services`;
  const tag = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const hashtags = `#${tag(name)} #${tag(ind)} #${tag(ind)}life #smallbusiness #growth`;
  let posts: { day: string; type: string; caption: string }[] = [
    { day: 'Mon', type: 'Value tip', caption: `💡 One thing most people get wrong about ${ind}: they wait too long to start. Here's the fix — start small, stay consistent, and let ${name} handle the hard part.` },
    { day: 'Tue', type: 'Behind the scenes', caption: `A peek behind the curtain at ${name} 👀 This is how we prepare ${topic} for our customers — no shortcuts, just care.` },
    { day: 'Wed', type: 'Social proof', caption: `"Working with ${name} was the best decision we made this year." — a happy customer. Results speak louder than ads. 🙌` },
    { day: 'Thu', type: 'Engagement question', caption: `Quick question: what's the #1 thing you look for when choosing a ${ind} partner — price, speed, or quality? Tell us below 👇` },
    { day: 'Fri', type: 'Service spotlight', caption: `Spotlight: ${topic} ✨ Done-for-you, done right. DM us "START" and we'll take it from there.` },
    { day: 'Sat', type: 'Educational carousel', caption: `Save this 📌 5 things every ${ind} customer should know before spending a rupee. Swipe through — number 4 surprises everyone.` },
    { day: 'Sun', type: 'Brand story', caption: `Why ${name} exists: we saw ${ind} done badly too many times — overpromised, underdelivered. So we built the opposite. That's the whole story. ❤️` },
  ];
  const ai = await aiJson(`7 short ${platform} captions for "${name}" (${ind}), topic: ${topic.slice(0, 60)}. JSON: {"posts":[{"day":"Mon","type":"...","caption":"..."}]}`);
  let aiUsed = false;
  if (ai && Array.isArray(ai.posts) && ai.posts.length >= 5) {
    posts = (ai.posts as typeof posts).slice(0, 7).map((p, n) => ({ day: p.day || posts[n]?.day || `Day ${n + 1}`, type: p.type || 'Post', caption: p.caption || '' }));
    aiUsed = true;
  }
  return {
    headline: `7-day ${platform} content plan for ${name}`,
    aiUsed,
    sections: [
      ...posts.map((p) => ({ title: `${p.day} — ${p.type}`, body: `${p.caption}\n\n${hashtags}` })),
      { title: 'Posting strategy', body: `• Best times for ${platform}: 11:30am & 7:30pm local\n• Reply to every comment within 2 hours on posting day\n• Repost the best performer as a story after 48 hours\n• Track saves & shares — they beat likes as a growth signal` },
    ],
    images: [
      { label: 'Creative 1', url: img(`social media post graphic for ${ind} brand ${name}, ${topic}, modern flat design, bold typography space`, 1024, 1024) },
      { label: 'Creative 2', url: img(`aesthetic ${ind} photography for ${name} social media, professional, vibrant`, 1024, 1024) },
    ],
  };
}

// ─── Tool: Content & Ad Copy Writer ──────────────────────────────────────────

async function runContent(i: Inputs): Promise<ToolOutput> {
  const name = i.businessName, ind = i.industry || 'business';
  const topic = i.topic || `How ${name} delivers better ${ind}`;
  const kind = i.contentType === 'ad' ? 'ad' : 'blog';
  if (kind === 'ad') {
    let variants = [
      { headline: `${topic} — without the usual headache`, body: `Most ${ind} providers overpromise. ${name} just delivers: transparent pricing, real timelines, work you'll actually show off. Get your free quote today.`, cta: 'Get Free Quote' },
      { headline: `Still settling for average ${ind}?`, body: `Your competitors aren't. ${name} combines speed and craft so you launch faster and look better doing it. Limited slots this month.`, cta: 'Claim Your Slot' },
      { headline: `${name}: the ${ind} partner people recommend`, body: `No lock-ins. No jargon. Just results you can measure and a team that picks up the phone. See why customers stay for years.`, cta: 'Start Today' },
    ];
    const ai = await aiJson(`3 ad copy variants for "${name}" (${ind}), topic: ${topic.slice(0, 60)}. JSON: {"variants":[{"headline":"...","body":"...","cta":"..."}]}`);
    let aiUsed = false;
    if (ai && Array.isArray(ai.variants) && ai.variants.length >= 2) { variants = (ai.variants as typeof variants).slice(0, 3); aiUsed = true; }
    return {
      headline: `Ad copy pack: ${topic}`,
      aiUsed,
      sections: variants.map((v, n) => ({ title: `Variant ${n + 1}: ${v.headline}`, body: `${v.body}\n\nCTA button: ${v.cta}` })),
    };
  }
  const kw = i.keywords ? `\n\nTarget keywords woven in: ${i.keywords}` : '';
  const sections: ToolSection[] = [
    { title: topic, body: `If you've been researching ${ind} lately, you've probably noticed the same thing we did: plenty of promises, very little clarity. This guide cuts through it — what actually matters, what to avoid, and how ${name} approaches it differently.${kw}` },
    { title: `Why ${ind} goes wrong for most businesses`, body: `The most common failure isn't budget — it's misalignment. Providers optimise for deliverables; businesses need outcomes. The result is work that looks finished but doesn't move a single number.\n\nBefore committing to anything, write down the one metric this work must improve. If a provider can't explain how they'll move it, keep looking.` },
    { title: `What great ${ind} actually looks like`, body: `Three markers separate great from average:\n\n1. Clarity first — a scoped plan you understand before work begins\n2. Proof over polish — measurable checkpoints, not just pretty updates\n3. Ownership — one accountable person, not a rotating cast\n\nAt ${name}, these aren't values on a wall; they're how projects are run day to day.` },
    { title: 'How to get started (this week)', body: `• Define the single outcome you want in 90 days\n• Gather what you already have — assets, access, past results\n• Book a short scoping conversation before any commitment\n\nThe businesses that win at ${ind} aren't the ones that spend most — they're the ones that start with clarity.` },
    { title: 'Final word', body: `${topic} doesn't need to be complicated. With the right partner and a clear metric, most businesses see meaningful movement within one quarter. When you're ready, ${name} is built for exactly this.` },
  ];
  return { headline: `Article draft: ${topic}`, sections };
}

// ─── Tool: SEO Toolkit ───────────────────────────────────────────────────────

function runSeo(i: Inputs): ToolOutput {
  const name = i.businessName, ind = i.industry || 'business';
  const topic = i.pageTopic || `${ind} services`;
  const loc = i.location || '';
  const locSuffix = loc ? ` in ${loc}` : '';
  const kwBase = [topic, `best ${topic}${locSuffix}`, `${topic} near me`, `affordable ${topic}${locSuffix}`, `${topic} pricing`, `top ${ind} company${locSuffix}`, `${ind} services${locSuffix}`, `${name.toLowerCase()}`, `hire ${topic}`, `${topic} for small business`, `professional ${topic}`, `${topic} reviews`];
  const extra = (i.keywords || '').split(',').map((s) => s.trim()).filter(Boolean);
  return {
    headline: `SEO pack: ${topic}${locSuffix}`,
    sections: [
      { title: 'Meta titles (pick one, ≤60 chars)', body: [`${topic.charAt(0).toUpperCase() + topic.slice(1)}${locSuffix} | ${name}`, `Best ${topic}${locSuffix} — ${name}`, `${name}: Professional ${topic}${locSuffix}`].map((t, n) => `${n + 1}. ${t}  (${t.length} chars)`).join('\n') },
      { title: 'Meta descriptions (≤155 chars)', body: [`Looking for ${topic}${locSuffix}? ${name} delivers quality, transparent pricing and fast turnaround. Get your free consultation today.`, `${name} offers professional ${topic}${locSuffix} trusted by growing businesses. Clear pricing, real results. Contact us now.`].map((d, n) => `${n + 1}. ${d}`).join('\n\n') },
      { title: 'Target keywords', body: [...extra, ...kwBase].slice(0, 14).map((k) => `• ${k}`).join('\n') },
      { title: 'On-page checklist', body: `☐ One H1 containing "${topic}"\n☐ Keyword in first 100 words + URL slug\n☐ 3+ internal links, 2+ authority outbound links\n☐ Image alt text with descriptive keywords\n☐ FAQ section targeting "People also ask" queries\n☐ LocalBusiness schema${loc ? ` with ${loc} address` : ''}\n☐ Page loads under 2.5s (compress images to WebP)\n☐ Mobile-first: tap targets ≥44px, no horizontal scroll` },
      { title: 'Content plan (next 30 days)', body: `Week 1: Pillar page — "${topic}: complete guide"\nWeek 2: Comparison post — "${topic} vs alternatives"\nWeek 3: Case study or before/after with real numbers\nWeek 4: FAQ roundup answering the 8 most-searched questions` },
    ],
  };
}

// ─── Tool: Email Campaign Writer ─────────────────────────────────────────────

async function runEmail(i: Inputs): Promise<ToolOutput> {
  const name = i.businessName, ind = i.industry || 'business';
  const goal = i.goal || 'promotion';
  const audience = i.audience || 'customers';
  const offer = i.offer || `our ${ind} services`;
  let subjects = [`${name}: something you'll actually want to open`, `A quick one about ${offer}`, `We made this for you (really)`];
  let body = `Hi {{first_name}},\n\nMost ${ind} emails are noise. We'll keep this one short.\n\n${name} is offering ${offer} — built specifically for ${audience} who want results without the runaround.\n\nHere's what you get:\n• Straight answers and transparent pricing\n• A dedicated point of contact (a human, with a name)\n• Work delivered when we say it will be\n\nIf that sounds like what you've been looking for, hit reply or grab a time below. No pressure, no spam-followups.\n\n👉 [Get started]\n\n— The ${name} team\n\nP.S. Reply "STOP" anytime and we'll never email you again. We mean it.`;
  const ai = await aiJson(`Email for "${name}" (${ind}), goal: ${goal}, audience: ${audience}, offer: ${offer.slice(0, 50)}. JSON: {"subjects":["3 subject lines"],"body":"email body"}`);
  let aiUsed = false;
  if (ai && Array.isArray(ai.subjects) && typeof ai.body === 'string' && ai.body.length > 100) {
    subjects = (ai.subjects as string[]).slice(0, 3); body = ai.body; aiUsed = true;
  }
  return {
    headline: `${goal.charAt(0).toUpperCase() + goal.slice(1)} email for ${name}`,
    aiUsed,
    sections: [
      { title: 'Subject lines (A/B/C test)', body: subjects.map((s, n) => `${'ABC'[n]}: ${s}`).join('\n') },
      { title: 'Preview text', body: `The short version: ${offer} for ${audience} — minus the usual hassle.` },
      { title: 'Email body', body },
      { title: 'Send strategy', body: '• Send Tue–Thu, 10am or 2pm recipient time\n• A/B test subjects on 20% of the list, send winner to the rest\n• Resend to non-openers after 72h with subject C\n• One CTA per email — never more' },
    ],
  };
}

// ─── Tool: Press Release Generator ───────────────────────────────────────────

async function runPr(i: Inputs): Promise<ToolOutput> {
  const name = i.businessName;
  const announcement = i.announcement || `${name} announces expanded services`;
  const person = i.spokesperson || `the founder of ${name}`;
  const city = i.city || 'INDIA';
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  let quote = `"This is a milestone we've been building toward for a long time. Our customers asked, and we listened — this is for them," said ${person}.`;
  let lead = `${name} today announced ${announcement.toLowerCase().startsWith(name.toLowerCase()) ? announcement.slice(name.length).replace(/^\s*(announces|launches)?\s*/i, '') : announcement}. The move underscores the company's commitment to raising the standard in its industry and delivering more value to the customers it serves.`;
  const ai = await aiJson(`Press release lead paragraph + spokesperson quote. Company: "${name}". News: ${announcement.slice(0, 100)}. JSON: {"lead":"...","quote":"..."}`);
  let aiUsed = false;
  if (ai && typeof ai.lead === 'string' && typeof ai.quote === 'string') { lead = ai.lead; quote = `"${(ai.quote as string).replace(/^"|"$/g, '')}" said ${person}.`; aiUsed = true; }
  return {
    headline: `Press release: ${announcement}`,
    aiUsed,
    sections: [
      { title: 'FOR IMMEDIATE RELEASE', body: `${announcement.toUpperCase()}\n\n${city.toUpperCase()}, ${date} — ${lead}` },
      { title: 'Spokesperson quote', body: quote },
      { title: 'Body', body: `The announcement follows a period of sustained growth for ${name}, driven by customer demand and consistent delivery. Early response from customers and partners has been strongly positive.\n\nCustomers can learn more or get started by contacting ${name} directly.` },
      { title: 'Boilerplate', body: `About ${name}:\n${name} is committed to delivering dependable, high-quality service with transparent pricing and a customer-first approach. For more information, contact the team.` },
      { title: 'Media contact', body: `${person}\n${name}\nEmail: [press contact email]\nPhone: [phone number]` },
      { title: 'Distribution tips', body: '• Send to local business journalists Tue–Thu mornings\n• Personalise the first line of every pitch email\n• Attach one high-res image (your logo or product shot)\n• Follow up once after 3 days — never more' },
    ],
  };
}

// ─── Tool: Launch / Project Blueprint ────────────────────────────────────────

function runLaunch(i: Inputs): ToolOutput {
  const name = i.businessName;
  const product = i.productName || 'your product';
  const budget = i.budgetLevel || 'lean';
  const budgetNote = budget === 'premium' ? 'Premium budget: add influencer seeding, PR agency outreach and a launch event.' : budget === 'standard' ? 'Standard budget: prioritise paid social + email; skip the event, do a live stream instead.' : 'Lean budget: organic social + email + founder-led outreach. Spend only on 2–3 boosted posts.';
  return {
    headline: `Launch blueprint: ${product}`,
    sections: [
      { title: 'Phase 1 — Research & positioning (Weeks 1-2)', body: `• Interview 5 target customers: what they use today, what frustrates them\n• Map 3 competitors: pricing, promise, weakness\n• Write the one-line positioning: "${product} helps [audience] get [outcome] without [pain]"\n• Set the single success metric for launch (signups, orders, bookings)` },
      { title: 'Phase 2 — Pre-launch (Weeks 3-4)', body: `• Build the landing page (use the AINOS AI Website Builder — it takes a minute)\n• Start a waitlist with an incentive for early birds\n• Prepare 10 social posts + 3 emails (AINOS tools generate these)\n• Line up 5 friendly customers for day-one testimonials` },
      { title: 'Phase 3 — Launch week', body: `• Day 1: announcement everywhere at 10am + email blast\n• Day 2-3: share behind-the-scenes and early reactions\n• Day 4: publish first testimonial + FAQ post\n• Day 5-7: retarget visitors, personally reply to every comment/DM` },
      { title: 'Phase 4 — Post-launch (Weeks 6-8)', body: `• Review the metric weekly against target\n• Double down on the single best-performing channel\n• Collect and publish 3 case studies\n• Run a "we listened" update announcing improvements from feedback` },
      { title: 'Budget guidance', body: budgetNote },
      { title: 'Risks to avoid', body: `• Launching without a working way to take payment/bookings\n• Spreading across 5 channels instead of winning 2\n• Silence after launch week — momentum dies in the follow-through\n• ${name} specific: keep brand voice consistent across every asset (see your AINOS Brand Kit)` },
    ],
  };
}

// ─── Tool: Poster / Print Creative Maker ─────────────────────────────────────

function runPoster(i: Inputs): ToolOutput {
  const name = i.businessName, ind = i.industry || 'business';
  const message = i.message || `${name} — quality ${ind}`;
  const style = i.style || 'modern';
  const base = `${style} poster design for ${ind} brand "${name}", theme: ${message}, professional print advertisement, bold composition, space for headline text, high quality`;
  return {
    headline: `Print creatives: ${message}`,
    images: [
      { label: 'Poster A4 (portrait)', url: img(base, 1024, 1448) },
      { label: 'Flyer (square)', url: img(`${base}, flyer layout`, 1024, 1024) },
      { label: 'Banner (landscape)', url: img(`${base}, wide banner billboard layout`, 1536, 640) },
      { label: 'Story / Standee', url: img(`${base}, vertical standee layout`, 768, 1344) },
    ],
    sections: [
      { title: 'Print specs', body: '• Posters: export at 300 DPI, CMYK, 3mm bleed\n• A4 = 210×297mm · Standee = 850×2000mm · Billboard: consult printer\n• Keep headline ≥72pt and readable from 3 meters\n• For final print-ready files with your exact copy overlaid, the Yurekh design team can finish any concept.' },
    ],
  };
}

// ─── Tool: QR Code Generator (fully working, free) ───────────────────────────

function runQr(i: Inputs): ToolOutput {
  const data = i.qrData || 'https://yurekh.com';
  const color = /^#[0-9a-fA-F]{6}$/.test(i.qrColor || '') ? (i.qrColor as string).slice(1) : '000000';
  const enc = encodeURIComponent(data);
  return {
    headline: `QR code ready`,
    images: [
      { label: 'Standard 500px', url: `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${enc}&color=${color}` },
      { label: 'High-res 1000px (print)', url: `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${enc}&color=${color}&margin=20` },
    ],
    sections: [
      { title: 'Encoded content', body: data },
      { title: 'Usage tips', body: '• Test the code with 2-3 different phones before printing\n• Keep a quiet white margin around the code\n• Minimum print size: 2×2 cm for close scanning, 10×10 cm for posters\n• Dark code on light background scans most reliably' },
    ],
  };
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────

export async function runTool(tool: ToolId, inputs: Inputs): Promise<ToolOutput> {
  switch (tool) {
    case 'logo': return runLogo(inputs);
    case 'brandkit': return runBrandkit(inputs);
    case 'social': return runSocial(inputs);
    case 'content': return runContent(inputs);
    case 'seo': return runSeo(inputs);
    case 'email': return runEmail(inputs);
    case 'pr': return runPr(inputs);
    case 'launch': return runLaunch(inputs);
    case 'poster': return runPoster(inputs);
    case 'qr': return runQr(inputs);
    default: throw new Error('Unknown tool');
  }
}

export const TOOL_IDS: ToolId[] = ['logo', 'brandkit', 'social', 'content', 'seo', 'email', 'pr', 'launch', 'poster', 'qr'];

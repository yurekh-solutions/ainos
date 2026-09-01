// Seed 4 premium SEO/AEO blog posts with real Pexels featured images.
// Usage: node seed-blogs.cjs  (run from ainos/ folder)
const fs = require('fs');
const path = require('path');

// Load env
const envText = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const grab = (k) => {
  const m = envText.match(new RegExp('^' + k + '="?(.+?)"?\\s*$', 'm'));
  return m ? m[1] : '';
};
process.env.DATABASE_URL = grab('DATABASE_URL');
const PEXELS_KEY = grab('PEXELS_API_KEY');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function pexelsImage(query, seedStr) {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const photos = data.photos || [];
    if (!photos.length) return null;
    const seed = seedStr.length + seedStr.charCodeAt(0);
    const pick = photos[seed % photos.length];
    return pick.src.large || pick.src.landscape || null;
  } catch { return null; }
}

const BLOGS = [
  {
    title: 'AI Automation for Small Business: The Complete 2026 Guide',
    slug: 'ai-automation-for-small-business-2026-guide',
    category: 'AI & Automation',
    tags: ['ai automation', 'small business', 'productivity', 'ai tools', 'business growth'],
    pexels: 'artificial intelligence technology business',
    excerpt: 'Discover how AI automation helps small businesses save 20+ hours a week. Learn the 7 highest-impact use cases, a 5-step starter plan, and mistakes to avoid in 2026.',
    content: `# AI Automation for Small Business: The Complete 2026 Guide

Small business owners lose more than 20 hours every week to repetitive tasks - invoicing, follow-ups, data entry, social posting, and reporting. AI automation removes that burden. In 2026, automation is no longer an enterprise luxury; it is the fastest-growing competitive advantage for small teams.

This guide explains what AI automation really means, the seven use cases with the highest return, and a practical 5-step plan to start this month.

## What Is AI Automation (and How Is It Different from Old Tools)?

Traditional automation follows fixed rules: "if this, then that." AI automation understands context. It can draft a reply to a customer, summarise a sales call, predict which invoice will be paid late, and write a follow-up email in your brand voice - without being told every step.

In short: old tools execute instructions; AI tools execute outcomes.

## Why 2026 Is the Tipping Point

- AI tools now cost less per month than one hour of manual admin work.
- Customers expect instant responses - businesses that reply in minutes win the deal.
- Search engines and AI assistants reward businesses that publish consistent, helpful content.
- No-code platforms mean you need zero technical staff to automate workflows.

The businesses that automate now build a compounding advantage: faster replies, cleaner data, and more time for selling.

## The 7 Highest-Impact AI Automation Use Cases

### 1. Automated Invoicing and Payment Reminders
Generate GST-ready invoices the moment a job is done, send them on WhatsApp or email, and let polite AI reminders chase late payments. Businesses using automated reminders get paid 30-40% faster.

### 2. Lead Follow-Up Within 5 Minutes
Leads contacted within 5 minutes are dramatically more likely to convert. An AI assistant can instantly respond to every enquiry from your website, Instagram, or WhatsApp - day or night.

### 3. Customer Support That Never Sleeps
An AI trained on your FAQs can answer 70-80% of routine questions instantly and hand the rest to your team with full context.

### 4. Content and Blog Publishing on Autopilot
Consistent blogging is one of the strongest SEO signals, yet most businesses publish rarely. AI can research, draft, and schedule one high-quality article daily - keeping your website fresh for Google.

### 5. Social Media Management
AI can plan a month of posts, write captions in your tone, and schedule them across platforms in one sitting.

### 6. Smart Reports and Insights
Instead of digging through spreadsheets, ask in plain language: "Which product earned the most this month?" and get an instant answer with charts.

### 7. Appointment and Task Scheduling
Self-booking links, automatic confirmations, and reminder messages cut no-shows by up to half.

## How to Start: A 5-Step Plan for This Month

1. **List your repetitive tasks.** Track one week and write down everything you do more than twice.
2. **Pick one revenue-critical workflow.** Usually invoicing or lead follow-up.
3. **Choose one platform, not ten tools.** A single business suite with built-in AI avoids app chaos.
4. **Automate, then review.** Let AI handle the first pass; you approve until you trust it.
5. **Measure and expand.** Track hours saved and response time, then automate the next workflow.

## Common Mistakes to Avoid

- Automating a broken process - fix the workflow first.
- Using ten disconnected tools instead of one integrated suite.
- Setting and forgetting - review AI output weekly for the first month.
- Ignoring your customer's language - automation should sound like you, not a robot.

## Frequently Asked Questions

### Is AI automation affordable for small businesses?
Yes. Most AI business suites cost less than a single day of manual admin work per month, and the time saved usually pays for the tool in the first week.

### Do I need technical skills to set it up?
No. Modern platforms are no-code. If you can use WhatsApp and email, you can configure automations.

### Will AI replace my staff?
No - it replaces repetitive tasks, not people. Your team spends time on customers and growth instead of data entry.

### How long does setup take?
A basic setup (invoicing + follow-ups) typically takes one afternoon. Fuller automation rolls out over 2-4 weeks.

## The Bottom Line

AI automation in 2026 is like having a disciplined back office that works 24/7. Start with one workflow this month, measure the hours you save, and reinvest that time into selling. The compounding effect over a year is the difference between running your business and being run by it.`
  },
  {
    title: 'How to Rank on Google in 2026: The SEO + AEO Strategy That Actually Works',
    slug: 'how-to-rank-on-google-2026-seo-aeo-guide',
    category: 'SEO',
    tags: ['seo', 'aeo', 'google ranking', 'content marketing', 'answer engine optimization'],
    pexels: 'google search engine laptop',
    excerpt: 'Learn how to rank on Google in 2026 with SEO plus AEO (Answer Engine Optimization). A step-by-step system: keywords, question-first content, schema, E-E-A-T and publishing cadence.',
    content: `# How to Rank on Google in 2026: The SEO + AEO Strategy That Actually Works

Google no longer shows ten blue links and stops. Between AI Overviews, featured snippets, and AI assistants, the search results page now answers questions directly. To win traffic in 2026 you need two engines working together: SEO (ranking in search) and AEO - Answer Engine Optimization (being the source AI quotes).

Here is the exact system, step by step.

## How Search Changed (and What It Means for You)

- Over half of searches now end without a click - the answer is shown on the page.
- AI Overviews cite a small number of clear, structured sources.
- Voice and assistant searches are full questions, not keywords.

The winners are websites that answer real questions clearly, with structure Google and AI can extract.

## Step 1: Target Questions, Not Just Keywords

Use "people also ask," your customer support inbox, and sales calls to collect real questions. Examples: "Which billing software is best for small business in India?" Each question becomes one article or one section.

## Step 2: Write Question-First Content

Structure every article like this:

- Answer the main question in the first 2-3 sentences.
- Use H2/H3 headings that are the questions themselves.
- Add a short FAQ section with 3-5 direct answers.
- Support claims with numbers, steps, and examples.

This format wins both featured snippets and AI citations.

## Step 3: Technical SEO Basics (Non-Negotiable)

- Fast loading on mobile (under 3 seconds).
- One H1 per page, logical heading hierarchy.
- Descriptive URLs, title tags under 60 characters, meta descriptions under 160.
- Internal links from every new article to 2-3 related pages.

## Step 4: Add Structured Data (Schema)

FAQ schema, Article schema, and LocalBusiness schema tell search engines exactly what your page means. Sites with FAQ schema appear in rich results far more often.

## Step 5: Build E-E-A-T (Experience, Expertise, Authoritativeness, Trust)

- Put a real author name and bio on every article.
- Show contact details, address, and policies.
- Cite your own real results and examples, not generic claims.
- Earn mentions: directories, partnerships, guest posts.

## Step 6: Publish Consistently - One Quality Post Daily

Freshness and depth compound. A website publishing one helpful, well-structured article every day builds hundreds of ranking surfaces per year. This is why automated blog publishing has become a core growth tool for business websites.

## Step 7: Refresh and Repurpose

Every quarter, update your top 20 articles with new numbers and examples. Repurpose each post into a LinkedIn update, an Instagram carousel, and a WhatsApp broadcast.

## Frequently Asked Questions

### What is AEO (Answer Engine Optimization)?
AEO is optimizing content so AI systems - Google AI Overviews, assistants, and chat search - can extract and cite your answers. It relies on clear structure, direct answers, and schema.

### How long does SEO take in 2026?
With consistent, question-first publishing, most sites see meaningful movement in 8-12 weeks; compounding traffic arrives around month 6.

### Do blogs still matter for SEO?
More than ever. Every article is a new ranking surface and a citable answer source for AI overviews.

### Should I write for humans or for AI?
Both are the same target: clear, honest, structured answers. Write for humans, structure for machines.

## The Bottom Line

Ranking in 2026 is not about tricks - it is about being the clearest, most structured answer to real questions, published consistently. Combine SEO fundamentals with AEO structure, publish daily, and your website becomes the source both Google and AI assistants quote.`
  },
  {
    title: 'Best GST Billing Software for Small Business in India (2026 Checklist)',
    slug: 'best-gst-billing-software-india-small-business-2026',
    category: 'Business Tools',
    tags: ['gst billing', 'invoicing software', 'india', 'small business', 'accounting'],
    pexels: 'invoice billing calculator office desk',
    excerpt: 'The 2026 checklist for choosing GST billing software in India: e-invoice rules, automatic reminders, inventory sync, UPI payments, reports and mobile access - explained simply.',
    content: `# Best GST Billing Software for Small Business in India (2026 Checklist)

Late payments, GST filing stress, and messy stock records are the three silent profit-killers for Indian small businesses. The right GST billing software removes all three. But with dozens of options, how do you choose?

This 2026 checklist explains exactly what to look for - in plain language.

## Why "GST-Ready" Matters More Than Ever

GST compliance in India now touches e-invoicing thresholds, e-way bills, and GSTR-1/GSTR-3B filings. Software that auto-generates compliant invoices and export-ready reports turns a week of accountant panic into a one-click job.

## The 2026 Feature Checklist

### 1. Compliant GST Invoices in Seconds
HSN/SAC codes, tax slabs, buyer GSTIN validation, and printable plus WhatsApp-shareable PDF invoices.

### 2. Automatic Payment Reminders
Polite, scheduled reminders on email and WhatsApp. Businesses using them report getting paid weeks faster.

### 3. Inventory That Updates Itself
Every invoice should reduce stock automatically, with low-stock alerts before you run out.

### 4. UPI and Online Payment Links
A "Pay Now" link inside the invoice removes every excuse for delay.

### 5. Reports Your Accountant Will Love
Profit and loss, GST summary, customer-wise sales, and dues - exportable in one click.

### 6. Works on Mobile
You should be able to raise an invoice from a shop floor or a client site, not just a desktop.

### 7. AI Assistance (the 2026 difference)
Ask "who owes me the most this month?" in plain language and get an instant answer. AI-drafted follow-up messages save hours weekly.

## Cloud vs Desktop: Which Should You Pick?

Cloud wins for most small businesses in 2026: automatic backups, access from anywhere, no installation, and your data survives a laptop failure. Check that the provider offers daily backups and data export - never lock yourself in.

## Common Mistakes When Choosing

- Picking the cheapest tool and paying for it in manual re-entry.
- Ignoring reminder and payment-link features - the fastest ROI features.
- Choosing software without GST report exports, then paying an accountant extra.
- Not checking support quality in your language and timezone.

## Frequently Asked Questions

### Is billing software mandatory for GST?
Not mandatory for every business, but compliant invoices and accurate GSTR data are. Software makes compliance nearly automatic and error-free.

### Can I send invoices on WhatsApp?
Yes - modern tools generate a PDF plus a payment link and share both directly to WhatsApp, which customers open faster than email.

### What about data safety?
Choose cloud providers with encrypted daily backups and one-click export. Your business data should always be portable.

### How much should I expect to pay?
Quality billing suites typically cost less than one late payment per year - the reminders alone usually cover it many times over.

## The Bottom Line

The best GST billing software is the one that gets you paid faster and makes compliance invisible: compliant invoices, automatic reminders, UPI links, live inventory, and accountant-ready reports - ideally with AI assistance built in. Run every option against the checklist above, and choose the tool that pays for itself in the first month.`
  },
  {
    title: 'Digital Marketing for Small Business: 9 Strategies That Work in 2026',
    slug: 'digital-marketing-strategies-small-business-2026',
    category: 'Digital Marketing',
    tags: ['digital marketing', 'social media', 'lead generation', 'local seo', 'whatsapp marketing'],
    pexels: 'digital marketing team strategy laptop',
    excerpt: 'Nine proven digital marketing strategies for small businesses in 2026 - local SEO, daily blogging, short video, WhatsApp broadcasts, reviews and AI personalization - with a 30-day plan.',
    content: `# Digital Marketing for Small Business: 9 Strategies That Work in 2026

Big ad budgets do not win anymore - consistency and relevance do. A small business that shows up daily, answers real questions, and follows up instantly beats a big brand that posts once a month.

Here are the nine strategies producing real results for small businesses in 2026, plus a 30-day starter plan.

## 1. Own Your Google Business Profile (Local SEO)

For local searches - "near me" - your Google Business Profile is your homepage. Complete every field, add photos weekly, collect reviews, and answer questions. Profiles with fresh activity rank visibly higher.

## 2. Publish One Helpful Blog Post Daily

Your website is the only channel you own. Daily, question-answering articles build hundreds of ranking surfaces per year and feed AI search overviews. Automate drafting and publishing so consistency never depends on mood.

## 3. Short-Form Video, Three Times a Week

Sixty-second videos - one tip, one myth busted, one behind-the-scenes clip - outperform polished ads. Record on your phone; captions on; publish to Reels and Shorts.

## 4. WhatsApp Broadcasts (the Indian Superpower)

Open rates above 90%. Build a broadcast list of customers, send one useful message a week - offer, tip, or reminder - never spam. Pair it with a catalog for instant ordering.

## 5. Email Automation for the Long Game

Welcome series, post-purchase thank-you, and win-back emails run on autopilot and quietly compound revenue all year.

## 6. Reviews as a Growth Engine

Ask every happy customer for a Google review with a one-tap link. Respond to every review. Review velocity is a ranking factor and a conversion factor.

## 7. Retargeting: Sell to the 98%

Most visitors do not buy on the first visit. A simple retargeting pixel shows a gentle reminder ad for a few rupees a day and brings them back.

## 8. Partnerships and Micro-Collaborations

Swap promotions with complementary local businesses. One good partnership can deliver a month of leads for zero ad spend.

## 9. AI Personalization and Instant Follow-Up

Reply to every enquiry within five minutes using AI-drafted responses in your tone. Personalize offers using purchase history. Speed and relevance are the new budget.

## Your 30-Day Starter Plan

- Week 1: Complete Google Business Profile; collect 5 reviews; set up automated invoicing with payment links.
- Week 2: Publish 7 blog posts (automate it); record 3 short videos.
- Week 3: Launch WhatsApp broadcast list; send first useful message; start email welcome series.
- Week 4: Install retargeting pixel; sign one partnership; review numbers and double down on what worked.

## Frequently Asked Questions

### How much budget do I need to start?
These strategies are time-first, money-second. You can begin with under a few thousand rupees per month; add ad spend only after the basics run consistently.

### Which single strategy should I start with?
Google Business Profile plus instant follow-up - they convert existing demand you are currently losing.

### How long before I see results?
Local profile and follow-up improvements show within 2-4 weeks; blog and SEO compound visibly by month 3-6.

### Can AI really handle my marketing content?
Yes - with your brand voice and a review step. Teams use AI to draft daily posts and blogs, then approve in minutes.

## The Bottom Line

2026 rewards the consistent. Pick three strategies from this list, run them for 90 days without interruption, and you will out-market competitors who spend ten times more. Start this week - momentum is the strategy.`
  },
];

(async () => {
  const company = await prisma.company.findFirst();
  if (!company) { console.log('ERROR: no company found in DB'); process.exit(1); }
  console.log('Company:', company.id);

  for (const b of BLOGS) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: b.slug } });
    if (existing) { console.log('SKIP (exists):', b.slug); continue; }
    const image = await pexelsImage(b.pexels, b.title);
    const post = await prisma.blogPost.create({
      data: {
        title: b.title,
        slug: b.slug,
        content: b.content,
        excerpt: b.excerpt,
        author: 'AINOS Editorial Team',
        featuredImage: image,
        category: b.category,
        status: 'published',
        publishedAt: new Date(),
        tags: b.tags,
        companyId: company.id,
      },
    });
    console.log('CREATED:', post.slug, '| image:', image ? 'Pexels OK' : 'fallback none');
  }

  const count = await prisma.blogPost.count({ where: { status: 'published' } });
  console.log('Total published blogs now:', count);
  await prisma.$disconnect();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });

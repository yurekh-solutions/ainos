// Adds the next batch of AINOS guides to the public AINOS blog.
// Idempotent: a post whose slug already exists is skipped, so it is safe to re-run.
// Usage: node seed-ainos-guides.cjs   (run from the ainos/ folder)
const fs = require('fs');
const path = require('path');

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

const GUIDES = [
  {
    title: 'GST Invoice Format in India: Every Field You Must Print',
    slug: 'gst-invoice-format-india-fields-checklist',
    category: 'GST & Billing',
    tags: ['gst invoice', 'invoice format', 'gst rules india', 'billing software', 'e-invoice'],
    pexels: 'invoice paperwork accountant desk',
    excerpt:
      'A GST invoice missing one field can cost you the input credit and the sale. Here is the complete field list required under Rule 46, when each one applies, and a pre-send checklist.',
    content: `# GST Invoice Format in India: Every Field You Must Print

A tax invoice is the legal document that lets your buyer claim input tax credit. If a single required field is missing, the buyer can lose the credit, and you can be asked to reissue the invoice months later during an audit. The rules are in Rule 46 of the CGST Rules, 2017 - they are short, and almost every rejected claim traces back to one of the fields below.

This guide lists every field a compliant invoice needs, the extra fields for exports and reverse charge, and the checklist to run before you send.

## The 16 fields every tax invoice must carry

1. Supplier name, address and GSTIN
2. A consecutive serial number, unique for the financial year
3. Date of issue
4. Buyer name, address and GSTIN (if registered)
5. HSN code or SAC for goods and services
6. Description of goods or services
7. Quantity and unit (for goods)
8. Total value before tax
9. Taxable value after discounts
10. Rate of CGST, SGST, IGST or cess, shown separately
11. Amount of tax per head
12. Total invoice value in figures
13. Place of supply, with state name and code
14. Whether tax is payable on reverse charge
15. Signature or digital signature of the supplier
16. Total value in words is good practice and expected by many auditors

## The fields people get wrong

- **Serial numbers.** Gaps are treated as missing invoices. Restart the series only on 1 April, never mid-year, and never reuse a cancelled number.
- **Place of supply.** Intra-state supply splits into CGST + SGST, inter-state into IGST. The buyer's state, not their billing address line, decides.
- **Discounts.** A discount shown after the tax line is not deductible. Show it before tax so the taxable value matches what the buyer claims.
- **Composition dealers.** A bill of supply is issued instead of a tax invoice, and the words "composition taxable person, not eligible to collect tax on supplies" must appear on it.

## Special cases

### Exports

Add the shipping bill or bill of export number, port code, and the statement that supply is under LUT or that IGST is paid. Without the LUT reference, refund processing slows down.

### Reverse charge

Print "tax payable under reverse charge" and drop the tax amount, otherwise the buyer pays twice - once to you and once to the government.

### E-invoicing

Businesses above the notified turnover threshold must generate an Invoice Reference Number from the IRP and print the QR code. An invoice without an IRN is not a valid document for that buyer.

## Pre-send checklist

- GSTIN of both parties is 15 characters and the check digit is valid
- HSN is at least 4 digits (6 for exports)
- Tax rate matches the HSN, and the split matches the place of supply
- Serial number follows the last issued invoice
- Round-off is shown, and the total in words matches the figures
- Credit terms and due date are printed so follow-up is automatic

## Where AINOS fits

AINOS applies the correct tax split from the GSTIN and place of supply, keeps one serial series per financial year, prints the QR code for e-invoices, and files the invoice in the customer ledger so payment reminders start on time. You fill the line items; the compliance fields are generated.

## FAQ

### Is a GST invoice mandatory for every sale?

Yes for a registered supplier making a taxable supply. For B2C sales below the notified value a simplified invoice is allowed, but most businesses issue a full tax invoice because it is easier to reconcile later.

### Can I issue an invoice without a GSTIN?

To an unregistered buyer, yes - print the buyer's name and address and mark the place of supply. To a registered buyer you must print their GSTIN, or they cannot claim input tax credit.

### What happens if the HSN code is wrong?

A wrong HSN can change the tax rate, which makes the invoice under- or over-charged. The buyer's credit is at risk and the invoice usually has to be cancelled and reissued with a credit note.

### Do I need to sign every invoice digitally?

A physical signature, a scanned signature or a digital signature all work. For e-invoices, the QR code and IRN generated by the portal serve as the authentication.

## The bottom line

A compliant invoice is a checklist, not an art project. Fix the field list once in your billing template, validate the GSTIN before you save, and keep one serial series per year. That single change removes most audit follow-ups before they start.`,
  },
  {
    title: 'GST Return Due Dates and Late Fees: 2026 Calendar',
    slug: 'gst-return-due-dates-late-fees-2026',
    category: 'GST & Billing',
    tags: ['gstr-1', 'gstr-3b', 'gst late fee', 'gst compliance', 'due dates'],
    pexels: 'calendar planner deadline office',
    excerpt:
      'GSTR-1 on the 11th, GSTR-3B on the 20th, CMP-08 on the 18th after each quarter - plus what late filing actually costs in interest and fees. A one-page filing calendar for 2026.',
    content: `# GST Return Due Dates and Late Fees: 2026 Calendar

Most GST notices are not about tax evasion. They are about a return filed eleven days late because the person who files it was on leave. Knowing the calendar, and what a missed date costs, is cheaper than any consultant.

## The monthly cycle

- **GSTR-1** - outward supplies. Due the 11th of the following month for monthly filers.
- **GSTR-3B** - summary return and tax payment. Due the 20th of the following month.
- **GSTR-1A** - optional amendment window after GSTR-1 and before GSTR-3B for the same period.
- **PMT-06** - the monthly payment for QRMP filers, due the 25th.

## Quarterly filers (QRMP)

Businesses with turnover up to the QRMP threshold can file quarterly and pay monthly:

- **IFF (Invoice Furnishing Facility)** - optional, by the 13th of the second and third month of the quarter, so buyers get their credit early.
- **GSTR-1** - 13th of the month after the quarter ends.
- **GSTR-3B** - 22nd or 24th depending on the state, after the quarter ends.

## Annual and composition dates

- **GSTR-9 / GSTR-9C** - 31 December after the financial year ends.
- **CMP-08** - 18th of the month after each quarter, for composition dealers.
- **GSTR-4** - 30 June after the financial year, for composition dealers.
- **GSTR-10** - within three months of cancellation of registration.

## What a late return actually costs

Three separate charges stack up:

- **Interest** at 18% per year on tax paid late, calculated from the due date.
- **Late fee** per day per return. It is lower for nil returns and capped by turnover, but it accrues from day one.
- **Blocked credit** - your buyers cannot claim input tax credit for a period you have not filed, which damages the relationship more than the fee damages your cash flow.

## The one habit that prevents all of this

Reconcile before the 10th. Pull purchase invoices from your suppliers, match them against GSTR-2B, fix mismatches, then file GSTR-1 and GSTR-3B in one sitting. AINOS imports GSTR-2B, flags invoices the supplier has not reported, and produces the GSTR-1 and GSTR-3B working papers before the due date so filing is a review, not a rebuild.

## FAQ

### Can I file GSTR-3B without filing GSTR-1?

Yes, but the credit you claim must still match GSTR-2B, and most businesses file GSTR-1 first because the buyer needs it for their own credit.

### Is the late fee charged per return or per day?

Per day, per return, until the maximum cap for your turnover is reached. Interest on unpaid tax is charged separately.

### What if my turnover is below the registration threshold?

You are not required to register or file, but once you take a GSTIN voluntarily you must file even for nil periods, or the registration can be cancelled for non-filing.

## The bottom line

Put the 11th, 13th, 18th, 20th and 25th in one recurring reminder, reconcile GSTR-2B a week before each date, and file even when the return is nil. Compliance is a calendar problem long before it is a tax problem.`,
  },
  {
    title: 'Move from Tally to a Cloud ERP Without Losing Your Data',
    slug: 'tally-to-cloud-erp-migration-guide',
    category: 'Migration',
    tags: ['tally migration', 'cloud erp', 'data migration', 'accounting software', 'india'],
    pexels: 'laptop accounting data analysis desk',
    excerpt:
      'A safe Tally-to-cloud migration runs in five stages: freeze, export, map, reconcile, and run in parallel for one month. Here is the exact order, and the three things to check before you switch off Tally.',
    content: `# Move from Tally to a Cloud ERP Without Losing Your Data

Switching accounting systems is not a data-entry project. It is a reconciliation project. Businesses that migrate badly do not lose their trial balance - they lose trust in their numbers, because opening balances in the new system no longer match the old one.

This is the sequence that works for Indian businesses moving from Tally to a cloud suite.

## Stage 1: Freeze one date

Pick a cut-off - typically the first day of a month, never mid-month. From that date, all new entries go into the new system only. Two systems accepting entries for the same period is the single most common cause of a migration that never finishes.

## Stage 2: Export what actually matters

From Tally, export:

- **Ledger masters** with groups and opening balances
- **Stock items** with units, HSN codes and GST rates
- **Outstanding receivables and payables**, invoice by invoice
- **The trial balance** for the cut-off date
- **GST returns filed so far**, so the new system does not double-report

Export as CSV or Excel, not PDF. A PDF is a report; a CSV is data you can map.

## Stage 3: Map, do not rename

Every Tally ledger group needs a destination in the new chart of accounts. Do the mapping in a spreadsheet and get your accountant to sign it off before any import. Renaming accounts during migration is how historical reports stop matching.

## Stage 4: Reconcile to the rupee

After import, compare:

- Trial balance total against Tally
- Sundry debtors and creditors, party by party
- Stock value at the cut-off date
- GST output tax for the last filed period

If any one of them differs, fix it before going live. A rupee of difference found now is a rupee of explanation saved at year-end.

## Stage 5: Run parallel for one month

Keep Tally read-only for the first month. Post in the new system, then compare one month of GST working papers, bank reconciliation and receivables ageing against the old numbers. When three reports match, stop looking at Tally.

## The advantages you should actually expect

- **Multi-user without a local server.** Owner, accountant and sales team work on the same books from different cities.
- **GST-ready documents.** Serial numbers, e-invoice QR codes and HSN-based tax splits generated by the software.
- **One customer record.** Invoices, payments, CRM notes and support tickets on the same ledger.
- **Automatic backups and audit trail.** No email chain of backup files, and every edit is attributed.

## FAQ

### Will my old vouchers be imported one by one?

Usually only masters and opening balances are imported. Historical vouchers stay in Tally as a read-only archive, which is what auditors expect anyway.

### How long does a migration take?

Two to three weeks for a small business with clean masters, four to six weeks if stock items or party ledgers need cleaning first.

### Can I keep using Tally for one company and the cloud for another?

You can, but it doubles reconciliation work. Migrate one company at a time, fully, rather than running two systems for the same entity.

## The bottom line

Freeze a date, export masters and balances, map with your accountant, reconcile to the rupee, and run parallel for one month. Done in that order, a migration is boring - which is exactly what you want from your books.`,
  },
  {
    title: 'CRM for Small Business in India: What to Track, What to Skip',
    slug: 'crm-small-business-india-what-to-track',
    category: 'CRM & Sales',
    tags: ['crm', 'sales pipeline', 'small business', 'follow up', 'whatsapp leads'],
    pexels: 'sales team meeting small office',
    excerpt:
      'Most small businesses do not need a 40-field CRM. They need six fields, one follow-up date and a WhatsApp trail. Here is the minimum setup that actually gets used.',
    content: `# CRM for Small Business in India: What to Track, What to Skip

A CRM fails for one reason: it asks for more information than the salesperson has at the moment they are talking to the customer. The team stops updating it, the pipeline becomes fiction, and the owner goes back to asking "kya scene hai?" on WhatsApp.

The fix is to track less, but track it every time.

## The six fields that are enough

1. **Name and phone** - the phone number is the real identifier in India
2. **Source** - referral, walk-in, Instagram, IndiaMART, Google or WhatsApp
3. **Stage** - new, quoted, negotiating, won or lost
4. **Value** - expected order value, even a rough range
5. **Next action with a date** - the only field that creates revenue
6. **Last conversation note** - one line, in your own words

Anything else - industry, employee count, annual turnover - is enrichment. Add it later, when the deal is worth the typing.

## Why the next-action date is the whole CRM

A pipeline without a next-action date is a list of hopes. Every lead should always be in one of two states: "I have a scheduled next step" or "this is closed". If it is neither, the follow-up does not happen, and 40% of Indian SME enquiries go cold within eleven days.

## What to skip in year one

- **Custom fields for every scenario.** They multiply, and nobody fills them.
- **Territory and quota management.** You have four salespeople, not four regions.
- **Complex lead scoring.** Until you have 500 closed deals, your own judgement beats a model.
- **A separate tool for WhatsApp.** If WhatsApp chats are not attached to the lead record, the context is lost when someone takes leave.

## Track these numbers, not vanity metrics

- **Enquiry to quote rate** - are you responding fast enough to convert interest into a document?
- **Quote to order rate** - is the problem in pricing or in follow-up?
- **Average days to close** - if it is growing, your follow-ups are slipping.
- **Source-wise wins** - where the next rupee of marketing should go.

## Where AINOS fits

AINOS CRM keeps the six fields above, puts a next-action date on every lead, logs calls and notes against the same customer record that holds invoices and payments, and shows a source-wise win report on the dashboard. No setup consultant required.

## FAQ

### Is a spreadsheet enough as a CRM?

A shared spreadsheet works until two people edit the same row or someone forgets to save. Once you have more than one salesperson, the audit trail and reminders in a CRM pay for themselves.

### Should I put the CRM and billing in one system?

Yes if your sales cycle ends in an invoice. One record from enquiry to payment removes the re-typing that causes most billing errors.

### How many stages should a pipeline have?

Four to six. Every extra stage is a status update someone will skip, which makes the pipeline less reliable, not more.

## The bottom line

Six fields, one next-action date, and a note after every conversation. That combination beats a 40-field CRM that nobody opens - and it is the difference between knowing your pipeline and guessing at it.`,
  },
  {
    title: 'HR and Payroll Compliance Checklist for Indian SMEs',
    slug: 'hr-payroll-compliance-checklist-india-sme',
    category: 'HR & Payroll',
    tags: ['payroll compliance', 'pf esi', 'professional tax', 'hr checklist', 'sme india'],
    pexels: 'office team documents human resources',
    excerpt:
      'PF, ESI, professional tax, TDS on salary and the new labour codes - the monthly and annual payroll obligations for an Indian SME, in the order they fall due.',
    content: `# HR and Payroll Compliance Checklist for Indian SMEs

Payroll compliance is a monthly rhythm with an annual exam. Miss a monthly deposit and interest starts the next day; miss the annual return and the penalty is computed on the whole year. This checklist puts the obligations in the order they actually fall due.

## Every month

- **Salary processing** - attendance, leave, overtime and any variable pay locked before the pay date
- **PF contribution** - employer and employee share deposited by the 15th of the following month, with ECR filed
- **ESI contribution** - deposited by the 15th, for employees within the wage ceiling
- **Professional tax** - deducted and paid as per your state's schedule, where applicable
- **TDS on salary** - deducted at the time of payment and deposited by the 7th of the next month
- **Payslips** - issued with earnings, deductions and the employer contribution split shown separately

## Every quarter

- **TDS return (24Q)** for salary and (26Q) for non-salary payments, by the end of the month following the quarter
- **Form 16A** generation for non-salary TDS

## Every year

- **Form 16** issued to every employee, typically by 15 June
- **PF annual return** and reconciliation of member accounts
- **ESI annual return** where covered
- **Bonus and gratuity** workings, with payment timelines that follow the Payment of Bonus Act and the Gratuity Act
- **Labour welfare fund** contribution in states that levy it

## The five documents every employee file should have

1. Appointment letter with the CTC breakup
2. PAN, Aadhaar and bank details, verified against the name
3. PF and ESI nomination
4. Signed policy acknowledgements
5. Exit documents - resignation acceptance, full and final settlement, and Form 16 for the part year

Missing nominations are the most common cause of a delayed PF claim, and it lands on the employer, not the employee.

## Where SMEs lose money

- **Paying PF late by a few days** and assuming it is fine - interest runs from the due date.
- **Ignoring the wage ceiling** when an employee's salary crosses the ESI limit mid-year.
- **Not reconciling TDS with 26AS** before the quarterly return, then paying a demand that was avoidable.
- **Running payroll on a spreadsheet** with no audit trail, so a disputed deduction cannot be explained a year later.

## Where AINOS fits

AINOS HR keeps employee records, attendance and leave in one place, runs payroll with PF, ESI, professional tax and TDS computed per employee, and produces the monthly challan workings and payslips. The audit trail shows who changed which salary component and when.

## FAQ

### Is PF mandatory for a company with fewer than 20 employees?

PF registration is mandatory at 20 or more employees, but voluntary coverage is common and once covered the rules apply to all eligible employees. Check your state's practice before assuming exemption.

### What is the ESI wage ceiling?

The ceiling is reviewed periodically. Employees within it are covered, and crossing it mid-year changes their contribution from that month - payroll software should flag this automatically.

### Can payroll be run without professional tax registration?

Only in states that do not levy professional tax. Where it applies, register, deduct monthly and pay on the state's schedule; arrears attract interest and penalty.

## The bottom line

Automate the monthly five - PF, ESI, PT, TDS and payslips - and put the quarterly and annual dates on the same calendar as your GST filings. Compliance that is scheduled stops being a fire drill.`,
  },
  {
    title: 'AEO and GEO: How to Get Your Business Cited by AI Answers',
    slug: 'aeo-geo-get-cited-by-ai-answers',
    category: 'SEO & AEO',
    tags: ['aeo', 'geo', 'answer engine optimization', 'generative engine optimization', 'ai search'],
    pexels: 'ai chatbot screen search interface',
    excerpt:
      'AI Overviews, ChatGPT and Perplexity quote pages that answer first, show their sources and are easy to parse. Here is the practical AEO and GEO checklist for an Indian business site.',
    content: `# AEO and GEO: How to Get Your Business Cited by AI Answers

Search did not disappear; it moved above the blue links. AI Overviews, ChatGPT search and Perplexity now answer the question before anyone clicks, and they cite a handful of pages. AEO (answer engine optimisation) is how you get quoted. GEO (generative engine optimisation) is how the whole site becomes the source those engines trust.

Both are built on the same foundation as classic SEO - but the unit of ranking changes from "page" to "passage".

## What AI answer engines actually look for

- **A direct answer in the first 100 words** of the page, in the same words the question used
- **Clear headings** that can be read as a question and an answer
- **Structured data** that names the entity, the author and the date
- **Units, numbers and dates** written explicitly - "18% per year", not "high interest"
- **A citable publisher** with an about page, contact details and consistent social profiles
- **Crawl access** for the answer-engine bots, in robots.txt and in the sitemap

## The AEO layer: passages that can be lifted

1. Write one H2 per question a customer actually asks.
2. Answer it in the first sentence under that heading, then expand.
3. Add an "In short" summary near the top with three or four takeaway lines.
4. Add a FAQ block with question-and-answer pairs and mark it up as FAQPage.
5. Date every page and show the last-updated date, so freshness is visible.

## The GEO layer: an entity engines can trust

- **One canonical host.** Every alternate domain or preview URL must 301 to it; duplicate hosts split your citations.
- **Organization schema with sameAs** links to LinkedIn, Instagram and the parent company site.
- **Author schema** on every guide, with a real team and a bio.
- **llms.txt** at the root, summarising what the site is, what it covers and which URLs are canonical.
- **Crawl rules that allow** GPTBot, OAI-SearchBot, PerplexityBot and ClaudeBot on public pages while keeping the app and API closed.

## What to stop doing

- Keyword-stuffed intros that delay the answer by four paragraphs
- Content with no named author, no date and no publisher
- Blocking AI crawlers while complaining that AI answer engines ignore you
- Publishing the same article on three domains

## Measuring it

Track brand mentions in AI answers for ten priority questions, watch referral traffic from chatgpt.com and perplexity.ai in analytics, and check which URLs get cited. Citation share moves faster than rankings, and it is the number that predicts pipeline.

## Where AINOS fits

AINOS publishes the blog with answer-first structure, FAQ schema, author and publisher entities, canonical URLs and an RSS feed, so the same content that ranks on Google is also readable by answer engines. You write the expertise; the structured data ships with it.

## FAQ

### Is AEO different from SEO?

AEO optimises a specific passage to be quoted as an answer; SEO optimises a page to rank in a list. The technical foundation is shared, so doing one well usually improves the other.

### Does llms.txt replace my sitemap?

No. A sitemap lists URLs for crawlers; llms.txt describes the site and its canonical pages for language models. Keep both.

### Do I need special markup for AI Overviews?

No special markup exists. Schema.org types you already use - Article, FAQPage, Organization, BreadcrumbList - plus clean HTML and fast loading are what the systems read.

### Should I block AI crawlers?

Only on private or paid content. On public marketing and guide pages, allowing the answer engines is how your brand gets cited instead of your competitor's.

## The bottom line

Answer first, structure everything, name the publisher, allow the crawlers and keep one canonical host. That is AEO and GEO in one sentence - and it compounds with every guide you publish.`,
  },
];

(async () => {
  const company = await prisma.company.findFirst();
  if (!company) { console.log('ERROR: no company found in DB'); process.exit(1); }

  for (const g of GUIDES) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: g.slug } });
    if (existing) { console.log('SKIP (exists):', g.slug); continue; }
    const image = await pexelsImage(g.pexels, g.slug);
    const post = await prisma.blogPost.create({
      data: {
        title: g.title,
        slug: g.slug,
        content: g.content,
        excerpt: g.excerpt,
        author: 'AINOS Editorial Team',
        featuredImage: image,
        category: g.category,
        status: 'published',
        publishedAt: new Date(),
        tags: g.tags,
        companyId: company.id,
      },
    });
    console.log('CREATED:', post.slug, '| image:', image ? 'Pexels OK' : 'none');
  }

  const count = await prisma.blogPost.count({ where: { author: 'AINOS Editorial Team' } });
  console.log('AINOS published guides now:', count);
  await prisma.$disconnect();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });

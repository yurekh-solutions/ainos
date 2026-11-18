// AINOS Tools — how-to-use guides
// One guide per tool slug. Powers the "How to use" tab on each tool dashboard
// and the guidance hints in the Tools dashboard. Content is plain-English,
// business-owner friendly: what the tool does, the exact steps, and what
// comes out at the end.

export interface ToolGuideStep {
  title: string;
  detail: string;
}

export interface ToolGuide {
  summary: string;
  bestFor: string;
  timeToRun: string;
  whatYouGet: string[];
  steps: ToolGuideStep[];
  tips: string[];
  /** Subscription tools work inside an existing module instead of a form. */
  openModule?: { label: string; href: string };
}

const GUIDES: Record<string, ToolGuide> = {
  aiAssistant: {
    summary: 'Ask any business question and get a direct, practical answer from AINOS AI.',
    bestFor: 'Quick decisions when you have no one to ask — pricing, hiring, marketing or tax doubts.',
    timeToRun: 'A few seconds',
    whatYouGet: [
      'A clear answer in plain language',
      'Real-world next steps you can act on today',
      'A copy button to keep the answer in your notes or WhatsApp',
    ],
    steps: [
      { title: 'Type your question', detail: 'One question at a time works best. Example: "How should I price a 3-day interior design package?"' },
      { title: 'Add business context (optional)', detail: 'A line about your industry, city or size makes answers far more relevant.' },
      { title: 'Tap Ask AINOS', detail: 'The answer appears below — scroll through and use the copy button.' },
    ],
    tips: [
      'Ask follow-up questions by running the tool again with "now explain it for my staff"',
      'For legal or tax decisions, treat the answer as a starting point and confirm with your CA',
    ],
  },

  'ai-content-writer': {
    summary: 'Writes a complete blog article or social post around any topic you give it.',
    bestFor: 'Keeping your website and social pages updated without a writer.',
    timeToRun: '10–20 seconds',
    whatYouGet: [
      'A ready headline plus 4–6 readable paragraphs',
      'A closing call-to-action that tells readers what to do next',
      'A word count so you know the length before publishing',
    ],
    steps: [
      { title: 'Enter your topic', detail: 'Be specific: "How small shops can reduce GST mistakes" beats "GST".' },
      { title: 'Add details (optional)', detail: 'Tone, audience, points to cover — anything you want included.' },
      { title: 'Tap Run Tool', detail: 'Read the draft, copy it, and publish on your site or WhatsApp.' },
    ],
    tips: [
      'Run the same topic twice and pick the better draft — both are saved in History',
      'Paste your best-performing posts into the details box so the AI matches your voice',
    ],
  },

  brandkit: {
    summary: 'Generates a complete brand kit: colour palette, taglines, fonts, voice and usage rules.',
    bestFor: 'New businesses setting up their identity, or rebrands that need one clean reference.',
    timeToRun: '10–15 seconds',
    whatYouGet: [
      '6-colour palette (click any swatch to copy its hex code)',
      '5 tagline options and a defined brand voice',
      'Typography pairing, logo usage rules and application examples',
      'A brand moodboard image to share with designers and printers',
    ],
    steps: [
      { title: 'Enter business name and industry', detail: 'These two fields shape the whole kit.' },
      { title: 'Pick your primary colour (optional)', detail: 'Leave it as-is and AINOS chooses a fitting colour for you.' },
      { title: 'Tap Generate Deliverable', detail: 'Copy the sections you need — palette, taglines and rules are all reusable.' },
    ],
    tips: [
      'Run it again with a different primary colour to compare two brand directions',
      'Share the kit with every printer and designer — it prevents colour mismatches',
    ],
  },

  logo: {
    summary: 'Generates 6 distinct logo concepts for your business in one run.',
    bestFor: 'Getting design directions fast before hiring a designer for final vectors.',
    timeToRun: 'Instant',
    whatYouGet: [
      '6 concepts: minimalist, gradient, emblem, monogram, mascot and luxury wordmark',
      'A guide explaining which style suits which business type',
      'High-resolution images you can save right away',
    ],
    steps: [
      { title: 'Enter business name and industry', detail: 'The industry decides the visual references AINOS uses.' },
      { title: 'Describe preferred colours (optional)', detail: 'Example: "deep blue and gold" or "earth tones".' },
      { title: 'Tap Generate Deliverable', detail: 'Click any concept to open it full size, then right-click → Save Image.' },
    ],
    tips: [
      'Shortlist 1–2 favourites — a professional designer can redraw them as clean vector files',
      'Re-run for fresh directions; every run gives new concepts',
    ],
  },

  bizplan: {
    summary: 'Produces a full business plan with a 3-year financial projection from a few numbers.',
    bestFor: 'Loan applications, investor conversations and your own annual planning.',
    timeToRun: 'Instant',
    whatYouGet: [
      'Executive summary with investment needed and breakeven month',
      '3-year revenue, cost and profit table',
      'Go-to-market plan, funding split, risk list and a usage guide',
    ],
    steps: [
      { title: 'Describe the business', detail: 'Business name, industry and a couple of lines on what you do.' },
      { title: 'Add your numbers', detail: 'Startup cost, monthly price per customer and year-1 target customers.' },
      { title: 'Tap Generate Deliverable', detail: 'Copy sections into your loan file or share with partners.' },
    ],
    tips: [
      'Use realistic customer targets — banks ask how you reached the number',
      'Update the plan every quarter with actual figures',
    ],
  },

  legal: {
    summary: 'Creates Privacy Policy, Terms & Conditions, Refund Policy and cookie banner text.',
    bestFor: 'Any business collecting payments or contact details on a website.',
    timeToRun: 'Instant',
    whatYouGet: [
      'Privacy Policy, Terms & Conditions and Refund & Cancellation Policy',
      'Cookie banner copy and a publishing checklist',
      'Text tailored to your business name, website and country',
    ],
    steps: [
      { title: 'Enter business details', detail: 'Business name, website URL, contact email and country.' },
      { title: 'Select whether you collect online payments', detail: 'This changes the payment clauses in the documents.' },
      { title: 'Tap Generate Deliverable', detail: 'Create /privacy-policy, /terms and /refund-policy pages and paste each section.' },
    ],
    tips: [
      'Payment gateways like Razorpay require all three pages linked in your footer',
      'For health, finance or data-heavy businesses, have a lawyer review before publishing',
    ],
  },

  pitchdeck: {
    summary: 'Builds a 10-slide investor pitch deck outline with slide-by-slide content.',
    bestFor: 'Fundraising conversations where you need a clear story fast.',
    timeToRun: '10–15 seconds',
    whatYouGet: [
      'Slides 1–10: title, problem, solution, market, product, model, traction, competition, team, ask',
      'A cover visual and delivery playbook',
      'Concrete guidance on numbers investors expect',
    ],
    steps: [
      { title: 'Enter business name and industry', detail: 'Plus the problem you solve and your product in one line each.' },
      { title: 'Add funding ask and traction', detail: 'Traction can be waitlist, pilot customers or monthly growth.' },
      { title: 'Tap Generate Deliverable', detail: 'Copy each slide into PowerPoint, Canva or Google Slides.' },
    ],
    tips: [
      'Keep it to 10–12 slides and under 3 minutes spoken',
      'Practise the 30-second verbal version — most pitches happen in hallways',
    ],
  },

  autoBlog: {
    summary: 'Writes a full SEO-ready blog article with a title and meta description.',
    bestFor: 'Feeding your connected website with regular articles.',
    timeToRun: '10–20 seconds',
    whatYouGet: [
      'A complete article body with a strong title',
      'A meta description ready for search results',
      'Word count and copy button',
    ],
    steps: [
      { title: 'Enter the blog topic', detail: 'Specific topics rank better: "5 GST mistakes shops make" not "GST".' },
      { title: 'Choose tone and audience', detail: 'Professional, casual, educational or persuasive — and who it is for.' },
      { title: 'Tap Write Article', detail: 'Copy the article into your blog, or publish via your connected website.' },
    ],
    tips: [
      'One article per week keeps search engines and readers engaged',
      'Add one relevant image per section before publishing',
    ],
  },

  'lead-scoring-ai': {
    summary: 'Scores every lead in your CRM by source, status, contact completeness and recency.',
    bestFor: 'Sales teams that need to know who to call first — no input needed.',
    timeToRun: 'A few seconds',
    whatYouGet: [
      'A score and priority (High / Medium / Low) saved on every lead',
      'A ranked list you can work down from the top',
      'Scores help you stop wasting calls on cold leads',
    ],
    steps: [
      { title: 'Make sure leads exist in CRM', detail: 'Add or import leads under CRM first.' },
      { title: 'Tap Score My Leads', detail: 'No form to fill — the tool reads your CRM directly.' },
      { title: 'Work the High list first', detail: 'Open CRM and filter or sort by score.' },
    ],
    tips: [
      'Re-run weekly — scores change as leads move through your pipeline',
      'Leads with missing phone/email get penalised; complete contact details to lift scores',
    ],
  },

  poster: {
    summary: 'Generates 6 print and social creatives — poster, flyer, banner, standee and story sizes.',
    bestFor: 'Shop openings, offers, festivals and events where you need visuals today.',
    timeToRun: 'Instant',
    whatYouGet: [
      'A4 poster, square flyer, landscape banner, standee, Instagram story and WhatsApp creative',
      'Print specifications (300 DPI, CMYK, bleed)',
      'Suggested headline, sub-line and CTA text',
    ],
    steps: [
      { title: 'Enter business name and industry', detail: 'The visuals match your type of business.' },
      { title: 'Write the poster message', detail: 'Example: "Grand Opening — 50% off this weekend".' },
      { title: 'Choose a style and generate', detail: 'Modern, vintage, minimal or bold. Click any creative to save it.' },
    ],
    tips: [
      'Pair the poster with a QR code (QR tool) pointing to WhatsApp or your menu',
      'For final print files with your exact text overlaid, ask your printer to typeset from the concept',
    ],
  },

  qr: {
    summary: 'Creates ready-to-print QR codes for any link, menu, payment page or offer.',
    bestFor: 'Counter displays, visiting cards, packaging and posters.',
    timeToRun: 'Instant',
    whatYouGet: [
      'Standard 500px code, high-res 1000px print code and a sticker-ready framed version',
      'Choice of colour',
      'Placement and sizing tips',
    ],
    steps: [
      { title: 'Paste the link or text to encode', detail: 'Website, WhatsApp link, UPI payment page, Google Maps listing — anything.' },
      { title: 'Pick a colour (optional)', detail: 'Dark codes on light backgrounds scan most reliably.' },
      { title: 'Generate and download', detail: 'Click a code to open full size, then save and print.' },
    ],
    tips: [
      'Test the printed code with two phones before a big print run',
      'Minimum print size: 2×2 cm for close scanning, 10×10 cm for posters',
    ],
  },

  listing: {
    summary: 'Writes a complete marketplace product listing — titles, bullets, description and keywords.',
    bestFor: 'Selling on Amazon, Flipkart, Meesho or Shopify.',
    timeToRun: '10–20 seconds',
    whatYouGet: [
      '3 SEO title options within platform limits',
      '5 benefit-first bullet points',
      'A persuasive 3-paragraph description and backend search keywords',
      'Two product image directions (main + lifestyle)',
    ],
    steps: [
      { title: 'Enter brand and product details', detail: 'Product name, category, features and price.' },
      { title: 'Choose the platform', detail: 'Amazon, Flipkart, Meesho or Shopify — copy is tuned to each.' },
      { title: 'Tap Generate Deliverable', detail: 'Paste titles, bullets and description into your seller dashboard.' },
    ],
    tips: [
      'Listings with 7+ images convert noticeably better — add yours',
      'Answer the first 5 customer questions yourself from the seller account',
    ],
  },

  'invoice-extractor': {
    summary: 'Reads a photo or PDF of a vendor bill and extracts vendor, items, GST and totals.',
    bestFor: 'Turning paper bills into records for expenses and GST input credit.',
    timeToRun: '10–30 seconds',
    whatYouGet: [
      'Vendor name, address, PAN, GSTIN, phone and email',
      'Invoice number, date and item-by-item amounts',
      'Subtotal, tax, total, amount paid and balance',
      'Copyable JSON for records',
    ],
    steps: [
      { title: 'Upload the bill', detail: 'A clear photo, scan or PDF works. Flatten the page and avoid shadows.' },
      { title: 'Tap Run Tool', detail: 'The OCR and AI pipeline extracts all fields.' },
      { title: 'Check and record', detail: 'Verify figures against the paper, then add the expense in Finance.' },
    ],
    tips: [
      'Straight, well-lit photos extract far more accurately than angled ones',
      'Always eyeball the extracted GSTIN before claiming input credit',
    ],
  },

  invoiceGen: {
    summary: 'Opens the full Finance invoicing module where invoices are created, sent and tracked.',
    bestFor: 'Day-to-day billing with GST, templates and payment tracking.',
    timeToRun: 'Open the module',
    whatYouGet: [
      'The complete invoice workflow — create, preview, send, track payment',
      'GST-compliant invoice numbers and totals',
      'Customer-wise history and outstanding balances',
    ],
    steps: [
      { title: 'Open the Finance module', detail: 'Use the button on this page — invoicing lives there, not on this card.' },
      { title: 'Create an invoice', detail: 'Pick the customer, add items, confirm GST and save.' },
      { title: 'Send and track', detail: 'Share the PDF and mark payments as they arrive.' },
    ],
    tips: [
      'Set up your invoice template once under Finance → Templates',
      'Recurring invoices can be automated under Finance → Recurring',
    ],
    openModule: { label: 'Open Invoices', href: '/invoices' },
  },

  'invoice-generator': {
    summary: 'Creates a GST invoice in seconds — pick items, set the rate, done.',
    bestFor: 'Quick one-off bills without leaving the tools workspace.',
    timeToRun: 'A few seconds',
    whatYouGet: [
      'An invoice number with proper serial sequence',
      'Subtotal, GST and total calculated for you',
      'A link to view and download the invoice in Finance',
    ],
    steps: [
      { title: 'Enter customer name and email', detail: 'Email is optional but needed to send the invoice later.' },
      { title: 'Add line items', detail: 'Description, quantity and price per item. Add as many rows as needed.' },
      { title: 'Set GST rate and run', detail: 'Confirm the percentage, tap Run Tool, then open the invoice in Finance.' },
    ],
    tips: [
      'For repeat billing, use the full Finance module instead — it remembers customers',
      'Double-check the GST rate against your product category',
    ],
  },

  hrPayroll: {
    summary: 'Opens the HR & Payroll module for staff records, attendance and salary processing.',
    bestFor: 'Managing employee data and monthly payroll inside AINOS.',
    timeToRun: 'Open the module',
    whatYouGet: [
      'Staff directory with documents and roles',
      'Attendance and leave tracking',
      'Payroll runs and salary records',
    ],
    steps: [
      { title: 'Open the HR module', detail: 'Use the button on this page.' },
      { title: 'Add your team', detail: 'Create each employee with role, salary and joining date.' },
      { title: 'Run payroll monthly', detail: 'Review attendance, adjust, and generate the month’s payroll.' },
    ],
    tips: [
      'Keep offer letters and IDs attached to each employee record',
      'Run payroll a few days before your pay date to leave review time',
    ],
    openModule: { label: 'Open HR & Payroll', href: '/hr' },
  },

  content: {
    summary: 'Writes a full blog article or 3 ad-copy variants around your topic and keywords.',
    bestFor: 'Marketing content that needs structure — articles, landing copy and ads.',
    timeToRun: '10–20 seconds',
    whatYouGet: [
      'Blog mode: a structured article with a publishing checklist',
      'Ad mode: 3 tested variants with placement advice',
      'Keyword integration and a testing checklist',
    ],
    steps: [
      { title: 'Enter business name and topic', detail: 'Choose blog or ad under Content Type.' },
      { title: 'Add keywords (optional)', detail: 'Comma-separated phrases you want woven into the copy.' },
      { title: 'Tap Generate Deliverable', detail: 'Copy sections individually or all at once.' },
    ],
    tips: [
      'For ads, run all 3 variants and let the data pick the winner',
      'Match your landing page headline to the winning ad headline',
    ],
  },

  'email-campaign-sender': {
    summary: 'Sends a branded email to every customer in your CRM with an email address.',
    bestFor: 'Announcements, offers and updates to your existing customer base.',
    timeToRun: 'Under a minute',
    whatYouGet: [
      'A live preview of the exact email your customers receive',
      'Recipient count before sending — no surprises',
      'A send report: delivered, failed and failure reasons',
    ],
    steps: [
      { title: 'Check the recipient count', detail: 'It shows how many CRM customers will receive the email.' },
      { title: 'Write subject and message', detail: 'The preview below the form shows exactly what goes out.' },
      { title: 'Tap Send Email', detail: 'Review the report — failed addresses are listed so you can fix them in CRM.' },
    ],
    tips: [
      'Send Tue–Thu mid-morning for the best open rates',
      'One clear call to action per email — never more',
      'If the count is zero, add customer emails in CRM first',
    ],
  },

  email: {
    summary: 'Writes a complete email campaign: 3 subject lines, body, preview text and follow-up sequence.',
    bestFor: 'Planning campaigns before sending them through Email Marketing.',
    timeToRun: '10–15 seconds',
    whatYouGet: [
      '3 subject lines to A/B/C test',
      'Preview text and a full email body',
      'A 3-touch follow-up sequence and deliverability checklist',
    ],
    steps: [
      { title: 'Enter business and goal', detail: 'Promotion, announcement, nurture or re-activation.' },
      { title: 'Describe audience and offer', detail: 'Who receives it and what you are offering.' },
      { title: 'Tap Generate Deliverable', detail: 'Copy the winning subject and body into your campaign sender.' },
    ],
    tips: [
      'Test all three subjects on small lists before a large send',
      'Keep the email text-first — heavy images hurt deliverability',
    ],
  },

  emailMarketing: {
    summary: 'Opens the Email Marketing module for campaigns, lists and delivery reports.',
    bestFor: 'Managing ongoing email communication with customers and leads.',
    timeToRun: 'Open the module',
    whatYouGet: [
      'Campaign builder with branded templates',
      'Audience lists from CRM contacts',
      'Delivery statistics and open tracking',
    ],
    steps: [
      { title: 'Open Email Marketing', detail: 'Use the button on this page.' },
      { title: 'Pick or build an audience', detail: 'Contacts come from your CRM — keep emails updated there.' },
      { title: 'Create and send a campaign', detail: 'Draft content (the Email Copy tool can write it), preview, then send.' },
    ],
    tips: [
      'Send from a custom domain for better deliverability',
      'Review reports after 48 hours, not 2 — opens trickle in',
    ],
    openModule: { label: 'Open Email Marketing', href: '/marketing' },
  },

  launch: {
    summary: 'Builds a week-by-week launch blueprint for a product or service.',
    bestFor: 'New product launches, new branches and big announcements.',
    timeToRun: 'Instant',
    whatYouGet: [
      'Four phases from research to post-launch, with week numbers',
      'Budget guidance tuned to lean, standard or premium',
      'A launch-day checklist and risk list',
    ],
    steps: [
      { title: 'Enter business and product name', detail: 'The product or service being launched.' },
      { title: 'Pick a budget level', detail: 'Lean (organic only), standard or premium.' },
      { title: 'Tap Generate Deliverable', detail: 'Copy the phases into your calendar and assign owners.' },
    ],
    tips: [
      'Line up 5 friendly customers for day-one testimonials before launch',
      'Win 2 channels properly instead of being average on 5',
    ],
  },

  pr: {
    summary: 'Writes a press release with quote, boilerplate and a journalist pitch email.',
    bestFor: 'Getting local media coverage for announcements and milestones.',
    timeToRun: '10–15 seconds',
    whatYouGet: [
      'A complete FOR IMMEDIATE RELEASE document',
      'Spokesperson quote and company boilerplate',
      'A personalisable pitch email for journalists',
    ],
    steps: [
      { title: 'Enter the announcement', detail: 'One clear line, e.g. "Yurekh opens a new office in Pune".' },
      { title: 'Add spokesperson and city', detail: 'The quote is attributed to this person.' },
      { title: 'Tap Generate Deliverable', detail: 'Copy the release and send the pitch to local journalists.' },
    ],
    tips: [
      'Send to local business journalists Tue–Thu mornings',
      'Personalise the first line of every pitch email — never mass-copy',
    ],
  },

  seo: {
    summary: 'Builds a complete SEO pack for any page: titles, descriptions, keywords and a 30-day plan.',
    bestFor: 'Getting found on Google for your services and city.',
    timeToRun: 'Instant',
    whatYouGet: [
      'Meta titles and descriptions within search limits',
      '14 target keywords including location variants',
      'An on-page checklist, FAQ starters and a 30-day content plan',
    ],
    steps: [
      { title: 'Enter business and page topic', detail: 'Example: "interior design services" with location "Mumbai".' },
      { title: 'Add extra keywords (optional)', detail: 'Phrases customers actually search for.' },
      { title: 'Tap Generate Deliverable', detail: 'Apply the titles to your page settings and work the 30-day plan.' },
    ],
    tips: [
      'One page should target one topic — don’t stuff everything into a single page',
      'Add the FAQ starters to a real FAQ section with schema markup',
    ],
  },

  social: {
    summary: 'Creates a 7-day social media content plan with captions, hashtags and creative directions.',
    bestFor: 'Keeping Instagram, LinkedIn or Facebook active every single day.',
    timeToRun: '15–20 seconds',
    whatYouGet: [
      '7 day-by-day posts with types and captions',
      'Hashtag sets and reels/story ideas',
      'Posting strategy and a 30-day scaling plan',
      'Two creative image directions',
    ],
    steps: [
      { title: 'Enter business and industry', detail: 'Plus choose the platform.' },
      { title: 'Set the week’s topic', detail: 'Example: "Diwali collection launch" or "monsoon maintenance tips".' },
      { title: 'Tap Generate Deliverable', detail: 'Copy each day’s caption and pair it with your own photos.' },
    ],
    tips: [
      'Re-run weekly with the new topic for fresh captions',
      'Reply to every comment within 2 hours on posting day',
    ],
  },

  'social-media-generator': {
    summary: 'Writes platform-ready posts for Twitter, LinkedIn, Instagram and Facebook in one run.',
    bestFor: 'A quick post on every platform without rewriting copy four times.',
    timeToRun: '15–30 seconds',
    whatYouGet: [
      'One post per platform, each tuned to its style and length limits',
      'Instagram post with exactly 5 hashtags',
      'Copy buttons for each platform',
    ],
    steps: [
      { title: 'Enter your topic', detail: 'Example: "Diwali sale for my clothing store".' },
      { title: 'Tap Run Tool', detail: 'Posts are generated one platform at a time and shown together.' },
      { title: 'Copy each platform post', detail: 'Paste straight into the app — formatting is already correct.' },
    ],
    tips: [
      'A platform that fails is reported individually — just copy the ones that succeeded',
      'Add your own image to each post before publishing',
    ],
  },

  inventoryMgmt: {
    summary: 'Opens the Inventory module for stock levels, purchases and movements.',
    bestFor: 'Shops and warehouses tracking what is in stock and what needs reordering.',
    timeToRun: 'Open the module',
    whatYouGet: [
      'Stock levels per item with low-stock signals',
      'Purchase and consumption records',
      'Movement history for every item',
    ],
    steps: [
      { title: 'Open the Inventory module', detail: 'Use the button on this page.' },
      { title: 'Add your items', detail: 'Name, SKU, unit and opening stock for each.' },
      { title: 'Record every movement', detail: 'Purchases in, sales and wastage out — stock stays accurate.' },
    ],
    tips: [
      'Set a reorder level per item so low stock is flagged early',
      'Reconcile physical stock monthly against the module',
    ],
    openModule: { label: 'Open Inventory', href: '/inventory' },
  },

  'data-export': {
    summary: 'Exports customers, leads or invoices as a spreadsheet-ready file.',
    bestFor: 'Backups, CA handovers and moving data into Excel or Google Sheets.',
    timeToRun: 'A few seconds',
    whatYouGet: [
      'A CSV (Excel / Google Sheets) or JSON file',
      'One row per record with all key fields',
      'A record count before you download',
    ],
    steps: [
      { title: 'Pick the dataset', detail: 'Customers, leads or invoices.' },
      { title: 'Pick the format', detail: 'CSV for spreadsheets, JSON for technical use.' },
      { title: 'Tap Run Tool and download', detail: 'The file downloads immediately with a dated name.' },
    ],
    tips: [
      'Export invoices at month-end for your CA instead of printing',
      'Keep a monthly backup habit — exports take seconds',
    ],
  },

  crmAccess: {
    summary: 'Opens the CRM module for leads, deals, contacts and follow-ups.',
    bestFor: 'Tracking every enquiry from first contact to closed deal.',
    timeToRun: 'Open the module',
    whatYouGet: [
      'Leads pipeline with stages and priorities',
      'Customer and contact records',
      'Follow-up reminders and deal values',
    ],
    steps: [
      { title: 'Open CRM', detail: 'Use the button on this page.' },
      { title: 'Add leads as they come', detail: 'Name, phone, source and stage for every enquiry.' },
      { title: 'Work follow-ups daily', detail: 'Move deals forward and record notes after every call.' },
    ],
    tips: [
      'Run Lead Scoring AI weekly to see who deserves the first call',
      'No lead should sit untouched for more than 48 hours',
    ],
    openModule: { label: 'Open CRM', href: '/crm' },
  },

  chatbot: {
    summary: 'Builds an embeddable website chat assistant with your FAQs and WhatsApp handoff.',
    bestFor: 'Answering customer questions 24×7 directly on your website.',
    timeToRun: '10–20 seconds',
    whatYouGet: [
      'A ready-to-paste embed script for your website',
      'Instant answers to your FAQs, plus AI answers for everything else',
      'WhatsApp handoff when the assistant cannot help',
    ],
    steps: [
      { title: 'Enter business details', detail: 'Name, industry, website and WhatsApp number.' },
      { title: 'Add your FAQs', detail: 'Write "Q: ..." then "A: ..." on the next line, one pair per question. Leave empty and AINOS drafts five for you.' },
      { title: 'Copy the embed code', detail: 'Paste it before </body> on your site — the chat bubble appears immediately.' },
    ],
    tips: [
      'Add 8–12 FAQs covering price, delivery, timings and location',
      'Re-generate the code whenever your offers change',
    ],
  },

  websiteGen: {
    summary: 'Generates a complete one-page website as an HTML file you can host anywhere.',
    bestFor: 'A professional web presence in minutes, before committing to a full site build.',
    timeToRun: '20–40 seconds',
    whatYouGet: [
      'A complete HTML page with your branding and content',
      'Download button and instant preview',
      'Editable HTML source',
    ],
    steps: [
      { title: 'Enter business details', detail: 'Name, industry and a clear description of what you offer.' },
      { title: 'Pick your primary colour', detail: 'The generated page uses it for buttons and accents.' },
      { title: 'Generate, preview and download', detail: 'Download the HTML and upload it to any host — or connect it to AINOS.' },
    ],
    tips: [
      'Detailed descriptions produce richer pages — mention services and locations',
      'You can open the HTML in any editor to tweak text later',
    ],
  },
};

/** Fallback so a newly added tool still has a usable guide shell. */
const FALLBACK: ToolGuide = {
  summary: 'A ready-to-run AINOS tool — fill the short form and get a finished result.',
  bestFor: 'Day-to-day business tasks that used to need an outside vendor.',
  timeToRun: 'Under a minute',
  whatYouGet: [
    'A finished, copy-ready result',
    'Every run saved to History for later reuse',
  ],
  steps: [
    { title: 'Fill the form', detail: 'Only the starred fields are required.' },
    { title: 'Run the tool', detail: 'Tap the main button — results appear below the form.' },
    { title: 'Use the result', detail: 'Copy or download it, then come back any time from History.' },
  ],
  tips: ['Run it again with changed inputs to compare versions'],
};

export function getToolGuide(slug: string): ToolGuide {
  return GUIDES[slug] || FALLBACK;
}

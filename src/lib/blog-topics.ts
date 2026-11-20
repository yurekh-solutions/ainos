// Topic metadata for the public AINOS blog listing (/blog).
// Kept as plain data so the server page can use it for structured data and the
// client list can use it for the topic cards, without pulling React into either.

export interface Topic {
  /** Canonical label shown on chips and cards. */
  label: string;
  /** One line that tells a reader which problem this topic solves. */
  blurb: string;
  /** Where the same work happens inside the product. */
  tool: { label: string; href: string };
}

// Older posts carry slightly different category strings; fold them into one label
// so a topic filter does not split the library into near-duplicates.
export const CATEGORY_ALIASES: Record<string, string> = {
  SEO: 'SEO & AEO',
  'Business Tools': 'Buying Guides',
};

export function topicFor(category: string | null | undefined): string {
  if (!category) return 'General';
  return CATEGORY_ALIASES[category] || category;
}

export const TOPICS: Topic[] = [
  {
    label: 'GST & Billing',
    blurb: 'Invoice fields, e-invoicing, filing dates and the credit you are owed.',
    tool: { label: 'GST Invoicing', href: '/features/finance/invoices' },
  },
  {
    label: 'Finance & Billing',
    blurb: 'Turn a raised invoice into money in the bank, without awkward calls.',
    tool: { label: 'Payment Reminders', href: '/features/finance/payment-reminders' },
  },
  {
    label: 'CRM & Sales',
    blurb: 'Enquiries, follow-ups and a pipeline you can actually trust.',
    tool: { label: 'Lead Management', href: '/features/crm/leads' },
  },
  {
    label: 'HR & Payroll',
    blurb: 'PF, ESI, professional tax and salary processing done on time.',
    tool: { label: 'Payroll', href: '/features/people/payroll' },
  },
  {
    label: 'Inventory & Stock',
    blurb: 'Reorder points, ABC analysis and clearing stock that will not move.',
    tool: { label: 'Stock Management', href: '/features/supply-chain/stock' },
  },
  {
    label: 'AI & Automation',
    blurb: 'Where AI saves real hours in billing, content and customer messaging.',
    tool: { label: 'AI Business Assistant', href: '/features/ai-studio/ai-assistant' },
  },
  {
    label: 'SEO & AEO',
    blurb: 'Ranking on Google and getting cited by AI answer engines.',
    tool: { label: 'SEO Platform', href: '/features/marketing/seo-platform' },
  },
  {
    label: 'Digital Marketing',
    blurb: 'Content, campaigns and channels that bring enquiries you can trace.',
    tool: { label: 'AI Blog Writer', href: '/features/marketing/blog-content' },
  },
  {
    label: 'Migration',
    blurb: 'Move off Tally or spreadsheets without losing your history.',
    tool: { label: 'Tally & Excel Export', href: '/features/finance/tally-export' },
  },
  {
    label: 'Buying Guides',
    blurb: 'How to choose software, what vendors do not say and what to test first.',
    tool: { label: 'All AINOS suites', href: '/features' },
  },
];

const FALLBACK: Topic = {
  label: 'More guides',
  blurb: 'Everything else the AINOS team has written down.',
  tool: { label: 'All AINOS suites', href: '/features' },
};

export function topicMeta(label: string): Topic {
  return TOPICS.find((t) => t.label === label) || { ...FALLBACK, label };
}

// The reading order we would give a business owner who asks "where do I start?".
export const START_HERE: { slug: string; step: string }[] = [
  { slug: 'gst-invoice-format-india-fields-checklist', step: 'Get the invoice right' },
  { slug: 'gst-return-due-dates-late-fees-2026', step: 'Never miss a filing date' },
  { slug: 'crm-small-business-india-what-to-track', step: 'See your sales pipeline' },
  { slug: 'invoice-to-cash-collect-payments-faster', step: 'Collect what you are owed' },
];

// Answers to the questions people actually ask about this library. The same list
// renders on the page and in FAQPage structured data, so the two cannot drift.
export const BLOG_FAQ: { question: string; answer: string }[] = [
  {
    question: 'Are these guides written for Indian businesses?',
    answer:
      'Yes. Every guide is written from work the AINOS team does with Indian companies, so GST rules, statutory thresholds, rupee amounts and local buying habits are the default context. Topics that are universal practice, such as inventory formulas or follow-up cadences, are shown with Indian lead times and supplier behaviour.',
  },
  {
    question: 'Who writes the AINOS guides?',
    answer:
      'The AINOS Editorial Team, based in Mumbai, with input from the people who build the billing, CRM, payroll and inventory modules. Each guide names the rule or notification it relies on so you can check it yourself.',
  },
  {
    question: 'Do I need an AINOS account to read a guide?',
    answer:
      'No. Guides are public pages with no signup wall, no gated chapters and no forced registration. You can also subscribe to the feed at /api/blog-rss and read them wherever you keep your feeds.',
  },
  {
    question: 'How current are the tax rates and thresholds?',
    answer:
      'Rates, ceilings and due dates move through government notifications, so each guide states the rule it is based on and the date it was published or updated. Confirm the position currently in force with your CA or the official notification before you file - a guide is a working map, not a substitute for the law.',
  },
  {
    question: 'Can I link to or reuse a guide?',
    answer:
      'Linking is welcome, and quoting a short passage with attribution and a link back to the original page is fine. Please do not republish a full guide as your own content.',
  },
  {
    question: 'Which guide should I read first?',
    answer:
      'Start with the GST invoice format checklist, then the return due-date calendar, then the CRM guide, then invoice-to-cash. Those four cover the order most small businesses need fixed first: bill correctly, file on time, know what is coming in, collect it.',
  },
];

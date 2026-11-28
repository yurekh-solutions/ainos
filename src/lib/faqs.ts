export interface FaqItem {
  question: string;
  answer: string;
}

const WHAT_IS_AINOS: FaqItem = {
  question: 'What is AINOS?',
  answer:
    'AINOS is a business operating suite from Yurekh Solutions. It connects GST billing and accounting, CRM, inventory, HR and payroll, marketing, projects, helpdesk and AI tools in one workspace, so teams stop moving the same data between disconnected apps.',
};

const WHICH_APPS: FaqItem = {
  question: 'Which apps are included in AINOS?',
  answer:
    'The suite includes AINOS Finance, Accounting, CRM, Inventory, People (HR and payroll), Campaigns (marketing), Desk, Projects and AI Studio. AINOS One includes the full app set; each app can also be subscribed separately.',
};

const INDIVIDUAL_APPS: FaqItem = {
  question: 'Can I choose individual apps instead of the full suite?',
  answer:
    'Yes. You can subscribe to the apps your team needs now and add more later. AINOS One is the simpler option when several departments need connected data from day one.',
};

const TALLY_IMPORT: FaqItem = {
  question: 'Can I import data from Tally or Excel?',
  answer:
    'Yes. Customer, product and ledger data can be imported from Tally or Excel so history is not retyped. Finance plans also support exporting ledgers back to Tally-compatible formats.',
};

const GST_SUPPORT: FaqItem = {
  question: 'Does AINOS support GST compliance?',
  answer:
    'AINOS is GST-native: invoices carry automatic CGST, SGST and IGST splits, HSN or SAC codes and tax rates. GSTR-1 and GSTR-3B-ready summaries can be generated from the same invoice and purchase data for review by your accountant.',
};

const DATA_PROTECTION: FaqItem = {
  question: 'How is my business data protected?',
  answer:
    'Traffic between your browser and AINOS uses HTTPS, accounts are protected by sign-in controls, and company data is scoped to the people your team authorises. The Privacy Policy lists the managed infrastructure providers used for hosting, files and email.',
};

const GETTING_STARTED: FaqItem = {
  question: 'How do I get started?',
  answer:
    'Create your business account, add your company and GST details, choose the apps you need and invite your team. You can import existing customers, products and ledgers when you are ready.',
};

const MOBILE: FaqItem = {
  question: 'Does AINOS work on mobile?',
  answer:
    'Yes. The public pages and the signed-in workspace use responsive layouts, so core workflows such as invoices, contacts, tasks and approvals can be opened from a phone or tablet browser.',
};

const MULTI_COMPANY: FaqItem = {
  question: 'Can AINOS handle more than one branch or business?',
  answer:
    'Multi-branch workflows are available on higher finance plans, and the platform supports separate company workspaces. For a group structure, contact the team so the right plan and access model can be mapped before migration.',
};

const WHO_FOR: FaqItem = {
  question: 'Who is AINOS built for?',
  answer:
    'AINOS is built for Indian small and mid-sized businesses that have outgrown spreadsheets or a collection of unrelated tools. It fits service businesses, agencies, retailers, distributors, manufacturers and growing startups.',
};

const GST_REPORTS: FaqItem = {
  question: 'Are GST reports ready to file?',
  answer:
    'AINOS prepares GSTR-1 and GSTR-3B-ready summaries with tax split by rate and B2B or B2C breakup. Your accountant should review the figures before filing on the government portal.',
};

const E_INVOICE: FaqItem = {
  question: 'Does AINOS create e-invoices?',
  answer:
    'AINOS generates GST-compliant invoices with the fields required for e-invoicing workflows. The applicable e-invoice process depends on your turnover and registration, so confirm the current requirement with your tax adviser.',
};

const PAYMENT_REMINDERS: FaqItem = {
  question: 'Can AINOS track unpaid invoices and send reminders?',
  answer:
    'Yes. The finance workspace shows outstanding and overdue invoices, ageing information and reminder actions so receivables do not depend on a separate spreadsheet.',
};

const DATA_OWNERSHIP: FaqItem = {
  question: 'Who owns the data I put into AINOS?',
  answer:
    'You own your business data. AINOS processes it to provide the service, and export options are available so your records are not locked inside the platform. The Privacy Policy explains retention, deletion and vendor processing.',
};

const ACCESS_CONTROL: FaqItem = {
  question: 'Can I control what each team member sees?',
  answer:
    'Yes. Accounts use role-based access and company-scoped data, so owners, accounts, sales and operations can be given different levels of access instead of sharing one password.',
};

const AI_DATA: FaqItem = {
  question: 'How should AI output be used?',
  answer:
    'AI tools help draft content, extract document data and summarise information, but their output should be reviewed before it is sent, filed or used for a compliance decision. AI actions consume credits from your plan.',
};

const HOSTING: FaqItem = {
  question: 'Where is AINOS hosted?',
  answer:
    'AINOS runs on managed cloud infrastructure. The Privacy Policy names the current providers for database hosting, file storage, email delivery and AI processing, along with how each is used.',
};

export const TRIAL: FaqItem = {
  question: 'Is there a trial?',
  answer:
    'New companies can start a 14-day AINOS One trial after registration. The trial opens the full app set so the team can test connected workflows before choosing a subscription.',
};

export const PRICING: FaqItem = {
  question: 'How much does AINOS cost?',
  answer:
    'AINOS One is ₹3,999 per month and includes the full app set. Individual apps start at ₹799 per month, and AI Studio is ₹1,499 per month. The pricing page lists what each option includes.',
};

export const CREDITS: FaqItem = {
  question: 'What are AI credits?',
  answer:
    'AI actions such as content generation, document extraction and audits consume credits. Each subscription includes an allowance, and the billing area shows the balance and usage for your workspace.',
};

export const CHANGE_PLAN: FaqItem = {
  question: 'Can I change or cancel my plan?',
  answer:
    'You can move to a different app selection as your team changes. For cancellation, billing adjustments or a custom plan, contact info.ainosio@gmail.com and the team will confirm the options under the Terms and Conditions.',
};

export const CUSTOM_PLAN: FaqItem = {
  question: 'Do you offer a custom or enterprise plan?',
  answer:
    'Yes. Multi-branch operations, custom integrations, API access and dedicated account management can be scoped for larger teams. Email info.ainosio@gmail.com with your requirements.',
};

const SUPPORT: FaqItem = {
  question: 'How do I get support?',
  answer:
    'Email info.ainosio@gmail.com with your company name, the screen involved and what you expected to happen. Include a screenshot where possible so the team can reproduce the issue faster.',
};

const IMPORT_TIME: FaqItem = {
  question: 'Can I bring existing customers and stock across?',
  answer:
    'Yes. AINOS supports importing customer, product and opening-stock data from spreadsheet or Tally formats. Start with a small sample, verify the mapping, then import the full file.',
};

const GST_RETURNS: FaqItem = {
  question: 'Does AINOS file GST returns for me?',
  answer:
    'AINOS prepares the data. Invoices carry the tax split, HSN codes and place of supply, and Accounting produces GST-ready summaries for the period. Filing on the GST portal stays with you or your accountant, and the forms depend on your registration, so confirm the current requirement with your adviser.',
};

const PAYROLL_STATUTORY: FaqItem = {
  question: 'Can payroll calculate PF, ESI and professional tax?',
  answer:
    'Yes. Payroll settings store the provident fund rate and wage ceiling, the ESI rate and ceiling, and the professional tax for your state. Each payslip is computed from that configuration, so the deductions can be checked before the run is released.',
};

const EWAY_BILL: FaqItem = {
  question: 'Do invoices carry e-way bill details?',
  answer:
    'Invoices and delivery challans include fields for the e-way bill number and transport details, and templates can print the terms your business uses. The e-way bill itself is generated on the government portal; AINOS keeps the reference beside the dispatch record.',
};

const COMPLIANCE_CALENDAR: FaqItem = {
  question: 'How are compliance due dates tracked?',
  answer:
    'The compliance calendar holds tasks with a category, due date and owner, and the documents attached to them stay in the workspace vault. It is a reminder and record system for your team, not a filing or legal service.',
};

const PAYMENT_LINK: FaqItem = {
  question: 'Do payment links work with UPI?',
  answer:
    'A payment link carries the invoice amount, and the payer records the UPI reference after transferring. The reference and status stay attached to that invoice, so reconciliation does not depend on a screenshot.',
};

export const HOME_FAQS: FaqItem[] = [
  WHAT_IS_AINOS,
  WHICH_APPS,
  TALLY_IMPORT,
  GST_SUPPORT,
  DATA_PROTECTION,
  INDIVIDUAL_APPS,
];

export const FAQ_CATEGORIES: { id: string; title: string; intro: string; items: FaqItem[] }[] = [
  {
    id: 'product',
    title: 'Product and platform',
    intro: 'What AINOS is, who it fits and how the apps work together.',
    items: [WHAT_IS_AINOS, WHICH_APPS, INDIVIDUAL_APPS, WHO_FOR, MOBILE, MULTI_COMPANY],
  },
  {
    id: 'finance',
    title: 'Finance, GST and inventory',
    intro: 'Billing, tax reports, imports and day-to-day operations.',
    items: [GST_SUPPORT, GST_REPORTS, E_INVOICE, TALLY_IMPORT, PAYMENT_REMINDERS, IMPORT_TIME],
  },
  {
    id: 'compliance',
    title: 'Compliance, payroll and logistics',
    intro: 'Returns, statutory payroll, dispatch documents and due dates.',
    items: [GST_RETURNS, PAYROLL_STATUTORY, EWAY_BILL, COMPLIANCE_CALENDAR, PAYMENT_LINK],
  },
  {
    id: 'data',
    title: 'Data and security',
    intro: 'Ownership, access, hosting and responsible use of AI.',
    items: [DATA_PROTECTION, DATA_OWNERSHIP, ACCESS_CONTROL, HOSTING, AI_DATA],
  },
  {
    id: 'plans',
    title: 'Plans and billing',
    intro: 'Trial, pricing, credits and changing your subscription.',
    items: [TRIAL, PRICING, CREDITS, CHANGE_PLAN, CUSTOM_PLAN],
  },
  {
    id: 'getting-started',
    title: 'Getting started',
    intro: 'From the first account to a working team workspace.',
    items: [GETTING_STARTED, SUPPORT],
  },
];

export const ALL_FAQS: FaqItem[] = FAQ_CATEGORIES.flatMap((category) => category.items);

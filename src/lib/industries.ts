import {
  Building2,
  Factory,
  Rocket,
  ShoppingBag,
  Truck,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FaqItem } from '@/lib/faqs';

/**
 * Industry pages sit under /industries and answer "does this fit my kind of
 * business?" without repeating the feature catalogue. Every claim here is
 * limited to what the product actually does in each app.
 */
export type Industry = {
  slug: string;
  name: string;
  shortName: string;
  icon: LucideIcon;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  eyebrow: string;
  headline: string;
  summary: string;
  intro: string;
  painPoints: { title: string; body: string }[];
  modules: { label: string; href: string; note: string }[];
  workflow: { title: string; body: string }[];
  faqs: FaqItem[];
};

export const INDUSTRIES: Industry[] = [
  {
    slug: 'retail-and-ecommerce',
    name: 'Retail and eCommerce',
    shortName: 'Retail and eCommerce',
    icon: ShoppingBag,
    metaTitle: 'AINOS for Retail — Billing, Stock, Orders',
    metaDescription:
      'Run counter billing, online orders, stock and GST invoices from one workspace. AINOS connects POS, eCommerce, inventory and finance for Indian retailers.',
    keywords: ['retail billing software', 'ecommerce management India', 'POS and inventory software', 'GST billing for shops'],
    eyebrow: 'Industry',
    headline: 'One stock position for the counter and the website.',
    summary:
      'Sell at the counter, online or both, and keep the product list, stock and GST invoices in one place.',
    intro:
      'A second counter, a marketplace listing, a WhatsApp order: each new channel adds another stock figure. AINOS keeps the catalogue, the counter and the website on one quantity.',
    painPoints: [
      {
        title: 'Stock that disagrees with itself',
        body: 'Counter sales and online orders update different systems, so the reorder decision is based on a number nobody trusts.',
      },
      {
        title: 'Billing that stops at the counter',
        body: 'A POS bill and a GST invoice are often two documents, which means the tax record is rebuilt later from memory.',
      },
      {
        title: 'Customer history in pieces',
        body: 'Repeat buyers are remembered by the person at the counter, not by a record the business can use.',
      },
    ],
    modules: [
      { label: 'Point of Sale', href: '/features/point-of-sale', note: 'Counter billing, register sessions and daily sales reports.' },
      { label: 'eCommerce', href: '/features/ecommerce', note: 'Store, product catalogue, orders, coupons and reviews.' },
      { label: 'Supply Chain', href: '/features/supply-chain', note: 'Stock across locations, purchase orders and vendor records.' },
      { label: 'Finance', href: '/features/finance', note: 'GST invoices, quotations and payment follow-up.' },
    ],
    workflow: [
      {
        title: 'Keep one catalogue',
        body: 'Products, HSN codes, tax rates and prices live in one list that the counter, the store and purchase orders all read from.',
      },
      {
        title: 'Bill and sell from the same stock',
        body: 'A counter sale, an online order and a stock transfer each move the same inventory record, so the quantity stays explainable.',
      },
      {
        title: 'Close the day with tax-ready records',
        body: 'Daily sales, payment mode and tax split come from the same invoices the accountant receives.',
      },
    ],
    faqs: [
      {
        question: 'Can AINOS bill at the counter and online in the same account?',
        answer:
          'Yes. Point of Sale and eCommerce share the product catalogue, stock and customer records inside one company workspace, so counter sales and online orders update the same inventory.',
      },
      {
        question: 'Does retail billing include GST on each invoice?',
        answer:
          'GST invoices carry CGST, SGST or IGST splits, HSN codes and tax rates based on the place of supply, and the same data feeds the GST-ready reports in Accounting.',
      },
      {
        question: 'Do I need the full suite to start selling?',
        answer:
          'No. POS, eCommerce or Finance can each be subscribed separately. AINOS One is the option when the counter, the store and the books need to share records from day one.',
      },
    ],
  },
  {
    slug: 'wholesale-distribution',
    name: 'Wholesale and distribution',
    shortName: 'Wholesale',
    icon: Truck,
    metaTitle: 'AINOS for Wholesale — Orders and Stock',
    metaDescription:
      'Track purchase orders, warehouses, sales orders and outstanding balances across a growing dealer network. Built for Indian wholesale and distribution teams.',
    keywords: ['distribution software India', 'wholesale billing software', 'purchase order software', 'dealer management'],
    eyebrow: 'Industry',
    headline: 'Margin lives in the details: rate, freight and outstanding.',
    summary:
      'Purchase, stock movement, sales orders and collections stay connected instead of living in separate registers.',
    intro:
      'Distribution is a credit business. Rates, challans and outstanding balances move faster than the paperwork, so AINOS records each one against the same buyer, order and invoice.',
    painPoints: [
      {
        title: 'Purchase and sales sheets apart',
        body: 'Buying and selling teams work from different spreadsheets, so landed cost and margin are calculated after the month ends.',
      },
      {
        title: 'Stock counted, not tracked',
        body: 'Warehouse quantities are verified physically because the system figure is only as current as the last manual update.',
      },
      {
        title: 'Receivables chased from memory',
        body: 'Outstanding balances are compiled from ledgers and reminders sit in individual follow-up lists.',
      },
    ],
    modules: [
      { label: 'Supply Chain', href: '/features/supply-chain', note: 'Purchase orders, sales orders, warehouses and vendor records.' },
      { label: 'Finance', href: '/features/finance', note: 'Invoices, delivery challans and pending payment reminders.' },
      { label: 'Accounting', href: '/features/accounting', note: 'Day book, ledgers and GST-ready reports.' },
      { label: 'CRM', href: '/features/crm', note: 'Dealer and buyer follow-ups with full order history.' },
    ],
    workflow: [
      {
        title: 'Quote and confirm',
        body: 'A quotation becomes a sales order with the rate, quantity and delivery terms already recorded against the buyer.',
      },
      {
        title: 'Dispatch with documents',
        body: 'Delivery challans and invoices are raised from the same order, so the goods movement and the tax document agree.',
      },
      {
        title: 'Collect on schedule',
        body: 'Outstanding balances sit beside the invoice they came from, so reminders go to the right buyer with the right amount.',
      },
    ],
    faqs: [
      {
        question: 'Can AINOS handle multiple warehouses?',
        answer:
          'Yes. Stock can be tracked per warehouse and moved between locations with transfers, while purchase and sales orders stay linked to the product catalogue.',
      },
      {
        question: 'Does it support credit sales and payment follow-up?',
        answer:
          'Invoices record the amount due and payment status, and Finance includes pending payment reminders so collections are worked from the invoice record rather than a separate sheet.',
      },
      {
        question: 'Can we import our existing ledger and product list?',
        answer:
          'Customer, product and ledger data can be imported from Tally or Excel formats, so opening balances and item master records do not have to be retyped.',
      },
    ],
  },
  {
    slug: 'manufacturing',
    name: 'Manufacturing',
    shortName: 'Manufacturing',
    icon: Factory,
    metaTitle: 'AINOS for Manufacturing — BOM and Orders',
    metaDescription:
      'Plan bills of materials, production orders and work centers, then bill the finished goods with GST. AINOS connects the shop floor to finance.',
    keywords: ['manufacturing software India', 'BOM software', 'production planning software', 'MRP for small manufacturers'],
    eyebrow: 'Industry',
    headline: 'Production, material and billing on the same plan.',
    summary:
      'Bills of materials, production orders and work centers stay connected to purchase, stock and invoices.',
    intro:
      'Production often runs on paper while accounting runs on software. The gap surfaces as material shortages and jobs closing without a cost figure. AINOS ties the build order to the material issued and the invoice raised.',
    painPoints: [
      {
        title: 'Bill of materials in a file',
        body: 'Component quantities live in a spreadsheet, so a design or vendor change does not reach the shop floor.',
      },
      {
        title: 'Production status by asking around',
        body: 'Job progress is confirmed in person, which makes delivery promises and capacity planning guesswork.',
      },
      {
        title: 'Cost discovered after delivery',
        body: 'Material and labour are reconciled after the invoice, when the margin is already fixed.',
      },
    ],
    modules: [
      { label: 'Manufacturing', href: '/features/manufacturing', note: 'Bills of materials, manufacturing orders, work centers and quality checks.' },
      { label: 'Supply Chain', href: '/features/supply-chain', note: 'Raw material stock, purchase orders and vendor records.' },
      { label: 'Finance', href: '/features/finance', note: 'GST invoices, purchase records and payment tracking.' },
      { label: 'Operations', href: '/features/operations', note: 'Maintenance, quality and repair workflows around the plant.' },
    ],
    workflow: [
      {
        title: 'Define the build',
        body: 'A bill of materials lists the components and quantities behind each finished product, with the operations that consume them.',
      },
      {
        title: 'Run the order',
        body: 'A manufacturing order consumes material, moves through work centers and records quality checks as work progresses.',
      },
      {
        title: 'Bill from the finished record',
        body: 'Finished quantities and material consumption feed stock and invoices, so the delivery note and the tax document match.',
      },
    ],
    faqs: [
      {
        question: 'Does AINOS support bills of materials and production orders?',
        answer:
          'Yes. The Manufacturing app covers bills of materials, manufacturing orders, work centers, quality checks and scrap, with material consumption reflected in stock.',
      },
      {
        question: 'Can we track raw material and finished goods separately?',
        answer:
          'Stock is tracked by product and warehouse in Supply Chain, and manufacturing consumption moves raw material into finished goods so both positions stay visible.',
      },
      {
        question: 'Is manufacturing included in AINOS One?',
        answer:
          'AINOS One includes the full app set, including Manufacturing. The app can also be subscribed on its own when production is the first workflow you want to fix.',
      },
    ],
  },
  {
    slug: 'agencies-and-professional-services',
    name: 'Agencies and professional services',
    shortName: 'Professional services',
    icon: Building2,
    metaTitle: 'AINOS for Agencies and Professional Services',
    metaDescription:
      'Keep clients, proposals, project delivery and GST invoices in one workspace. AINOS for agencies, consultancies, CA firms and professional service teams.',
    keywords: ['agency software India', 'professional services billing', 'project and invoice software', 'consultancy CRM'],
    eyebrow: 'Industry',
    headline: 'The client record survives the handoff.',
    summary:
      'Proposals, delivery, time and invoices stay attached to the same client instead of living in separate tools.',
    intro:
      'Service firms lose margin in the seams: a proposal that never becomes a project, hours that never reach an invoice. AINOS carries one client record from scope through delivery to payment.',
    painPoints: [
      {
        title: 'Scope drift without a record',
        body: 'Change requests are agreed in email, so the invoice is prepared from memory and the extra work is argued afterwards.',
      },
      {
        title: 'Delivery and billing disconnected',
        body: 'Project boards and invoices live in different tools, which means the same engagement is described twice.',
      },
      {
        title: 'Follow-ups in personal inboxes',
        body: 'Pipeline and renewals depend on whoever remembers, not on a shared record of what was promised.',
      },
    ],
    modules: [
      { label: 'CRM', href: '/features/crm', note: 'Leads, deals, proposals and follow-up history per client.' },
      { label: 'Workspace', href: '/features/workspace', note: 'Projects, tasks, approvals and team collaboration.' },
      { label: 'Finance', href: '/features/finance', note: 'Quotations, GST invoices and payment reminders.' },
      { label: 'People', href: '/features/people', note: 'Timesheets, attendance and payroll for the delivery team.' },
    ],
    workflow: [
      {
        title: 'Win the engagement',
        body: 'A deal carries the client, contact history and agreed scope, then opens as a project with the same details.',
      },
      {
        title: 'Deliver with visible scope',
        body: 'Tasks and approvals sit against the project, so change requests are recorded where the invoice can use them.',
      },
      {
        title: 'Invoice what was delivered',
        body: 'Quotations become invoices from the same client record, and outstanding amounts stay linked to the engagement.',
      },
    ],
    faqs: [
      {
        question: 'Can AINOS track projects and bill from them?',
        answer:
          'Workspace holds projects, tasks and approvals, and Finance holds quotations and invoices for the same client, so billing is prepared from the delivery record rather than a separate sheet.',
      },
      {
        question: 'Does it work for a CA or legal practice?',
        answer:
          'Yes. CRM holds client relationships, Workspace holds recurring engagements and compliance documents, and Finance raises GST invoices and tracks outstanding fees.',
      },
      {
        question: 'Can different people see different clients?',
        answer:
          'Access is scoped to the company workspace with role-based permission, so team members work with the records their role needs.',
      },
    ],
  },
  {
    slug: 'startups-and-new-businesses',
    name: 'Startups and new businesses',
    shortName: 'Startups',
    icon: Rocket,
    metaTitle: 'AINOS for Startups — Invoicing and CRM',
    metaDescription:
      'Set up GST billing, a sales pipeline and team records before the stack becomes permanent. AINOS gives a new business one workspace from the first invoice.',
    keywords: ['startup software India', 'GST registration invoicing', 'small business CRM', 'business software for founders'],
    eyebrow: 'Industry',
    headline: 'Start with the records you will still use at fifty employees.',
    summary:
      'A new business needs billing, a pipeline and people records now — not a migration in year two.',
    intro:
      'New businesses collect tools as they solve problems one at a time. AINOS is built so the first invoice and the thousandth use the same workspace, and a new department does not mean starting over.',
    painPoints: [
      {
        title: 'Tools chosen one problem at a time',
        body: 'Each new hire brings another app, and the founder becomes the integration between them.',
      },
      {
        title: 'Billing without a paper trail',
        body: 'Invoices and payment reminders are managed manually, which works until there are more than a handful of customers.',
      },
      {
        title: 'Rebuilding history at every stage',
        body: 'Moving from one tool to the next means exporting, cleaning and re-entering the same customer and product data.',
      },
    ],
    modules: [
      { label: 'Finance', href: '/features/finance', note: 'GST invoices, quotes and payment follow-up from day one.' },
      { label: 'CRM', href: '/features/crm', note: 'One pipeline for leads, deals and follow-ups.' },
      { label: 'People', href: '/features/people', note: 'Joining records, attendance and payroll as the team grows.' },
      { label: 'AI Studio', href: '/features/ai-studio', note: 'Content, document extraction and analysis with credits under your plan.' },
    ],
    workflow: [
      {
        title: 'Register the company once',
        body: 'Tax, contact and document details are captured in the company profile and reused across every app.',
      },
      {
        title: 'Enable only what is in use',
        body: 'Start with Finance and CRM, then switch on People, Projects or Inventory when the work actually appears.',
      },
      {
        title: 'Grow without a migration',
        body: 'New modules read the same customers, products and employees, so nothing has to be exported and rebuilt.',
      },
    ],
    faqs: [
      {
        question: 'Is there a trial for a new company?',
        answer:
          'New companies can start a 14-day AINOS One trial after registration, which opens the full app set so the team can test connected workflows before choosing a subscription.',
      },
      {
        question: 'Do we have to buy the whole suite on day one?',
        answer:
          'No. Individual apps start at ₹799 per month and AI Studio is ₹1,499 per month. AINOS One at ₹3,999 per month includes the full app set when several departments need connected data.',
      },
      {
        question: 'Can we start with one person and add the team later?',
        answer:
          'Yes. Team members are invited into the same company workspace with the access their role needs, so the account grows without moving data.',
      },
    ],
  },
  {
    slug: 'logistics-and-field-operations',
    name: 'Logistics and field operations',
    shortName: 'Field operations',
    icon: Wrench,
    metaTitle: 'AINOS for Logistics and Field Operations',
    metaDescription:
      'Dispatch field jobs, track maintenance, run a fleet and log quality or repair work, then bill from the same record. AINOS operations suite for Indian service teams.',
    keywords: ['field service software India', 'fleet maintenance software', 'job dispatch software', 'equipment rental software'],
    eyebrow: 'Industry',
    headline: 'Every job, vehicle and site on one schedule.',
    summary:
      'Dispatch, maintenance, fleet logs and rental records stay connected to the customers and invoices behind them.',
    intro:
      'Operations are judged on response time and asset uptime. When dispatch, service history and billing sit in separate registers, the next job starts before the last one is closed. AINOS keeps job, asset and invoice together.',
    painPoints: [
      {
        title: 'Dispatch on phone calls',
        body: 'Job allocation depends on who answers first, so travel time and technician load are guessed rather than planned.',
      },
      {
        title: 'Maintenance history scattered',
        body: 'Service records sit with individual technicians, so repeated faults and warranty patterns stay invisible.',
      },
      {
        title: 'Billing after the fact',
        body: 'Site visits, parts used and rental periods are reconstructed at month end from notebooks and messages.',
      },
    ],
    modules: [
      { label: 'Operations', href: '/features/operations', note: 'Field service, maintenance, fleet, quality, repair and rental.' },
      { label: 'Supply Chain', href: '/features/supply-chain', note: 'Parts, spares and stock movement per location.' },
      { label: 'Finance', href: '/features/finance', note: 'Invoices for jobs, rentals and parts with GST applied.' },
      { label: 'People', href: '/features/people', note: 'Technician records, attendance and timesheets.' },
    ],
    workflow: [
      {
        title: 'Schedule the work',
        body: 'A job is created against the customer and site, with the asset and technician assigned before the visit.',
      },
      {
        title: 'Record what happened',
        body: 'Maintenance logs, parts used and quality checks are captured against the same job while the technician is on site.',
      },
      {
        title: 'Bill the same record',
        body: 'Invoices for labour, parts and rental periods are raised from the completed job instead of a separate estimate.',
      },
    ],
    faqs: [
      {
        question: 'Does AINOS cover field service and fleet in one app?',
        answer:
          'Yes. The Operations app includes field service dispatch, preventive maintenance, fleet records with odometer logs, quality checks, repair jobs and rentals.',
      },
      {
        question: 'Can rental periods be billed accurately?',
        answer:
          'Rental records hold the assigned asset, customer and period, and invoices are raised from that record, so the billed duration matches the booking.',
      },
      {
        question: 'Can technicians use it on a phone?',
        answer:
          'AINOS is a responsive web app, so job and maintenance screens work in a mobile browser without a separate install.',
      },
    ],
  },
];

export const INDUSTRY_SLUGS = INDUSTRIES.map((industry) => industry.slug);

export function getIndustry(slug: string): Industry | undefined {
  return INDUSTRIES.find((industry) => industry.slug === slug);
}

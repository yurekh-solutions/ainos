import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, BookOpen } from 'lucide-react';
import { pageMetadata, absoluteUrl } from '@/lib/seo';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import { CtaBand, PageHero, SectionHeading } from '@/components/marketing/PageHero';

export const metadata: Metadata = pageMetadata({
  title: 'Glossary — GST, Accounting, Software Terms',
  description:
    'Plain-English definitions of the terms behind a business suite: GST, CGST, SGST, IGST, HSN, GSTR-1, e-way bill, ledger, day book, SKU, BOM, CTC, PF and more.',
  path: '/glossary',
  keywords: [
    'business glossary',
    'GST terms explained',
    'CGST SGST IGST meaning',
    'HSN code meaning',
    'GSTR-1 definition',
    'business software terms',
  ],
});

type Term = {
  term: string;
  definition: string;
  link?: { label: string; href: string };
};

const GROUPS: { id: string; title: string; intro: string; terms: Term[] }[] = [
  {
    id: 'gst',
    title: 'GST and tax documents',
    intro: 'The tax vocabulary that appears on almost every invoice an Indian business issues.',
    terms: [
      {
        term: 'GST',
        definition:
          'Goods and Services Tax: the single indirect tax India applies to the supply of goods and services. It is collected at each stage of the supply chain and passed on, so the final consumer carries the cost.',
        link: { label: 'GST invoicing', href: '/features/finance/invoices' },
      },
      {
        term: 'CGST and SGST',
        definition:
          'For a sale inside one state, GST is split into two equal halves: Central GST and State GST. A ₹1,000 sale at 18% carries ₹90 CGST and ₹90 SGST on the invoice.',
      },
      {
        term: 'IGST',
        definition:
          'Integrated GST applies to inter-state supply and to imports. The full tax amount is charged as IGST instead of being split between centre and state, and is later apportioned by the government.',
      },
      {
        term: 'HSN code',
        definition:
          'Harmonised System of Nomenclature: the numerical classification for a physical product. The code determines the applicable GST rate and is printed on the invoice line.',
      },
      {
        term: 'SAC code',
        definition:
          'Services Accounting Code: the services equivalent of an HSN code. Every service line on a tax invoice is classified with a SAC code and a rate.',
      },
      {
        term: 'GSTR-1',
        definition:
          'The outward-supply return: a statement of the sales invoices raised in a period, with buyer GSTIN, invoice value and tax split. AINOS produces a review-ready summary from the invoices already raised.',
        link: { label: 'GST reports', href: '/features/accounting/gst-reports' },
      },
      {
        term: 'GSTR-3B',
        definition:
          'The summary return that sets out tax payable and input credit for the period. It is prepared from the same sales and purchase data that produces GSTR-1.',
      },
      {
        term: 'e-invoice',
        definition:
          'An invoice registered with the government portal and issued with a unique reference, required above turnover thresholds set by the GST Council. The document itself still comes from your billing software.',
      },
      {
        term: 'e-way bill',
        definition:
          'The document required for moving goods above a notified value. Invoices and delivery challans in AINOS carry fields for the e-way bill number and transport details so the reference sits beside the dispatch.',
      },
      {
        term: 'Credit note and debit note',
        definition:
          'A credit note reduces the value of an earlier invoice — a return, a discount or a rate correction. A debit note increases it. Both reference the original invoice so the tax adjustment stays traceable.',
        link: { label: 'Credit notes', href: '/features/accounting/credit-notes' },
      },
      {
        term: 'Place of supply',
        definition:
          'The rule that decides whether a transaction is intra-state (CGST plus SGST) or inter-state (IGST). It depends on where the goods move or where the service is consumed, not only where the seller sits.',
      },
    ],
  },
  {
    id: 'accounting',
    title: 'Accounting and bookkeeping',
    intro: 'The records a business keeps so the numbers can be explained months later.',
    terms: [
      {
        term: 'Day book',
        definition:
          'A chronological register of every sale, purchase and expense recorded on a date. It answers "what happened today" without opening five separate reports.',
        link: { label: 'Day book', href: '/features/accounting/daybook' },
      },
      {
        term: 'Ledger',
        definition:
          'The running record of transactions against one account — a customer, a vendor, a bank account or an expense head — with a closing balance.',
      },
      {
        term: 'Accounts receivable',
        definition:
          'Money owed to the business by customers for invoices already raised. Ageing shows how long each amount has been outstanding, which is what turns a total into a collection plan.',
        link: { label: 'Payment reminders', href: '/features/finance/payment-reminders' },
      },
      {
        term: 'Reconciliation',
        definition:
          'Matching two independent records of the same money — bank statement against cash book, or payment reference against invoice — until the difference is explained.',
      },
      {
        term: 'TDS',
        definition:
          'Tax Deducted at Source: tax withheld by the payer on specified payments and deposited with the government against the payee’s PAN. It appears on expense and vendor records rather than on sales invoices.',
      },
      {
        term: 'Trial balance',
        definition:
          'A list of every ledger with its closing debit or credit balance. If the two columns do not agree, a transaction has been posted incorrectly somewhere.',
      },
    ],
  },
  {
    id: 'sales',
    title: 'Sales and CRM',
    intro: 'How a business describes the journey from first enquiry to repeat order.',
    terms: [
      {
        term: 'CRM',
        definition:
          'Customer Relationship Management: the system of record for leads, contacts, deals and every follow-up attached to them, so a customer conversation survives a change of staff.',
        link: { label: 'AINOS CRM', href: '/features/crm' },
      },
      {
        term: 'Lead',
        definition:
          'An unqualified enquiry — a name with a phone number and a source. It becomes a contact and then a deal once there is a real requirement and a next step.',
        link: { label: 'Lead management', href: '/features/crm/leads' },
      },
      {
        term: 'Pipeline',
        definition:
          'The stages a deal moves through, from first conversation to closed. Its value is not the total on screen but knowing which stage usually stalls.',
        link: { label: 'Deals pipeline', href: '/features/crm/deals' },
      },
      {
        term: 'Follow-up',
        definition:
          'A scheduled next action with a date and an owner. A deal without a dated follow-up is a deal that depends on memory.',
      },
      {
        term: 'Quotation',
        definition:
          'A priced offer sent before the sale, with validity dates and terms. Converting an accepted quotation into an invoice without retyping the lines is where most billing errors disappear.',
        link: { label: 'Quotations', href: '/features/finance/quotations' },
      },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory and operations',
    intro: 'The terms used when goods, materials and machines are the business.',
    terms: [
      {
        term: 'SKU',
        definition:
          'Stock Keeping Unit: the smallest unit a product is tracked in — a size, a colour, a pack. Every SKU carries its own stock level, cost and reorder point.',
        link: { label: 'Stock management', href: '/features/supply-chain/stock' },
      },
      {
        term: 'Reorder level',
        definition:
          'The stock quantity that triggers a purchase. Set from how long a vendor takes to deliver plus the average daily consumption, so the flag arrives before the shelf is empty.',
      },
      {
        term: 'Bill of materials',
        definition:
          'The list of components and quantities that make one finished product. It is the difference between costing a product and guessing at it.',
        link: { label: 'Bill of materials', href: '/features/manufacturing/bills-of-materials' },
      },
      {
        term: 'Delivery challan',
        definition:
          'A document that accompanies goods moved without a sale invoice — a job-work dispatch, a branch transfer or a return. It carries item, quantity and transport details.',
        link: { label: 'Delivery challans', href: '/features/finance/delivery-challans' },
      },
      {
        term: 'Work center',
        definition:
          'A machine, cell or line with a defined capacity. Production is scheduled against work centers, which is how a shop floor knows what it can promise.',
        link: { label: 'Work centers', href: '/features/manufacturing/work-centers' },
      },
      {
        term: 'Purchase order',
        definition:
          'A formal request to a vendor for goods or services at an agreed price. It becomes the reference for what was received and what should be billed.',
        link: { label: 'Purchase orders', href: '/features/finance/purchase-orders' },
      },
    ],
  },
  {
    id: 'people',
    title: 'People and payroll',
    intro: 'The payroll vocabulary that decides what an employee actually receives.',
    terms: [
      {
        term: 'CTC',
        definition:
          'Cost to Company: the total annual cost of an employee, including salary, employer contributions and benefits. It is not the same as monthly take-home pay.',
        link: { label: 'Payroll', href: '/features/people/payroll' },
      },
      {
        term: 'PF (Provident Fund)',
        definition:
          'A retirement contribution made by employer and employee, calculated on basic pay within a wage ceiling. Both halves appear on the payslip as separate lines.',
      },
      {
        term: 'ESI',
        definition:
          'Employee State Insurance: a health and social security contribution for employees within a wage ceiling. Rates and ceilings are configured in payroll settings, not typed per payslip.',
      },
      {
        term: 'Professional tax',
        definition:
          'A state-level tax deducted from salary. The amount depends on the state and the salary slab, which is why payroll must store a state-specific table.',
      },
      {
        term: 'Timesheet',
        definition:
          'A record of hours worked per person per project or task. It connects delivery effort to billing, and is the honest source for utilisation numbers.',
        link: { label: 'Timesheets', href: '/features/people/timesheets' },
      },
    ],
  },
  {
    id: 'platform',
    title: 'Software and platform terms',
    intro: 'The words used to describe how a platform holds a company’s data.',
    terms: [
      {
        term: 'Business suite',
        definition:
          'One platform that runs the core operations of a company — sales, finance, stock, people and marketing — on a shared set of records, instead of a separate app per department.',
        link: { label: 'What is a business suite?', href: '/business-suite' },
      },
      {
        term: 'ERP',
        definition:
          'Enterprise Resource Planning: software that plans resources — material, capacity, money, people — across a business. A suite covers the same ground at a lighter implementation weight.',
      },
      {
        term: 'Workspace',
        definition:
          'The company-scoped container that holds a team’s modules, records and permissions. One login can open the workspaces a person has been granted.',
        link: { label: 'AINOS Workspace', href: '/features/workspace' },
      },
      {
        term: 'Role-based access',
        definition:
          'Permissions granted by role rather than by sharing a login, so accounts, sales and operations each see the records their job needs and nothing more.',
        link: { label: 'Team and roles', href: '/features/workspace/team' },
      },
      {
        term: 'Workflow automation',
        definition:
          'A rule that performs a step without a person: raise the recurring invoice, notify the approver, create the task when a deal closes. Automations remove the routine, not the review.',
        link: { label: 'Automations', href: '/features/workspace/automations' },
      },
      {
        term: 'Credit (AI)',
        definition:
          'The unit consumed when an AI action runs — generating content, extracting a document, auditing a page. Each plan includes an allowance, and the balance is visible in billing.',
      },
    ],
  },
];

const DEFINED_TERMS = GROUPS.flatMap((group) => group.terms);

export default function GlossaryPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'DefinedTermSet',
          '@id': absoluteUrl('/glossary'),
          name: 'AINOS business glossary',
          description:
            'Plain-English definitions of the GST, accounting, sales, inventory, payroll and software terms used across AINOS Business Suite.',
          url: absoluteUrl('/glossary'),
          inLanguage: 'en-IN',
          hasDefinedTerm: DEFINED_TERMS.map((entry) => ({
            '@type': 'DefinedTerm',
            name: entry.term,
            description: entry.definition,
            inDefinedTermSet: absoluteUrl('/glossary'),
          })),
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: absoluteUrl('/') },
          { name: 'Glossary', url: absoluteUrl('/glossary') },
        ])}
      />

      <PageHero
        eyebrow="Glossary"
        title="The business, tax and software terms, defined without jargon."
        description={`${DEFINED_TERMS.length} terms that come up when a team moves onto a business suite — GST documents, accounting records, sales stages, inventory, payroll and platform concepts.`}
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Glossary', href: '/glossary' },
        ]}
        actions={[
          { label: 'What is a business suite?', href: '/business-suite' },
          { label: 'Read the FAQ', href: '/faq', variant: 'secondary' },
        ]}
        aside={
          <div className="rounded-[1.75rem] border border-purple-100 bg-white p-6 shadow-xl shadow-purple-950/5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">How to use this page</p>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              Each entry is a working definition, not a legal one. Where a term has a compliance implication — GST
              returns, e-invoicing, payroll deductions — confirm the current rule with your accountant or tax adviser
              before acting on it.
            </p>
            <div className="mt-5 space-y-2">
              {GROUPS.map((group) => (
                <a
                  key={group.id}
                  href={`#${group.id}`}
                  className="flex items-center justify-between rounded-xl bg-[#fbf9ff] px-4 py-2.5 text-sm font-medium text-gray-800 ring-1 ring-purple-100/70 transition-colors hover:text-[#4c1d95]"
                >
                  {group.title}
                  <span className="text-xs text-gray-400">{group.terms.length}</span>
                </a>
              ))}
            </div>
          </div>
        }
      />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-8 flex items-start gap-4 rounded-3xl border border-purple-100 bg-[#fbfaff] p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white ring-1 ring-purple-100">
            <BookOpen className="h-5 w-5 text-[#5b21b6]" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-gray-950">Why a glossary belongs on a product site</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Most software decisions stall on vocabulary, not features. A team that agrees on what a day book, a
              challan or a reorder level means can compare tools on substance. These definitions use the same words the
              AINOS workspace uses on screen, so the documentation and the product describe the same thing.
            </p>
          </div>
        </div>

        {GROUPS.map((group) => (
          <section key={group.id} id={group.id} className="scroll-mt-24 border-t border-gray-100 py-12 first:border-t-0 first:pt-0">
            <SectionHeading eyebrow={`${group.terms.length} terms`} title={group.title} description={group.intro} />
            <dl className="mt-8 space-y-3">
              {group.terms.map((entry) => (
                <div
                  key={entry.term}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-colors hover:border-purple-200 sm:p-6"
                >
                  <dt className="text-base font-semibold text-gray-950">{entry.term}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-gray-600">{entry.definition}</dd>
                  {entry.link && (
                    <dd className="mt-3">
                      <Link
                        href={entry.link.href}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5b21b6] transition-colors hover:text-[#4c1d95]"
                      >
                        {entry.link.label} <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          </section>
        ))}

        <p className="mt-8 rounded-2xl bg-gray-50 px-5 py-4 text-xs leading-relaxed text-gray-500">
          Definitions are written for business readers and reflect how AINOS applies each term. They are not tax, legal
          or accounting advice. Statutory rates, thresholds and return formats change, so verify the requirement that
          applies to your business before filing.
        </p>
      </div>

      <CtaBand
        eyebrow="From definitions to practice"
        title="See these terms working inside one business suite."
        description="Open any suite to see how the definition becomes a screen: an invoice with a tax split, a day book that fills itself, a stock level that stays current."
        actions={[
          { label: 'See every feature', href: '/features' },
          { label: 'Start 14-day trial', href: '/auth/register', variant: 'secondary' },
        ]}
      />
    </>
  );
}

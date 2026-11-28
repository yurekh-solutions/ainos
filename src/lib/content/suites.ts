import type { SuitePageContent } from './types';

/**
 * Suite-level content for /features/<suite>.
 * Written as direct answers first, then context, so a passage can be lifted by
 * an AI answer engine with the page as the citation.
 */
export const SUITE_CONTENT: Record<string, SuitePageContent> = {
  finance: {
    answer:
      'AINOS Finance is the billing module of the AINOS Business Suite. It creates GST-compliant invoices, quotations, purchase orders and delivery challans, tracks expenses and receivables, and hands the same documents to accounting, Tally export and payment reminders without a second entry.',
    audience: [
      'Owners and accounts teams that raise GST invoices every day',
      'Service businesses that quote first and bill after approval',
      'Traders who need challans, purchase orders and Tally in one flow',
    ],
    problems: [
      {
        title: 'Tax split done by hand',
        body: 'CGST, SGST and IGST are calculated per line from the place of supply, so the invoice total and the return figures agree from the start.',
      },
      {
        title: 'Documents that disagree',
        body: 'A quote, a challan and an invoice read the same customer, product and tax records, so quantities and values cannot drift apart.',
      },
      {
        title: 'Receivables nobody chases',
        body: 'Every unpaid invoice stays visible with its due date, which is what the reminder workflow and the ageing view read.',
      },
    ],
    workflow: [
      {
        title: 'Set the company and tax profile',
        body: 'GSTIN, state, invoice numbering and bank details are entered once, and every document inherits them.',
      },
      {
        title: 'Quote, then bill',
        body: 'A quotation is sent for approval and converted into a GST invoice with the same lines, so nothing is retyped.',
      },
      {
        title: 'Collect and reconcile',
        body: 'Payment status moves the invoice to paid, partially paid or overdue, and the same records feed GST reports and Tally export.',
      },
    ],
    faqs: [
      {
        question: 'Does AINOS Finance create GST-compliant invoices?',
        answer:
          'Yes. Invoices carry the GSTIN of both parties, HSN or SAC codes, tax rate per line and an automatic CGST, SGST or IGST split based on the place of supply, plus a sequential invoice number that can be configured per financial year.',
      },
      {
        question: 'Can I convert a quotation into an invoice?',
        answer:
          'Yes. An accepted quotation converts into an invoice with the same customer, items, quantities and tax treatment, which keeps the quoted price and the billed price identical.',
      },
      {
        question: 'What happens to unpaid invoices?',
        answer:
          'They stay listed with their due dates and move to overdue by themselves, and the pending payment reminders screen sends a follow-up email from the same records.',
      },
      {
        question: 'Can my accountant keep using Tally?',
        answer:
          'Yes. Invoice and ledger data can be exported in Tally-compatible and Excel formats for a chosen date range, so the accountant works in the tool they already use.',
      },
    ],
    pairsWith: ['accounting', 'supply-chain', 'crm'],
  },

  accounting: {
    answer:
      'AINOS Accounting keeps the books behind the invoices: a live day book, profit and loss reports, GSTR-1 and GSTR-3B-ready summaries, recurring invoices, bank accounts and GST credit or debit notes. It reads the same transaction data as invoicing, so returns and statements never need a separate reconciliation pass.',
    audience: [
      'Businesses that hand a filing pack to a Chartered Accountant every month',
      'Retainer and subscription businesses that bill on a schedule',
      'Owners who want a profit view without a spreadsheet',
    ],
    problems: [
      {
        title: 'Month-end rebuild',
        body: 'Sales, purchases and expenses are already recorded per transaction, so the day book and the return summaries are a view rather than a reconstruction.',
      },
      {
        title: 'Returns prepared from memory',
        body: 'GSTR-1 and GSTR-3B summaries are generated from the invoice and purchase records, with a B2B and B2C split and tax grouped by rate.',
      },
      {
        title: 'Retainers billed late',
        body: 'Recurring invoice schedules raise the invoice on their own date, so monthly retainers do not depend on someone remembering.',
      },
    ],
    workflow: [
      {
        title: 'Record the day',
        body: 'Sales, purchases and expenses land in the day book as they happen, grouped by date with running totals.',
      },
      {
        title: 'Close the period',
        body: 'Profit and loss, tax-by-rate and outstanding summaries are reviewed for the period you select, then exported for filing or review.',
      },
      {
        title: 'Adjust and file',
        body: 'Credit notes, debit notes and recurring schedules correct the record before the return is prepared, so the filing pack matches the books.',
      },
    ],
    faqs: [
      {
        question: 'Does AINOS file GST returns on the government portal?',
        answer:
          'No. AINOS prepares GSTR-1 and GSTR-3B-ready summaries, tax splits and filing packs from your records. The return is uploaded and filed either by you or by your Chartered Accountant on the GST portal.',
      },
      {
        question: 'Can recurring invoices run automatically?',
        answer:
          'Yes. A schedule can raise an invoice weekly, monthly or yearly between a start and end date, and it can be paused or edited at any time without losing the previous runs.',
      },
      {
        question: 'How are credit notes handled?',
        answer:
          'A credit note is issued against the original invoice, carries the same GST treatment and reduces the reported turnover and tax for the period, so returns reflect the adjustment.',
      },
      {
        question: 'Can I see profit without exporting to Excel?',
        answer:
          'Yes. The profit and loss report compares revenue against recorded expenses for the period you choose and can be exported when a copy is needed.',
      },
    ],
    pairsWith: ['finance', 'people', 'workspace'],
  },

  crm: {
    answer:
      'AINOS CRM is the sales module of the AINOS Business Suite. It captures leads with their source, moves deals through a visual pipeline, keeps every contact and conversation in one record, and schedules follow-ups so an enquiry turns into a quotation and then an invoice inside the same workspace.',
    audience: [
      'Sales teams that lose track of enquiries in a shared inbox',
      'Founders who are still the only person following up',
      'Service and distribution businesses with a long quote-to-order cycle',
    ],
    problems: [
      {
        title: 'Enquiries with no owner',
        body: 'Every lead carries a source, a status and an owner, so a new enquiry has a name against it instead of sitting in a phone gallery.',
      },
      {
        title: 'Pipeline built on guesswork',
        body: 'Deal stages show what is actually open, with values and expected close dates rather than a verbal update in a meeting.',
      },
      {
        title: 'Follow-ups that go quiet',
        body: 'Each lead and deal can carry a scheduled call or reminder, and the due and overdue list is the reason nothing goes cold.',
      },
    ],
    workflow: [
      {
        title: 'Capture the lead',
        body: 'A lead is added with source, contact details and a note, and can be qualified or assigned to a salesperson straight away.',
      },
      {
        title: 'Work the pipeline',
        body: 'Qualified leads move into deals, each stage is updated as the conversation progresses, and the value stays attached to the customer record.',
      },
      {
        title: 'Close into billing',
        body: 'A won deal becomes a quotation and then an invoice for the same customer, so the sales record and the billed amount stay aligned.',
      },
    ],
    faqs: [
      {
        question: 'What is included in AINOS CRM?',
        answer:
          'Lead management with sources and status, a deals pipeline with stages and values, contact records with company and history, and follow-up scheduling with due and overdue lists.',
      },
      {
        question: 'Can the CRM see the same customers as billing?',
        answer:
          'Yes. CRM contacts and finance customers sit in one workspace, so a customer quoted by sales is the same record that appears on the invoice and on the receivables list.',
      },
      {
        question: 'Does AI score leads?',
        answer:
          'Yes, on AI-enabled plans. Lead scoring ranks prospects by fit and engagement and explains the reason for a score, and the output is a recommendation that a salesperson reviews.',
      },
      {
        question: 'Is there a mobile view for field sales?',
        answer:
          'Yes. The workspace uses responsive layouts, so leads, follow-ups and contact records can be opened from a phone or tablet browser during a visit.',
      },
    ],
    pairsWith: ['finance', 'marketing', 'support'],
  },

  marketing: {
    answer:
      'AINOS Marketing runs demand generation from inside the business suite: email campaigns to contact lists, AI-assisted social posts, a technical SEO audit with keyword research, AI-written blog publishing and branded invitation templates. Campaign records sit next to the CRM contacts they were sent to, so response is attributed to a real customer record.',
    audience: [
      'Small marketing teams running email and social in separate tools',
      'Businesses that publish blogs but cannot measure them',
      'Agencies and professionals who need on-brand templates quickly',
    ],
    problems: [
      {
        title: 'Lists rebuilt for every send',
        body: 'Campaign audiences read the contact records already in the workspace instead of a CSV exported from somewhere else.',
      },
      {
        title: 'Content with no reason',
        body: 'SEO audit, keyword research and competitor analysis give a topic a target query before the blog draft is written.',
      },
      {
        title: 'Brand drift on social',
        body: 'Captions and creative are generated against a stored brand tone, so output reads like the business rather than a generic post.',
      },
    ],
    workflow: [
      {
        title: 'Find the audience',
        body: 'Choose the contact list or segment the campaign goes to, using the same records sales already works with.',
      },
      {
        title: 'Create the message',
        body: 'Draft the email, generate social captions or write a blog post, then edit the output before anything is published.',
      },
      {
        title: 'Publish and measure',
        body: 'Campaigns, posts and blog articles are scheduled or published from the same screen, with send and publishing status tracked.',
      },
    ],
    faqs: [
      {
        question: 'What marketing tools are in AINOS?',
        answer:
          'Email campaigns, AI social media captions, an SEO platform with site audit, keyword research and competitor analysis, an AI blog writer with scheduling, and festival or event invitation templates.',
      },
      {
        question: 'Does AINOS send email campaigns itself?',
        answer:
          'Campaigns are composed, targeted and scheduled in AINOS and delivered through the configured transactional email provider. Send status is tracked per campaign so a failure is visible rather than silent.',
      },
      {
        question: 'Is the AI content reviewed before publishing?',
        answer:
          'Yes. AI output arrives as an editable draft, and publishing is a separate action taken by a person, so the business owns the final copy. AI usage consumes plan credits.',
      },
      {
        question: 'Can the SEO module audit a website that is not on AINOS?',
        answer:
          'Yes. The audit runs against a submitted URL and returns technical findings, keyword ideas, competitor comparison and content ideas for the site you enter.',
      },
    ],
    pairsWith: ['crm', 'ecommerce', 'support'],
  },

  'supply-chain': {
    answer:
      'AINOS Supply Chain tracks what the business holds and where. Stock is maintained per item and per warehouse, purchase and sales orders move it in and out, and vendors keep their GSTIN and purchase history beside the stock they supply, all reading the same product catalogue used by invoicing and the online store.',
    audience: [
      'Traders and distributors running more than one godown',
      'Retailers whose counter, website and warehouse stock disagree',
      'Businesses that reorder from a memory instead of a reorder level',
    ],
    problems: [
      {
        title: 'Three stock answers',
        body: 'Counter sales, online orders and purchase receipts move the same quantity, so the number on the screen is the quantity that exists.',
      },
      {
        title: 'Reordering after the stockout',
        body: 'Low-stock flags and reorder levels raise the shortage before it becomes lost sales.',
      },
      {
        title: 'Vendor records in a diary',
        body: 'GSTIN, contact details and purchase history sit on the vendor record, which is what makes a repeat order quick.',
      },
    ],
    workflow: [
      {
        title: 'Set items and locations',
        body: 'Products carry SKU, unit, tax rate and HSN code, and each warehouse holds its own quantity.',
      },
      {
        title: 'Move stock',
        body: 'Purchase orders bring goods in, sales orders send them out, and counter or website sales reduce the same balance.',
      },
      {
        title: 'Watch the levels',
        body: 'Low-stock and reorder views show what to buy next, with the vendor and last purchase price already attached.',
      },
    ],
    faqs: [
      {
        question: 'Can AINOS track stock across multiple warehouses?',
        answer:
          'Yes. Each warehouse or godown holds its own stock per item, and the item view shows the total across locations while the warehouse view shows what is physically where.',
      },
      {
        question: 'Does stock update from sales orders and POS sales?',
        answer:
          'Yes. Sales orders, counter billing and online store orders draw from the same stock records, so the balance reflects every channel rather than one.',
      },
      {
        question: 'Can I set a reorder level per item?',
        answer:
          'Yes. A reorder level can be stored per item and the low-stock view flags items that have fallen to or below it.',
      },
      {
        question: 'Does the purchase order flow continue into billing?',
        answer:
          'Yes. Purchase orders can be raised from finance and from inventory against the same vendor record, and received quantities can be tracked against each order.',
      },
    ],
    pairsWith: ['finance', 'manufacturing', 'point-of-sale'],
  },

  manufacturing: {
    answer:
      'AINOS Manufacturing plans and records production: bills of materials define what each product consumes, manufacturing orders schedule the run, work centers hold the capacity, and quality checks with scrap logging record what came out. Consumption reduces inventory, so the stock figure matches what the shop floor actually used.',
    audience: [
      'Job shops and fabrication units assembling to order',
      'Businesses that cost a product by dividing last month by hand',
      'Plants that lose material and cannot say where',
    ],
    problems: [
      {
        title: 'Material consumed off the record',
        body: 'Production consumption draws from inventory against a bill of materials, so the shortfall is visible instead of unexplained.',
      },
      {
        title: 'Capacity promised without checking',
        body: 'Work centers hold their capacity, and manufacturing orders are planned against a date rather than a hopeful estimate.',
      },
      {
        title: 'Quality found at the customer',
        body: 'Inspection records and scrap entries capture failures at the stage they happen, with corrective action attached.',
      },
    ],
    workflow: [
      {
        title: 'Define the product',
        body: 'A bill of materials lists the components and quantities consumed by one finished unit.',
      },
      {
        title: 'Schedule the run',
        body: 'A manufacturing order states the quantity and planned start date, and is tied to the work center that will produce it.',
      },
      {
        title: 'Record the outcome',
        body: 'Quality checks and scrap entries close the order, and the finished goods and consumed material update inventory.',
      },
    ],
    faqs: [
      {
        question: 'What is a bill of materials in AINOS?',
        answer:
          'A reusable component list per finished product, giving each input material and the quantity consumed per unit, which is what a manufacturing order reads when it plans a run.',
      },
      {
        question: 'Does production reduce stock automatically?',
        answer:
          'Consumption is recorded against the manufacturing order, and finished goods received from the run raise the finished-product stock, so the movement is traceable to a specific order.',
      },
      {
        question: 'Can I track quality and scrap per order?',
        answer:
          'Yes. Inspection records with pass or fail results, corrective actions and scrap quantities can be logged against production so losses are visible and attributable.',
      },
      {
        question: 'Is AINOS Manufacturing a full MRP system?',
        answer:
          'It covers bills of materials, manufacturing orders, work centers, quality and scrap, and shares stock with the inventory module. Businesses with finite-capacity scheduling requirements should map their process with the team before migrating.',
      },
    ],
    pairsWith: ['supply-chain', 'finance', 'operations'],
  },

  people: {
    answer:
      'AINOS People covers the employee lifecycle: records with department and role, daily attendance with monthly summaries, shift planning, leave requests with an approval step, monthly payroll with earnings and deductions, recruitment stages and project timesheets. Payroll reads the attendance and salary components already stored, so the run does not start from a spreadsheet.',
    audience: [
      'Businesses with 5 to 200 staff running payroll in Excel',
      'Teams spread across shifts or sites',
      'Services firms billing hours back to clients',
    ],
    problems: [
      {
        title: 'Attendance assembled monthly',
        body: 'Daily attendance is marked once and monthly summaries are generated from those records instead of being reconstructed.',
      },
      {
        title: 'Leave negotiated on chat',
        body: 'Requests are raised in the workspace, approved with one action, and leave history stays on the employee record.',
      },
      {
        title: 'Payroll rebuilt every month',
        body: 'Salary components and deductions are stored against the employee, so a payroll run reviews numbers rather than rebuilding them.',
      },
    ],
    workflow: [
      {
        title: 'Add the team',
        body: 'Employee profiles carry department, role, joining details and pay structure, and access is granted by role.',
      },
      {
        title: 'Run the month',
        body: 'Attendance and approved leave feed the payroll review, where earnings, deductions and net pay are confirmed for each employee.',
      },
      {
        title: 'Bill the work',
        body: 'Timesheets record hours per project and employee, which supports billing reviews and productivity checks.',
      },
    ],
    faqs: [
      {
        question: 'Does AINOS handle payroll with PF, ESI and professional tax?',
        answer:
          'Payroll runs earnings, deductions and net pay per employee with configurable salary components, and payroll plans support PF, ESI and professional tax settings for Indian statutory deduction. Confirm the exact slabs for your state with your accountant during setup.',
      },
      {
        question: 'How does leave approval work?',
        answer:
          'An employee raises a request, an approver accepts or rejects it, and the approved days appear in the leave history and in the attendance view for that period.',
      },
      {
        question: 'Can attendance be marked for shift staff?',
        answer:
          'Yes. Attendance is recorded per employee per day, and shift planning assigns the team to shifts so coverage can be seen on a calendar.',
      },
      {
        question: 'Are timesheets linked to projects?',
        answer:
          'Yes. Hours are recorded per project and per employee for a week, which gives approved totals for client billing and internal utilisation review.',
      },
    ],
    pairsWith: ['workspace', 'accounting', 'finance'],
  },

  support: {
    answer:
      'AINOS Support is the customer service module of the AINOS Business Suite. It turns questions into tickets with priority, owner and status, keeps the conversation history against the same customer record used by sales and billing, and publishes self-service answers through a searchable knowledge base.',
    audience: [
      'Businesses answering the same questions on WhatsApp every week',
      'Teams where support knows nothing about the customer\u2019s orders',
      'Product businesses that want self-service answers',
    ],
    problems: [
      {
        title: 'Requests lost in chat',
        body: 'A ticket has an owner, a priority and a status, so nothing depends on who remembers the conversation.',
      },
      {
        title: 'No context on the customer',
        body: 'Tickets open against the same customer record that holds the invoices and orders, so the agent sees the account rather than a phone number.',
      },
      {
        title: 'Repeated questions',
        body: 'Knowledge base articles answer the recurring question once and can be sent in place of a written reply.',
      },
    ],
    workflow: [
      {
        title: 'Raise the ticket',
        body: 'The question is logged against the customer with a priority and a short description of the issue.',
      },
      {
        title: 'Assign and work',
        body: 'Tickets are assigned to an agent, status changes as the issue moves, and the history stays with the customer.',
      },
      {
        title: 'Publish the answer',
        body: 'A resolution that will repeat is written up as a knowledge base article and filed under its category.',
      },
    ],
    faqs: [
      {
        question: 'What does the helpdesk include?',
        answer:
          'Ticket creation with priority and status, agent assignment, customer history and a searchable knowledge base of help articles grouped by category.',
      },
      {
        question: 'Can support see a customer\u2019s invoices?',
        answer:
          'Tickets belong to the same customer record used by CRM and finance, so an agent with the right role can see the account context instead of asking the customer to repeat it.',
      },
      {
        question: 'Is the knowledge base public or internal?',
        answer:
          'Articles are written and organised inside the workspace for the support team and for sharing an answer directly. Making an article publicly indexable is a separate publishing decision, not automatic.',
      },
      {
        question: 'Can tickets be prioritised by urgency?',
        answer:
          'Yes. Each ticket carries a priority alongside its status and owner, so the queue can be worked in the order that matters.',
      },
    ],
    pairsWith: ['crm', 'workspace', 'ecommerce'],
  },

  workspace: {
    answer:
      'AINOS Workspace is the coordination layer of the suite: projects and tasks with owners and due dates, a shared business calendar, team roles and permissions, workflow automations, cross-module reports, approval routing and a compliance document vault with expiry reminders. It reads records from every other module, which is what makes an approval or a report trustworthy.',
    audience: [
      'Businesses where approvals still happen on email',
      'Teams that need role-based access per workspace',
      'Owners who want one dashboard instead of four',
    ],
    problems: [
      {
        title: 'Approvals without a record',
        body: 'A request is raised, routed to an approver and stored with its history, so the decision is auditable later.',
      },
      {
        title: 'Reports that need an export',
        body: 'Cross-module reports read live sales, finance and operations data, so the number is current when it is opened.',
      },
      {
        title: 'Expiring documents nobody watches',
        body: 'Licences and statutory documents carry expiry dates and a compliance calendar flags what is due.',
      },
    ],
    workflow: [
      {
        title: 'Organise the work',
        body: 'Projects hold tasks with assignees, due dates and progress, and the shared calendar shows what is due for the whole business.',
      },
      {
        title: 'Set the rules',
        body: 'Roles decide which modules each teammate sees, and automations run repetitive cross-module steps on a trigger.',
      },
      {
        title: 'Review and approve',
        body: 'Approvals route expenses, purchases and requests to the right person, and reports summarise the outcome across modules.',
      },
    ],
    faqs: [
      {
        question: 'What is in AINOS Workspace?',
        answer:
          'Projects and tasks, a shared calendar, team and role management, workflow automations, cross-module business reports, an approval workflow and a compliance document vault with expiry reminders.',
      },
      {
        question: 'How does role-based access work?',
        answer:
          'A teammate is invited into the company workspace and given a role, and that role decides which modules and records they can open, so access is controlled per person rather than per shared login.',
      },
      {
        question: 'Can automations act across modules?',
        answer:
          'Yes. Automations are triggered by an event and can perform actions in another module, with a run history that records what executed, which is how recurring internal steps stop depending on memory.',
      },
      {
        question: 'What compliance documents can be stored?',
        answer:
          'Licences and statutory documents can be kept in the vault with expiry dates, and the compliance calendar shows upcoming renewals so a lapse is visible in advance.',
      },
    ],
    pairsWith: ['people', 'accounting', 'operations'],
  },

  ecommerce: {
    answer:
      'AINOS eCommerce runs online selling on the same records as the rest of the business: storefronts, product listings with prices and stock, an order queue with payment and fulfilment status, customer history with repeat-buyer view, coupons with limits, moderated product reviews and store analytics. Online orders draw stock from inventory and post to the same books as counter sales.',
    audience: [
      'Retailers adding an online store beside a physical shop',
      'Brands selling through their own storefront instead of only marketplaces',
      'Businesses whose website stock is always out of date',
    ],
    problems: [
      {
        title: 'Overselling stock',
        body: 'Listings read the inventory balance, so an online order and a counter sale cannot both promise the same unit.',
      },
      {
        title: 'Orders handled in a portal',
        body: 'Every order sits in one queue with payment and fulfilment status, instead of a marketplace dashboard and an inbox.',
      },
      {
        title: 'Discounts with no control',
        body: 'Coupons carry percentage or flat value, usage limits and expiry dates, so a campaign cannot run past its terms.',
      },
    ],
    workflow: [
      {
        title: 'Set up the store',
        body: 'A storefront is created and connected to the product catalogue with prices, images and available stock.',
      },
      {
        title: 'Take the order',
        body: 'The order arrives in a single queue with payment status and the customer record it belongs to.',
      },
      {
        title: 'Fulfil and review',
        body: 'Fulfilment moves the order on, stock adjusts, and reviews can be moderated before they appear on the listing.',
      },
    ],
    faqs: [
      {
        question: 'Can I run more than one online store?',
        answer:
          'Yes. Multiple storefronts can be created on the same account, each connected to the shared catalogue, which suits a brand site alongside a category-specific store.',
      },
      {
        question: 'Does an online order reduce inventory?',
        answer:
          'Online orders draw from the same stock records as counter billing and sales orders, so the available quantity reflects every channel that has sold the item.',
      },
      {
        question: 'Can I create discount coupons with limits?',
        answer:
          'Yes. A coupon can be percentage-based or a flat amount, with a usage limit and an expiry date, so a promotion stops when its terms say it does.',
      },
      {
        question: 'How are product reviews managed?',
        answer:
          'Reviews and ratings are collected against a product and can be moderated before publishing, so the listing shows approved feedback rather than everything submitted.',
      },
    ],
    pairsWith: ['supply-chain', 'finance', 'marketing'],
  },

  'point-of-sale': {
    answer:
      'AINOS Point of Sale bills customers at the counter. A register session is opened per shift, products are rung up with their tax rate, sales are taken through multiple payment modes, and closing the session reconciles the cash drawer. Counter sales reduce the same inventory and appear in the same sales reports as online and field orders.',
    audience: [
      'Retail shops and cafés billing at a counter',
      'Businesses running two shifts with a cash handover',
      'Shops that also sell online and need one stock figure',
    ],
    problems: [
      {
        title: 'Cash that does not reconcile',
        body: 'Opening and closing a session records the shift total, so a drawer difference is spotted at handover rather than at month end.',
      },
      {
        title: 'Slow billing in a queue',
        body: 'The register uses touch-friendly entry with quick product search, which keeps the counter moving at peak hours.',
      },
      {
        title: 'Counter and online stock apart',
        body: 'A counter sale reduces the inventory item, so the online store stops selling what has already left the shop.',
      },
    ],
    workflow: [
      {
        title: 'Open the session',
        body: 'The operator opens a register session so every bill in the shift belongs to one cash total.',
      },
      {
        title: 'Bill the customer',
        body: 'Products and menu items are added from the catalog, tax is applied per item, and the payment mode is recorded.',
      },
      {
        title: 'Close and review',
        body: 'The session is closed with a cash reconciliation, and daily sales, best sellers and payment-mode totals are read from the same orders.',
      },
    ],
    faqs: [
      {
        question: 'Does AINOS POS support multiple payment modes?',
        answer:
          'Yes. A counter order records the payment mode it was taken in, and the session and daily reports summarise takings by mode so cash, card and digital are separable.',
      },
      {
        question: 'Can I reconcile cash at the end of a shift?',
        answer:
          'Yes. Closing a session compares the expected total with the counted cash, which gives a per-shift record instead of one unexplained month-end difference.',
      },
      {
        question: 'Is the POS tied to inventory?',
        answer:
          'Counter products read the same catalog and stock records as the other sales channels, so a sale at the counter reduces the quantity available online.',
      },
      {
        question: 'Can it be used for a restaurant menu?',
        answer:
          'Yes. Products can be organised with categories and prices, which suits a menu of dishes as well as a shelf of goods, and daily best-seller reporting shows what is moving.',
      },
    ],
    pairsWith: ['supply-chain', 'finance', 'ecommerce'],
  },

  operations: {
    answer:
      'AINOS Operations runs the work that happens outside the office: field service jobs dispatched to technicians, preventive maintenance on equipment, fleet records with drivers, fuel and service logs, quality inspections, repair order intake and equipment rental bookings. Each record sits beside the customer and the invoice it belongs to, so a completed job can be billed without a second entry.',
    audience: [
      'Service companies dispatching technicians to sites',
      'Businesses with equipment that needs scheduled maintenance',
      'Rental and repair businesses tracking assets out and back',
    ],
    problems: [
      {
        title: 'Jobs assigned verbally',
        body: 'A job is scheduled, assigned to a technician and tracked through to completion, so the office knows what is still open.',
      },
      {
        title: 'Maintenance after the breakdown',
        body: 'Preventive schedules sit against the equipment register, which turns servicing into a plan rather than a reaction.',
      },
      {
        title: 'Assets that vanish',
        body: 'Fleet, repair and rental records follow the vehicle, part or unit out and back, with fuel, service and charges attached.',
      },
    ],
    workflow: [
      {
        title: 'Raise the job',
        body: 'A field, maintenance, repair or rental job is created against the customer and the asset it concerns.',
      },
      {
        title: 'Dispatch and record',
        body: 'The job is assigned, its status updated on site, and parts, fuel or charges are logged as work proceeds.',
      },
      {
        title: 'Close and bill',
        body: 'Completion closes the job, and the charges are available for the invoice on the same customer record.',
      },
    ],
    faqs: [
      {
        question: 'What operations modules are included?',
        answer:
          'Field service scheduling and dispatch, preventive maintenance with an equipment register, fleet management with drivers and fuel or service logs, quality control inspections, repair orders and equipment rental bookings.',
      },
      {
        question: 'Can field jobs be updated from a phone?',
        answer:
          'Yes. The workspace is responsive and opens in a phone browser, so a technician can review an assigned job and update its status on site.',
      },
      {
        question: 'Does a completed job flow into billing?',
        answer:
          'Jobs are raised against the customer record that also carries the invoices, so the completed charges can be taken into the invoice for the same customer without re-entering the details.',
      },
      {
        question: 'Can maintenance be scheduled in advance?',
        answer:
          'Yes. Preventive schedules are held against equipment, and each resulting maintenance task can be logged with the work performed.',
      },
    ],
    pairsWith: ['workspace', 'supply-chain', 'finance'],
  },

  'ai-studio': {
    answer:
      'AINOS AI Studio puts AI inside the business records instead of a separate chat window: an assistant that answers questions about invoices, customers and stock, a content writer and media generator for marketing, invoice extraction from an uploaded document, and lead scoring for the sales pipeline. Every output is a draft or a recommendation that a person reviews before it is used.',
    audience: [
      'Teams that want AI answers about their own data',
      'Accounts teams re-typing supplier invoices',
      'Sales teams that cannot tell which leads deserve a call',
    ],
    problems: [
      {
        title: 'AI that cannot see the business',
        body: 'Questions are answered from the workspace records in use, so the reply is about this company rather than general advice.',
      },
      {
        title: 'Supplier invoices typed by hand',
        body: 'A document is uploaded and the vendor, GSTIN, line items and totals are extracted for review instead of being keyed in.',
      },
      {
        title: 'Every lead called in the same order',
        body: 'Lead scoring ranks prospects so the first call of the day is the one most likely to close.',
      },
    ],
    workflow: [
      {
        title: 'Ask or upload',
        body: 'A question is typed, or a document or image is uploaded, from inside the workspace screen.',
      },
      {
        title: 'Review the output',
        body: 'The answer, extracted field or generated draft appears as an editable result, never as a final record written without review.',
      },
      {
        title: 'Save into the record',
        body: 'Accepted output becomes content, a saved contact or a scored lead attached to the customer it belongs to.',
      },
    ],
    faqs: [
      {
        question: 'What AI tools are included in AINOS?',
        answer:
          'A business assistant for questions about your own records, an AI content writer, social caption generation, an invoice extractor, lead scoring, an AI media studio and a lip sync studio for short video.',
      },
      {
        question: 'Does AI write directly into my records?',
        answer:
          'No. Generated content, extracted invoice fields and lead scores are returned for review and editing, and saving is a separate action taken by the person using the screen.',
      },
      {
        question: 'Is AI usage included in the plan?',
        answer:
          'AI actions consume plan credits, and the balance is visible in the billing area of the workspace, so usage is metered rather than unlimited.',
      },
      {
        question: 'Can the assistant answer questions about my invoices?',
        answer:
          'Yes. The assistant works from the records already in the workspace, so questions about invoices, customers and stock return answers about this company rather than generic guidance.',
      },
    ],
    pairsWith: ['crm', 'finance', 'marketing'],
  },
};
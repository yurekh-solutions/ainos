/**
 * Public, crawlable description of every AINOS suite and tool.
 *
 * The app itself sits behind sign-in, so search engines never see it. This
 * catalog feeds the public /features pages, the sitemap and structured data,
 * which is how each suite and each tool earns its own search listing.
 * `appHref` is the in-app route the tool opens after sign-in.
 */

export interface SeoTool {
  slug: string;
  name: string;
  /** Meta description: one plain sentence, kept under ~155 characters. */
  summary: string;
  features: string[];
  keywords: string[];
  appHref: string;
}

export interface SeoSuite {
  slug: string;
  name: string;
  headline: string;
  summary: string;
  keywords: string[];
  tools: SeoTool[];
}

export const SEO_SUITES: SeoSuite[] = [
  {
    slug: 'finance',
    name: 'AINOS Finance',
    headline: 'GST invoicing, expenses and payments for Indian businesses',
    summary: 'Create GST-compliant invoices, quotations and challans, track expenses and chase pending payments from one finance workspace.',
    keywords: ['GST billing software', 'invoice software India', 'expense tracking', 'quotation software'],
    tools: [
      {
        slug: 'invoices',
        name: 'GST Invoicing',
        summary: 'Create GST-compliant invoices with automatic CGST, SGST and IGST split, branded templates and PDF download in seconds.',
        features: ['Automatic CGST / SGST / IGST tax split', 'HSN / SAC codes on every line', 'Branded PDF invoices', 'Payment status tracking'],
        keywords: ['GST invoice generator', 'online invoice software', 'tax invoice format'],
        appHref: '/invoices',
      },
      {
        slug: 'customers',
        name: 'Customer Management',
        summary: 'Keep every customer, GSTIN, billing address and invoice history in one searchable customer ledger.',
        features: ['GSTIN and address records', 'Per-customer invoice history', 'Outstanding balance view', 'Quick search'],
        keywords: ['customer ledger', 'customer database software'],
        appHref: '/customers',
      },
      {
        slug: 'expenses',
        name: 'Expense Tracking',
        summary: 'Record business expenses with categories, receipts and GST input details so month-end books stay accurate.',
        features: ['Expense categories', 'Receipt attachments', 'GST input tracking', 'Monthly expense summaries'],
        keywords: ['expense tracker for business', 'expense management software'],
        appHref: '/finance/expenses',
      },
      {
        slug: 'payment-reminders',
        name: 'Pending Payment Reminders',
        summary: 'See every unpaid invoice in one list and send payment reminders before receivables turn into bad debt.',
        features: ['Overdue invoice list', 'Reminder emails', 'Ageing overview', 'Collection follow-up'],
        keywords: ['payment reminder software', 'accounts receivable tracking'],
        appHref: '/finance/reminders',
      },
      {
        slug: 'business-card-scanner',
        name: 'Business Card Scanner',
        summary: 'Scan a business card photo and turn it into a saved contact with name, phone, email and company filled in by AI.',
        features: ['AI text extraction from card photos', 'Auto-filled contact fields', 'Saved contact list', 'Works from mobile camera'],
        keywords: ['business card scanner', 'card to contact OCR'],
        appHref: '/finance/business-cards',
      },
      {
        slug: 'products',
        name: 'Products & Services Catalog',
        summary: 'Maintain products and services with prices, HSN codes and tax rates so every invoice line fills itself.',
        features: ['HSN / SAC codes', 'Tax rate per item', 'Unit pricing', 'Reusable on invoices and quotes'],
        keywords: ['product catalog software', 'HSN code master'],
        appHref: '/products',
      },
      {
        slug: 'quotations',
        name: 'Quotations',
        summary: 'Send professional quotations and convert an accepted quote into a GST invoice without retyping a line.',
        features: ['Branded quotation PDFs', 'One-click convert to invoice', 'Validity dates', 'Quote status tracking'],
        keywords: ['quotation maker', 'estimate software'],
        appHref: '/finance/quotes',
      },
      {
        slug: 'purchase-orders',
        name: 'Purchase Orders',
        summary: 'Raise purchase orders to vendors, track what has been received and keep purchasing tied to your books.',
        features: ['Vendor purchase orders', 'Received quantity tracking', 'PO status', 'PDF export'],
        keywords: ['purchase order software', 'PO generator'],
        appHref: '/finance/purchase-orders',
      },
      {
        slug: 'delivery-challans',
        name: 'Delivery Challans',
        summary: 'Generate delivery challans for goods dispatched without a sale invoice, with item details and barcodes.',
        features: ['Challan numbering', 'Item and quantity details', 'Barcode support', 'Printable PDF'],
        keywords: ['delivery challan format', 'challan software'],
        appHref: '/finance/challans',
      },
      {
        slug: 'tally-export',
        name: 'Tally & Excel Export',
        summary: 'Export invoices and ledgers to Tally or Excel so your accountant can work in the tools they already use.',
        features: ['Tally-compatible export', 'Excel export', 'Ledger mapping', 'Date-range filters'],
        keywords: ['Tally export', 'invoice to Tally import'],
        appHref: '/finance/tally',
      },
      {
        slug: 'invoice-design',
        name: 'Invoice Templates & Design',
        summary: 'Choose and brand invoice templates with your logo, colours and terms so every document looks like your business.',
        features: ['Multiple invoice layouts', 'Logo and colour branding', 'Custom terms and notes', 'Live preview'],
        keywords: ['invoice template', 'custom invoice design'],
        appHref: '/finance/templates',
      },
    ],
  },
  {
    slug: 'accounting',
    name: 'AINOS Accounting',
    headline: 'Day book, GST reports and accounts without spreadsheets',
    summary: 'Keep a live day book, file-ready GST reports, profit statements, bank accounts and credit or debit notes in one place.',
    keywords: ['accounting software India', 'GST reports', 'day book software'],
    tools: [
      {
        slug: 'daybook',
        name: 'Day Book',
        summary: 'See every sale, purchase and expense of the day in a single chronological day book.',
        features: ['Chronological entries', 'Daily totals', 'Filter by date', 'Export'],
        keywords: ['day book accounting', 'daily transaction register'],
        appHref: '/finance/daybook',
      },
      {
        slug: 'profit-reports',
        name: 'Profit & Loss Reports',
        summary: 'Track revenue, expenses and profit with clear reports that show how the business is really doing.',
        features: ['Profit and loss view', 'Revenue vs expense trends', 'Period comparison', 'Export'],
        keywords: ['profit and loss report', 'business financial reports'],
        appHref: '/finance/reports',
      },
      {
        slug: 'gst-reports',
        name: 'GST Reports',
        summary: 'Prepare GSTR-1 and GSTR-3B ready summaries from your invoices and purchases, with tax split by rate.',
        features: ['GSTR-1 and GSTR-3B summaries', 'Tax split by rate', 'B2B and B2C breakup', 'Filing pack export'],
        keywords: ['GSTR-1 report', 'GSTR-3B summary', 'GST return software'],
        appHref: '/finance/gst-reports',
      },
      {
        slug: 'recurring-invoices',
        name: 'Recurring Invoices',
        summary: 'Schedule invoices that raise themselves every week, month or year for retainers and subscriptions.',
        features: ['Weekly, monthly or yearly schedules', 'Automatic invoice creation', 'Start and end dates', 'Pause anytime'],
        keywords: ['recurring billing', 'subscription invoicing'],
        appHref: '/finance/recurring-invoices',
      },
      {
        slug: 'bank-accounts',
        name: 'Bank Accounts',
        summary: 'Keep every business bank account with account number, IFSC code and balance in one place.',
        features: ['Multiple bank accounts', 'Account number and IFSC', 'Opening balances'],
        keywords: ['bank details on invoice', 'business bank accounts'],
        appHref: '/finance/bank-accounts',
      },
      {
        slug: 'credit-notes',
        name: 'Credit Notes',
        summary: 'Issue GST credit notes for returns and discounts, linked to the original invoice.',
        features: ['Linked to original invoice', 'GST adjustment', 'PDF credit notes'],
        keywords: ['credit note GST', 'sales return note'],
        appHref: '/finance/credit-notes',
      },
      {
        slug: 'debit-notes',
        name: 'Debit Notes',
        summary: 'Raise GST debit notes for purchase returns and price corrections with vendors.',
        features: ['Vendor debit notes', 'GST adjustment', 'PDF debit notes'],
        keywords: ['debit note GST', 'purchase return note'],
        appHref: '/finance/debit-notes',
      },
    ],
  },
  {
    slug: 'crm',
    name: 'AINOS CRM',
    headline: 'Leads, deals and follow-ups in one clear sales pipeline',
    summary: 'Capture leads, move deals through a visual pipeline and never miss a follow-up with the AINOS CRM.',
    keywords: ['CRM software India', 'sales pipeline software', 'lead management'],
    tools: [
      {
        slug: 'leads',
        name: 'Lead Management',
        summary: 'Capture, qualify and assign leads with source tracking so every enquiry gets a response.',
        features: ['Lead capture and sources', 'Status and qualification', 'Owner assignment', 'Search and filters'],
        keywords: ['lead management software', 'lead tracking'],
        appHref: '/crm/leads',
      },
      {
        slug: 'deals',
        name: 'Deals Pipeline',
        summary: 'Move deals through visual pipeline stages and see the value of everything you are about to close.',
        features: ['Visual pipeline stages', 'Deal value tracking', 'Expected close dates', 'Win / loss status'],
        keywords: ['sales pipeline', 'deal tracking software'],
        appHref: '/crm/deals',
      },
      {
        slug: 'contacts',
        name: 'Contacts',
        summary: 'Keep every customer and prospect contact with company, phone, email and history in one list.',
        features: ['Contact profiles', 'Company linking', 'Activity history', 'Import ready'],
        keywords: ['contact management', 'customer contacts database'],
        appHref: '/crm/contacts',
      },
      {
        slug: 'follow-ups',
        name: 'Follow-ups',
        summary: 'Schedule calls, meetings and reminders against each lead so no opportunity goes cold.',
        features: ['Scheduled follow-ups', 'Due and overdue lists', 'Linked to leads and deals', 'Completion tracking'],
        keywords: ['sales follow-up reminders', 'follow-up tracker'],
        appHref: '/crm/follow-ups',
      },
    ],
  },
  {
    slug: 'marketing',
    name: 'AINOS Marketing',
    headline: 'Email campaigns, social media, SEO and AI blogs together',
    summary: 'Run email campaigns, generate social posts, audit SEO and publish AI-written blogs from one marketing suite.',
    keywords: ['marketing automation India', 'AI marketing tools', 'email campaign software'],
    tools: [
      {
        slug: 'email-campaigns',
        name: 'Email Campaigns',
        summary: 'Design, schedule and send email campaigns to your contact lists and track every send.',
        features: ['Campaign builder', 'Audience lists', 'Scheduling', 'Send status tracking'],
        keywords: ['email marketing software', 'bulk email campaigns'],
        appHref: '/marketing/campaigns',
      },
      {
        slug: 'social-media',
        name: 'AI Social Media Posts',
        summary: 'Generate platform-ready captions, hooks and hashtags for Instagram, LinkedIn, Facebook and X with AI.',
        features: ['Captions for six platforms', 'Hooks and hashtags', 'Image-aware captions', 'Brand tone control'],
        keywords: ['AI caption generator', 'social media post generator', 'hashtag generator'],
        appHref: '/marketing/social-media',
      },
      {
        slug: 'seo-platform',
        name: 'SEO Platform',
        summary: 'Audit any website, research keywords, compare competitors and get content ideas that rank.',
        features: ['Technical site audit', 'Keyword research', 'Competitor analysis', 'Content ideas'],
        keywords: ['SEO audit tool', 'keyword research tool', 'competitor SEO analysis'],
        appHref: '/marketing/seo',
      },
      {
        slug: 'blog-content',
        name: 'AI Blog Writer',
        summary: 'Write long-form, SEO-optimised blog posts with AI and publish them to your site in one click.',
        features: ['Long-form AI articles', 'SEO titles and meta', 'Scheduling', 'One-click publishing'],
        keywords: ['AI blog writer', 'SEO content generator'],
        appHref: '/marketing/blog',
      },
      {
        slug: 'invitations',
        name: 'Invitation & Festival Templates',
        summary: 'Customise hundreds of festival, event and occasion invitation templates with your branding.',
        features: ['Festival and occasion templates', 'Logo and text customisation', 'Download ready', 'Share on social'],
        keywords: ['festival greeting templates', 'invitation maker'],
        appHref: '/marketing/invitations',
      },
    ],
  },
  {
    slug: 'supply-chain',
    name: 'AINOS Supply Chain',
    headline: 'Stock, orders, vendors and warehouses in real time',
    summary: 'Track live stock across warehouses, manage purchase and sales orders and keep vendor records in one inventory suite.',
    keywords: ['inventory management software', 'stock management India', 'warehouse software'],
    tools: [
      {
        slug: 'stock',
        name: 'Stock Management',
        summary: 'See live stock levels per item and warehouse, with low-stock flags before you run out.',
        features: ['Live stock levels', 'Low-stock flags', 'Reorder levels', 'SKU and warehouse per item'],
        keywords: ['stock management software', 'inventory tracking'],
        appHref: '/inventory/stock',
      },
      {
        slug: 'purchase-orders',
        name: 'Inventory Purchase Orders',
        summary: 'Order stock from vendors and track each purchase order from draft to received.',
        features: ['Vendor orders', 'Order status tracking', 'Line items and totals'],
        keywords: ['inventory purchase order', 'procurement software'],
        appHref: '/inventory/orders',
      },
      {
        slug: 'sales-orders',
        name: 'Sales Orders',
        summary: 'Confirm customer orders and track fulfilment from order to delivery.',
        features: ['Customer orders', 'Fulfilment status', 'Order totals'],
        keywords: ['sales order management', 'order fulfilment software'],
        appHref: '/inventory/sales-orders',
      },
      {
        slug: 'vendors',
        name: 'Vendor Management',
        summary: 'Keep supplier details, GSTIN and purchase history together so reordering takes seconds.',
        features: ['Vendor profiles', 'GSTIN records', 'Purchase history', 'Contact details'],
        keywords: ['vendor management software', 'supplier database'],
        appHref: '/inventory/vendors',
      },
      {
        slug: 'warehouses',
        name: 'Warehouses',
        summary: 'Run multiple warehouses and godowns with stock tracked separately at each location.',
        features: ['Multiple locations', 'Per-warehouse stock', 'Location overview'],
        keywords: ['multi warehouse inventory', 'godown management'],
        appHref: '/inventory/warehouses',
      },
    ],
  },
  {
    slug: 'manufacturing',
    name: 'AINOS Manufacturing',
    headline: 'Bills of materials, production orders and work centers',
    summary: 'Plan production with bills of materials, manufacturing orders, work centers, quality checks and scrap tracking.',
    keywords: ['manufacturing software India', 'production planning', 'MRP software'],
    tools: [
      {
        slug: 'bills-of-materials',
        name: 'Bills of Materials',
        summary: 'Define the components and quantities that go into every product you make.',
        features: ['Component lists', 'Quantities per product', 'Reusable recipes'],
        keywords: ['bill of materials software', 'BOM management'],
        appHref: '/manufacturing',
      },
      {
        slug: 'manufacturing-orders',
        name: 'Manufacturing Orders',
        summary: 'Schedule production runs with planned dates and quantities and follow them to completion.',
        features: ['Planned start dates', 'Production quantities', 'Order status tracking'],
        keywords: ['production order software', 'work order management'],
        appHref: '/manufacturing',
      },
      {
        slug: 'work-centers',
        name: 'Work Centers',
        summary: 'Model machines and production lines with capacity so you know what the shop floor can deliver.',
        features: ['Work center records', 'Capacity planning', 'Line overview'],
        keywords: ['work center capacity', 'shop floor management'],
        appHref: '/manufacturing',
      },
      {
        slug: 'quality-and-scrap',
        name: 'Quality Checks & Scrap',
        summary: 'Log quality inspections and scrapped material so production losses are visible and fixable.',
        features: ['Quality inspection records', 'Scrap logging', 'Defect visibility'],
        keywords: ['quality control software', 'scrap tracking'],
        appHref: '/manufacturing',
      },
    ],
  },
  {
    slug: 'people',
    name: 'AINOS People',
    headline: 'Employees, attendance, leave and payroll without spreadsheets',
    summary: 'Manage staff records, attendance, shifts, time off, payroll, hiring and timesheets in one HR suite.',
    keywords: ['HR software India', 'payroll software', 'attendance management'],
    tools: [
      {
        slug: 'employees',
        name: 'Employee Records',
        summary: 'Keep every employee profile, role, department and joining detail in one secure directory.',
        features: ['Employee profiles', 'Departments and roles', 'Joining details', 'Search'],
        keywords: ['employee management software', 'HR database'],
        appHref: '/hr/employees',
      },
      {
        slug: 'attendance',
        name: 'Attendance Tracking',
        summary: 'Mark and review daily attendance for every employee with clear monthly summaries.',
        features: ['Daily attendance', 'Monthly summaries', 'Late and absent view'],
        keywords: ['attendance management system', 'staff attendance app'],
        appHref: '/hr/attendance',
      },
      {
        slug: 'planning',
        name: 'Shift Planning',
        summary: 'Plan shifts and assignments across your team so every slot is covered.',
        features: ['Shift schedules', 'Team assignments', 'Calendar view'],
        keywords: ['shift planning software', 'staff scheduling'],
        appHref: '/planning',
      },
      {
        slug: 'time-off',
        name: 'Leave Management',
        summary: 'Let employees request leave, approve it in one click and keep a clear record of who is off.',
        features: ['Leave requests', 'Approval flow', 'Leave history'],
        keywords: ['leave management system', 'time off tracker'],
        appHref: '/hr/leaves',
      },
      {
        slug: 'payroll',
        name: 'Payroll',
        summary: 'Run monthly payroll with earnings, deductions and net pay for every employee.',
        features: ['Salary components', 'Deductions', 'Net pay calculation', 'Monthly payroll runs'],
        keywords: ['payroll software India', 'salary management'],
        appHref: '/hr/payroll',
      },
      {
        slug: 'recruitment',
        name: 'Recruitment',
        summary: 'Post openings and move candidates through hiring stages until the offer is signed.',
        features: ['Job openings', 'Candidate pipeline', 'Interview stages'],
        keywords: ['recruitment software', 'applicant tracking'],
        appHref: '/hr/recruitment',
      },
      {
        slug: 'timesheets',
        name: 'Timesheets',
        summary: 'Record hours worked per project and employee for billing and productivity reviews.',
        features: ['Hours per project', 'Weekly timesheets', 'Approval-ready totals'],
        keywords: ['timesheet software', 'time tracking'],
        appHref: '/hr/timesheet',
      },
    ],
  },
  {
    slug: 'support',
    name: 'AINOS Support',
    headline: 'Helpdesk tickets and a knowledge base for your customers',
    summary: 'Handle customer questions with a ticketing helpdesk and publish answers in a searchable knowledge base.',
    keywords: ['helpdesk software', 'customer support ticketing', 'knowledge base software'],
    tools: [
      {
        slug: 'helpdesk',
        name: 'Helpdesk Ticketing',
        summary: 'Turn every customer question into a ticket with priority, owner and status until it is resolved.',
        features: ['Ticket priorities', 'Agent assignment', 'Status tracking', 'Customer history'],
        keywords: ['helpdesk ticketing system', 'support ticket software'],
        appHref: '/support/helpdesk',
      },
      {
        slug: 'knowledge-base',
        name: 'Knowledge Base',
        summary: 'Publish help articles and FAQs so customers find answers without raising a ticket.',
        features: ['Help articles', 'Categories', 'Search'],
        keywords: ['knowledge base software', 'FAQ builder'],
        appHref: '/support/knowledge-base',
      },
    ],
  },
  {
    slug: 'workspace',
    name: 'AINOS Workspace',
    headline: 'Projects, tasks, approvals, reports and compliance',
    summary: 'Run projects, calendars, team collaboration, automations, approvals and compliance documents in one workspace.',
    keywords: ['project management software', 'team workspace', 'approval workflow'],
    tools: [
      {
        slug: 'projects',
        name: 'Projects & Tasks',
        summary: 'Plan projects, break them into tasks and track progress across your team.',
        features: ['Projects and tasks', 'Assignees and due dates', 'Progress tracking'],
        keywords: ['project management tool', 'task tracker'],
        appHref: '/projects',
      },
      {
        slug: 'calendar',
        name: 'Calendar',
        summary: 'See meetings, deadlines and events for the whole business on one shared calendar.',
        features: ['Shared calendar', 'Events and deadlines', 'Month and week views'],
        keywords: ['team calendar', 'business calendar app'],
        appHref: '/calendar',
      },
      {
        slug: 'team',
        name: 'Team & Roles',
        summary: 'Invite teammates and control which workspaces and tools each person can open.',
        features: ['Team invitations', 'Role-based access', 'Per-workspace permissions'],
        keywords: ['team management', 'user roles and permissions'],
        appHref: '/team',
      },
      {
        slug: 'automations',
        name: 'Workflow Automations',
        summary: 'Automate repetitive steps across modules so routine work runs without manual effort.',
        features: ['Trigger-based workflows', 'Cross-module actions', 'Run history'],
        keywords: ['workflow automation', 'business process automation'],
        appHref: '/automations',
      },
      {
        slug: 'reports',
        name: 'Business Reports',
        summary: 'Get cross-module reports on sales, finance and operations to make decisions on real numbers.',
        features: ['Cross-module reports', 'Charts and trends', 'Export'],
        keywords: ['business reporting software', 'MIS reports'],
        appHref: '/reports',
      },
      {
        slug: 'approvals',
        name: 'Approvals',
        summary: 'Route expenses, purchases and requests for approval with a clear audit trail.',
        features: ['Approval requests', 'Approver routing', 'Audit trail'],
        keywords: ['approval workflow software', 'request approval system'],
        appHref: '/approvals',
      },
      {
        slug: 'compliance',
        name: 'Compliance Documents',
        summary: 'Store licences and statutory documents with expiry dates and a compliance calendar.',
        features: ['Document vault', 'Expiry reminders', 'Compliance calendar'],
        keywords: ['compliance management software', 'statutory compliance calendar'],
        appHref: '/compliance/documents',
      },
    ],
  },
  {
    slug: 'ecommerce',
    name: 'AINOS eCommerce',
    headline: 'Run your online store, orders and customers',
    summary: 'Launch online stores, manage products and orders, run coupons and reviews, and track store analytics.',
    keywords: ['ecommerce platform India', 'online store builder', 'order management'],
    tools: [
      {
        slug: 'stores',
        name: 'Online Stores',
        summary: 'Set up and run one or more online storefronts connected to your AINOS catalog.',
        features: ['Multiple storefronts', 'Store settings', 'Catalog sync'],
        keywords: ['online store builder', 'ecommerce store setup'],
        appHref: '/ecommerce/stores',
      },
      {
        slug: 'products',
        name: 'Store Products',
        summary: 'List store products with prices, images and stock so customers can buy online.',
        features: ['Product listings', 'Images and pricing', 'Stock levels'],
        keywords: ['ecommerce product management', 'product listing'],
        appHref: '/ecommerce/products',
      },
      {
        slug: 'orders',
        name: 'Online Orders',
        summary: 'Track every online order from payment to fulfilment in one order queue.',
        features: ['Order queue', 'Payment status', 'Fulfilment tracking'],
        keywords: ['ecommerce order management', 'online order tracking'],
        appHref: '/ecommerce/orders',
      },
      {
        slug: 'customers',
        name: 'Store Customers',
        summary: 'See who buys from your store, what they ordered and how often they come back.',
        features: ['Customer profiles', 'Order history', 'Repeat buyer view'],
        keywords: ['ecommerce customer management'],
        appHref: '/ecommerce/customers',
      },
      {
        slug: 'analytics',
        name: 'Store Analytics',
        summary: 'Measure store revenue, orders and top products to grow online sales.',
        features: ['Revenue trends', 'Order volume', 'Top products'],
        keywords: ['ecommerce analytics', 'sales analytics dashboard'],
        appHref: '/ecommerce/analytics',
      },
      {
        slug: 'coupons',
        name: 'Coupons & Discounts',
        summary: 'Create discount codes with limits and expiry dates to drive store conversions.',
        features: ['Percentage or flat discounts', 'Usage limits', 'Expiry dates'],
        keywords: ['coupon code generator', 'discount management'],
        appHref: '/ecommerce/coupons',
      },
      {
        slug: 'reviews',
        name: 'Product Reviews',
        summary: 'Collect and moderate product reviews that build trust with new buyers.',
        features: ['Review moderation', 'Ratings', 'Publish controls'],
        keywords: ['product review management'],
        appHref: '/ecommerce/reviews',
      },
    ],
  },
  {
    slug: 'point-of-sale',
    name: 'AINOS Point of Sale',
    headline: 'Fast counter billing and daily sales for retail and restaurants',
    summary: 'Bill customers at the counter, manage register sessions, products and daily sales reports with AINOS POS.',
    keywords: ['POS software India', 'billing software for shop', 'restaurant POS'],
    tools: [
      {
        slug: 'sessions',
        name: 'POS Sessions',
        summary: 'Open and close counter sessions with cash totals so every shift reconciles.',
        features: ['Open and close sessions', 'Cash reconciliation', 'Shift totals'],
        keywords: ['POS session management', 'cash register reconciliation'],
        appHref: '/pos/sessions',
      },
      {
        slug: 'register',
        name: 'POS Register',
        summary: 'Ring up sales quickly at the counter with a touch-friendly billing register.',
        features: ['Touch-friendly billing', 'Quick product search', 'Multiple payment modes'],
        keywords: ['counter billing software', 'retail billing app'],
        appHref: '/pos/register',
      },
      {
        slug: 'orders',
        name: 'POS Orders',
        summary: 'Review every counter order with items, totals and payment mode.',
        features: ['Order history', 'Payment modes', 'Order totals'],
        keywords: ['POS order history'],
        appHref: '/pos/orders',
      },
      {
        slug: 'products',
        name: 'POS Products',
        summary: 'Manage counter products and menu items with prices and taxes.',
        features: ['Products and menu items', 'Prices and taxes', 'Categories'],
        keywords: ['POS product catalog', 'restaurant menu management'],
        appHref: '/pos/products',
      },
      {
        slug: 'reports',
        name: 'POS Sales Reports',
        summary: 'See daily counter sales, best sellers and payment-mode totals.',
        features: ['Daily sales', 'Best sellers', 'Payment-mode totals'],
        keywords: ['POS sales report', 'daily sales report'],
        appHref: '/pos/reports',
      },
    ],
  },
  {
    slug: 'operations',
    name: 'AINOS Operations',
    headline: 'Field service, maintenance, fleet, quality, repair and rental',
    summary: 'Dispatch field jobs, schedule maintenance, run your fleet, log quality checks, repairs and rentals in one operations suite.',
    keywords: ['field service management', 'fleet management software', 'maintenance management'],
    tools: [
      {
        slug: 'field-service',
        name: 'Field Service',
        summary: 'Schedule and dispatch field jobs to technicians and track them to completion.',
        features: ['Job scheduling', 'Technician assignment', 'Job status tracking'],
        keywords: ['field service software', 'technician dispatch'],
        appHref: '/operations/field-service',
      },
      {
        slug: 'maintenance',
        name: 'Maintenance',
        summary: 'Plan preventive maintenance for equipment and log every maintenance task.',
        features: ['Equipment register', 'Preventive schedules', 'Maintenance tasks'],
        keywords: ['maintenance management system', 'CMMS'],
        appHref: '/operations/maintenance',
      },
      {
        slug: 'fleet',
        name: 'Fleet Management',
        summary: 'Track vehicles, drivers, fuel and service logs for your whole fleet.',
        features: ['Vehicle records', 'Driver assignment', 'Fuel and service logs'],
        keywords: ['fleet management software', 'vehicle tracking'],
        appHref: '/operations/fleet',
      },
      {
        slug: 'quality',
        name: 'Quality Control',
        summary: 'Run quality inspections and record pass or fail results with corrective actions.',
        features: ['Inspection records', 'Pass / fail results', 'Corrective actions'],
        keywords: ['quality control software', 'inspection checklist'],
        appHref: '/operations/quality',
      },
      {
        slug: 'repair',
        name: 'Repair Orders',
        summary: 'Log repair jobs from intake to delivery with parts and charges.',
        features: ['Repair intake', 'Parts and charges', 'Delivery status'],
        keywords: ['repair shop software', 'service job card'],
        appHref: '/operations/repair',
      },
      {
        slug: 'rental',
        name: 'Rental Management',
        summary: 'Rent out equipment or assets with booking dates, returns and charges.',
        features: ['Rental bookings', 'Return tracking', 'Rental charges'],
        keywords: ['rental management software', 'equipment rental'],
        appHref: '/rental',
      },
    ],
  },
  {
    slug: 'ai-studio',
    name: 'AINOS AI Studio',
    headline: 'AI assistant, content, media and document automation',
    summary: 'Use AI to write content, generate social posts and media, extract invoice data and score leads inside AINOS.',
    keywords: ['AI business tools', 'AI content writer', 'AI invoice extraction'],
    tools: [
      {
        slug: 'ai-assistant',
        name: 'AI Business Assistant',
        summary: 'Ask questions about your invoices, customers and inventory and get answers from an AI assistant.',
        features: ['Natural-language questions', 'Business-aware answers', 'Chat history'],
        keywords: ['AI business assistant', 'AI chatbot for business'],
        appHref: '/ai/chat',
      },
      {
        slug: 'ai-content-writer',
        name: 'AI Content Writer',
        summary: 'Generate marketing copy, product descriptions and articles in your brand tone with AI.',
        features: ['Brand tone control', 'Multiple content types', 'Editable drafts'],
        keywords: ['AI content writer', 'AI copywriting tool'],
        appHref: '/tools',
      },
      {
        slug: 'invoice-extractor',
        name: 'AI Invoice Extractor',
        summary: 'Upload an invoice image or PDF and let AI read vendor, GSTIN, line items and totals automatically.',
        features: ['AI vision text extraction', 'GSTIN and totals detection', 'Line item capture'],
        keywords: ['invoice data extraction', 'invoice OCR software'],
        appHref: '/tools',
      },
      {
        slug: 'lead-scoring',
        name: 'AI Lead Scoring',
        summary: 'Score leads automatically so your sales team calls the hottest prospects first.',
        features: ['Automatic lead scores', 'Priority ranking', 'Score reasons'],
        keywords: ['AI lead scoring', 'sales lead prioritisation'],
        appHref: '/tools',
      },
      {
        slug: 'ai-media-studio',
        name: 'AI Media Studio',
        summary: 'Create marketing images and visuals from a text prompt or reference image with AI.',
        features: ['Text-to-image', 'Reference image input', 'Style presets'],
        keywords: ['AI image generator', 'AI marketing creatives'],
        appHref: '/ai/media',
      },
      {
        slug: 'lip-sync-studio',
        name: 'Lip Sync Studio',
        summary: 'Generate talking-head videos from a script or audio file with AI lip sync.',
        features: ['Script or audio input', 'AI lip sync', 'Video download'],
        keywords: ['AI lip sync video', 'talking avatar video'],
        appHref: '/ai/lipsync',
      },
    ],
  },
];

export function suiteBySlug(slug: string): SeoSuite | undefined {
  return SEO_SUITES.find(s => s.slug === slug);
}

export function toolBySlugs(suiteSlug: string, toolSlug: string): { suite: SeoSuite; tool: SeoTool } | undefined {
  const suite = suiteBySlug(suiteSlug);
  const tool = suite?.tools.find(t => t.slug === toolSlug);
  return suite && tool ? { suite, tool } : undefined;
}

/** In-app route → page title, used for browser tab titles inside the signed-in app. */
export function titleForAppPath(pathname: string): string | null {
  let best: { title: string; len: number } | null = null;
  for (const suite of SEO_SUITES) {
    for (const tool of suite.tools) {
      const href = tool.appHref;
      if (!(pathname === href || pathname.startsWith(`${href}/`))) continue;
      if (!best || href.length > best.len) {
        best = { title: tool.name, len: href.length };
      } else if (href.length === best.len && best.title !== tool.name) {
        // Several tools share one app screen (e.g. /manufacturing) — name the suite instead.
        best = { title: suite.name.replace(/^AINOS /, ''), len: href.length };
      }
    }
  }
  return best?.title ?? null;
}

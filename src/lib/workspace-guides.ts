import { NAV_GROUPS, type NavGroup, type NavItem } from '@/components/layout/navigation';
import { verticalForPath } from '@/lib/verticals';

/**
 * Plain-language "how to use" guides for every workspace and every tool page
 * in the sidebar. Keyed by the tool's route (NavItem.href), so a guide is found
 * for the tool page itself and for any sub-page under it (e.g. /invoices/new).
 */
export interface PageGuide {
  summary: string;
  steps: string[];
  tip?: string;
}

export interface WorkspaceGuide {
  intro: string;
  /** Routes to open first, in order, for a new user. */
  startHere: string[];
}

const g = (summary: string, steps: string[], tip?: string): PageGuide => ({ summary, steps, tip });

export const WORKSPACE_GUIDES: Record<NavGroup['key'], WorkspaceGuide> = {
  crm: {
    intro: 'Keep every enquiry in one place, move it to a deal and never miss a follow-up call.',
    startHere: ['/crm/leads', '/crm/deals', '/crm/follow-ups'],
  },
  supply: {
    intro: 'Know what you have in stock, what you ordered from vendors and what you sold.',
    startHere: ['/inventory/vendors', '/inventory/stock', '/inventory/orders'],
  },
  people: {
    intro: 'Your staff list, daily attendance, leave and monthly salary in one workspace.',
    startHere: ['/hr/employees', '/hr/attendance', '/hr/payroll'],
  },
  support: {
    intro: 'Answer customer questions as tickets and publish help articles they can read themselves.',
    startHere: ['/support/helpdesk', '/support/knowledge-base'],
  },
  workspace: {
    intro: 'Plan projects, share the calendar, get approvals and keep company documents ready.',
    startHere: ['/team', '/projects', '/approvals'],
  },
  finance: {
    intro: 'Make GST invoices, track who owes you money and record what you spend.',
    startHere: ['/customers', '/invoices', '/finance/reminders'],
  },
  billing: {
    intro: 'Your books: daily entries, profit, GST returns and bank balances.',
    startHere: ['/finance/daybook', '/finance/reports', '/finance/gst-reports'],
  },
  marketing: {
    intro: 'Reach customers by email and social media, and grow on Google with SEO and blogs.',
    startHere: ['/marketing/campaigns', '/marketing/social-media', '/marketing/blog'],
  },
  ecommerce: {
    intro: 'Set up an online store, list products and handle the orders that come in.',
    startHere: ['/ecommerce/stores', '/ecommerce/products', '/ecommerce/orders'],
  },
  pos: {
    intro: 'Bill customers at the counter and close each day with a clean sales report.',
    startHere: ['/pos/products', '/pos/sessions', '/pos/register'],
  },
  manufacturing: {
    intro: 'Plan what to produce, which materials it needs and track each production run.',
    startHere: ['/manufacturing'],
  },
  operations: {
    intro: 'Run field visits, machine maintenance, vehicles, quality checks, repairs and rentals.',
    startHere: ['/operations/field-service', '/operations/maintenance', '/operations/fleet'],
  },
};

export const PAGE_GUIDES: Record<string, PageGuide> = {
  // CRM
  '/crm/leads': g('Every new enquiry from calls, WhatsApp, your website or walk-ins.', [
    'Add a lead with the person’s name, phone or email and where they came from.',
    'Set the status as you talk to them: new, contacted, qualified or lost.',
    'When the lead is serious, convert it into a deal so you can track the money.',
  ], 'Add leads the same day they call. Fresh leads close faster.'),
  '/crm/deals': g('Your sales pipeline: every deal, its value and the stage it is in.', [
    'Create a deal with the customer, the expected amount and the closing date.',
    'Move the deal through the stages as the talks progress.',
    'Mark it won or lost so your pipeline value stays honest.',
  ], 'Check deals stuck in one stage for more than two weeks and follow up.'),
  '/crm/contacts': g('The address book of everyone you do business with.', [
    'Add a contact with name, company, phone and email.',
    'Open a contact to see their leads, deals and notes together.',
    'Keep details updated so invoices and emails go to the right person.',
  ]),
  '/crm/follow-ups': g('Calls, meetings and reminders you promised to customers.', [
    'Add a follow-up with the person, the date and what you need to discuss.',
    'Check today’s list every morning and finish them one by one.',
    'Mark each one done and add a short note about the result.',
  ], 'A follow-up within 24 hours doubles the chance of a reply.'),

  // Supply Chain
  '/inventory/stock': g('How much of each item you have, and where.', [
    'Add your items with name, unit, purchase price and selling price.',
    'Enter the opening quantity you have today.',
    'Stock goes up with purchase orders and down with sales, so keep using those.',
  ], 'Set a low-stock level on fast-moving items so you reorder in time.'),
  '/inventory/orders': g('Orders you place with vendors to buy stock.', [
    'Create a purchase order, pick the vendor and add items with quantity and rate.',
    'Send it to the vendor as a PDF.',
    'When the goods arrive, mark it received so stock updates.',
  ]),
  '/inventory/sales-orders': g('Customer orders before they are billed and delivered.', [
    'Create a sales order for the customer with the items they want.',
    'Confirm it once the customer agrees on price and date.',
    'Deliver and bill it so stock goes down and the invoice is ready.',
  ]),
  '/inventory/vendors': g('The suppliers you buy from.', [
    'Add a vendor with business name, GSTIN, phone and address.',
    'Use the vendor on purchase orders and bills.',
    'Open a vendor to see everything you bought from them.',
  ], 'Save the GSTIN correctly. Your input tax credit depends on it.'),
  '/inventory/warehouses': g('Godowns, shops or rooms where you keep stock.', [
    'Add each location with a clear name.',
    'Choose the warehouse when you receive or move stock.',
    'Check stock location-wise before you promise delivery.',
  ]),
  '/manufacturing': g('Production planning: bills of materials and work orders.', [
    'Create a bill of materials: the finished product and the raw materials it uses.',
    'Start a manufacturing order for how many pieces you want to make.',
    'Mark it done so raw materials go down and finished stock goes up.',
  ], 'Keep raw material stock accurate first. Production plans depend on it.'),

  // People
  '/hr/employees': g('Your staff list with roles, salary and joining details.', [
    'Add each employee with name, phone, department and monthly salary.',
    'Fill in PAN and bank details so payroll can run.',
    'Update the record when someone changes role or leaves.',
  ]),
  '/hr/attendance': g('Who came to work each day.', [
    'Open today’s date and mark each person present, absent or half day.',
    'Correct past days if someone forgot to mark.',
    'Check the monthly view before you run payroll.',
  ], 'Mark attendance daily. Fixing a full month later is error-prone.'),
  '/planning': g('Shift and work planning for your team.', [
    'Pick the week you want to plan.',
    'Assign people to shifts or tasks for each day.',
    'Share the plan so everyone knows where to be.',
  ]),
  '/hr/leaves': g('Leave requests and leave balances.', [
    'Add or receive a leave request with dates and type.',
    'Approve or reject it.',
    'Approved leave shows on attendance and payroll automatically.',
  ]),
  '/hr/payroll': g('Monthly salary with PF, ESI and payslips.', [
    'Pick the month and check attendance is complete.',
    'Review each salary, deductions and net pay.',
    'Finalise and download payslips for your staff.',
  ], 'Run payroll after attendance and leave are final for the month.'),
  '/hr/recruitment': g('Open jobs and candidates applying for them.', [
    'Create a job opening with role, salary range and location.',
    'Add candidates and move them through interview stages.',
    'Hire the selected candidate and add them as an employee.',
  ]),
  '/hr/timesheet': g('Hours worked by each person on tasks or projects.', [
    'Pick the person and the week.',
    'Enter hours for each day and task.',
    'Submit for approval and use it for billing or salary.',
  ]),

  // Support
  '/support/helpdesk': g('Customer questions and complaints as tickets.', [
    'Create a ticket with the customer, the issue and the priority.',
    'Assign it to someone in your team.',
    'Reply, solve and close it so nothing is forgotten.',
  ], 'Close tickets only after the customer confirms the issue is solved.'),
  '/support/knowledge-base': g('Help articles your customers and staff can read.', [
    'Write an article for a question you get often.',
    'Group articles by topic so they are easy to find.',
    'Share the article link in ticket replies to save time.',
  ]),

  // Workspace
  '/projects': g('Projects and their tasks, owners and due dates.', [
    'Create a project with a name, client and deadline.',
    'Add tasks and assign each to a team member.',
    'Move tasks to done and watch the progress bar fill up.',
  ]),
  '/calendar': g('Meetings, deadlines and events for the whole team.', [
    'Add an event with date, time and who should attend.',
    'Switch between month, week and day views.',
    'Open an event to change or cancel it.',
  ]),
  '/team': g('People who can log in to AINOS and what they can open.', [
    'Invite a team member with their email.',
    'Choose which workspaces they can use.',
    'Remove access when someone leaves the company.',
  ], 'Give each person only the workspaces they need.'),
  '/automations': g('Rules that do routine work for you.', [
    'Pick a trigger, for example a new invoice or a new lead.',
    'Choose the action, such as sending an email or creating a task.',
    'Turn the rule on and check its log to see it working.',
  ]),
  '/reports': g('Business reports across sales, team and work.', [
    'Pick the report you need.',
    'Choose the date range.',
    'Download it or share it with your team.',
  ]),
  '/approvals': g('Requests that need a yes or no from a manager.', [
    'Raise a request, for example an expense or a discount.',
    'The approver sees it here and approves or rejects it.',
    'Track the status of every request you raised.',
  ]),
  '/compliance/documents': g('Company documents and their expiry dates.', [
    'Upload documents like GST certificate, PAN, licences and agreements.',
    'Add the expiry date where there is one.',
    'Renew documents before they expire. The list shows what is due.',
  ]),

  // Finance
  '/invoices': g('GST invoices for your customers.', [
    'Click to create a new invoice and pick the customer.',
    'Add items with quantity, rate and GST. Totals calculate themselves.',
    'Save, then download the PDF or send it to the customer.',
    'Record the payment when the money arrives.',
  ], 'Add your customers first so invoices fill their GSTIN and address automatically.'),
  '/customers': g('Everyone you bill, with GSTIN and address.', [
    'Add a customer. Enter the GSTIN and the details fill in automatically.',
    'Check the billing address and state. They decide CGST/SGST or IGST.',
    'Open a customer to see their invoices and what they still owe.',
  ]),
  '/finance/expenses': g('Money you spend: rent, travel, bills and purchases.', [
    'Add an expense with date, amount, category and how you paid.',
    'Attach the bill photo or PDF.',
    'Check expenses month-wise to see where money goes.',
  ], 'Upload the bill with GST on it so you can claim input credit.'),
  '/finance/reminders': g('Invoices that are not paid yet.', [
    'See every unpaid invoice with how many days it is overdue.',
    'Send a payment reminder to the customer in one click.',
    'Record the payment once it arrives and the invoice leaves this list.',
  ], 'Remind on the due date, not a month later.'),
  '/finance/business-cards': g('Turn a visiting card photo into a saved customer.', [
    'Upload or take a photo of the visiting card.',
    'Check the name, phone, email and company it reads.',
    'Save it. The person is added to your Customers.',
  ]),
  '/products': g('Items and services you sell, with HSN/SAC and GST rate.', [
    'Add a product or service with name, price and unit.',
    'Set the HSN or SAC code and the GST rate.',
    'Pick it on invoices so rates and tax fill in automatically.',
  ]),
  '/finance/quotes': g('Price quotes you send before the sale.', [
    'Create a quotation for the customer with items and prices.',
    'Send it as a PDF.',
    'When the customer agrees, convert it into an invoice.',
  ]),
  '/finance/purchase-orders': g('Orders you send to vendors before buying.', [
    'Create a purchase order with the vendor and items.',
    'Send it to the vendor.',
    'Match the vendor bill against it when the goods arrive.',
  ]),
  '/finance/challans': g('Delivery challans for goods sent without an invoice.', [
    'Create a challan with the customer, items and vehicle details.',
    'Print it and send it with the goods.',
    'Convert it into an invoice when you bill the customer.',
  ]),
  '/finance/tally': g('Move your data to and from Tally or Excel.', [
    'Pick what you want to export: invoices, customers or expenses.',
    'Choose the date range and download the file.',
    'To import, upload your Excel file in the given format.',
  ], 'Export at month end so your CA has everything in Tally.'),
  '/finance/templates': g('The look of your invoice PDF.', [
    'Upload your logo and pick brand colours.',
    'Choose a layout and the fields to show.',
    'Save. Every new invoice uses this design.',
  ]),

  // Accounting
  '/finance/daybook': g('Every money-in and money-out entry, day by day.', [
    'Pick the date or date range.',
    'See sales, receipts, expenses and payments in order.',
    'Open any entry to check the source invoice or expense.',
  ]),
  '/finance/reports': g('Profit and loss, balance sheet and other reports.', [
    'Pick the report, for example profit and loss.',
    'Choose the month, quarter or year.',
    'Download it as PDF or Excel for your CA or bank.',
  ]),
  '/finance/gst-reports': g('Your GSTR-1 and GSTR-3B figures, ready to file.', [
    'Pick the month you want to file.',
    'Check sales, tax and the invoice list.',
    'Open "File your GST" and download the upload file for the GST portal.',
    'After filing, enter the ARN so the month shows as filed.',
  ], 'GSTR-1 is due on the 11th and GSTR-3B on the 20th of the next month.'),
  '/finance/recurring-invoices': g('Invoices that repeat every month or year.', [
    'Create a recurring invoice with the customer, items and how often it repeats.',
    'Set the start date and when it should stop.',
    'AINOS makes the invoice on each date. Pause it any time.',
  ]),
  '/finance/bank-accounts': g('Your bank and cash accounts with balances.', [
    'Add each bank account with name and opening balance.',
    'Record payments and receipts against the right account.',
    'Match the balance with your bank statement every month.',
  ]),
  '/finance/credit-notes': g('Notes that reduce what a customer owes you.', [
    'Create a credit note against the original invoice.',
    'Enter the returned items or the discount amount.',
    'It reduces the customer balance and your GST for that month.',
  ]),
  '/finance/debit-notes': g('Notes for returns to vendors or extra charges.', [
    'Create a debit note against the vendor bill.',
    'Enter the returned items or the extra amount.',
    'It adjusts the vendor balance and your input tax.',
  ]),

  // Marketing
  '/marketing/campaigns': g('Email campaigns to your customer list.', [
    'Create a campaign and write the subject and message.',
    'Pick the contacts who should receive it.',
    'Send now or schedule it, then check opens and clicks.',
  ], 'Short subjects with the customer’s benefit get the most opens.'),
  '/marketing/social-media': g('Posts for Instagram, Facebook and LinkedIn.', [
    'Write a post or let AI draft one from a topic.',
    'Add an image and pick the platforms.',
    'Publish now or schedule it for later.',
  ]),
  '/marketing/seo': g('How your website shows up on Google.', [
    'Connect or enter your website address.',
    'Run a check to see issues and keyword rankings.',
    'Fix the top issues first and re-run the check.',
  ]),
  '/marketing/blog': g('Blog posts for your website, written with AI.', [
    'Pick a topic or let AI suggest topics for your business.',
    'Review and edit the draft.',
    'Publish it to your connected website.',
  ], 'Post regularly. One good post a week beats ten at once.'),
  '/marketing/invitations': g('Invitations for events, launches and offers.', [
    'Pick a template and add your event details.',
    'Choose who should receive it.',
    'Send it and track who opened it.',
  ]),

  // eCommerce
  '/ecommerce/stores': g('Your online store and its basic details.', [
    'Create a store with a name, logo and currency.',
    'Add payment and delivery settings.',
    'Publish the store and share its link.',
  ]),
  '/ecommerce/products': g('Products listed in your online store.', [
    'Add a product with photos, price and description.',
    'Set stock and variants such as size or colour.',
    'Publish it so customers can buy it.',
  ]),
  '/ecommerce/orders': g('Orders placed on your online store.', [
    'See new orders as they come in.',
    'Confirm, pack and mark each order shipped.',
    'Mark it delivered or handle a return.',
  ]),
  '/ecommerce/customers': g('People who bought from your online store.', [
    'See every buyer with their orders and total spend.',
    'Open a customer to view their order history.',
    'Use the list for offers and campaigns.',
  ]),
  '/ecommerce/analytics': g('Store sales, visitors and best-selling products.', [
    'Pick the date range.',
    'Check sales, order count and average order value.',
    'Look at top products and restock them first.',
  ]),
  '/ecommerce/coupons': g('Discount codes for your store.', [
    'Create a coupon with a code and the discount.',
    'Set the minimum order, expiry date and usage limit.',
    'Share the code with customers.',
  ]),
  '/ecommerce/reviews': g('Product reviews from your customers.', [
    'See new reviews as they arrive.',
    'Approve or hide each review.',
    'Reply to unhappy customers quickly.',
  ]),
  '/ecommerce/settings': g('Store-wide settings like payments, shipping and taxes.', [
    'Set your payment methods.',
    'Add shipping zones and charges.',
    'Check tax settings and save.',
  ]),

  // Point of Sale
  '/pos/sessions': g('Counter shifts: open, sell and close each day.', [
    'Open a session with the opening cash in the drawer.',
    'Sell through the register during the shift.',
    'Close the session and match the cash with the system total.',
  ]),
  '/pos/register': g('The billing screen at your counter.', [
    'Tap or search products to add them to the bill.',
    'Pick the payment method: cash, UPI or card.',
    'Complete the sale and print or share the receipt.',
  ], 'Open a session first. The register needs an active session.'),
  '/pos/orders': g('Every bill made at the counter.', [
    'Search a bill by number, date or customer.',
    'Open it to reprint the receipt.',
    'Handle a return or refund from the bill.',
  ]),
  '/pos/products': g('Items available at the counter with prices.', [
    'Add products with name, price and GST.',
    'Group them into categories for faster billing.',
    'Mark items unavailable when they run out.',
  ]),
  '/pos/reports': g('Daily and monthly counter sales.', [
    'Pick the day or date range.',
    'Check sales by payment method and by product.',
    'Download the report for your accounts.',
  ]),

  // Operations
  '/operations/field-service': g('Jobs your technicians do at customer sites.', [
    'Create a job with the customer, address and work needed.',
    'Assign a technician and a time slot.',
    'Mark it complete with notes and bill the customer.',
  ]),
  '/operations/maintenance': g('Upkeep for your machines and equipment.', [
    'Add each machine or asset.',
    'Schedule regular maintenance or log a breakdown.',
    'Close the request once the work is done.',
  ]),
  '/operations/fleet': g('Your vehicles, drivers and running costs.', [
    'Add each vehicle with number, type and documents.',
    'Log fuel, service and trips.',
    'Watch insurance and permit dates so nothing expires.',
  ]),
  '/operations/quality': g('Quality checks on goods and work.', [
    'Create a check with what to test and the pass criteria.',
    'Record the result for each batch or job.',
    'Raise an alert when something fails.',
  ]),
  '/operations/repair': g('Repair orders for customer products.', [
    'Create a repair order with the product and the problem.',
    'Add parts and labour as the work progresses.',
    'Close it and bill the customer.',
  ]),
  '/rental': g('Items you rent out and their bookings.', [
    'Add rental items with daily or monthly rates.',
    'Book an item for a customer with start and end dates.',
    'Mark it returned and collect the payment.',
  ]),
};

export interface PathGuideMatch {
  group: NavGroup;
  item: NavItem;
  guide: PageGuide;
}

/** Longest-href match of a pathname to a sidebar tool and its guide. A tool
 *  listed in two groups resolves to the group that owns the route. */
export function guideForPath(pathname: string): PathGuideMatch | null {
  const owner = verticalForPath(pathname)?.key;
  let best: PathGuideMatch | null = null;
  let bestLen = -1;
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      const guide = PAGE_GUIDES[item.href];
      if (!guide) continue;
      if (pathname !== item.href && !pathname.startsWith(`${item.href}/`)) continue;
      const len = item.href.length;
      if (len > bestLen || (len === bestLen && group.key === owner)) {
        best = { group, item, guide };
        bestLen = len;
      }
    }
  }
  return best;
}

export const workspaceHref = (key: string) => `/dashboard/workspaces/${key}`;

import type { ToolPageContent } from './types';

/**
 * Tool-level content for supply chain, manufacturing, people and support.
 * Keys are `suite/tool`.
 */
export const TOOL_CONTENT_B: Record<string, ToolPageContent> = {
  'supply-chain/stock': {
    answer:
      'Stock management shows the live quantity of each item per warehouse, with reorder levels and low-stock flags, and it is reduced by every sale that leaves the business. Because counter billing, online orders and sales orders draw from the same balance, the number on screen is the quantity that actually exists.',
    bestFor: ['Traders running more than one godown', 'Retailers selling in store and online'],
    steps: [
      { title: 'Item and location', body: 'Each stock line is an item at a specific warehouse with its own quantity.' },
      { title: 'Movements post', body: 'Purchases add, sales orders, counter bills and online orders subtract.' },
      { title: 'Replenish on signal', body: 'Reorder levels raise a low-stock flag before the item runs out.' },
    ],
    links: ['supply-chain/warehouses', 'supply-chain/purchase-orders', 'point-of-sale/register'],
    faqs: [
      {
        question: 'Is stock tracked separately per warehouse?',
        answer:
          'Yes. Each item is held per location, so a warehouse shows what is physically there while the item view shows the total across every location.',
      },
      {
        question: 'What reduces stock automatically?',
        answer:
          'Sales recorded through counter billing, online store orders and inventory sales orders draw from the same stock records, so stock is not maintained by one channel on behalf of all of them.',
      },
    ],
  },

  'supply-chain/purchase-orders': {
    answer:
      'Inventory purchase orders raise a request for stock from a vendor and track it from draft to received, with line items, quantities and totals. The order is what connects a supplier commitment to the stock that eventually arrives, and it reads the same vendor and product records as the rest of the suite.',
    bestFor: ['Businesses restocking against demand', 'Teams tracking deliveries from suppliers'],
    steps: [
      { title: 'Draft the order', body: 'The vendor and the items with quantities are recorded against the purchase.' },
      { title: 'Place it', body: 'The order moves from draft to placed with the expected receipt in view.' },
      { title: 'Receive the stock', body: 'Arrival updates the stock balance and the order status together.' },
    ],
    links: ['supply-chain/vendors', 'supply-chain/stock', 'finance/purchase-orders'],
    faqs: [
      {
        question: 'Does receipt of a purchase order update stock?',
        answer:
          'Receiving a purchase order against the ordered quantities is what brings the items into stock, so the balance and the order status stay consistent.',
      },
      {
        question: 'Is there a finance purchase order as well?',
        answer:
          'Yes. Finance raises purchase orders in the purchasing flow and inventory has its own view for stock. Both reference the same vendor and product records in the workspace.',
      },
    ],
  },

  'supply-chain/sales-orders': {
    answer:
      'Sales orders confirm what a customer has ordered and track fulfilment from order to delivery, with line items and totals. It sits between a confirmed deal and the invoice, which is what makes dispatches traceable to a specific customer commitment.',
    bestFor: ['Businesses dispatching against confirmed orders', 'Teams managing partial fulfilment'],
    steps: [
      { title: 'Confirm the order', body: 'Customer, items, quantities and agreed prices are recorded on the order.' },
      { title: 'Fulfil it', body: 'Status moves as goods are picked, dispatched and delivered.' },
      { title: 'Bill it', body: 'The same customer and items continue into the invoice without re-entry.' },
    ],
    links: ['supply-chain/stock', 'finance/invoices', 'finance/delivery-challans'],
    faqs: [
      {
        question: 'How is a sales order different from an invoice?',
        answer:
          'A sales order records a commitment to supply goods and its fulfilment. The invoice is the tax document raised for the value supplied, so the order tracks delivery while the invoice records the sale.',
      },
      {
        question: 'Can one order be delivered in parts?',
        answer:
          'Fulfilment status is tracked on the order, so a partly supplied order remains open with the balance still to dispatch rather than being closed early.',
      },
    ],
  },

  'supply-chain/vendors': {
    answer:
      'Vendor management keeps each supplier with its GSTIN, contact details and purchase history in one record, which is what makes a repeat order quick and a purchase return traceable. Vendor records are used by purchase orders in both inventory and finance.',
    bestFor: ['Businesses buying from many suppliers', 'Teams checking a supplier\u2019s GSTIN'],
    steps: [
      { title: 'Add the supplier', body: 'Name, GSTIN and contact details are stored once on the vendor record.' },
      { title: 'Buy against it', body: 'Purchase orders reference the vendor rather than a typed name.' },
      { title: 'Review history', body: 'Past purchases and prices stay visible on the supplier for the next negotiation.' },
    ],
    links: ['supply-chain/purchase-orders', 'accounting/debit-notes', 'finance/expenses'],
    faqs: [
      {
        question: 'Is the vendor GSTIN stored on the record?',
        answer:
          'Yes. A vendor record holds its GSTIN alongside contact and purchase details, which supports input tax records and purchase return documentation.',
      },
      {
        question: 'Can I see past purchases from a vendor?',
        answer:
          'Purchase history is kept against the vendor, so the last price paid and the items supplied are available before a new order is raised.',
      },
    ],
  },

  'supply-chain/warehouses': {
    answer:
      'Warehouses and godowns are modelled as separate locations, each holding its own stock per item, so a business can say what is at which site. Transfers are visible per location, which is the difference between a stock number and a stock number you can act on.',
    bestFor: ['Businesses with more than one storage site', 'Teams splitting stock between shop and godown'],
    steps: [
      { title: 'Create the location', body: 'Each warehouse or godown is defined as its own stock location.' },
      { title: 'Hold stock per site', body: 'Quantities are recorded against the item at that location.' },
      { title: 'Compare locations', body: 'The location overview shows where the balance actually sits.' },
    ],
    links: ['supply-chain/stock', 'supply-chain/sales-orders', 'operations/fleet'],
    faqs: [
      {
        question: 'Can stock be split across several godowns?',
        answer:
          'Yes. Each warehouse holds its own quantity per item, so the same item can sit at two sites with independent balances and one total.',
      },
      {
        question: 'Does the invoice know which warehouse supplied it?',
        answer:
          'The location view explains where stock was held, and dispatch documents can reference the goods leaving a specific site so the record is not a single undifferentiated number.',
      },
    ],
  },

  'manufacturing/bills-of-materials': {
    answer:
      'A bill of materials lists the components and quantities consumed to make one finished unit, and it is the recipe a manufacturing order reads when it plans a run. Keeping it in the workspace is what lets a production cost and a stock movement be explained from one definition.',
    bestFor: ['Assembly and fabrication units', 'Businesses costing a product from its parts'],
    steps: [
      { title: 'Define the output', body: 'The finished product is chosen from the catalogue.' },
      { title: 'List the inputs', body: 'Each component and the quantity consumed per unit is added.' },
      { title: 'Reuse it', body: 'Manufacturing orders pull the component list when planning a run.' },
    ],
    links: ['manufacturing/manufacturing-orders', 'supply-chain/stock', 'finance/products'],
    faqs: [
      {
        question: 'Can one product have several components?',
        answer:
          'Yes. A bill of materials is a list, so a finished product can consume many components with an individual quantity for each.',
      },
      {
        question: 'Does the bill of materials change my stock?',
        answer:
          'Not by itself. It is the definition. Consumption is recorded when a manufacturing order runs against it, which is when stock actually moves.',
      },
    ],
  },

  'manufacturing/manufacturing-orders': {
    answer:
      'A manufacturing order schedules a production run with its quantity and planned start date, then tracks the order until it completes. It ties the bill of materials, the work center and the resulting stock movement to one document, so a production question has one place to look.',
    bestFor: ['Job shops producing to order', 'Plants running planned batches'],
    steps: [
      { title: 'Plan the run', body: 'Quantity and a planned start date define what is being produced and when.' },
      { title: 'Work it', body: 'Status moves as the run progresses on the assigned work center.' },
      { title: 'Complete it', body: 'Finished goods and consumed materials update the stock record.' },
    ],
    links: ['manufacturing/bills-of-materials', 'manufacturing/work-centers', 'supply-chain/stock'],
    faqs: [
      {
        question: 'Does a manufacturing order consume component stock?',
        answer:
          'Consumption is recorded against the order, which reduces the component quantities, and finished goods received from the run raise the finished-product stock.',
      },
      {
        question: 'Can orders be scheduled for a future date?',
        answer:
          'Yes. A planned start date is stored on the order, so upcoming production is visible before the run begins.',
      },
    ],
  },

  'manufacturing/work-centers': {
    answer:
      'Work centers model the machines or production lines a business runs, with their capacity, so a production plan can be checked against what the shop floor can actually deliver. They are the reference a manufacturing order is assigned to.',
    bestFor: ['Plants with several machines or lines', 'Businesses promising delivery dates'],
    steps: [
      { title: 'Record the resource', body: 'Each machine or line is created as a work center.' },
      { title: 'Set its capacity', body: 'Capacity defines how much work the resource can take in a period.' },
      { title: 'Assign production', body: 'Manufacturing orders reference the work center that produces them.' },
    ],
    links: ['manufacturing/manufacturing-orders', 'manufacturing/quality-and-scrap', 'workspace/projects'],
    faqs: [
      {
        question: 'What does capacity mean for a work center?',
        answer:
          'It expresses how much production the resource can handle in a period, which is what makes a delivery promise checkable against the line instead of assumed.',
      },
      {
        question: 'Can several work centers run at once?',
        answer:
          'Yes. Each machine or line is its own record, so parallel production across resources can be represented rather than collapsed into one number.',
      },
    ],
  },

  'manufacturing/quality-and-scrap': {
    answer:
      'Quality checks and scrap logging record what came off a production run: inspection results with pass or fail, corrective action and the quantity scrapped. It is the difference between a loss that is known and a loss that is simply discovered later in a stock count.',
    bestFor: ['Manufacturers with rejections', 'Plants tracking material loss'],
    steps: [
      { title: 'Inspect the output', body: 'A check is recorded against the production it belongs to.' },
      { title: 'Record the result', body: 'Pass or fail is logged with the corrective action taken.' },
      { title: 'Log the scrap', body: 'Scrapped quantity is recorded so the loss is visible and attributable.' },
    ],
    links: ['manufacturing/manufacturing-orders', 'operations/quality', 'supply-chain/stock'],
    faqs: [
      {
        question: 'Can inspection failures be tracked over time?',
        answer:
          'Results are recorded against the production they relate to, so a recurring failure on the same product or work center becomes visible rather than anecdotal.',
      },
      {
        question: 'Does scrapped material affect stock?',
        answer:
          'Scrap is recorded as a logged loss against production, which keeps the reason for the missing quantity on record instead of leaving an unexplained shortfall.',
      },
    ],
  },

  'people/employees': {
    answer:
      'Employee records hold each person\u2019s profile, department, role and joining details in one directory that payroll, attendance and timesheets read. Role-based access means the directory is visible to the people who need it rather than shared as a spreadsheet.',
    bestFor: ['Businesses with 5 to 200 staff', 'HR teams keeping records current'],
    steps: [
      { title: 'Create the profile', body: 'Personal details, department, role and joining date are recorded.' },
      { title: 'Attach the pay structure', body: 'Salary components are stored against the employee for payroll.' },
      { title: 'Grant access', body: 'A role decides which parts of the workspace that person can open.' },
    ],
    links: ['people/payroll', 'people/attendance', 'workspace/team'],
    faqs: [
      {
        question: 'Who can see employee records?',
        answer:
          'Access follows the role given to each teammate, so the employee directory is available to the roles you authorise rather than to everyone in the workspace.',
      },
      {
        question: 'Is the pay structure stored on the employee?',
        answer:
          'Yes. Salary components and deductions are held against the employee record, which is what a payroll run reviews instead of a separate master file.',
      },
    ],
  },

  'people/attendance': {
    answer:
      'Attendance tracking records each employee for each working day, then produces monthly summaries with late and absent visibility. Because leave approvals and payroll read the same data, the month-end number is a report rather than a reconstruction.',
    bestFor: ['Teams with daily attendance marking', 'HR preparing payroll inputs'],
    steps: [
      { title: 'Mark the day', body: 'Attendance is recorded per employee for the date in question.' },
      { title: 'Review the month', body: 'Monthly summaries show present, absent and late days per person.' },
      { title: 'Feed payroll', body: 'Approved leave and attendance inform the payroll review.' },
    ],
    links: ['people/time-off', 'people/payroll', 'people/planning'],
    faqs: [
      {
        question: 'Can attendance be viewed monthly?',
        answer:
          'Yes. Daily marks roll into a monthly summary per employee, which is what payroll and a manager review actually need.',
      },
      {
        question: 'Does approved leave appear in attendance?',
        answer:
          'Approved leave is recorded against the employee and appears in the attendance view for that period, so a leave day is not treated as an unexplained absence.',
      },
    ],
  },

  'people/planning': {
    answer:
      'Shift planning assigns the team to shifts and shows coverage on a calendar, so a manager can see who is on which slot before the week starts. It sits beside attendance and leave, which is where a hole in the roster becomes obvious.',
    bestFor: ['Businesses running shifts', 'Managers balancing weekend cover'],
    steps: [
      { title: 'Define the shifts', body: 'The working patterns the business runs are set up first.' },
      { title: 'Assign the team', body: 'Employees are placed on shifts for the coming period.' },
      { title: 'Check coverage', body: 'The calendar view shows gaps before the day arrives.' },
    ],
    links: ['people/attendance', 'people/time-off', 'workspace/calendar'],
    faqs: [
      {
        question: 'Can shifts be planned a week ahead?',
        answer:
          'Shifts are assigned on a calendar, so the roster for an upcoming period can be set and reviewed before it starts.',
      },
      {
        question: 'Does planning account for leave?',
        answer:
          'Leave records sit in the same workspace, so an approved absence is visible when the shift is planned rather than discovered on the day.',
      },
    ],
  },

  'people/time-off': {
    answer:
      'Leave management lets an employee raise a request, an approver accept or reject it, and keeps the history on the employee record. Approved leave then informs attendance and payroll, so a day off is reflected in the numbers without a separate message.',
    bestFor: ['Businesses with a formal leave policy', 'Managers approving requests'],
    steps: [
      { title: 'Raise the request', body: 'The employee submits dates and the reason for the absence.' },
      { title: 'Approve or reject', body: 'An approver acts on the request and the decision is recorded.' },
      { title: 'Keep the history', body: 'Approved leave stays on the employee record for attendance and payroll.' },
    ],
    links: ['people/attendance', 'people/payroll', 'workspace/approvals'],
    faqs: [
      {
        question: 'How does a leave request get approved?',
        answer:
          'The request is raised in the workspace and routed for a decision. Once approved, it is recorded against the employee and reflected in attendance for those dates.',
      },
      {
        question: 'Is leave history kept after approval?',
        answer:
          'Yes. Past requests and their outcomes stay on the employee record, which supports attendance review and payroll input.',
      },
    ],
  },

  'people/payroll': {
    answer:
      'Payroll runs earnings and deductions per employee for the month and calculates net pay, using salary components and the attendance already recorded. The payroll run is a review of stored numbers rather than a spreadsheet rebuilt from scratch, with PF, ESI and professional tax settings available for Indian statutory deduction.',
    bestFor: ['Businesses running monthly payroll', 'Teams with shift and attendance-linked pay'],
    steps: [
      { title: 'Confirm the inputs', body: 'Salary components, attendance and approved leave are reviewed for the month.' },
      { title: 'Run payroll', body: 'Earnings, deductions and net pay are calculated per employee.' },
      { title: 'Review and record', body: 'The run is checked, and payroll cost can be recorded against expenses.' },
    ],
    links: ['people/employees', 'people/attendance', 'finance/expenses'],
    faqs: [
      {
        question: 'Does payroll support PF, ESI and professional tax?',
        answer:
          'Payroll plans support PF, ESI and professional tax settings as configurable deductions on the employee pay structure. Slab rates change with statute, so the applicable values should be confirmed with your accountant during setup.',
      },
      {
        question: 'Is attendance used in payroll?',
        answer:
          'Attendance and approved leave are recorded in the same workspace, so the payroll review works from the month\u2019s actual days rather than a separate register.',
      },
    ],
  },

  'people/recruitment': {
    answer:
      'Recruitment posts an opening and moves candidates through hiring stages until an offer is made, keeping the pipeline visible per role. It is a simple applicant tracker, not a job board, which suits a business hiring a handful of roles at a time.',
    bestFor: ['Small teams hiring in-house', 'Managers tracking interview stages'],
    steps: [
      { title: 'Post the opening', body: 'The role is created and candidates are attached to it.' },
      { title: 'Move the stages', body: 'Each candidate advances or drops out as interviews progress.' },
      { title: 'Make the offer', body: 'The selected candidate becomes an employee record on joining.' },
    ],
    links: ['people/employees', 'people/timesheets', 'workspace/projects'],
    faqs: [
      {
        question: 'Is this a job board integration?',
        answer:
          'No. It tracks the openings a business is hiring for and the candidates in each stage, so the pipeline is visible inside the workspace. Advertising the role happens on the channels you choose.',
      },
      {
        question: 'Does a hired candidate become an employee?',
        answer:
          'On joining, the person is added as an employee record with department, role and pay structure, so hiring and payroll do not need two masters.',
      },
    ],
  },

  'people/timesheets': {
    answer:
      'Timesheets record hours worked per employee and per project for a week, then produce approved totals for client billing and utilisation review. For services businesses it is the link between effort and the invoice raised for that effort.',
    bestFor: ['Agencies billing by the hour', 'Teams reviewing utilisation'],
    steps: [
      { title: 'Log the week', body: 'Hours are entered against the project and the employee for each day.' },
      { title: 'Approve the totals', body: 'A manager reviews the week and confirms the billable hours.' },
      { title: 'Bill the work', body: 'Approved hours support the invoice for the same customer and project.' },
    ],
    links: ['workspace/projects', 'finance/invoices', 'people/employees'],
    faqs: [
      {
        question: 'Can hours be tracked per project?',
        answer:
          'Yes. Each timesheet entry links an employee, a project and a number of hours for a date, which is what makes project-level billing possible.',
      },
      {
        question: 'Are timesheets approved before billing?',
        answer:
          'Weekly totals are reviewed and approved before they are used, so a client invoice is based on confirmed effort rather than a draft entry.',
      },
    ],
  },

  'support/helpdesk': {
    answer:
      'Helpdesk ticketing turns every customer question into a ticket with a priority, an owner and a status, and keeps the conversation against the customer record. It replaces a shared inbox or a chat thread with a queue that shows what is still open.',
    bestFor: ['Businesses answering customer questions daily', 'Teams with no ticket history'],
    steps: [
      { title: 'Raise the ticket', body: 'The question is logged with its priority and the customer it belongs to.' },
      { title: 'Assign it', body: 'An agent takes the ticket and its status reflects progress.' },
      { title: 'Resolve it', body: 'The resolution is recorded, and a repeat question becomes a knowledge base article.' },
    ],
    links: ['support/knowledge-base', 'crm/contacts', 'ecommerce/orders'],
    faqs: [
      {
        question: 'What does a ticket record?',
        answer:
          'Priority, assigned agent, status and the customer it belongs to, plus the history of the issue. That is what makes an open queue measurable rather than a set of messages.',
      },
      {
        question: 'Can support see the customer\u2019s orders?',
        answer:
          'A ticket sits on the same customer record used by billing and orders, so an agent with the right role can see the account context without asking the customer again.',
      },
    ],
  },

  'support/knowledge-base': {
    answer:
      'A knowledge base publishes help articles organised by category with search, so a question asked twice can be answered with a link instead of a fresh reply. Articles live inside the workspace and can be shared directly by the support team.',
    bestFor: ['Businesses with repeating questions', 'Teams onboarding new support agents'],
    steps: [
      { title: 'Write the article', body: 'A recurring question is written up as a short, searchable answer.' },
      { title: 'File it', body: 'Articles are grouped in categories so related help sits together.' },
      { title: 'Share it', body: 'Support sends the article in place of a written reply.' },
    ],
    links: ['support/helpdesk', 'marketing/blog-content', 'workspace/compliance'],
    faqs: [
      {
        question: 'Is the knowledge base public?',
        answer:
          'Articles are written and organised inside the workspace for the support team and for sharing an answer directly. Publishing them on a public, indexable site is a separate decision rather than something that happens automatically.',
      },
      {
        question: 'Can articles be searched?',
        answer:
          'Yes. Articles are held in categories and searchable, so an agent finds an existing answer before writing a new one.',
      },
    ],
  },
};
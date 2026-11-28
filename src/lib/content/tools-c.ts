import type { ToolPageContent } from './types';

/**
 * Tool-level content for workspace, eCommerce, point of sale, operations and AI.
 * Keys are `suite/tool`.
 */
export const TOOL_CONTENT_C: Record<string, ToolPageContent> = {
  'workspace/projects': {
    answer:
      'Projects and tasks break work into assignable items with due dates and visible progress, all inside the same workspace that holds the invoice for the client. A project can therefore be reviewed next to the hours billed and the amount outstanding for it.',
    bestFor: ['Services teams delivering client work', 'Businesses tracking internal initiatives'],
    steps: [
      { title: 'Create the project', body: 'The engagement is opened with the client it belongs to.' },
      { title: 'Break it into tasks', body: 'Tasks carry an assignee, a due date and a status.' },
      { title: 'Track progress', body: 'Completion is visible per project and per person.' },
    ],
    links: ['people/timesheets', 'workspace/calendar', 'finance/invoices'],
    faqs: [
      {
        question: 'Can tasks be assigned to a teammate?',
        answer:
          'Yes. A task carries an assignee and a due date, so responsibility and timing are explicit rather than implied in a meeting.',
      },
      {
        question: 'Are projects connected to billing?',
        answer:
          'Projects sit in the same workspace as timesheets and invoices, so recorded hours can support the invoice raised for the same client and engagement.',
      },
    ],
  },

  'workspace/calendar': {
    answer:
      'The shared business calendar shows meetings, deadlines and events for the whole company in month and week views, so a delivery date, a payroll run and a compliance deadline can be seen on one surface. It is the planning view rather than a replacement for each person\u2019s email calendar.',
    bestFor: ['Teams coordinating deadlines', 'Managers planning the week'],
    steps: [
      { title: 'Add an event', body: 'A meeting, deadline or milestone is placed on the calendar with its date.' },
      { title: 'Share the view', body: 'The calendar is shared, so the whole team sees the same commitments.' },
      { title: 'Switch the view', body: 'Month and week layouts show the horizon or the detail.' },
    ],
    links: ['workspace/projects', 'workspace/compliance', 'crm/follow-ups'],
    faqs: [
      {
        question: 'Is the calendar shared across the team?',
        answer:
          'Yes. It is a business calendar rather than a personal one, so company deadlines and events are visible to the people who plan around them.',
      },
      {
        question: 'Are compliance deadlines on the calendar?',
        answer:
          'The compliance module tracks document expiry dates and shows upcoming renewals, which is the same planning surface an owner needs to avoid a lapse.',
      },
    ],
  },

  'workspace/team': {
    answer:
      'Team and roles controls who is in the company workspace and what each person can open, by inviting a teammate and assigning a role-based permission set. It is what keeps one department\u2019s records out of another\u2019s view without issuing a shared login.',
    bestFor: ['Businesses with several departments', 'Owners tightening access control'],
    steps: [
      { title: 'Invite the teammate', body: 'A person is invited into the company workspace by email.' },
      { title: 'Assign the role', body: 'The role decides which modules and records that person can open.' },
      { title: 'Review access', body: 'Permissions can be changed as responsibilities shift.' },
    ],
    links: ['workspace/approvals', 'people/employees', 'workspace/automations'],
    faqs: [
      {
        question: 'Can I restrict which modules a user sees?',
        answer:
          'Access follows the role assigned to the teammate, so a role can be given the modules that person needs rather than the whole workspace.',
      },
      {
        question: 'Does everyone share one login?',
        answer:
          'No. Each teammate is invited individually and given a role, which is what makes the access record and the action history meaningful.',
      },
    ],
  },

  'workspace/automations': {
    answer:
      'Workflow automations run a step when a trigger occurs and can act across modules, with a run history showing what executed. Routine internal work such as a reminder, an assignment or a status change therefore happens without anyone remembering to do it.',
    bestFor: ['Teams repeating the same manual steps', 'Businesses joining modules together'],
    steps: [
      { title: 'Pick the trigger', body: 'Choose the event that should start the automation.' },
      { title: 'Define the action', body: 'Set what happens and in which module it applies.' },
      { title: 'Review the runs', body: 'The run history shows what executed and when.' },
    ],
    links: ['workspace/approvals', 'accounting/recurring-invoices', 'workspace/reports'],
    faqs: [
      {
        question: 'Can an automation act in a different module?',
        answer:
          'Yes. Automations are described as cross-module, so a trigger in one area can produce an action in another, which is the point of running the modules on one workspace.',
      },
      {
        question: 'Can I see whether an automation ran?',
        answer:
          'A run history records executions, so a workflow that did not fire is visible rather than silently skipped.',
      },
    ],
  },

  'workspace/reports': {
    answer:
      'Business reports pull cross-module figures on sales, finance and operations into one place with charts and trends, so a review reads from live data. The report is exportable when a copy is needed for a lender, a board or an accountant.',
    bestFor: ['Owners reviewing the business weekly', 'Managers preparing a monthly pack'],
    steps: [
      { title: 'Choose the area', body: 'Select the module or cross-module view that answers the question.' },
      { title: 'Read the trend', body: 'Charts show direction across the selected period.' },
      { title: 'Export the view', body: 'A copy is produced for a meeting or an external party.' },
    ],
    links: ['accounting/profit-reports', 'point-of-sale/reports', 'ecommerce/analytics'],
    faqs: [
      {
        question: 'Do reports combine data from several modules?',
        answer:
          'Yes. Cross-module reporting reads sales, finance and operations records in one workspace, which is what allows one number to be explained rather than reconciled from four exports.',
      },
      {
        question: 'Can a report be exported?',
        answer:
          'Reports can be exported for sharing or record keeping, so the live view stays the source while a copy can leave the system when required.',
      },
    ],
  },

  'workspace/approvals': {
    answer:
      'Approvals route an expense, purchase or request to the person who must decide, then keep the decision and its history. It turns a verbal yes into a record, which is what makes a spend auditable later.',
    bestFor: ['Businesses with spending limits', 'Teams approving purchases remotely'],
    steps: [
      { title: 'Raise the request', body: 'The expense, purchase or request is submitted with its details.' },
      { title: 'Route it', body: 'The request goes to the approver who holds that decision.' },
      { title: 'Record the outcome', body: 'The decision and its audit trail stay with the request.' },
    ],
    links: ['finance/expenses', 'workspace/team', 'finance/purchase-orders'],
    faqs: [
      {
        question: 'What can be sent for approval?',
        answer:
          'Expenses, purchases and internal requests can be routed, which covers the recurring decisions a business wants recorded rather than agreed verbally.',
      },
      {
        question: 'Is there an audit trail?',
        answer:
          'Yes. The request keeps its routing and decision history, so who approved what and when can be answered from the record.',
      },
    ],
  },

  'workspace/compliance': {
    answer:
      'The compliance vault stores licences and statutory documents with expiry dates, and a compliance calendar shows what is due for renewal. It is a register of obligations with dates attached, which is what stops a lapsed licence being found by an inspector.',
    bestFor: ['Businesses with licences and renewals', 'Teams preparing for an audit'],
    steps: [
      { title: 'Upload the document', body: 'The licence or certificate is stored with its details.' },
      { title: 'Set the expiry', body: 'The renewal date is recorded on the document.' },
      { title: 'Watch the calendar', body: 'Upcoming expiries appear on the compliance calendar in advance.' },
    ],
    links: ['workspace/calendar', 'accounting/gst-reports', 'workspace/approvals'],
    faqs: [
      {
        question: 'What types of documents can be stored?',
        answer:
          'Licences and statutory documents with their dates, so the vault works as a register of the business\u2019s obligations rather than a general file store.',
      },
      {
        question: 'Will I be reminded before a document expires?',
        answer:
          'Expiry dates are held on each document and the compliance calendar surfaces upcoming renewals, so a lapse is visible in advance instead of after the fact.',
      },
    ],
  },

  'ecommerce/stores': {
    answer:
      'Online stores are storefronts connected to the AINOS product catalogue, so listings, prices and available stock come from the same records the rest of the business uses. A business can run more than one storefront on one account, each with its own settings.',
    bestFor: ['Retailers starting an online channel', 'Brands running a second storefront'],
    steps: [
      { title: 'Create the store', body: 'A storefront is set up and connected to the catalogue.' },
      { title: 'Configure it', body: 'Store settings control how the channel behaves.' },
      { title: 'Publish products', body: 'Listings read the shared product and stock records.' },
    ],
    links: ['ecommerce/products', 'ecommerce/orders', 'supply-chain/stock'],
    faqs: [
      {
        question: 'Can I run multiple online stores?',
        answer:
          'Yes. Multiple storefronts can be created under one account, each connected to the shared catalogue, which suits a brand site alongside a category or region-specific store.',
      },
      {
        question: 'Does the store use my existing products?',
        answer:
          'Listings are built from the product catalogue in the workspace, so an item does not need to be created twice to be sold online and at the counter.',
      },
    ],
  },

  'ecommerce/products': {
    answer:
      'Store products expose catalogue items online with prices, images and available stock, so the listing reflects the same item the warehouse and counter use. Editing a price updates the listing rather than a separate web catalogue.',
    bestFor: ['Stores with a changing catalogue', 'Businesses selling across channels'],
    steps: [
      { title: 'Choose the item', body: 'A catalogue product is published to the store.' },
      { title: 'Add listing detail', body: 'Images, description and price complete the listing.' },
      { title: 'Keep stock honest', body: 'Available quantity follows the stock record as orders are placed.' },
    ],
    links: ['finance/products', 'ecommerce/stores', 'supply-chain/stock'],
    faqs: [
      {
        question: 'Do online listings share stock with the shop?',
        answer:
          'Yes. Listings read the same stock records as counter billing, so an item sold in the shop is no longer available to promise online.',
      },
      {
        question: 'Can a listing have its own price?',
        answer:
          'The listing carries the price shown online, which is drawn from the product record and can be maintained there so a single update reaches the channel.',
      },
    ],
  },

  'ecommerce/orders': {
    answer:
      'The online order queue shows every store order with its payment status and fulfilment stage in one list. It is the operational surface for online selling: what has been paid for, what still needs to be packed and what has gone out.',
    bestFor: ['Stores shipping daily', 'Teams reconciling payments and dispatch'],
    steps: [
      { title: 'Receive the order', body: 'The order lands in the queue with the customer and payment status.' },
      { title: 'Fulfil it', body: 'The stage moves as the order is packed and dispatched.' },
      { title: 'Reconcile it', body: 'Paid and pending orders are distinguishable in the same view.' },
    ],
    links: ['ecommerce/stores', 'supply-chain/stock', 'finance/invoices'],
    faqs: [
      {
        question: 'Can I see payment status per order?',
        answer:
          'Yes. Each order carries its payment status alongside fulfilment, so an unpaid order is distinguishable from one ready to dispatch.',
      },
      {
        question: 'Does an online order reduce stock?',
        answer:
          'Orders draw from the same stock records as other channels, so the available quantity falls when the order is placed rather than after dispatch.',
      },
    ],
  },

  'ecommerce/customers': {
    answer:
      'Store customers show who is buying, what they ordered and how often they return, built from the order history rather than a separate mailing list. A repeat buyer is therefore visible as a fact rather than an assumption.',
    bestFor: ['Stores growing repeat purchase', 'Teams reviewing customer value'],
    steps: [
      { title: 'Order creates the record', body: 'A buyer\u2019s orders accumulate against one customer profile.' },
      { title: 'Review the history', body: 'Past orders and values are visible on the profile.' },
      { title: 'Spot the repeat buyer', body: 'Repeat purchase is visible from order frequency.' },
    ],
    links: ['ecommerce/orders', 'crm/contacts', 'marketing/email-campaigns'],
    faqs: [
      {
        question: 'How is a store customer different from a CRM contact?',
        answer:
          'The store profile is built from online orders and shows buying behaviour. CRM contacts cover prospects and accounts across sales. Both live in the same company workspace.',
      },
      {
        question: 'Can I see how often a customer returns?',
        answer:
          'Yes. Order history sits on the customer profile, so repeat purchase and average value are visible from the record.',
      },
    ],
  },

  'ecommerce/analytics': {
    answer:
      'Store analytics reports revenue, order volume and top products for the online channel, so growth decisions are made from the order data rather than a feeling about what is selling. It is the online counterpart of the counter sales report.',
    bestFor: ['Stores reviewing monthly performance', 'Teams deciding what to promote'],
    steps: [
      { title: 'Open the period', body: 'Select the window the report should cover.' },
      { title: 'Read revenue and volume', body: 'Trends show direction in value and in order count.' },
      { title: 'Check the top products', body: 'Best sellers identify what to stock and promote.' },
    ],
    links: ['ecommerce/orders', 'workspace/reports', 'point-of-sale/reports'],
    faqs: [
      {
        question: 'What does store analytics measure?',
        answer:
          'Revenue trend, order volume and top-selling products for the online channel, which is what a growth decision needs before stock is committed.',
      },
      {
        question: 'Is online revenue separate from other sales?',
        answer:
          'Analytics covers the online channel, while business-wide reporting reads across modules, so both a channel view and a company view are available.',
      },
    ],
  },

  'ecommerce/coupons': {
    answer:
      'Coupons create percentage or flat discounts with usage limits and expiry dates, so a promotion has defined terms instead of an open-ended code. The limits are what stop a campaign continuing after it was meant to end.',
    bestFor: ['Stores running seasonal offers', 'Businesses testing a discount'],
    steps: [
      { title: 'Create the code', body: 'A coupon is defined as a percentage or a flat amount.' },
      { title: 'Set the terms', body: 'Usage limits and an expiry date bound the promotion.' },
      { title: 'Apply it at checkout', body: 'The discount is taken within the terms set.' },
    ],
    links: ['ecommerce/orders', 'ecommerce/analytics', 'marketing/email-campaigns'],
    faqs: [
      {
        question: 'Can a coupon have a usage limit?',
        answer:
          'Yes. A coupon can carry a limit and an expiry date as well as its discount value, so the promotion stops on the terms it was created with.',
      },
      {
        question: 'Can discounts be a flat amount instead of a percentage?',
        answer:
          'Both forms are supported, which suits a percentage offer on a range and a flat amount on a single product.',
      },
    ],
  },

  'ecommerce/reviews': {
    answer:
      'Product reviews collect ratings and written feedback against a listing, with moderation before publication. The moderation step is what keeps the listing credible: approved feedback appears, unverified or abusive submissions do not.',
    bestFor: ['Stores building buyer trust', 'Teams moderating feedback'],
    steps: [
      { title: 'Collect the review', body: 'A rating and comment are submitted against the product.' },
      { title: 'Moderate it', body: 'The review is reviewed before it appears on the listing.' },
      { title: 'Publish it', body: 'Approved feedback shows against the product.' },
    ],
    links: ['ecommerce/products', 'support/helpdesk', 'ecommerce/analytics'],
    faqs: [
      {
        question: 'Are reviews published automatically?',
        answer:
          'No. Reviews go through moderation, so a listing shows approved feedback and an abusive or evidently fake submission can be held back.',
      },
      {
        question: 'Do reviews include ratings?',
        answer:
          'Yes. A review carries a rating alongside the comment, which is what makes product feedback comparable across a catalogue.',
      },
    ],
  },

  'point-of-sale/sessions': {
    answer:
      'POS sessions open a register for a shift and close it with a cash reconciliation, so every bill belongs to a shift and a drawer total. That is the mechanism that turns a month-end cash difference into a handover question the same day.',
    bestFor: ['Shops running two shifts', 'Owners reconciling cash daily'],
    steps: [
      { title: 'Open the session', body: 'The operator starts a register session for the shift.' },
      { title: 'Bill within it', body: 'Every counter sale in the shift belongs to that session.' },
      { title: 'Close and reconcile', body: 'The expected total is compared with the counted cash.' },
    ],
    links: ['point-of-sale/register', 'point-of-sale/reports', 'finance/invoices'],
    faqs: [
      {
        question: 'Why open a session instead of billing directly?',
        answer:
          'A session groups the takings for one shift, which is what makes a cash handover checkable. Without it there is only a day total and no way to attribute a difference.',
      },
      {
        question: 'What does closing a session record?',
        answer:
          'Closing records the shift total against the counted cash, so a shortfall or surplus is visible at handover rather than at month end.',
      },
    ],
  },

  'point-of-sale/register': {
    answer:
      'The POS register is a touch-friendly billing screen: search or scan a product, add it to the bill, apply its tax rate and take payment in the mode used. It is designed for a queue, so the steps between a customer reaching the counter and a printed bill are short.',
    bestFor: ['Retail counters and cafés', 'Busy shops with peak hours'],
    steps: [
      { title: 'Find the item', body: 'Quick search or a barcode brings the product up from the catalogue.' },
      { title: 'Build the bill', body: 'Items are added with the price and tax rate stored on each one.' },
      { title: 'Take payment', body: 'The payment mode is recorded and the bill completes within the session.' },
    ],
    links: ['point-of-sale/sessions', 'point-of-sale/products', 'supply-chain/stock'],
    faqs: [
      {
        question: 'Does the register apply GST to counter sales?',
        answer:
          'Each counter product carries its tax rate, and the bill applies it per item, so a counter sale follows the same tax treatment as an invoice for the same product.',
      },
      {
        question: 'Which payment modes can be recorded?',
        answer:
          'A bill records the mode it was taken in, which allows the session and daily report to separate cash, card and digital takings.',
      },
    ],
  },

  'point-of-sale/orders': {
    answer:
      'POS orders list every counter bill with its items, total and payment mode, so a query about a specific sale can be answered from the record. It is the transaction log behind the session and the daily report.',
    bestFor: ['Shops checking a past bill', 'Owners reviewing counter activity'],
    steps: [
      { title: 'Open the list', body: 'Counter orders are listed with their totals and modes.' },
      { title: 'Inspect a bill', body: 'The items and payment mode for that order are visible.' },
      { title: 'Match the shift', body: 'Each order belongs to the session it was billed in.' },
    ],
    links: ['point-of-sale/sessions', 'point-of-sale/reports', 'ecommerce/orders'],
    faqs: [
      {
        question: 'Can I look up an old counter bill?',
        answer:
          'Yes. Counter orders are retained with their items, totals and payment mode, so a past sale can be checked rather than guessed.',
      },
      {
        question: 'Are counter orders separate from online orders?',
        answer:
          'The POS order list covers counter sales, and online orders have their own queue, yet both draw from the same product and stock records.',
      },
    ],
  },

  'point-of-sale/products': {
    answer:
      'POS products are the counter catalogue: items or menu entries with prices, tax rates and categories, arranged so a cashier can find them quickly. They come from the same product master as invoicing and the online store.',
    bestFor: ['Cafés and restaurants with a menu', 'Shops with many small items'],
    steps: [
      { title: 'Add the item', body: 'Name, price and tax rate are set for the counter catalogue.' },
      { title: 'Group it', body: 'A category keeps a long list of items navigable.' },
      { title: 'Sell it', body: 'The item appears on the register with its stored price and tax.' },
    ],
    links: ['finance/products', 'point-of-sale/register', 'supply-chain/stock'],
    faqs: [
      {
        question: 'Can a restaurant menu be set up as products?',
        answer:
          'Yes. Menu entries can be created with prices and categories, which suits a food counter as well as a shelf of goods.',
      },
      {
        question: 'Are counter prices the same as invoice prices?',
        answer:
          'Both read the product master, so a price change can be made once. A channel-specific price can be maintained on the record where the business needs it.',
      },
    ],
  },

  'point-of-sale/reports': {
    answer:
      'POS reports show daily counter sales, best sellers and totals by payment mode, so the day can be closed with numbers rather than a cash box count alone. The report is built from the session and the orders within it.',
    bestFor: ['Shops closing the day', 'Owners comparing trading days'],
    steps: [
      { title: 'Pick the day', body: 'The report covers the trading date selected.' },
      { title: 'Read the totals', body: 'Sales and payment-mode totals are summarised.' },
      { title: 'Check best sellers', body: 'The items moving fastest are identified for restocking.' },
    ],
    links: ['point-of-sale/sessions', 'supply-chain/stock', 'workspace/reports'],
    faqs: [
      {
        question: 'Does the report split takings by payment mode?',
        answer:
          'Yes. Orders record their payment mode, so cash, card and digital takings are separable for the day and for the shift.',
      },
      {
        question: 'Can best sellers be used for restocking?',
        answer:
          'Best-seller reporting shows which items are moving, which is what a reorder decision should be based on rather than a shelf check alone.',
      },
    ],
  },

  'operations/field-service': {
    answer:
      'Field service schedules a job, assigns it to a technician and tracks it to completion, so the office knows what is outstanding and the technician knows what is next. Jobs sit against the customer record that also carries the invoice for the work.',
    bestFor: ['Service companies with technicians on site', 'Businesses dispatching installation work'],
    steps: [
      { title: 'Schedule the job', body: 'The visit is booked against the customer and the work required.' },
      { title: 'Assign the technician', body: 'A named person takes the job and can update its status on site.' },
      { title: 'Close the job', body: 'Completion is recorded and the charges can be billed.' },
    ],
    links: ['operations/maintenance', 'operations/repair', 'finance/invoices'],
    faqs: [
      {
        question: 'Can a technician update a job from the field?',
        answer:
          'The workspace is responsive and opens in a phone browser, so an assigned job can be reviewed and its status updated on site.',
      },
      {
        question: 'Can a completed job be invoiced?',
        answer:
          'Jobs sit against the customer record used for billing, so completed charges are available for the invoice for the same customer without re-entering the details.',
      },
    ],
  },

  'operations/maintenance': {
    answer:
      'Maintenance management keeps an equipment register with preventive schedules and the tasks raised against it, so servicing happens on a plan instead of after a breakdown. Every maintenance task is logged against the asset it concerns.',
    bestFor: ['Factories and facilities with machinery', 'Businesses with AMC obligations'],
    steps: [
      { title: 'Register the equipment', body: 'Each asset is recorded with its service requirements.' },
      { title: 'Set the schedule', body: 'A preventive plan defines when servicing is due.' },
      { title: 'Log the work', body: 'Each maintenance task is recorded against the asset.' },
    ],
    links: ['operations/field-service', 'operations/fleet', 'manufacturing/work-centers'],
    faqs: [
      {
        question: 'Can preventive maintenance be scheduled in advance?',
        answer:
          'Yes. Preventive schedules are held against the equipment register, so servicing is planned by date rather than by failure.',
      },
      {
        question: 'Is equipment history kept per asset?',
        answer:
          'Maintenance tasks are logged against the asset they concern, which builds a service history for that machine or unit.',
      },
    ],
  },

  'operations/fleet': {
    answer:
      'Fleet management keeps vehicle records with driver assignment, fuel entries and service logs, so running cost and maintenance per vehicle are traceable. It is a register with history rather than a live GPS tracker.',
    bestFor: ['Businesses running their own vehicles', 'Logistics and service fleets'],
    steps: [
      { title: 'Add the vehicle', body: 'Registration and details are recorded against the unit.' },
      { title: 'Assign a driver', body: 'Responsibility for the vehicle is recorded per person.' },
      { title: 'Log fuel and service', body: 'Fuel entries and service work accumulate on the vehicle record.' },
    ],
    links: ['operations/maintenance', 'finance/expenses', 'people/employees'],
    faqs: [
      {
        question: 'Does AINOS fleet management track GPS location?',
        answer:
          'No. It records the vehicle, its driver, fuel and service history so cost and maintenance are traceable. Live GPS tracking is a separate telematics function.',
      },
      {
        question: 'Can fuel and service cost be reviewed per vehicle?',
        answer:
          'Fuel entries and service logs are recorded against the vehicle, so its running cost builds up on one record.',
      },
    ],
  },

  'operations/quality': {
    answer:
      'Quality control runs inspections and records pass or fail results with corrective actions against the process or production being checked. The record is what makes a recurring defect visible instead of being described as bad luck each time.',
    bestFor: ['Manufacturers with inspection steps', 'Service businesses with checklists'],
    steps: [
      { title: 'Run the inspection', body: 'The check is carried out against the item or process in question.' },
      { title: 'Record the result', body: 'Pass or fail is logged with the finding.' },
      { title: 'Add the action', body: 'A corrective action is recorded against the failure.' },
    ],
    links: ['manufacturing/quality-and-scrap', 'operations/maintenance', 'workspace/reports'],
    faqs: [
      {
        question: 'What is recorded on an inspection?',
        answer:
          'The result of the check and the corrective action taken, recorded against the item or production it relates to so a pattern can be seen later.',
      },
      {
        question: 'Can quality records feed a review?',
        answer:
          'Inspection outcomes are stored against the work they belong to, so recurring failures become a report rather than a memory of complaints.',
      },
    ],
  },

  'operations/repair': {
    answer:
      'Repair orders follow a unit from intake to delivery, recording the parts used and the charges applied. It suits a workshop or service counter where the customer needs to know what was done and what it cost.',
    bestFor: ['Repair workshops', 'Businesses servicing sold equipment'],
    steps: [
      { title: 'Take the job in', body: 'The unit is logged at intake against the customer.' },
      { title: 'Record parts and charges', body: 'Parts used and labour are added to the order.' },
      { title: 'Deliver it', body: 'The order is closed on delivery with its status recorded.' },
    ],
    links: ['operations/field-service', 'supply-chain/stock', 'finance/invoices'],
    faqs: [
      {
        question: 'Can parts used in a repair be recorded?',
        answer:
          'Yes. Parts and charges are attached to the repair order, which is what makes the final bill traceable to the work done.',
      },
      {
        question: 'Can a repair be billed through AINOS invoicing?',
        answer:
          'The repair order sits against the customer who receives the invoice, so the charges recorded on the job support the bill for the same customer.',
      },
    ],
  },

  'operations/rental': {
    answer:
      'Rental management books an asset out for a period, records its return and applies the rental charges. Equipment that leaves the premises is therefore accounted for by booking rather than by memory.',
    bestFor: ['Equipment rental businesses', 'Businesses hiring out assets internally'],
    steps: [
      { title: 'Book the rental', body: 'The asset and the booking dates are recorded against the customer.' },
      { title: 'Hand it over', body: 'The unit is out with the booking period in view.' },
      { title: 'Record the return', body: 'Return closes the booking and the charges are applied.' },
    ],
    links: ['operations/fleet', 'finance/invoices', 'supply-chain/stock'],
    faqs: [
      {
        question: 'Can rental periods be tracked per asset?',
        answer:
          'A booking holds the asset and its dates, so what is out, with whom and until when is recorded rather than assumed.',
      },
      {
        question: 'Are rental charges billed separately?',
        answer:
          'Rental charges are recorded on the booking and support the invoice raised for that customer, so hire revenue is traceable to the asset that earned it.',
      },
    ],
  },

  'ai-studio/ai-assistant': {
    answer:
      'The AI business assistant answers questions about the records in the workspace, such as invoice totals, customer history and stock position, from inside the same screen where the work happens. It is grounded in the business\u2019s own data rather than a general chatbot.',
    bestFor: ['Owners who want a quick answer mid-task', 'Teams without analyst support'],
    steps: [
      { title: 'Ask the question', body: 'A question is typed in natural language about the business.' },
      { title: 'Read the answer', body: 'The reply is built from the records held in the workspace.' },
      { title: 'Keep the history', body: 'Previous questions stay in the conversation for reference.' },
    ],
    links: ['ai-studio/invoice-extractor', 'ai-studio/lead-scoring', 'workspace/reports'],
    faqs: [
      {
        question: 'What data does the assistant answer from?',
        answer:
          'It works from the records already in the workspace, so questions about invoices, customers and stock return answers about this company rather than general guidance.',
      },
      {
        question: 'Does the assistant change my records?',
        answer:
          'The assistant answers questions. Changes remain deliberate actions taken by a person on the corresponding screen, so an answer cannot silently rewrite a document.',
      },
    ],
  },

  'ai-studio/ai-content-writer': {
    answer:
      'The AI content writer produces marketing copy, product descriptions and article drafts from a brief, in a stored brand tone. Output arrives as an editable draft, so the business reviews and edits before anything is published.',
    bestFor: ['Businesses writing product copy', 'Teams producing regular marketing content'],
    steps: [
      { title: 'Give the brief', body: 'The topic, format and audience are described in a short instruction.' },
      { title: 'Generate the draft', body: 'Copy is produced in the brand tone set for the workspace.' },
      { title: 'Edit and use', body: 'The draft is revised and then used in a campaign or listing.' },
    ],
    links: ['marketing/blog-content', 'marketing/social-media', 'ecommerce/products'],
    faqs: [
      {
        question: 'Can the writer follow a brand tone?',
        answer:
          'A brand tone is stored and used as the instruction for generation, so output reflects the business voice instead of a generic marketing register.',
      },
      {
        question: 'Is the output ready to publish?',
        answer:
          'It is a draft. Review and editing are part of the workflow, and publishing is a separate action, so the business owns the final copy. AI usage consumes plan credits.',
      },
    ],
  },

  'ai-studio/invoice-extractor': {
    answer:
      'The invoice extractor reads an uploaded invoice image or PDF with AI vision and returns the vendor, GSTIN, line items, tax and totals as structured fields for review. It removes manual keying from the purchase side of the books.',
    bestFor: ['Accounts teams processing supplier invoices', 'Businesses with high invoice volume'],
    steps: [
      { title: 'Upload the document', body: 'A photo, scan or PDF of the invoice is submitted.' },
      { title: 'Review the fields', body: 'Extracted vendor, GSTIN, items and totals are shown for correction.' },
      { title: 'Save the entry', body: 'Accepted data becomes the purchase record it belongs to.' },
    ],
    links: ['finance/expenses', 'supply-chain/vendors', 'accounting/daybook'],
    faqs: [
      {
        question: 'Which documents can be extracted?',
        answer:
          'Invoice images and PDFs are read with AI vision, and the extracted vendor, GSTIN, line items and totals are presented for review before anything is saved.',
      },
      {
        question: 'What happens if the extraction is wrong?',
        answer:
          'Every extracted field is editable on screen, so a misread value is corrected before the record is saved rather than after the books have moved.',
      },
    ],
  },

  'ai-studio/lead-scoring': {
    answer:
      'AI lead scoring ranks prospects by fit and engagement so the sales team calls the most promising ones first, and it states the reason behind a score. The ranking is a recommendation that a salesperson reviews, not an automatic decision about a customer.',
    bestFor: ['Sales teams with long lead lists', 'Businesses unsure which enquiry matters'],
    steps: [
      { title: 'Score the list', body: 'Leads are evaluated and ranked by fit and engagement signals.' },
      { title: 'Read the reason', body: 'The score explains why a lead ranks where it does.' },
      { title: 'Call in order', body: 'The team works the ranked list rather than the newest enquiry.' },
    ],
    links: ['crm/leads', 'crm/deals', 'crm/follow-ups'],
    faqs: [
      {
        question: 'How is a lead score produced?',
        answer:
          'The score reflects fit and engagement signals held on the lead, and the reason behind a score is shown so a salesperson can judge it rather than accept it blindly.',
      },
      {
        question: 'Does a low score remove a lead?',
        answer:
          'No. Scoring ranks the list for prioritisation. The lead remains in CRM with its record intact, and the salesperson decides what to do with it.',
      },
    ],
  },

  'ai-studio/ai-media-studio': {
    answer:
      'The AI media studio generates marketing images from a text prompt or a reference image, with style presets, so a campaign visual can be produced without a design tool. Generated visuals are downloaded and used in the channels the business already posts to.',
    bestFor: ['Businesses needing regular creatives', 'Teams without a designer'],
    steps: [
      { title: 'Describe the visual', body: 'A prompt or a reference image sets the subject and style.' },
      { title: 'Generate options', body: 'Images are produced against the chosen preset.' },
      { title: 'Download and use', body: 'The selected visual is exported for a campaign or listing.' },
    ],
    links: ['marketing/social-media', 'marketing/invitations', 'ecommerce/products'],
    faqs: [
      {
        question: 'Can a reference image guide the result?',
        answer:
          'Yes. An image can be supplied as a reference alongside the prompt, which helps keep a series of creatives visually consistent.',
      },
      {
        question: 'Where can generated images be used?',
        answer:
          'Generated visuals are downloaded and used in the channels the business already publishes to, such as social posts, campaign email and product listings. Review the image before it goes out. AI usage consumes plan credits.',
      },
    ],
  },

  'ai-studio/lip-sync-studio': {
    answer:
      'The lip sync studio turns a script or an audio file into a talking-head video with synchronised lip movement, aimed at short marketing and explainer clips. The finished video is downloaded and published on the usual channels.',
    bestFor: ['Businesses producing short video ads', 'Teams explaining a product on camera'],
    steps: [
      { title: 'Provide the input', body: 'A script or an audio recording defines what is said.' },
      { title: 'Generate the video', body: 'Lip movement is synchronised to the audio with the chosen face.' },
      { title: 'Download it', body: 'The finished clip is exported for publishing.' },
    ],
    links: ['ai-studio/ai-media-studio', 'marketing/social-media', 'ai-studio/ai-content-writer'],
    faqs: [
      {
        question: 'What input does lip sync need?',
        answer:
          'Either a written script or an audio file, together with the face the video should show, and the output is a short talking-head clip.',
      },
      {
        question: 'Can the video be used on social media?',
        answer:
          'The finished clip is downloaded for publishing on the channels the business uses, and a caption can be generated in the social media tool. AI usage consumes plan credits.',
      },
    ],
  },
};
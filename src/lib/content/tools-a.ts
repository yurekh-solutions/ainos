import type { ToolPageContent } from './types';

/**
 * Tool-level content for the finance, accounting, CRM and marketing suites.
 * Keys are `suite/tool` because slugs such as `products` and `customers`
 * repeat across suites.
 */
export const TOOL_CONTENT_A: Record<string, ToolPageContent> = {
  'finance/invoices': {
    answer:
      'The AINOS invoice screen creates GST-compliant tax invoices with a sequential number, HSN or SAC codes per line, and an automatic CGST, SGST or IGST split based on the place of supply. Each invoice can be downloaded as a branded PDF, and its payment status feeds receivables, reminders and GST reports.',
    bestFor: ['Accounts teams raising invoices daily', 'Businesses billing in more than one state'],
    steps: [
      { title: 'Pick the customer', body: 'An existing customer brings its GSTIN, billing address and state along with it.' },
      { title: 'Add the lines', body: 'Items pull their HSN code, unit price and tax rate from the product catalogue.' },
      { title: 'Save and share', body: 'The invoice is numbered, the tax split is applied and the PDF is ready to send.' },
    ],
    links: ['finance/quotations', 'accounting/gst-reports', 'finance/payment-reminders'],
    faqs: [
      {
        question: 'How is CGST, SGST and IGST decided on an AINOS invoice?',
        answer:
          'The tax treatment follows the place of supply compared with the company state. A sale inside the state splits into CGST and SGST, and an interstate sale is charged as IGST, applied per line from the tax rate stored on the item.',
      },
      {
        question: 'Can invoice numbering match my financial year?',
        answer:
          'Invoice numbers are generated sequentially and the series can be configured, so the same prefix pattern your accountant expects carries through every document raised in the workspace.',
      },
    ],
  },

  'finance/customers': {
    answer:
      'The customer ledger holds every buyer with GSTIN, billing address, contact details and a running list of their invoices and outstanding balance. Because the same record is used by quotations, delivery challans, CRM contacts and support tickets, a customer is entered once and referenced everywhere.',
    bestFor: ['Businesses with repeat B2B buyers', 'Accounts teams checking outstanding balances'],
    steps: [
      { title: 'Create the record', body: 'Name, GSTIN, state and address are stored once, with the tax treatment that follows from them.' },
      { title: 'Use it everywhere', body: 'Every quote, invoice, challan and ticket links back to the same customer record.' },
      { title: 'Review the balance', body: 'Invoice history and outstanding value are visible on the customer instead of being recomputed.' },
    ],
    links: ['finance/invoices', 'crm/contacts', 'finance/payment-reminders'],
    faqs: [
      {
        question: 'Does the customer record store a GSTIN?',
        answer:
          'Yes. A customer record can hold its GSTIN, state and billing address, which is what allows the invoice to choose intra-state or inter-state tax treatment without anyone re-checking it.',
      },
      {
        question: 'Can I export the customer list?',
        answer:
          'Customer records can be exported in spreadsheet format, and existing customer, product and ledger data can be imported from Tally or Excel when the workspace is first set up.',
      },
    ],
  },

  'finance/expenses': {
    answer:
      'Expense tracking records each business cost with its category, date, amount and GST input details, and keeps the receipt attached to the entry. Recorded expenses feed the profit and loss report and the purchase side of the return summary, so month-end does not depend on a folder of bills.',
    bestFor: ['Owners reviewing spend by category', 'Businesses claiming input tax credit'],
    steps: [
      { title: 'Log the spend', body: 'Date, vendor, category, amount and tax are entered, with the receipt attached.' },
      { title: 'Categorise it', body: 'A consistent category is what makes the monthly summary readable later.' },
      { title: 'Review the month', body: 'Category totals and the profit report read directly from what has been recorded.' },
    ],
    links: ['accounting/profit-reports', 'accounting/credit-notes', 'workspace/approvals'],
    faqs: [
      {
        question: 'Can I attach the bill to an expense entry?',
        answer:
          'Yes. A receipt or bill file can be attached to the recorded expense, which keeps the supporting document beside the amount rather than in a separate folder.',
      },
      {
        question: 'Do expenses appear in the profit report?',
        answer:
          'Yes. The profit and loss report compares revenue recorded on invoices with expenses recorded in this module for the selected period.',
      },
    ],
  },

  'finance/payment-reminders': {
    answer:
      'Pending payment reminders list every unpaid and partially paid invoice with its due date and ageing, and send a follow-up email to the customer from the same record. The list is the collection queue: an invoice leaves it only when the payment is recorded against it.',
    bestFor: ['Businesses chasing receivables over 30 days', 'Accounts teams with no formal collection process'],
    steps: [
      { title: 'See what is due', body: 'Overdue and upcoming invoices are grouped by how long they have been outstanding.' },
      { title: 'Send the reminder', body: 'A follow-up email goes out referencing the invoice and the amount outstanding.' },
      { title: 'Mark it collected', body: 'Recording the payment moves the invoice out of the overdue list and updates the balance.' },
    ],
    links: ['finance/invoices', 'accounting/profit-reports', 'marketing/email-campaigns'],
    faqs: [
      {
        question: 'How does AINOS decide which invoices are overdue?',
        answer:
          'An invoice becomes overdue when its due date has passed and the recorded payment does not cover the total. Partially paid invoices show the amount still outstanding rather than the full value.',
      },
      {
        question: 'Are reminders sent automatically?',
        answer:
          'Reminders are sent from the pending payments screen against the invoice it refers to, so each follow-up is a deliberate action and the customer sees the exact document in question.',
      },
    ],
  },

  'finance/business-card-scanner': {
    answer:
      'The business card scanner reads a photographed card with AI vision, extracts the name, phone number, email and company, and fills a contact form that can be saved as a record. It removes the step of typing a card into the CRM after a meeting or an exhibition.',
    bestFor: ['Sales teams at expos and networking events', 'Field teams collecting supplier details'],
    steps: [
      { title: 'Photograph the card', body: 'A phone camera photo or an uploaded image works as the input.' },
      { title: 'Review the fields', body: 'Extracted name, phone, email and company are shown for correction before saving.' },
      { title: 'Save the contact', body: 'The confirmed card becomes a saved contact in the workspace.' },
    ],
    links: ['crm/contacts', 'crm/leads', 'ai-studio/invoice-extractor'],
    faqs: [
      {
        question: 'How accurate is card scanning?',
        answer:
          'The AI reads the visible text on the card and fills the matching fields, then presents them for review. Unusual layouts or low light can produce a misread character, which is why the extracted fields are editable before the contact is saved.',
      },
      {
        question: 'Can scanned contacts become CRM leads?',
        answer:
          'Yes. Once a card is saved as a contact in the workspace, that record is available to the CRM lead and deal screens rather than being isolated in a scanner app.',
      },
    ],
  },

  'finance/products': {
    answer:
      'The product and service catalogue stores each item with its selling price, HSN or SAC code, unit and tax rate, so an invoice, quotation or challan line fills itself correctly. It is the same catalogue used by inventory, the online store and counter billing, which is why a price changes in one place.',
    bestFor: ['Businesses with a long price list', 'Traders mixing goods and services'],
    steps: [
      { title: 'Add the item', body: 'Name, price, HSN or SAC code, unit and applicable tax rate are stored on the record.' },
      { title: 'Reuse on documents', body: 'Selecting the item on an invoice brings its code, price and tax with it.' },
      { title: 'Update once', body: 'A revised price is saved on the item and appears on the next document raised.' },
    ],
    links: ['finance/invoices', 'supply-chain/stock', 'point-of-sale/products'],
    faqs: [
      {
        question: 'What is the difference between HSN and SAC?',
        answer:
          'HSN codes classify goods and SAC codes classify services for GST. A product record stores whichever applies to the item, so the invoice line carries the correct classification for filing.',
      },
      {
        question: 'Can a product hold more than one tax rate?',
        answer:
          'Each product stores its own tax rate, and the invoice applies it per line, so a catalogue can mix exempt, 5%, 12% and 18% items on the same bill.',
      },
    ],
  },

  'finance/quotations': {
    answer:
      'Quotations are issued as branded PDFs with line items, validity dates and a status, and an accepted quote converts into a GST invoice with the same customer, quantities and prices. The conversion is what stops a quoted rate from being retyped incorrectly on the final bill.',
    bestFor: ['Service firms quoting before billing', 'Sales teams tracking open estimates'],
    steps: [
      { title: 'Build the quote', body: 'Lines come from the product catalogue with their tax treatment already set.' },
      { title: 'Send and track', body: 'The quote carries a validity date and a status that moves as the customer responds.' },
      { title: 'Convert on acceptance', body: 'One action turns the accepted quote into an invoice with identical lines.' },
    ],
    links: ['finance/invoices', 'crm/deals', 'finance/delivery-challans'],
    faqs: [
      {
        question: 'Does converting a quotation create a new invoice number?',
        answer:
          'Yes. The invoice receives its own sequential number from the configured series, while its customer, items, quantities and prices are copied from the accepted quotation.',
      },
      {
        question: 'Can a quotation have a validity date?',
        answer:
          'Yes. A validity date is stored on the quotation, which makes the offered price and terms explicit to the customer and to the team reviewing open estimates.',
      },
    ],
  },

  'finance/purchase-orders': {
    answer:
      'Purchase orders are raised to vendors with the items, quantities and agreed prices, then tracked from draft through receipt so the business knows what has been ordered and what has arrived. Received orders tie purchasing to the same vendor and product records used by inventory and expenses.',
    bestFor: ['Businesses buying against a budget', 'Teams tracking part-delivered orders'],
    steps: [
      { title: 'Raise the order', body: 'The vendor, items and quantities are recorded with the agreed price per line.' },
      { title: 'Send to the vendor', body: 'The order is exported as a document the supplier can work from.' },
      { title: 'Track receipt', body: 'Received quantities are updated against the order so open balances stay visible.' },
    ],
    links: ['supply-chain/purchase-orders', 'supply-chain/vendors', 'finance/expenses'],
    faqs: [
      {
        question: 'Can I track a partially received purchase order?',
        answer:
          'Yes. Received quantities are recorded against each order, so the balance still outstanding is visible instead of the order being marked complete on the first delivery.',
      },
      {
        question: 'Is this the same purchase order as the inventory one?',
        answer:
          'The finance screen raises orders in the purchasing flow, and inventory has its own purchase order view for stock. Both read the vendor and product records in the same workspace, so the supplier is never duplicated.',
      },
    ],
  },

  'finance/delivery-challans': {
    answer:
      'Delivery challans document goods that leave the premises without an accompanying sale invoice, with sequential numbering, item and quantity details, barcode support and a printable PDF. It is the document a transporter or godown signs, and it stays linked to the customer it was issued to.',
    bestFor: ['Businesses dispatching goods before billing', 'Warehouses handing material to a transporter'],
    steps: [
      { title: 'Create the challan', body: 'Customer, items and quantities are recorded against a numbered challan.' },
      { title: 'Print or scan', body: 'The PDF carries barcodes for the dispatch so the godown can check it in.' },
      { title: 'Follow with the invoice', body: 'The challan relates to the same customer record as the invoice raised later.' },
    ],
    links: ['finance/invoices', 'supply-chain/stock', 'finance/products'],
    faqs: [
      {
        question: 'When should a delivery challan be used?',
        answer:
          'A challan is used when goods move before the invoice is raised, for example a job-work dispatch or a delivery against an order not yet billed. It records what left and who received it without creating a tax invoice.',
      },
      {
        question: 'Does a challan carry a GSTIN and tax amount?',
        answer:
          'A challan is a movement document rather than a tax invoice. It records the parties, items and quantities, and the tax treatment is applied when the corresponding invoice is raised.',
      },
    ],
  },

  'finance/tally-export': {
    answer:
      'Tally and Excel export takes invoices, customers and ledger entries over a chosen date range and produces files that a Tally-based accountant can import, or a spreadsheet for review. It is the bridge that lets the team bill in AINOS while the accountant keeps working in the software they know.',
    bestFor: ['Businesses with an external accountant on Tally', 'Owners who need a spreadsheet audit trail'],
    steps: [
      { title: 'Choose the period', body: 'A date range selects the transactions that will leave the workspace.' },
      { title: 'Map the ledgers', body: 'Ledger names are matched so the export files into the right heads on the other side.' },
      { title: 'Export and import', body: 'The generated file is imported into Tally or opened in Excel for review.' },
    ],
    links: ['accounting/daybook', 'accounting/profit-reports', 'finance/invoices'],
    faqs: [
      {
        question: 'Does the export replace my accountant?',
        answer:
          'No. It gives your accountant clean, dated ledger data in a format their software can read, so review and filing continue in Tally while the transaction record stays in AINOS.',
      },
      {
        question: 'Can I export only one month?',
        answer:
          'Yes. Exports are scoped by date range, so a single month, a quarter or a financial year can be produced without exporting everything.',
      },
    ],
  },

  'finance/invoice-design': {
    answer:
      'Invoice templates control how a document looks: layout, logo, accent colour, terms and footer notes, with a live preview before it is used. A branded template applies to the PDFs the business sends, so every invoice, quotation and challan carries the same identity.',
    bestFor: ['Businesses with a designed brand identity', 'Firms needing terms on every document'],
    steps: [
      { title: 'Pick a layout', body: 'Start from the available invoice layouts and choose the structure that suits the trade.' },
      { title: 'Apply the brand', body: 'Logo, colour and typography are set so the document matches the rest of the business.' },
      { title: 'Add the terms', body: 'Payment terms, notes and signature details are stored on the template and appear on new documents.' },
    ],
    links: ['finance/invoices', 'finance/products', 'workspace/team'],
    faqs: [
      {
        question: 'Does a template change invoices already issued?',
        answer:
          'No. A template applies to documents generated after it is saved, so previously issued invoices keep the appearance they were sent with.',
      },
      {
        question: 'Can documents include payment terms and a signature?',
        answer:
          'Yes. Terms, notes and signature details can be stored on the template, so the issued PDF states the payment expectations and who authorised the document.',
      },
    ],
  },

  'accounting/daybook': {
    answer:
      'The day book is a chronological register of the day\u2019s sales, purchases and expenses with running totals and a date filter, drawn from the transactions already recorded rather than re-entered. It is the quickest way to answer what happened in the business today and to trace a figure back to its document.',
    bestFor: ['Accounts teams closing the day', 'Owners reviewing daily activity'],
    steps: [
      { title: 'Open the date', body: 'Select the day and the register lists every transaction in order.' },
      { title: 'Check the totals', body: 'Sales, purchase and expense totals are summarised for that date.' },
      { title: 'Drill into the entry', body: 'Each line traces back to the invoice, purchase or expense it came from.' },
    ],
    links: ['finance/invoices', 'finance/expenses', 'accounting/profit-reports'],
    faqs: [
      {
        question: 'Is the day book entered separately?',
        answer:
          'No. It is generated from the invoices, purchases and expenses recorded in the workspace, which is why it cannot disagree with the underlying documents.',
      },
      {
        question: 'Can I view an earlier date?',
        answer:
          'Yes. A date filter moves the register to any day in the recorded history, and the entries for that date are listed with their totals.',
      },
    ],
  },

  'accounting/profit-reports': {
    answer:
      'The profit and loss report compares revenue recorded on invoices with expenses recorded in the workspace for a selected period, and shows the trend between periods. It gives an owner a current profit view without exporting anything, and the same figures can be exported when a copy is needed.',
    bestFor: ['Owners reviewing performance monthly', 'Businesses preparing statements for a lender'],
    steps: [
      { title: 'Choose the period', body: 'A month, quarter or financial year sets the window for both sides of the report.' },
      { title: 'Read revenue and cost', body: 'Invoice revenue and recorded expenses are compared with the resulting margin.' },
      { title: 'Compare and export', body: 'Period comparison shows direction, and the report can be exported for a file.' },
    ],
    links: ['finance/expenses', 'accounting/daybook', 'workspace/reports'],
    faqs: [
      {
        question: 'What counts as revenue in this report?',
        answer:
          'Revenue is taken from invoices raised in the selected period, with credit notes reducing it, so the figure reflects billed value rather than cash received.',
      },
      {
        question: 'Does the report include payroll cost?',
        answer:
          'Payroll cost appears when those amounts are recorded as expenses in the period. Businesses that post payroll to the books each month see a complete profit picture rather than a partial one.',
      },
    ],
  },

  'accounting/gst-reports': {
    answer:
      'GST reports build GSTR-1 and GSTR-3B-ready summaries from the invoices and purchase records already in the workspace, with a B2B and B2C split and tax grouped by rate. The output is a filing pack for a Chartered Accountant or for the business to upload, not a filing service.',
    bestFor: ['Businesses filing monthly or quarterly', 'Accountants preparing a return pack'],
    steps: [
      { title: 'Select the return period', body: 'The month or quarter decides which invoices and purchases are included.' },
      { title: 'Review the split', body: 'B2B and B2C totals and tax by rate are checked against the period\u2019s documents.' },
      { title: 'Export the pack', body: 'The summary and supporting detail are exported for filing or for the accountant.' },
    ],
    links: ['finance/invoices', 'accounting/credit-notes', 'finance/tally-export'],
    faqs: [
      {
        question: 'Does AINOS upload the return to the GST portal?',
        answer:
          'No. AINOS prepares the summary, the tax split and the supporting detail. The return itself is filed on the government portal by the business or by its Chartered Accountant.',
      },
      {
        question: 'Are credit notes reflected in the GST summary?',
        answer:
          'Yes, when they are issued against an invoice. A credit note adjusts the reported value and tax for that document, so the return figures match what the customer actually owes.',
      },
    ],
  },

  'accounting/recurring-invoices': {
    answer:
      'Recurring invoices raise themselves on a weekly, monthly or yearly schedule between a start and end date, which is how retainers, subscriptions and maintenance contracts get billed without a reminder. A schedule can be paused or edited without disturbing the invoices it has already produced.',
    bestFor: ['Agencies billing retainers', 'Businesses with subscription or AMC revenue'],
    steps: [
      { title: 'Create the schedule', body: 'Template lines, frequency and the start date define what the customer is billed.' },
      { title: 'Let it run', body: 'Each due date generates an invoice with the normal numbering and tax treatment.' },
      { title: 'Pause or change', body: 'Editing or pausing the schedule affects future runs, not the invoices already issued.' },
    ],
    links: ['finance/invoices', 'accounting/gst-reports', 'finance/payment-reminders'],
    faqs: [
      {
        question: 'Can a recurring invoice be paused?',
        answer:
          'Yes. A schedule can be paused and resumed, or edited to change its amount and lines, and the change applies to future runs while earlier invoices stay as issued.',
      },
      {
        question: 'Do recurring invoices get normal invoice numbers?',
        answer:
          'Yes. Each generated invoice follows the configured numbering series, so the GST sequence stays continuous across manual and scheduled invoices.',
      },
    ],
  },

  'accounting/bank-accounts': {
    answer:
      'Bank accounts store each business account with its number, IFSC code and opening balance, so the right account appears on invoices and the account list is available where payments are referenced. Keeping them in the workspace stops the details being copied from an old invoice.',
    bestFor: ['Businesses with several bank accounts', 'Firms printing payment details on invoices'],
    steps: [
      { title: 'Add the account', body: 'Account name, number, IFSC and opening balance are stored on the record.' },
      { title: 'Attach it to documents', body: 'The template can carry the account details a customer should pay into.' },
      { title: 'Keep it current', body: 'Updating the account once changes what appears on new documents.' },
    ],
    links: ['finance/invoice-design', 'finance/payment-reminders', 'accounting/daybook'],
    faqs: [
      {
        question: 'Can I store more than one bank account?',
        answer:
          'Yes. Several accounts can be held in the workspace with their own numbers, IFSC codes and opening balances, which suits a current account alongside a collection account.',
      },
      {
        question: 'Do the bank details appear on the invoice?',
        answer:
          'The invoice template controls what is printed, and the stored account details can be included so the customer sees how to pay on the document itself.',
      },
    ],
  },

  'accounting/credit-notes': {
    answer:
      'GST credit notes record a sales return, a post-invoice discount or a correction, are issued against the original invoice and carry the same tax treatment, so the adjustment appears in turnover and in the return summary. The original document is never edited, which keeps the audit trail intact.',
    bestFor: ['Businesses handling returns', 'Accounts teams correcting an issued invoice'],
    steps: [
      { title: 'Reference the invoice', body: 'The credit note is issued against the document it adjusts.' },
      { title: 'State the reason and value', body: 'Returned quantity or discount value is recorded with its GST effect.' },
      { title: 'Let it flow', body: 'The adjustment reduces reported revenue and tax for the period.' },
    ],
    links: ['finance/invoices', 'accounting/gst-reports', 'accounting/debit-notes'],
    faqs: [
      {
        question: 'Should I edit the invoice or issue a credit note?',
        answer:
          'Once an invoice has been issued, a credit note is the correct correction because it preserves the original document and records the adjustment separately, which is what a GST audit expects to see.',
      },
      {
        question: 'Does a credit note reduce GST liability?',
        answer:
          'The credit note reduces the reported value and tax for the period it belongs to, and the GST summary reflects that adjustment when the return pack is generated.',
      },
    ],
  },

  'accounting/debit-notes': {
    answer:
      'GST debit notes record a purchase return, a rate correction from a vendor or an additional charge where a supplier has under-billed, and keep the adjustment tied to the vendor and the original document. They complete the pair with credit notes so both sides of an adjustment are recorded.',
    bestFor: ['Businesses returning goods to suppliers', 'Accounts teams correcting vendor bills'],
    steps: [
      { title: 'Identify the vendor document', body: 'The note references the purchase it corrects.' },
      { title: 'Record the adjustment', body: 'Quantity, value and tax effect are entered with the reason.' },
      { title: 'Update the books', body: 'Input tax and purchase value reflect the correction for the period.' },
    ],
    links: ['accounting/credit-notes', 'finance/expenses', 'supply-chain/vendors'],
    faqs: [
      {
        question: 'When is a debit note used instead of a credit note?',
        answer:
          'A credit note is issued by the seller to reduce what a buyer owes. A debit note records the buyer side adjustment or an additional charge from a vendor, so both are kept for a complete paper trail.',
      },
      {
        question: 'Are debit notes linked to a vendor record?',
        answer:
          'Yes. The note is raised against the vendor and the purchase it relates to, so the supplier history and the adjustment stay together.',
      },
    ],
  },

  'crm/leads': {
    answer:
      'Lead management captures every enquiry with its source, contact details and status, then assigns an owner so a new enquiry has a name against it. Qualified leads move forward into the deals pipeline, and the source field is what shows which channel is actually producing business.',
    bestFor: ['Sales teams with more enquiries than people', 'Owners measuring which channel works'],
    steps: [
      { title: 'Capture the enquiry', body: 'Name, contact and source are recorded the moment the enquiry arrives.' },
      { title: 'Qualify and assign', body: 'Status records how serious it is and an owner takes responsibility for it.' },
      { title: 'Move it to a deal', body: 'A qualified lead becomes a deal with a value and an expected close date.' },
    ],
    links: ['crm/deals', 'crm/follow-ups', 'ai-studio/lead-scoring'],
    faqs: [
      {
        question: 'Can I track where a lead came from?',
        answer:
          'Yes. Each lead stores its source alongside contact details, so over a period the business can see which channel produced the enquiries that became deals.',
      },
      {
        question: 'How are leads prioritised?',
        answer:
          'Leads are filtered by status and owner, and on AI-enabled plans lead scoring ranks them by fit and engagement with the reason for the score attached.',
      },
    ],
  },

  'crm/deals': {
    answer:
      'The deals pipeline shows every open opportunity as a card in a stage, with its value and expected close date, so a sales review is a look at the board rather than a set of verbal updates. A won deal carries the customer forward into quotation and invoicing.',
    bestFor: ['Sales teams with a multi-step sale', 'Managers forecasting the quarter'],
    steps: [
      { title: 'Open the deal', body: 'The opportunity is linked to the customer and given an estimated value.' },
      { title: 'Move the stage', body: 'Each stage reflects where the conversation actually stands.' },
      { title: 'Mark the outcome', body: 'A won deal moves to quotation; a lost deal keeps its reason on record.' },
    ],
    links: ['crm/leads', 'finance/quotations', 'crm/follow-ups'],
    faqs: [
      {
        question: 'Can I see the total value of open deals?',
        answer:
          'Yes. Each deal carries its value and stage, so the pipeline can be reviewed by stage and by owner instead of relying on an estimate in a meeting.',
      },
      {
        question: 'What happens to a won deal?',
        answer:
          'The customer record it belongs to continues into quotation and invoicing, so the value agreed in the deal is the value quoted and then billed.',
      },
    ],
  },

  'crm/contacts': {
    answer:
      'Contacts hold every customer and prospect with company, phone, email and activity history in one list, and they are the same records that billing, support and marketing read. A contact entered once is not recreated in a second tool under a slightly different spelling.',
    bestFor: ['Businesses with overlapping sales and support', 'Teams importing an existing contact list'],
    steps: [
      { title: 'Add or import', body: 'Contacts are created individually or brought in from an existing list.' },
      { title: 'Link the company', body: 'A contact belongs to the company record that carries the billing details.' },
      { title: 'See the history', body: 'Activity, deals and documents for that contact stay together.' },
    ],
    links: ['finance/customers', 'crm/leads', 'support/helpdesk'],
    faqs: [
      {
        question: 'Are CRM contacts the same as finance customers?',
        answer:
          'They live in the same company workspace and reference the same parties, so a customer quoted by sales is the record that appears on the invoice and in the receivables list.',
      },
      {
        question: 'Can I import my existing contacts?',
        answer:
          'Yes. Customer and contact data can be imported from spreadsheet or Tally formats when the workspace is set up, so an existing list does not have to be rebuilt by hand.',
      },
    ],
  },

  'crm/follow-ups': {
    answer:
      'Follow-ups schedule a call, meeting or reminder against a lead or a deal, then list what is due and what has been missed. It is the mechanism that stops a warm opportunity going cold simply because nobody wrote the next step down.',
    bestFor: ['Sales teams juggling many conversations', 'Owners doing their own selling'],
    steps: [
      { title: 'Schedule the next step', body: 'A date and a note are attached to the lead or deal it concerns.' },
      { title: 'Work the due list', body: 'The due and overdue views show what needs attention today.' },
      { title: 'Close the loop', body: 'Completion is recorded, so the history shows the conversation moved.' },
    ],
    links: ['crm/leads', 'crm/deals', 'workspace/calendar'],
    faqs: [
      {
        question: 'Where do overdue follow-ups appear?',
        answer:
          'Follow-ups keep their scheduled date, and anything past that date is visible as overdue so the list of cold opportunities is explicit rather than assumed.',
      },
      {
        question: 'Can a follow-up be linked to a specific deal?',
        answer:
          'Yes. A follow-up can be attached to a lead or a deal, so the reminder carries the context of what is being discussed and with whom.',
      },
    ],
  },

  'marketing/email-campaigns': {
    answer:
      'Email campaigns take a subject, body and audience list, schedule the send and record its status, so marketing sends from the same workspace that holds the contacts. Because the audience is a contact list rather than a separate export, the campaign can be tied back to real customers.',
    bestFor: ['Businesses sending offers and updates', 'Teams running monthly newsletters'],
    steps: [
      { title: 'Choose the audience', body: 'The campaign targets a contact list held in the workspace.' },
      { title: 'Compose the message', body: 'Subject and body are written, with delivery handled by the configured email provider.' },
      { title: 'Schedule and check', body: 'The send is scheduled or issued, and its status is tracked per campaign.' },
    ],
    links: ['crm/contacts', 'marketing/blog-content', 'finance/payment-reminders'],
    faqs: [
      {
        question: 'Which provider delivers AINOS campaigns?',
        answer:
          'Campaigns are delivered through the transactional email provider configured for the workspace, which also carries account and system email, so there is one sending identity rather than several.',
      },
      {
        question: 'Can I see whether a campaign was sent?',
        answer:
          'Yes. Each campaign keeps a status, so a scheduled send, a completed send and a failure are distinguishable instead of assumed.',
      },
    ],
  },

  'marketing/social-media': {
    answer:
      'AI social post generation produces captions, hooks and hashtags for Instagram, LinkedIn, Facebook, X and other platforms from a short brief or an uploaded image, written against a stored brand tone. The output is an editable draft that can be posted or adjusted rather than a fixed template.',
    bestFor: ['Businesses posting weekly without a copywriter', 'Teams keeping a consistent brand voice'],
    steps: [
      { title: 'Describe the post', body: 'A topic, product or uploaded image gives the generator its brief.' },
      { title: 'Generate options', body: 'Captions, hooks and hashtags are produced in the brand tone for the chosen platform.' },
      { title: 'Edit and publish', body: 'The draft is adjusted by a person and then posted from the marketing screen.' },
    ],
    links: ['marketing/blog-content', 'ai-studio/ai-media-studio', 'marketing/email-campaigns'],
    faqs: [
      {
        question: 'Which platforms are supported?',
        answer:
          'Captions can be generated for Instagram, LinkedIn, Facebook, X and similar channels, and the output length and hashtag style adjust to the platform selected.',
      },
      {
        question: 'Can I give the AI my brand voice?',
        answer:
          'Yes. A brand tone is stored and used as the instruction for generation, so captions read like the business rather than a generic template. AI usage consumes plan credits.',
      },
    ],
  },

  'marketing/seo-platform': {
    answer:
      'The SEO platform audits a submitted website for technical issues, researches keywords with their demand, compares the site against competitors and turns the gaps into content ideas. It is the front half of the marketing loop: find the query, plan the article, publish it, then measure again.',
    bestFor: ['Businesses publishing content without a plan', 'Agencies running SEO for clients'],
    steps: [
      { title: 'Audit the site', body: 'A URL is submitted and the technical findings are returned for review.' },
      { title: 'Research the terms', body: 'Keywords and competitor comparison show which queries are worth targeting.' },
      { title: 'Turn gaps into drafts', body: 'Content ideas become articles that the AI blog writer can draft.' },
    ],
    links: ['marketing/blog-content', 'marketing/email-campaigns', 'crm/leads'],
    faqs: [
      {
        question: 'Can the audit run on any website?',
        answer:
          'Yes. The audit takes a submitted URL and reports on that site, so it can review your own domain or a competitor domain you want to understand.',
      },
      {
        question: 'Does the SEO module publish articles itself?',
        answer:
          'No. It produces findings, keywords and content ideas. Writing and publishing happen in the blog tools, where an editor reviews the draft before it goes live. SEO actions consume plan credits.',
      },
    ],
  },

  'marketing/blog-content': {
    answer:
      'The AI blog writer produces long-form drafts with a title, meta description and structure aimed at a chosen keyword, then schedules or publishes them to a connected website. The draft is editable, and publishing is a separate reviewed step, so the business remains the author of record.',
    bestFor: ['Businesses publishing a regular blog', 'Teams wanting a content calendar without a writer'],
    steps: [
      { title: 'Set the topic', body: 'A keyword or topic sets the angle and the structure of the draft.' },
      { title: 'Review the draft', body: 'Title, meta description, headings and body are edited before publishing.' },
      { title: 'Schedule or publish', body: 'Articles publish on a date, and the sitemap reflects live posts.' },
    ],
    links: ['marketing/seo-platform', 'marketing/social-media', 'marketing/email-campaigns'],
    faqs: [
      {
        question: 'Does AINOS publish to my site automatically?',
        answer:
          'Articles publish when a person schedules or approves them. A connected website receives the post, and the public blog index, RSS feed and sitemap reflect only what has been published.',
      },
      {
        question: 'Are blog posts search-optimised?',
        answer:
          'Each draft carries a title, meta description and heading structure aimed at a target query, which is the technical groundwork. Ranking still depends on the site, competition and links, so the draft is a starting point that is reviewed before publishing.',
      },
    ],
  },

  'marketing/invitations': {
    answer:
      'Invitation templates give a business branded festival, event and occasion creatives: choose a design, replace the text and logo, then download or share the result. It is aimed at the seasonal greeting a business sends customers without opening a design tool.',
    bestFor: ['Businesses sending festival greetings', 'Teams needing on-brand event invites quickly'],
    steps: [
      { title: 'Choose a design', body: 'Pick from the festival, event and occasion templates in the library.' },
      { title: 'Apply the brand', body: 'Logo, message and colours are replaced with the business identity.' },
      { title: 'Download or share', body: 'The finished creative is exported or posted to social channels.' },
    ],
    links: ['marketing/social-media', 'ai-studio/ai-media-studio', 'crm/contacts'],
    faqs: [
      {
        question: 'Can I put my logo on a template?',
        answer:
          'Yes. A template can be customised with the business logo, text and colours, so the greeting carries the brand rather than the stock design.',
      },
      {
        question: 'Can the creative be shared on social media?',
        answer:
          'The completed design can be downloaded for use elsewhere or shared to social channels, and a caption can be generated in the social media tool.',
      },
    ],
  },
};
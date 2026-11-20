// Batch 2 of AINOS public blog guides: money, stock, people and reach.
// Idempotent: a post whose slug already exists is skipped, so it is safe to re-run.
// Usage: node seed-ainos-guides-batch2.cjs   (run from the ainos/ folder)
const fs = require('fs');
const path = require('path');

const envText = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const grab = (k) => {
  const m = envText.match(new RegExp('^' + k + '="?(.+?)"?\\s*$', 'm'));
  return m ? m[1] : '';
};
process.env.DATABASE_URL = grab('DATABASE_URL');
const PEXELS_KEY = grab('PEXELS_API_KEY');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Picks the result whose caption actually matches the query, so a guide never gets
// an off-topic picture (a seeded random draw once handed back a European VAT form
// for an Indian GST invoice guide).
async function pexelsImage(query) {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=8&orientation=landscape&locale=en-US`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const photos = data.photos || [];
    if (!photos.length) return null;
    const words = query.toLowerCase().split(/\s+/);
    const scored = photos
      .map((p, i) => {
        const alt = (p.alt || '').toLowerCase();
        const hits = words.filter((w) => w.length > 3 && alt.includes(w)).length;
        return { p, score: hits * 10 - i };
      })
      .sort((a, b) => b.score - a.score);
    const best = scored[0].score > 0 ? scored[0].p : photos[0];
    return best.src.large || best.src.landscape || null;
  } catch { return null; }
}

const GUIDES = [
  {
    title: 'e-Invoicing in India: Who Must Generate an IRN and How It Works',
    slug: 'e-invoicing-irn-india-who-must-generate',
    category: 'GST & Billing',
    tags: ['e-invoicing', 'irn', 'nic', 'gst invoice', 'e-way bill'],
    pexels: 'invoice stamp official document office',
    excerpt:
      'An e-invoice is not a new kind of bill - it is your existing GST invoice registered with the government, which returns an IRN and a QR code. Here is who must do it, what fails, and how to stop rejecting invoices at the NIC.',
    content: `# e-Invoicing in India: Who Must Generate an IRN and How It Works

Every few months a customer asks us for an "e-invoice", and every few months someone sends them a PDF emailed from billing software. Those are not the same thing.

An e-invoice is a B2B tax invoice whose details are reported to the National Informatics Centre (NIC) in a fixed JSON schema. NIC validates it, returns an Invoice Reference Number (IRN) and a signed QR code, and only then is the invoice legally complete. The seller's GST invoice and the e-invoice are one document - the difference is that the government has seen it before the buyer did.

The threshold has come down in phases and today covers businesses above ₹5 crore aggregate turnover in the notifications that apply to them. Confirm the current notification for your turnover band before you assume you are outside it - penalties for a missed e-invoice are the same as for not issuing an invoice at all.

## What actually happens when you "convert" an invoice

1. Your billing system builds the invoice and maps its fields to the NIC schema (Party 1, Party 2, item lines, tax breakup, transport details).
2. The JSON is signed and posted to the NIC Invoice Registration Portal (IRP).
3. NIC validates the payload, generates the IRN (a hash of supplier GSTIN, range, date and total invoice value) and returns the IRN plus a QR code containing the hash, GSTINs, invoice date, value and tax details.
4. You print the QR on the invoice. The buyer scans it and sees exactly what NIC received.
5. The invoice data auto-populates in Table 6 of your GSTR-1. You no longer file B2B lines separately.

Because the IRN is a hash of those four inputs, changing the invoice value or date after registration means cancelling and reissuing - not editing.

## The five rejections that eat most of the time

- **GSTIN format errors.** 15 characters, checksum in the last one. A typo in the buyer GSTIN is rejected, and a manually typed buyer name is not.
- **Invalid or missing place of supply.** State code must be a real code, and it must agree with IGST versus CGST/SGST.
- **Negative or rounded totals that do not add up.** Line value, tax and grand total must reconcile to the paise the schema expects.
- **Duplicate invoice numbers.** The same number in the same financial year for the same GSTIN is rejected once it is already registered.
- **Date logic.** Invoice date in the future, or a supply date outside the period, fails validation.

Build a pre-submit validation pass in your own software and most rejections never reach NIC.

## Cancel, e-way bill and the 24-hour clock

Cancellation on the IRP needs a reason and, for the first day, essentially no questions; later cancellations attract more scrutiny. An e-invoice also carries the details the e-way bill needs, so a rejected e-invoice blocks movement of the goods on many setups.

Time the whole flow to your dispatch: an e-invoice generated after the truck has left is a compliance problem, not a paperwork problem.

## How AINOS handles it

AINOS Finance & Billing keeps the NIC field mapping already done for you - GSTIN validation, HSN/SAC, tax breakup, state codes - and registers the invoice at the click of a button, printing the IRN and QR on the same document your accountant files. Rejections show the exact field that failed, so a correction takes seconds rather than a phone call to your software vendor.

## FAQ

### Is an e-invoice the same as sending a PDF by email or WhatsApp?

No. Emailing a PDF is delivery. An e-invoice is a B2B invoice reported to NIC, which returns an IRN and QR code that must appear on the document.

### Do B2C (retail) invoices need an IRN?

The mandate is on the notified B2B class of invoices and, in later phases, certain export documents. Ordinary retail bills to consumers are outside it for most businesses.

### Is the IRN printed on the invoice enough proof?

The QR must carry the signed hash so the buyer can verify it. Keep the JSON response from the IRP with the invoice record - that is your evidence if a claim is questioned.

## The bottom line

e-Invoicing is a data-quality rule disguised as a compliance rule. Get GSTINs, state codes, HSNs and totals right, and the IRN comes back first try. Get them wrong, and your dispatch waits on a portal error.`,
  },
  {
    title: 'GSTR-2B Short of Your Books: Fix the Input Tax Credit Mismatch',
    slug: 'gstr-2b-input-tax-credit-mismatch-fix',
    category: 'GST & Billing',
    tags: ['gstr-2b', 'input tax credit', 'itc mismatch', 'gst reconciliation', 'gstr-3b'],
    pexels: 'accountant spreadsheet audit laptop desk',
    excerpt:
      'Your purchase register says you are owed more credit than GSTR-2B shows. The gap is not a portal bug - it is supplier behaviour, timing and a few fields. Here is how to find it and close it.',
    content: `# GSTR-2B Short of Your Books: Fix the Input Tax Credit Mismatch

GSTR-2B is auto-drafted, on the 14th of each month, from what your suppliers filed. It is the only statement the department is willing to treat as evidence for the credit you take in GSTR-3B. So when your purchase register shows ₹1,40,000 of eligible credit and 2B shows ₹1,10,000, the ₹30,000 is not an argument you can have later - it is cash you cannot use now.

## Reconcile in this order

1. **Split the gap by supplier**, not by invoice. Nine times out of ten, two or three vendors account for most of it.
2. **Tag each missing invoice**: not filed by supplier, filed in the wrong period, filed with your GSTIN misspelled, filed but showing different values, or a debit/credit note that never appeared.
3. **Match amounts to the paise**, including cess. A ₹2 rounding difference still shows as a mismatch.
4. **Check the eligibility list** - blocked credits under section 17(5) are not a mismatch, and chasing a supplier for them wastes a relationship.

## The four causes worth knowing by name

- **Supplier not filed.** They may be monthly, quarterly (QRMP) or simply irregular. Their filing is your credit.
- **Period mismatch.** A bill dated the 29th and filed by the supplier a month later lands in next month's 2B.
- **Wrong GSTIN or name in their invoice.** It is filed against somebody else's ledger and you will never see it.
- **Value mismatch.** The supplier filed a different taxable value, or split one invoice into two lines with a different tax rate.

## Claim window: the rule that turns a mismatch into a loss

Credit for a financial year must be claimed by the statutory cut-off (in practice, 30 November following the end of that year, subject to the amendment in force for your year). An invoice that appears in 2B after your September filing can still be taken in that return, but a bill you never reconcile is gone permanently. That is why reconciliation is a monthly habit and not a year-end project.

## Stop the gap from coming back

- Put GSTIN, invoice number, date and value validation in the purchase entry screen; most errors are typed, not portal-side.
- Send every supplier a monthly statement of what you received from them versus what appears in your 2B. Suppliers respond to a two-column list, not to a request to "please check".
- Keep an ITC-gap register with the amount, supplier, reason and follow-up date. It becomes your single most useful tax document at year end.

## How AINOS helps

AINOS Finance & Billing records purchases against the supplier's GSTIN, flags entry values that will not reconcile, exports the purchase register in the shape 2B expects and keeps the gap register per supplier so the follow-up is a list of names and amounts, not a hunt.

## FAQ

### Can I take credit on an invoice that is in my books but not in GSTR-2B?

Not without risk. Rule 86B restricts the excess beyond 2B in most cases, so plan around what 2B actually shows.

### Is GSTR-2B editable after it is generated?

It is static once generated. Later supplier filings appear in the next month's statement, which is why you reconcile the 2B of every month rather than revisiting an old one.

### What about credit notes issued to me?

They reduce your credit and must be reflected by the supplier. A missing credit note makes your 2B look better than it is - check for them in the same pass.

## The bottom line

Reconcile by supplier, tag each gap with a reason, and put a date on the follow-up. ITC that is not lost is worth more than ITC you hope to recover.`,
  },
  {
    title: 'Invoice to Cash: Collect Payment Faster Without Chasing Clients',
    slug: 'invoice-to-cash-collect-payments-faster',
    category: 'Finance & Billing',
    tags: ['accounts receivable', 'dso', 'payment terms', 'collections', 'msme samadhaan'],
    pexels: 'payment invoice laptop desk business',
    excerpt:
      'Most small businesses are not profit-short, they are cash-short: 30-day terms turn into 62 days. Here is the sequence that shortens the gap without a single awkward phone call.',
    content: `# Invoice to Cash: Collect Payment Faster Without Chasing Clients

A ₹12 lakh order paid in 70 days is worse for your business than a ₹9 lakh order paid in 20. Profit shows up in the invoice; cash shows up in the bank, and the distance between the two is where small businesses run out of money.

Days Sales Outstanding (DSO) is the number to watch: outstanding receivables divided by revenue, multiplied by the days in the period. Compute it once and write it down; every fix below is judged by whether that number moves.

## The four things that actually delay payment

1. **The invoice reaches the wrong person.** A bill sent to info@ is a bill with no owner.
2. **It fails their internal check.** Missing GSTIN, no PO reference, wrong address, no bank details - so it goes back into the queue.
3. **There is no due date the buyer is accountable to.** "30 days" written nowhere is a suggestion.
4. **Nobody follows up on a schedule.** Follow-up that depends on remembering is follow-up that does not happen.

Notice what is not on the list: the customer being "bad". Most late payment is process friction on your side.

## Fix the document before you fix the person

- Put the due date, not just the invoice date, on the face of the invoice.
- Name the approver and the PO number on the invoice, since that is what their system looks for.
- Give one unambiguous payment route: UPI ID, bank account with IFSC, and a payment link if you can accept one.
- Send the invoice within 24 hours of supply. Late paperwork is the first excuse for late money.
- State late-payment interest on the invoice terms. Very few buyers pay it; many more stop treating a due date as optional.

## A follow-up cadence that does not need willpower

| Timing | What goes out |
|---|---|
| Day 0 | Invoice with due date and payment details |
| Due date minus 3 days | Polite "anything pending from our side?" note |
| Due date + 1 | Reminder with the copy of the invoice attached |
| Due date + 7 | Call, and a written request for the payment date commitment |
| Due date + 21 | Escalate to their finance controller; stop fresh supply if agreed terms are being ignored |

Every message goes out on a date, not when you feel like it. That single change typically pulls DSO down by a week or more.

## If your buyer is registered under MSME Samadhaan

Eligible micro and small suppliers can file for delayed payment on the Samadhaan portal within 45 days from the day the payment became due. Registered buyers are obliged to pay interest at three times the bank rate for delayed payment. Filing is a documented escalation, not a threat - the acceptance rate of well-argued cases makes it worth the ten minutes.

## Two habits that keep the money flowing

- **Credit-check the terms, not the order.** Give 60 days to a large, reliable buyer because the volume justifies it; give new buyers advance or milestone payment.
- **Run a weekly 30-minute ageing review**: current, 1-30 days past due, 31-60, 61-90, over 90. Money in the last two columns gets a named owner and a date.

## How AINOS helps

AINOS raises the invoice with the due date and payment details already printed, sends it to the contact you named as approver, runs the reminder cadence automatically, tracks ageing by bucket on the dashboard and reconciles payments against invoices so nothing sits "partially paid" for three months.

## FAQ

### What is a healthy DSO for a small Indian business?

Close to your stated terms plus one billing cycle. If you sell at 30 days and DSO is 34, you are fine. If DSO is 70, the problem is process, not the economy.

### Should I offer a discount for early payment?

Only if cash is genuinely scarce and the discount is smaller than the cost of the gap. 1-2% for payment in 10 days is common; model it before you promise it.

### Does WhatsApp follow-up work better than email?

For reminders, usually yes - but keep the invoice and the due date in writing so the record is unambiguous.

## The bottom line

Print the due date, send to a named approver, follow up on a schedule and review ageing weekly. Cash collection is a system, not a personality trait.`,
  },
  {
    title: 'Inventory Management for Small Businesses: Reorder Points and Dead Stock',
    slug: 'inventory-management-small-business-india-reorder-dead-stock',
    category: 'Inventory & Stock',
    tags: ['inventory management', 'reorder point', 'safety stock', 'dead stock', 'abc analysis'],
    pexels: 'warehouse shelves stock boxes inventory',
    excerpt:
      'Stock-outs cost the sale and dead stock costs the cash. Both come from the same missing number: a reorder point per item. Here is how to compute it, run ABC on your SKUs and clear what will not sell.',
    content: `# Inventory Management for Small Businesses: Reorder Points and Dead Stock

A small business usually has the opposite of two problems at the same time: the item everyone asks for is out of stock, and the item nobody asks for is filling the godown. Both are solved by the same discipline - a number per item for when to reorder, and a review that catches stock which stopped moving.

## Reorder point: the only formula you need

Reorder point = **average daily sales × lead time in days, plus safety stock**

Safety stock absorbs the two things that break the first half: demand spikes and late suppliers. A practical starting value is the sales of the lead-time days multiplied by your usual percentage forecast error, capped by what the item is worth.

Worked example: you sell 20 units a day, the supplier takes 7 days, and you keep 3 days as buffer. Reorder point = 20 × 7 + 20 × 3 = **200 units**. When stock hits 200, the purchase order goes out - not when it hits zero.

## Run ABC before you buy anything extra

Sort SKUs by annual value consumed, not by quantity:

- **A items** - roughly 20% of SKUs carrying 70-80% of the value. Count them often, set reorder points carefully, never let them run out.
- **B items** - the next 15% or so of SKUs. Review monthly.
- **C items** - the long tail. Simple min/max, or stop stocking them and order against confirmed demand.

The classic mistake is equal attention everywhere. Your slowest-moving 40% of SKUs is where the trapped cash is.

## Dead stock: how to spot it early

An item is dead stock when it has had no movement for longer than its normal cycle - 90 days for fast-moving goods, 180-365 for slow movers. Build the list monthly and act on it with a ladder:

1. Bundle it with an A item that does sell.
2. Discount it once, clearly, to a defined buyer list.
3. Return it to the supplier if your terms allow.
4. Liquidate. Cash in the bank at 40% of cost beats inventory at 100% of cost that will never move.

Carrying cost is real: storage, insurance, breakage, obsolescence and the fact that the money could have been buying what does sell. Rule of thumb: 20-30% of an item's value per year.

## Five habits that keep the numbers honest

- **One unit of measure per item.** "Box", "piece" and "kg" in the same register is where accuracy goes to die.
- **Count the A items every month**, everything else on a cycle. A full annual stock-taking is too late to fix anything.
- **Record every movement the day it happens** - sale, transfer, wastage, sample, return. Stock accuracy is a data-entry habit.
- **Put goods-received notes against purchase orders**; unexplained quantity differences belong to the supplier conversation, not to your inventory.
- **Kill negative stock immediately.** It is not a rounding issue, it is a missing entry.

## How AINOS helps

AINOS Inventory keeps live stock across warehouses and counters, updates on every invoice and purchase, flags items that fall under their reorder point, separates fast and non-moving lines, and produces the dead-stock and ABC lists as a report instead of a weekend spreadsheet exercise.

## FAQ

### How much safety stock is enough?

Enough to cover your lead time variance and your demand variance. Start with 3-5 days of sales for A items, then adjust to the stock-outs you actually experienced.

### Should I reorder on a fixed day each week?

Fixed-day ordering is easier to run and less accurate than reorder-point triggering. Use fixed days for C items, reorder points for A items.

### My stock and my ledger never match. Where do I start?

Start with the A items and the movement log: negative stock, unposted sales and unit mixing explain most of the gap.

## The bottom line

A reorder point per item, an ABC review of where the value sits, and a monthly dead-stock ladder. Those three turn inventory from a pile of cash into a working asset.`,
  },
  {
    title: 'Salary Compliance for a 20-Person Team: PF, ESI, PT and TDS',
    slug: 'pf-esi-pt-tds-salary-compliance-india-sme',
    category: 'HR & Payroll',
    tags: ['payroll', 'epf', 'esi', 'professional tax', 'tds on salary', 'statutory compliance'],
    pexels: 'payroll payslip hr office paperwork',
    excerpt:
      'Four deductions, four portals, four due dates - and one contractor mistake that turns into personal liability. The plain-language map of Indian payroll compliance once your team crosses ten people.',
    content: `# Salary Compliance for a 20-Person Team: PF, ESI, PT and TDS

Payroll stops being an Excel job at roughly the tenth employee. Not because the arithmetic gets hard, but because four different statutes now want a return, a payment and a challan on four different dates - and each one has its own definition of "employee".

Here is the map, in the order a payroll month actually happens.

## Provident Fund (EPF)

- Applicability: establishments with **20 or more employees** are covered; some states notified the threshold lower for certain industries.
- Contribution: **12% of basic pay plus dearness allowance**, from the employee and 12% from the employer (employer's 12% splits between EPF and the pension scheme EPS, which caps at the notified wage ceiling).
- EDLI and charges: small employer-side amounts on top; filing and payment are monthly, with a due date in the following month.
- What goes wrong: computing 12% on "gross" instead of basic, or on basic plus allowances that are not DA. Both create a demand you cannot argue with.
- Universal Account Number (UAN) hygiene: joining employees must give you the UAN, and KYC (Aadhaar, bank, PAN) must be seeded, or withdrawals stall and the employee escalates to EPFO about your company.

## Employee State Insurance (ESI)

- Applicability: employees earning up to the notified monthly wage ceiling (₹21,500; higher for persons with disability), again triggered at a minimum employee count.
- Contribution: employer and employee percentages of gross wages, paid monthly by the due date.
- What goes wrong: excluding overtime or allowances from wages when the definition includes them, and continuing contributions after an employee crosses the ceiling without documenting the reason.
- ESIC also drives maternity benefit and sickness absence records - so the attendance data and the payroll data must agree.

## Professional Tax (PT)

State-specific slabs, state-specific due dates, and in some states an employer registration even if the employer has a single office. Maharashtra and Karnataka, for instance, differ in both slab and filing rhythm. Deduct it per employee, remit it on the state's schedule, and keep the registration certificate in your compliance file.

## TDS on Salary (Section 192)

From FY 2023-24 onwards the new tax regime is the default, and the rebate introduced subsequently makes salary income up to the notified limit carry nil tax for most employees who opt out of old-regime deductions. In practice this means:

1. Collect each employee's regime choice in writing at the start of the year.
2. Get investment declarations only if they chose the old regime.
3. Compute monthly TDS on the projected annual salary, not on the current month.
4. Deposit by the monthly due date and issue Form 16 by the statutory date.

The commonest error is not the calculation, it is a mid-year change (bonus, promotion, arrears) that was never folded into the remaining months' TDS, producing a surprise demand for the employee in July.

## The payroll month, in order

| Step | What happens | Typical timing |
|---|---|---|
| 1 | Attendance and leave closed | 25th-28th |
| 2 | Gross computed, then deductions (PF, ESI, PT, TDS) | 1st-5th |
| 3 | Net paid to bank | agreed pay date |
| 4 | Statutory payments and returns filed | each statute's due date |
| 5 | Payslips issued with deduction breakup | same day as payment |

Step 5 is not courtesy. A payslip that shows basic, PF, ESI, PT and tax is your evidence if an employee later claims deductions were wrong.

## How AINOS helps

AINOS HR & Payroll keeps employee records with statutory details, computes PF, ESI, PT and TDS on the right wage definitions, produces payslips per employee, and lists the filing month with challan references so nothing depends on one person's memory.

## FAQ

### Do contractual and freelance staff go through the same payroll?

No, and mixing them is expensive. Salaried employees attract PF, ESI and Section 192; contractors attract TDS under a different section and, if they are engaged through a contractor, possible principal-employer PF duties. Keep the engagement type on record.

### An employee earns above the PF wage ceiling - can we still contribute?

Yes, by mutual consent, with the employer's duty to obtain the joint declaration. What you cannot do is silently drop the mandatory part.

### Who is liable if a return is missed?

The employer, and in continuing defaults specific officers of the company. That is why the filing calendar belongs in a system, not a person's head.

## The bottom line

Fix the wage definitions, collect regime choices once a year, pay on the statute's date and issue the payslip. Compliance is not a project; it is fifteen repeatable minutes a month.`,
  },
  {
    title: 'WhatsApp Business API for Indian SMBs: Orders, Reminders and Payments',
    slug: 'whatsapp-business-api-india-smb-guide',
    category: 'AI & Automation',
    tags: ['whatsapp business api', 'customer messaging', 'automation', 'broadcast', 'utility templates'],
    pexels: 'whatsapp phone business chat customer support',
    excerpt:
      'WhatsApp is where Indian customers actually reply. The API is what turns that into order confirmations, payment reminders and support that runs without a person copying and pasting.',
    content: `# WhatsApp Business API for Indian SMBs: Orders, Reminders and Payments

The free WhatsApp Business app is a good shopfront: a profile, a catalogue, quick replies, a label per order. It runs out at exactly the point where a business becomes real - when the messages are too many for one phone, when two staff need the same thread, and when you want a message sent because something happened in your system rather than because someone remembered.

That is the job of the WhatsApp Business API.

## What changes when you move to the API

- **Multiple users, one number.** Staff or agents work on shared threads with a history, not a personal phone.
- **Programmed messages.** Order confirmed, shipped, invoice due, payment received, subscription renewing - triggered by your data.
- **Template messages.** Pre-approved messages that can open a conversation with a customer, in two useful flavours: utility (transactional, tied to an order) and marketing (promotional).
- **Interactive buttons and lists**, so the customer taps "Pay now" or "Yes, reschedule" instead of typing.
- **Opt-in and window rules.** Meta requires customer opt-in to message them, and a service conversation window governs free-form replies; outside it you use templates. Read the current policy rather than a blog post for the exact numbers and pricing - utility templates are billed well below marketing ones, which is why the mix matters.

## The five messages worth automating first

1. **Order confirmation** with item, amount and expected delivery. Removes the "confirm karo" message.
2. **Dispatch or delivery update** with tracking. Removes three "where is my order" messages.
3. **Invoice and payment link** on the due date minus three days, then again on day one past due. This is the single highest-ROI message in the list.
4. **Repeat-purchase nudge** for consumables: the customer who buys 5kg of coffee every 40 days does not want an ad, they want a reminder.
5. **No-show prevention** for appointments: confirmation 24 hours before with confirm/reschedule buttons.

## What goes badly

- **Broadcasts without segmentation.** Sending a festival offer to every number you have ever stored trains customers to block you, and blocks hurt your quality rating, which reduces deliverability. Message the people the offer fits.
- **Treating templates as marketing.** Utility templates tied to a transaction get opened and answered; promotions get muted.
- **Nobody owns the reply.** An automated message that generates twelve responses and no inbox is worse than no message.
- **Buying lists.** Cold, non-opted-in numbers are the fastest route to a restricted business account.

## How to measure it

Per message: delivered, read, replied, acted (payment, reschedule, repeat order). Compare the cost per conversation with the cost of the phone call or the SMS it replaces, and with the revenue it recovers. Late-payment reminders usually win on the first month's data; cold promotional blasts rarely do.

## How AINOS helps

AINOS keeps the customer, the order, the invoice and the conversation on one record, so a WhatsApp message is triggered by what actually happened - dispatch, due date, silence from a lead - and every reply lands against the same customer rather than on somebody's phone.

## FAQ

### Do I need the API to send order updates?

Not for ten a day - the Business app with labels and quick replies is enough. You need the API when volume, multiple staff, or system-triggered timing shows up.

### Is the API free?

No. Meta charges per message category, and the pricing shifts; check the current India rate card. Utility messages are cheap enough that replacing SMS with them usually saves money.

### Can customers pay inside WhatsApp?

Yes - a payment link or button in a utility message is a normal pattern in India, and it converts better than an emailed invoice.

## The bottom line

Move to the API when the timing of the message matters more than the person sending it. Confirm the order, nudge the payment, prevent the no-show, and let templates do it on schedule.`,
  },
  {
    title: 'Google Business Profile for Local Businesses: The Setup That Gets Calls',
    slug: 'google-business-profile-local-business-setup',
    category: 'SEO & AEO',
    tags: ['google business profile', 'local seo', 'maps pack', 'reviews', 'near me searches'],
    pexels: 'local shop storefront map reviews customer',
    excerpt:
      '"Near me" searches turn into phone calls when the profile is complete, current and answered. The checklist that actually moves a local business up the map pack - and the four things that get profiles suspended.',
    content: `# Google Business Profile for Local Businesses: The Setup That Gets Calls

For a local business, the map pack - the row of three profiles above the blue links - is the most valuable real estate on Google. It gets the click, the direction and the call. And it is one of the few ranking surfaces a small business can genuinely win, because most competitors leave their profile half-filled and never answer a review.

## The five fields that decide whether you appear

1. **Primary category.** It is a ranking input, not a description. Pick the category that matches what you are paid for, not what you would like to be known for. A plumbing company that chooses "Handyman" loses plumbing searches.
2. **Business name, exactly as legally and publicly used.** Adding "- Best AC Repair in Andheri" to the name is against policy and is a common suspension trigger.
3. **Address or service area.** Storefront businesses need a real, verifiable address; mobile businesses hide the street address and declare the area they serve.
4. **Phone number** that reaches a human, and a website URL you actually want traffic on.
5. **Hours**, including holiday hours. A call to a closed business at 8 pm is a lost customer who now goes to the next profile in the pack.

Then fill everything that competitors skip: services list with prices where sensible, attributes (open on Sunday, wheelchair access, appointment required), the description, photos, products and the Q&A you seed yourself with real customer questions.

## Signals that move you up

- **Reviews: count, recency and reply rate.** Ask at the moment of a good outcome, with a direct review link. Reply to every review within a couple of days, and reply to the negative ones in a way a stranger would find fair - that response is read by the next fifty prospects.
- **Relevance of the category and the profile text** to what people search. Use the words customers use, in the services list, not stuffed into the name.
- **Photo freshness.** A profile whose last photo is two years old looks closed. Add a few real photos monthly - the team, the premises, the work, before and after.
- **Consistent NAP data.** Name, Address and Phone must read the same on the profile, your website and the directories. Divergence is why some businesses see two of themselves on Maps.
- **Activity.** Posts for offers, events and updates; answering Q&A; keeping attributes current.

## Four things that get profiles suspended

1. Editing the business name into a keyword phrase.
2. A virtual office or an address that cannot be verified.
3. Several profiles for the same business at the same address.
4. Duplicate listings created during "recovery" attempts instead of resolving the original.

Suspension costs weeks. Nothing on this list is worth a suspension.

## Measure what the profile is worth

In Insights, three numbers matter: calls, direction requests and website clicks - and how they trend against the review count and your photo additions. Compare the call volume against the share of the map pack you occupy (search your main keyword in the city, in incognito, from the area) once a month.

## How AINOS fits

AINOS Marketing keeps the NAP and description in one place, generates the posts and photo captions that keep the profile active, tracks review requests alongside the job that earned them, and ties a lead from Maps to the same customer record as the invoice - so you know which source actually pays.

## FAQ

### How long does a new profile take to rank?

Verification first, then improvement in weeks rather than days. The map pack moves faster than organic rankings, but it still rewards a profile that stays active.

### Do reviews need to be five stars?

Recency and responses matter as much as the average. One honest three-star review with a professional reply builds more trust than fifty identical five-star blocks.

### Should the website or the profile be the main landing point?

For "near me" and urgent intent, the profile. For considered purchases and information, the website - which is also where your schema and answer-engine citations live.

## The bottom line

Pick the true category, keep the name clean, fill the fields nobody else bothers with, ask for reviews at the right moment and answer them. That is the whole local game.`,
  },
];

(async () => {
  const company = await prisma.company.findFirst();
  if (!company) { console.log('ERROR: no company found in DB'); process.exit(1); }

  for (const g of GUIDES) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: g.slug } });
    if (existing) { console.log('SKIP (exists):', g.slug); continue; }
    const image = await pexelsImage(g.pexels);
    const post = await prisma.blogPost.create({
      data: {
        title: g.title,
        slug: g.slug,
        content: g.content,
        excerpt: g.excerpt,
        author: 'AINOS Editorial Team',
        featuredImage: image,
        category: g.category,
        status: 'published',
        publishedAt: new Date(),
        tags: g.tags,
        companyId: company.id,
      },
    });
    console.log('CREATED:', post.slug, '| image:', image ? 'Pexels OK' : 'none');
  }

  const count = await prisma.blogPost.count({ where: { author: 'AINOS Editorial Team' } });
  console.log('AINOS published guides now:', count);
  await prisma.$disconnect();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });

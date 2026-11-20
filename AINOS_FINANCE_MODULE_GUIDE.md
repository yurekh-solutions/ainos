# AINOS Finance Module — Complete Feature Documentation

## Overview

AINOS Finance Module is a complete billing and accounting system built for small businesses, startups, and founder-led companies. Everything runs on your own AINOS platform — no third-party subscriptions, no external billing software needed.

---

## 1. Invoices (GST Billing)

**Location:** Dashboard → Finance → Invoices

### What It Does
Create professional GST-compliant invoices with automatic tax calculations, profit tracking, and sequential numbering.

### Features

| Feature | Description |
|---------|-------------|
| **CGST + SGST Split** | Automatically splits tax for intra-state (same state) sales |
| **IGST** | Automatically applies Integrated GST for inter-state sales |
| **Per-Item GST Rates** | Set different GST rates (0%, 5%, 12%, 18%, 28%) for each item |
| **HSN/SAC Codes** | Add HSN codes for goods or SAC codes for services on each line item |
| **Bill-wise Profit** | Enter cost price per item → see profit in real-time |
| **Multi-Payment** | Record payments via Cash, UPI, Card, or Bank Transfer |
| **MRP Billing** | Tax-inclusive pricing option for MRP-based billing |
| **Discounts** | Apply flat amount or percentage discount on the total |
| **Customer GST Details** | Save customer GSTIN, PAN, State, Address for compliance |
| **Sequential Numbers** | Auto-generates invoice numbers: AIN-0001-2026, AIN-0002-2026... |
| **PDF Download** | Download invoice as PDF with company logo and bank details |
| **Status Tracking** | Track invoices as Draft, Sent, Paid, Overdue, or Cancelled |
| **Summary Dashboard** | See total collected, pending amount, and total profit at a glance |

### How to Create an Invoice
1. Go to **Invoices** → Click **"New Invoice"**
2. Enter customer details (Name, Email, Phone, GSTIN, PAN, State)
3. Choose **Supply Type**: Intra-State (CGST+SGST) or Inter-State (IGST)
4. Choose **Billing Type**: GST Billing, Non-GST, or MRP
5. Add items: Select product, enter HSN code, quantity, rate, cost price, GST rate
6. Add discount if applicable
7. Review GST breakdown and profit
8. Click **"Create GST Invoice"**

### Invoice Numbering
- Format: `AIN-XXXX-YYYY` (AIN-0001-2026)
- XXXX = Sequential number
- YYYY = Financial year
- Automatically increments for each new invoice

---

## 2. Customers

**Location:** Dashboard → Finance → Customers

### What It Does
Manage all your customer records with complete GST and contact details.

### Features
- Customer list with search and filter
- GSTIN, PAN, State, Pincode storage
- Auto-creates customer when you create an invoice
- Links to all invoices for that customer
- Edit and update customer details anytime

---

## 3. Products

**Location:** Dashboard → Finance → Products

### What It Does
Manage your product/service catalog with pricing, tax rates, and HSN codes.

### Features
- Product list with grid and list views
- Store cost price, MRP, and selling price
- HSN/SAC code for each product
- Per-product GST rate (0%, 5%, 12%, 18%, 28%)
- Barcode field for each product
- Auto-fills in invoice when product is selected

---

## 4. Expenses

**Location:** Dashboard → Finance → Expenses

### What It Does
Track all business expenses by category for accurate profit calculation.

### Features
- Category-wise expense tracking
- Add expense amount, date, description
- Status management (Pending, Approved, Rejected)
- Links to overall profit calculation
- Filter by date range and category

---

## 5. Quotations

**Location:** Dashboard → Finance → Quotations

### What It Does
Create and send price quotations to customers before converting them to invoices.

### Features
- Create quotation with items, rates, and GST
- Send quotation to customer
- Convert approved quotation to invoice in one click
- Track quotation status

---

## 6. Delivery Challans

**Location:** Dashboard → Finance → Delivery Challans

### What It Does
Create delivery challans (transport documents) for goods being shipped. Required under GST when goods are transported but invoice is not yet raised.

### Features

| Feature | Description |
|---------|-------------|
| **Create Challan** | Customer name, address, GSTIN, items, vehicle number |
| **GST on Challan** | Auto-calculate CGST/SGST or IGST |
| **Vehicle Tracking** | Record vehicle number for transport |
| **Supply Type** | Intra-state or Inter-state |
| **Status Tracking** | Open, In-Transit, Delivered |
| **Sequential Numbers** | DC-0001-2026, DC-0002-2026... |
| **Convert to Invoice** | Convert delivered challan to invoice |

### How to Create a Challan
1. Go to **Delivery Challans** → Click **"New Challan"**
2. Enter customer details (Name, GSTIN, State, Address)
3. Enter vehicle number
4. Add items with HSN codes, quantity, and rate
5. Choose supply type (Intra/Inter state)
6. Click **"Create Challan"**

---

## 7. Tally / Excel Import-Export

**Location:** Dashboard → Finance → Tally / Excel

### What It Does
Import and export invoice data in Tally-compatible Excel format. Seamlessly work with accountants who use Tally.

### Features

| Feature | Description |
|---------|-------------|
| **Export to Excel** | One-click download of all invoices in .xlsx format |
| **Import from Excel** | Upload .xlsx file → auto-create invoices |
| **Tally-Compatible** | Voucher type, party name, GSTIN, CGST/SGST/IGST columns |
| **Date Range Filter** | Export only a specific period (From/To date) |
| **Company Info** | Company name and GSTIN included in export header |

### Export Format (Excel Columns)
- Date
- Voucher Type (Sales)
- Invoice Number
- Party Name
- Party GSTIN
- Item Name
- HSN Code
- Quantity
- Rate
- Subtotal
- CGST Amount
- SGST Amount
- IGST Amount
- Total Amount
- Status

### Import Process
1. Click **"Import Excel"**
2. Upload .xlsx or .csv file
3. System reads voucher data
4. Auto-creates customers if they don't exist
5. Auto-determines supply type by comparing party state with company state
6. Creates invoices with all GST calculations

---

## 8. Payment Reminders

**Location:** Dashboard → Finance → Payment Reminders

### What It Does
Track overdue invoices and send payment reminders via WhatsApp. Never miss a payment collection.

### Features

| Feature | Description |
|---------|-------------|
| **Overdue Tracking** | Shows how many days an invoice is overdue |
| **Pending Amount** | Total - Paid = Pending amount per invoice |
| **WhatsApp Reminder** | One click → opens WhatsApp with pre-filled reminder message |
| **Mark as Paid** | One click to mark invoice as fully paid |
| **Filter** | View All, Overdue only, or Upcoming |
| **Summary Stats** | Total Pending, Overdue Count, Total Invoices |

### How Reminders Work
1. System automatically finds all unpaid/partially-paid invoices
2. Calculates overdue days (if past due date)
3. Shows reminder cards with customer name, invoice number, amount
4. Click **"WhatsApp"** → Opens WhatsApp with message like:
   > "Dear Rajesh Enterprises, this is a reminder that Invoice AIN-0001-2026 for ₹86,500 is overdue by 5 days. Please make the payment at the earliest. Thank you."
5. Click **"Mark Paid"** → Updates status to paid

---

## 9. Template Designer (NEW)

**Location:** Dashboard → Finance → Template Designer

### What It Does
Design custom invoice templates with your brand colors, fonts, and layout. Make every invoice match your company's visual identity.

### Features

| Feature | Description |
|---------|-------------|
| **6 Quick Presets** | Standard, Modern, Compact, Minimal, Bold, Elegant |
| **Brand Colors** | Primary, Secondary, Background, Text — all customizable |
| **Font Selection** | 7 font families: Helvetica, Arial, Georgia, Times New Roman, etc. |
| **Font Size** | Small (12px), Medium (14px), Large (16px) |
| **Layout Styles** | Standard, Modern, Compact, Minimal |
| **Border Radius** | None, Small, Medium, Large |
| **Accent Bar** | Thin, Medium, Thick, None |
| **Logo Settings** | Show/hide, size (S/M/L), position (Left/Right/Center) |
| **Content Toggles** | Show/hide Bank Details, Terms & Conditions, QR Code |
| **Custom Text** | Header text, Notes, Terms, Footer text |
| **Live Preview** | See changes in real-time as you customize |
| **Multiple Templates** | Create and save unlimited templates |
| **Default Template** | Set one template as default for all invoices |
| **Duplicate** | Copy any template to create variations |

### How to Use
1. Go to **Template Designer**
2. Click a **Quick Preset** to start (Standard, Modern, etc.)
3. Customize colors using color pickers
4. Choose font family and size
5. Select layout style
6. Toggle sections on/off (Bank Details, Terms, QR Code)
7. Add custom header text, notes, footer
8. Watch the **Live Preview** update in real-time
9. Click **"Save Template"**
10. Check **"Set as default"** to use for all future invoices

### Preset Descriptions
| Preset | Style | Best For |
|--------|-------|----------|
| **Standard** | Purple gradient header, clean layout | General business, services |
| **Modern** | Blue tones, rounded corners, spacious | Tech companies, agencies |
| **Compact** | Green tones, small font, tight spacing | High-volume billing, retail |
| **Minimal** | Black & white, no decorations | Consultants, freelancers |
| **Bold** | Red accent, large font, strong presence | Retail, trading |
| **Elegant** | Violet tones, serif-like feel | Premium services, luxury |

---

## 10. GST Reports (GSTR-1 / GSTR-3B)

### What It Does
Builds the return figures from the invoices, expenses and credit notes already in
Finance, then packages them so the taxpayer can file on the GST portal themselves.

**AINOS does not submit returns.** There is no public GSTN filing API, and the portal
only accepts a submission signed with the taxpayer's own DSC / EVC / OTP. Everything
here stops at *prepared and exported*.

### Tabs
| Tab | Purpose |
|-----|---------|
| **File It Yourself** | Validation check, due dates, late-fee estimate, portal JSON + CSV sheets, step-by-step portal checklist, ARN recording |
| **GSTR-1** | Outward supplies (B2B / B2C / HSN) with the legacy export |
| **GSTR-3B** | Summary of outward tax, ITC and net payable |
| **2B Reconciliation** | Matches uploaded GSTR-2B JSON against booked purchase bills and flags credit at risk |
| **Anomaly Check** | Data defects that would make the portal reject the return |

### The Filing Pack (`/api/gst-reports/filing-pack`)
| Part | What it produces |
|------|------------------|
| `validation` | Row-level blocking issues and warnings. Place of supply is taken from the recipient GSTIN when the invoice field is blank, so valid invoices are never falsely blocked. A range spanning two calendar months is flagged as a warning — a return is filed one period at a time |
| `gstr1` | `GSTR1V1.0` portal JSON — `docdata` sections `b2b / b2cl / b2c / cdnrp / nil / exp / hsn4 / hsn6` with `txval / rt / iamt / camt / samt / kamt` tax heads |
| `gstr3b` | Statutory table 3 / 4 / 5 / 6 splits, ITC set-off in the IGST → CGST → SGST order, cess always in cash. What is shown as payable is the **cash** left after the set-off — CGST/SGST credit cannot meet an IGST liability, and the unused balance is reported as carried forward to the credit ledger |
| `due` + `fees` | Calendars for monthly, QRMP and composition; late fee ₹50/day (₹10 nil) with the turnover-based caps, and 18% interest on net tax |
| `checklist` | The portal path, step by step |
| `marketplaceSources` | Where Amazon / Flipkart / Meesho publish their sales reports and which section each one maps to |
| Downloads | `?download=gstr1-json`, `?download=pack`, `?download=sheet&sheet=b2b\|b2c\|hsn\|3b-tables\|itc\|issues` |

Credit notes are netted only inside the period they were issued in, so an April return is never
reduced by a November return note. That is also why the tab defaults to the current calendar
month instead of a rolling 30 days.

Marketplace sales are **not** pulled in automatically — no marketplace offers a
seller-side sales API. The reports must be exported from each seller dashboard and
added as invoices, and the sheets exist so those figures can be keyed in by hand.

### Closing a Period
`POST /api/gst-reports/filing-pack` with `{ period, type, arn, challanNo }` stores the
15-digit ARN in `GstFiling.payload` and marks the return `filed`. No schema change was
needed, and nothing is sent to GSTN.

---

## 11. Business Card Scanner

**Location:** Dashboard → Finance → Business Card Scanner

### What It Does
Photograph or upload a visiting card, read the details off it, and put the contact
straight into **Customers** — while the upload is still running. Before this, the scanner
only held the results in the browser tab: refresh the page and a whole stack of cards
was lost. Export to Excel is still there for anyone who wants a spreadsheet instead.

### Features

| Feature | Description |
|---------|-------------|
| **Scan on upload** | Every card is read as soon as it is dropped; nothing has to be clicked twice |
| **Auto-insert into Customers** | On by default, remembered per browser. Turned off, the scanner stays the session-only tool it was |
| **GSTIN read off the card** | The 15-character number is now extracted, checked, and stored — so a scanned contact can be invoiced with GST details already filled |
| **PAN derived from the GSTIN** | Characters 3–12 of a GSTIN *are* the holder's PAN, so the PAN is taken from the number itself instead of guessed from the OCR text |
| **State from the GSTIN** | The first two digits decide the state, so the right place of supply is on the record without typing it |
| **Pincode from the address** | The six-digit tail of the address is pulled into its own field |
| **Second number and website kept** | Extras go into Notes as `Designation: … · Website: … · Other numbers: …` rather than being dropped |
| **Duplicates folded, not doubled** | A card for someone already on file updates that row instead of creating a twin |
| **Excel export** | Same sheet as before, now with the GSTIN column |

### The two rules that make auto-insert safe

1. **Dedupe key order** — GSTIN, then email (case-insensitive), then the *digits* of the
   phone, then name + company. The phone is compared as digits, so `+91 98200 12345` and
   `98200-12345` are recognised as one person; matching them inside a company only,
   never across tenants.
2. **Blanks are filled, typed data is never overwritten** — a card is only an OCR guess,
   and may be a five-year-old card. If the customer already has an address, an email or a
   phone that the seller entered, the card leaves it alone and reports
   `Already in Customers` or `Filled a gap in Customers`.

A GSTIN that breaks the **format** (wrong length, a state code that does not exist,
a PAN that cannot be a PAN) is refused and never written into the record, but the
contact is still saved — a misread number must not lose a lead. A GSTIN that is
perfectly shaped and fails only its **check character** is stored and flagged, not
refused: the check character is a strong hint of a misreading, not proof of one.
A card with nothing readable on it is rejected with `422` and no blank row is created.

### The GSTN cross-check (a shaped number is not a registered number)

OCR can produce a perfectly well-formed GSTIN that belongs to nobody. Each scanned
number is therefore checked against `gst_lookup_cache` — the rows AINOS already holds
from real portal lookups — and the result shows as a pill on the card row. Nothing is
sent anywhere and no login is needed; this is purely evidence the account already has.

| Pill | When it appears |
|------|---------------|
| `Matches GSTN` / `Seen on GSTN` | This exact GSTIN is in the cache with an Active registration |
| `GSTN: Cancelled` | The number exists but the cached status reads cancelled / inactive / suspended / provisional / ineligible |
| `GSTIN needs a look` | The number is *not* known, but a **different** GSTIN carrying the same PAN is. Catches the one-digit misread, which no same-number lookup can |
| `GSTIN looks misread` | The number fails its own check character — 15 characters, every slot legal, and it does not add up. No portal needed, so this works on a supplier never looked up before |
| `Not checked on GSTN` | Format is valid and the number adds up; this account has simply never seen it on the portal |
| `Not checked` | AINOS could not reach its GSTIN records just now — says so rather than implying a pass |

Order matters, and the tests pin it: portal evidence outranks arithmetic (a number this
account has genuinely fetched is real whatever its tail looks like), then a known sibling
PAN, because it can name the number the seller should have, then the check character,
because it is a positive finding rather than the absence of one.

The check character is the 15th character, computed from the fourteen before it by the
Luhn-mod-36 rule GSTN published for its developer API. The first version of
`gstinCheckChar` used a weighted-prime series instead and matched none of the GSTINs that
independent validators publish as valid, so every real number would have been called
suspect; it is now pinned against those published samples in `gstnFiling.test.ts`, which
is the only way to catch that class of error — a fixture built through the function itself
agrees with any rule, right or wrong. The published samples pinned in
`gstnFiling.test.ts` are therefore the standing check; the one-off probe script
that used to re-check them against live portal rows went with the scratch
helpers it sat among.

The sibling-PAN test runs as `substr(gst_number, 3, 10) = <pan>` against the cache, so a
misread state code or check digit still surfaces. A pill never claims success on a miss,
and every pill links to the public GSTIN search so the seller can confirm in one tap.

### How to use
1. Go to **Business Card Scanner**, leave **Add every scanned card to Customers** on
2. Drop or select the card photos
3. Watch each row fill in as it is read; the status changes to `Added to Customers`
4. Correct anything wrong by typing into the row, then click **Save** on that row
5. Use **Save all to Customers** for cards scanned with the switch off
6. The contacts appear under **Finance → Customers** and can be invoiced directly

### Measurement

Scans and saves write `AuditLog` rows under entity `business_card` — `scan` events carry
no id (they are the funnel's denominator), `save` events carry the resulting customer id
plus `{ check, hasGstin, stateCode, panPeers, fields }`. No table was added.

The same funnel is readable straight from `AuditLog`: count the `scan` events, count the
`save` events, then join the saved customer ids to `Invoice` for billed value, with
`entity`/`action` plus `companyId` as the only filters needed. The one-off script that
printed this in text and `--json` form (the E2E harness asserted on that same output) has
been removed along with the other scratch helpers, so the event shape above is the
contract to query against.

---

## Technical Architecture

### Database Models (PostgreSQL)
- **Invoice** — 26+ fields including GST split, e-invoice, e-way bill, payments
- **Customer** — GSTIN, PAN, State, Pincode
- **Product** — Cost price, MRP, HSN code, Barcode, GST rate
- **DeliveryChallan** — Transport documents with GST
- **InvoiceTemplate** — Branding, colors, fonts, layout settings

### API Routes
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/invoices` | GET, POST, PUT, DELETE | Invoice CRUD + GST calculation |
| `/api/delivery-challans` | GET, POST, PUT, DELETE | Challan CRUD |
| `/api/tally` | GET, POST | Excel export/import |
| `/api/barcode` | GET, POST | SVG barcode generation |
| `/api/payment-reminders` | GET, PUT | Overdue tracking + WhatsApp |
| `/api/invoice-templates` | GET, POST, PUT, DELETE | Template CRUD |
| `/api/gst-reports` | GET, POST | GSTR-1 / GSTR-3B reports, exports, 2B reconciliation |
| `/api/gst-reports/filing-pack` | GET, POST | Self-filing pack: portal JSON, CSV sheets, dates, fees, checklist, ARN record |
| `/api/finance/business-cards/scan` | POST | Card image → vision scan → fields including GSTIN |
| `/api/finance/business-cards/save` | POST | Card fields → dedupe + fill-blanks upsert into Customers |

### Zero External Cost
- No SaaS subscriptions
- No third-party billing service
- No paid API integrations
- All code is owned by AINOS
- All data stays in your database

---

## Phase 2 (Upcoming)

| Feature | Description | Status |
|---------|-------------|--------|
| GSTR Reports | GSTR-1 / GSTR-3B prepared and exported for self-filing on the portal | Live |
| Credit/Debit Notes | Issue credit notes against invoices | Planned |
| Recurring Invoices | Auto-generate monthly/weekly invoices | Planned |
| Bank Reconciliation | Match bank statements with books | Planned |
| Custom PDF Templates | Multiple downloadable PDF designs | In Progress |
| Customer Portal | Customers view their own invoices | Planned |
| Chart of Accounts | Double-entry accounting structure | Planned |
| Journal Entries | Manual accounting entries | Planned |
| P&L / Balance Sheet | Auto-generate financial statements | Planned |

---

## Quick Reference

### GST Rates
| Rate | Applicable For |
|------|---------------|
| 0% | Essential goods, fresh food |
| 5% | Household goods, tea, coffee |
| 12% | Processed food, computers |
| 18% | Most services, electronics (most common) |
| 28% | Luxury items, automobiles |

### Supply Types
| Type | Tax Applied | When |
|------|------------|------|
| **Intra-State** | CGST + SGST | Buyer and seller in same state |
| **Intra-State (UT)** | CGST + UTGST | Same state, and that state is a Union Territory with legislature |
| **Inter-State** | IGST | Buyer and seller in different states |

Supply type is derived from the two GSTIN state codes, not from a hand-picked dropdown.
UT / territory codes are `04, 25, 26, 31, 34, 35, 38` (Delhi `07` is a state, not a UT),
and UTGST is reported under the SGST head on GSTR-3B.

### Invoice Statuses
| Status | Meaning |
|--------|---------|
| Draft | Created but not sent |
| Sent | Sent to customer, awaiting payment |
| Paid | Payment received |
| Overdue | Past due date, payment pending |
| Cancelled | Invoice cancelled |

---

*Document Version: 1.3*
*Last Updated: November 2026*
*Platform: AINOS Business Suite by Yurekh*

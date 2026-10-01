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
| GSTR Reports | GSTR-1, GSTR-2, GSTR-3B auto-generation | Planned |
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
| **Inter-State** | IGST | Buyer and seller in different states |

### Invoice Statuses
| Status | Meaning |
|--------|---------|
| Draft | Created but not sent |
| Sent | Sent to customer, awaiting payment |
| Paid | Payment received |
| Overdue | Past due date, payment pending |
| Cancelled | Invoice cancelled |

---

*Document Version: 1.0*
*Last Updated: October 2026*
*Platform: AINOS Business Suite by Yurekh*

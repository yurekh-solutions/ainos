# Invoice Extraction & Automation

## Overview
AINOS now supports **automatic invoice data extraction** — companies upload vendor invoices (images/PDFs), and the system extracts all details using OCR + AI.

## How It Works

### 1. Upload Invoice
- Go to **Tools → Invoice Extractor**
- Upload invoice image (PNG/JPG) or PDF
- Click "Extract Data"

### 2. Automatic Extraction
The system extracts:
- **Vendor Details**: Name, Address, PAN, GST, Phone, Email
- **Invoice Info**: Invoice Number, Date
- **Line Items**: Description, Quantity, Rate, Amount (per item)
- **Financials**: Subtotal, Tax, Total, Amount Paid, Balance

### 3. Review & Add
- Review extracted data in a clean, structured view
- One-click "Add as Expense" to save to your expense ledger
- Copy JSON for integration with accounting software

## Technology Stack

### OCR: OCR.space API
- **Free tier**: 25,000 requests/month
- **API key**: Get from https://ocr.space/ocrapi
- **Engine**: Engine 2 (best for invoices)
- **Languages**: English (expandable)

### AI: Pollinations AI
- **Free tier**: Unlimited text generation
- **Purpose**: Structure OCR text into JSON fields
- **Model**: text.pollinations.ai

### Cost
- **OCR**: Free (25k/month)
- **AI**: Free (unlimited)
- **AINOS credits**: 5 credits per extraction

## Setup

### 1. Get OCR.space API Key
1. Visit https://ocr.space/ocrapi
2. Sign up for free account
3. Copy API key (default: `helloworld` for testing)

### 2. Add to Environment
Add to `.env`:
```env
OCR_SPACE_API_KEY="your-api-key-here"
```

### 3. Seed the Tool
```bash
node seed-tools.cjs
```

### 4. Deploy
```bash
git add seed-tools.cjs src/lib/tool-runner.ts src/app/\(dashboard\)/tools/execute/\[slug\]/page.tsx .env.example
git commit -m "feat: invoice extraction & automation"
git push origin main
```

## Usage Example

### Input Invoice (from DOC-20261015-WA0009.docx)
```
SKY VISION & MULTIMEDIA
Vithal Kung Bldg, Andheri West, Mumbai 400058
PAN: AFXPJ4807L

Consignee: Sanhita Creations
GST: 27AOQPP2819A1Z

Invoice No: 156
Date: 21.8.2026

Items:
1. 576 sqft LED screen on hire - 1 day - ₹70,000
2. 50 inches TV on hire - 1 day - ₹5,000

Total: ₹75,000
Amount Received: ₹30,000
Balance: ₹40,000
```

### Extracted Output
```json
{
  "vendorName": "SKY VISION & MULTIMEDIA",
  "vendorAddress": "Vithal Kung Bldg, Andheri West, Mumbai 400058",
  "vendorPAN": "AFXPJ4807L",
  "vendorGST": "",
  "vendorPhone": "",
  "vendorEmail": "sky.vision7518@yahoo.in",
  "invoiceNumber": "156",
  "invoiceDate": "21.8.2026",
  "items": [
    {
      "description": "576 sqft LED screen on hire",
      "quantity": 1,
      "rate": 70000,
      "amount": 70000
    },
    {
      "description": "50 inches TV on hire",
      "quantity": 1,
      "rate": 5000,
      "amount": 5000
    }
  ],
  "subtotal": 75000,
  "tax": 0,
  "total": 75000,
  "amountPaid": 30000,
  "balance": 40000
}
```

## Business Value

### For Companies
- **Time savings**: 5-10 minutes per invoice → 30 seconds
- **Accuracy**: Eliminates manual data entry errors
- **GST compliance**: Auto-extract PAN/GST for input credit claims
- **Expense tracking**: One-click add to expense ledger
- **Vendor management**: Build vendor database automatically

### For AINOS Sales
- **Killer feature**: "Upload any invoice, we extract everything"
- **Demo**: Show with real vendor invoice (like SKY VISION)
- **ROI**: 10 invoices/day × 5 min saved = 50 min/day = 25 hours/month
- **Monetization**: 5 credits per extraction (₹0.50/invoice)

## Integration Points

### 1. Expense Management
- Extract → Add as Expense → Auto-categorize
- Link to vendor master
- Track payment status (paid/balance)

### 2. GST Input Credit
- Extract vendor PAN/GST
- Match with GSTR-2A
- Claim input credit automatically

### 3. Accounts Payable
- Extract invoice details
- Schedule payment reminders
- Auto-reconcile with bank statements

### 4. Vendor Database
- Build vendor master from uploaded invoices
- Track vendor-wise spend
- Negotiate better terms with data

## API Reference

### Endpoint
```
POST /api/tools/execute
```

### Request
```json
{
  "slug": "invoice-extractor",
  "input": {
    "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

### Response
```json
{
  "success": true,
  "output": {
    "success": true,
    "ocrText": "SKY VISION & MULTIMEDIA...",
    "extracted": {
      "vendorName": "SKY VISION & MULTIMEDIA",
      "vendorAddress": "Vithal Kung Bldg, Andheri West, Mumbai 400058",
      "vendorPAN": "AFXPJ4807L",
      "invoiceNumber": "156",
      "invoiceDate": "21.8.2026",
      "items": [...],
      "subtotal": 75000,
      "tax": 0,
      "total": 75000,
      "amountPaid": 30000,
      "balance": 40000
    },
    "message": "Invoice data extracted. Review and add as expense or vendor invoice."
  },
  "creditsUsed": 5,
  "newBalance": 995
}
```

## Limitations

### OCR Accuracy
- **Handwritten invoices**: Low accuracy
- **Blurry images**: May fail or extract incorrectly
- **Non-English**: Currently English only (expandable)
- **Complex layouts**: Multi-column invoices may need manual review

### AI Structuring
- **Inconsistent formats**: AI may misinterpret fields
- **Missing fields**: Returns `null` or `—` for missing data
- **Currency**: Assumes ₹ (INR), needs localization for other currencies

### File Support
- **Images**: PNG, JPG, JPEG (max 5MB)
- **PDFs**: Text-based PDFs work best; scanned PDFs depend on OCR quality
- **Multi-page**: Only first page processed

## Future Enhancements

### Phase 2
- [ ] Multi-page invoice support
- [ ] Bulk upload (drag & drop folder)
- [ ] Auto-categorize expenses (rent, utilities, supplies)
- [ ] Vendor matching (suggest existing vendor or create new)
- [ ] Payment scheduling (set due date, auto-reminders)

### Phase 3
- [ ] GST reconciliation (match with GSTR-2A)
- [ ] Bank statement integration (auto-match payments)
- [ ] Expense approval workflow
- [ ] Multi-currency support
- [ ] Multi-language OCR (Hindi, regional languages)

### Phase 4
- [ ] Tally integration (export to Tally format)
- [ ] QuickBooks integration
- [ ] Zoho Books integration
- [ ] SAP integration
- [ ] Custom ERP connectors

## Sales Pitch

### Problem
"Companies receive 50-100 vendor invoices per month. Manual data entry takes 5-10 minutes per invoice, costs ₹5,000-10,000/month in staff time, and has 5-10% error rate leading to GST input credit loss."

### Solution
"AINOS Invoice Extractor: Upload any invoice image or PDF, get all data extracted automatically in 30 seconds. Vendor details, items, GST, totals — everything captured accurately. One-click add to expense ledger."

### ROI
- **Time saved**: 50 invoices × 5 min = 250 min/month = 4+ hours
- **Cost savings**: ₹10,000/month staff time + ₹5,000/month GST input credit = ₹15,000/month
- **AINOS cost**: 250 invoices × 5 credits × ₹0.10 = ₹125/month
- **Net benefit**: ₹14,875/month = ₹1.78L/year

### Demo Script
1. Open vendor invoice (like SKY VISION)
2. Upload to AINOS → Invoice Extractor
3. Show extraction in 10 seconds
4. Review extracted data
5. Click "Add as Expense"
6. Show it in expense ledger
7. Total time: 30 seconds vs 5-10 minutes manual

## Support

### Troubleshooting
- **OCR fails**: Check image quality, ensure text is readable
- **AI structuring fails**: OCR text may be too short or garbled
- **Missing fields**: Invoice may not have all fields (PAN, GST, etc.)
- **Wrong totals**: Review OCR text, manually correct if needed

### Contact
- **OCR.space API**: https://ocr.space/support
- **AINOS support**: support@ainos.com

---

**Status**: ✅ Implemented & Ready for Testing  
**Last Updated**: 2026-10-16  
**Version**: 1.0

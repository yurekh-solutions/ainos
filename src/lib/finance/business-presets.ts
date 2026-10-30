// ── Shared business-type invoice presets ──────────────────────────────────────
// Lightweight, UI-agnostic data used by the "Quick start" business picker on the
// New Invoice page. Each entry only carries the fields the invoice form consumes
// (tableColumns + formFields). The full colour/layout designer lives in
// /finance/templates and can hold richer configs; this module stays dependency
// free so it can be imported anywhere.

export interface BusinessFormField {
  label: string;
  key: string;
  type: 'text' | 'date' | 'select' | 'number';
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

export interface BusinessTableColumn {
  label: string;
  key: string;
  width?: string;
}

export interface BusinessPresetLite {
  key: string;
  label: string;
  tableColumns: BusinessTableColumn[];
  formFields: BusinessFormField[];
}

export const BUSINESS_PRESETS: BusinessPresetLite[] = [
  {
    key: 'restaurant',
    label: 'Restaurant / Cafe',
    tableColumns: [
      { label: 'Item', key: 'name', width: '40%' },
      { label: 'Qty', key: 'qty', width: '12%' },
      { label: 'Unit', key: 'unit', width: '12%' },
      { label: 'Rate', key: 'rate', width: '18%' },
      { label: 'Amount', key: 'total', width: '18%' },
    ],
    formFields: [
      { label: 'Order No', key: 'orderNo', type: 'text', required: true, placeholder: 'e.g. ORD-045' },
      { label: 'Table No', key: 'tableNo', type: 'text', required: false, placeholder: 'e.g. T-12' },
      { label: 'Service Type', key: 'serviceType', type: 'select', required: false, options: ['Dine-In', 'Takeaway', 'Delivery', 'Catering'] },
    ],
  },
  {
    key: 'it',
    label: 'IT Services / Agency',
    tableColumns: [
      { label: 'Description', key: 'name', width: '42%' },
      { label: 'Period / Hrs', key: 'qty', width: '16%' },
      { label: 'Rate', key: 'rate', width: '18%' },
      { label: 'Amount', key: 'total', width: '24%' },
    ],
    formFields: [
      { label: 'Project Name', key: 'projectName', type: 'text', required: true, placeholder: 'e.g. Mobile App v2' },
      { label: 'PO Number', key: 'poNumber', type: 'text', required: false, placeholder: 'Client PO ref' },
      { label: 'Service Period Start', key: 'serviceStart', type: 'date', required: false },
      { label: 'Service Period End', key: 'serviceEnd', type: 'date', required: false },
    ],
  },
  {
    key: 'retail',
    label: 'Retail / Shop',
    tableColumns: [
      { label: 'Product', key: 'name', width: '30%' },
      { label: 'SKU', key: 'sku', width: '12%' },
      { label: 'Qty', key: 'qty', width: '8%' },
      { label: 'Rate', key: 'rate', width: '14%' },
      { label: 'Disc', key: 'disc', width: '8%' },
      { label: 'GST%', key: 'gst', width: '8%' },
      { label: 'Total', key: 'total', width: '20%' },
    ],
    formFields: [
      { label: 'Shop/Counter No', key: 'counterNo', type: 'text', required: false, placeholder: 'e.g. Counter 2' },
      { label: 'Loyalty Card No', key: 'loyaltyCard', type: 'text', required: false, placeholder: 'Membership #' },
    ],
  },
  {
    key: 'manufacturing',
    label: 'Manufacturing',
    tableColumns: [
      { label: 'Item', key: 'name', width: '22%' },
      { label: 'HSN', key: 'hsn', width: '10%' },
      { label: 'Qty', key: 'qty', width: '8%' },
      { label: 'Unit', key: 'unit', width: '8%' },
      { label: 'Rate', key: 'rate', width: '12%' },
      { label: 'Taxable', key: 'taxable', width: '12%' },
      { label: 'GST', key: 'gst', width: '8%' },
      { label: 'Total', key: 'total', width: '12%' },
    ],
    formFields: [
      { label: 'Job Order No', key: 'jobOrder', type: 'text', required: true, placeholder: 'JO-YYYY-NNN' },
      { label: 'Batch No', key: 'batchNo', type: 'text', required: false },
      { label: 'Vehicle No', key: 'vehicleNo', type: 'text', required: false, placeholder: 'MH 01 AB 1234' },
      { label: 'LR No', key: 'lrNo', type: 'text', required: false, placeholder: 'Lorry Receipt' },
      { label: 'EWB No', key: 'ewbNo', type: 'text', required: false, placeholder: '12-digit E-Way Bill' },
    ],
  },
  {
    key: 'freelancer',
    label: 'Freelancer / Consultant',
    tableColumns: [
      { label: 'Description', key: 'name', width: '48%' },
      { label: 'Hours', key: 'qty', width: '14%' },
      { label: 'Rate', key: 'rate', width: '18%' },
      { label: 'Amount', key: 'total', width: '20%' },
    ],
    formFields: [
      { label: 'Client Reference', key: 'clientRef', type: 'text', required: false, placeholder: 'Their PO or project code' },
      { label: 'Due Date', key: 'dueDate', type: 'date', required: true },
      { label: 'Payment Method', key: 'payMethod', type: 'select', required: false, options: ['Bank Transfer', 'UPI', 'PayPal', 'Wise'] },
    ],
  },
  {
    key: 'wholesale',
    label: 'Wholesale / Distribution',
    tableColumns: [
      { label: 'Product', key: 'name', width: '22%' },
      { label: 'HSN', key: 'hsn', width: '10%' },
      { label: 'Qty', key: 'qty', width: '8%' },
      { label: 'Unit', key: 'unit', width: '8%' },
      { label: 'Rate', key: 'rate', width: '12%' },
      { label: 'Disc', key: 'disc', width: '8%' },
      { label: 'GST%', key: 'gst', width: '8%' },
      { label: 'Amount', key: 'total', width: '14%' },
    ],
    formFields: [
      { label: 'Transport Mode', key: 'transportMode', type: 'select', required: false, options: ['Road', 'Rail', 'Air', 'Courier'] },
      { label: 'Vehicle No', key: 'vehicleNo', type: 'text', required: false, placeholder: 'MH 01 AB 1234' },
      { label: 'Lorry Receipt No', key: 'lrNo', type: 'text', required: false },
      { label: 'EWB No', key: 'ewbNo', type: 'text', required: false, placeholder: '12-digit' },
      { label: 'Delivery Date', key: 'deliveryDate', type: 'date', required: false },
    ],
  },
  {
    key: 'ecommerce',
    label: 'E-Commerce / D2C',
    tableColumns: [
      { label: 'Product', key: 'name', width: '28%' },
      { label: 'SKU', key: 'sku', width: '14%' },
      { label: 'Qty', key: 'qty', width: '10%' },
      { label: 'Price', key: 'rate', width: '18%' },
      { label: 'Amount', key: 'total', width: '18%' },
    ],
    formFields: [
      { label: 'Order ID', key: 'orderId', type: 'text', required: true, placeholder: 'e.g. ORD-2026-00456' },
      { label: 'Platform', key: 'platform', type: 'select', required: true, options: ['Amazon', 'Flipkart', 'Meesho', 'Own Website', 'Shopify', 'Instagram', 'WhatsApp'] },
      { label: 'Payment Mode', key: 'payMode', type: 'select', required: true, options: ['Prepaid (UPI/Card/NetBanking)', 'COD'] },
      { label: 'Shipping Charges', key: 'shipping', type: 'number', required: false, placeholder: '₹' },
    ],
  },
  {
    key: 'construction',
    label: 'Construction / Real Estate',
    tableColumns: [
      { label: 'Description of Work', key: 'name', width: '32%' },
      { label: 'Unit', key: 'unit', width: '10%' },
      { label: 'Qty', key: 'qty', width: '10%' },
      { label: 'Rate', key: 'rate', width: '16%' },
      { label: 'Amount', key: 'total', width: '16%' },
    ],
    formFields: [
      { label: 'Site / Project Name', key: 'projectName', type: 'text', required: true, placeholder: 'e.g. Sunrise Apartments Phase 2' },
      { label: 'MB Reference', key: 'mbRef', type: 'text', required: false, placeholder: 'Measurement Book Page/Ledger' },
      { label: 'Period', key: 'period', type: 'text', required: false, placeholder: 'e.g. Jan–Mar 2026' },
      { label: 'TDS Section', key: 'tdsSection', type: 'select', required: false, options: ['194C', '194J', '194H', 'None'] },
      { label: 'Location', key: 'location', type: 'text', required: false },
    ],
  },
  {
    key: 'medical',
    label: 'Medical / Pharmacy',
    tableColumns: [
      { label: 'Drug / Item', key: 'name', width: '24%' },
      { label: 'Batch', key: 'batch', width: '10%' },
      { label: 'Expiry', key: 'expiry', width: '10%' },
      { label: 'Pack', key: 'unit', width: '10%' },
      { label: 'MRP', key: 'rate', width: '12%' },
      { label: 'GST%', key: 'gst', width: '8%' },
      { label: 'Amount', key: 'total', width: '14%' },
    ],
    formFields: [
      { label: 'Prescription No', key: 'prescNo', type: 'text', required: false },
      { label: 'Doctor Name', key: 'doctorName', type: 'text', required: false },
      { label: 'Schedule', key: 'schedule', type: 'select', required: false, options: ['H', 'H1', 'X', 'C', 'Non-Schedule'] },
      { label: 'Drug Licence No', key: 'licenceNo', type: 'text', required: true, placeholder: 'MH/DR/...' },
    ],
  },
  {
    key: 'education',
    label: 'Education / Coaching',
    tableColumns: [
      { label: 'Fee Head', key: 'name', width: '44%' },
      { label: 'Session / Term', key: 'qty', width: '22%' },
      { label: 'Amount', key: 'total', width: '22%' },
    ],
    formFields: [
      { label: 'Student Name', key: 'studentName', type: 'text', required: true },
      { label: 'Course / Batch', key: 'course', type: 'text', required: true, placeholder: 'e.g. JEE 2026 Batch-A' },
      { label: 'Admission No', key: 'admissionNo', type: 'text', required: true, placeholder: 'ADM-2026-XXX' },
      { label: 'Session', key: 'session', type: 'text', required: false, placeholder: 'e.g. 2025-26' },
      { label: 'Payment Mode', key: 'payMode', type: 'select', required: false, options: ['Cash', 'UPI', 'Cheque', 'NEFT/RTGS', 'Card'] },
    ],
  },
  {
    key: 'transport',
    label: 'Transport / Logistics',
    tableColumns: [
      { label: 'Consignment', key: 'name', width: '22%' },
      { label: 'Origin', key: 'origin', width: '12%' },
      { label: 'Destination', key: 'dest', width: '12%' },
      { label: 'Wt/Vol', key: 'qty', width: '12%' },
      { label: 'Freight', key: 'rate', width: '14%' },
      { label: 'Amount', key: 'total', width: '14%' },
    ],
    formFields: [
      { label: 'Trip / Consignment No', key: 'tripNo', type: 'text', required: true, placeholder: 'e.g. TRP-2026-0789' },
      { label: 'Vehicle No', key: 'vehicleNo', type: 'text', required: true, placeholder: 'MH 01 AB 1234' },
      { label: 'LR / GR No', key: 'lrNo', type: 'text', required: false, placeholder: 'Lorry Receipt / Goods Receipt' },
      { label: 'EWB No', key: 'ewbNo', type: 'text', required: false, placeholder: '12-digit' },
      { label: 'Delivery Date', key: 'deliveryDate', type: 'date', required: false },
      { label: 'Origin', key: 'originCity', type: 'text', required: false },
      { label: 'Destination', key: 'destCity', type: 'text', required: false },
    ],
  },
];

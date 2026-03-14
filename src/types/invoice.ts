export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  productId: string;
  productName: string;
  description?: string;
  quantity: number;
  price: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface Invoice {
  id: string;
  companyId: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  customerGstNumber?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  status: InvoiceStatus;
  notes?: string;
  terms?: string;
  createdBy: string;
  sentAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceFormData {
  customerId: string;
  invoiceDate: string;
  dueDate: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  notes?: string;
  terms?: string;
}

export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  status: InvoiceStatus;
}

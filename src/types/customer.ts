export interface Customer {
  id: string;
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  taxNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  taxNumber?: string;
}

export interface CustomerHistory {
  customerId: string;
  totalInvoices: number;
  totalAmount: number;
  lastInvoiceDate?: string;
  invoices: {
    id: string;
    invoiceNumber: string;
    date: string;
    amount: number;
    status: string;
  }[];
}

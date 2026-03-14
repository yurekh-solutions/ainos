import mongoose from 'mongoose';

export interface IInvoiceItem {
  productId: string;
  productName: string;
  description?: string;
  quantity: number;
  price: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface IInvoice {
  _id?: string;
  companyId: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  customerGstNumber?: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  items: IInvoiceItem[];
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  terms?: string;
  createdBy: string;
  sentAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new mongoose.Schema<IInvoiceItem>({
  productId: {
    type: String,
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  description: String,
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  taxRate: {
    type: Number,
    default: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
});

const InvoiceSchema = new mongoose.Schema<IInvoice>(
  {
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    customerId: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: String,
    customerAddress: String,
    customerGstNumber: String,
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    items: [InvoiceItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    taxTotal: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
    },
    notes: String,
    terms: String,
    createdBy: {
      type: String,
      required: true,
    },
    sentAt: Date,
    paidAt: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);

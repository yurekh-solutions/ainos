import mongoose, { Schema, Document } from 'mongoose';

export interface IQuote extends Document {
  quoteNumber: string;
  customer: mongoose.Types.ObjectId;
  title: string;
  items: { product?: string; description: string; quantity: number; rate: number; amount: number }[];
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  total: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'converted';
  validUntil: Date;
  notes?: string;
  terms?: string;
  convertedToInvoice?: boolean;
  invoiceId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuoteSchema = new Schema({
  quoteNumber: { type: String, required: true, unique: true },
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  title: { type: String, required: true },
  items: [{
    product: { type: String },
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true },
  }],
  subtotal: { type: Number, required: true },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted'], default: 'draft' },
  validUntil: { type: Date, required: true },
  notes: String,
  terms: String,
  convertedToInvoice: { type: Boolean, default: false },
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: String, required: true, index: true },
}, { timestamps: true });

export default mongoose.models.Quote || mongoose.model<IQuote>('Quote', QuoteSchema);

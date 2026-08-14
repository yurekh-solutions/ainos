import mongoose, { Schema, Document } from 'mongoose';

export interface ISalesOrder extends Document {
  orderNumber: string;
  customer: mongoose.Types.ObjectId;
  items: { product?: string; description: string; quantity: number; rate: number; amount: number }[];
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  total: number;
  status: 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  orderDate: Date;
  expectedDelivery?: Date;
  shippingAddress?: string;
  notes?: string;
  invoiceId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

const SalesOrderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true },
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
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
  status: { type: String, enum: ['draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'draft' },
  paymentStatus: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
  orderDate: { type: Date, default: Date.now },
  expectedDelivery: Date,
  shippingAddress: String,
  notes: String,
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: String, required: true, index: true },
}, { timestamps: true });

export default mongoose.models.SalesOrder || mongoose.model<ISalesOrder>('SalesOrder', SalesOrderSchema);

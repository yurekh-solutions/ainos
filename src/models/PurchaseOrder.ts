import mongoose from 'mongoose';

export interface IPurchaseOrderItem {
  product: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface IPurchaseOrder {
  _id?: string;
  items: IPurchaseOrderItem[];
  supplier: string;
  status: 'draft' | 'sent' | 'received' | 'cancelled';
  totalCost: number;
  expectedDate?: Date;
  receivedDate?: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderItemSchema = new mongoose.Schema<IPurchaseOrderItem>({
  product: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitCost: { type: Number, required: true },
  total: { type: Number, required: true },
});

const PurchaseOrderSchema = new mongoose.Schema<IPurchaseOrder>(
  {
    items: [PurchaseOrderItemSchema],
    supplier: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'received', 'cancelled'],
      default: 'draft',
    },
    totalCost: { type: Number, default: 0 },
    expectedDate: Date,
    receivedDate: Date,
    notes: String,
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.PurchaseOrder || mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);

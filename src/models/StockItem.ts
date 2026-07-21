import mongoose from 'mongoose';

export interface IStockItem {
  _id?: string;
  product: string;
  sku?: string;
  quantity: number;
  reorderLevel: number;
  unitCost: number;
  warehouse: string;
  lastRestocked?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const StockItemSchema = new mongoose.Schema<IStockItem>(
  {
    product: { type: String, required: true },
    sku: String,
    quantity: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 10 },
    unitCost: { type: Number, default: 0 },
    warehouse: { type: String },
    lastRestocked: Date,
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.StockItem || mongoose.model<IStockItem>('StockItem', StockItemSchema);

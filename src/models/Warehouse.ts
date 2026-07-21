import mongoose from 'mongoose';

export interface IWarehouse {
  _id?: string;
  name: string;
  location?: string;
  capacity?: number;
  manager?: string;
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const WarehouseSchema = new mongoose.Schema<IWarehouse>(
  {
    name: { type: String, required: true },
    location: String,
    capacity: Number,
    manager: String,
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Warehouse || mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);

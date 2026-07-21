import mongoose from 'mongoose';

export interface IDeal {
  _id?: string;
  title: string;
  contact: string;
  value: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  probability: number;
  closeDate?: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const DealSchema = new mongoose.Schema<IDeal>(
  {
    title: { type: String, required: true },
    contact: { type: String, required: true },
    value: { type: Number, default: 0 },
    stage: {
      type: String,
      enum: ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
      default: 'lead',
    },
    probability: { type: Number, default: 0 },
    closeDate: Date,
    notes: String,
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Deal || mongoose.model<IDeal>('Deal', DealSchema);

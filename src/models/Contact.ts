import mongoose from 'mongoose';

export interface IContact {
  _id?: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  tags: string[];
  source: string;
  dealValue?: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  lastContacted?: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new mongoose.Schema<IContact>(
  {
    name: { type: String, required: true },
    email: String,
    phone: String,
    company: String,
    tags: [{ type: String }],
    source: { type: String, default: 'manual' },
    dealValue: Number,
    stage: {
      type: String,
      enum: ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
      default: 'lead',
    },
    lastContacted: Date,
    notes: String,
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);

import mongoose from 'mongoose';

export interface IComplianceTask {
  _id?: string;
  title: string;
  type: 'gst' | 'tds' | 'license' | 'filing' | 'other';
  dueDate: Date;
  frequency: 'monthly' | 'quarterly' | 'annual' | 'one-time';
  status: 'upcoming' | 'done' | 'overdue';
  documents: string[];
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ComplianceTaskSchema = new mongoose.Schema<IComplianceTask>(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['gst', 'tds', 'license', 'filing', 'other'],
      required: true,
    },
    dueDate: { type: Date, required: true },
    frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'annual', 'one-time'],
      default: 'one-time',
    },
    status: {
      type: String,
      enum: ['upcoming', 'done', 'overdue'],
      default: 'upcoming',
    },
    documents: [{ type: String }],
    notes: String,
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.ComplianceTask || mongoose.model<IComplianceTask>('ComplianceTask', ComplianceTaskSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  title: string;
  amount: number;
  category: string;
  date: Date;
  vendor?: string;
  description?: string;
  receiptUrl?: string;
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed';
  submittedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId;
  tags?: string[];
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  date: { type: Date, default: Date.now },
  vendor: String,
  description: String,
  receiptUrl: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'reimbursed'], default: 'pending' },
  submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  project: { type: Schema.Types.ObjectId, ref: 'Project' },
  tags: [String],
  companyId: { type: String, required: true, index: true },
}, { timestamps: true });

export default mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

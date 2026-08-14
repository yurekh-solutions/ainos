import mongoose, { Schema, Document } from 'mongoose';

export interface ITimesheet extends Document {
  employee: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId;
  task?: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  description?: string;
  billable: boolean;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

const TimesheetSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project' },
  task: String,
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  duration: { type: Number, required: true },
  description: String,
  billable: { type: Boolean, default: true },
  status: { type: String, enum: ['draft', 'submitted', 'approved', 'rejected'], default: 'draft' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  companyId: { type: String, required: true, index: true },
}, { timestamps: true });

export default mongoose.models.Timesheet || mongoose.model<ITimesheet>('Timesheet', TimesheetSchema);

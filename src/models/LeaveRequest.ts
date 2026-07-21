import mongoose from 'mongoose';

export interface ILeaveRequest {
  _id?: string;
  employee: string;
  type: 'sick' | 'casual' | 'earned' | 'maternity';
  startDate: Date;
  endDate: Date;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema = new mongoose.Schema<ILeaveRequest>(
  {
    employee: { type: String, required: true },
    type: {
      type: String,
      enum: ['sick', 'casual', 'earned', 'maternity'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: String,
    reviewedAt: Date,
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.LeaveRequest || mongoose.model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema);

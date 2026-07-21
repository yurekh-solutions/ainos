import mongoose from 'mongoose';

export interface IFollowUp {
  _id?: string;
  contact: string;
  type: 'email' | 'whatsapp' | 'call';
  scheduledDate: Date;
  status: 'pending' | 'done' | 'missed';
  message?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const FollowUpSchema = new mongoose.Schema<IFollowUp>(
  {
    contact: { type: String, required: true },
    type: {
      type: String,
      enum: ['email', 'whatsapp', 'call'],
      required: true,
    },
    scheduledDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'done', 'missed'],
      default: 'pending',
    },
    message: String,
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.FollowUp || mongoose.model<IFollowUp>('FollowUp', FollowUpSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  module?: string;
  referenceId?: string;
  read: boolean;
  link?: string;
  companyId: string;
  createdAt: Date;
}

const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  module: String,
  referenceId: String,
  read: { type: Boolean, default: false },
  link: String,
  companyId: { type: String, required: true, index: true },
}, { timestamps: true });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

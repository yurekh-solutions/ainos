import mongoose from 'mongoose';

export interface ISubscription {
  _id?: string;
  userId: string; // session.user.id || email
  plan: 'free' | 'starter' | 'growth';
  status: 'active' | 'expired' | 'cancelled';
  provider: 'razorpay' | 'manual';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  currentPeriodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new mongoose.Schema<ISubscription>(
  {
    userId: { type: String, required: true, unique: true },
    plan: { type: String, enum: ['free', 'starter', 'growth'], default: 'free' },
    status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
    provider: { type: String, enum: ['razorpay', 'manual'], default: 'razorpay' },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    currentPeriodEnd: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

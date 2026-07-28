import mongoose from 'mongoose';

export type PlanKey = 'starter' | 'growth' | 'scale';
export type SubscriptionStatus =
  | 'pending'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'halted'
  | 'cancelled';

export interface ISubscription {
  _id?: string;
  companyId: string;
  userId: string;
  plan: PlanKey;
  status: SubscriptionStatus;
  currentPeriodEnd?: Date;
  trialEndsAt?: Date;
  partnerCode?: string;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new mongoose.Schema<ISubscription>(
  {
    companyId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    plan: { type: String, enum: ['starter', 'growth', 'scale'], required: true },
    status: {
      type: String,
      enum: ['pending', 'trialing', 'active', 'past_due', 'halted', 'cancelled'],
      required: true,
      default: 'trialing',
    },
    currentPeriodEnd: Date,
    trialEndsAt: Date,
    partnerCode: String,
    cancelledAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.Subscription ||
  mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

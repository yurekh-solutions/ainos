import mongoose from 'mongoose';

/** Individual apps in the AINOS suite (Zoho-style per-app subscriptions). */
export type AppKey =
  | 'crm'
  | 'books'
  | 'hr'
  | 'inventory'
  | 'marketing'
  | 'desk'
  | 'projects'
  | 'ai_studio';

/**
 * 'one' = AINOS One bundle (all apps).
 * starter/growth/scale are legacy tiers kept so existing documents stay valid.
 */
export type PlanKey = 'one' | 'starter' | 'growth' | 'scale';

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
  /** Bundle or legacy tier. Empty when the company subscribes to individual apps. */
  plan?: PlanKey;
  /** Individually subscribed apps (ignored when plan is 'one'). */
  apps?: AppKey[];
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
    plan: {
      type: String,
      enum: ['one', 'starter', 'growth', 'scale'],
      required: false,
    },
    apps: {
      type: [String],
      enum: ['crm', 'books', 'hr', 'inventory', 'marketing', 'desk', 'projects', 'ai_studio'],
      default: undefined,
    },
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

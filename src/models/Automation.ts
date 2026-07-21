import mongoose, { Schema, Document } from 'mongoose';

export interface IAutomation extends Document {
  name: string;
  description: string;
  module: 'invoicing' | 'crm' | 'hr' | 'inventory' | 'marketing' | 'compliance' | 'support' | 'ai' | 'reports';
  trigger: {
    type: 'schedule' | 'event' | 'condition';
    event?: string;       // e.g., 'invoice.created', 'deal.won', 'stock.low'
    schedule?: string;    // e.g., 'daily', 'weekly', 'monthly', '0 9 * * *'
    condition?: Record<string, unknown>;
  };
  actions: Array<{
    type: 'email' | 'notification' | 'webhook' | 'update_status' | 'create_record' | 'ai_generate' | 'report';
    config: Record<string, unknown>;
  }>;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  successCount: number;
  errorCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const AutomationSchema = new Schema<IAutomation>(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    module: {
      type: String,
      required: true,
      enum: ['invoicing', 'crm', 'hr', 'inventory', 'marketing', 'compliance', 'support', 'ai', 'reports'],
    },
    trigger: {
      type: { type: String, required: true, enum: ['schedule', 'event', 'condition'] },
      event: { type: String },
      schedule: { type: String },
      condition: { type: Schema.Types.Mixed },
    },
    actions: [
      {
        type: {
          type: String,
          required: true,
          enum: ['email', 'notification', 'webhook', 'update_status', 'create_record', 'ai_generate', 'report'],
        },
        config: { type: Schema.Types.Mixed, required: true },
      },
    ],
    enabled: { type: Boolean, default: true },
    lastRun: { type: Date },
    nextRun: { type: Date },
    runCount: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

// Indexes for performance
AutomationSchema.index({ createdBy: 1, module: 1 });
AutomationSchema.index({ createdBy: 1, enabled: 1 });
AutomationSchema.index({ nextRun: 1, enabled: 1 });

export default mongoose.models.Automation || mongoose.model<IAutomation>('Automation', AutomationSchema);

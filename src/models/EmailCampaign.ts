import mongoose from 'mongoose';

export interface IEmailCampaign {
  _id?: string;
  name: string;
  subject: string;
  htmlContent?: string;
  recipients: string[];
  status: 'draft' | 'sending' | 'sent';
  sentAt?: Date;
  openRate?: number;
  clickRate?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailCampaignSchema = new mongoose.Schema<IEmailCampaign>(
  {
    name: { type: String, required: true },
    subject: { type: String, required: true },
    htmlContent: String,
    recipients: [{ type: String }],
    status: {
      type: String,
      enum: ['draft', 'sending', 'sent'],
      default: 'draft',
    },
    sentAt: Date,
    openRate: Number,
    clickRate: Number,
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.EmailCampaign || mongoose.model<IEmailCampaign>('EmailCampaign', EmailCampaignSchema);

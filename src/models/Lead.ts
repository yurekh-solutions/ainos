import mongoose, { Schema, Document } from 'mongoose';

export interface ILead extends Document {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  designation?: string;
  source: 'website' | 'referral' | 'social' | 'email' | 'cold_call' | 'event' | 'other';
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'converted' | 'lost';
  score?: number;
  estimatedValue?: number;
  owner?: mongoose.Types.ObjectId;
  notes?: string;
  tags?: string[];
  lastContacted?: Date;
  nextFollowUp?: Date;
  createdBy: mongoose.Types.ObjectId;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  company: String,
  designation: String,
  source: { type: String, enum: ['website', 'referral', 'social', 'email', 'cold_call', 'event', 'other'], default: 'website' },
  status: { type: String, enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'], default: 'new' },
  score: { type: Number, default: 0 },
  estimatedValue: Number,
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  notes: String,
  tags: [String],
  lastContacted: Date,
  nextFollowUp: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: String, required: true, index: true },
}, { timestamps: true });

export default mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);

import mongoose from 'mongoose';

export interface IHelpdeskTicket {
  _id?: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  assignee?: string;
  reporter?: string;
  category: 'technical' | 'billing' | 'access' | 'general';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const HelpdeskTicketSchema = new mongoose.Schema<IHelpdeskTicket>(
  {
    title: { type: String, required: true },
    description: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed'],
      default: 'open',
    },
    assignee: String,
    reporter: String,
    category: {
      type: String,
      enum: ['technical', 'billing', 'access', 'general'],
      default: 'general',
    },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.HelpdeskTicket || mongoose.model<IHelpdeskTicket>('HelpdeskTicket', HelpdeskTicketSchema);

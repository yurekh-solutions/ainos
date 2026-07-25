import mongoose from 'mongoose';

export interface IServiceRequest {
  _id?: string;
  serviceName: string;
  category: string;
  businessName?: string;
  requirements?: string;
  budgetRange?: string;
  timeline?: string;
  status: 'pending' | 'in-review' | 'in-progress' | 'delivered' | 'cancelled';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceRequestSchema = new mongoose.Schema<IServiceRequest>(
  {
    serviceName: { type: String, required: true },
    category: { type: String, required: true },
    businessName: String,
    requirements: String,
    budgetRange: String,
    timeline: String,
    status: {
      type: String,
      enum: ['pending', 'in-review', 'in-progress', 'delivered', 'cancelled'],
      default: 'pending',
    },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.ServiceRequest || mongoose.model<IServiceRequest>('ServiceRequest', ServiceRequestSchema);

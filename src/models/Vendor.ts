import mongoose, { Schema, Document } from 'mongoose';

export interface IVendor extends Document {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  category: 'supplier' | 'contractor' | 'service' | 'other';
  paymentTerms?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  status: 'active' | 'inactive';
  totalOrders?: number;
  totalSpent?: number;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  company: String,
  gstin: String,
  address: String,
  city: String,
  state: String,
  country: { type: String, default: 'India' },
  zipCode: String,
  category: { type: String, enum: ['supplier', 'contractor', 'service', 'other'], default: 'supplier' },
  paymentTerms: String,
  bankName: String,
  accountNumber: String,
  ifscCode: String,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  notes: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: String, required: true, index: true },
}, { timestamps: true });

export default mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', VendorSchema);

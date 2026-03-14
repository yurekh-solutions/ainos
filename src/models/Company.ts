import mongoose from 'mongoose';

export interface ICompany {
  _id?: string;
  name: string;
  logoUrl?: string;
  gstNumber?: string;
  taxId?: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new mongoose.Schema<ICompany>(
  {
    name: {
      type: String,
      required: true,
    },
    logoUrl: String,
    gstNumber: String,
    taxId: String,
    address: String,
    email: String,
    phone: String,
    website: String,
    bankName: String,
    bankAccountNumber: String,
    bankIfscCode: String,
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);

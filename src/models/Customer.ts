import mongoose from 'mongoose';

export interface ICustomer {
  _id?: string;
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  taxNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new mongoose.Schema<ICustomer>(
  {
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: String,
    phone: String,
    address: String,
    gstNumber: String,
    taxNumber: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);

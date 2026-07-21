import mongoose from 'mongoose';

export interface IEmployee {
  _id?: string;
  name: string;
  email?: string;
  phone?: string;
  department: string;
  position: string;
  joinDate: Date;
  salary: number;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
  };
  status: 'active' | 'inactive' | 'terminated';
  avatar?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new mongoose.Schema<IEmployee>(
  {
    name: { type: String, required: true },
    email: String,
    phone: String,
    department: { type: String, required: true },
    position: { type: String, required: true },
    joinDate: { type: Date, required: true },
    salary: { type: Number, default: 0 },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      ifscCode: String,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'terminated'],
      default: 'active',
    },
    avatar: String,
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);

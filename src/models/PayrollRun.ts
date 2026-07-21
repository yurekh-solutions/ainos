import mongoose from 'mongoose';

export interface IPayrollEmployee {
  employee: string;
  basicPay: number;
  allowances: number;
  deductions: number;
  netPay: number;
}

export interface IPayrollRun {
  _id?: string;
  period: string;
  employees: IPayrollEmployee[];
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  status: 'draft' | 'approved' | 'paid';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayrollEmployeeSchema = new mongoose.Schema<IPayrollEmployee>({
  employee: { type: String, required: true },
  basicPay: { type: Number, default: 0 },
  allowances: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  netPay: { type: Number, default: 0 },
});

const PayrollRunSchema = new mongoose.Schema<IPayrollRun>(
  {
    period: { type: String, required: true },
    employees: [PayrollEmployeeSchema],
    totalGrossPay: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    totalNetPay: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'approved', 'paid'],
      default: 'draft',
    },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.PayrollRun || mongoose.model<IPayrollRun>('PayrollRun', PayrollRunSchema);

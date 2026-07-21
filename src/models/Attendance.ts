import mongoose from 'mongoose';

export interface IAttendance {
  _id?: string;
  employee: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  status: 'present' | 'absent' | 'half-day' | 'leave';
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new mongoose.Schema<IAttendance>(
  {
    employee: { type: String, required: true },
    date: { type: Date, required: true },
    checkIn: Date,
    checkOut: Date,
    status: {
      type: String,
      enum: ['present', 'absent', 'half-day', 'leave'],
      default: 'present',
    },
    notes: String,
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
